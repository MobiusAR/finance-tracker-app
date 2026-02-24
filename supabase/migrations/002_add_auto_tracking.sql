-- Migration to add auto-tracking capabilities for assets
-- Run this in the Supabase SQL Editor

-- 1. Add fx_spread_margin to asset_sources
ALTER TABLE asset_sources
ADD COLUMN IF NOT EXISTS fx_spread_margin DECIMAL(5, 4) DEFAULT 0;
-- Example: 0.00 for IBKR, -0.0035 for Moomoo

-- 2. Add tracking columns to assets
ALTER TABLE assets
ADD COLUMN IF NOT EXISTS ticker_symbol VARCHAR(20),
ADD COLUMN IF NOT EXISTS shares DECIMAL(15, 6),
ADD COLUMN IF NOT EXISTS is_auto_tracked BOOLEAN DEFAULT FALSE;

-- 3. Enhance assets index for ticker symbols
CREATE INDEX IF NOT EXISTS idx_assets_ticker ON assets(ticker_symbol) WHERE is_auto_tracked = true;

-- Note on existing data: 
-- Existing rows will have is_auto_tracked = false, ticker_symbol = null, shares = null
-- current_value will continue to be used as a manual override or fixed value for non-tracked assets.
