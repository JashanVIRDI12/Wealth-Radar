import { NextResponse } from 'next/server';

// Cache for pivot data (1 hour - pivots only change once per day)
let cache: { data: PivotData; timestamp: number } | null = null;
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

type OHLC = {
    open: number;
    high: number;
    low: number;
    close: number;
    date: string;
};

type PivotData = {
    // Daily OHLC
    dailyOHLC: OHLC;

    // Classic Pivot Points
    pivots: {
        pp: number;   // Pivot Point
        r1: number;   // Resistance 1
        r2: number;   // Resistance 2
        r3: number;   // Resistance 3
        s1: number;   // Support 1
        s2: number;   // Support 2
        s3: number;   // Support 3
    };

    // ATR (Average True Range)
    atr: {
        value: number;
        period: number;
        volatility: 'low' | 'medium' | 'high';
    };

    // Price position relative to pivots
    pricePosition: {
        nearestLevel: string;
        nearestValue: number;
        distance: number;
        distancePercent: number;
        zone: 'above_r2' | 'r1_r2' | 'pp_r1' | 's1_pp' | 's1_s2' | 'below_s2';
    };

    // Today's range analysis
    rangeAnalysis: {
        todayHigh: number;
        todayLow: number;
        currentRange: number;
        atrPercent: number; // How much of expected daily range has been used
        rangeRemaining: number;
    };

    lastUpdated: string;
    cached: boolean;
};

