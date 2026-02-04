'use client';

import { useEffect, useState, useCallback } from 'react';
import { fetchWithCache, clearCache } from '../lib/browserCache';

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
    symbol?: string; // Optional: '^NSEI' for NIFTY, defaults to USDJPY
};

export default function KeyLevelsCard({ symbol }: KeyLevelsCardProps = {}) {
    const [data, setData] = useState<KeyLevelsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Determine API endpoint and formatting based on symbol
    const isNifty = symbol === '^NSEI';
    const apiEndpoint = isNifty ? `/api/key-levels?symbol=${symbol}` : '/api/key-levels';
    const decimalPlaces = isNifty ? 2 : 3; // NIFTY uses 2 decimals, USDJPY uses 3
    const cacheKey = isNifty ? 'keyLevelsNifty' : 'keyLevels';

    const fetchData = useCallback(async (forceRefresh = false) => {
        try {
            if (forceRefresh) {
                clearCache(cacheKey);
            }

            const { data: json } = await fetchWithCache<KeyLevelsData>(cacheKey, apiEndpoint);

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
    }, [apiEndpoint, cacheKey]);

    useEffect(() => {
        fetchData();
        const interval = setInterval(() => fetchData(true), 5 * 60 * 1000); // 5 min refresh
        return () => clearInterval(interval);
    }, [fetchData]);

    if (loading) {
        return (
            <div className="space-y-3">
                <div className="h-24 bg-zinc-800/30 rounded-xl animate-pulse"></div>
                <div className="h-20 bg-zinc-800/30 rounded-xl animate-pulse"></div>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
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
            <div className={`p-4 rounded-xl bg-gradient-to-r ${getBiasColor()} shadow-lg`}>
                <div className="flex items-center justify-between">
                    <div>
                        <div className="text-xs text-white/70 uppercase tracking-wide">Price vs PDC</div>
                        <div className="text-xl font-bold text-white">{getBiasLabel()}</div>
                    </div>
                    <div className="text-right">
                        <div className="text-2xl font-bold text-white">
                            {data.priceVsPDC.position === 'above' ? '+' : '-'}
                            {data.priceVsPDC.distance.toFixed(2)}
                        </div>
                        <div className="text-xs text-white/70">
                            {data.priceVsPDC.distancePercent.toFixed(3)}% {data.priceVsPDC.position}
                        </div>
                    </div>
                </div>
            </div>

            {/* Previous Day Levels */}
            <div className="p-4 rounded-xl bg-zinc-800/30 border border-zinc-700/20">
                <div className="text-xs text-zinc-500 uppercase tracking-wide mb-3">
                    Previous Day Levels ({data.previousDay.date})
                </div>

                <div className="space-y-2">
                    {/* PDH */}
                    <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-emerald-400">PDH</span>
                            <span className="text-xs text-zinc-500">Resistance</span>
                        </div>
                        <span className="text-sm font-bold text-white">{data.previousDay.high.toFixed(decimalPlaces)}</span>
                    </div>

                    {/* PDC */}
                    <div className="flex items-center justify-between p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-amber-400">PDC</span>
                            <span className="text-xs text-zinc-500">Pivot</span>
                        </div>
                        <span className="text-sm font-bold text-white">{data.previousDay.close.toFixed(decimalPlaces)}</span>
                    </div>

                    {/* PDL */}
                    <div className="flex items-center justify-between p-2 rounded-lg bg-red-500/10 border border-red-500/20">
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-red-400">PDL</span>
                            <span className="text-xs text-zinc-500">Support</span>
                        </div>
                        <span className="text-sm font-bold text-white">{data.previousDay.low.toFixed(decimalPlaces)}</span>
                    </div>
                </div>

                {/* Price Position in Range */}
                <div className="mt-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-zinc-500">Price Position</span>
                        <span className={`text-xs font-medium ${getZoneColor()}`}>{getZoneLabel()}</span>
                    </div>
                    <div className="relative h-3 bg-zinc-700/50 rounded-full overflow-hidden">
                        <div className="absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-red-500/30 to-amber-500/30"></div>
                        <div className="absolute inset-y-0 right-0 w-1/2 bg-gradient-to-r from-amber-500/30 to-emerald-500/30"></div>
                        <div
                            className="absolute top-0 w-3 h-3 bg-white rounded-full shadow transform -translate-x-1/2 transition-all duration-500"
                            style={{ left: `${Math.max(0, Math.min(100, data.pricePosition.percentInRange))}%` }}
                        ></div>
                    </div>
                    <div className="flex justify-between mt-1 text-xs text-zinc-600">
                        <span>PDL</span>
                        <span>PDC</span>
                        <span>PDH</span>
                    </div>
                </div>
            </div>

            {/* Session High/Low */}
            <div className="p-4 rounded-xl bg-zinc-800/30 border border-zinc-700/20">
                <div className="flex items-center justify-between mb-3">
                    <span className="text-xs text-zinc-500 uppercase tracking-wide">Session Levels</span>
                    <span className="text-xs text-violet-400 font-medium">Active: {data.activeSession}</span>
                </div>

                <div className="space-y-2">
                    {data.sessions.filter(s => s.high > 0).map((session) => (
                        <div
                            key={session.name}
                            className={`p-3 rounded-lg border transition-all ${session.isActive
                                ? 'bg-violet-500/10 border-violet-500/30'
                                : 'bg-zinc-800/50 border-zinc-700/30'
                                }`}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium text-white">{session.name}</span>
                                    {session.isActive && (
                                        <span className="px-1.5 py-0.5 text-xs bg-violet-500/20 text-violet-400 rounded">
                                            LIVE
                                        </span>
                                    )}
                                </div>
                                <div className="text-xs text-zinc-500">
                                    Range: {session.range.toFixed(2)} pips
                                </div>
                            </div>
                            <div className="flex items-center justify-between mt-2 text-sm">
                                <div>
                                    <span className="text-zinc-500">H </span>
                                    <span className="text-emerald-400 font-medium">{session.high.toFixed(decimalPlaces)}</span>
                                </div>
                                <div>
                                    <span className="text-zinc-500">L </span>
                                    <span className="text-red-400 font-medium">{session.low.toFixed(decimalPlaces)}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Current Price */}
            <div className="flex items-center justify-center gap-3 p-3 rounded-xl bg-zinc-800/50 border border-zinc-700/30">
                <div className="relative">
                    <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
                    <div className="absolute inset-0 h-2 w-2 rounded-full bg-emerald-500 animate-ping opacity-75"></div>
                </div>
                <span className="text-sm text-zinc-400">Current:</span>
                <span className="text-lg font-bold text-white">{data.currentPrice.toFixed(decimalPlaces)}</span>
            </div>
        </div>
    );
}
