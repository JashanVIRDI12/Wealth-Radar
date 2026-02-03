import TradingViewWidget from './components/TradingViewWidget';
import NewsHeadlines from './components/NewsHeadlines';
import IndicatorsCard from './components/IndicatorsCard';
import AISummaryCard from './components/AISummaryCard';
import MacroCard from './components/MacroCard';
import EconomicCalendar from './components/EconomicCalendar';

export default function Home() {
  return (
    <div className="min-h-screen bg-black font-sans">
      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-zinc-50 mb-2">
            Hybrid Trader
          </h1>
          <p className="text-zinc-400 text-lg">
            Live USDJPY Price Chart
          </p>
        </div>

        {/* Price Display Card */}
        <div className="bg-zinc-900 rounded-2xl p-6 shadow-2xl border border-zinc-800">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-zinc-50">USD/JPY</h2>
              <p className="text-sm text-zinc-500">15 Minute Chart</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-sm text-zinc-400">Live</span>
            </div>
          </div>

          {/* TradingView Widget */}
          <div className="rounded-lg overflow-hidden">
            <TradingViewWidget
              symbol="FX:USDJPY"
              width="100%"
              height={600}
            />
          </div>

          {/* RSI, EMA 20, EMA 50, Trend — Twelve Data, 15m interval, 30 min cache */}
          <div className="mt-6 pt-6 border-t border-zinc-800">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-base font-semibold text-zinc-50">Indicators</h3>
              <span className="text-xs text-zinc-600">RSI · EMA 20/50 · Trend · 30 min cache</span>
            </div>
            <IndicatorsCard />
          </div>
        </div>

        {/* FRED Macro Data — US 10Y Yield, US/JP Inflation */}
        <div className="mt-8 bg-zinc-900 rounded-2xl p-6 shadow-2xl border border-zinc-800">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-zinc-50">Macro</h2>
            <span className="text-xs text-zinc-600">FRED · 10Y Yield · US/JP Inflation · 24h cache</span>
          </div>
          <MacroCard />
        </div>

        {/* Economic Calendar — FMP: CPI, NFP, Fed, BOJ events */}
        <div className="mt-8 bg-zinc-900 rounded-2xl p-6 shadow-2xl border border-zinc-800">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-zinc-50">Economic Calendar</h2>
            <span className="text-xs text-zinc-600">FMP · High Impact · US/JP · 1h cache</span>
          </div>
          <EconomicCalendar />
        </div>

        {/* News (STRICTLY LIMITED) — Fed, BOJ, USD/JPY, max 5, cache 10 min */}
        <div className="mt-8 bg-zinc-900 rounded-2xl p-6 shadow-2xl border border-zinc-800">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-zinc-50">News</h2>
            <span className="text-xs text-zinc-600">Fed · BOJ · USD/JPY · 15 min cache</span>
          </div>
          <NewsHeadlines />
        </div>

        {/* AI Trading Summary — Auto-loads comprehensive analysis with caching */}
        <div className="mt-8">
          <AISummaryCard />
        </div>

        {/* Footer Info */}
        <div className="mt-6 text-center">
          <p className="text-sm text-zinc-600">
            Powered by TradingView • Data updates in real-time
          </p>
        </div>
      </main>
    </div>
  );
}
