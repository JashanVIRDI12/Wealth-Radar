'use client';

import { useEffect, useState } from 'react';
import { fetchWithCache, getCache, getCacheAge, clearCache } from '../lib/browserCache';

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
function getBiasColor(bias: string): string {
    if (bias === 'bullish') return 'text-emerald-400';
    if (bias === 'bearish') return 'text-red-400';
    return 'text-amber-400';
}

function getBiasBg(bias: string): string {
    if (bias === 'bullish') return 'bg-emerald-500/10 border-emerald-500/30';
    if (bias === 'bearish') return 'bg-red-500/10 border-red-500/30';
    return 'bg-amber-500/10 border-amber-500/30';
}

function getActionColor(action: string): string {
    if (action === 'buy') return 'text-emerald-400';
    if (action === 'sell') return 'text-red-400';
    if (action === 'wait') return 'text-amber-400';
    return 'text-zinc-400';
}

function getActionBg(action: string): string {
    if (action === 'buy') return 'bg-emerald-500/20';
    if (action === 'sell') return 'bg-red-500/20';
    if (action === 'wait') return 'bg-amber-500/20';
    return 'bg-zinc-500/20';
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

function getRiskBg(risk: string): string {
    if (risk === 'high') return 'bg-red-500/10';
    if (risk === 'medium') return 'bg-amber-500/10';
    return 'bg-emerald-500/10';
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

export default function AISummaryCard() {
    const [summary, setSummary] = useState<AISummary | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [browserCached, setBrowserCached] = useState(false);
    const [browserCacheAge, setBrowserCacheAge] = useState<number | null>(null);

    useEffect(() => {
        async function fetchSummary(forceRefresh = false) {
            try {
                setLoading(true);
                setError(null);

                // If force refresh, clear browser cache first
                if (forceRefresh) {
                    clearCache('aiSummary');
                }

                const { data, fromBrowserCache } = await fetchWithCache<AISummary>('aiSummary', '/api/ai-summary');
                setBrowserCached(fromBrowserCache);
                setBrowserCacheAge(getCacheAge('aiSummary'));

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
            }
        }

        fetchSummary();

        // Auto-refresh every 30 minutes to check if cache has expired
        const interval = setInterval(() => fetchSummary(true), 30 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    if (loading) {
        return (
            <div className="bg-zinc-900 rounded-2xl p-6 shadow-2xl border border-zinc-800">
                <div className="flex items-center gap-3 mb-4">
                    <div className="h-4 w-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                    <span className="text-zinc-400">Generating AI Summary...</span>
                </div>
                <div className="space-y-3">
                    <div className="h-4 bg-zinc-800 rounded animate-pulse w-3/4" />
                    <div className="h-4 bg-zinc-800 rounded animate-pulse w-1/2" />
                    <div className="h-4 bg-zinc-800 rounded animate-pulse w-2/3" />
                </div>
            </div>
        );
    }

    if (error && !summary) {
        return (
            <div className="bg-zinc-900 rounded-2xl p-6 shadow-2xl border border-zinc-800">
                <h2 className="text-lg font-semibold text-zinc-50 mb-3">AI Trading Summary</h2>
                <p className="text-red-400 text-sm">{error}</p>
            </div>
        );
    }

    if (!summary) {
        return (
            <div className="bg-zinc-900 rounded-2xl p-6 shadow-2xl border border-zinc-800">
                <h2 className="text-lg font-semibold text-zinc-50 mb-3">AI Trading Summary</h2>
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
        <div className="bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-800 overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold text-zinc-50">AI Trading Summary</h2>
                    <p className="text-xs text-zinc-600 mt-0.5">
                        Auto-refreshes •
                        {browserCached && <span className="text-blue-400"> 📦 Browser{browserCacheAge ? ` ${browserCacheAge}m` : ''}</span>}
                        {!browserCached && (cached ? ` 🖥 Server ${cacheAge}m ago` : ' Fresh data')}
                        {nextRefresh && ` • Refreshes in ${nextRefresh}m`}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {stale && (
                        <span className="px-2 py-0.5 rounded text-xs bg-amber-500/20 text-amber-400">
                            Stale
                        </span>
                    )}
                    <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                </div>
            </div>

            {/* Executive Summary & Main Bias */}
            <div className="px-6 py-4 border-b border-zinc-800 bg-zinc-800/30">
                <div className="flex flex-wrap items-center gap-3 mb-3">
                    <div className={`px-3 py-1.5 rounded-lg border ${getBiasBg(marketBias)}`}>
                        <span className={`font-bold text-lg ${getBiasColor(marketBias)}`}>
                            {marketBias.toUpperCase()}
                        </span>
                        <span className="text-zinc-500 text-sm ml-2">
                            ({biasStrength})
                        </span>
                    </div>
                    <span className="text-zinc-600">•</span>
                    <span className="text-xs text-zinc-500">
                        Generated {formatTime(generatedAt)}
                    </span>
                </div>
                <p className="text-zinc-300 text-sm leading-relaxed">{executiveSummary}</p>
            </div>

            {/* Trading Recommendation - Prominent */}
            <div className={`px-6 py-4 border-b border-zinc-800 ${getActionBg(tradingRecommendation.action)}`}>
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <div className="text-xs text-zinc-500 uppercase tracking-wide mb-1">Recommendation</div>
                        <div className="flex items-center gap-3">
                            <span className={`text-2xl font-bold ${getActionColor(tradingRecommendation.action)}`}>
                                {tradingRecommendation.action.toUpperCase()}
                            </span>
                            <div className="flex items-center gap-2 text-sm">
                                <span className="text-zinc-500">Confidence:</span>
                                <span className={getConfidenceColor(tradingRecommendation.confidence)}>
                                    {tradingRecommendation.confidence}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <div className="text-right">
                            <div className="text-xs text-zinc-500">Timeframe</div>
                            <div className="text-sm text-zinc-300">{tradingRecommendation.timeframe}</div>
                        </div>
                        <div className={`px-3 py-2 rounded-lg ${getRiskBg(tradingRecommendation.riskLevel)}`}>
                            <div className="text-xs text-zinc-500">Risk</div>
                            <div className={`text-sm font-medium ${getRiskColor(tradingRecommendation.riskLevel)}`}>
                                {tradingRecommendation.riskLevel.toUpperCase()}
                            </div>
                        </div>
                    </div>
                </div>
                <p className="text-sm text-zinc-400 mt-2">{tradingRecommendation.reasoning}</p>
            </div>

            {/* Main Content Grid */}
            <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-zinc-800">
                {/* Technical Analysis */}
                <div className="p-5">
                    <h3 className="text-sm font-semibold text-zinc-50 mb-3 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                        Technical Analysis
                    </h3>

                    <div className="space-y-3 text-sm">
                        <div>
                            <div className="text-xs text-zinc-500 mb-0.5">Trend</div>
                            <p className="text-zinc-300">{technicalAnalysis.trend}</p>
                        </div>

                        <div>
                            <div className="text-xs text-zinc-500 mb-0.5">Momentum</div>
                            <p className="text-zinc-300">{technicalAnalysis.momentum}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-zinc-800/50 rounded-lg p-2">
                                <div className="text-xs text-zinc-500">Support</div>
                                <div className="text-emerald-400 text-sm font-medium">
                                    {technicalAnalysis.keyLevels.support}
                                </div>
                            </div>
                            <div className="bg-zinc-800/50 rounded-lg p-2">
                                <div className="text-xs text-zinc-500">Resistance</div>
                                <div className="text-red-400 text-sm font-medium">
                                    {technicalAnalysis.keyLevels.resistance}
                                </div>
                            </div>
                        </div>

                        <div>
                            <div className="text-xs text-zinc-500 mb-1">Signals</div>
                            <ul className="space-y-1">
                                {technicalAnalysis.signals.map((signal, i) => (
                                    <li key={i} className="text-zinc-300 flex items-start gap-2">
                                        <span className="text-blue-400 mt-1">›</span>
                                        {signal}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Macro Analysis */}
                <div className="p-5">
                    <h3 className="text-sm font-semibold text-zinc-50 mb-3 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                        Macro Analysis
                    </h3>

                    <div className="space-y-3 text-sm">
                        <div>
                            <div className="text-xs text-zinc-500 mb-0.5">Rate Differential</div>
                            <p className="text-zinc-300">{macroAnalysis.interestRateDifferential}</p>
                        </div>

                        <div>
                            <div className="text-xs text-zinc-500 mb-0.5">Inflation Outlook</div>
                            <p className="text-zinc-300">{macroAnalysis.inflationOutlook}</p>
                        </div>

                        <div>
                            <div className="text-xs text-zinc-500 mb-0.5">Central Bank Stance</div>
                            <p className="text-zinc-300">{macroAnalysis.centralBankStance}</p>
                        </div>

                        <div>
                            <div className="text-xs text-zinc-500 mb-1">Key Drivers</div>
                            <ul className="space-y-1">
                                {macroAnalysis.keyDrivers.map((driver, i) => (
                                    <li key={i} className="text-zinc-300 flex items-start gap-2">
                                        <span className="text-purple-400 mt-1">›</span>
                                        {driver}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>

            {/* Risks Section */}
            <div className="px-6 py-4 bg-zinc-800/30 border-t border-zinc-800">
                <h3 className="text-sm font-semibold text-zinc-50 mb-2 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                    Key Risks
                </h3>
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
                <div className="px-6 py-2 bg-amber-500/10 border-t border-amber-500/20">
                    <p className="text-xs text-amber-400">⚠ {summary.error}</p>
                </div>
            )}
        </div>
    );
}
