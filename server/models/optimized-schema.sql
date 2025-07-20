-- Optimized Database Schema for Slimbooks
-- Production-ready with proper field types, constraints, and indexes

-- =====================================================
-- USERS TABLE - Authentication and user management
-- =====================================================
CREATE TABLE IF NOT EXISTS users_optimized (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(100) NOT NULL CHECK (length(name) >= 2),
    email VARCHAR(255) NOT NULL UNIQUE CHECK (email LIKE '%_@_%.__%'),
    username VARCHAR(50) NOT NULL UNIQUE CHECK (length(username) >= 3 AND username GLOB '[A-Za-z0-9_]*'),
    password_hash CHAR(60), -- bcrypt hash is always 60 chars
    role VARCHAR(20) NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user', 'viewer')),
    email_verified BOOLEAN NOT NULL DEFAULT 0,
    google_id VARCHAR(50) UNIQUE,
    last_login DATETIME,
    failed_login_attempts INTEGER NOT NULL DEFAULT 0 CHECK (failed_login_attempts >= 0),
    account_locked_until DATETIME,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- CLIENTS TABLE - Customer information
-- =====================================================
CREATE TABLE IF NOT EXISTS clients_optimized (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(100) NOT NULL CHECK (length(trim(name)) >= 2),
    first_name VARCHAR(50) CHECK (first_name IS NULL OR length(trim(first_name)) >= 1),
    last_name VARCHAR(50) CHECK (last_name IS NULL OR length(trim(last_name)) >= 1),
    email VARCHAR(255) NOT NULL CHECK (email LIKE '%_@_%.__%'),
    phone VARCHAR(20) CHECK (phone IS NULL OR phone GLOB '[0-9+\-() ]*'),
    company VARCHAR(100),
    address VARCHAR(255),
    city VARCHAR(50),
    state VARCHAR(50),
    zipCode VARCHAR(10) CHECK (zipCode IS NULL OR length(trim(zipCode)) >= 3),
    country CHAR(2) DEFAULT 'US' CHECK (length(country) = 2), -- ISO 3166-1 alpha-2
    stripe_customer_id VARCHAR(50),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Ensure either name is provided OR both first_name and last_name
    CHECK (
        (name IS NOT NULL AND length(trim(name)) >= 2) OR 
        (first_name IS NOT NULL AND last_name IS NOT NULL AND 
         length(trim(first_name)) >= 1 AND length(trim(last_name)) >= 1)
    )
);

-- =====================================================
-- INVOICES TABLE - Invoice management
-- =====================================================
CREATE TABLE IF NOT EXISTS invoices_optimized (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    invoice_number VARCHAR(50) NOT NULL UNIQUE CHECK (length(trim(invoice_number)) >= 3),
    client_id INTEGER NOT NULL,
    template_id INTEGER,
    amount DECIMAL(12,2) NOT NULL CHECK (amount >= 0),
    tax_amount DECIMAL(12,2) NOT NULL DEFAULT 0 CHECK (tax_amount >= 0),
    total_amount DECIMAL(12,2) NOT NULL CHECK (total_amount >= 0),
    status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled', 'refunded')),
    due_date DATE NOT NULL,
    issue_date DATE NOT NULL,
    description TEXT, -- Can be longer, keep as TEXT
    items JSON, -- Store structured data as JSON
    notes TEXT,
    payment_terms VARCHAR(100),
    stripe_invoice_id VARCHAR(50),
    stripe_payment_intent_id VARCHAR(50),
    type VARCHAR(20) NOT NULL DEFAULT 'one-time' CHECK (type IN ('one-time', 'recurring', 'subscription')),
    client_name VARCHAR(100), -- Denormalized for performance
    client_email VARCHAR(255),
    client_phone VARCHAR(20),
    client_address VARCHAR(255),
    line_items JSON, -- Store structured data as JSON
    tax_rate_id VARCHAR(50),
    shipping_amount DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (shipping_amount >= 0),
    shipping_rate_id VARCHAR(50),
    email_status VARCHAR(20) NOT NULL DEFAULT 'not_sent' CHECK (email_status IN ('not_sent', 'sent', 'failed', 'bounced')),
    email_sent_at DATETIME,
    email_error VARCHAR(500),
    last_email_attempt DATETIME,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (client_id) REFERENCES clients_optimized (id) ON DELETE RESTRICT,
    FOREIGN KEY (template_id) REFERENCES templates_optimized (id) ON DELETE SET NULL,
    
    -- Business logic constraints
    CHECK (due_date >= issue_date),
    CHECK (total_amount = amount + tax_amount + shipping_amount)
);

-- =====================================================
-- TEMPLATES TABLE - Invoice templates
-- =====================================================
CREATE TABLE IF NOT EXISTS templates_optimized (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(100) NOT NULL CHECK (length(trim(name)) >= 2),
    client_id INTEGER NOT NULL,
    amount DECIMAL(12,2) NOT NULL CHECK (amount >= 0),
    description TEXT,
    frequency VARCHAR(20) NOT NULL CHECK (frequency IN ('weekly', 'monthly', 'quarterly', 'yearly', 'custom')),
    payment_terms VARCHAR(100) NOT NULL,
    next_invoice_date DATE NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT 1,
    line_items JSON,
    tax_amount DECIMAL(12,2) NOT NULL DEFAULT 0 CHECK (tax_amount >= 0),
    tax_rate_id VARCHAR(50),
    shipping_amount DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (shipping_amount >= 0),
    shipping_rate_id VARCHAR(50),
    notes TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (client_id) REFERENCES clients_optimized (id) ON DELETE CASCADE
);

-- =====================================================
-- EXPENSES TABLE - Expense tracking
-- =====================================================
CREATE TABLE IF NOT EXISTS expenses_optimized (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date DATE NOT NULL,
    merchant VARCHAR(100) NOT NULL DEFAULT 'Unknown Merchant' CHECK (length(trim(merchant)) >= 1),
    category VARCHAR(50) NOT NULL CHECK (length(trim(category)) >= 2),
    amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
    description TEXT,
    receipt_url VARCHAR(500) CHECK (receipt_url IS NULL OR receipt_url LIKE 'http%'),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'reimbursed')),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- REPORTS TABLE - Report storage
