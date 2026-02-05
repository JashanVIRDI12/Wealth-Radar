'use client';

import { useEffect, useState } from 'react';
import { fetchWithCache, getCacheAge, clearCache, type CacheKey } from '../lib/browserCache';

type AISummary = {
    marketBias: 'bullish' | 'bearish' | 'neutral';
    biasStrength: 'strong' | 'moderate' | 'weak';
    technicalAnalysis: {
        trend: string;
        momentum: string;
        keyLevels: {
            support: string;
            resistance: string;
        };
        signals: string[];
    };
    macroAnalysis: {
        interestRateDifferential: string;
        inflationOutlook: string;
        centralBankStance: string;
        keyDrivers: string[];
    };
    tradingRecommendation: {
        action: 'buy' | 'sell' | 'hold' | 'wait';
        confidence: 'high' | 'medium' | 'low';
        reasoning: string;
        riskLevel: 'high' | 'medium' | 'low';
        timeframe: string;
    };
    risks: string[];
    executiveSummary: string;
    generatedAt: string;
    cached?: boolean;
    cacheAge?: number;
    nextRefresh?: number;
    stale?: boolean;
    error?: string;
};

// Color utilities
function getBiasGradient(bias: string): string {
    if (bias === 'bullish') return 'from-emerald-500 to-teal-600';
    if (bias === 'bearish') return 'from-red-500 to-rose-600';
    return 'from-amber-500 to-orange-600';
}

function getBiasColor(bias: string): string {
    if (bias === 'bullish') return 'text-emerald-400';
    if (bias === 'bearish') return 'text-red-400';
    return 'text-amber-400';
}

function getActionGradient(action: string): string {
    if (action === 'buy') return 'from-emerald-500 to-teal-600';
    if (action === 'sell') return 'from-red-500 to-rose-600';
    if (action === 'wait') return 'from-amber-500 to-orange-600';
    return 'from-zinc-500 to-zinc-600';
}

function getActionBg(action: string): string {
    if (action === 'buy') return 'bg-emerald-500/10 border-emerald-500/30';
    if (action === 'sell') return 'bg-red-500/10 border-red-500/30';
    if (action === 'wait') return 'bg-amber-500/10 border-amber-500/30';
    return 'bg-zinc-500/10 border-zinc-500/30';
}

function getConfidenceColor(conf: string): string {
    if (conf === 'high') return 'text-emerald-400';
    if (conf === 'medium') return 'text-amber-400';
    return 'text-zinc-400';
}

function getRiskColor(risk: string): string {
    if (risk === 'high') return 'text-red-400';
    if (risk === 'medium') return 'text-amber-400';
    return 'text-emerald-400';
}

function formatTime(isoString: string): string {
    try {
        return new Date(isoString).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
        });
    } catch {
        return '--:--';
    }
}

type AISummaryCardProps = {
    apiUrl?: string;
    cacheKey?: CacheKey;
};

