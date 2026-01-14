'use client';

import { useState, useRef, useEffect } from 'react';
import { Download, Loader2, MessageCircle, Check } from 'lucide-react';

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
  const [sharing, setSharing] = useState(false);
  const [shared, setShared] = useState(false);
  const [error, setError] = useState('');
  const [discordConfigured, setDiscordConfigured] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const totalSupplied = data.positions.supplied.reduce(
    (sum, pos) => sum + pos.currentValue,
    0
  );

  const totalBorrowed = data.positions.borrowed.reduce(
    (sum, pos) => sum + pos.currentValue,
    0
  );

  const healthFactor = totalBorrowed > 0 ? (totalSupplied / totalBorrowed) * 100 : Infinity;

  // Check if Discord is configured on mount
  useEffect(() => {
    const checkDiscord = async () => {
      try {
        const response = await fetch('/api/share-discord');
        const result = await response.json();
        setDiscordConfigured(result.configured);
      } catch {
        setDiscordConfigured(false);
      }
    };
    checkDiscord();
  }, []);

  const generateCardImage = async (): Promise<string | null> => {
    if (!cardRef.current) return null;

    const html2canvas = (await import('html2canvas')).default;
    const canvas = await html2canvas(cardRef.current, {
      backgroundColor: '#0d1117',
      scale: 2,
      logging: false,
      useCORS: true,
    });

    return canvas.toDataURL('image/png');
  };

  const handleGeneratePNL = async () => {
    if (!cardRef.current) return;

    setGenerating(true);
    setError('');

    try {
      const dataUrl = await generateCardImage();
      if (dataUrl) {
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = `aave-pnl-${data.walletAddress.slice(0, 8)}.png`;
        link.click();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to generate image');
    } finally {
      setGenerating(false);
    }
  };

  const handleShareToDiscord = async () => {
    if (!cardRef.current) return;

    setSharing(true);
    setError('');
    setShared(false);

    try {
      // Generate image
      const imageBase64 = await generateCardImage();

      // Send to API
      const response = await fetch('/api/share-discord', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress: data.walletAddress,
          currentNetWorth: data.summary.currentNetWorth,
          totalPnL: data.summary.totalPnL,
          pnlPercentage: data.summary.pnlPercentage,
          suppliedTotal: totalSupplied,
          borrowedTotal: totalBorrowed,
          imageBase64,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to share to Discord');
      }

      setShared(true);
      setTimeout(() => setShared(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to share to Discord');
    } finally {
      setSharing(false);
    }
  };

  const formatDate = () => {
    return new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      {/* Downloadable Card */}
      <div
        ref={cardRef}
        className="card p-6"
        style={{ backgroundColor: '#0d1117' }}
      >
        {/* Aave V3 Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
              <span className="text-primary font-bold text-lg">A</span>
            </div>
            <div>
              <h2 className="text-2xl font-bold">Aave V3 Portfolio</h2>
              <p className="text-sm text-gray-400">BSC</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400 font-mono">
              {data.walletAddress.slice(0, 6)}...{data.walletAddress.slice(-4)}
            </p>
            <p className="text-xs text-gray-400">{formatDate()}</p>
          </div>
        </div>

        {/* Divider */}
        <div className="border-b border-white/10 mb-6"></div>

        {/* Health Factor */}
        {totalBorrowed > 0 && (
          <div className="bg-background-card p-4 rounded-lg mb-6">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Health Rate</span>
              <span
                className={`font-bold ${
                  healthFactor > 200 ? 'text-green-500' : 'text-yellow-500'
                }`}
              >
                {healthFactor > 1000 ? '>10' : healthFactor.toFixed(2)}
              </span>
            </div>
          </div>
        )}

        {/* Supplied Assets */}
        {data.positions.supplied.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-green-500 font-bold text-lg">SUPPLIED</span>
              <span className="text-white font-bold">${totalSupplied.toFixed(2)}</span>
            </div>

            <div className="grid grid-cols-3 text-xs text-gray-400 px-2 mb-2">
              <span>Asset</span>
              <span className="text-center">Amount</span>
              <span className="text-right">Value</span>
            </div>

            {data.positions.supplied.map((position, index) => (
              <div
                key={index}
                className="grid grid-cols-3 items-center py-3 px-2 hover:bg-white/5 rounded-lg"
              >
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 bg-primary/20 rounded-full flex items-center justify-center">
                    <span className="text-xs font-bold text-white">{position.symbol[0]}</span>
                  </div>
                  <span className="font-medium text-sm">{position.symbol}</span>
                </div>
                <div className="text-center">
                  <p className="font-mono text-xs text-gray-400">{position.amount.toFixed(6)}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-sm">${position.currentValue.toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Borrowed Assets */}
        {data.positions.borrowed.length > 0 && (
          <div className="mb-6">
            <div className="border-t border-white/10 pt-4 mb-4"></div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-red-500 font-bold text-lg">BORROWED</span>
              <span className="text-white font-bold">${totalBorrowed.toFixed(2)}</span>
            </div>

            <div className="grid grid-cols-3 text-xs text-gray-400 px-2 mb-2">
              <span>Asset</span>
              <span className="text-center">Amount</span>
              <span className="text-right">Value</span>
            </div>

            {data.positions.borrowed.map((position, index) => (
              <div
                key={index}
                className="grid grid-cols-3 items-center py-3 px-2 hover:bg-white/5 rounded-lg"
              >
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 bg-red-500/20 rounded-full flex items-center justify-center">
                    <span className="text-xs font-bold text-red-400">{position.symbol[0]}</span>
                  </div>
                  <span className="font-medium text-sm">{position.symbol}</span>
                </div>
                <div className="text-center">
                  <p className="font-mono text-xs text-gray-400">{position.amount.toFixed(6)}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-sm text-red-400">${position.currentValue.toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Net Worth Summary */}
        <div className="border-t border-white/10 pt-4">
          <div
            className="p-4 rounded-lg"
            style={{ background: 'linear-gradient(90deg, rgba(0,212,170,0.1) 0%, rgba(0,212,170,0.05) 100%)' }}
          >
            <div className="flex items-center justify-between">
              <span className="text-gray-400">NET WORTH</span>
              <span className="text-2xl font-bold text-primary">
                ${data.summary.currentNetWorth.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="card p-6">
        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-500 px-4 py-3 rounded-lg text-sm mb-4">
            {error}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          {/* Download Button */}
          <button
            onClick={handleGeneratePNL}
            disabled={generating}
            className="flex-1 btn-primary flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {generating ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Download size={20} />
                Download PNL Card
              </>
            )}
          </button>

          {/* Discord Share Button */}
          {discordConfigured && (
            <button
              onClick={handleShareToDiscord}
              disabled={sharing || shared}
              className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all disabled:opacity-50 ${
                shared
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-[#5865F2] hover:bg-[#4752C4] text-white'
              }`}
            >
              {sharing ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Sharing...
                </>
              ) : shared ? (
                <>
                  <Check size={20} />
                  Shared!
                </>
              ) : (
                <>
                  <MessageCircle size={20} />
                  Share to Discord
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
