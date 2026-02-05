import { NextResponse } from 'next/server';

// Cache for 2 minutes
let cache: { data: MTFData; timestamp: number } | null = null;
const CACHE_DURATION = 2 * 60 * 1000;

type TimeframeBias = {
    timeframe: string;
    label: string;
    bias: 'bullish' | 'bearish' | 'neutral';
    strength: number;
    ema20: number;
    ema50: number;
    rsi: number;
    trend: 'up' | 'down' | 'sideways';
};

type MTFData = {
    timeframes: TimeframeBias[];
    alignment: {
        direction: 'bullish' | 'bearish' | 'mixed';
        percentage: number;
        score: number;
    };
    lastUpdated: string;
    cached: boolean;
};

// Calculate EMA
function calculateEMA(prices: number[], period: number): number {
    if (prices.length < period) return prices[prices.length - 1] || 0;
    
    const multiplier = 2 / (period + 1);
    let ema = prices.slice(0, period).reduce((sum, price) => sum + price, 0) / period;
    
    for (let i = period; i < prices.length; i++) {
        ema = (prices[i] - ema) * multiplier + ema;
    }
    
    return ema;
}

// Calculate RSI
function calculateRSI(prices: number[], period: number = 14): number {
    if (prices.length < period + 1) return 50;
    
    const changes = [];
    for (let i = 1; i < prices.length; i++) {
        changes.push(prices[i] - prices[i - 1]);
    }
    
    let gains = 0;
    let losses = 0;
    
    for (let i = 0; i < period; i++) {
        if (changes[i] > 0) gains += changes[i];
        else losses += Math.abs(changes[i]);
    }
    
    let avgGain = gains / period;
    let avgLoss = losses / period;
    
    for (let i = period; i < changes.length; i++) {
        if (changes[i] > 0) {
            avgGain = (avgGain * (period - 1) + changes[i]) / period;
            avgLoss = (avgLoss * (period - 1)) / period;
        } else {
            avgGain = (avgGain * (period - 1)) / period;
            avgLoss = (avgLoss * (period - 1) + Math.abs(changes[i])) / period;
        }
    }
    
    if (avgLoss === 0) return 100;
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
}

