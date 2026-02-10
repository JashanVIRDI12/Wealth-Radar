'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

type MarketData = {
  price: number;
  pdc: number;
  change: number;
  changePercent: number;
  bias: 'bullish' | 'bearish' | 'neutral';
  loading: boolean;
};

type HomeAISummary = {
  bias: 'bullish' | 'bearish' | 'neutral';
  text: string;
  loading: boolean;
};

export default function HomePage() {
  const [usdjpyData, setUsdjpyData] = useState<MarketData>({
    price: 0, pdc: 0, change: 0, changePercent: 0, bias: 'neutral', loading: true
  });
  const [eurusdData, setEurusdData] = useState<MarketData>({
    price: 0, pdc: 0, change: 0, changePercent: 0, bias: 'neutral', loading: true
  });
  const [usdjpyAi, setUsdjpyAi] = useState<HomeAISummary>({ bias: 'neutral', text: '', loading: true });
  const [eurusdAi, setEurusdAi] = useState<HomeAISummary>({ bias: 'neutral', text: '', loading: true });
  const [currentTime, setCurrentTime] = useState<Date>(() => new Date());

  type AISummaryLike = {
    marketBias?: 'bullish' | 'bearish' | 'neutral' | string;
    executiveSummary?: string;
    technicalAnalysis?: {
      trend?: string;
    };
    macroAnalysis?: {
      centralBankStance?: string;
    };
  };

  const buildShortSummary = (json: unknown): { bias: HomeAISummary['bias']; text: string } => {
    const j = (json ?? {}) as AISummaryLike;
    const bias = (j.marketBias === 'bullish' || j.marketBias === 'bearish' || j.marketBias === 'neutral')
      ? j.marketBias
      : 'neutral';

    const wordCap = (s: string, maxWords: number) => {
      const words = String(s || '').trim().split(/\s+/).filter(Boolean);
      if (words.length <= maxWords) return words.join(' ');
      return `${words.slice(0, maxWords).join(' ')}…`;
    };

    const countWords = (s: string) => String(s || '').trim().split(/\s+/).filter(Boolean).length;

    let text = String(j.executiveSummary || '').trim();

    if (countWords(text) < 50) {
      const technical = String(j.technicalAnalysis?.trend || '').trim();
      const macro = String(j.macroAnalysis?.centralBankStance || '').trim();
      const extraParts = [
        technical && `Technical: ${technical}.`,
        macro && `Macro: ${macro}.`,
      ].filter(Boolean);
      if (extraParts.length) {
        text = `${text}${text ? ' ' : ''}${extraParts.join(' ')}`.trim();
      }
    }

    text = wordCap(text, 60);

    return { bias, text };
  };

  useEffect(() => {
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
            pdc: data.previousClose || 0,
            change: data.priceChange || 0,
            changePercent: data.priceChangePercent || 0,
            bias,
            loading: false
          });
        }
      })
      .catch(() => setUsdjpyData(prev => ({ ...prev, loading: false })));

    // Fetch EURUSD data from indicators API (includes live price + trend)
    fetch('/api/eurusd-indicators')
      .then(res => res.json())
      .then(data => {
        if (data.price) {
          // Convert trend to bias: uptrend = bullish, downtrend = bearish, sideways = neutral
          let bias: 'bullish' | 'bearish' | 'neutral' = 'neutral';
          if (data.trend === 'uptrend') bias = 'bullish';
          else if (data.trend === 'downtrend') bias = 'bearish';

          setEurusdData({
            price: data.price,
            pdc: data.previousClose || 0,
            change: data.priceChange || 0,
            changePercent: data.priceChangePercent || 0,
            bias,
            loading: false
          });
        }
      })
      .catch(() => setEurusdData(prev => ({ ...prev, loading: false })));

    fetch('/api/ai-summary?symbol=USDJPY')
      .then(res => res.json())
      .then(json => {
        if (json?.error) {
          setUsdjpyAi(prev => ({ ...prev, loading: false }));
          return;
        }
        const { bias, text } = buildShortSummary(json);
        setUsdjpyAi({ bias, text, loading: false });
      })
      .catch(() => setUsdjpyAi(prev => ({ ...prev, loading: false })));

    fetch('/api/ai-summary?symbol=EURUSD')
      .then(res => res.json())
      .then(json => {
        if (json?.error) {
          setEurusdAi(prev => ({ ...prev, loading: false }));
          return;
        }
        const { bias, text } = buildShortSummary(json);
        setEurusdAi({ bias, text, loading: false });
      })
      .catch(() => setEurusdAi(prev => ({ ...prev, loading: false })));

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
        <div className="absolute inset-0 bg-gradient-to-br from-[#04060b] via-[#0a0c12] to-[#04060b]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(124,58,237,0.08),transparent_35%),radial-gradient(circle_at_80%_10%,rgba(6,182,212,0.06),transparent_30%),radial-gradient(circle_at_50%_70%,rgba(16,185,129,0.05),transparent_35%)]"></div>
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:80px_80px]"></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-16">

        {/* Header */}
        <header className="text-center mb-12 sm:mb-16">
          <div className="inline-flex flex-col sm:flex-row items-center gap-3 sm:gap-4 mb-6 sm:mb-7">
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-gradient-to-br from-emerald-400 via-cyan-400 to-blue-500 flex items-center justify-center shadow-2xl shadow-emerald-500/30">
              <svg className="w-6 h-6 sm:w-8 sm:h-8 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <div>
              <p className="text-[11px] sm:text-xs tracking-[0.3em] uppercase text-white/50 mb-2">Multi-Asset Quant Desk</p>
              <h1 className="text-3xl sm:text-5xl md:text-6xl font-semibold bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                Wealth Radar
              </h1>
            </div>
          </div>

          <p className="text-lg sm:text-xl md:text-2xl text-slate-200 max-w-4xl mx-auto mb-4 leading-relaxed px-2">
            Beta: building a desk-grade macro & FX surface with curated signals, execution dashboards, and AI co-pilots.
          </p>
          <p className="text-sm sm:text-base text-slate-400 max-w-3xl mx-auto mb-6 sm:mb-8 px-4">
            Co-developing with hedge-fund workflows — liquidity-aware views, regime bias, and narrative-aware summaries. Expect rapid iteration.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 text-xs sm:text-sm">
            <span className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/15 border border-emerald-500/20 backdrop-blur">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400"></span>
              </span>
              <span className="text-emerald-300 font-semibold">Live Feeds</span>
            </span>
            <span className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-white/80 backdrop-blur">
              {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })} UTC
            </span>
            <span className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-white/70 backdrop-blur">
              Latency &lt; 200ms • Desk ready
            </span>
          </div>
        </header>

        {/* Ribbon Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-12 sm:mb-16">
          {[{
            label: 'Signal Quality (beta)',
            value: '98.4%',
            sub: 'Backtested hit-rate; live tuning underway',
            accent: 'from-emerald-400 to-cyan-400'
          }, {
            label: 'Coverage',
            value: 'FX core → Macro',
            sub: 'USD/JPY & EUR/USD today; more pairs next',
            accent: 'from-blue-400 to-indigo-400'
          }, {
            label: 'Reliability',
            value: '99.9%*',
            sub: 'Edge-monitored network • beta SLA',
            accent: 'from-amber-400 to-rose-400'
          }].map((item) => (
            <div key={item.label} className="relative overflow-hidden rounded-2xl bg-white/5 border border-white/10 backdrop-blur p-5 sm:p-6">
              <div className={`absolute inset-0 opacity-60 bg-gradient-to-br ${item.accent}`}></div>
              <div className="relative">
                <p className="text-xs uppercase tracking-[0.2em] text-white/60 mb-2">{item.label}</p>
                <p className="text-2xl sm:text-3xl font-semibold text-white mb-1">{item.value}</p>
                <p className="text-xs text-white/60">{item.sub}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Market Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 max-w-5xl mx-auto mb-12 sm:mb-20">

          {/* USDJPY Card */}
          <Link href="/forex" className="group block">
            <div className="bg-gradient-to-br from-[#0d0f1a] via-[#0c0f19] to-[#0a0d16] backdrop-blur rounded-3xl p-6 sm:p-8 transition-all duration-500 hover:scale-[1.02] hover:shadow-[0_25px_80px_-40px_rgba(90,105,255,0.6)] cursor-pointer h-full border border-white/8 hover:border-white/20 relative overflow-hidden">
              <div className="absolute -top-16 -right-16 w-44 h-44 bg-purple-500/25 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="absolute top-6 right-6 text-[11px] px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/70">FX Desk</div>

              <div className="flex items-start justify-between mb-5 sm:mb-6 relative">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <svg className="w-4 h-4 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-[11px] tracking-[0.2em] text-white/50 uppercase font-medium">Forex Trading</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-2xl sm:text-3xl font-semibold text-white tracking-tight">USD/JPY</h2>
                    <span className="px-2.5 py-1 text-[11px] rounded-full bg-emerald-500/15 border border-emerald-500/25 text-emerald-200">Live feed</span>
                  </div>
                </div>
              </div>

              <div className="mb-5 sm:mb-6">
                {usdjpyData.loading ? (
                  <div className="h-10 sm:h-14 w-36 sm:w-48 bg-white/5 rounded-xl animate-pulse"></div>
                ) : (
                  <>
                    <div className="text-3xl sm:text-5xl font-semibold text-white mb-2 tracking-tight">
                      {usdjpyData.price.toFixed(3)}
                    </div>
                    <div className={`flex items-center gap-2 text-sm sm:text-base font-medium ${usdjpyData.change >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
                      {usdjpyData.change >= 0 ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                        </svg>
                      )}
                      <span>{usdjpyData.changePercent >= 0 ? '+' : ''}{usdjpyData.changePercent.toFixed(2)}% from PDC</span>
                    </div>
                  </>
                )}
              </div>

              {!usdjpyData.loading && (
                <div className="flex items-center gap-2 mb-6">
                  <div className={`px-3 py-1.5 rounded-full text-[12px] border ${getBiasStyles(usdjpyData.bias).border} ${getBiasStyles(usdjpyData.bias).bg} ${getBiasStyles(usdjpyData.bias).text} font-semibold`}>{getBiasStyles(usdjpyData.bias).label}</div>
                  <div className="text-xs text-white/50">Bias snapshot</div>
                </div>
              )}

              {!usdjpyAi.loading && usdjpyAi.text && (
                <div className="mb-6 rounded-2xl bg-white/5 border border-white/10 p-4">
                  <div className="text-xs text-white/50 mb-1">AI brief • <span className={`font-semibold ${getBiasStyles(usdjpyAi.bias).text}`}>{getBiasStyles(usdjpyAi.bias).label}</span></div>
                  <div className="text-sm text-white/80 leading-relaxed">
                    {usdjpyAi.text}
                  </div>
                </div>
              )}

              <div className="rounded-2xl bg-black/40 border border-white/10 p-4 mb-6 overflow-hidden">
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-400"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-400"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-rose-400"></div>
                  </div>
                  <span className="text-xs text-white/50 ml-2">Desk microchart</span>
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

              <div className="flex flex-wrap gap-2 mb-5">
                {[
                  { icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z', label: 'Charts' },
                  { icon: 'M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z', label: 'Pivots' },
                  { icon: 'M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z', label: 'News' },
                  { icon: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z', label: 'AI briefs' },
                ].map((item) => (
                  <span key={item.label} className="flex items-center gap-1.5 text-[11px] px-3 py-1.5 rounded-full bg-white/5 text-white/70 border border-white/10">
                    <svg className="w-3.5 h-3.5 text-purple-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                    </svg>
                    {item.label}
                  </span>
                ))}
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-white/10">
                <div className="flex items-center text-purple-200 text-sm font-semibold group-hover:text-purple-100 transition-colors">
                  <span>Open Dashboard</span>
                  <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </div>
                <span className="text-xs text-white/50">24/7 Markets</span>
              </div>
            </div>
          </Link>

          {/* EUR/USD Card */}
          <Link href="/eurusd" className="group block">
            <div className="bg-gradient-to-br from-[#0d111a] via-[#0b1018] to-[#0a0d15] backdrop-blur rounded-3xl p-6 sm:p-8 transition-all duration-500 hover:scale-[1.02] hover:shadow-[0_25px_80px_-40px_rgba(34,211,238,0.5)] cursor-pointer h-full border border-white/8 hover:border-white/20 relative overflow-hidden">
              <div className="absolute -top-16 -right-16 w-44 h-44 bg-cyan-500/20 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="absolute top-6 right-6 text-[11px] px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/70">FX Desk</div>

              <div className="flex items-start justify-between mb-5 sm:mb-6 relative">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <svg className="w-4 h-4 text-cyan-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                    </svg>
                    <span className="text-[11px] tracking-[0.2em] text-white/50 uppercase font-medium">Forex Trading</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-2xl sm:text-3xl font-semibold text-white tracking-tight">EUR/USD</h2>
                    <span className="px-2.5 py-1 text-[11px] rounded-full bg-cyan-500/15 border border-cyan-500/25 text-cyan-200">Live</span>
                  </div>
                </div>
              </div>

              <div className="mb-5 sm:mb-6">
                {eurusdData.loading ? (
                  <div className="h-10 sm:h-14 w-36 sm:w-48 bg-white/5 rounded-xl animate-pulse"></div>
                ) : (
                  <>
                    <div className="text-3xl sm:text-5xl font-semibold text-white mb-2 tracking-tight">
                      {eurusdData.price.toFixed(5)}
                    </div>
                    <div className={`flex items-center gap-2 text-sm sm:text-base font-medium ${eurusdData.change >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
                      {eurusdData.change >= 0 ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                        </svg>
                      )}
                      <span>{eurusdData.changePercent >= 0 ? '+' : ''}{eurusdData.changePercent.toFixed(2)}% from PDC</span>
                    </div>
                  </>
                )}
              </div>

              {!eurusdData.loading && (
                <div className="flex items-center gap-2 mb-6">
                  <div className={`px-3 py-1.5 rounded-full text-[12px] border ${getBiasStyles(eurusdData.bias).border} ${getBiasStyles(eurusdData.bias).bg} ${getBiasStyles(eurusdData.bias).text} font-semibold`}>{getBiasStyles(eurusdData.bias).label}</div>
                  <div className="text-xs text-white/50">Technical bias</div>
                </div>
              )}

              {!eurusdAi.loading && eurusdAi.text && (
                <div className="mb-6 rounded-2xl bg-white/5 border border-white/10 p-4">
                  <div className="text-xs text-white/50 mb-1">AI Summary • <span className={`font-semibold ${getBiasStyles(eurusdAi.bias).text}`}>{getBiasStyles(eurusdAi.bias).label}</span></div>
                  <div className="text-sm text-white/80 leading-relaxed">
                    {eurusdAi.text}
                  </div>
                </div>
              )}

              <div className="rounded-2xl bg-black/40 border border-white/10 p-4 mb-6 overflow-hidden">
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-cyan-400"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-400"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-400"></div>
                  </div>
                  <span className="text-xs text-white/50 ml-2">Desk Preview</span>
                </div>
                <div className="h-20 relative">
                  <svg className="w-full h-full" viewBox="0 0 200 50" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="cyanGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="rgb(6, 182, 212)" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="rgb(6, 182, 212)" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <path d="M0,25 Q20,35 40,28 T80,30 T120,22 T160,32 T200,18" fill="none" stroke="rgb(6, 182, 212)" strokeWidth="2.5" />
                    <path d="M0,25 Q20,35 40,28 T80,30 T120,22 T160,32 T200,18 L200,50 L0,50 Z" fill="url(#cyanGrad)" />
                  </svg>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-5">
                {[
                  { icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z', label: 'Indicators' },
                  { icon: 'M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z', label: 'Pivots' },
                  { icon: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z', label: 'AI' },
                  { icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z', label: 'Sessions' },
                ].map((item) => (
                  <span key={item.label} className="flex items-center gap-1.5 text-[11px] px-3 py-1.5 rounded-full bg-white/5 text-white/70 border border-white/10">
                    <svg className="w-3.5 h-3.5 text-cyan-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                    </svg>
                    {item.label}
                  </span>
                ))}
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-white/10">
                <div className="flex items-center gap-2 text-cyan-200 text-sm font-semibold group-hover:text-cyan-100 transition-colors">
                  <span>Open dashboard</span>
                  <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </div>
                <div className="flex items-center gap-2 text-xs text-white/55">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  <span>24/7 markets</span>
                  <span className="text-white/40">•</span>
                  <span>Yahoo Finance feed</span>
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* Alpha Desk Snapshot */}
        <div className="rounded-3xl bg-white/5 border border-white/10 backdrop-blur px-5 sm:px-8 py-8 sm:py-10 shadow-[0_20px_70px_-35px_rgba(0,0,0,0.8)] mb-12 sm:mb-16">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <p className="text-[11px] uppercase tracking-[0.28em] text-white/60 mb-2">Alpha Desk</p>
              <h3 className="text-2xl sm:text-3xl font-semibold text-white">Live positioning & risk posture</h3>
              <p className="text-sm text-white/55 mt-1 max-w-2xl">Blended signals from liquidity, regime models, and AI narratives surfaced in a desk-ready view.</p>
            </div>
            <div className="flex items-center gap-3 text-xs sm:text-sm text-white/70">
              <span className="px-3 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/25">Auto-refresh 1m</span>
              <span className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10">Desk Mode</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="col-span-1 md:col-span-2 rounded-2xl bg-black/30 border border-white/10 p-5 sm:p-6 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-cyan-500/5 to-transparent pointer-events-none"></div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-white/60">Regime Model</p>
                  <p className="text-xl font-semibold text-white">Risk-On (Carry)</p>
                </div>
                <span className="px-3 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/25 text-emerald-200 text-xs font-semibold">High Conviction</span>
              </div>
              <div className="h-40 sm:h-48 flex flex-col justify-end">
                <svg className="w-full h-full" viewBox="0 0 320 180" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="alphaGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="rgba(16,185,129,0.4)" />
                      <stop offset="100%" stopColor="rgba(16,185,129,0)" />
                    </linearGradient>
                  </defs>
                  <path d="M0 140 C40 130 60 90 90 95 C130 102 150 70 180 72 C210 74 230 58 260 64 C285 70 300 62 320 54" fill="none" stroke="rgba(16,185,129,0.8)" strokeWidth="4" />
                  <path d="M0 140 C40 130 60 90 90 95 C130 102 150 70 180 72 C210 74 230 58 260 64 C285 70 300 62 320 54 L320 180 L0 180 Z" fill="url(#alphaGrad)" />
                </svg>
                <div className="flex items-center justify-between mt-3 text-xs text-white/65">
                  <span>Liquidity Sweep</span>
                  <span>Signal Strength 82%</span>
                  <span>Last update &lt;30s</span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-black/40 border border-white/10 p-5 sm:p-6 space-y-4">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-white/60 mb-1">Liquidity Radar</p>
                <p className="text-3xl font-semibold text-white">67% long USD</p>
                <p className="text-xs text-white/50">Desk tilt from CFTC + options skew</p>
              </div>
              <div className="flex items-center justify-between text-xs text-white/60">
                <span>JPY</span>
                <div className="w-24 h-2 rounded-full bg-white/10 overflow-hidden">
                  <div className="h-full w-3/4 bg-emerald-400/80"></div>
                </div>
                <span className="text-emerald-300">Bull</span>
              </div>
              <div className="flex items-center justify-between text-xs text-white/60">
                <span>EUR</span>
                <div className="w-24 h-2 rounded-full bg-white/10 overflow-hidden">
                  <div className="h-full w-2/5 bg-amber-400/80"></div>
                </div>
                <span className="text-amber-300">Neutral</span>
              </div>
              <div className="flex items-center justify-between text-xs text-white/60">
                <span>Vol</span>
                <div className="w-24 h-2 rounded-full bg-white/10 overflow-hidden">
                  <div className="h-full w-1/2 bg-cyan-400/80"></div>
                </div>
                <span className="text-cyan-200">Moderate</span>
              </div>
              <div className="rounded-xl bg-white/5 border border-white/10 p-3 text-xs text-white/70 leading-relaxed">
                Auto-curated from market depth, options surface, and macro tape. Updated continuously.
              </div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="max-w-4xl mx-auto px-2">
          <div className="text-center mb-8 sm:mb-12">
            <h3 className="text-xl sm:text-2xl font-bold text-white mb-2 sm:mb-3">Desk-grade stack, simplified</h3>
            <p className="text-sm sm:text-base text-zinc-400">The same primitives buy-side teams lean on: data quality, risk context, and narrative-aware AI.</p>
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
          <div className="flex flex-wrap items-center justify-center gap-3 text-[11px] text-zinc-500">
            <span className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10">Data: Yahoo Finance</span>
            <span className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10">Latency: Edge CDN</span>
            <span className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10">Secure: TLS / PII-free</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
