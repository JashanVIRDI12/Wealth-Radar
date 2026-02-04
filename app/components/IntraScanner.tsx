'use client';

import { useEffect, useState, useCallback } from 'react';
import { fetchWithCache, clearCache } from '../lib/browserCache';

type TimeframeBias = {
    timeframe: string;
    label: string;
    bias: 'bullish' | 'bearish' | 'neutral';
    strength: number;
    ema20: number;
    ema50: number;
    rsi: number;
    trend: 'up' | 'down' | 'sideways';
};

type MTFData = {
    timeframes: TimeframeBias[];
    alignment: {
        direction: 'bullish' | 'bearish' | 'mixed';
        percentage: number;
        score: number;
    };
};

type KeyLevelsData = {
    previousDay: { high: number; low: number; close: number };
    currentPrice: number;
    priceVsPDC: { position: 'above' | 'below'; bias: 'bullish' | 'bearish'; distance: number };
    sessions: Array<{ name: string; high: number; low: number; isActive: boolean }>;
    activeSession: string;
};

type IndicatorsData = {
    price: number;
    rsi: number;
    ema20: number;
    ema50: number;
    trend: 'uptrend' | 'downtrend' | 'sideways';
};

type DetailedReason = {
    factor: string;
    value: string;
    score: number;
    explanation: string;
};

type UnifiedSignal = {
    overallBias: 'strong_bullish' | 'bullish' | 'neutral' | 'bearish' | 'strong_bearish';
    score: number;
    mtfTimeframes: TimeframeBias[];
    mtfAlignment: MTFData['alignment'];
    price: number;
    nearestLevel: { type: string; value: number; distance: number; distancePercent: number };
    tradingIdea: string;
    detailedReasons: DetailedReason[];
};

function calculateUnifiedSignal(
    indicators: IndicatorsData | null,
    mtf: MTFData | null,
    keyLevels: KeyLevelsData | null
): UnifiedSignal | null {
    if (!mtf || !mtf.timeframes) return null;

    const detailedReasons: DetailedReason[] = [];
    let score = 0;

    mtf.timeframes.forEach(tf => {
        const tfScore = tf.bias === 'bullish' ? 20 : tf.bias === 'bearish' ? -20 : 0;
        score += tfScore;
        detailedReasons.push({
            factor: `${tf.label} Timeframe`,
            value: `${tf.bias.toUpperCase()} (RSI: ${tf.rsi.toFixed(1)})`,
            score: tfScore,
            explanation: `EMA20 (${tf.ema20.toFixed(2)}) ${tf.ema20 > tf.ema50 ? '>' : '<'} EMA50 (${tf.ema50.toFixed(2)}), Trend: ${tf.trend}`
        });
    });

    if (mtf.alignment.direction !== 'mixed') {
        const alignBonus = mtf.alignment.direction === 'bullish' ? 15 : -15;
        score += alignBonus;
        detailedReasons.push({
            factor: 'MTF Alignment',
            value: `${mtf.alignment.percentage}% aligned ${mtf.alignment.direction.toUpperCase()}`,
            score: alignBonus,
            explanation: `All timeframes showing ${mtf.alignment.direction} consensus adds confidence`
        });
    }

    if (keyLevels) {
        const pdcScore = keyLevels.priceVsPDC.bias === 'bullish' ? 10 : -10;
        score += pdcScore;
        detailedReasons.push({
            factor: 'Price vs PDC',
            value: `${keyLevels.priceVsPDC.position.toUpperCase()} (${keyLevels.priceVsPDC.distance.toFixed(3)} pips)`,
            score: pdcScore,
            explanation: `Price ${keyLevels.priceVsPDC.position} Previous Day Close indicates ${keyLevels.priceVsPDC.bias} bias`
        });
    }

    if (indicators) {
        let rsiScore = 0;
        let rsiExplanation = '';
        if (indicators.rsi > 50 && indicators.rsi < 70) {
            rsiScore = 10;
            rsiExplanation = 'RSI above 50 shows bullish momentum';
        } else if (indicators.rsi >= 70) {
            rsiScore = -5;
            rsiExplanation = 'RSI overbought suggests reversal risk';
        } else if (indicators.rsi < 50 && indicators.rsi > 30) {
            rsiScore = -10;
            rsiExplanation = 'RSI below 50 shows bearish momentum';
        } else if (indicators.rsi <= 30) {
            rsiScore = 5;
            rsiExplanation = 'RSI oversold suggests bounce potential';
        }
        score += rsiScore;
        detailedReasons.push({
            factor: 'RSI Momentum',
            value: indicators.rsi.toFixed(1),
            score: rsiScore,
            explanation: rsiExplanation
        });
    }

    score = Math.max(-100, Math.min(100, score));

    let overallBias: UnifiedSignal['overallBias'] = 'neutral';
    if (score >= 60) overallBias = 'strong_bullish';
    else if (score >= 25) overallBias = 'bullish';
    else if (score <= -60) overallBias = 'strong_bearish';
    else if (score <= -25) overallBias = 'bearish';

    const price = indicators?.price || keyLevels?.currentPrice || 0;

    let nearestLevel = { type: 'EMA 20', value: 0, distance: 0, distancePercent: 0 };
    const levels: { type: string; value: number }[] = [];

    if (indicators) {
        levels.push(
            { type: 'EMA 20', value: indicators.ema20 },
            { type: 'EMA 50', value: indicators.ema50 },
        );
    }

    if (keyLevels) {
        levels.push(
            { type: 'PDH', value: keyLevels.previousDay.high },
            { type: 'PDC', value: keyLevels.previousDay.close },
            { type: 'PDL', value: keyLevels.previousDay.low },
        );
    }

    let minDist = Infinity;
    for (const level of levels) {
        const dist = Math.abs(price - level.value);
        if (dist < minDist && dist > 0.001) {
            minDist = dist;
            nearestLevel = {
                type: level.value < price ? `Support (${level.type})` : `Resistance (${level.type})`,
                value: level.value,
                distance: dist,
                distancePercent: (dist / price) * 100,
            };
        }
    }

    let tradingIdea = '';
    const allAligned = mtf.alignment.percentage >= 100;
    if (overallBias === 'strong_bullish') {
        tradingIdea = allAligned
            ? 'All timeframes aligned BULLISH. Look for pullback entries.'
            : 'Bullish bias with some divergence. Use tighter stops.';
    } else if (overallBias === 'bullish') {
        tradingIdea = 'Bullish bias. Consider longs above EMA 20.';
    } else if (overallBias === 'strong_bearish') {
        tradingIdea = allAligned
            ? 'All timeframes aligned BEARISH. Look for rally entries.'
            : 'Bearish bias with some divergence. Use tighter stops.';
    } else if (overallBias === 'bearish') {
        tradingIdea = 'Bearish bias. Consider shorts below EMA 20.';
    } else {
        tradingIdea = 'Mixed signals. Wait for alignment or trade the range.';
    }

    return {
        overallBias,
        score,
        mtfTimeframes: mtf.timeframes,
        mtfAlignment: mtf.alignment,
        price,
        nearestLevel,
        tradingIdea,
        detailedReasons,
    };
}

