'use client';

import { useEffect, useState } from 'react';
import { fetchWithCache } from '../lib/browserCache';

type Trend = 'uptrend' | 'downtrend' | 'sideways';

type Indicators = {
    price: number;
    rsi: number;
    ema20: number;
    ema50: number;
    trend: Trend;
    lastUpdated: string;
    cached?: boolean;
};

type IndicatorsResponse = Indicators & { error?: string };

function trendLabel(t: Trend): string {
    if (t === 'uptrend') return 'Bullish';
    if (t === 'downtrend') return 'Bearish';
    return 'Neutral';
}

function trendIcon(t: Trend): React.ReactNode {
    if (t === 'uptrend') {
        return (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
        );
    }
    if (t === 'downtrend') {
        return (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
            </svg>
        );
    }
    return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
        </svg>
    );
}

function trendColor(t: Trend): string {
    if (t === 'uptrend') return 'from-emerald-500 to-teal-500';
    if (t === 'downtrend') return 'from-red-500 to-rose-500';
    return 'from-amber-500 to-orange-500';
}

function trendTextColor(t: Trend): string {
    if (t === 'uptrend') return 'text-emerald-400';
    if (t === 'downtrend') return 'text-red-400';
    return 'text-amber-400';
}

function getRsiStatus(rsi: number): { label: string; color: string } {
    if (rsi >= 70) return { label: 'Overbought', color: 'text-red-400' };
    if (rsi <= 30) return { label: 'Oversold', color: 'text-emerald-400' };
    return { label: 'Neutral', color: 'text-zinc-400' };
}

export default function IndicatorsCard() {
    const [data, setData] = useState<Indicators | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [browserCached, setBrowserCached] = useState(false);

    useEffect(() => {
        fetchWithCache<IndicatorsResponse>('indicators', '/api/indicators')
            .then(({ data: json, fromBrowserCache }) => {
                setBrowserCached(fromBrowserCache);
                if (json.error && !json.price) {
                    setError(json.error);
                    return;
                }
                setData({
                    price: json.price,
                    rsi: json.rsi,
                    ema20: json.ema20,
                    ema50: json.ema50,
                    trend: json.trend,
                    lastUpdated: json.lastUpdated,
                    cached: json.cached,
                });
            })
            .catch(() => setError('Failed to load indicators'))
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="bg-zinc-800/40 rounded-xl p-4 animate-pulse">
                        <div className="h-3 bg-zinc-700/50 rounded w-16 mb-2"></div>
                        <div className="h-6 bg-zinc-700/50 rounded w-20"></div>
                    </div>
                ))}
            </div>
        );
    }
    if (error) {
        return (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                {error}
            </div>
        );
    }
    if (!data) {
        return (
            <div className="p-4 rounded-xl bg-zinc-800/40 text-zinc-500 text-sm">
                No indicator data available.
            </div>
        );
    }

    const rsiStatus = getRsiStatus(data.rsi);

    return (
        <div className="space-y-4">
            {/* Indicator Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {/* Price */}
                <div className="stat-card bg-zinc-800/40 rounded-xl p-4 border border-zinc-700/30 hover:border-violet-500/30 transition-all">
                    <div className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Price</div>
                    <div className="text-xl font-bold text-white">{data.price.toFixed(3)}</div>
                </div>

                {/* RSI */}
                <div className="stat-card bg-zinc-800/40 rounded-xl p-4 border border-zinc-700/30 hover:border-violet-500/30 transition-all">
                    <div className="text-xs text-zinc-500 uppercase tracking-wider mb-1">RSI (14)</div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-xl font-bold text-white">{data.rsi.toFixed(1)}</span>
                        <span className={`text-xs ${rsiStatus.color}`}>{rsiStatus.label}</span>
                    </div>
                </div>

                {/* EMA 20 */}
                <div className="stat-card bg-zinc-800/40 rounded-xl p-4 border border-zinc-700/30 hover:border-violet-500/30 transition-all">
                    <div className="text-xs text-zinc-500 uppercase tracking-wider mb-1">EMA 20</div>
                    <div className="text-xl font-bold text-white">{data.ema20.toFixed(3)}</div>
                </div>

                {/* EMA 50 */}
                <div className="stat-card bg-zinc-800/40 rounded-xl p-4 border border-zinc-700/30 hover:border-violet-500/30 transition-all">
                    <div className="text-xs text-zinc-500 uppercase tracking-wider mb-1">EMA 50</div>
                    <div className="text-xl font-bold text-white">{data.ema50.toFixed(3)}</div>
                </div>

                {/* Trend */}
                <div className={`stat-card rounded-xl p-4 border border-zinc-700/30 bg-gradient-to-br ${trendColor(data.trend)} bg-opacity-10 transition-all`}
                    style={{ background: `linear-gradient(135deg, ${data.trend === 'uptrend' ? 'rgba(16, 185, 129, 0.15)' : data.trend === 'downtrend' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)'} 0%, transparent 100%)` }}>
                    <div className="text-xs text-zinc-400 uppercase tracking-wider mb-1">Trend</div>
                    <div className={`flex items-center gap-2 ${trendTextColor(data.trend)}`}>
                        {trendIcon(data.trend)}
                        <span className="text-lg font-bold">{trendLabel(data.trend)}</span>
                    </div>
                </div>
            </div>

            {/* Cache Status Footer */}
            <div className="flex items-center justify-end gap-3 text-xs">
                {browserCached && (
                    <span className="flex items-center gap-1 text-blue-400">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                        </svg>
                        Browser cached
                    </span>
                )}
                {data.cached && (
                    <span className="text-zinc-600">Server • 30m</span>
                )}
            </div>
        </div>
    );
}