-- =====================================================
CREATE TABLE IF NOT EXISTS reports_optimized (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(100) NOT NULL CHECK (length(trim(name)) >= 2),
    type VARCHAR(50) NOT NULL CHECK (type IN ('income', 'expense', 'profit_loss', 'tax', 'custom')),
    date_range_start DATE NOT NULL,
    date_range_end DATE NOT NULL,
    data JSON, -- Store report data as JSON
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CHECK (date_range_end >= date_range_start)
);

-- =====================================================
-- COUNTERS TABLE - Auto-increment counters
-- =====================================================
CREATE TABLE IF NOT EXISTS counters_optimized (
    name VARCHAR(50) PRIMARY KEY CHECK (length(trim(name)) >= 2),
    value INTEGER NOT NULL DEFAULT 0 CHECK (value >= 0)
);

-- =====================================================
-- SETTINGS TABLE - Application settings
-- =====================================================
CREATE TABLE IF NOT EXISTS settings_optimized (
    key VARCHAR(100) PRIMARY KEY CHECK (length(trim(key)) >= 2),
    value TEXT NOT NULL, -- Settings can be complex, keep as TEXT
    category VARCHAR(50) NOT NULL DEFAULT 'general' CHECK (length(trim(category)) >= 2)
);

-- =====================================================
-- PROJECT_SETTINGS TABLE - Environment overrides
-- =====================================================
CREATE TABLE IF NOT EXISTS project_settings_optimized (
    key VARCHAR(100) PRIMARY KEY CHECK (length(trim(key)) >= 2),
    value TEXT NOT NULL,
    enabled BOOLEAN DEFAULT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- PERFORMANCE INDEXES
-- =====================================================

-- Users table indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users_optimized(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users_optimized(username);
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users_optimized(google_id);
CREATE INDEX IF NOT EXISTS idx_users_last_login ON users_optimized(last_login);

-- Clients table indexes
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients_optimized(email);
CREATE INDEX IF NOT EXISTS idx_clients_name ON clients_optimized(name);
CREATE INDEX IF NOT EXISTS idx_clients_first_last ON clients_optimized(first_name, last_name);
CREATE INDEX IF NOT EXISTS idx_clients_company ON clients_optimized(company);
CREATE INDEX IF NOT EXISTS idx_clients_stripe_id ON clients_optimized(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_clients_created_at ON clients_optimized(created_at);

-- Invoices table indexes
CREATE INDEX IF NOT EXISTS idx_invoices_number ON invoices_optimized(invoice_number);
CREATE INDEX IF NOT EXISTS idx_invoices_client_id ON invoices_optimized(client_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices_optimized(status);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices_optimized(due_date);
CREATE INDEX IF NOT EXISTS idx_invoices_issue_date ON invoices_optimized(issue_date);
CREATE INDEX IF NOT EXISTS idx_invoices_stripe_id ON invoices_optimized(stripe_invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoices_client_status ON invoices_optimized(client_id, status);
CREATE INDEX IF NOT EXISTS idx_invoices_date_range ON invoices_optimized(issue_date, due_date);

-- Templates table indexes
CREATE INDEX IF NOT EXISTS idx_templates_client_id ON templates_optimized(client_id);
CREATE INDEX IF NOT EXISTS idx_templates_active ON templates_optimized(is_active);
CREATE INDEX IF NOT EXISTS idx_templates_next_date ON templates_optimized(next_invoice_date);
CREATE INDEX IF NOT EXISTS idx_templates_frequency ON templates_optimized(frequency);

-- Expenses table indexes
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses_optimized(date);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses_optimized(category);
CREATE INDEX IF NOT EXISTS idx_expenses_merchant ON expenses_optimized(merchant);
CREATE INDEX IF NOT EXISTS idx_expenses_status ON expenses_optimized(status);
CREATE INDEX IF NOT EXISTS idx_expenses_amount ON expenses_optimized(amount);
CREATE INDEX IF NOT EXISTS idx_expenses_date_category ON expenses_optimized(date, category);

-- Reports table indexes
CREATE INDEX IF NOT EXISTS idx_reports_type ON reports_optimized(type);
CREATE INDEX IF NOT EXISTS idx_reports_date_range ON reports_optimized(date_range_start, date_range_end);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports_optimized(created_at);

-- =====================================================
-- TRIGGERS FOR AUTOMATIC TIMESTAMP UPDATES
-- =====================================================

-- Users table trigger
CREATE TRIGGER IF NOT EXISTS update_users_timestamp
    AFTER UPDATE ON users_optimized
    FOR EACH ROW
    BEGIN
        UPDATE users_optimized SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

-- Clients table trigger
CREATE TRIGGER IF NOT EXISTS update_clients_timestamp
    AFTER UPDATE ON clients_optimized
    FOR EACH ROW
    BEGIN
        UPDATE clients_optimized SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

-- Invoices table trigger
CREATE TRIGGER IF NOT EXISTS update_invoices_timestamp
    AFTER UPDATE ON invoices_optimized
    FOR EACH ROW
    BEGIN
        UPDATE invoices_optimized SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

-- Templates table trigger
CREATE TRIGGER IF NOT EXISTS update_templates_timestamp
    AFTER UPDATE ON templates_optimized
    FOR EACH ROW
    BEGIN
        UPDATE templates_optimized SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

-- Expenses table trigger
CREATE TRIGGER IF NOT EXISTS update_expenses_timestamp
    AFTER UPDATE ON expenses_optimized
    FOR EACH ROW
    BEGIN
        UPDATE expenses_optimized SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

-- Project settings table trigger
CREATE TRIGGER IF NOT EXISTS update_project_settings_timestamp
    AFTER UPDATE ON project_settings_optimized
    FOR EACH ROW
    BEGIN
        UPDATE project_settings_optimized SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;
