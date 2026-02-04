import { NextResponse } from 'next/server';

// Cache for 2 minutes to reduce requests
let cache: { data: IndicatorsData; timestamp: number } | null = null;
const CACHE_DURATION = 2 * 60 * 1000; // 2 minutes in milliseconds

type OHLC = {
    timestamp: number;
    open: number;
    high: number;
    low: number;
    close: number;
};

type IndicatorsData = {
    price: number;
    rsi: number;
    ema20: number;
    ema50: number;
    sma20: number;
    sma50: number;
    trend: 'uptrend' | 'downtrend' | 'sideways';
    priceChange: number;
    priceChangePercent: number;
    dayHigh: number;
    dayLow: number;
    lastUpdated: string;
    cached: boolean;
    source: 'yahoo_finance' | 'twelve_data';
};

// Delay function for retry
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Scrape intraday data from Yahoo Finance with retry
async function scrapeYahooFinanceIntraday(retries = 2): Promise<OHLC[]> {
    const symbol = 'USDJPY=X';
    const now = Math.floor(Date.now() / 1000);
    const sevenDaysAgo = now - (7 * 24 * 60 * 60);

    // Try different Yahoo Finance endpoints
    const urls = [
        `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?period1=${sevenDaysAgo}&period2=${now}&interval=15m`,
        `https://query2.finance.yahoo.com/v8/finance/chart/${symbol}?period1=${sevenDaysAgo}&period2=${now}&interval=15m`,
    ];

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= retries; attempt++) {
        const url = urls[attempt % urls.length];

        try {
            if (attempt > 0) {
                await delay(1000 * attempt); // Wait before retry
            }

            const response = await fetch(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
                    'Accept': 'application/json',
                    'Accept-Language': 'en-US,en;q=0.9',
                },
                cache: 'no-store',
            });

            if (response.status === 429) {
                lastError = new Error('Rate limited');
                continue; // Try next attempt
            }

            if (!response.ok) {
                lastError = new Error(`HTTP ${response.status}`);
                continue;
            }

            const data = await response.json();
            const result = data.chart?.result?.[0];

            if (!result || !result.timestamp) {
                lastError = new Error('Invalid response structure');
                continue;
            }

            const timestamps = result.timestamp || [];
            const quotes = result.indicators?.quote?.[0] || {};

            const ohlcData: OHLC[] = [];

            for (let i = 0; i < timestamps.length; i++) {
                if (quotes.open?.[i] && quotes.high?.[i] && quotes.low?.[i] && quotes.close?.[i]) {
                    ohlcData.push({
                        timestamp: timestamps[i],
                        open: quotes.open[i],
                        high: quotes.high[i],
                        low: quotes.low[i],
                        close: quotes.close[i],
                    });
                }
            }

            if (ohlcData.length > 50) {
                return ohlcData;
            }

            lastError = new Error('Insufficient data points');
        } catch (e) {
            lastError = e instanceof Error ? e : new Error('Unknown error');
        }
    }

    throw lastError || new Error('All retry attempts failed');
}

// Fallback: Fetch from Twelve Data API
async function fetchFromTwelveData(): Promise<IndicatorsData | null> {
    const apiKey = process.env.TWELVE_DATA_API_KEY;
    if (!apiKey) return null;

    try {
        const url = `https://api.twelvedata.com/time_series?symbol=USD/JPY&interval=15min&outputsize=100&apikey=${apiKey}`;
        const response = await fetch(url, { cache: 'no-store' });

        if (!response.ok) return null;

        const data = await response.json();
        if (!data.values || !Array.isArray(data.values)) return null;

        const closes = data.values.map((v: { close: string }) => parseFloat(v.close)).reverse();
        const highs = data.values.map((v: { high: string }) => parseFloat(v.high)).reverse();
        const lows = data.values.map((v: { low: string }) => parseFloat(v.low)).reverse();

        if (closes.length < 50) return null;

        const currentPrice = closes[closes.length - 1];
        const previousPrice = closes[closes.length - 2];
        const ema20 = calculateEMA(closes, 20);
        const ema50 = calculateEMA(closes, 50);
        const sma20 = calculateSMA(closes, 20);
        const sma50 = calculateSMA(closes, 50);
        const rsi = calculateRSI(closes, 14);
        const trend = determineTrend(currentPrice, ema20, ema50);
        const priceChange = currentPrice - previousPrice;
        const priceChangePercent = (priceChange / previousPrice) * 100;

        return {
            price: Number(currentPrice.toFixed(3)),
            rsi: rsi,
            ema20: Number(ema20.toFixed(3)),
            ema50: Number(ema50.toFixed(3)),
            sma20: Number(sma20.toFixed(3)),
            sma50: Number(sma50.toFixed(3)),
            trend,
            priceChange: Number(priceChange.toFixed(3)),
            priceChangePercent: Number(priceChangePercent.toFixed(4)),
            dayHigh: Number(Math.max(...highs.slice(-96)).toFixed(3)),
            dayLow: Number(Math.min(...lows.slice(-96)).toFixed(3)),
            lastUpdated: new Date().toISOString(),
            cached: false,
            source: 'twelve_data',
        };
    } catch {
        return null;
    }
}

