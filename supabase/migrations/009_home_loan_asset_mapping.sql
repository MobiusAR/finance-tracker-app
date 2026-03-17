-- 009_home_loan_asset_mapping.sql
-- Replace the flat home_loan_total column with a direct foreign key to the user's Liability Asset Tracker

ALTER TABLE user_settings
DROP COLUMN IF EXISTS home_loan_total;

ALTER TABLE user_settings
ADD COLUMN IF NOT EXISTS home_loan_asset_id UUID REFERENCES assets(id) ON DELETE SET NULL;
