// Main application setup for Slimbooks server
// Clean, modular server configuration

import express from 'express';
import cors from 'cors';
import multer from 'multer';
import https from 'https';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join, resolve } from 'path';

// Import configuration
import { serverConfig, validateConfig } from './config/index.js';

// Import database
import { initializeCompleteDatabase } from './models/index.js';

// Import middleware
import {
  createGeneralRateLimit,
  createSecurityHeaders,
  createCorsOptions,
  requestLogger,
  errorHandler,
  notFoundHandler,
  performanceMonitor,
  healthLogger,
  validateFileUpload
} from './middleware/index.js';

// Import routes
import routes from './routes/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Create and configure Express application
 */
export const createApp = async () => {
  // Validate configuration
  validateConfig();

  // Initialize database
  const includeSampleData = serverConfig.enableSampleData || serverConfig.isDevelopment;
  await initializeCompleteDatabase(includeSampleData);

  // Create Express app
  const app = express();

  // Security middleware
  app.use(createSecurityHeaders(serverConfig.corsOrigin));
  app.use(cors(createCorsOptions(serverConfig.corsOrigin)));
  app.use(createGeneralRateLimit());

  // Logging and monitoring middleware
  app.use(requestLogger);
  app.use(performanceMonitor());

  // Body parsing middleware with size limits
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ limit: '10mb', extended: true }));

  // Multer configuration for file uploads
  const projectRoot = join(__dirname, '..');
  const upload = multer({
    dest: resolve(projectRoot, serverConfig.uploadPath),
    limits: {
      fileSize: serverConfig.maxFileSize,
      files: 1,
      fieldSize: 1024 * 1024 // 1MB field size limit
    },
    fileFilter: (req, file, cb) => {
      const allowedMimes = [
        'application/octet-stream',
        'application/x-sqlite3',
        'application/vnd.sqlite3'
      ];

      if (allowedMimes.includes(file.mimetype) || file.originalname.endsWith('.db')) {
        cb(null, true);
      } else {
        cb(new Error('Invalid file type. Only database files are allowed.'), false);
      }
    }
  });

  // File upload endpoint (if needed)
  app.post('/api/upload', upload.single('file'), validateFileUpload(), (req, res) => {
    res.json({
      success: true,
      message: 'File uploaded successfully',
      file: {
        filename: req.file.filename,
        originalname: req.file.originalname,
        size: req.file.size
      }
    });
  });

  // Serve static files from dist directory (built frontend)
  const distPath = join(__dirname, '..', 'dist');
  app.use(express.static(distPath));

  // API routes
  app.use('/', routes);

  // Serve index.html for client-side routing (must be after API routes)
  app.get('*', (req, res, next) => {
    // Skip API routes
    if (req.path.startsWith('/api/')) {
      return next();
    }
    res.sendFile(join(distPath, 'index.html'));
  });

  // 404 handler for unmatched routes
  app.use(notFoundHandler);

  // Global error handler (must be last)
  app.use(errorHandler);

  return app;
};

/**
 * Start the server
 */
export const startServer = async () => {
  try {
    const app = await createApp();
    
    let server;
    
    if (serverConfig.enableHttps) {
      // HTTPS Server
      const projectRoot = join(__dirname, '..');
      const keyPath = resolve(projectRoot, serverConfig.sslKeyPath);
      const certPath = resolve(projectRoot, serverConfig.sslCertPath);
      
      // Check if SSL files exist
      if (!fs.existsSync(keyPath) || !fs.existsSync(certPath)) {
        console.error('❌ SSL certificate files not found. Please generate them first.');
        console.log('💡 Run: powershell -ExecutionPolicy Bypass -File ./scripts/generate-ssl-cert.ps1');
        process.exit(1);
      }
      
      const httpsOptions = {
        key: fs.readFileSync(keyPath),
        cert: fs.readFileSync(certPath)
      };
      
      server = https.createServer(httpsOptions, app);
      server.listen(serverConfig.port, serverConfig.host, () => {
        console.log(`🚀 Slimbooks server running on https://${serverConfig.host}:${serverConfig.port}`);
        console.log(`🔒 HTTPS enabled with self-signed certificate`);
        console.log(`📊 Environment: ${serverConfig.nodeEnv} | CORS: ${serverConfig.corsOrigin} | Rate limit: ${serverConfig.rateLimiting.maxRequests}/${serverConfig.rateLimiting.windowMs / 1000}s`);

        const features = [];
        if (serverConfig.enableDebugEndpoints) features.push('Debug');
        if (serverConfig.enableSampleData || serverConfig.isDevelopment) features.push('Sample data');
        if (features.length > 0) {
          console.log(`🔧 Features: ${features.join(', ')}`);
        }
      });
    } else {
      // HTTP Server (default)
      server = app.listen(serverConfig.port, serverConfig.host, () => {
        console.log(`🚀 Slimbooks server running on http://${serverConfig.host}:${serverConfig.port}`);
        console.log(`📊 Environment: ${serverConfig.nodeEnv} | CORS: ${serverConfig.corsOrigin} | Rate limit: ${serverConfig.rateLimiting.maxRequests}/${serverConfig.rateLimiting.windowMs / 1000}s`);

        const features = [];
        if (serverConfig.enableDebugEndpoints) features.push('Debug');
        if (serverConfig.enableSampleData || serverConfig.isDevelopment) features.push('Sample data');
        if (features.length > 0) {
          console.log(`🔧 Features: ${features.join(', ')}`);
        }
      });
    }

    // Initialize health logging
    healthLogger();

    // Graceful shutdown handling
    const { gracefulShutdown } = await import('./middleware/index.js');
    const { db } = await import('./models/index.js');
    gracefulShutdown(server, db);

    return server;
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

export default { createApp, startServer };
