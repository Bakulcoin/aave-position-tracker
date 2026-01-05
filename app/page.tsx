import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // If user is already logged in, redirect to dashboard
  if (user) {
    redirect('/dashboard');
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-background via-background to-background-card">
      {/* Navigation */}
      <nav className="border-b border-white/10 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-xl">
                %
              </div>
              <span className="text-xl font-bold">Aave PNL</span>
            </div>
            <Link
              href="/auth/login"
              className="btn-primary"
            >
              Sign In
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h1 className="text-6xl font-bold mb-6">
            Track Your Aave{' '}
            <span className="gradient-text">Performance</span>
          </h1>
          <p className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto">
            Generate beautiful PNL reports for your Aave positions on BSC.
            Analyze your DeFi performance with real-time data and historical tracking.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/auth/login" className="btn-primary text-lg">
              Get Started →
            </Link>
            <a
              href="#features"
              className="px-8 py-3 border border-primary/30 rounded-lg hover:border-primary/60 transition-colors"
            >
              Learn More
            </a>
          </div>
        </div>

        {/* Features */}
        <div id="features" className="grid md:grid-cols-3 gap-8 mt-32">
          <div className="card p-8">
            <div className="text-4xl mb-4">📊</div>
            <h3 className="text-xl font-bold mb-2">Real-time Tracking</h3>
            <p className="text-gray-400">
              Automatically track all your Aave positions and calculate PNL in real-time.
            </p>
          </div>
          <div className="card p-8">
            <div className="text-4xl mb-4">💰</div>
            <h3 className="text-xl font-bold mb-2">Accurate Calculations</h3>
            <p className="text-gray-400">
              Historical price tracking for precise initial position valuation and PNL.
            </p>
          </div>
          <div className="card p-8">
            <div className="text-4xl mb-4">🎨</div>
            <h3 className="text-xl font-bold mb-2">Beautiful Reports</h3>
            <p className="text-gray-400">
              Generate shareable PNL cards with all your performance metrics.
            </p>
          </div>
        </div>

        {/* How it Works */}
        <div className="mt-32">
          <h2 className="text-4xl font-bold text-center mb-16">How It Works</h2>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4 text-primary font-bold">
                1
              </div>
              <h4 className="font-semibold mb-2">Connect</h4>
              <p className="text-sm text-gray-400">Sign in with your email</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4 text-primary font-bold">
                2
              </div>
              <h4 className="font-semibold mb-2">Enter Wallet</h4>
              <p className="text-sm text-gray-400">Submit your BSC wallet address</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4 text-primary font-bold">
                3
              </div>
              <h4 className="font-semibold mb-2">Analyze</h4>
              <p className="text-sm text-gray-400">We calculate your Aave PNL</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4 text-primary font-bold">
                4
              </div>
              <h4 className="font-semibold mb-2">View & Share</h4>
              <p className="text-sm text-gray-400">Get your beautiful PNL report</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-white/10 mt-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-400 text-sm">
            <p>© 2024 Aave PNL Generator. Built for the DeFi community.</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
