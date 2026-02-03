'use client';

import { useEffect, useState } from 'react';

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

function trendLabel(t: Trend): string {
    if (t === 'uptrend') return 'Uptrend';
    if (t === 'downtrend') return 'Downtrend';
    return 'Sideways';
}

function trendColor(t: Trend): string {
    if (t === 'uptrend') return 'text-emerald-400';
    if (t === 'downtrend') return 'text-red-400';
    return 'text-amber-400';
}

export default function IndicatorsCard() {
    const [data, setData] = useState<Indicators | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetch('/api/indicators')
            .then((res) => res.json())
            .then((json) => {
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
            <div className="text-zinc-500 text-sm animate-pulse">
                Loading RSI, EMA & trend…
            </div>
        );
    }
    if (error) {
        return (
            <p className="text-zinc-500 text-sm" role="status">
                {error}
            </p>
        );
    }
    if (!data) {
        return (
            <p className="text-zinc-500 text-sm">No indicator data.</p>
        );
    }

    return (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4" aria-label="USD/JPY technical indicators">
            <div className="bg-zinc-800/60 rounded-xl p-4 border border-zinc-700/50">
                <div className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Price</div>
                <div className="text-xl font-semibold text-zinc-50">{data.price.toFixed(3)}</div>
            </div>
            <div className="bg-zinc-800/60 rounded-xl p-4 border border-zinc-700/50">
                <div className="text-xs text-zinc-500 uppercase tracking-wider mb-1">RSI (14)</div>
                <div className="text-xl font-semibold text-zinc-50">{data.rsi.toFixed(1)}</div>
            </div>
            <div className="bg-zinc-800/60 rounded-xl p-4 border border-zinc-700/50">
                <div className="text-xs text-zinc-500 uppercase tracking-wider mb-1">EMA 20</div>
                <div className="text-xl font-semibold text-zinc-50">{data.ema20.toFixed(3)}</div>
            </div>
            <div className="bg-zinc-800/60 rounded-xl p-4 border border-zinc-700/50">
                <div className="text-xs text-zinc-500 uppercase tracking-wider mb-1">EMA 50</div>
                <div className="text-xl font-semibold text-zinc-50">{data.ema50.toFixed(3)}</div>
            </div>
            <div className="col-span-2 sm:col-span-4 flex items-center justify-between flex-wrap gap-2">
                <div>
                    <span className="text-xs text-zinc-500 uppercase tracking-wider">Trend </span>
                    <span className={`font-semibold ml-2 ${trendColor(data.trend)}`}>
                        {trendLabel(data.trend)}
                    </span>
                </div>
                {data.cached && (
                    <span className="text-xs text-zinc-600">Cached · 30m</span>
                )}
            </div>
        </div>
    );
}