// Scrape OHLC data from Yahoo Finance
async function scrapeYahooFinance(): Promise<OHLC[]> {
    const symbol = 'EURUSD=X';
    const now = Math.floor(Date.now() / 1000);
    const thirtyDaysAgo = now - (30 * 24 * 60 * 60);

    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?period1=${thirtyDaysAgo}&period2=${now}&interval=1d`;

    const response = await fetch(url, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        },
    });

    if (!response.ok) {
        throw new Error(`Yahoo Finance request failed: ${response.status}`);
    }

    const data = await response.json();
    const result = data.chart?.result?.[0];

    if (!result) {
        throw new Error('No data returned from Yahoo Finance');
    }

    const timestamps = result.timestamp || [];
    const quotes = result.indicators?.quote?.[0] || {};

    const ohlcData: OHLC[] = [];

    for (let i = 0; i < timestamps.length; i++) {
        if (quotes.open?.[i] && quotes.high?.[i] && quotes.low?.[i] && quotes.close?.[i]) {
            ohlcData.push({
                open: quotes.open[i],
                high: quotes.high[i],
                low: quotes.low[i],
                close: quotes.close[i],
                date: new Date(timestamps[i] * 1000).toISOString().split('T')[0],
            });
        }
    }

    return ohlcData;
}

// Calculate Classic Pivot Points
function calculatePivots(high: number, low: number, close: number) {
    const pp = (high + low + close) / 3;

    return {
        pp: Number(pp.toFixed(5)),
        r1: Number((2 * pp - low).toFixed(5)),
        r2: Number((pp + (high - low)).toFixed(5)),
        r3: Number((high + 2 * (pp - low)).toFixed(5)),
        s1: Number((2 * pp - high).toFixed(5)),
        s2: Number((pp - (high - low)).toFixed(5)),
        s3: Number((low - 2 * (high - pp)).toFixed(5)),
    };
}

// Calculate ATR (Average True Range)
function calculateATR(ohlcData: OHLC[], period: number = 14): number {
    if (ohlcData.length < period + 1) {
        throw new Error('Not enough data for ATR calculation');
    }

    const trueRanges: number[] = [];

    for (let i = 1; i < ohlcData.length; i++) {
        const current = ohlcData[i];
        const previous = ohlcData[i - 1];

        const tr = Math.max(
            current.high - current.low,
            Math.abs(current.high - previous.close),
            Math.abs(current.low - previous.close)
        );

        trueRanges.push(tr);
    }

    // Use last 'period' true ranges
    const recentTRs = trueRanges.slice(-period);
    const atr = recentTRs.reduce((sum, tr) => sum + tr, 0) / period;

    return Number(atr.toFixed(5));
}

// Determine volatility level
function getVolatilityLevel(atr: number, price: number): 'low' | 'medium' | 'high' {
    const atrPercent = (atr / price) * 100;

    // For EUR/USD, typical ATR ranges:
    // Low: < 0.3% of price
    // Medium: 0.3-0.6% of price
    // High: > 0.6% of price
    if (atrPercent < 0.3) return 'low';
    if (atrPercent < 0.6) return 'medium';
    return 'high';
}

// Get price position relative to pivots
function getPricePosition(currentPrice: number, pivots: PivotData['pivots']): PivotData['pricePosition'] {
    const levels = [
        { name: 'R3', value: pivots.r3 },
        { name: 'R2', value: pivots.r2 },
        { name: 'R1', value: pivots.r1 },
        { name: 'PP', value: pivots.pp },
        { name: 'S1', value: pivots.s1 },
        { name: 'S2', value: pivots.s2 },
        { name: 'S3', value: pivots.s3 },
    ];

    // Find nearest level
    let nearest = levels[0];
    let minDistance = Math.abs(currentPrice - levels[0].value);

    for (const level of levels) {
        const distance = Math.abs(currentPrice - level.value);
        if (distance < minDistance) {
            minDistance = distance;
            nearest = level;
        }
    }

    // Determine zone
    let zone: PivotData['pricePosition']['zone'] = 'pp_r1';
    if (currentPrice >= pivots.r2) zone = 'above_r2';
    else if (currentPrice >= pivots.r1) zone = 'r1_r2';
    else if (currentPrice >= pivots.pp) zone = 'pp_r1';
    else if (currentPrice >= pivots.s1) zone = 's1_pp';
    else if (currentPrice >= pivots.s2) zone = 's1_s2';
    else zone = 'below_s2';

    return {
        nearestLevel: nearest.name,
        nearestValue: nearest.value,
        distance: Number(minDistance.toFixed(5)),
        distancePercent: Number(((minDistance / currentPrice) * 100).toFixed(3)),
        zone,
    };
}

export async function GET() {
    try {
        // Check cache
        if (cache && Date.now() - cache.timestamp < CACHE_DURATION) {
            return NextResponse.json({ ...cache.data, cached: true });
        }

        // Scrape OHLC data
        const ohlcData = await scrapeYahooFinance();

        if (ohlcData.length < 15) {
            throw new Error('Insufficient OHLC data');
        }

        // Get yesterday's OHLC for pivot calculation
        const yesterday = ohlcData[ohlcData.length - 2];
        const today = ohlcData[ohlcData.length - 1];

        // Calculate pivots using yesterday's OHLC
        const pivots = calculatePivots(yesterday.high, yesterday.low, yesterday.close);

        // Calculate ATR
        const atrValue = calculateATR(ohlcData, 14);
        const volatility = getVolatilityLevel(atrValue, today.close);

        // Get current price (use today's close as approximation)
        const currentPrice = today.close;

        // Calculate price position
        const pricePosition = getPricePosition(currentPrice, pivots);

        // Calculate range analysis
        const todayRange = today.high - today.low;
        const atrPercent = (todayRange / atrValue) * 100;
        const rangeRemaining = Math.max(0, atrValue - todayRange);

        const pivotData: PivotData = {
            dailyOHLC: {
                open: Number(today.open.toFixed(5)),
                high: Number(today.high.toFixed(5)),
                low: Number(today.low.toFixed(5)),
                close: Number(today.close.toFixed(5)),
                date: today.date,
            },
            pivots,
            atr: {
                value: atrValue,
                period: 14,
                volatility,
            },
            pricePosition,
            rangeAnalysis: {
                todayHigh: Number(today.high.toFixed(5)),
                todayLow: Number(today.low.toFixed(5)),
                currentRange: Number(todayRange.toFixed(5)),
                atrPercent: Number(atrPercent.toFixed(1)),
                rangeRemaining: Number(rangeRemaining.toFixed(5)),
            },
            lastUpdated: new Date().toISOString(),
            cached: false,
        };

        // Cache the result
        cache = { data: pivotData, timestamp: Date.now() };

        return NextResponse.json(pivotData);
    } catch (error) {
        console.error('EUR/USD Pivot calculation error:', error);

        // Return cached data if available
        if (cache) {
            return NextResponse.json({ ...cache.data, cached: true, stale: true });
        }

        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to calculate pivots' },
            { status: 500 }
        );
    }
}
