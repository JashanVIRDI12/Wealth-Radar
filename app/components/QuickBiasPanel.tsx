'use client';

import { useEffect, useState, useCallback } from 'react';
import { fetchWithCache, clearCache, type CacheKey } from '../lib/browserCache';

type IndicatorsResponse = {
    price: number;
    rsi: number;
    ema20: number;
    ema50: number;
    trend: 'uptrend' | 'downtrend' | 'sideways';
    priceChange: number;
    priceChangePercent: number;
    dayHigh: number;
    dayLow: number;
    lastUpdated: string;
    cached?: boolean;
};

type QuickStats = {
    currentPrice: number;
    priceChange: number;
    priceChangePercent: number;
    priceVsEMA20: 'above' | 'below';
    priceVsEMA20Pct: number;
    rsi: number;
    rsiZone: 'overbought' | 'oversold' | 'neutral';
    emaCross: 'bullish' | 'bearish';
    trend: 'uptrend' | 'downtrend' | 'sideways';
    dailyBias: 'buy' | 'sell' | 'hold';
    dayHigh: number;
    dayLow: number;
};

function calculateQuickStats(data: IndicatorsResponse): QuickStats {
    const priceVsEMA20 = data.price > data.ema20 ? 'above' : 'below';
    const priceVsEMA20Pct = ((data.price - data.ema20) / data.ema20) * 100;

    let rsiZone: 'overbought' | 'oversold' | 'neutral' = 'neutral';
    if (data.rsi >= 70) rsiZone = 'overbought';
    else if (data.rsi <= 30) rsiZone = 'oversold';

    const emaCross = data.ema20 > data.ema50 ? 'bullish' : 'bearish';

    // Calculate daily bias
    let bullishSignals = 0;
    let bearishSignals = 0;

    if (priceVsEMA20 === 'above') bullishSignals++;
    else bearishSignals++;

    if (emaCross === 'bullish') bullishSignals++;
    else bearishSignals++;

    if (data.rsi > 50 && data.rsi < 70) bullishSignals++;
    else if (data.rsi < 50 && data.rsi > 30) bearishSignals++;

    if (data.trend === 'uptrend') bullishSignals++;
    else if (data.trend === 'downtrend') bearishSignals++;

    let dailyBias: 'buy' | 'sell' | 'hold' = 'hold';
    if (bullishSignals >= 3) dailyBias = 'buy';
    else if (bearishSignals >= 3) dailyBias = 'sell';

    return {
        currentPrice: data.price,
        priceChange: data.priceChange,
        priceChangePercent: data.priceChangePercent,
        priceVsEMA20,
        priceVsEMA20Pct,
        rsi: data.rsi,
        rsiZone,
        emaCross,
        trend: data.trend,
        dailyBias,
        dayHigh: data.dayHigh,
        dayLow: data.dayLow,
    };
}

type QuickBiasPanelProps = {
    apiUrl?: string;
    cacheKey?: CacheKey;
    decimalPlaces?: number;
};

