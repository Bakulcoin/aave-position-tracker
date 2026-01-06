'use client';

import { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';

interface Position {
  symbol: string;
  amount: number;
  currentValue: number;
  currentPrice: number;
}

interface PositionData {
  positions: {
    supplied: Position[];
    borrowed: Position[];
  };
  summary: {
    initialNetWorth: number;
    currentNetWorth: number;
    totalPnL: number;
    pnlPercentage: number;
  };
  walletAddress: string;
}

export default function AavePositionsView({ data }: { data: PositionData }) {
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');

  const totalSupplied = data.positions.supplied.reduce(
    (sum, pos) => sum + pos.currentValue,
    0
  );

  const totalBorrowed = data.positions.borrowed.reduce(
    (sum, pos) => sum + pos.currentValue,
    0
  );

  const healthFactor = totalBorrowed > 0 ? (totalSupplied / totalBorrowed) * 100 : Infinity;

  const handleGeneratePNL = async () => {
    setGenerating(true);
    setError('');

    try {
      const response = await fetch('/api/generate-pnl-card', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress: data.walletAddress }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to generate PNL card');
      }

      // Download the image
      const link = document.createElement('a');
      link.href = result.imageUrl;
      link.download = `aave-pnl-${data.walletAddress.slice(0, 8)}.png`;
      link.click();

      alert('PNL card generated successfully!');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Aave V3 Header */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
              <span className="text-primary font-bold text-lg">A</span>
            </div>
            <div>
              <h2 className="text-2xl font-bold">Aave V3</h2>
              <p className="text-sm text-gray-400">BSC</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-400">Total Value</p>
            <p className="text-2xl font-bold">${data.summary.currentNetWorth.toFixed(2)}</p>
          </div>
        </div>

        {/* Health Factor */}
        {totalBorrowed > 0 && (
          <div className="bg-background-card p-4 rounded-lg mb-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Health Rate</span>
              <span
                className={`font-bold ${
                  healthFactor > 200 ? 'text-green-500' : 'text-yellow-500'
                }`}
              >
                {healthFactor > 10 ? '>10' : healthFactor.toFixed(2)}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Supplied Assets */}
      {data.positions.supplied.length > 0 && (
        <div className="card p-6">
          <div className="mb-4 pb-3 border-b border-white/10">
            <span className="text-sm bg-primary/20 text-primary px-3 py-1 rounded">
              Lending
            </span>
          </div>

          <div className="space-y-1 mb-4">
            <div className="grid grid-cols-3 text-xs text-gray-400 px-4">
              <span>Supplied</span>
              <span className="text-center">Balance</span>
              <span className="text-right">USD Value</span>
            </div>
          </div>

          {data.positions.supplied.map((position, index) => (
            <div
              key={index}
              className="grid grid-cols-3 items-center py-4 px-4 hover:bg-white/5 rounded-lg transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                  <span className="text-xs font-bold">{position.symbol[0]}</span>
                </div>
                <span className="font-medium">{position.symbol}</span>
              </div>
              <div className="text-center">
                <p className="font-mono text-sm">{position.amount.toFixed(6)}</p>
              </div>
              <div className="text-right">
                <p className="font-bold">${position.currentValue.toFixed(2)}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Borrowed Assets */}
      {data.positions.borrowed.length > 0 && (
        <div className="card p-6">
          <div className="mb-4 pb-3 border-b border-white/10">
            <span className="text-sm bg-red-500/20 text-red-400 px-3 py-1 rounded">
              Borrowing
            </span>
          </div>

          <div className="space-y-1 mb-4">
            <div className="grid grid-cols-3 text-xs text-gray-400 px-4">
              <span>Borrowed</span>
              <span className="text-center">Balance</span>
              <span className="text-right">USD Value</span>
            </div>
          </div>

          {data.positions.borrowed.map((position, index) => (
            <div
              key={index}
              className="grid grid-cols-3 items-center py-4 px-4 hover:bg-white/5 rounded-lg transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-red-500/10 rounded-full flex items-center justify-center">
                  <span className="text-xs font-bold text-red-400">{position.symbol[0]}</span>
                </div>
                <span className="font-medium">{position.symbol}</span>
              </div>
              <div className="text-center">
                <p className="font-mono text-sm">{position.amount.toFixed(6)}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-red-400">${position.currentValue.toFixed(2)}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Portfolio Summary */}
      <div className="card p-6">
        <h3 className="text-lg font-bold mb-4">Portfolio Summary</h3>

        <div className="space-y-4 mb-6">
          <div className="flex justify-between items-center py-2 border-b border-white/10">
            <span className="text-gray-400">Total Supplied</span>
            <span className="text-xl font-bold text-green-500">
              ${data.positions.supplied.reduce((sum, p) => sum + p.currentValue, 0).toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-white/10">
            <span className="text-gray-400">Total Borrowed</span>
            <span className="text-xl font-bold text-red-400">
              ${data.positions.borrowed.reduce((sum, p) => sum + p.currentValue, 0).toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between items-center py-3 bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg px-4">
            <span className="text-lg font-medium">Net Worth</span>
            <span className="text-2xl font-bold text-primary">
              ${data.summary.currentNetWorth.toFixed(2)}
            </span>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-500 px-4 py-3 rounded-lg text-sm mb-4">
            {error}
          </div>
        )}

        <button
          onClick={handleGeneratePNL}
          disabled={generating}
          className="w-full btn-primary flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {generating ? (
            <>
              <Loader2 size={20} className="animate-spin" />
              Generating PNL Card...
            </>
          ) : (
            <>
              <Download size={20} />
              Generate & Download PNL Card
            </>
          )}
        </button>
      </div>
    </div>
  );
}
