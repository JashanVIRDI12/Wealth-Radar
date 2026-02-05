import { NextResponse } from 'next/server';

const YAHOO_FINANCE_URL = 'https://query1.finance.yahoo.com/v8/finance/chart/EURUSD=X';

type YahooChartResponse = {
    chart: {
        result?: [{
            meta: {
                regularMarketPrice: number;
                previousClose: number;
                regularMarketDayHigh?: number;
                regularMarketDayLow?: number;
                symbol: string;
            };
            timestamp?: number[];
            indicators?: {
                quote?: [{
                    close: (number | null)[];
                    high?: (number | null)[];
                    low?: (number | null)[];
                    open?: (number | null)[];
                }];
            };
        }];
        error?: { code: string; description: string };
    };
};

// Calculate RSI
function calculateRSI(closes: number[], period = 14): number {
    if (closes.length < period + 1) return 50;

    let gains = 0;
    let losses = 0;

    for (let i = closes.length - period; i < closes.length; i++) {
        const diff = closes[i] - closes[i - 1];
        if (diff > 0) gains += diff;
        else losses += Math.abs(diff);
    }

    const avgGain = gains / period;
    const avgLoss = losses / period;

    if (avgLoss === 0) return 100;
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
}

// Calculate EMA
function calculateEMA(closes: number[], period: number): number {
    if (closes.length < period) return closes[closes.length - 1] || 0;

    const multiplier = 2 / (period + 1);
    let ema = closes.slice(0, period).reduce((a, b) => a + b, 0) / period;

    for (let i = period; i < closes.length; i++) {
        ema = (closes[i] - ema) * multiplier + ema;
    }

    return ema;
}

// Determine trend
function determineTrend(price: number, ema20: number, ema50: number): 'uptrend' | 'downtrend' | 'sideways' {
    const aboveEma20 = price > ema20;
    const ema20AboveEma50 = ema20 > ema50;

    if (aboveEma20 && ema20AboveEma50) return 'uptrend';
    if (!aboveEma20 && !ema20AboveEma50) return 'downtrend';
    return 'sideways';
}

export async function GET() {
    try {
        // Fetch 5 days of 15-minute data for indicator calculation
        const url = `${YAHOO_FINANCE_URL}?interval=15m&range=5d`;

        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            },
            next: { revalidate: 60 }, // Cache for 1 minute
        });

        if (!response.ok) {
            throw new Error(`Yahoo Finance API error: ${response.status}`);
        }

        const data: YahooChartResponse = await response.json();

        if (data.chart.error) {
            throw new Error(data.chart.error.description);
        }

        const result = data.chart.result?.[0];
        if (!result) {
            throw new Error('No data returned from Yahoo Finance');
        }

        const { meta, indicators } = result;
        const quotes = indicators?.quote?.[0];
        const closes = quotes?.close?.filter((c): c is number => c !== null) || [];
        const highs = quotes?.high?.filter((h): h is number => h !== null) || [];
        const lows = quotes?.low?.filter((l): l is number => l !== null) || [];

        // Current price
        const price = meta.regularMarketPrice;
        const previousClose = meta.previousClose;
        const priceChange = price - previousClose;
        const priceChangePercent = (priceChange / previousClose) * 100;

        // Calculate indicators
        const rsi = calculateRSI(closes);
        const ema20 = calculateEMA(closes, 20);
        const ema50 = calculateEMA(closes, 50);
        const trend = determineTrend(price, ema20, ema50);

        // Day high/low
        const dayHigh = meta.regularMarketDayHigh || Math.max(...highs.slice(-26)); // ~6.5 hours
        const dayLow = meta.regularMarketDayLow || Math.min(...lows.slice(-26));

        return NextResponse.json({
            symbol: 'EURUSD',
            price,
            previousClose,
            priceChange: Number(priceChange.toFixed(5)),
            priceChangePercent: Number(priceChangePercent.toFixed(2)),
            dayHigh: Number(dayHigh.toFixed(5)),
            dayLow: Number(dayLow.toFixed(5)),
            rsi: Number(rsi.toFixed(1)),
            ema20: Number(ema20.toFixed(5)),
            ema50: Number(ema50.toFixed(5)),
            trend,
            lastUpdated: new Date().toISOString(),
            source: 'yahoo_finance',
        });
    } catch (error) {
        console.error('EURUSD indicators API error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch EURUSD data', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}
