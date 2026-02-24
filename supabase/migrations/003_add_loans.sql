-- 003_add_loans.sql
-- Add Personal Loans tracking table isolated from the core net worth assets

CREATE TABLE IF NOT EXISTS personal_loans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    borrower_name VARCHAR(100) NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'SGD',
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'repaid', 'defaulted')),
    date_lent DATE NOT NULL,
    due_date DATE,
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for Personal Loans
ALTER TABLE personal_loans ENABLE ROW LEVEL SECURITY;

-- If you are using Supabase Auth (authenticated users only):
-- Create a policy allowing users to CRUD their own loans. Since this is a personal app without user_id currently, we'll allow anon/public for now to match the existing dev setup.
-- If user_id is added later, update this policy.
CREATE POLICY "Enable all actions for personal_loans" ON personal_loans
    FOR ALL
    USING (true)
    WITH CHECK (true);
