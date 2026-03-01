-- 004_surplus_configuration.sql
-- Adds Global Settings to determine a baseline surplus allowance

-- 1. Create a Configuration Table (Singleton Pattern)
CREATE TABLE IF NOT EXISTS surplus_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    monthly_income DECIMAL(15, 2) NOT NULL DEFAULT 0,
    monthly_savings_target DECIMAL(15, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure only one row exists (using a constraint on a generated column)
-- A simpler approach for personal apps is just inserting one row and ignoring others
ALTER TABLE surplus_config ADD COLUMN is_singleton BOOLEAN DEFAULT true UNIQUE CHECK (is_singleton);

-- Insert the default configuration
INSERT INTO surplus_config (monthly_income, monthly_savings_target, is_singleton)
VALUES (0, 0, true)
ON CONFLICT (is_singleton) DO NOTHING;

-- 2. Modify budget_surplus Table
ALTER TABLE budget_surplus
ADD COLUMN discretionary_allowance DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN manual_adjustments DECIMAL(10, 2) DEFAULT 0;

-- 3. Trigger for updated_at
CREATE TRIGGER update_surplus_config_updated_at
    BEFORE UPDATE ON surplus_config
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 4. RLS Policies
ALTER TABLE surplus_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on surplus_config" ON surplus_config FOR ALL USING (true) WITH CHECK (true);
