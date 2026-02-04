import { NextResponse } from 'next/server';
import axios from 'axios';

// Cache USDJPY data for 1 minute
let cachedData: any = null;
let lastFetchTime = 0;
const CACHE_DURATION = 60000; // 1 minute

export async function GET() {
    try {
        const now = Date.now();

        // Return cached data if still fresh
        if (cachedData && (now - lastFetchTime) < CACHE_DURATION) {
            return NextResponse.json({ ...cachedData, cached: true });
        }

        // Fetch fresh data from Yahoo Finance for USDJPY
        const symbol = 'JPY=X';
        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=5d`;

        console.log(`[Quote API] Fetching USDJPY...`);

        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            },
        });

        const data = response.data;

        if (!data?.chart?.result?.[0]) {
            throw new Error('Invalid response from Yahoo Finance');
        }

        const result = data.chart.result[0];
        const meta = result.meta;
        const quote = result.indicators.quote[0];

        // Get current and previous close
        const currentPrice = meta.regularMarketPrice || quote.close[quote.close.length - 1];
        const previousClose = meta.previousClose || meta.chartPreviousClose;

        // Calculate change
        const change = currentPrice - previousClose;
        const changePercent = (change / previousClose) * 100;

        const quoteData = {
            symbol: 'USD/JPY',
            price: currentPrice,
            change: change,
            changePercent: changePercent,
            previousClose: previousClose,
            high: meta.regularMarketDayHigh,
            low: meta.regularMarketDayLow,
            timestamp: meta.regularMarketTime,
            currency: meta.currency,
            cached: false,
        };

        // Update cache
        cachedData = quoteData;
        lastFetchTime = now;

        console.log(`[Quote API] USDJPY: ${currentPrice.toFixed(3)} (${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(2)}%)`);

        return NextResponse.json(quoteData);

    } catch (error: any) {
        console.error('[Quote API] Error:', error.message);

        // Return cached data if available, even if expired
        if (cachedData) {
            console.log('[Quote API] Returning stale cache due to error');
            return NextResponse.json({ ...cachedData, cached: true, stale: true });
        }

        return NextResponse.json(
            {
                error: 'Failed to fetch quote data',
                message: error.message
            },
            { status: 500 }
        );
    }
}
