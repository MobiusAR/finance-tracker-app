// Database types for Finance Tracker

export type AssetType = 'investment' | 'cash' | 'property' | 'liability';

export interface AssetCategory {
  id: string;
  name: string;
  type: AssetType;
  icon: string | null;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface AssetSource {
  id: string;
  name: string;
  category_id: string;
  description: string | null;
  fx_spread_margin: number;
  created_at: string;
  updated_at: string;
  // Joined data
  category?: AssetCategory;
}

export interface Asset {
  id: string;
  name: string;
  source_id: string;
  category_id: string;
  current_value: number;
  currency: string;
  notes: string | null;
  ticker_symbol: string | null;
  shares: number | null;
  is_auto_tracked: boolean;
  created_at: string;
  updated_at: string;
  // Joined data
  source?: AssetSource;
  category?: AssetCategory;
}

export interface SpendingCategory {
  id: string;
  name: string;
  color: string;
  icon: string | null;
  budget_amount: number | null;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  category_id: string | null;
  amount: number;
  description: string | null;
  transaction_date: string;
  created_at: string;
  updated_at: string;
  // Joined data
  category?: SpendingCategory;
}

export interface BudgetSurplus {
  id: string;
  month: string;
  total_budget: number;
  total_spent: number;
  surplus_amount: number;
  discretionary_allowance: number;
  manual_adjustments: number;
  created_at: string;
  updated_at: string;
}

export interface SurplusConfig {
  id: string;
  monthly_income: number;
  monthly_savings_target: number;
  is_singleton: boolean;
  created_at: string;
  updated_at: string;
}

export interface RecurringTransaction {
  id: string;
  category_id: string | null;
  amount: number;
  description: string | null;
  frequency: 'weekly' | 'monthly' | 'yearly';
  day_of_week: number | null;
  day_of_month: number | null;
  month_of_year: number | null;
  start_date: string;
  end_date: string | null;
  is_active: boolean;
  last_generated_date: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  category?: SpendingCategory;
}

export interface CreateRecurringTransaction {
  category_id?: string;
  amount: number;
  description?: string;
  frequency: 'weekly' | 'monthly' | 'yearly';
  day_of_week?: number;
  day_of_month?: number;
  month_of_year?: number;
  start_date?: string;
  end_date?: string;
}

export interface NetWorthHistory {
  id: string;
  total_assets: number;
  total_liabilities: number;
  net_worth: number;
  snapshot_date: string;
  created_at: string;
}

export interface AssetSnapshot {
  id: string;
  history_id: string;
  asset_id: string;
  value: number;
  created_at: string;
}

// Input types for creating/updating records
export interface CreateAssetCategory {
  name: string;
  type: AssetType;
  icon?: string;
  display_order?: number;
}

export interface CreateAssetSource {
  name: string;
  category_id: string;
  description?: string;
  fx_spread_margin?: number;
}

export interface CreateAsset {
  name: string;
  source_id: string;
  category_id: string;
  current_value: number;
  currency?: string;
  notes?: string;
  ticker_symbol?: string;
  shares?: number;
  is_auto_tracked?: boolean;
}

export interface UpdateAsset {
  name?: string;
  source_id?: string;
  category_id?: string;
  current_value?: number;
  currency?: string;
  notes?: string;
  ticker_symbol?: string;
  shares?: number;
  is_auto_tracked?: boolean;
}

export interface CreateSpendingCategory {
  name: string;
  color?: string;
  icon?: string;
  budget_amount?: number;
}

export interface CreateTransaction {
  category_id?: string;
  amount: number;
  description?: string;
  transaction_date?: string;
}

export interface UpdateTransaction {
  category_id?: string;
  amount?: number;
  description?: string;
  transaction_date?: string;
}

export interface PersonalLoan {
  id: string;
  borrower_name: string;
  amount: number;
  currency: string;
  status: 'active' | 'repaid' | 'defaulted';
  date_lent: string;
  due_date: string | null;
  reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreatePersonalLoan {
  borrower_name: string;
  amount: number;
  currency?: string;
  status?: 'active' | 'repaid' | 'defaulted';
  date_lent: string;
  due_date?: string;
  reason?: string;
}

export interface UpdatePersonalLoan {
  borrower_name?: string;
  amount?: number;
  currency?: string;
  status?: 'active' | 'repaid' | 'defaulted';
  date_lent?: string;
  due_date?: string | null;
  reason?: string | null;
}

// Aggregated data types for charts
export interface NetWorthBreakdown {
  category: string;
  type: AssetType;
  value: number;
  color: string;
}

export interface SourceBreakdown {
  source: string;
  value: number;
  assets: Asset[];
}

export interface SpendingSummary {
  category: string;
  color: string;
  total: number;
  count: number;
}

export interface MonthlySpending {
  month: string;
  total: number;
  byCategory: SpendingSummary[];
}

// Supabase Database type definition
export interface Database {
  public: {
    Tables: {
      asset_categories: {
        Row: AssetCategory;
        Insert: CreateAssetCategory & { id?: string };
        Update: Partial<CreateAssetCategory>;
      };
      asset_sources: {
        Row: AssetSource;
        Insert: CreateAssetSource & { id?: string };
        Update: Partial<CreateAssetSource>;
      };
      assets: {
        Row: Asset;
        Insert: CreateAsset & { id?: string };
        Update: UpdateAsset;
      };
      spending_categories: {
        Row: SpendingCategory;
        Insert: CreateSpendingCategory & { id?: string };
        Update: Partial<CreateSpendingCategory>;
      };
      transactions: {
        Row: Transaction;
        Insert: CreateTransaction & { id?: string };
        Update: UpdateTransaction;
      };
      net_worth_history: {
        Row: NetWorthHistory;
        Insert: Omit<NetWorthHistory, 'id' | 'created_at'> & { id?: string };
        Update: Partial<Omit<NetWorthHistory, 'id' | 'created_at'>>;
      };
      asset_snapshots: {
        Row: AssetSnapshot;
        Insert: Omit<AssetSnapshot, 'id' | 'created_at'> & { id?: string };
        Update: Partial<Omit<AssetSnapshot, 'id' | 'created_at'>>;
      };
      budget_surplus: {
        Row: BudgetSurplus;
        Insert: Omit<BudgetSurplus, 'id' | 'created_at' | 'updated_at'> & { id?: string };
        Update: Partial<Omit<BudgetSurplus, 'id' | 'created_at' | 'updated_at'>>;
      };
      surplus_config: {
        Row: SurplusConfig;
        Insert: Omit<SurplusConfig, 'id' | 'created_at' | 'updated_at'> & { id?: string };
        Update: Partial<Omit<SurplusConfig, 'id' | 'created_at' | 'updated_at'>>;
      };
      recurring_transactions: {
        Row: RecurringTransaction;
        Insert: CreateRecurringTransaction & { id?: string };
        Update: Partial<CreateRecurringTransaction>;
      };
      personal_loans: {
        Row: PersonalLoan;
        Insert: CreatePersonalLoan & { id?: string };
        Update: UpdatePersonalLoan;
      };
    };
  };
}
