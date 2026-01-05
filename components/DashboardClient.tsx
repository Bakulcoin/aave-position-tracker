'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { TrendingUp, TrendingDown, LogOut, Plus, Loader2 } from 'lucide-react';

interface Report {
  id: string;
  wallet_address: string;
  initial_networth: number;
  current_networth: number;
  total_pnl: number;
  pnl_percentage: number;
  image_url: string;
  created_at: string;
}

interface Props {
  user: any;
  initialReports: Report[];
}

export default function DashboardClient({ user, initialReports }: Props) {
  const [walletAddress, setWalletAddress] = useState('');
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [reports, setReports] = useState(initialReports);
  const router = useRouter();
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenerating(true);
    setError('');

    try {
      const response = await fetch('/api/generate-pnl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate report');
      }

      // Refresh reports
      const { data: updatedReports } = await supabase
        .from('pnl_reports')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      setReports(updatedReports || []);
      setWalletAddress('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-background-card">
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
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-400">{user.email}</span>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 px-4 py-2 border border-white/10 rounded-lg hover:border-primary/60 transition-colors"
              >
                <LogOut size={16} />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Generate PNL Section */}
        <div className="card p-8 mb-12">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Plus className="text-primary" />
            Generate New PNL Report
          </h2>

          <form onSubmit={handleGenerate} className="space-y-4">
            {error && (
              <div className="bg-red-500/10 border border-red-500/50 text-red-500 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="wallet" className="block text-sm font-medium mb-2">
                BSC Wallet Address
              </label>
              <input
                id="wallet"
                type="text"
                value={walletAddress}
                onChange={(e) => setWalletAddress(e.target.value)}
                placeholder="0x..."
                required
                disabled={generating}
                className="w-full px-4 py-3 bg-background border border-white/10 rounded-lg focus:border-primary focus:outline-none transition-colors disabled:opacity-50"
              />
              <p className="text-xs text-gray-400 mt-2">
                Enter your BSC wallet address to generate a PNL report for your Aave positions
              </p>
            </div>

            <button
              type="submit"
              disabled={generating}
              className="btn-primary flex items-center gap-2 disabled:opacity-50"
            >
              {generating ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Generating Report...
                </>
              ) : (
                <>
                  <Plus size={20} />
                  Generate PNL Report
                </>
              )}
            </button>
          </form>
        </div>

        {/* Reports List */}
        <div>
          <h2 className="text-2xl font-bold mb-6">Your PNL Reports</h2>

          {reports.length === 0 ? (
            <div className="card p-12 text-center">
              <p className="text-gray-400">
                No reports yet. Generate your first PNL report above!
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {reports.map((report) => (
                <div key={report.id} className="card p-6 hover:border-primary/30 transition-all">
                  <div className="mb-4">
                    <p className="text-xs text-gray-400">Wallet</p>
                    <p className="font-mono text-sm">
                      {report.wallet_address.slice(0, 6)}...{report.wallet_address.slice(-4)}
                    </p>
                  </div>

                  <div className="space-y-3 mb-4">
                    <div>
                      <p className="text-xs text-gray-400">Initial Net Worth</p>
                      <p className="text-lg font-bold">
                        ${Number(report.initial_networth).toFixed(2)}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-400">Current Net Worth</p>
                      <p className="text-lg font-bold">
                        ${Number(report.current_networth).toFixed(2)}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-400">Total PNL</p>
                      <div className="flex items-center gap-2">
                        {Number(report.total_pnl) >= 0 ? (
                          <TrendingUp className="text-green-500" size={20} />
                        ) : (
                          <TrendingDown className="text-red-500" size={20} />
                        )}
                        <p
                          className={`text-xl font-bold ${
                            Number(report.total_pnl) >= 0
                              ? 'text-green-500'
                              : 'text-red-500'
                          }`}
                        >
                          {Number(report.total_pnl) >= 0 ? '+' : ''}$
                          {Number(report.total_pnl).toFixed(2)}
                        </p>
                        <span
                          className={`text-sm ${
                            Number(report.total_pnl) >= 0
                              ? 'text-green-500'
                              : 'text-red-500'
                          }`}
                        >
                          ({Number(report.pnl_percentage).toFixed(2)}%)
                        </span>
                      </div>
                    </div>
                  </div>

                  {report.image_url && (
                    <a
                      href={report.image_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-full px-4 py-2 bg-primary/10 border border-primary/30 rounded-lg text-center hover:bg-primary/20 transition-colors text-sm"
                    >
                      View PNL Card
                    </a>
                  )}

                  <p className="text-xs text-gray-500 mt-3">
                    Generated {new Date(report.created_at).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
