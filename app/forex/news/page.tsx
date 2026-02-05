import Sidebar from '../../components/Sidebar';
import NewsHeadlines from '../../components/NewsHeadlines';

export default function NewsPage() {
    return (
        <div className="min-h-screen gradient-bg">
            <Sidebar />

            <main className="ml-64 min-h-screen p-8">
                {/* Hero Header */}
                <header className="mb-8">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                            </svg>
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-white">Market News</h1>
                            <p className="text-zinc-400">JPY=X • USD/JPY Live Feed</p>
                        </div>
                        <div className="ml-auto flex items-center gap-3">
                            <span className="px-3 py-1.5 rounded-full bg-gradient-to-r from-violet-500/20 to-blue-500/20 text-violet-300 text-xs font-medium border border-violet-500/30 flex items-center gap-1.5">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                                Yahoo Finance
                            </span>
                            <span className="px-4 py-2 rounded-full bg-emerald-500/20 text-emerald-400 text-sm font-medium border border-emerald-500/30 flex items-center gap-2">
                                <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
                                Live Feed
                            </span>
                        </div>
                    </div>
                </header>

                {/* News Grid */}
                <NewsHeadlines />

                {/* Trading Tips Footer */}
                <div className="mt-8 glass-card rounded-2xl p-6">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                        How to Read Forex News
                    </h3>
                    <div className="grid grid-cols-4 gap-4">
                        <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                            <div className="flex items-center gap-2 mb-1">
                                <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                </svg>
                                <span className="text-sm font-medium text-emerald-400">Hawkish Fed</span>
                            </div>
                            <p className="text-xs text-zinc-500">Bullish USD/JPY - Higher rates strengthen USD</p>
                        </div>
                        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                            <div className="flex items-center gap-2 mb-1">
                                <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                                </svg>
                                <span className="text-sm font-medium text-red-400">Hawkish BOJ</span>
                            </div>
                            <p className="text-xs text-zinc-500">Bearish USD/JPY - JPY strengthens on rate hints</p>
                        </div>
                        <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                            <div className="flex items-center gap-2 mb-1">
                                <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                <span className="text-sm font-medium text-amber-400">Risk-Off</span>
                            </div>
                            <p className="text-xs text-zinc-500">JPY safe haven flows - Bearish USD/JPY</p>
                        </div>
                        <div className="p-3 rounded-lg bg-violet-500/10 border border-violet-500/20">
                            <div className="flex items-center gap-2 mb-1">
                                <svg className="w-4 h-4 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
                                </svg>
                                <span className="text-sm font-medium text-violet-400">Intervention</span>
                            </div>
                            <p className="text-xs text-zinc-500">BOJ action causes sharp JPY moves</p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
