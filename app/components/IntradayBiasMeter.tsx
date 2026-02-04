'use client';

import { useEffect, useState, useCallback } from 'react';
import { fetchWithCache, clearCache } from '../lib/browserCache';

type BiasData = {
    overallBias: 'bullish' | 'bearish' | 'neutral';
    biasScore: number; // -100 to +100
    signals: {
        name: string;
        signal: 'bullish' | 'bearish' | 'neutral';
        weight: number;
        reason: string;
    }[];
    keyLevel: {
        type: 'support' | 'resistance' | 'pivot';
        level: number;
        distance: number;
        distancePercent: number;
    };
    recommendation: string;
    price: number;
    lastUpdated: string;
};

type IndicatorsResponse = {
    price: number;
    rsi: number;
    ema20: number;
    ema50: number;
    sma20: number;
    sma50: number;
    trend: 'uptrend' | 'downtrend' | 'sideways';
    priceChange: number;
    priceChangePercent: number;
    dayHigh: number;
    dayLow: number;
    lastUpdated: string;
    cached?: boolean;
    stale?: boolean;
    source: 'yahoo_finance';
};

function calculateBias(indicators: IndicatorsResponse): BiasData {
    const signals: BiasData['signals'] = [];
    let totalScore = 0;

    // 1. EMA Crossover Signal (weight: 30)
    const emaCrossover = indicators.ema20 > indicators.ema50;
    signals.push({
        name: 'EMA Crossover',
        signal: emaCrossover ? 'bullish' : 'bearish',
        weight: 30,
        reason: emaCrossover
            ? `EMA 20 (${indicators.ema20.toFixed(2)}) > EMA 50 (${indicators.ema50.toFixed(2)})`
            : `EMA 20 (${indicators.ema20.toFixed(2)}) < EMA 50 (${indicators.ema50.toFixed(2)})`,
    });
    totalScore += emaCrossover ? 30 : -30;

    // 2. Price vs EMA Signal (weight: 25)
    const priceAboveEMA = indicators.price > indicators.ema20;
    signals.push({
        name: 'Price vs EMA',
        signal: priceAboveEMA ? 'bullish' : 'bearish',
        weight: 25,
        reason: priceAboveEMA
            ? `Price above EMA 20 (${indicators.ema20.toFixed(2)})`
            : `Price below EMA 20 (${indicators.ema20.toFixed(2)})`,
    });
    totalScore += priceAboveEMA ? 25 : -25;

    // 3. RSI Signal (weight: 25)
    let rsiSignal: 'bullish' | 'bearish' | 'neutral' = 'neutral';
    let rsiScore = 0;
    if (indicators.rsi > 50 && indicators.rsi < 70) {
        rsiSignal = 'bullish';
        rsiScore = 25;
    } else if (indicators.rsi < 50 && indicators.rsi > 30) {
        rsiSignal = 'bearish';
        rsiScore = -25;
    } else if (indicators.rsi >= 70) {
        rsiSignal = 'bearish'; // Overbought = expect pullback
        rsiScore = -15;
    } else if (indicators.rsi <= 30) {
        rsiSignal = 'bullish'; // Oversold = expect bounce
        rsiScore = 15;
    }
    signals.push({
        name: 'RSI Momentum',
        signal: rsiSignal,
        weight: 25,
        reason: `RSI at ${indicators.rsi.toFixed(1)} ${indicators.rsi >= 70 ? '(overbought)' : indicators.rsi <= 30 ? '(oversold)' : ''}`,
    });
    totalScore += rsiScore;

    // 4. Trend Alignment (weight: 20)
    const trendSignal = indicators.trend === 'uptrend' ? 'bullish' : indicators.trend === 'downtrend' ? 'bearish' : 'neutral';
    const trendScore = indicators.trend === 'uptrend' ? 20 : indicators.trend === 'downtrend' ? -20 : 0;
    signals.push({
        name: 'Trend Direction',
        signal: trendSignal,
        weight: 20,
        reason: `Price action shows ${indicators.trend}`,
    });
    totalScore += trendScore;

    // Calculate overall bias
    let overallBias: BiasData['overallBias'] = 'neutral';
    if (totalScore >= 30) overallBias = 'bullish';
    else if (totalScore <= -30) overallBias = 'bearish';

    // Calculate key level (using EMAs as levels)
    const nearestLevel = Math.abs(indicators.price - indicators.ema20) < Math.abs(indicators.price - indicators.ema50)
        ? { type: 'support' as const, level: indicators.ema20 }
        : { type: 'support' as const, level: indicators.ema50 };

    const distance = indicators.price - nearestLevel.level;
    const distancePercent = (distance / indicators.price) * 100;

    // Generate recommendation
    let recommendation = '';
    if (totalScore >= 50) {
        recommendation = 'Strong bullish bias. Look for long entries on pullbacks to EMA 20.';
    } else if (totalScore >= 30) {
        recommendation = 'Moderate bullish bias. Consider longs with tight stops below EMA 50.';
    } else if (totalScore <= -50) {
        recommendation = 'Strong bearish bias. Look for short entries on rallies to EMA 20.';
    } else if (totalScore <= -30) {
        recommendation = 'Moderate bearish bias. Consider shorts with stops above EMA 50.';
    } else {
        recommendation = 'Neutral/mixed signals. Wait for clearer direction or range-trade between EMAs.';
    }

    return {
        overallBias,
        biasScore: totalScore,
        signals,
        keyLevel: {
            type: distance > 0 ? 'support' : 'resistance',
            level: nearestLevel.level,
            distance: Math.abs(distance),
            distancePercent: Math.abs(distancePercent),
        },
        recommendation,
        price: indicators.price,
        lastUpdated: indicators.lastUpdated,
    };
}

