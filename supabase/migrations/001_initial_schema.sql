-- Finance Tracker Database Schema
-- Run this SQL in your Supabase SQL Editor (Dashboard > SQL Editor)

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- ASSET CATEGORIES TABLE
-- ============================================
-- Types: investment, cash, property, liability
CREATE TABLE IF NOT EXISTS asset_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('investment', 'cash', 'property', 'liability')),
    icon VARCHAR(50),
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- ASSET SOURCES TABLE
-- ============================================
-- e.g., moomoo, endowus, ibkr, DBS, OCBC, etc.
CREATE TABLE IF NOT EXISTS asset_sources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    category_id UUID NOT NULL REFERENCES asset_categories(id) ON DELETE CASCADE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- ASSETS TABLE
-- ============================================
-- Individual assets with their current values
CREATE TABLE IF NOT EXISTS assets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    source_id UUID NOT NULL REFERENCES asset_sources(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES asset_categories(id) ON DELETE CASCADE,
    current_value DECIMAL(15, 2) NOT NULL DEFAULT 0,
    currency VARCHAR(3) DEFAULT 'SGD',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- SPENDING CATEGORIES TABLE
-- ============================================
-- User-created spending categories
CREATE TABLE IF NOT EXISTS spending_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    color VARCHAR(7) DEFAULT '#6366f1',
    icon VARCHAR(50),
    budget_amount DECIMAL(10, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- TRANSACTIONS TABLE
-- ============================================
-- Daily spending transactions
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id UUID REFERENCES spending_categories(id) ON DELETE SET NULL,
    amount DECIMAL(10, 2) NOT NULL,
    description TEXT,
    transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- NET WORTH HISTORY TABLE
-- ============================================
-- Snapshots of total net worth over time
CREATE TABLE IF NOT EXISTS net_worth_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    total_assets DECIMAL(15, 2) NOT NULL DEFAULT 0,
    total_liabilities DECIMAL(15, 2) NOT NULL DEFAULT 0,
    net_worth DECIMAL(15, 2) NOT NULL DEFAULT 0,
    snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(snapshot_date)
);

-- ============================================
-- ASSET SNAPSHOTS TABLE
-- ============================================
-- Individual asset values at each snapshot
CREATE TABLE IF NOT EXISTS asset_snapshots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    history_id UUID NOT NULL REFERENCES net_worth_history(id) ON DELETE CASCADE,
    asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    value DECIMAL(15, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_assets_source ON assets(source_id);
CREATE INDEX IF NOT EXISTS idx_assets_category ON assets(category_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category_id);
CREATE INDEX IF NOT EXISTS idx_net_worth_history_date ON net_worth_history(snapshot_date);
CREATE INDEX IF NOT EXISTS idx_asset_snapshots_history ON asset_snapshots(history_id);

-- ============================================
-- TRIGGERS FOR updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_asset_categories_updated_at
    BEFORE UPDATE ON asset_categories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_asset_sources_updated_at
    BEFORE UPDATE ON asset_sources
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assets_updated_at
    BEFORE UPDATE ON assets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_spending_categories_updated_at
    BEFORE UPDATE ON spending_categories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at
    BEFORE UPDATE ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- SEED DATA - DEFAULT ASSET CATEGORIES
-- ============================================
INSERT INTO asset_categories (name, type, icon, display_order) VALUES
    ('Stocks & Investments', 'investment', 'trending-up', 1),
    ('Cash & Savings', 'cash', 'wallet', 2),
    ('Property', 'property', 'home', 3),
    ('CPF', 'investment', 'shield', 4),
    ('Loans & Liabilities', 'liability', 'credit-card', 5)
ON CONFLICT DO NOTHING;

-- ============================================
-- SEED DATA - DEFAULT SPENDING CATEGORIES
-- ============================================
INSERT INTO spending_categories (name, color, icon) VALUES
    ('Food & Dining', '#ef4444', 'utensils'),
    ('Transport', '#f97316', 'car'),
    ('Shopping', '#eab308', 'shopping-bag'),
    ('Entertainment', '#22c55e', 'film'),
    ('Bills & Utilities', '#3b82f6', 'file-text'),
    ('Healthcare', '#ec4899', 'heart'),
    ('Others', '#6b7280', 'more-horizontal')
ON CONFLICT DO NOTHING;

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================
-- For a single-user app, we'll enable RLS but allow all operations
-- This provides a security foundation for future multi-user support

ALTER TABLE asset_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE spending_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE net_worth_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_snapshots ENABLE ROW LEVEL SECURITY;

-- Policies that allow all operations (single user mode)
-- These can be modified later to add user_id column and restrict by user

CREATE POLICY "Allow all on asset_categories" ON asset_categories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on asset_sources" ON asset_sources FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on assets" ON assets FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on spending_categories" ON spending_categories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on transactions" ON transactions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on net_worth_history" ON net_worth_history FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on asset_snapshots" ON asset_snapshots FOR ALL USING (true) WITH CHECK (true);
