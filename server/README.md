# Slimbooks Server Architecture

This document describes the refactored, modular architecture of the Slimbooks Node.js API server.

## Overview

The server has been completely refactored from a single monolithic `index.js` file into a clean, maintainable, modular architecture following Node.js best practices.

## Directory Structure

```
server/
├── index.js                 # Main entry point (minimal)
├── app.js                   # Application setup and configuration
├── config/                  # Configuration management
│   ├── index.js            # Main configuration exports
│   └── database.js         # Database configuration
├── controllers/             # Business logic controllers
│   ├── index.js            # Controller exports
│   ├── authController.js   # Authentication logic
│   ├── userController.js   # User management
│   ├── clientController.js # Client management
│   ├── invoiceController.js# Invoice management
│   └── expenseController.js# Expense management
├── middleware/              # Express middleware
│   ├── index.js            # Middleware exports
│   ├── auth.js             # Authentication middleware
│   ├── validation.js       # Input validation
│   ├── errorHandler.js     # Error handling
│   ├── logging.js          # Request logging
│   └── security.js         # Security middleware
├── models/                  # Database models and schema
│   ├── index.js            # Database instance and initialization
│   ├── schema.js           # Table definitions
│   ├── migrations.js       # Database migrations
│   └── seedData.js         # Sample data initialization
├── routes/                  # API route definitions
│   ├── index.js            # Route setup and exports
│   ├── authRoutes.js       # Authentication endpoints
│   ├── userRoutes.js       # User management endpoints
│   ├── clientRoutes.js     # Client management endpoints
│   ├── invoiceRoutes.js    # Invoice management endpoints
│   ├── expenseRoutes.js    # Expense management endpoints
│   └── healthRoutes.js     # Health check endpoints
└── utils/                   # Utility functions
    ├── index.js            # Utility exports
    └── helpers.js          # Common helper functions
```

## Key Features

### 🏗️ Modular Architecture
- **Separation of Concerns**: Each module has a single responsibility
- **Clean Dependencies**: Clear import/export structure
- **Maintainable**: Easy to understand, modify, and extend

### 🔒 Security
- **Rate Limiting**: Configurable rate limits for different endpoints
- **Input Validation**: Comprehensive validation using express-validator
- **Security Headers**: CORS, helmet-style security headers
- **Authentication**: JWT-based authentication with role-based access control

### 📊 Database Management
- **Migrations**: Automatic database schema updates
- **Seed Data**: Development sample data initialization
- **Connection Management**: Proper database connection handling
- **Error Handling**: Robust database error handling

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

### Health Checks (`/health`)
- `GET /` - Basic health check
- `GET /detailed` - Detailed system information
- `GET /ready` - Readiness probe
- `GET /live` - Liveness probe

## Middleware Stack

1. **Security Middleware**: CORS, security headers, rate limiting
2. **Logging Middleware**: Request logging and performance monitoring
3. **Body Parsing**: JSON and URL-encoded body parsing
4. **Authentication**: JWT verification (where required)
5. **Validation**: Input validation and sanitization
6. **Route Handlers**: Business logic controllers
7. **Error Handling**: Centralized error handling

## Database

The application uses SQLite with the following features:

- **WAL Mode**: Write-Ahead Logging for better concurrency
- **Foreign Keys**: Enabled for data integrity
- **Migrations**: Automatic schema updates
- **Seed Data**: Sample data for development

### Tables
- `users` - User accounts and authentication
- `clients` - Customer information
- `invoices` - Invoice records
- `expenses` - Expense tracking
- `templates` - Invoice templates
- `reports` - Generated reports
- `settings` - Application settings
- `counters` - ID counters for entities

## Error Handling

The server includes comprehensive error handling:

- **Custom Error Classes**: Specific error types for different scenarios
- **Centralized Handler**: Single error handling middleware
- **Logging**: Detailed error logging with context
- **User-Friendly Messages**: Clean error responses for clients

## Development

### Starting the Server
```bash
npm run dev
```

### Environment Variables

The server uses environment variables for configuration. Copy `.env.example` to `.env` and update the values:

```bash
cp .env.example .env
```

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
- `DB_PATH` - SQLite database file path
- `DB_BACKUP_PATH` - Database backup directory

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
- `ENABLE_DEBUG_ENDPOINTS` - Enable debug endpoints
- `ENABLE_SAMPLE_DATA` - Load sample data on startup

### Adding New Features

1. **Routes**: Add new route files in `server/routes/`
2. **Controllers**: Add business logic in `server/controllers/`
3. **Middleware**: Add reusable middleware in `server/middleware/`
4. **Models**: Add database operations in `server/models/`

## Migration from Legacy

The refactoring maintains 100% API compatibility with the previous monolithic structure while providing:

- ✅ Better code organization
- ✅ Improved maintainability
- ✅ Enhanced error handling
- ✅ Better security practices
- ✅ Comprehensive logging
- ✅ Modular architecture

All existing endpoints continue to work exactly as before, ensuring no breaking changes for the frontend application.