// Calculate SMA (Simple Moving Average)
function calculateSMA(closes: number[], period: number): number {
    if (closes.length < period) return closes[closes.length - 1];
    const slice = closes.slice(-period);
    return slice.reduce((sum, val) => sum + val, 0) / period;
}

// Calculate EMA (Exponential Moving Average)
function calculateEMA(closes: number[], period: number): number {
    if (closes.length < period) return calculateSMA(closes, closes.length);

    const multiplier = 2 / (period + 1);
    let ema = calculateSMA(closes.slice(0, period), period);

    for (let i = period; i < closes.length; i++) {
        ema = (closes[i] - ema) * multiplier + ema;
    }

    return ema;
}

// Calculate RSI (Relative Strength Index)
function calculateRSI(closes: number[], period: number = 14): number {
    if (closes.length < period + 1) return 50;

    const changes: number[] = [];
    for (let i = 1; i < closes.length; i++) {
        changes.push(closes[i] - closes[i - 1]);
    }

    const recentChanges = changes.slice(-period * 2);

    let avgGain = 0;
    let avgLoss = 0;

    for (let i = 0; i < period && i < recentChanges.length; i++) {
        if (recentChanges[i] > 0) {
            avgGain += recentChanges[i];
        } else {
            avgLoss += Math.abs(recentChanges[i]);
        }
    }

    avgGain /= period;
    avgLoss /= period;

    for (let i = period; i < recentChanges.length; i++) {
        const change = recentChanges[i];
        const gain = change > 0 ? change : 0;
        const loss = change < 0 ? Math.abs(change) : 0;

        avgGain = (avgGain * (period - 1) + gain) / period;
        avgLoss = (avgLoss * (period - 1) + loss) / period;
    }

    if (avgLoss === 0) return 100;

    const rs = avgGain / avgLoss;
    const rsi = 100 - (100 / (1 + rs));

    return Number(rsi.toFixed(2));
}

// Determine trend based on EMAs and price
function determineTrend(price: number, ema20: number, ema50: number): 'uptrend' | 'downtrend' | 'sideways' {
    const ema20Above50 = ema20 > ema50;
    const priceAboveEMA20 = price > ema20;

    if (priceAboveEMA20 && ema20Above50) return 'uptrend';
    if (!priceAboveEMA20 && !ema20Above50) return 'downtrend';
    return 'sideways';
}

export async function GET() {
    try {
        // Check cache (2 minutes)
        if (cache && Date.now() - cache.timestamp < CACHE_DURATION) {
            return NextResponse.json({ ...cache.data, cached: true });
        }

        let indicatorsData: IndicatorsData | null = null;

        // Try Yahoo Finance first
        try {
            const ohlcData = await scrapeYahooFinanceIntraday();

            if (ohlcData.length >= 50) {
                const closes = ohlcData.map(d => d.close);
                const currentPrice = closes[closes.length - 1];
                const previousPrice = closes[closes.length - 2];

                const ema20 = calculateEMA(closes, 20);
                const ema50 = calculateEMA(closes, 50);
                const sma20 = calculateSMA(closes, 20);
                const sma50 = calculateSMA(closes, 50);
                const rsi = calculateRSI(closes, 14);
                const trend = determineTrend(currentPrice, ema20, ema50);
                const priceChange = currentPrice - previousPrice;
                const priceChangePercent = (priceChange / previousPrice) * 100;

                const recentData = ohlcData.slice(-96);
                const dayHigh = Math.max(...recentData.map(d => d.high));
                const dayLow = Math.min(...recentData.map(d => d.low));

                indicatorsData = {
                    price: Number(currentPrice.toFixed(3)),
                    rsi: rsi,
                    ema20: Number(ema20.toFixed(3)),
                    ema50: Number(ema50.toFixed(3)),
                    sma20: Number(sma20.toFixed(3)),
                    sma50: Number(sma50.toFixed(3)),
                    trend,
                    priceChange: Number(priceChange.toFixed(3)),
                    priceChangePercent: Number(priceChangePercent.toFixed(4)),
                    dayHigh: Number(dayHigh.toFixed(3)),
                    dayLow: Number(dayLow.toFixed(3)),
                    lastUpdated: new Date().toISOString(),
                    cached: false,
                    source: 'yahoo_finance',
                };
            }
        } catch (yahooError) {
            console.log('Yahoo Finance failed, trying fallback:', yahooError);
        }

        // Fallback to Twelve Data if Yahoo failed
        if (!indicatorsData) {
            indicatorsData = await fetchFromTwelveData();
        }

        // If we got data, cache and return it
        if (indicatorsData) {
            cache = { data: indicatorsData, timestamp: Date.now() };
            return NextResponse.json(indicatorsData);
        }

        // Return cached data if available (stale)
        if (cache) {
            return NextResponse.json({ ...cache.data, cached: true, stale: true });
        }

        return NextResponse.json(
            { error: 'All data sources failed' },
            { status: 503 }
        );
    } catch (error) {
        console.error('Indicators error:', error);

        if (cache) {
            return NextResponse.json({ ...cache.data, cached: true, stale: true });
        }

        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to fetch indicators' },
            { status: 500 }
        );
    }
}
