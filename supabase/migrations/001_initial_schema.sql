-- Create users profile table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create PNL reports table
CREATE TABLE IF NOT EXISTS public.pnl_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  wallet_address TEXT NOT NULL,
  initial_networth NUMERIC(20, 2) NOT NULL,
  current_networth NUMERIC(20, 2) NOT NULL,
  total_pnl NUMERIC(20, 2) NOT NULL,
  pnl_percentage NUMERIC(10, 4) NOT NULL,
  report_data JSONB NOT NULL, -- Full report data including positions
  image_url TEXT, -- URL to generated PNL card image
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create positions table (for detailed tracking)
CREATE TABLE IF NOT EXISTS public.positions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  report_id UUID REFERENCES public.pnl_reports(id) ON DELETE CASCADE NOT NULL,
  position_type TEXT NOT NULL CHECK (position_type IN ('supplied', 'borrowed')),
  token_symbol TEXT NOT NULL,
  token_address TEXT NOT NULL,
  amount NUMERIC(30, 10) NOT NULL,
  initial_price NUMERIC(20, 10) NOT NULL,
  current_price NUMERIC(20, 10) NOT NULL,
  initial_value NUMERIC(20, 2) NOT NULL,
  current_value NUMERIC(20, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create wallet tracking table (to associate wallets with users)
CREATE TABLE IF NOT EXISTS public.user_wallets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  wallet_address TEXT NOT NULL,
  nickname TEXT,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(user_id, wallet_address)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_pnl_reports_user_id ON public.pnl_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_pnl_reports_wallet_address ON public.pnl_reports(wallet_address);
CREATE INDEX IF NOT EXISTS idx_pnl_reports_created_at ON public.pnl_reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_positions_report_id ON public.positions(report_id);
CREATE INDEX IF NOT EXISTS idx_user_wallets_user_id ON public.user_wallets(user_id);

-- Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pnl_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_wallets ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- PNL reports policies
CREATE POLICY "Users can view own PNL reports" ON public.pnl_reports
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own PNL reports" ON public.pnl_reports
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own PNL reports" ON public.pnl_reports
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own PNL reports" ON public.pnl_reports
  FOR DELETE USING (auth.uid() = user_id);

-- Positions policies
CREATE POLICY "Users can view own positions" ON public.positions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.pnl_reports
      WHERE pnl_reports.id = positions.report_id
      AND pnl_reports.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own positions" ON public.positions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.pnl_reports
      WHERE pnl_reports.id = positions.report_id
      AND pnl_reports.user_id = auth.uid()
    )
  );

-- User wallets policies
CREATE POLICY "Users can view own wallets" ON public.user_wallets
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own wallets" ON public.user_wallets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own wallets" ON public.user_wallets
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own wallets" ON public.user_wallets
  FOR DELETE USING (auth.uid() = user_id);

-- Function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER set_updated_at_profiles
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_pnl_reports
  BEFORE UPDATE ON public.pnl_reports
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
