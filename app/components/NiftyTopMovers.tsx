'use client';

import { useEffect, useState } from 'react';

type Stock = {
    symbol: string;
    name: string;
    change: number;
    changePercent: number;
    price: number;
};

export default function NiftyTopMovers() {
    const [gainers, setGainers] = useState<Stock[]>([]);
    const [losers, setLosers] = useState<Stock[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'gainers' | 'losers'>('gainers');

    useEffect(() => {
        fetchTopMovers();
        const interval = setInterval(fetchTopMovers, 300000); // Update every 5 minutes
        return () => clearInterval(interval);
    }, []);

    const fetchTopMovers = async () => {
        try {
            // Placeholder - in production, this would fetch real NIFTY 50 stock data
            // For now, using mock data
            const mockGainers: Stock[] = [
                { symbol: 'RELIANCE', name: 'Reliance Industries', change: 45.30, changePercent: 2.15, price: 2155.75 },
                { symbol: 'TCS', name: 'Tata Consultancy Services', change: 62.80, changePercent: 1.95, price: 3285.40 },
                { symbol: 'INFY', name: 'Infosys', change: 28.50, changePercent: 1.85, price: 1568.90 },
                { symbol: 'HDFCBANK', name: 'HDFC Bank', change: 25.60, changePercent: 1.72, price: 1515.30 },
                { symbol: 'ICICIBANK', name: 'ICICI Bank', change: 18.40, changePercent: 1.65, price: 1135.80 },
            ];

            const mockLosers: Stock[] = [
                { symbol: 'BAJFINANCE', name: 'Bajaj Finance', change: -85.20, changePercent: -1.95, price: 4285.50 },
                { symbol: 'MARUTI', name: 'Maruti Suzuki', change: -125.30, changePercent: -1.78, price: 6920.40 },
                { symbol: 'TATAMOTORS', name: 'Tata Motors', change: -8.45, changePercent: -1.65, price: 503.85 },
                { symbol: 'ASIANPAINT', name: 'Asian Paints', change: -42.80, changePercent: -1.52, price: 2772.60 },
                { symbol: 'WIPRO', name: 'Wipro', change: -5.65, changePercent: -1.38, price: 403.15 },
            ];

            setGainers(mockGainers);
            setLosers(mockLosers);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching top movers:', error);
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="animate-pulse space-y-3">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-16 bg-zinc-800/30 rounded-xl"></div>
                ))}
            </div>
        );
    }

    const displayStocks = activeTab === 'gainers' ? gainers : losers;

    return (
        <div>
            {/* Tabs */}
            <div className="flex gap-2 mb-4">
                <button
                    onClick={() => setActiveTab('gainers')}
                    className={`flex-1 py-2 px-4 rounded-xl font-medium transition-all ${activeTab === 'gainers'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-zinc-800/30 text-zinc-500 hover:text-zinc-300'
                        }`}
                >
                    <div className="flex items-center justify-center gap-2">
                        <span>📈</span>
                        <span>Top Gainers</span>
                    </div>
                </button>
                <button
                    onClick={() => setActiveTab('losers')}
                    className={`flex-1 py-2 px-4 rounded-xl font-medium transition-all ${activeTab === 'losers'
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            : 'bg-zinc-800/30 text-zinc-500 hover:text-zinc-300'
                        }`}
                >
                    <div className="flex items-center justify-center gap-2">
                        <span>📉</span>
                        <span>Top Losers</span>
                    </div>
                </button>
            </div>

            {/* Stock List */}
            <div className="space-y-2">
                {displayStocks.map((stock, index) => (
                    <div
                        key={stock.symbol}
                        className="p-4 rounded-xl bg-zinc-800/30 hover:bg-zinc-800/50 transition-all cursor-pointer group"
                    >
                        <div className="flex items-center justify-between">
                            {/* Left - Stock Info */}
                            <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${activeTab === 'gainers'
                                        ? 'bg-emerald-500/20 text-emerald-400'
                                        : 'bg-rose-500/20 text-rose-400'
                                    }`}>
                                    #{index + 1}
                                </div>
                                <div>
                                    <div className="font-medium text-white group-hover:text-cyan-400 transition-colors">
                                        {stock.symbol}
                                    </div>
                                    <div className="text-xs text-zinc-500 truncate max-w-[150px]">
                                        {stock.name}
                                    </div>
                                </div>
                            </div>

                            {/* Right - Price & Change */}
                            <div className="text-right">
                                <div className="text-sm font-medium text-white">
                                    ₹{stock.price.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                                </div>
                                <div className={`text-xs font-medium ${stock.change >= 0 ? 'text-emerald-400' : 'text-rose-400'
                                    }`}>
                                    {stock.change >= 0 ? '+' : ''}{stock.change.toFixed(2)} ({stock.changePercent >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%)
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Note */}
            <div className="mt-4 p-3 rounded-xl bg-blue-500/5 border border-blue-500/20">
                <div className="text-xs text-blue-400">
                    💡 Mock data shown. Connect to NSE API for real-time NIFTY 50 stock prices.
                </div>
            </div>
        </div>
    );
}
