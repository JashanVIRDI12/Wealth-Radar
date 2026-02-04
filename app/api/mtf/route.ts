import { NextResponse } from 'next/server';

// Cache for 2 minutes
let cache: { data: MTFData; timestamp: number } | null = null;
const CACHE_DURATION = 2 * 60 * 1000;

type TimeframeBias = {
    timeframe: string;
    label: string;
    bias: 'bullish' | 'bearish' | 'neutral';
    strength: number; // 0-100
    price: number;
    ema20: number;
    ema50: number;
    rsi: number;
    priceVsEma: 'above' | 'below';
    emaCross: 'bullish' | 'bearish';
    trend: 'up' | 'down' | 'sideways';
};

type MTFData = {
    timeframes: TimeframeBias[];
    alignment: {
        direction: 'bullish' | 'bearish' | 'mixed';
        percentage: number;
        score: number; // -100 to +100
        recommendation: string;
    };
    lastUpdated: string;
    cached: boolean;
};

type OHLC = {
    open: number;
    high: number;
    low: number;
    close: number;
};

// Fetch data for a specific interval from Yahoo Finance
async function fetchYahooData(interval: string, range: string): Promise<OHLC[]> {
    const symbol = 'USDJPY=X';
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=${interval}&range=${range}`;

    const response = await fetch(url, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
        cache: 'no-store',
    });

    if (!response.ok) {
        throw new Error(`Yahoo Finance ${interval} failed: ${response.status}`);
    }

    const data = await response.json();
    const result = data.chart?.result?.[0];

    if (!result?.indicators?.quote?.[0]) {
        throw new Error(`No data for ${interval}`);
    }

    const quotes = result.indicators.quote[0];
    const ohlcData: OHLC[] = [];

    for (let i = 0; i < (result.timestamp?.length || 0); i++) {
        if (quotes.open?.[i] && quotes.close?.[i]) {
            ohlcData.push({
                open: quotes.open[i],
                high: quotes.high[i],
                low: quotes.low[i],
                close: quotes.close[i],
            });
        }
    }

    return ohlcData;
}

function calculateSMA(closes: number[], period: number): number {
    if (closes.length < period) return closes[closes.length - 1] || 0;
    const slice = closes.slice(-period);
    return slice.reduce((sum, val) => sum + val, 0) / period;
}

function calculateEMA(closes: number[], period: number): number {
    if (closes.length < period) return calculateSMA(closes, closes.length);
    const multiplier = 2 / (period + 1);
    let ema = calculateSMA(closes.slice(0, period), period);
    for (let i = period; i < closes.length; i++) {
        ema = (closes[i] - ema) * multiplier + ema;
    }
    return ema;
}

function calculateRSI(closes: number[], period: number = 14): number {
    if (closes.length < period + 1) return 50;

    const changes: number[] = [];
    for (let i = 1; i < closes.length; i++) {
        changes.push(closes[i] - closes[i - 1]);
    }

    const recentChanges = changes.slice(-period * 2);
    let avgGain = 0, avgLoss = 0;

    for (let i = 0; i < period && i < recentChanges.length; i++) {
        if (recentChanges[i] > 0) avgGain += recentChanges[i];
        else avgLoss += Math.abs(recentChanges[i]);
    }
    avgGain /= period;
    avgLoss /= period;

    for (let i = period; i < recentChanges.length; i++) {
        const change = recentChanges[i];
        avgGain = (avgGain * (period - 1) + (change > 0 ? change : 0)) / period;
        avgLoss = (avgLoss * (period - 1) + (change < 0 ? Math.abs(change) : 0)) / period;
    }

    if (avgLoss === 0) return 100;
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
}

function analyzeTimeframe(ohlcData: OHLC[], timeframe: string, label: string): TimeframeBias {
    const closes = ohlcData.map(d => d.close);
    const currentPrice = closes[closes.length - 1] || 0;

    const ema20 = calculateEMA(closes, 20);
    const ema50 = calculateEMA(closes, 50);
    const rsi = calculateRSI(closes, 14);

    const priceVsEma: 'above' | 'below' = currentPrice > ema20 ? 'above' : 'below';
    const emaCross: 'bullish' | 'bearish' = ema20 > ema50 ? 'bullish' : 'bearish';

    // Determine trend
    let trend: 'up' | 'down' | 'sideways' = 'sideways';
    if (currentPrice > ema20 && ema20 > ema50) trend = 'up';
    else if (currentPrice < ema20 && ema20 < ema50) trend = 'down';

    // Calculate bias score for this timeframe
    let score = 0;

    // Price vs EMA20 (30 points)
    score += priceVsEma === 'above' ? 30 : -30;

    // EMA Cross (30 points)
    score += emaCross === 'bullish' ? 30 : -30;

    // RSI (20 points)
    if (rsi > 50 && rsi < 70) score += 20;
    else if (rsi < 50 && rsi > 30) score -= 20;
    else if (rsi >= 70) score -= 10; // Overbought
    else if (rsi <= 30) score += 10; // Oversold (contrarian)

    // Trend (20 points)
    if (trend === 'up') score += 20;
    else if (trend === 'down') score -= 20;

    // Determine bias
    let bias: 'bullish' | 'bearish' | 'neutral' = 'neutral';
    if (score >= 30) bias = 'bullish';
    else if (score <= -30) bias = 'bearish';

    const strength = Math.min(100, Math.abs(score));

    return {
        timeframe,
        label,
        bias,
        strength,
        price: Number(currentPrice.toFixed(3)),
        ema20: Number(ema20.toFixed(3)),
        ema50: Number(ema50.toFixed(3)),
        rsi: Number(rsi.toFixed(1)),
        priceVsEma,
        emaCross,
        trend,
    };
}

function calculateAlignment(timeframes: TimeframeBias[]): MTFData['alignment'] {
    const bullishCount = timeframes.filter(t => t.bias === 'bullish').length;
    const bearishCount = timeframes.filter(t => t.bias === 'bearish').length;
    const total = timeframes.length;

    // Calculate weighted score (higher timeframes have more weight)
    const weights = { '5m': 1, '15m': 2, '1h': 3 };
    let weightedScore = 0;
    let totalWeight = 0;

    for (const tf of timeframes) {
        const weight = weights[tf.timeframe as keyof typeof weights] || 1;
        totalWeight += weight;

        if (tf.bias === 'bullish') weightedScore += weight * (tf.strength / 100);
        else if (tf.bias === 'bearish') weightedScore -= weight * (tf.strength / 100);
    }

    const normalizedScore = (weightedScore / totalWeight) * 100;

    let direction: 'bullish' | 'bearish' | 'mixed' = 'mixed';
    let recommendation = '';

    if (bullishCount === total) {
        direction = 'bullish';
        recommendation = '🟢 All timeframes aligned BULLISH. Strong long bias - look for pullback entries.';
    } else if (bearishCount === total) {
        direction = 'bearish';
        recommendation = '🔴 All timeframes aligned BEARISH. Strong short bias - look for rally entries.';
    } else if (bullishCount > bearishCount) {
        direction = 'bullish';
        recommendation = '🟡 Mixed with bullish lean. Wait for lower timeframe confirmation or trade higher TF direction.';
    } else if (bearishCount > bullishCount) {
        direction = 'bearish';
        recommendation = '🟡 Mixed with bearish lean. Wait for lower timeframe confirmation or trade higher TF direction.';
    } else {
        recommendation = '⚪ No clear alignment. Avoid trading or use tight stops with quick profits.';
    }

    const percentage = Math.round((Math.max(bullishCount, bearishCount) / total) * 100);

    return {
        direction,
        percentage,
        score: Math.round(normalizedScore),
        recommendation,
    };
}

export async function GET() {
    try {
        // Check cache
        if (cache && Date.now() - cache.timestamp < CACHE_DURATION) {
            return NextResponse.json({ ...cache.data, cached: true });
        }

        // Fetch data for each timeframe in parallel
        const [data5m, data15m, data1h] = await Promise.all([
            fetchYahooData('5m', '2d'),    // 5min candles, last 2 days
            fetchYahooData('15m', '5d'),   // 15min candles, last 5 days
            fetchYahooData('1h', '1mo'),   // 1hour candles, last month
        ]);

        // Analyze each timeframe
        const timeframes: TimeframeBias[] = [
            analyzeTimeframe(data5m, '5m', '5 Min'),
            analyzeTimeframe(data15m, '15m', '15 Min'),
            analyzeTimeframe(data1h, '1h', '1 Hour'),
        ];

        // Calculate alignment
        const alignment = calculateAlignment(timeframes);

        const mtfData: MTFData = {
            timeframes,
            alignment,
            lastUpdated: new Date().toISOString(),
            cached: false,
        };

        // Cache result
        cache = { data: mtfData, timestamp: Date.now() };

        return NextResponse.json(mtfData);
    } catch (error) {
        console.error('MTF API error:', error);

        if (cache) {
            return NextResponse.json({ ...cache.data, cached: true, stale: true });
        }

        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to fetch MTF data' },
            { status: 500 }
        );
    }
}
