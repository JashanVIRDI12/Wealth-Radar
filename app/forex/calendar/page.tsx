import Sidebar from '../../components/Sidebar';
import EconomicCalendar from '../../components/EconomicCalendar';

export default function CalendarPage() {
    return (
        <div className="min-h-screen gradient-bg">
            <Sidebar />

            <main className="ml-64 min-h-screen p-8">
                {/* Header */}
                <header className="mb-8">
                    <h1 className="text-3xl font-bold text-white mb-2">Economic Calendar</h1>
                    <p className="text-zinc-400">High-impact economic events for USD & JPY</p>
                </header>

                {/* Calendar Content */}
                <div className="glass-card rounded-2xl p-6">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold text-white">Upcoming Events</h2>
                            <p className="text-sm text-zinc-500">Next 72 hours • High impact only</p>
                        </div>
                    </div>

                    <EconomicCalendar />
                </div>

                {/* Legend */}
                <div className="mt-6 p-4 glass-card rounded-xl">
                    <h3 className="text-sm font-medium text-white mb-3">Understanding Events</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div className="flex items-start gap-2">
                            <span className="text-amber-400">🔥</span>
                            <div>
                                <div className="text-zinc-300 font-medium">High Impact</div>
                                <div className="text-zinc-500 text-xs">Can move markets 50+ pips</div>
                            </div>
                        </div>
                        <div className="flex items-start gap-2">
                            <span className="text-emerald-400">📈</span>
                            <div>
                                <div className="text-zinc-300 font-medium">Better than Expected</div>
                                <div className="text-zinc-500 text-xs">Generally bullish for currency</div>
                            </div>
                        </div>
                        <div className="flex items-start gap-2">
                            <span className="text-red-400">📉</span>
                            <div>
                                <div className="text-zinc-300 font-medium">Worse than Expected</div>
                                <div className="text-zinc-500 text-xs">Generally bearish for currency</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Key Events Info */}
                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="glass-card rounded-xl p-5">
                        <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                            <span className="text-2xl">🇺🇸</span> Key USD Events
                        </h3>
                        <ul className="space-y-2 text-sm text-zinc-400">
                            <li>• <span className="text-white">FOMC Rate Decision</span> - Most impactful</li>
                            <li>• <span className="text-white">Non-Farm Payrolls</span> - Employment data</li>
                            <li>• <span className="text-white">CPI (Inflation)</span> - Price stability</li>
                            <li>• <span className="text-white">Fed Chair Speech</span> - Policy hints</li>
                            <li>• <span className="text-white">GDP</span> - Economic growth</li>
                        </ul>
                    </div>

                    <div className="glass-card rounded-xl p-5">
                        <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                            <span className="text-2xl">🇯🇵</span> Key JPY Events
                        </h3>
                        <ul className="space-y-2 text-sm text-zinc-400">
                            <li>• <span className="text-white">BOJ Rate Decision</span> - Most impactful</li>
                            <li>• <span className="text-white">BOJ Policy Statement</span> - Policy direction</li>
                            <li>• <span className="text-white">Tankan Survey</span> - Business sentiment</li>
                            <li>• <span className="text-white">CPI (Inflation)</span> - Price stability</li>
                            <li>• <span className="text-white">Trade Balance</span> - Import/Export data</li>
                        </ul>
                    </div>
                </div>
            </main>
        </div>
    );
}
