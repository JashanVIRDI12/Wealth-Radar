'use client';

import { useEffect, useState } from 'react';

type MacroData = {
    us10yYield: number | null;
    usInflation: number | null;
    japanInflation: number | null;
    lastUpdated: string;
    cached?: boolean;
};

export default function MacroCard() {
    const [data, setData] = useState<MacroData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetch('/api/macro')
            .then((res) => res.json())
            .then((json) => {
                if (json.error && !json.us10yYield && !json.usInflation && !json.japanInflation) {
                    setError(json.error);
                    return;
                }
                setData({
                    us10yYield: json.us10yYield,
                    usInflation: json.usInflation,
                    japanInflation: json.japanInflation,
                    lastUpdated: json.lastUpdated,
                    cached: json.cached,
                });
            })
            .catch(() => setError('Failed to load macro data'))
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div className="text-zinc-500 text-sm animate-pulse">
                Loading FRED macro data…
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
            <p className="text-zinc-500 text-sm">No macro data available.</p>
        );
    }

    // Format values for display
    const formatValue = (val: number | null, suffix: string = '') => {
        if (val === null) return '—';
        return val.toFixed(2) + suffix;
    };

    // Calculate Inflation differential (US - Japan) for rate differential context
    const inflationDiff = data.usInflation !== null && data.japanInflation !== null
        ? (data.usInflation - data.japanInflation)
        : null;

    // Determine yield color based on level (higher yields = USD strength)
    const yieldColor = data.us10yYield !== null
        ? data.us10yYield >= 4.5
            ? 'text-emerald-400'
            : data.us10yYield >= 3.5
                ? 'text-amber-400'
                : 'text-red-400'
        : 'text-zinc-400';

    // Inflation color (higher = more hawkish)
    const getInflationColor = (val: number | null) => {
        if (val === null) return 'text-zinc-400';
        if (val >= 3) return 'text-red-400';
        if (val >= 2) return 'text-amber-400';
        return 'text-emerald-400';
    };

    return (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4" aria-label="FRED Macro Economic Indicators">
            {/* US 10-Year Treasury Yield */}
            <div className="bg-zinc-800/60 rounded-xl p-4 border border-zinc-700/50">
                <div className="text-xs text-zinc-500 uppercase tracking-wider mb-1">US 10Y Yield</div>
                <div className={`text-xl font-semibold ${yieldColor}`}>
                    {formatValue(data.us10yYield, '%')}
                </div>
                <div className="text-xs text-zinc-600 mt-1">Treasury</div>
            </div>

            {/* US Inflation */}
            <div className="bg-zinc-800/60 rounded-xl p-4 border border-zinc-700/50">
                <div className="text-xs text-zinc-500 uppercase tracking-wider mb-1">US Inflation</div>
                <div className={`text-xl font-semibold ${getInflationColor(data.usInflation)}`}>
                    {formatValue(data.usInflation, '%')}
                </div>
                <div className="text-xs text-zinc-600 mt-1">Annual CPI</div>
            </div>

            {/* Japan Inflation */}
            <div className="bg-zinc-800/60 rounded-xl p-4 border border-zinc-700/50">
                <div className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Japan Inflation</div>
                <div className={`text-xl font-semibold ${getInflationColor(data.japanInflation)}`}>
                    {formatValue(data.japanInflation, '%')}
                </div>
                <div className="text-xs text-zinc-600 mt-1">Annual CPI</div>
            </div>

            {/* Inflation Differential */}
            <div className="bg-zinc-800/60 rounded-xl p-4 border border-zinc-700/50">
                <div className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Inflation Spread</div>
                <div className={`text-xl font-semibold ${inflationDiff !== null
                        ? inflationDiff > 0
                            ? 'text-emerald-400'
                            : 'text-red-400'
                        : 'text-zinc-400'
                    }`}>
                    {inflationDiff !== null ? (inflationDiff > 0 ? '+' : '') + inflationDiff.toFixed(2) + '%' : '—'}
                </div>
                <div className="text-xs text-zinc-600 mt-1">US − Japan</div>
            </div>

            {/* Cache status */}
            <div className="col-span-2 sm:col-span-4 flex items-center justify-between flex-wrap gap-2">
                <div className="text-xs text-zinc-600">
                    Last updated: {new Date(data.lastUpdated).toLocaleString()}
                </div>
                {data.cached && (
                    <span className="text-xs text-zinc-600">Cached · 24h</span>
                )}
            </div>
        </div>
    );
}

