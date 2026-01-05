# Setup Guide

This guide will help you set up the Aave PNL Generator from scratch.

## Step 1: Prerequisites

Make sure you have:
- Node.js 18 or higher installed
- A Supabase account (sign up at https://supabase.com)
- A BscScan API key (get one at https://bscscan.com/apis)

## Step 2: Clone and Install

```bash
git clone <your-repo-url>
cd aave-pnl-generator
npm install
```

## Step 3: Set Up Supabase

1. **Create a New Project**:
   - Go to https://supabase.com/dashboard
   - Click "New Project"
   - Fill in project details and create

2. **Get Your API Keys**:
   - Go to Project Settings > API
   - Copy your Project URL
   - Copy your `anon` public key
   - Copy your `service_role` key (keep this secret!)

3. **Run the Database Migration**:
   - Go to SQL Editor in your Supabase dashboard
   - Click "New Query"
   - Copy the entire contents of `supabase/migrations/001_initial_schema.sql`
   - Paste and run it

## Step 4: Configure Environment Variables

Create a `.env.local` file in the root directory:

```bash
cp .env.local.example .env.local
```

Edit `.env.local` and add your credentials:

```env
BSCSCAN_API_KEY=your_bscscan_api_key_here
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Step 5: Run the Application

```bash
npm run dev
```

Visit http://localhost:3000 to see your app!

## Step 6: Test the Application

1. **Sign Up**: Create a new account
2. **Check Email**: Verify your email (check spam folder)
3. **Log In**: Sign in with your credentials
4. **Generate Report**:
   - Enter a BSC wallet address that has Aave activity
   - Click "Generate PNL Report"
   - Wait for the report to be generated

## Step 7: Deploy to Vercel

1. **Push to GitHub**:
```bash
git add .
git commit -m "Initial commit"
git push origin main
```

2. **Import to Vercel**:
   - Go to https://vercel.com
   - Click "New Project"
   - Import your GitHub repository

3. **Add Environment Variables in Vercel**:
   - Go to Project Settings > Environment Variables
   - Add all variables from your `.env.local`
   - Make sure to add them for Production, Preview, and Development

4. **Deploy**:
   - Click "Deploy"
   - Wait for deployment to complete
   - Your app is now live!

## Troubleshooting

### Database Issues
- Make sure you ran the migration SQL in Supabase
- Check that RLS is enabled on all tables
- Verify your Supabase keys are correct

### Authentication Issues
- Check that email confirmation is enabled in Supabase
- Verify redirect URLs in Supabase Auth settings
- Make sure `NEXT_PUBLIC_APP_URL` is set correctly

### PNL Generation Issues
- Verify your BscScan API key is valid
- Check that the wallet address has Aave activity on BSC
- Monitor the API logs in your terminal

## Support

If you encounter issues:
1. Check the console for error messages
2. Verify all environment variables are set
3. Make sure the database migration ran successfully
4. Check Supabase logs for authentication issues

## Next Steps

- Customize the UI to match your brand
- Add support for more tokens
- Implement email notifications
- Add export to PDF functionality
- Set up monitoring and analytics
