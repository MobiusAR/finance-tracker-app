-- 008_drop_loan_months.sql
-- Drop the home_loan_months_remaining column as it will be calculated dynamically

ALTER TABLE user_settings
DROP COLUMN IF EXISTS home_loan_months_remaining;
