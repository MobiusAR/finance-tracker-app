# Personal Finance Tracker

A personal finance tracking application to visualize your net worth and track daily spending.

## Features

- **Net Worth Dashboard**: Visualize your total net worth with breakdowns by category and source
- **Asset Management**: Track investments (stocks, funds), cash, property, and liabilities across different platforms (moomoo, endowus, IBKR, etc.)
- **Spending Tracker**: Record daily expenses with custom categories
- **Category Management**: Create and manage your own spending categories with custom colors

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui components
- **Database**: Supabase (PostgreSQL)
- **Charts**: Recharts
- **Hosting**: Vercel (free tier)

## Setup Instructions

### Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a free account
2. Click "New Project" and fill in the details:
   - Project name: `finance-tracker` (or any name you prefer)
   - Database password: Create a strong password
   - Region: Choose the closest to you
3. Wait for the project to be created (1-2 minutes)
4. Go to **Settings > API** and copy:
   - Project URL (e.g., `https://xxxxx.supabase.co`)
   - `anon` public key

### Step 2: Setup Database

1. In your Supabase project, go to **SQL Editor**
2. Open the file `supabase/migrations/001_initial_schema.sql` from this project
3. Copy the entire contents and paste it into the SQL Editor
4. Click "Run" to create all tables, indexes, and seed data

### Step 3: Configure Environment Variables

1. Rename `.env.local` (or create if it doesn't exist):
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```
2. Replace the placeholder values with your actual Supabase credentials

### Step 4: Run Locally (Optional)

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

### Step 5: Deploy to Vercel (Free)

1. Push your code to GitHub:
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. Go to [vercel.com](https://vercel.com) and sign up with GitHub

3. Click "New Project" and import your repository

4. In the "Environment Variables" section, add:
   - `NEXT_PUBLIC_SUPABASE_URL` = your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = your Supabase anon key

5. Click "Deploy" - Vercel will build and deploy your app

6. Your app will be live at `https://your-project.vercel.app`

## Usage Guide

### Managing Assets

1. Go to **Assets** page
2. First, add sources (platforms where you hold assets):
   - Click "Add Source" button
   - Enter the platform name (e.g., "moomoo", "IBKR", "DBS")
   - Select the category type
3. Then add your assets:
   - Click "Add Asset"
   - Enter the asset name, select category and source
   - Enter the current value
4. Update values regularly to track your net worth over time

### Tracking Spending

1. Go to **Spending** page
2. Click "Add Transaction" to record an expense
3. Select a category, enter the amount and description
4. View your monthly spending breakdown in the chart

### Managing Categories

1. Go to **Categories** page
2. Create custom spending categories
3. Set optional monthly budgets for each category

## Free Tier Limits

This app is designed to run entirely on free tiers:

- **Vercel**: 100GB bandwidth/month, unlimited deployments
- **Supabase**: 500MB database storage (plenty for years of personal finance data)

## Project Structure

```
finance-tracker-app/
├── src/
│   ├── app/                    # Next.js app router pages
│   │   ├── page.tsx           # Dashboard
│   │   ├── assets/            # Asset management
│   │   ├── spending/          # Spending tracker
│   │   └── categories/        # Category management
│   ├── components/
│   │   ├── charts/            # Recharts visualizations
│   │   ├── forms/             # Form dialogs
│   │   ├── layout/            # Sidebar, Header
│   │   └── ui/                # shadcn/ui components
│   ├── hooks/                 # React hooks for data fetching
│   └── lib/
│       └── supabase/          # Supabase client configuration
├── supabase/
│   └── migrations/            # SQL migration files
└── .env.local                 # Environment variables (not committed)
```

## Security Notes

- The app uses Row Level Security (RLS) on all tables
- Currently configured for single-user mode (all operations allowed)
- To add multi-user support later, add a `user_id` column and update RLS policies

## License

MIT - Feel free to use and modify for your personal use.
