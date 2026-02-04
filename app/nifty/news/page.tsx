import Sidebar from '../../components/Sidebar';

export default function NiftyNews() {
    return (
        <div className="min-h-screen gradient-bg">
            <Sidebar market="nifty" />

            <main className="ml-64 min-h-screen p-8 transition-all duration-300">
                <header className="mb-8">
                    <h1 className="text-4xl font-bold text-white mb-2">Indian Market News</h1>
                    <p className="text-zinc-400">Latest updates on NIFTY, NSE, BSE, and Indian economy</p>
                </header>

                <div className="glass-card rounded-2xl p-8">
                    <div className="flex items-center justify-center flex-col gap-4 py-12">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-white">Coming Soon</h2>
                        <p className="text-zinc-400 text-center max-w-md">
                            NIFTY 50 news feed will display latest market updates from NSE, BSE, Economic Times,
                            RBI policy announcements, and Indian stock market analysis.
                        </p>
                        <div className="mt-6 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                            <p className="text-sm text-blue-400">
                                💡 <strong>Planned Sources:</strong> Economic Times, MoneyControl, NSE India, BSE, RBI,
                                Yahoo Finance India
                            </p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
