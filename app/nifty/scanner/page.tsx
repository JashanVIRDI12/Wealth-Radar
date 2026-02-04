import Sidebar from '../../components/Sidebar';
import NiftyTopMovers from '../../components/NiftyTopMovers';

export default function NiftyScanner() {
    return (
        <div className="min-h-screen gradient-bg">
            <Sidebar market="nifty" />

            <main className="ml-64 min-h-screen p-8 transition-all duration-300">
                <header className="mb-8">
                    <h1 className="text-4xl font-bold text-white mb-2">NIFTY 50 Scanner</h1>
                    <p className="text-zinc-400">Real-time stock screening and market breadth analysis</p>
                </header>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    {/* Top Movers */}
                    <div className="glass-card rounded-2xl p-6">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                </svg>
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white">Top Stocks</h2>
                                <p className="text-sm text-zinc-500">NIFTY 50 Constituents</p>
                            </div>
                        </div>
                        <NiftyTopMovers />
                    </div>

                    {/* Sector Performance */}
                    <div className="glass-card rounded-2xl p-6">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white">Sector Performance</h2>
                                <p className="text-sm text-zinc-500">Coming Soon</p>
                            </div>
                        </div>

                        <div className="flex items-center justify-center py-12">
                            <div className="text-center">
                                <div className="text-6xl mb-4">📊</div>
                                <p className="text-zinc-400 max-w-sm">
                                    Sector rotation analysis, heatmaps, and sectoral indices performance will be displayed here.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Market Breadth */}
                    <div className="glass-card rounded-2xl p-6">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                                </svg>
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white">Market Breadth</h2>
                                <p className="text-sm text-zinc-500">Advance/Decline Ratio</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {['Advances', 'Declines', 'Unchanged', '52-Week High', '52-Week Low'].map((label, index) => (
                                <div key={label} className="flex items-center justify-between p-4 rounded-xl bg-zinc-800/30">
                                    <span className="text-zinc-400">{label}</span>
                                    <span className="text-xl font-bold text-white">--</span>
                                </div>
                            ))}
                        </div>

                        <div className="mt-6 p-4 rounded-xl bg-purple-500/10 border border-purple-500/20">
                            <p className="text-xs text-purple-400">
                                💡 Connect to NSE API for real-time market breadth data
                            </p>
                        </div>
                    </div>

                    {/* Technical Screening */}
                    <div className="glass-card rounded-2xl p-6">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white">Technical Screener</h2>
                                <p className="text-sm text-zinc-500">Filter by Signals</p>
                            </div>
                        </div>

                        <div className="space-y-3">
                            {[
                                { label: 'Bullish Crossover', count: '--' },
                                { label: 'RSI Oversold (<30)', count: '--' },
                                { label: 'RSI Overbought (>70)', count: '--' },
                                { label: 'Above 200 SMA', count: '--' },
                                { label: 'Below 200 SMA', count: '--' },
                                { label: 'Volume Breakout', count: '--' },
                            ].map((item) => (
                                <div key={item.label} className="flex items-center justify-between p-3 rounded-lg bg-zinc-800/30 hover:bg-zinc-800/50 transition-colors cursor-pointer">
                                    <span className="text-sm text-zinc-300">{item.label}</span>
                                    <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 text-xs font-medium">
                                        {item.count}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Info Banner */}
                <div className="mt-8 glass-card rounded-2xl p-6 border border-blue-500/20">
                    <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                            <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-white font-semibold mb-2">NIFTY Scanner - In Development</h3>
                            <p className="text-zinc-400 text-sm">
                                This page is currently showing placeholder data. To unlock full functionality,
                                integrate with NSE/BSE APIs or services like Trading View, Yahoo Finance, or AlphaVantage
                                to get real-time data for all NIFTY 50 stocks, sectoral indices, and market breadth metrics.
                            </p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
