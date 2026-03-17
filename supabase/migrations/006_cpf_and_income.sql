-- 006_cpf_and_income.sql
-- Add Tables for Income & CPF Tracking

-- ============================================
-- USER SETTINGS TABLE
-- ============================================
-- Single row to store user-level defaults
CREATE TABLE IF NOT EXISTS user_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date_of_birth DATE,
    race VARCHAR(20) CHECK (race IN ('Chinese', 'Malay', 'Indian', 'Others')),
    monthly_mortgage DECIMAL(10, 2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- INCOME RECORDS TABLE
-- ============================================
-- Stores monthly salary details and CPF contributions
CREATE TABLE IF NOT EXISTS income_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    month DATE NOT NULL UNIQUE,
    gross_pay DECIMAL(10, 2) NOT NULL DEFAULT 0,
    bonus DECIMAL(10, 2) NOT NULL DEFAULT 0,
    employee_cpf DECIMAL(10, 2) NOT NULL DEFAULT 0,
    employer_cpf DECIMAL(10, 2) NOT NULL DEFAULT 0,
    shg_deduction DECIMAL(10, 2) NOT NULL DEFAULT 0,
    net_pay DECIMAL(10, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- UPDATE ASSET CATEGORIES RESTRAINT
-- ============================================
-- Alter the CHECK constraint on asset_categories.type to include 'cpf'
ALTER TABLE asset_categories DROP CONSTRAINT IF EXISTS asset_categories_type_check;
ALTER TABLE asset_categories ADD CONSTRAINT asset_categories_type_check 
    CHECK (type IN ('investment', 'cash', 'property', 'liability', 'cpf'));

-- Update the existing CPF category to use the new 'cpf' type instead of 'investment'
UPDATE asset_categories SET type = 'cpf' WHERE name = 'CPF';

-- ============================================
-- ADD DATE FIELD TO TRANSACTIONS (Optional but good safety feature for the trigger if we need it)
-- In real app we might want to also add triggers, but since tracking is via API, we just need updated_at triggers
-- ============================================

CREATE TRIGGER update_user_settings_updated_at
    BEFORE UPDATE ON user_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_income_records_updated_at
    BEFORE UPDATE ON income_records
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE income_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all on user_settings" ON user_settings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on income_records" ON income_records FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- INITIALIZE SETTINGS ROW
-- ============================================
-- Insert a single empty settings row to get started
INSERT INTO user_settings (id) VALUES (uuid_generate_v4()) ON CONFLICT DO NOTHING;
