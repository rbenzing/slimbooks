# Slimbooks Server Architecture

This document describes the refactored, modular architecture of the Slimbooks Node.js API server with full TypeScript support.

## Overview

The server has been completely refactored from a single monolithic `index.js` file into a clean, maintainable, modular architecture following Node.js best practices.

## Directory Structure

```
server/
├── index.ts                 # Main entry point (minimal)
├── app.ts                   # Application setup and configuration
├── tsconfig.json           # TypeScript configuration
├── config/                  # Configuration management
│   ├── index.ts            # Main configuration exports
│   └── database.ts         # Database configuration
├── controllers/             # Business logic controllers
│   ├── index.ts            # Controller exports
│   ├── authController.ts   # Authentication logic
│   ├── userController.ts   # User management
│   ├── clientController.ts # Client management
│   ├── invoiceController.ts# Invoice management
│   ├── expenseController.ts# Expense management
│   ├── paymentController.ts# Payment management
│   ├── settingsController.ts# Settings management
│   └── cronController.ts   # Cron job management
├── core/                    # Core services
│   ├── DatabaseService.ts  # Abstract database service layer
│   └── Settings.ts         # Settings service
├── middleware/              # Express middleware
│   ├── index.ts            # Middleware exports and error classes
│   ├── auth.ts             # Authentication middleware
│   ├── validation.ts       # Input validation
│   └── security.ts         # Security middleware
├── database/                # Database layer (centralized)
│   ├── index.ts            # Main database module exports
│   ├── SQLiteDatabase.ts   # SQLite implementation with abstract interface
│   ├── config/             # Database configuration
│   │   └── sqlite.config.ts # SQLite-specific configuration
│   ├── schemas/            # Database schema definitions
│   │   └── tables.schema.ts # TypeScript table schema definitions
│   └── seeds/              # Database seed data
│       └── initial.seed.ts # Initial application data
├── models/                  # Legacy database files (deprecated)
│   ├── index.ts            # Legacy database initialization
│   ├── schema.js           # Legacy JavaScript schema
│   └── seedData.js         # Legacy JavaScript seed data
├── routes/                  # API route definitions
│   ├── authRoutes.js       # Authentication endpoints
│   ├── userRoutes.js       # User management endpoints
│   ├── clientRoutes.js     # Client management endpoints
│   ├── invoiceRoutes.js    # Invoice management endpoints
│   ├── expenseRoutes.js    # Expense management endpoints
│   ├── paymentRoutes.js    # Payment management endpoints
│   ├── settingsRoutes.js   # Settings management endpoints
│   └── healthRoutes.js     # Health check endpoints
├── services/                # Domain services
│   ├── AuthService.ts      # Authentication service
│   ├── UserService.ts      # User management service
│   ├── ClientService.ts    # Client management service
│   ├── InvoiceService.ts   # Invoice management service
│   ├── ExpenseService.ts   # Expense management service
│   ├── PaymentService.ts   # Payment management service
│   ├── PdfService.ts       # PDF generation service
│   └── DatabaseHealthService.ts # Database health monitoring
└── types/                   # Server-specific TypeScript types
    ├── index.ts            # Consolidated type exports  
    ├── api.types.ts        # API request/response types
    ├── database.types.ts   # Database interfaces and types
    └── invoice.types.ts    # Invoice-specific server types
```

## Key Features

### 🏗️ Modular Architecture
- **Separation of Concerns**: Each module has a single responsibility
- **Clean Dependencies**: Clear import/export structure
- **Maintainable**: Easy to understand, modify, and extend

### 📝 TypeScript Implementation
- **Full Type Safety**: Complete TypeScript coverage with strict type checking
- **Type Definitions**: Comprehensive types for all API requests/responses
- **Database Types**: Strongly typed database models and query results
- **Interface Conformance**: Server types align with UI types for consistency
- **Strict Configuration**: exactOptionalPropertyTypes enabled for robust type checking
- **Path Aliases**: Clean import paths using TypeScript path mapping

### 🔒 Security
- **Rate Limiting**: Configurable rate limits for different endpoints
- **Input Validation**: Comprehensive validation using express-validator
- **Security Headers**: CORS, helmet-style security headers
- **Authentication**: JWT-based authentication with role-based access control

