-- 005_surplus_initial_balance.sql
-- Adds an initial_balance column to surplus_config

ALTER TABLE surplus_config
ADD COLUMN IF NOT EXISTS initial_balance DECIMAL(15, 2) NOT NULL DEFAULT 0;
