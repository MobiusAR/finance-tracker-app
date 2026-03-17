-- 007_income_automation.sql
-- Add Columns to user_settings for Income & CPF Automation

ALTER TABLE user_settings
-- Fixed Income settings
ADD COLUMN basic_salary DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN basic_bonus DECIMAL(10, 2) DEFAULT 0,

-- Automation Pay Days (1-31)
ADD COLUMN salary_pay_day INT DEFAULT 25 CHECK (salary_pay_day >= 1 AND salary_pay_day <= 31),
ADD COLUMN cpf_pay_day INT DEFAULT 14 CHECK (cpf_pay_day >= 1 AND cpf_pay_day <= 31),
ADD COLUMN mortgage_pay_day INT DEFAULT 15 CHECK (mortgage_pay_day >= 1 AND mortgage_pay_day <= 31),

-- Home Loan Tracking
ADD COLUMN home_loan_total DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN home_loan_months_remaining INT DEFAULT 0,

-- Cron Execution Tracking (to avoid multiple processing in one month)
ADD COLUMN last_salary_processed_date DATE,
ADD COLUMN last_cpf_processed_date DATE,
ADD COLUMN last_mortgage_processed_date DATE;