### 📊 Database Management
- **Abstract Interface**: Database-agnostic interface with SQLite implementation
- **Modular Architecture**: Centralized database layer with clear separation of concerns
- **TypeScript Schema**: Type-safe schema definitions with comprehensive validation
- **Organized Structure**: Separate configuration, schemas, and seed data modules
- **Connection Management**: Optimized SQLite connection with WAL mode and pragmas
- **Error Handling**: Robust error handling with transaction support

### 🛠️ Developer Experience
- **Error Handling**: Centralized error handling with detailed logging
- **Logging**: Request logging, performance monitoring, and health checks
- **Configuration**: Environment-based configuration management
- **Validation**: Input validation with detailed error messages

## Configuration

The server uses a centralized configuration system located in `server/config/`:

- **Environment Variables**: Loaded from `.env` file
- **Database Config**: SQLite configuration and connection settings
- **Security Config**: Authentication, rate limiting, and security settings
- **Application Config**: General application settings

## API Structure

### Authentication Routes (`/api/auth`)
- `POST /login` - User login
- `POST /register` - User registration
- `POST /forgot-password` - Password reset request
- `POST /reset-password` - Password reset with token
- `GET /profile` - Get current user profile
- `PUT /profile` - Update user profile

### User Management (`/api/users`)
- `GET /` - Get all users (admin only)
- `GET /:id` - Get user by ID
- `POST /` - Create new user (admin only)
- `PUT /:id` - Update user
- `DELETE /:id` - Delete user

### Client Management (`/api/clients`)
- `GET /` - Get all clients
- `GET /:id` - Get client by ID
- `POST /` - Create new client
- `PUT /:id` - Update client
- `DELETE /:id` - Delete client

### Invoice Management (`/api/invoices`)
- `GET /` - Get all invoices
- `GET /:id` - Get invoice by ID
- `POST /` - Create new invoice
- `PUT /:id` - Update invoice
- `DELETE /:id` - Delete invoice

### Expense Management (`/api/expenses`)
- `GET /` - Get all expenses
- `GET /:id` - Get expense by ID
- `POST /` - Create new expense
- `PUT /:id` - Update expense
- `DELETE /:id` - Delete expense

### Health Checks (`/api/health`)
- `GET /` - Basic health check
- `GET /detailed` - Detailed system information
- `GET /ready` - Readiness probe
- `GET /live` - Liveness probe

### Database Management (`/api/db`) - Admin Only
- `GET /health` - Database health status and statistics
- `GET /info` - Database schema information (read-only)
- `GET /export` - Database export (DISABLED for security)
- `POST /import` - Database import (DISABLED for security)

## Middleware Stack

1. **Security Middleware**: CORS, security headers, rate limiting
2. **Logging Middleware**: Request logging and performance monitoring
3. **Body Parsing**: JSON and URL-encoded body parsing
4. **Authentication**: JWT verification (where required)
5. **Validation**: Input validation and sanitization
6. **Route Handlers**: Business logic controllers
7. **Error Handling**: Centralized error handling

## Database Architecture

The application uses a centralized, modular database architecture with SQLite implementation:

### Architecture Features
- **Abstract Interface**: `IDatabase` interface for database-agnostic operations
- **SQLite Implementation**: Optimized SQLite adapter with WAL mode and performance pragmas
- **Type Safety**: Comprehensive TypeScript types for all database operations
- **Modular Design**: Separate modules for configuration, schemas, and seed data
- **Service Layer**: `DatabaseService` class providing common database operations

### Database Features
- **WAL Mode**: Write-Ahead Logging for better concurrency
- **Foreign Keys**: Enabled for referential integrity
- **Transaction Support**: Full transaction support with rollback capability
- **Connection Pooling**: Optimized connection management with health monitoring
- **Performance Optimization**: Strategic indexes and SQLite pragma settings
- **Automated Seeding**: TypeScript-based seed data management

### Database Schema

