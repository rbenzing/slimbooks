// Main application setup for Slimbooks server
// Clean, modular server configuration

import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { fileURLToPath } from 'url';
import { dirname, join, resolve } from 'path';

// Import configuration
import { serverConfig, validateConfig } from './config/index.js';

// Import database
import { initializeCompleteDatabase } from './models/index.js';
import { getDatabasePath } from './config/database.js';

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

  // Debug endpoint (development only)
  if (serverConfig.enableDebugEndpoints && serverConfig.isDevelopment) {
    app.get('/api/debug/data', async (req, res) => {
      try {
        const { db } = await import('./models/index.js');
        
        const clients = db.prepare('SELECT * FROM clients ORDER BY created_at DESC LIMIT 5').all();
        const invoices = db.prepare('SELECT * FROM invoices ORDER BY created_at DESC LIMIT 5').all();
        const expenses = db.prepare('SELECT * FROM expenses ORDER BY created_at DESC LIMIT 5').all();
        const templates = db.prepare('SELECT * FROM templates ORDER BY created_at DESC LIMIT 5').all();

        res.json({
          success: true,
          data: {
            clients: {
              count: db.prepare('SELECT COUNT(*) as count FROM clients').get().count,
              sample: clients
            },
            invoices: {
              count: db.prepare('SELECT COUNT(*) as count FROM invoices').get().count,
              sample: invoices
            },
            expenses: {
              count: db.prepare('SELECT COUNT(*) as count FROM expenses').get().count,
              sample: expenses
            },
            templates: {
              count: db.prepare('SELECT COUNT(*) as count FROM templates').get().count,
              sample: templates
            }
          }
        });
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });
  }

  // API routes
  app.use('/', routes);

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
    
    const server = app.listen(serverConfig.port, serverConfig.host, () => {
      console.log(`🚀 Slimbooks server running on http://${serverConfig.host}:${serverConfig.port}`);
      console.log(`📊 Environment: ${serverConfig.nodeEnv} | CORS: ${serverConfig.corsOrigin} | Rate limit: ${serverConfig.rateLimiting.maxRequests}/${serverConfig.rateLimiting.windowMs / 1000}s`);

      const features = [];
      if (serverConfig.enableDebugEndpoints) features.push('Debug');
      if (serverConfig.enableSampleData || serverConfig.isDevelopment) features.push('Sample data');
      if (features.length > 0) {
        console.log(`🔧 Features: ${features.join(', ')}`);
      }
    });

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
