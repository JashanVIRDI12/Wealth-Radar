'use client';

import { useEffect, useState } from 'react';
import { fetchWithCache, type CacheKey } from '../lib/browserCache';

type PivotData = {
    dailyOHLC: {
        open: number;
        high: number;
        low: number;
        close: number;
        date: string;
    };
    pivots: {
        pp: number;
        r1: number;
        r2: number;
        r3: number;
        s1: number;
        s2: number;
        s3: number;
    };
    atr: {
        value: number;
        period: number;
        volatility: 'low' | 'medium' | 'high';
    };
    pricePosition: {
        nearestLevel: string;
        nearestValue: number;
        distance: number;
        distancePercent: number;
        zone: string;
    };
    rangeAnalysis: {
        todayHigh: number;
        todayLow: number;
        currentRange: number;
        atrPercent: number;
        rangeRemaining: number;
    };
    lastUpdated: string;
    cached?: boolean;
    stale?: boolean;
    error?: string;
};

type PivotATRCardProps = {
    apiUrl?: string;
    cacheKey?: CacheKey;
    decimalPlaces?: number;
    pipScale?: number;
};

export default function PivotATRCard({
    apiUrl = '/api/pivots',
    cacheKey = 'pivots',
    decimalPlaces = 3,
    pipScale = 1,
}: PivotATRCardProps) {
    const [data, setData] = useState<PivotData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [browserCached, setBrowserCached] = useState(false);

    useEffect(() => {
        fetchWithCache<PivotData>(cacheKey, apiUrl)
            .then(({ data: json, fromBrowserCache }) => {
                setBrowserCached(fromBrowserCache);
                if (json.error) {
                    setError(json.error);
                    return;
                }
                setData(json);
            })
            .catch(() => setError('Failed to load pivot data'))
            .finally(() => setLoading(false));
    }, [apiUrl, cacheKey]);

    if (loading) {
        return (
            <div className="space-y-3">
                <div className="h-16 bg-zinc-800/30 rounded-xl animate-pulse"></div>
                <div className="grid grid-cols-3 gap-2">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="h-12 bg-zinc-800/30 rounded-lg animate-pulse"></div>
                    ))}
                </div>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                {error || 'Unable to load pivot data'}
            </div>
        );
    }

    const getVolatilityColor = () => {
        if (data.atr.volatility === 'high') return 'from-red-500 to-rose-600';
        if (data.atr.volatility === 'medium') return 'from-amber-500 to-orange-600';
        return 'from-emerald-500 to-teal-600';
    };

    const getVolatilityLabel = () => {
        if (data.atr.volatility === 'high') return 'High Volatility';
        if (data.atr.volatility === 'medium') return 'Normal';
        return 'Low Volatility';
    };

    const getZoneColor = () => {
        const zone = data.pricePosition.zone;
        if (zone === 'above_r2' || zone === 'r1_r2') return 'text-emerald-400';
        if (zone === 'below_s2' || zone === 's1_s2') return 'text-red-400';
        return 'text-amber-400';
    };

    const getZoneLabel = () => {
        const zone = data.pricePosition.zone;
        if (zone === 'above_r2') return 'Strongly Bullish Zone';
        if (zone === 'r1_r2') return 'Bullish Zone';
        if (zone === 'pp_r1') return 'Mildly Bullish';
        if (zone === 's1_pp') return 'Mildly Bearish';
        if (zone === 's1_s2') return 'Bearish Zone';
        return 'Strongly Bearish Zone';
    };

    // Calculate range used percentage bar
    const rangeUsedPercent = Math.min(100, data.rangeAnalysis.atrPercent);

    const atrPips = data.atr.value * pipScale;
    const nearestDistancePips = data.pricePosition.distance * pipScale;

    return (
        <div className="space-y-4">
            {/* ATR & Volatility Header */}
            <div className={`p-4 rounded-xl bg-gradient-to-r ${getVolatilityColor()} shadow-lg`}>
                <div className="flex items-center justify-between">
                    <div>
                        <div className="text-xs text-white/70 uppercase tracking-wide">Volatility (ATR 14)</div>
                        <div className="text-xl font-bold text-white">{getVolatilityLabel()}</div>
                    </div>
                    <div className="text-right">
                        <div className="text-3xl font-bold text-white">{atrPips.toFixed(2)}</div>
                        <div className="text-xs text-white/70">pips expected range</div>
                    </div>
                </div>
            </div>

            {/* Price Position */}
            <div className="p-3 rounded-xl bg-violet-500/10 border border-violet-500/20">
                <div className="flex items-center justify-between">
                    <div>
                        <div className="text-xs text-zinc-500">Price Zone</div>
                        <div className={`text-lg font-bold ${getZoneColor()}`}>{getZoneLabel()}</div>
                    </div>
                    <div className="text-right">
                        <div className="text-xs text-zinc-500">Nearest: {data.pricePosition.nearestLevel}</div>
                        <div className="text-sm font-medium text-violet-400">
                            {data.pricePosition.nearestValue.toFixed(decimalPlaces)} ({nearestDistancePips.toFixed(2)} pips)
                        </div>
                    </div>
                </div>
            </div>

            {/* Pivot Levels Grid */}
            <div>
                <div className="text-xs text-zinc-500 uppercase tracking-wide mb-2 px-1">Support & Resistance</div>
                <div className="grid grid-cols-2 gap-2">
                    {/* Resistance Levels */}
                    <div className="space-y-1">
                        <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
                            <span className="text-xs text-emerald-400 font-medium">R3</span>
                            <span className="text-sm font-bold text-white">{data.pivots.r3.toFixed(decimalPlaces)}</span>
                        </div>
                        <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
                            <span className="text-xs text-emerald-400 font-medium">R2</span>
                            <span className="text-sm font-bold text-white">{data.pivots.r2.toFixed(decimalPlaces)}</span>
                        </div>
                        <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
                            <span className="text-xs text-emerald-400 font-medium">R1</span>
                            <span className="text-sm font-bold text-white">{data.pivots.r1.toFixed(decimalPlaces)}</span>
                        </div>
                    </div>

                    {/* Support Levels */}
                    <div className="space-y-1">
                        <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-between">
                            <span className="text-xs text-red-400 font-medium">S1</span>
                            <span className="text-sm font-bold text-white">{data.pivots.s1.toFixed(decimalPlaces)}</span>
                        </div>
                        <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-between">
                            <span className="text-xs text-red-400 font-medium">S2</span>
                            <span className="text-sm font-bold text-white">{data.pivots.s2.toFixed(decimalPlaces)}</span>
                        </div>
                        <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-between">
                            <span className="text-xs text-red-400 font-medium">S3</span>
                            <span className="text-sm font-bold text-white">{data.pivots.s3.toFixed(decimalPlaces)}</span>
                        </div>
                    </div>
                </div>

                {/* Pivot Point */}
                <div className="mt-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-between">
                    <span className="text-sm text-amber-400 font-medium">Pivot Point (PP)</span>
                    <span className="text-lg font-bold text-white">{data.pivots.pp.toFixed(decimalPlaces)}</span>
                </div>
            </div>

            {/* Cache Status */}
            <div className="flex items-center justify-between pt-2 text-xs text-zinc-600">
                <span>Date: {data.dailyOHLC.date}</span>
                <div className="flex items-center gap-2">
                    {browserCached && (
                        <span className="flex items-center gap-1 text-blue-400">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                            </svg>
                            Browser
                        </span>
                    )}
                    {data.stale && <span className="text-amber-400">Stale</span>}
                    <span>Free • Yahoo Finance</span>
                </div>
            </div>
        </div>
    );
}