#### Core Tables
- `users` - User accounts and authentication with role-based access
- `clients` - Customer information with validation constraints
- `invoices` - Invoice records with status tracking and email management
- `expenses` - Expense tracking with categorization and approval workflow
- `templates` - Invoice templates for recurring billing
- `reports` - Generated reports with date range filtering
- `settings` - Application settings with categorization
- `counters` - ID counters for entities
- `project_settings` - Environment-specific configuration overrides

#### Key Schema Features
- **Field Validation**: Length limits, format validation, and data type constraints
- **Referential Integrity**: Foreign key relationships with appropriate cascade rules
- **Performance Optimization**: Strategic indexes on frequently queried fields
- **Data Consistency**: Automatic timestamp updates via triggers
- **Security**: Input validation at database level to prevent injection attacks

## Error Handling

The server includes comprehensive error handling:

- **Custom Error Classes**: Specific error types for different scenarios
- **Centralized Handler**: Single error handling middleware
- **Logging**: Detailed error logging with context
- **User-Friendly Messages**: Clean error responses for clients

## Development

### Building and Running the Server

The server is written in TypeScript and needs to be compiled before running:

```bash
# Type check without emitting files
npx tsc --noEmit

# Build the TypeScript code
npm run build

# Start the server in development mode (with auto-restart)
npm run server

# Start both UI and server concurrently
npm run start
```

### TypeScript Configuration

The server uses a strict TypeScript configuration (`tsconfig.json`) with the following key settings:

- **Target**: ES2022 with modern JavaScript features
- **Module**: ESNext with ES module interop
- **Strict Mode**: Full strict type checking enabled
- **exactOptionalPropertyTypes**: Strict optional property handling
- **Path Mapping**: Clean imports with `@/server/*` aliases
- **Source Maps**: Full debugging support with declaration maps

The server uses its own type definitions in `server/types/` while maintaining compatibility with the centralized frontend type system for shared interfaces.

### Environment Variables

The server uses environment variables for configuration from the project root `.env` file. The server automatically loads the `.env` file from the project root directory (one level up from the server folder).

Key environment variables:

#### Server Configuration
- `PORT` - Server port (default: 3002)
- `HOST` - Server host (default: 0.0.0.0)
- `NODE_ENV` - Environment (development/production)
- `CORS_ORIGIN` - Frontend URL for CORS
- `CORS_CREDENTIALS` - Enable CORS credentials

#### Security & Authentication
- `JWT_SECRET` - JWT signing secret (CHANGE IN PRODUCTION!)
- `JWT_REFRESH_SECRET` - JWT refresh token secret
- `SESSION_SECRET` - Session secret
- `BCRYPT_ROUNDS` - Password hashing rounds
- `MAX_FAILED_LOGIN_ATTEMPTS` - Account lockout threshold
- `REQUIRE_EMAIL_VERIFICATION` - Require email verification

#### Database
- `DB_PATH` - SQLite database file path (relative to project root, default: data/slimbooks.db)
- `DB_BACKUP_PATH` - Database backup directory (relative to project root, default: data/backups)

#### Rate Limiting
- `RATE_LIMIT_WINDOW_MS` - Rate limit window
- `RATE_LIMIT_MAX_REQUESTS` - Max requests per window
- `LOGIN_RATE_LIMIT_MAX_ATTEMPTS` - Max login attempts

#### Email (SMTP)
- `SMTP_HOST` - SMTP server host
- `SMTP_PORT` - SMTP server port
- `SMTP_USER` - SMTP username
- `SMTP_PASS` - SMTP password
- `EMAIL_FROM` - Sender email address

#### Stripe (Payments)
- `STRIPE_SECRET_KEY` - Stripe secret key
- `STRIPE_PUBLISHABLE_KEY` - Stripe publishable key
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook secret

#### Google OAuth
- `GOOGLE_CLIENT_ID` - Google OAuth client ID
- `GOOGLE_CLIENT_SECRET` - Google OAuth client secret

#### Development
- `ENABLE_SAMPLE_DATA` - Load sample data on startup

### Adding New Features

1. **Routes**: Add new route files in `server/routes/`
2. **Controllers**: Add business logic in `server/controllers/`
3. **Middleware**: Add reusable middleware in `server/middleware/`
4. **Models**: Add database operations in `server/models/`