export default function QuickBiasPanel({
    apiUrl = '/api/indicators-free',
    cacheKey = 'indicatorsFree',
    decimalPlaces = 2,
}: QuickBiasPanelProps) {
    const [stats, setStats] = useState<QuickStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [countdown, setCountdown] = useState(120);

    const fetchData = useCallback(async (forceRefresh = false) => {
        try {
            if (forceRefresh) {
                clearCache(cacheKey);
            }

            const { data } = await fetchWithCache<IndicatorsResponse>(cacheKey, apiUrl);

            if (data.price) {
                setStats(calculateQuickStats(data));
            }
        } catch (err) {
            console.error('Failed to fetch indicators', err);
        } finally {
            setLoading(false);
            setCountdown(60);
        }
    }, [apiUrl, cacheKey]);

    // Initial fetch
    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Auto-refresh every 1 minute
    useEffect(() => {
        const refreshInterval = setInterval(() => {
            fetchData(true);
        }, 120000); // 2 minutes

        return () => clearInterval(refreshInterval);
    }, [fetchData]);

    // Countdown timer
    useEffect(() => {
        const countdownInterval = setInterval(() => {
            setCountdown(prev => (prev > 0 ? prev - 1 : 120));
        }, 1000);

        return () => clearInterval(countdownInterval);
    }, []);

    if (loading) {
        return (
            <div className="flex items-center gap-4 p-3 rounded-xl bg-zinc-800/50 animate-pulse">
                <div className="h-10 w-24 bg-zinc-700/50 rounded-lg"></div>
                <div className="h-6 w-32 bg-zinc-700/50 rounded"></div>
            </div>
        );
    }

    if (!stats) return null;

    const getBiasGradient = () => {
        if (stats.dailyBias === 'buy') return 'from-emerald-500 to-teal-600';
        if (stats.dailyBias === 'sell') return 'from-red-500 to-rose-600';
        return 'from-amber-500 to-orange-600';
    };

    const getBiasIcon = () => {
        if (stats.dailyBias === 'buy') return '↑';
        if (stats.dailyBias === 'sell') return '↓';
        return '—';
    };

    const getPriceChangeColor = () => {
        if (stats.priceChange > 0) return 'text-emerald-400';
        if (stats.priceChange < 0) return 'text-red-400';
        return 'text-zinc-400';
    };

    return (
        <div className="flex items-center gap-4 flex-wrap">
            {/* Main Bias Badge */}
            <div className={`flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r ${getBiasGradient()} shadow-lg`}>
                <span className="text-2xl font-bold text-white">{getBiasIcon()}</span>
                <div>
                    <div className="text-xs text-white/70">Intraday Bias</div>
                    <div className="text-sm font-bold text-white uppercase">{stats.dailyBias}</div>
                </div>
            </div>

            {/* Quick Stats Pills */}
            <div className="flex items-center gap-2 flex-wrap">
                {/* RSI */}
                <div className={`px-3 py-1.5 rounded-lg border ${stats.rsiZone === 'overbought'
                    ? 'bg-red-500/10 border-red-500/30'
                    : stats.rsiZone === 'oversold'
                        ? 'bg-emerald-500/10 border-emerald-500/30'
                        : 'bg-zinc-800/50 border-zinc-700/30'
                    }`}>
                    <span className="text-xs text-zinc-500">RSI </span>
                    <span className={`text-sm font-medium ${stats.rsiZone === 'overbought' ? 'text-red-400' :
                        stats.rsiZone === 'oversold' ? 'text-emerald-400' : 'text-white'
                        }`}>{stats.rsi.toFixed(1)}</span>
                </div>

                {/* EMA Cross */}
                <div className={`px-3 py-1.5 rounded-lg border ${stats.emaCross === 'bullish'
                    ? 'bg-emerald-500/10 border-emerald-500/30'
                    : 'bg-red-500/10 border-red-500/30'
                    }`}>
                    <span className="text-xs text-zinc-500">EMA </span>
                    <span className={`text-sm font-medium ${stats.emaCross === 'bullish' ? 'text-emerald-400' : 'text-red-400'
                        }`}>{stats.emaCross === 'bullish' ? '20>50' : '20<50'}</span>
                </div>

                {/* Trend */}
                <div className={`px-3 py-1.5 rounded-lg border ${stats.trend === 'uptrend'
                    ? 'bg-emerald-500/10 border-emerald-500/30'
                    : stats.trend === 'downtrend'
                        ? 'bg-red-500/10 border-red-500/30'
                        : 'bg-amber-500/10 border-amber-500/30'
                    }`}>
                    <span className="text-xs text-zinc-500">Trend </span>
                    <span className={`text-sm font-medium ${stats.trend === 'uptrend' ? 'text-emerald-400' :
                        stats.trend === 'downtrend' ? 'text-red-400' : 'text-amber-400'
                        }`}>
                        {stats.trend === 'uptrend' ? '↑ Up' :
                            stats.trend === 'downtrend' ? '↓ Down' : '— Side'}
                    </span>
                </div>

                {/* High/Low */}
                <div className="px-3 py-1.5 rounded-lg bg-zinc-800/50 border border-zinc-700/30">
                    <span className="text-xs text-zinc-500">H </span>
                    <span className="text-sm font-medium text-emerald-400">{stats.dayHigh.toFixed(decimalPlaces)}</span>
                    <span className="text-xs text-zinc-600 mx-1">/</span>
                    <span className="text-xs text-zinc-500">L </span>
                    <span className="text-sm font-medium text-red-400">{stats.dayLow.toFixed(decimalPlaces)}</span>
                </div>
            </div>
        </div>
    );
}
