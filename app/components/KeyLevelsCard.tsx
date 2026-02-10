'use client';

import { useEffect, useState, useCallback } from 'react';
import { fetchWithCache, clearCache, type CacheKey } from '../lib/browserCache';

type SessionData = {
    name: string;
    high: number;
    low: number;
    range: number;
    isActive: boolean;
};

type KeyLevelsData = {
    previousDay: {
        high: number;
        low: number;
        close: number;
        date: string;
    };
    currentPrice: number;
    priceVsPDC: {
        position: 'above' | 'below';
        bias: 'bullish' | 'bearish';
        distance: number;
        distancePercent: number;
    };
    pricePosition: {
        withinPDRange: boolean;
        percentInRange: number;
        zone: 'above_pdh' | 'upper_half' | 'lower_half' | 'below_pdl';
    };
    sessions: SessionData[];
    activeSession: string;
    lastUpdated: string;
    cached?: boolean;
    stale?: boolean;
};

type KeyLevelsCardProps = {
    apiUrl?: string;
    cacheKey?: CacheKey;
    decimalPlaces?: number;
    pipScale?: number;
};

export default function KeyLevelsCard({
    apiUrl,
    cacheKey,
    decimalPlaces,
    pipScale = 1,
}: KeyLevelsCardProps = {}) {
    const [data, setData] = useState<KeyLevelsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Determine API endpoint and formatting
    const apiEndpoint = apiUrl ?? '/api/key-levels';
    const displayDecimals = decimalPlaces ?? 3;
    const resolvedCacheKey: CacheKey = cacheKey ?? 'keyLevels';

    const fetchData = useCallback(async (forceRefresh = false) => {
        try {
            if (forceRefresh) {
                clearCache(resolvedCacheKey);
            }

            const { data: json } = await fetchWithCache<KeyLevelsData>(resolvedCacheKey, apiEndpoint);

            if (json.previousDay) {
                setData(json);
                setError(null);
            } else {
                setError('Invalid key levels data');
            }
        } catch (err) {
            setError('Failed to load key levels');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [apiEndpoint, resolvedCacheKey]);

    useEffect(() => {
        fetchData();
        const interval = setInterval(() => fetchData(true), 5 * 60 * 1000); // 5 min refresh
        return () => clearInterval(interval);
    }, [fetchData]);

    if (loading) {
        return (
            <div className="space-y-3">
                <div className="h-24 glass-card rounded-xl animate-pulse"></div>
                <div className="h-20 glass-card rounded-xl animate-pulse"></div>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="p-4 rounded-xl glass-card text-red-300 text-sm border border-red-500/25 bg-red-500/10 backdrop-blur">
                {error || 'Unable to load key levels'}
            </div>
        );
    }

    const getBiasColor = () => {
        return data.priceVsPDC.bias === 'bullish' ? 'from-emerald-500 to-teal-600' : 'from-red-500 to-rose-600';
    };

    const getBiasLabel = () => {
        return data.priceVsPDC.bias === 'bullish' ? 'BULLISH' : 'BEARISH';
    };

    const getZoneLabel = () => {
        switch (data.pricePosition.zone) {
            case 'above_pdh': return 'Above PDH (Breakout)';
            case 'upper_half': return 'Upper Half (Bullish Zone)';
            case 'lower_half': return 'Lower Half (Bearish Zone)';
            case 'below_pdl': return 'Below PDL (Breakdown)';
            default: return 'Unknown';
        }
    };

    const getZoneColor = () => {
        switch (data.pricePosition.zone) {
            case 'above_pdh': return 'text-emerald-400';
            case 'upper_half': return 'text-emerald-300';
            case 'lower_half': return 'text-red-300';
            case 'below_pdl': return 'text-red-400';
            default: return 'text-zinc-400';
        }
    };

    return (
        <div className="space-y-4">
            {/* PDC Bias Header */}
            <div className="p-4 rounded-2xl glass-card backdrop-blur">
                <div className="flex items-center justify-between">
                    <div>
                        <div className="kicker">Price vs PDC</div>
                        <div className={`text-xl font-semibold tracking-tight ${data.priceVsPDC.bias === 'bullish' ? 'text-emerald-300' : 'text-red-300'}`}>{getBiasLabel()}</div>
                    </div>
                    <div className="text-right">
                        <div className="text-2xl font-semibold text-white tabular-nums">
                            {data.priceVsPDC.position === 'above' ? '+' : '-'}
                            {(data.priceVsPDC.distance * pipScale).toFixed(2)}
                        </div>
                        <div className="text-xs text-white/45 tabular-nums">
                            {data.priceVsPDC.distancePercent.toFixed(3)}% {data.priceVsPDC.position}
                        </div>
                    </div>
                </div>
            </div>

            {/* Previous Day Levels */}
            <div className="p-4 rounded-2xl glass-card backdrop-blur">
                <div className="kicker mb-3">
                    Previous Day Levels ({data.previousDay.date})
                </div>

                <div className="space-y-2">
                    {/* PDH */}
                    <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur">
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-emerald-400">PDH</span>
                            <span className="text-xs text-white/45">Resistance</span>
                        </div>
                        <span className="text-sm font-semibold text-white tabular-nums">{data.previousDay.high.toFixed(displayDecimals)}</span>
                    </div>

                    {/* PDC */}
                    <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur">
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-amber-400">PDC</span>
                            <span className="text-xs text-white/45">Pivot</span>
                        </div>
                        <span className="text-sm font-semibold text-white tabular-nums">{data.previousDay.close.toFixed(displayDecimals)}</span>
                    </div>

                    {/* PDL */}
                    <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur">
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-red-400">PDL</span>
                            <span className="text-xs text-white/45">Support</span>
                        </div>
                        <span className="text-sm font-semibold text-white tabular-nums">{data.previousDay.low.toFixed(displayDecimals)}</span>
                    </div>
                </div>

                {/* Price Position in Range */}
                <div className="mt-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="kicker">Price Position</span>
                        <span className={`text-xs font-medium ${getZoneColor()}`}>{getZoneLabel()}</span>
                    </div>
                    <div className="relative h-2 bg-white/10 rounded-full overflow-hidden border border-white/10 backdrop-blur">
                        <div
                            className="absolute top-0 w-3 h-2 bg-white/90 rounded-full transform -translate-x-1/2 transition-all duration-500"
                            style={{ left: `${Math.max(0, Math.min(100, data.pricePosition.percentInRange))}%` }}
                        ></div>
                    </div>
                    <div className="flex justify-between mt-1 text-xs text-white/35">
                        <span>PDL</span>
                        <span>PDC</span>
                        <span>PDH</span>
                    </div>
                </div>
            </div>

            {/* Session High/Low */}
            <div className="p-4 rounded-2xl glass-card backdrop-blur">
                <div className="flex items-center justify-between mb-3">
                    <span className="kicker">Session Levels</span>
                    <span className="text-xs text-white/55 font-medium">Active: {data.activeSession}</span>
                </div>

                <div className="space-y-2">
                    {data.sessions.filter(s => s.high > 0).map((session) => (
                        <div
                            key={session.name}
                            className={`p-3 rounded-xl border transition-all backdrop-blur ${session.isActive
                                ? 'bg-white/10 border-white/15 shadow-[0_10px_30px_-15px_rgba(255,255,255,0.3)]'
                                : 'glass-card'
                                }`}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium text-white tracking-tight">{session.name}</span>
                                    {session.isActive && (
                                        <span className="px-1.5 py-0.5 text-xs bg-white/5 border border-white/10 text-white/70 rounded">
                                            LIVE
                                        </span>
                                    )}
                                </div>
                                <div className="text-xs text-white/45 tabular-nums">
                                    Range: {(session.range * pipScale).toFixed(2)} pips
                                </div>
                            </div>
                            <div className="flex items-center justify-between mt-2 text-sm">
                                <div>
                                    <span className="text-white/45">H </span>
                                    <span className="text-emerald-300 font-medium tabular-nums">{session.high.toFixed(displayDecimals)}</span>
                                </div>
                                <div>
                                    <span className="text-white/45">L </span>
                                    <span className="text-red-300 font-medium tabular-nums">{session.low.toFixed(displayDecimals)}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Current Price */}
            <div className="flex items-center justify-center gap-3 p-3 rounded-xl glass-card backdrop-blur">
                <div className="relative">
                    <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
                    <div className="absolute inset-0 h-2 w-2 rounded-full bg-emerald-500 animate-ping opacity-75"></div>
                </div>
                <span className="text-sm text-white/55">Current:</span>
                <span className="text-lg font-semibold text-white tabular-nums">{data.currentPrice.toFixed(displayDecimals)}</span>
            </div>
        </div>
    );
}
