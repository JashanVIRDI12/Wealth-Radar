import Sidebar from '../components/Sidebar';
import TradingViewWidget from '../components/TradingViewWidget';

export default function NiftyDashboard() {
    return (
        <div className="min-h-screen gradient-bg">
            <Sidebar market="nifty" />

            <main className="ml-64 min-h-screen p-8 transition-all duration-300">
                {/* Header */}
                <header className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-1">NIFTY 50</h1>
                        <p className="text-zinc-400">India's benchmark stock index</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="px-4 py-2 rounded-xl glass-card">
                            <span className="text-sm text-zinc-400">NSE India</span>
                        </div>
                    </div>
                </header>

                {/* Main Chart */}
                <div className="glass-card rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <span className="text-xl font-bold text-white">NIFTY 50</span>
                            <span className="px-2 py-1 text-xs font-medium bg-cyan-500/20 text-cyan-400 rounded-lg">
                                LIVE
                            </span>
                        </div>
                    </div>

                    <div className="rounded-xl overflow-hidden" style={{ height: '500px' }}>
                        <TradingViewWidget
                            symbol="NSE:NIFTY"
                            width="100%"
                            height={500}
                        />
                    </div>
                </div>

                {/* Coming Soon Notice */}
                <div className="mt-8 p-6 rounded-2xl bg-cyan-500/5 border border-cyan-500/20">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-cyan-500/20 flex items-center justify-center">
                            <span className="text-2xl">🚀</span>
                        </div>
                        <div>
                            <h3 className="text-white font-semibold mb-1">Building Your NIFTY Dashboard</h3>
                            <p className="text-zinc-400 text-sm">
                                Components will be added one by one. Start with the chart, then we'll add indicators,
                                key levels, and more based on your preferences.
                            </p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
