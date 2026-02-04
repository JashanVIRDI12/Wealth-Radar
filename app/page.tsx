'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

type MarketData = {
  price: number;
  change: number;
  changePercent: number;
  bias: 'bullish' | 'bearish' | 'neutral';
  loading: boolean;
};

export default function HomePage() {
  const [usdjpyData, setUsdjpyData] = useState<MarketData>({
    price: 0, change: 0, changePercent: 0, bias: 'neutral', loading: true
  });
  const [niftyData, setNiftyData] = useState<MarketData>({
    price: 0, change: 0, changePercent: 0, bias: 'neutral', loading: true
  });
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setCurrentTime(new Date());

    // Fetch USDJPY data from indicators API (includes live price + trend)
    fetch('/api/indicators-free')
      .then(res => res.json())
      .then(data => {
        if (data.price) {
          // Convert trend to bias: uptrend = bullish, downtrend = bearish, sideways = neutral
          let bias: 'bullish' | 'bearish' | 'neutral' = 'neutral';
          if (data.trend === 'uptrend') bias = 'bullish';
          else if (data.trend === 'downtrend') bias = 'bearish';

          setUsdjpyData({
            price: data.price,
            change: data.priceChange || 0,
            changePercent: data.priceChangePercent || 0,
            bias,
            loading: false
          });
        }
      })
      .catch(() => setUsdjpyData(prev => ({ ...prev, loading: false })));

    fetch('/api/nifty-quote')
      .then(res => res.json())
      .then(data => {
        if (data.price) {
          const changePercent = data.changePercent || 0;
          setNiftyData({
            price: data.price,
            change: data.change || 0,
            changePercent,
            bias: changePercent > 0.3 ? 'bullish' : changePercent < -0.3 ? 'bearish' : 'neutral',
            loading: false
          });
        }
      })
      .catch(() => setNiftyData(prev => ({ ...prev, loading: false })));

    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getBiasStyles = (bias: string) => {
    if (bias === 'bullish') return {
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/30',
      text: 'text-emerald-400',
      label: 'BULLISH'
    };
    if (bias === 'bearish') return {
      bg: 'bg-rose-500/10',
      border: 'border-rose-500/30',
      text: 'text-rose-400',
      label: 'BEARISH'
    };
    return {
      bg: 'bg-zinc-500/10',
      border: 'border-zinc-500/30',
      text: 'text-zinc-400',
      label: 'NEUTRAL'
    };
  };

  return (
    <div className="min-h-screen overflow-hidden relative bg-zinc-950">

      {/* Subtle Gradient Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950"></div>
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:80px_80px]"></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-16">

        {/* Header */}
        <header className="text-center mb-12 sm:mb-20">
          <div className="inline-flex flex-col sm:flex-row items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500 flex items-center justify-center shadow-2xl shadow-purple-500/40">
              <svg className="w-6 h-6 sm:w-9 sm:h-9 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
              Wealth Radar
            </h1>
          </div>

          <p className="text-lg sm:text-xl md:text-2xl text-zinc-300 max-w-3xl mx-auto mb-3 sm:mb-4 leading-relaxed px-2">
            Your personal trading command center
          </p>
          <p className="text-sm sm:text-base text-zinc-500 max-w-2xl mx-auto mb-6 sm:mb-8 px-4">
            Real-time market data, technical analysis, and actionable insights
            to help you make smarter trading decisions.
          </p>

          <div className="flex items-center justify-center gap-3 sm:gap-4 text-xs sm:text-sm">
            <span className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span className="text-emerald-400 font-medium">Live Data</span>
            </span>
            {mounted && currentTime && (
              <span className="text-zinc-500">
                {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            )}
          </div>
        </header>

        {/* Market Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 max-w-5xl mx-auto mb-12 sm:mb-20">

          {/* USDJPY Card */}
          <Link href="/forex" className="group block">
            <div className="bg-zinc-900/80 backdrop-blur-sm rounded-2xl sm:rounded-3xl p-5 sm:p-8 transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl hover:shadow-purple-500/20 cursor-pointer h-full border border-zinc-800/50 hover:border-purple-500/40 relative overflow-hidden">
              <div className="absolute -top-20 -right-20 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

              <div className="flex items-start justify-between mb-5 sm:mb-8 relative">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-xs text-zinc-500 uppercase tracking-wider font-medium">Forex Trading</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-white">USD/JPY</h2>
                </div>
                <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
                  <svg className="w-5 h-5 sm:w-7 sm:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                  </svg>
                </div>
              </div>

              <div className="mb-4 sm:mb-6">
                {usdjpyData.loading ? (
                  <div className="h-10 sm:h-14 w-36 sm:w-48 bg-zinc-800/50 rounded-xl animate-pulse"></div>
                ) : (
                  <>
                    <div className="text-3xl sm:text-5xl font-bold text-white mb-2 tracking-tight">
                      {usdjpyData.price.toFixed(3)}
                    </div>
                    <div className={`flex items-center gap-2 text-sm sm:text-base font-medium ${usdjpyData.change >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {usdjpyData.change >= 0 ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                        </svg>
                      )}
                      <span>{usdjpyData.change >= 0 ? '+' : ''}{usdjpyData.change.toFixed(3)} ({usdjpyData.changePercent >= 0 ? '+' : ''}{usdjpyData.changePercent.toFixed(2)}%)</span>
                    </div>
                  </>
                )}
              </div>

              {!usdjpyData.loading && (
                <div className={`inline-flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl ${getBiasStyles(usdjpyData.bias).bg} ${getBiasStyles(usdjpyData.bias).border} border mb-5 sm:mb-8`}>
                  {usdjpyData.bias === 'bullish' && (
                    <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  )}
                  {usdjpyData.bias === 'bearish' && (
                    <svg className="w-5 h-5 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0v-8m0 8l-8-8-4 4-6-6" />
                    </svg>
                  )}
                  {usdjpyData.bias === 'neutral' && (
                    <svg className="w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                    </svg>
                  )}
                  <span className={`text-sm font-bold ${getBiasStyles(usdjpyData.bias).text}`}>
                    {getBiasStyles(usdjpyData.bias).label}
                  </span>
                </div>
              )}

              <div className="rounded-2xl bg-zinc-950/60 border border-zinc-800/50 p-4 mb-6 overflow-hidden">
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-rose-500"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                  </div>
                  <span className="text-xs text-zinc-600 ml-2">Dashboard Preview</span>
                </div>
                <div className="h-20 relative">
                  <svg className="w-full h-full" viewBox="0 0 200 50" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="purpleGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="rgb(147, 51, 234)" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="rgb(147, 51, 234)" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <path d="M0,40 Q25,35 40,38 T80,28 T120,32 T160,22 T200,26" fill="none" stroke="rgb(147, 51, 234)" strokeWidth="2.5" />
                    <path d="M0,40 Q25,35 40,38 T80,28 T120,32 T160,22 T200,26 L200,50 L0,50 Z" fill="url(#purpleGrad)" />
                  </svg>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-6">
                {[
                  { icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z', label: 'Charts' },
                  { icon: 'M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z', label: 'Pivots' },
                  { icon: 'M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z', label: 'News' },
                  { icon: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z', label: 'AI Insights' },
                ].map((item) => (
                  <span key={item.label} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-zinc-800/60 text-zinc-400 border border-zinc-700/30">
                    <svg className="w-3.5 h-3.5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                    </svg>
                    {item.label}
                  </span>
                ))}
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-zinc-800/50">
                <div className="flex items-center text-purple-400 text-sm font-semibold group-hover:text-purple-300 transition-colors">
                  <span>Open Dashboard</span>
                  <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </div>
                <span className="text-xs text-zinc-600">24/7 Markets</span>
              </div>
            </div>
          </Link>

          {/* NIFTY Card - Coming Soon */}
          <div className="group block">
            <div className="bg-zinc-900/80 backdrop-blur-sm rounded-2xl sm:rounded-3xl p-5 sm:p-8 h-full border border-zinc-800/50 relative overflow-hidden opacity-80">
              <div className="absolute -top-20 -right-20 w-40 h-40 bg-cyan-500/20 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

              <div className="flex items-start justify-between mb-5 sm:mb-8 relative">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <svg className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-xs text-zinc-500 uppercase tracking-wider font-medium">Stock Index</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-white">NIFTY 50</h2>
                </div>
                <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/30">
                  <svg className="w-5 h-5 sm:w-7 sm:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
              </div>

              {/* Coming Soon */}
              <div className="mb-8">
                <div className="text-4xl font-bold text-white mb-3">Coming Soon</div>
                <p className="text-zinc-500 text-sm">
                  NIFTY 50 dashboard is under development. Stay tuned for real-time Indian market insights.
                </p>
              </div>

              <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 mb-8">
                <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm font-bold text-cyan-400">IN DEVELOPMENT</span>
              </div>

              <div className="rounded-2xl bg-zinc-950/60 border border-zinc-800/50 p-4 mb-6 overflow-hidden">
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-rose-500"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                  </div>
                  <span className="text-xs text-zinc-600 ml-2">Dashboard Preview</span>
                </div>
                <div className="h-20 relative">
                  <svg className="w-full h-full" viewBox="0 0 200 50" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="cyanGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="rgb(6, 182, 212)" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="rgb(6, 182, 212)" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <path d="M0,30 Q30,40 50,32 T100,36 T140,20 T180,28 T200,22" fill="none" stroke="rgb(6, 182, 212)" strokeWidth="2.5" />
                    <path d="M0,30 Q30,40 50,32 T100,36 T140,20 T180,28 T200,22 L200,50 L0,50 Z" fill="url(#cyanGrad)" />
                  </svg>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-6">
                {[
                  { icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z', label: 'Charts' },
                  { icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6', label: 'Movers' },
                  { icon: 'M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6z', label: 'Sectors' },
                  { icon: 'M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z', label: 'News' },
                ].map((item) => (
                  <span key={item.label} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-zinc-800/60 text-zinc-400 border border-zinc-700/30">
                    <svg className="w-3.5 h-3.5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                    </svg>
                    {item.label}
                  </span>
                ))}
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-zinc-800/50">
                <div className="flex items-center text-zinc-500 text-sm font-semibold">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <span>Locked</span>
                </div>
                <span className="text-xs text-zinc-600">NSE India</span>
              </div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="max-w-4xl mx-auto px-2">
          <div className="text-center mb-8 sm:mb-12">
            <h3 className="text-xl sm:text-2xl font-bold text-white mb-2 sm:mb-3">Everything you need to trade smarter</h3>
            <p className="text-sm sm:text-base text-zinc-500">Professional-grade tools, simplified for everyday traders</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            {[
              { icon: 'M13 10V3L4 14h7v7l9-11h-7z', label: 'Real-time Data', desc: 'Live market feeds', color: 'emerald' },
              { icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z', label: 'Technical Analysis', desc: 'Charts & indicators', color: 'purple' },
              { icon: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z', label: 'AI Insights', desc: 'Smart summaries', color: 'amber' },
              { icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z', label: 'Secure', desc: 'Your data is safe', color: 'cyan' },
            ].map((feature) => (
              <div key={feature.label} className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800/50 hover:border-zinc-700/50 transition-colors">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${feature.color === 'emerald' ? 'bg-emerald-500/10' :
                  feature.color === 'purple' ? 'bg-purple-500/10' :
                    feature.color === 'amber' ? 'bg-amber-500/10' :
                      'bg-cyan-500/10'
                  }`}>
                  <svg className={`w-5 h-5 ${feature.color === 'emerald' ? 'text-emerald-400' :
                    feature.color === 'purple' ? 'text-purple-400' :
                      feature.color === 'amber' ? 'text-amber-400' :
                        'text-cyan-400'
                    }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={feature.icon} />
                  </svg>
                </div>
                <div className="text-xs sm:text-sm font-semibold text-white mb-1">{feature.label}</div>
                <div className="text-[10px] sm:text-xs text-zinc-500">{feature.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-12 sm:mt-20 text-center pb-4">
          <p className="text-xs text-zinc-600">
            Built for traders who demand more • Data from Yahoo Finance
          </p>
        </footer>
      </div>
    </div>
  );
}