export default function IntradayBiasMeter() {
    const [bias, setBias] = useState<BiasData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [countdown, setCountdown] = useState(120);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const fetchData = useCallback(async (forceRefresh = false) => {
        try {
            if (forceRefresh) {
                clearCache('indicatorsFree');
                setIsRefreshing(true);
            }

            const { data } = await fetchWithCache<IndicatorsResponse>('indicatorsFree', '/api/indicators-free');

            if (data.price && data.rsi) {
                setBias(calculateBias(data));
                setError(null);
            } else {
                setError('Missing indicator data');
            }
        } catch (err) {
            setError('Failed to calculate bias');
        } finally {
            setLoading(false);
            setIsRefreshing(false);
            setCountdown(60); // Reset countdown
        }
    }, []);

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
            <div className="space-y-3">
                <div className="h-20 bg-zinc-800/30 rounded-xl animate-pulse"></div>
                <div className="h-32 bg-zinc-800/30 rounded-xl animate-pulse"></div>
            </div>
        );
    }

    if (error || !bias) {
        return (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                {error || 'Unable to calculate bias'}
            </div>
        );
    }

    const getBiasColor = () => {
        if (bias.biasScore >= 50) return 'from-emerald-500 to-teal-600';
        if (bias.biasScore >= 30) return 'from-emerald-500/80 to-teal-600/80';
        if (bias.biasScore <= -50) return 'from-red-500 to-rose-600';
        if (bias.biasScore <= -30) return 'from-red-500/80 to-rose-600/80';
        return 'from-amber-500 to-orange-600';
    };

    const getBiasLabel = () => {
        if (bias.biasScore >= 50) return 'STRONG BULLISH';
        if (bias.biasScore >= 30) return 'BULLISH';
        if (bias.biasScore <= -50) return 'STRONG BEARISH';
        if (bias.biasScore <= -30) return 'BEARISH';
        return 'NEUTRAL';
    };

    const getSignalIcon = (signal: string) => {
        if (signal === 'bullish') return '↑';
        if (signal === 'bearish') return '↓';
        return '—';
    };

    const getSignalColor = (signal: string) => {
        if (signal === 'bullish') return 'text-emerald-400';
        if (signal === 'bearish') return 'text-red-400';
        return 'text-amber-400';
    };

    // Calculate bar position (0-100)
    const barPosition = ((bias.biasScore + 100) / 200) * 100;

    return (
        <div className="space-y-4">
            {/* Bias Meter Header */}
            <div className={`p-4 rounded-xl bg-gradient-to-r ${getBiasColor()} shadow-lg`}>
                <div className="flex items-center justify-between mb-3">
                    <div>
                        <div className="text-xs text-white/70 uppercase tracking-wide">Intraday Bias</div>
                        <div className="text-xl font-bold text-white">{getBiasLabel()}</div>
                    </div>
                    <div className="text-right">
                        <div className="text-3xl font-bold text-white">
                            {bias.biasScore > 0 ? '+' : ''}{bias.biasScore}
                        </div>
                        <div className="text-xs text-white/70">Score</div>
                    </div>
                </div>

                {/* Score Bar */}
                <div className="relative h-3 bg-black/30 rounded-full overflow-hidden">
                    <div className="absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-red-500 to-amber-500 opacity-50"></div>
                    <div className="absolute inset-y-0 right-0 w-1/2 bg-gradient-to-r from-amber-500 to-emerald-500 opacity-50"></div>
                    <div
                        className="absolute top-0 w-4 h-3 bg-white rounded-full shadow-lg transform -translate-x-1/2 transition-all duration-500"
                        style={{ left: `${barPosition}%` }}
                    ></div>
                </div>
                <div className="flex justify-between mt-1 text-xs text-white/50">
                    <span>Bearish</span>
                    <span>Neutral</span>
                    <span>Bullish</span>
                </div>
            </div>

            {/* Live Price */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-zinc-800/30 border border-zinc-700/20">
                <div className="relative">
                    <div className="h-2.5 w-2.5 rounded-full bg-emerald-500"></div>
                    <div className="absolute inset-0 h-2.5 w-2.5 rounded-full bg-emerald-500 animate-ping opacity-75"></div>
                </div>
                <div>
                    <div className="text-sm font-bold text-white">{bias.price.toFixed(3)}</div>
                    <div className="text-xs text-zinc-500">USD/JPY Live</div>
                </div>
            </div>

            {/* Signal Breakdown */}
            <div className="space-y-2">
                <div className="text-xs text-zinc-500 uppercase tracking-wide px-1">Signal Breakdown</div>
                {bias.signals.map((signal) => (
                    <div
                        key={signal.name}
                        className="p-3 rounded-xl bg-zinc-800/30 border border-zinc-700/20 hover:border-zinc-600/40 transition-all"
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg font-bold ${getSignalColor(signal.signal)} bg-zinc-800/50`}>
                                    {getSignalIcon(signal.signal)}
                                </div>
                                <div>
                                    <div className="text-sm font-medium text-zinc-300">{signal.name}</div>
                                    <div className="text-xs text-zinc-500">{signal.reason}</div>
                                </div>
                            </div>
                            <div className={`text-sm font-medium ${getSignalColor(signal.signal)}`}>
                                {signal.signal.toUpperCase()}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Key Level */}
            <div className="p-3 rounded-xl bg-violet-500/10 border border-violet-500/20">
                <div className="flex items-center justify-between">
                    <div>
                        <div className="text-xs text-zinc-500">Nearest {bias.keyLevel.type}</div>
                        <div className="text-lg font-bold text-white">{bias.keyLevel.level.toFixed(3)}</div>
                    </div>
                    <div className="text-right">
                        <div className="text-xs text-zinc-500">Distance</div>
                        <div className="text-sm font-medium text-violet-400">
                            {bias.keyLevel.distance.toFixed(3)} ({bias.keyLevel.distancePercent.toFixed(2)}%)
                        </div>
                    </div>
                </div>
            </div>

            {/* Recommendation */}
            <div className="p-3 rounded-xl bg-zinc-800/30 border border-zinc-700/20">
                <div className="text-xs text-zinc-500 mb-1 flex items-center gap-1">
                    <svg className="w-3 h-3 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    Trading Idea
                </div>
                <p className="text-sm text-zinc-300">{bias.recommendation}</p>
            </div>

            {/* Source Info */}
            <div className="flex items-center justify-center gap-2 text-xs text-zinc-600">
                <span>Powered by Yahoo Finance</span>
                <span>•</span>
                <span>1-minute refresh</span>
                <span>•</span>
                <span className="text-emerald-400">Unlimited & Free</span>
            </div>
        </div>
    );
}
