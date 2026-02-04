'use client';

import { useEffect, useState } from 'react';
import { fetchWithCache } from '../lib/browserCache';

type MacroData = {
    us10yYield: number | null;
    usInflation: number | null;
    japanInflation: number | null;
    lastUpdated: string;
    cached?: boolean;
};

type MacroResponse = MacroData & { error?: string };

export default function MacroCard() {
    const [data, setData] = useState<MacroData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [browserCached, setBrowserCached] = useState(false);

    useEffect(() => {
        fetchWithCache<MacroResponse>('macro', '/api/macro')
            .then(({ data: json, fromBrowserCache }) => {
                setBrowserCached(fromBrowserCache);
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
            <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-zinc-800/30 animate-pulse">
                        <div className="h-4 bg-zinc-700/50 rounded w-24"></div>
                        <div className="h-5 bg-zinc-700/50 rounded w-16"></div>
                    </div>
                ))}
            </div>
        );
    }
    if (error) {
        return (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                {error}
            </div>
        );
    }
    if (!data) {
        return (
            <div className="p-4 rounded-xl bg-zinc-800/40 text-zinc-500 text-sm">
                No macro data available.
            </div>
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
    const getYieldColor = (val: number | null) => {
        if (val === null) return 'text-zinc-400';
        if (val >= 4.5) return 'text-emerald-400';
        if (val >= 3.5) return 'text-amber-400';
        return 'text-red-400';
    };

    // Inflation color (higher = more hawkish)
    const getInflationColor = (val: number | null) => {
        if (val === null) return 'text-zinc-400';
        if (val >= 3) return 'text-red-400';
        if (val >= 2) return 'text-amber-400';
        return 'text-emerald-400';
    };

    const macroItems = [
        {
            label: 'US 10Y Yield',
            value: formatValue(data.us10yYield, '%'),
            color: getYieldColor(data.us10yYield),
            icon: (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            ),
            tag: 'Treasury',
        },
        {
            label: 'US Inflation',
            value: formatValue(data.usInflation, '%'),
            color: getInflationColor(data.usInflation),
            icon: (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
            ),
            tag: 'CPI',
        },
        {
            label: 'Japan Inflation',
            value: formatValue(data.japanInflation, '%'),
            color: getInflationColor(data.japanInflation),
            icon: (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
            ),
            tag: 'CPI',
        },
        {
            label: 'Inflation Spread',
            value: inflationDiff !== null ? (inflationDiff > 0 ? '+' : '') + inflationDiff.toFixed(2) + '%' : '—',
            color: inflationDiff !== null ? (inflationDiff > 0 ? 'text-emerald-400' : 'text-red-400') : 'text-zinc-400',
            icon: (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
            ),
            tag: 'US − JP',
        },
    ];

    return (
        <div className="space-y-2">
            {macroItems.map((item, index) => (
                <div
                    key={item.label}
                    className="flex items-center justify-between p-3 rounded-xl bg-zinc-800/30 border border-zinc-700/20 hover:border-zinc-600/40 transition-all group"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-zinc-700/30 flex items-center justify-center text-zinc-500 group-hover:text-zinc-400 transition-colors">
                            {item.icon}
                        </div>
                        <div>
                            <div className="text-sm font-medium text-zinc-300">{item.label}</div>
                            <div className="text-xs text-zinc-600">{item.tag}</div>
                        </div>
                    </div>
                    <div className={`text-lg font-bold ${item.color}`}>
                        {item.value}
                    </div>
                </div>
            ))}

            {/* Footer */}
            <div className="flex items-center justify-between pt-2 text-xs text-zinc-600">
                <span>Updated: {new Date(data.lastUpdated).toLocaleDateString()}</span>
                <div className="flex items-center gap-2">
                    {browserCached && (
                        <span className="flex items-center gap-1 text-blue-400">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                            </svg>
                            Browser
                        </span>
                    )}
                    {data.cached && <span>Server • 24h</span>}
                </div>
            </div>
        </div>
    );
}