// Fetch data from Yahoo Finance
async function fetchTimeframeData(interval: string, period1: number): Promise<number[]> {
    const symbol = 'EURUSD=X';
    const now = Math.floor(Date.now() / 1000);
    
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?period1=${period1}&period2=${now}&interval=${interval}`;
    
    const res = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
        cache: 'no-store',
    });
    
    if (!res.ok) throw new Error(`Failed to fetch ${interval} data`);
    
    const data = await res.json();
    const result = data.chart?.result?.[0];
    
    if (!result?.indicators?.quote?.[0]?.close) {
        throw new Error(`No close prices for ${interval}`);
    }
    
    return result.indicators.quote[0].close.filter((p: number | null) => p !== null) as number[];
}

// Determine bias based on EMA cross and RSI
function determineBias(ema20: number, ema50: number, rsi: number, currentPrice: number): { bias: 'bullish' | 'bearish' | 'neutral'; trend: 'up' | 'down' | 'sideways'; strength: number } {
    const emaCross = ema20 > ema50;
    const priceAboveEMA20 = currentPrice > ema20;
    const priceAboveEMA50 = currentPrice > ema50;
    
    let score = 0;
    
    // EMA cross is the primary signal
    if (emaCross) score += 40;
    else score -= 40;
    
    // Price position relative to EMAs
    if (priceAboveEMA20) score += 20;
    else score -= 20;
    
    if (priceAboveEMA50) score += 20;
    else score -= 20;
    
    // RSI confirmation
    if (rsi > 50) score += 20;
    else if (rsi < 50) score -= 20;
    
    // Determine bias
    let bias: 'bullish' | 'bearish' | 'neutral' = 'neutral';
    let trend: 'up' | 'down' | 'sideways' = 'sideways';
    
    if (score >= 40) {
        bias = 'bullish';
        trend = 'up';
    } else if (score <= -40) {
        bias = 'bearish';
        trend = 'down';
    }
    
    const strength = Math.abs(score);
    
    return { bias, trend, strength };
}

export async function GET() {
    try {
        // Check cache
        if (cache && Date.now() - cache.timestamp < CACHE_DURATION) {
            return NextResponse.json({ ...cache.data, cached: true });
        }
        
        const now = Math.floor(Date.now() / 1000);
        
        // Fetch data for multiple timeframes
        const [prices5m, prices15m, prices1h] = await Promise.all([
            fetchTimeframeData('5m', now - (7 * 24 * 60 * 60)),   // 7 days of 5m data
            fetchTimeframeData('15m', now - (14 * 24 * 60 * 60)), // 14 days of 15m data
            fetchTimeframeData('1h', now - (30 * 24 * 60 * 60)),  // 30 days of 1h data
        ]);
        
        // Calculate indicators for each timeframe
        const timeframes: TimeframeBias[] = [
            {
                timeframe: '5m',
                label: '5 Min',
                ...(() => {
                    const ema20 = calculateEMA(prices5m, 20);
                    const ema50 = calculateEMA(prices5m, 50);
                    const rsi = calculateRSI(prices5m, 14);
                    const currentPrice = prices5m[prices5m.length - 1];
                    const { bias, trend, strength } = determineBias(ema20, ema50, rsi, currentPrice);
                    return { bias, ema20, ema50, rsi, trend, strength };
                })(),
            },
            {
                timeframe: '15m',
                label: '15 Min',
                ...(() => {
                    const ema20 = calculateEMA(prices15m, 20);
                    const ema50 = calculateEMA(prices15m, 50);
                    const rsi = calculateRSI(prices15m, 14);
                    const currentPrice = prices15m[prices15m.length - 1];
                    const { bias, trend, strength } = determineBias(ema20, ema50, rsi, currentPrice);
                    return { bias, ema20, ema50, rsi, trend, strength };
                })(),
            },
            {
                timeframe: '1h',
                label: '1 Hour',
                ...(() => {
                    const ema20 = calculateEMA(prices1h, 20);
                    const ema50 = calculateEMA(prices1h, 50);
                    const rsi = calculateRSI(prices1h, 14);
                    const currentPrice = prices1h[prices1h.length - 1];
                    const { bias, trend, strength } = determineBias(ema20, ema50, rsi, currentPrice);
                    return { bias, ema20, ema50, rsi, trend, strength };
                })(),
            },
        ];
        
        // Calculate alignment
        const bullishCount = timeframes.filter(tf => tf.bias === 'bullish').length;
        const bearishCount = timeframes.filter(tf => tf.bias === 'bearish').length;
        
        let direction: 'bullish' | 'bearish' | 'mixed' = 'mixed';
        if (bullishCount === timeframes.length) direction = 'bullish';
        else if (bearishCount === timeframes.length) direction = 'bearish';
        
        const percentage = direction === 'mixed' 
            ? Math.max(bullishCount, bearishCount) / timeframes.length * 100
            : 100;
        
        const score = timeframes.reduce((sum, tf) => {
            return sum + (tf.bias === 'bullish' ? tf.strength : tf.bias === 'bearish' ? -tf.strength : 0);
        }, 0);
        
        const mtfData: MTFData = {
            timeframes,
            alignment: {
                direction,
                percentage: Math.round(percentage),
                score,
            },
            lastUpdated: new Date().toISOString(),
            cached: false,
        };
        
        cache = { data: mtfData, timestamp: Date.now() };
        
        return NextResponse.json(mtfData);
    } catch (error) {
        console.error('EURUSD MTF API error:', error);
        
        if (cache) {
            return NextResponse.json({ ...cache.data, cached: true, stale: true });
        }
        
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to fetch MTF data' },
            { status: 500 }
        );
    }
}
