'use client';

import { useEffect, useState } from 'react';

type BiasData = {
    bias: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
    strength: number;
    price: number;
    change: number;
    changePercent: number;
};

export default function NiftyQuickBiasPanel() {
    const [data, setData] = useState<BiasData>({
        bias: 'NEUTRAL',
        strength: 0,
        price: 0,
        change: 0,
        changePercent: 0,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchBiasData();
        const interval = setInterval(fetchBiasData, 60000); // Update every minute
        return () => clearInterval(interval);
    }, []);

    const fetchBiasData = async () => {
        try {
            const res = await fetch('/api/nifty-quote');
            const quote = await res.json();

            if (quote.price) {
                // Calculate bias based on price change
                let bias: 'BULLISH' | 'BEARISH' | 'NEUTRAL' = 'NEUTRAL';
                const changePercent = quote.changePercent || 0;

                if (changePercent > 0.5) bias = 'BULLISH';
                else if (changePercent < -0.5) bias = 'BEARISH';

                setData({
                    bias,
                    strength: Math.abs(changePercent) * 10, // Scale strength
                    price: quote.price,
                    change: quote.change || 0,
                    changePercent: changePercent,
                });
            }
            setLoading(false);
        } catch (error) {
            console.error('Error fetching NIFTY bias:', error);
            setLoading(false);
        }
    };

    const biasConfig = {
        BULLISH: {
            gradient: 'from-emerald-500 via-green-500 to-teal-500',
            bgGlow: 'bg-emerald-500/5',
            border: 'border-emerald-500/30',
            text: 'text-emerald-400',
            label: 'STRONG BULLISH',
            icon: '📈',
        },
        BEARISH: {
            gradient: 'from-rose-500 via-red-500 to-pink-500',
            bgGlow: 'bg-rose-500/5',
            border: 'border-rose-500/30',
            text: 'text-rose-400',
            label: 'STRONG BEARISH',
            icon: '📉',
        },
        NEUTRAL: {
            gradient: 'from-zinc-500 via-gray-500 to-slate-500',
            bgGlow: 'bg-zinc-500/5',
            border: 'border-zinc-500/30',
            text: 'text-zinc-400',
            label: 'NEUTRAL',
            icon: '➡️',
        },
    };

    const config = biasConfig[data.bias];

    if (loading) {
        return (
            <div className="glass-card rounded-2xl p-6 animate-pulse">
                <div className="h-24 bg-zinc-800/50 rounded-xl"></div>
            </div>
        );
    }

    return (
        <div className={`glass-card rounded-2xl p-6 border ${config.border} ${config.bgGlow} transition-all duration-500`}>
            <div className="flex items-center justify-between">
                {/* Left - Bias Info */}
                <div className="flex items-center gap-6">
                    {/* Icon */}
                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${config.gradient} flex items-center justify-center shadow-2xl`}>
                        <span className="text-3xl">{config.icon}</span>
                    </div>

                    {/* Bias Label */}
                    <div>
                        <div className="text-xs text-zinc-500 mb-1">Market Bias</div>
                        <div className={`text-2xl font-bold ${config.text} mb-1`}>
                            {config.label}
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="text-xs text-zinc-600">Strength:</div>
                            <div className="flex gap-1">
                                {[...Array(5)].map((_, i) => (
                                    <div
                                        key={i}
                                        className={`h-1.5 w-6 rounded-full transition-all duration-300 ${i < Math.floor(data.strength / 20)
                                                ? `bg-gradient-to-r ${config.gradient}`
                                                : 'bg-zinc-800'
                                            }`}
                                    ></div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right - Price Info */}
                <div className="text-right">
                    <div className="text-xs text-zinc-500 mb-1">NIFTY 50</div>
                    <div className="text-3xl font-bold text-white mb-1">
                        {data.price.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                    </div>
                    <div className={`text-sm font-medium ${data.change >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {data.change >= 0 ? '+' : ''}{data.change.toFixed(2)} ({data.changePercent >= 0 ? '+' : ''}{data.changePercent.toFixed(2)}%)
                    </div>
                </div>
            </div>
        </div>
    );
}
