'use client';

import { useEffect, useState, useCallback } from 'react';
import { fetchWithCache, clearCache } from '../lib/browserCache';

type TimeframeBias = {
    timeframe: string;
    label: string;
    bias: 'bullish' | 'bearish' | 'neutral';
    strength: number;
    price: number;
    ema20: number;
    ema50: number;
    rsi: number;
    priceVsEma: 'above' | 'below';
    emaCross: 'bullish' | 'bearish';
    trend: 'up' | 'down' | 'sideways';
};

type MTFData = {
    timeframes: TimeframeBias[];
    alignment: {
        direction: 'bullish' | 'bearish' | 'mixed';
        percentage: number;
        score: number;
        recommendation: string;
    };
    lastUpdated: string;
    cached?: boolean;
    stale?: boolean;
};

export default function MTFAlignmentCard() {
    const [data, setData] = useState<MTFData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(async (forceRefresh = false) => {
        try {
            if (forceRefresh) {
                clearCache('mtf');
            }

            const { data: json } = await fetchWithCache<MTFData>('mtf', '/api/mtf');

            if (json.timeframes) {
                setData(json);
                setError(null);
            } else {
                setError('Invalid MTF data');
            }
        } catch (err) {
            setError('Failed to load MTF data');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
        const interval = setInterval(() => fetchData(true), 120000); // 2 min refresh
        return () => clearInterval(interval);
    }, [fetchData]);

    if (loading) {
        return (
            <div className="space-y-3">
                <div className="h-20 bg-zinc-800/30 rounded-xl animate-pulse"></div>
                <div className="space-y-2">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="h-16 bg-zinc-800/30 rounded-lg animate-pulse"></div>
                    ))}
                </div>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                {error || 'Unable to load MTF data'}
            </div>
        );
    }

    const getAlignmentGradient = () => {
        if (data.alignment.direction === 'bullish') return 'from-emerald-500 to-teal-600';
        if (data.alignment.direction === 'bearish') return 'from-red-500 to-rose-600';
        return 'from-amber-500 to-orange-600';
    };

    const getAlignmentLabel = () => {
        if (data.alignment.direction === 'bullish') return 'BULLISH';
        if (data.alignment.direction === 'bearish') return 'BEARISH';
        return 'MIXED';
    };

    const getBiasColor = (bias: string) => {
        if (bias === 'bullish') return 'text-emerald-400';
        if (bias === 'bearish') return 'text-red-400';
        return 'text-amber-400';
    };

    const getBiasBg = (bias: string) => {
        if (bias === 'bullish') return 'bg-emerald-500/10 border-emerald-500/30';
        if (bias === 'bearish') return 'bg-red-500/10 border-red-500/30';
        return 'bg-amber-500/10 border-amber-500/30';
    };

    const getTrendIcon = (trend: string) => {
        if (trend === 'up') return '↑';
        if (trend === 'down') return '↓';
        return '—';
    };

    const getStrengthBar = (strength: number, bias: string) => {
        const color = bias === 'bullish' ? 'bg-emerald-500' : bias === 'bearish' ? 'bg-red-500' : 'bg-amber-500';
        return (
            <div className="h-1.5 bg-zinc-700/50 rounded-full overflow-hidden flex-1">
                <div
                    className={`h-full ${color} rounded-full transition-all duration-500`}
                    style={{ width: `${strength}%` }}
                />
            </div>
        );
    };

    return (
        <div className="space-y-4">
            {/* Alignment Header */}
            <div className={`p-4 rounded-xl bg-gradient-to-r ${getAlignmentGradient()} shadow-lg`}>
                <div className="flex items-center justify-between">
                    <div>
                        <div className="text-xs text-white/70 uppercase tracking-wide">MTF Alignment</div>
                        <div className="text-xl font-bold text-white">{getAlignmentLabel()}</div>
                    </div>
                    <div className="text-right">
                        <div className="text-3xl font-bold text-white">
                            {data.alignment.percentage}%
                        </div>
                        <div className="text-xs text-white/70">aligned</div>
                    </div>
                </div>

                {/* Score Bar */}
                <div className="mt-3 relative h-2 bg-black/30 rounded-full overflow-hidden">
                    <div className="absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-red-500 to-amber-500 opacity-50"></div>
                    <div className="absolute inset-y-0 right-0 w-1/2 bg-gradient-to-r from-amber-500 to-emerald-500 opacity-50"></div>
                    <div
                        className="absolute top-0 w-3 h-2 bg-white rounded-full shadow transform -translate-x-1/2 transition-all duration-500"
                        style={{ left: `${(data.alignment.score + 100) / 2}%` }}
                    ></div>
                </div>
                <div className="flex justify-between mt-1 text-xs text-white/50">
                    <span>-100</span>
                    <span>0</span>
                    <span>+100</span>
                </div>
            </div>

            {/* Timeframe Details */}
            <div className="space-y-2">
                {data.timeframes.map((tf) => (
                    <div
                        key={tf.timeframe}
                        className={`p-3 rounded-xl border transition-all ${getBiasBg(tf.bias)}`}
                    >
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg font-bold ${getBiasColor(tf.bias)} bg-zinc-900/50`}>
                                    {getTrendIcon(tf.trend)}
                                </div>
                                <div>
                                    <div className="text-sm font-semibold text-white">{tf.label}</div>
                                    <div className="text-xs text-zinc-500">
                                        EMA {tf.emaCross === 'bullish' ? '20>50' : '20<50'} • RSI {tf.rsi}
                                    </div>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className={`text-sm font-bold ${getBiasColor(tf.bias)}`}>
                                    {tf.bias.toUpperCase()}
                                </div>
                                <div className="text-xs text-zinc-500">
                                    {tf.priceVsEma === 'above' ? '↑ Above' : '↓ Below'} EMA20
                                </div>
                            </div>
                        </div>

                        {/* Strength Bar */}
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-zinc-500 w-14">Strength</span>
                            {getStrengthBar(tf.strength, tf.bias)}
                            <span className={`text-xs font-medium w-8 text-right ${getBiasColor(tf.bias)}`}>
                                {tf.strength}%
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Recommendation */}
            <div className="p-3 rounded-xl bg-zinc-800/30 border border-zinc-700/20">
                <p className="text-sm text-zinc-300">{data.alignment.recommendation}</p>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-center gap-2 text-xs text-zinc-600">
                <span>Yahoo Finance</span>
                <span>•</span>
                <span>2-min refresh</span>
                <span>•</span>
                <span className="text-emerald-400">Free</span>
            </div>
        </div>
    );
}