export default function IntraScanner() {
    const [signal, setSignal] = useState<UnifiedSignal | null>(null);
    const [loading, setLoading] = useState(true);
    const [showDetails, setShowDetails] = useState(false);

    const fetchData = useCallback(async (forceRefresh = false) => {
        try {
            if (forceRefresh) {
                clearCache('indicatorsFree');
                clearCache('mtf');
                clearCache('keyLevels');
            }

            const [indicatorsRes, mtfRes, keyLevelsRes] = await Promise.all([
                fetchWithCache<IndicatorsData>('indicatorsFree', '/api/indicators-free'),
                fetchWithCache<MTFData>('mtf', '/api/mtf'),
                fetchWithCache<KeyLevelsData>('keyLevels', '/api/key-levels'),
            ]);

            const unified = calculateUnifiedSignal(
                indicatorsRes.data,
                mtfRes.data,
                keyLevelsRes.data
            );

            if (unified) {
                setSignal(unified);
            }
        } catch (err) {
            console.error('IntraScanner error:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
        const interval = setInterval(() => fetchData(true), 2 * 60 * 1000);
        return () => clearInterval(interval);
    }, [fetchData]);

    if (loading) {
        return (
            <div className="space-y-3">
                <div className="h-24 bg-zinc-800/30 rounded-xl animate-pulse"></div>
                <div className="h-40 bg-zinc-800/30 rounded-xl animate-pulse"></div>
            </div>
        );
    }

    if (!signal) {
        return (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                Unable to load market data
            </div>
        );
    }

    const getBiasGradient = () => {
        if (signal.overallBias.includes('bullish')) return 'from-emerald-500 to-teal-600';
        if (signal.overallBias.includes('bearish')) return 'from-red-500 to-rose-600';
        return 'from-amber-500 to-orange-600';
    };

    const getBiasLabel = () => signal.overallBias.replace('_', ' ').toUpperCase();

    const getTfBiasBg = (bias: string) => {
        if (bias === 'bullish') return 'bg-emerald-500/10 border-emerald-500/30';
        if (bias === 'bearish') return 'bg-red-500/10 border-red-500/30';
        return 'bg-amber-500/10 border-amber-500/30';
    };

    const getTrendIcon = (trend: string) => {
        if (trend === 'up') return '↑';
        if (trend === 'down') return '↓';
        return '—';
    };

    const getTfBiasColor = (bias: string) => {
        if (bias === 'bullish') return 'text-emerald-400';
        if (bias === 'bearish') return 'text-red-400';
        return 'text-amber-400';
    };

    const barPosition = ((signal.score + 100) / 200) * 100;

    return (
        <div className="space-y-4">
            {/* Bias Header */}
            <div className={`p-4 rounded-xl bg-gradient-to-r ${getBiasGradient()} shadow-lg`}>
                <div className="flex items-start justify-between mb-3">
                    <div>
                        <div className="text-xs text-white/70 uppercase tracking-wide">Intraday Bias</div>
                        <div className="text-xl font-bold text-white">{getBiasLabel()}</div>
                    </div>
                    <div className="flex items-start gap-3">
                        <div className="text-right">
                            <div className="text-3xl font-bold text-white">
                                {signal.score > 0 ? '+' : ''}{signal.score}
                            </div>
                            <div className="text-xs text-white/70">Score</div>
                        </div>
                        <button
                            onClick={() => setShowDetails(true)}
                            className="px-2.5 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white text-xs font-medium transition-all flex items-center gap-1"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Why?
                        </button>
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

            {/* Multi-Timeframe Breakdown */}
            <div className="space-y-2">
                <div className="flex items-center justify-between px-1">
                    <div className="text-xs text-zinc-500 uppercase tracking-wide">MTF Breakdown</div>
                    <div className="text-xs text-violet-400">{signal.mtfAlignment.percentage}% aligned</div>
                </div>

                {signal.mtfTimeframes.map((tf) => (
                    <div
                        key={tf.timeframe}
                        className={`p-3 rounded-xl border transition-all ${getTfBiasBg(tf.bias)}`}
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg font-bold ${getTfBiasColor(tf.bias)} bg-zinc-900/50`}>
                                    {getTrendIcon(tf.trend)}
                                </div>
                                <div>
                                    <div className="text-sm font-semibold text-white">{tf.label}</div>
                                    <div className="text-xs text-zinc-500">
                                        EMA {tf.ema20.toFixed(2)} {tf.ema20 > tf.ema50 ? '>' : '<'} {tf.ema50.toFixed(2)} • RSI {tf.rsi.toFixed(1)}
                                    </div>
                                </div>
                            </div>
                            <span className={`text-xs font-medium px-2 py-1 rounded ${tf.bias === 'bullish' ? 'bg-emerald-500/20 text-emerald-400' :
                                    tf.bias === 'bearish' ? 'bg-red-500/20 text-red-400' :
                                        'bg-amber-500/20 text-amber-400'
                                }`}>
                                {tf.bias.toUpperCase()}
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Nearest Level */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-violet-500/10 border border-violet-500/20">
                <div>
                    <div className="text-xs text-zinc-500">Nearest {signal.nearestLevel.type.includes('Support') ? 'Support' : 'Resistance'}</div>
                    <div className="text-sm font-bold text-white">{signal.nearestLevel.value.toFixed(3)}</div>
                </div>
                <div className="text-right">
                    <div className="text-xs text-zinc-500">Distance</div>
                    <div className="text-sm font-medium text-violet-400">
                        {signal.nearestLevel.distance.toFixed(3)} ({signal.nearestLevel.distancePercent.toFixed(2)}%)
                    </div>
                </div>
            </div>

            {/* Trading Idea */}
            <div className="p-3 rounded-xl bg-zinc-800/30 border border-zinc-700/20">
                <div className="flex items-start gap-2">
                    <span className="text-lg">💡</span>
                    <div>
                        <div className="text-xs text-zinc-500 uppercase tracking-wide mb-1">Trading Idea</div>
                        <p className="text-sm text-zinc-300">{signal.tradingIdea}</p>
                    </div>
                </div>
            </div>

            {/* Details Modal */}
            {showDetails && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowDetails(false)}>
                    <div className="bg-zinc-900 rounded-2xl p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto border border-zinc-700/50 shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="text-xl font-bold text-white">Bias Breakdown</h3>
                                <p className="text-sm text-zinc-500">Why the signal is {getBiasLabel()}</p>
                            </div>
                            <button onClick={() => setShowDetails(false)} className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Total Score */}
                        <div className={`p-4 rounded-xl mb-4 ${signal.score >= 0 ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-red-500/10 border border-red-500/20'}`}>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-zinc-300">Total Score</span>
                                <span className={`text-2xl font-bold ${signal.score >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                    {signal.score > 0 ? '+' : ''}{signal.score}
                                </span>
                            </div>
                        </div>

                        {/* Detailed Reasons */}
                        <div className="space-y-3">
                            {signal.detailedReasons.map((reason, i) => (
                                <div key={i} className="p-4 rounded-xl bg-zinc-800/50 border border-zinc-700/30">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm font-medium text-white">{reason.factor}</span>
                                        <span className={`text-sm font-bold ${reason.score > 0 ? 'text-emerald-400' : reason.score < 0 ? 'text-red-400' : 'text-zinc-400'}`}>
                                            {reason.score > 0 ? '+' : ''}{reason.score}
                                        </span>
                                    </div>
                                    <div className="text-sm text-violet-400 mb-1">{reason.value}</div>
                                    <p className="text-xs text-zinc-500">{reason.explanation}</p>
                                </div>
                            ))}
                        </div>

                        <button
                            onClick={() => setShowDetails(false)}
                            className="w-full mt-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-medium transition-colors"
                        >
                            Got it
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