export default function AISummaryCard({
    apiUrl = '/api/ai-summary',
    cacheKey = 'aiSummary',
}: AISummaryCardProps) {
    const [summary, setSummary] = useState<AISummary | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [browserCached, setBrowserCached] = useState(false);
    const [browserCacheAge, setBrowserCacheAge] = useState<number | null>(null);
    const [isRegenerating, setIsRegenerating] = useState(false);

    async function fetchSummary(forceRefresh = false) {
        try {
            if (forceRefresh) {
                setIsRegenerating(true);
                clearCache(cacheKey);
            } else {
                setLoading(true);
            }
            setError(null);

            const { data, fromBrowserCache } = await fetchWithCache<AISummary>(cacheKey, apiUrl);
            setBrowserCached(fromBrowserCache);
            setBrowserCacheAge(getCacheAge(cacheKey));

            if (data.error && !data.marketBias) {
                setError(data.error || 'Failed to load summary');
                return;
            }

            if (data.marketBias && data.technicalAnalysis && data.tradingRecommendation) {
                setSummary(data);
            } else {
                setError('Invalid summary format received');
            }
        } catch (err) {
            setError('Failed to fetch AI summary');
            console.error(err);
        } finally {
            setLoading(false);
            setIsRegenerating(false);
        }
    }

    useEffect(() => {
        fetchSummary();
        const interval = setInterval(() => fetchSummary(true), 60 * 60 * 1000); // 1 hour
        return () => clearInterval(interval);
    }, [apiUrl, cacheKey]);

    if (loading) {
        return (
            <div className="glass-card rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-zinc-800 animate-pulse"></div>
                    <div>
                        <div className="h-5 bg-zinc-800 rounded w-40 mb-2 animate-pulse"></div>
                        <div className="h-3 bg-zinc-800 rounded w-24 animate-pulse"></div>
                    </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                    <div className="h-32 bg-zinc-800/50 rounded-xl animate-pulse"></div>
                    <div className="h-32 bg-zinc-800/50 rounded-xl animate-pulse"></div>
                </div>
            </div>
        );
    }

    if (error && !summary) {
        return (
            <div className="glass-card rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                    </div>
                    <h2 className="text-lg font-semibold text-white">AI Trading Summary</h2>
                </div>
                <p className="text-red-400 text-sm">{error}</p>
            </div>
        );
    }

    if (!summary) {
        return (
            <div className="glass-card rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                    </div>
                    <h2 className="text-lg font-semibold text-white">AI Trading Summary</h2>
                </div>
                <p className="text-zinc-500 text-sm">No summary available</p>
            </div>
        );
    }

    const {
        marketBias,
        biasStrength,
        technicalAnalysis,
        macroAnalysis,
        tradingRecommendation,
        risks,
        executiveSummary,
        generatedAt,
        cached,
        cacheAge,
        nextRefresh,
        stale,
    } = summary;

    return (
        <div className="glass-card rounded-2xl overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-zinc-800/50">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                            </svg>
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold text-white">AI Trading Summary</h2>
                            <p className="text-xs text-zinc-500 mt-0.5">
                                {browserCached && <span className="text-blue-400">📦 Browser {browserCacheAge}m</span>}
                                {!browserCached && (cached ? `🖥 Server ${cacheAge}m` : 'Fresh')}
                                {nextRefresh && ` • Refreshes in ${nextRefresh}m`}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        {stale && (
                            <span className="badge badge-amber">Stale</span>
                        )}
                        {/* Regenerate Button */}
                        <button
                            onClick={() => fetchSummary(true)}
                            disabled={isRegenerating}
                            className={`p-2.5 rounded-xl border transition-all ${isRegenerating
                                    ? 'bg-violet-500/20 border-violet-500/30 cursor-not-allowed'
                                    : 'bg-zinc-800/50 border-zinc-700/30 hover:bg-violet-500/20 hover:border-violet-500/30'
                                }`}
                            title="Regenerate AI Summary"
                        >
                            <svg
                                className={`w-5 h-5 text-violet-400 ${isRegenerating ? 'animate-spin' : ''}`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                        </button>
                        {/* Bias Badge */}
                        <div className={`px-4 py-2 rounded-xl bg-gradient-to-r ${getBiasGradient(marketBias)} shadow-lg`}>
                            <span className="text-white font-bold text-lg">
                                {marketBias.toUpperCase()}
                            </span>
                            <span className="text-white/70 text-sm ml-2">
                                ({biasStrength})
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Executive Summary */}
            <div className="p-6 bg-zinc-800/20 border-b border-zinc-800/50">
                <p className="text-zinc-300 leading-relaxed">{executiveSummary}</p>
                <p className="text-xs text-zinc-600 mt-2">Generated at {formatTime(generatedAt)}</p>
            </div>

            {/* Trading Recommendation - Prominent */}
            <div className={`p-6 border-b border-zinc-800/50 ${getActionBg(tradingRecommendation.action)}`}>
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <div className="text-xs text-zinc-500 uppercase tracking-wide mb-2">Recommendation</div>
                        <div className="flex items-center gap-4">
                            <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${getActionGradient(tradingRecommendation.action)} flex items-center justify-center shadow-lg`}>
                                <span className="text-white font-bold text-xl">
                                    {tradingRecommendation.action === 'buy' ? '↑' :
                                        tradingRecommendation.action === 'sell' ? '↓' :
                                            tradingRecommendation.action === 'wait' ? '⏸' : '—'}
                                </span>
                            </div>
                            <div>
                                <span className={`text-2xl font-bold ${getBiasColor(tradingRecommendation.action === 'buy' ? 'bullish' : tradingRecommendation.action === 'sell' ? 'bearish' : 'neutral')}`}>
                                    {tradingRecommendation.action.toUpperCase()}
                                </span>
                                <div className="flex items-center gap-4 mt-1 text-sm">
                                    <span className="text-zinc-500">Confidence: <span className={getConfidenceColor(tradingRecommendation.confidence)}>{tradingRecommendation.confidence}</span></span>
                                    <span className="text-zinc-500">Risk: <span className={getRiskColor(tradingRecommendation.riskLevel)}>{tradingRecommendation.riskLevel}</span></span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-xs text-zinc-500">Timeframe</div>
                        <div className="text-lg font-medium text-zinc-300">{tradingRecommendation.timeframe}</div>
                    </div>
                </div>
                <p className="text-sm text-zinc-400 mt-4 leading-relaxed">{tradingRecommendation.reasoning}</p>
            </div>

            {/* Main Content Grid */}
            <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-zinc-800/50">
                {/* Technical Analysis */}
                <div className="p-6">
                    <h3 className="section-title text-sm font-semibold text-white mb-4">Technical Analysis</h3>
                    <div className="space-y-4">
                        <div className="p-3 rounded-xl bg-zinc-800/30">
                            <div className="text-xs text-zinc-500 mb-1">Trend</div>
                            <p className="text-sm text-zinc-300">{technicalAnalysis.trend}</p>
                        </div>
                        <div className="p-3 rounded-xl bg-zinc-800/30">
                            <div className="text-xs text-zinc-500 mb-1">Momentum</div>
                            <p className="text-sm text-zinc-300">{technicalAnalysis.momentum}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                                <div className="text-xs text-zinc-500">Support</div>
                                <div className="text-emerald-400 font-medium">{technicalAnalysis.keyLevels.support}</div>
                            </div>
                            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                                <div className="text-xs text-zinc-500">Resistance</div>
                                <div className="text-red-400 font-medium">{technicalAnalysis.keyLevels.resistance}</div>
                            </div>
                        </div>
                        <div>
                            <div className="text-xs text-zinc-500 mb-2">Signals</div>
                            <ul className="space-y-1">
                                {technicalAnalysis.signals.map((signal, i) => (
                                    <li key={i} className="text-sm text-zinc-300 flex items-start gap-2">
                                        <span className="text-violet-400 mt-0.5">›</span>
                                        {signal}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Macro Analysis */}
                <div className="p-6">
                    <h3 className="section-title text-sm font-semibold text-white mb-4">Macro Analysis</h3>
                    <div className="space-y-4">
                        <div className="p-3 rounded-xl bg-zinc-800/30">
                            <div className="text-xs text-zinc-500 mb-1">Rate Differential</div>
                            <p className="text-sm text-zinc-300">{macroAnalysis.interestRateDifferential}</p>
                        </div>
                        <div className="p-3 rounded-xl bg-zinc-800/30">
                            <div className="text-xs text-zinc-500 mb-1">Inflation Outlook</div>
                            <p className="text-sm text-zinc-300">{macroAnalysis.inflationOutlook}</p>
                        </div>
                        <div className="p-3 rounded-xl bg-zinc-800/30">
                            <div className="text-xs text-zinc-500 mb-1">Central Bank Stance</div>
                            <p className="text-sm text-zinc-300">{macroAnalysis.centralBankStance}</p>
                        </div>
                        <div>
                            <div className="text-xs text-zinc-500 mb-2">Key Drivers</div>
                            <ul className="space-y-1">
                                {macroAnalysis.keyDrivers.map((driver, i) => (
                                    <li key={i} className="text-sm text-zinc-300 flex items-start gap-2">
                                        <span className="text-purple-400 mt-0.5">›</span>
                                        {driver}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>

            {/* Risks Section */}
            <div className="p-6 bg-zinc-800/20 border-t border-zinc-800/50">
                <h3 className="section-title text-sm font-semibold text-white mb-3">Key Risks</h3>
                <div className="flex flex-wrap gap-2">
                    {risks.map((risk, i) => (
                        <span
                            key={i}
                            className="px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm"
                        >
                            {risk}
                        </span>
                    ))}
                </div>
            </div>

            {/* Warning Footer */}
            {summary.error && (
                <div className="px-6 py-3 bg-amber-500/10 border-t border-amber-500/20">
                    <p className="text-xs text-amber-400">⚠ {summary.error}</p>
                </div>
            )}
        </div>
    );
}
