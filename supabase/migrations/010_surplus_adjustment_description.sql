-- Add a description field for manual surplus adjustments
ALTER TABLE budget_surplus
ADD COLUMN IF NOT EXISTS adjustment_description TEXT;
