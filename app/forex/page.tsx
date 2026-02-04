import TradingViewWidget from '../components/TradingViewWidget';
import AISummaryCard from '../components/AISummaryCard';
import MacroCard from '../components/MacroCard';
import Sidebar from '../components/Sidebar';
import SessionClock from '../components/SessionClock';
import QuickBiasPanel from '../components/QuickBiasPanel';
import PivotATRCard from '../components/PivotATRCard';
import IntraScanner from '../components/IntraScanner';
import KeyLevelsCard from '../components/KeyLevelsCard';

export default function ForexDashboard() {
    return (
        <div className="min-h-screen gradient-bg">
            {/* Sidebar - Hidden on mobile */}
            <div className="hidden lg:block">
                <Sidebar market="forex" />
            </div>

            {/* Main Content - responsive margin */}
            <main className="lg:ml-64 min-h-screen p-4 sm:p-6 lg:p-8 transition-all duration-300">
                {/* Top Header Bar */}
                <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">Forex Dashboard</h1>
                        <p className="text-sm sm:text-base text-zinc-400">Monitor USD/JPY trading signals in real-time</p>
                    </div>
                    <div className="flex items-center gap-3 sm:gap-4">
                        {/* Live Status Badge */}
                        <div className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl glass-card">
                            <div className="relative">
                                <div className="h-2 sm:h-2.5 w-2 sm:w-2.5 rounded-full bg-emerald-500 pulse-glow"></div>
                                <div className="absolute inset-0 h-2 sm:h-2.5 w-2 sm:w-2.5 rounded-full bg-emerald-500 animate-ping opacity-75"></div>
                            </div>
                            <span className="text-xs sm:text-sm font-medium text-zinc-300">Markets Open</span>
                        </div>
                        {/* Time - Hidden on very small screens */}
                        <div className="hidden sm:block px-4 py-2 rounded-xl glass-card">
                            <span className="text-sm text-zinc-400">
                                {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                            </span>
                        </div>
                    </div>
                </header>

                {/* Quick Bias Panel - Below Header */}
                <div className="mb-4 sm:mb-6 overflow-x-auto">
                    <QuickBiasPanel />
                </div>

                {/* Main Grid Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
                    {/* Left/Main Column */}
                    <div className="lg:col-span-8 space-y-4 sm:space-y-6">
                        {/* Chart Section */}
                        <div className="glass-card rounded-xl sm:rounded-2xl p-3 sm:p-4 transition-all duration-300">
                            <div className="flex items-center justify-between mb-3 sm:mb-4">
                                <div className="flex items-center gap-2 sm:gap-3">
                                    <div className="text-lg sm:text-xl font-bold text-white">USD/JPY</div>
                                    <span className="badge badge-emerald text-xs">LIVE</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs sm:text-sm text-zinc-400">
                                    <span>15m</span>
                                    <span className="hidden sm:inline">•</span>
                                    <span className="hidden sm:inline">TradingView</span>
                                </div>
                            </div>

                            {/* TradingView Widget */}
                            <div className="chart-container rounded-lg sm:rounded-xl overflow-hidden">
                                <TradingViewWidget
                                    symbol="FX:USDJPY"
                                    width="100%"
                                    height={300}
                                />
                            </div>
                        </div>

                        {/* Unified Intra Scanner */}
                        <div className="glass-card rounded-xl sm:rounded-2xl p-4 sm:p-6 transition-all duration-300">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center shadow-lg shadow-rose-500/20">
                                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="text-sm sm:text-base font-semibold text-white">Intra Scanner</h3>
                                    <p className="text-xs text-zinc-500">Unified signal • MTF • Key Levels</p>
                                </div>
                            </div>
                            <IntraScanner />
                        </div>

                        {/* AI Summary Card */}
                        <AISummaryCard />
                    </div>

                    {/* Right Column - Data Cards */}
                    <div className="lg:col-span-4 space-y-4 sm:space-y-6">

                        {/* Session Clock Card */}
                        <div className="glass-card rounded-xl sm:rounded-2xl p-4 sm:p-5 transition-all duration-300">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="text-sm sm:text-base font-semibold text-white">Session Clock</h3>
                                    <p className="text-xs text-zinc-500">Forex Trading Sessions</p>
                                </div>
                            </div>
                            <SessionClock />
                        </div>

                        {/* Key Levels Card */}
                        <div className="glass-card rounded-xl sm:rounded-2xl p-4 sm:p-5 transition-all duration-300">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center shadow-lg shadow-sky-500/20">
                                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="text-sm sm:text-base font-semibold text-white">Key Levels</h3>
                                    <p className="text-xs text-zinc-500">PDH/PDL/PDC • Sessions</p>
                                </div>
                            </div>
                            <KeyLevelsCard />
                        </div>

                        {/* Pivot & ATR Card */}
                        <div className="glass-card rounded-xl sm:rounded-2xl p-4 sm:p-5 transition-all duration-300">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-br from-fuchsia-500 to-pink-600 flex items-center justify-center shadow-lg shadow-fuchsia-500/20">
                                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="text-sm sm:text-base font-semibold text-white">Pivots & Volatility</h3>
                                    <p className="text-xs text-zinc-500">ATR • S/R Levels</p>
                                </div>
                            </div>
                            <PivotATRCard />
                        </div>

                        {/* Macro Data Card */}
                        <div className="glass-card rounded-xl sm:rounded-2xl p-4 sm:p-5 transition-all duration-300">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                                        <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h3 className="text-sm sm:text-base font-semibold text-white">Macro Data</h3>
                                        <p className="text-xs text-zinc-500">FRED • 24h cache</p>
                                    </div>
                                </div>
                            </div>
                            <MacroCard />
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
