import { NextResponse } from 'next/server';
import axios from 'axios';

const SYMBOL = 'USD/JPY';
const INTERVAL = '15min';

type IndicatorsCache = {
    price: number;
    rsi: number;
    ema20: number;
    ema50: number;
    trend: 'uptrend' | 'downtrend' | 'sideways';
    lastUpdated: string;
};

let indicatorsCache: IndicatorsCache | null = null;
let lastFetchTime = 0;
// Twelve Data: 800 credits/day, 8/min. Price=1, RSI=1, EMA=1 each → 4 credits/run. 30 min cache → ~192 credits/day.
const CACHE_DURATION = 30 * 60 * 1000;

function getTrend(price: number, ema20: number, ema50: number): 'uptrend' | 'downtrend' | 'sideways' {
    if (price > ema20 && ema20 > ema50) return 'uptrend';
    if (price < ema20 && ema20 < ema50) return 'downtrend';
    return 'sideways';
}

export async function GET() {
    try {
        const now = Date.now();
        if (indicatorsCache && (now - lastFetchTime) < CACHE_DURATION) {
            return NextResponse.json({ ...indicatorsCache, cached: true });
        }

        const apiKey = process.env.TWELVE_DATA_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
        }

        const base = { symbol: SYMBOL, interval: INTERVAL, apikey: apiKey };

        const [priceRes, rsiRes, ema20Res, ema50Res] = await Promise.all([
            axios.get('https://api.twelvedata.com/price', { params: { symbol: SYMBOL, apikey: apiKey } }),
            axios.get('https://api.twelvedata.com/rsi', { params: { ...base, time_period: '14' } }),
            axios.get('https://api.twelvedata.com/ema', { params: { ...base, time_period: '20' } }),
            axios.get('https://api.twelvedata.com/ema', { params: { ...base, time_period: '50' } }),
        ]);

        const price = priceRes.data?.price != null ? parseFloat(priceRes.data.price) : null;
        const rsiRaw = rsiRes.data?.values?.[0];
        const ema20Raw = ema20Res.data?.values?.[0];
        const ema50Raw = ema50Res.data?.values?.[0];

        const rsi = rsiRaw?.rsi != null ? parseFloat(rsiRaw.rsi) : null;
        const ema20 = ema20Raw?.ema != null ? parseFloat(ema20Raw.ema) : null;
        const ema50 = ema50Raw?.ema != null ? parseFloat(ema50Raw.ema) : null;

        if (
            price == null ||
            rsi == null ||
            ema20 == null ||
            ema50 == null ||
            rsiRes.data?.status === 'error' ||
            ema20Res.data?.status === 'error' ||
            ema50Res.data?.status === 'error'
        ) {
            const errMsg =
                rsiRes.data?.message ||
                ema20Res.data?.message ||
                ema50Res.data?.message ||
                'Missing indicator data';
            throw new Error(errMsg);
        }

        const trend = getTrend(price, ema20, ema50);
        const payload: IndicatorsCache = {
            price,
            rsi,
            ema20,
            ema50,
            trend,
            lastUpdated: new Date().toISOString(),
        };
        indicatorsCache = payload;
        lastFetchTime = now;

        return NextResponse.json({ ...payload, cached: false });
    } catch (error) {
        console.error('Error fetching indicators:', error);
        if (indicatorsCache) {
            return NextResponse.json({
                ...indicatorsCache,
                cached: true,
                error: 'Failed to fetch fresh data, returning cached',
            });
        }
        const message = error instanceof Error ? error.message : 'Failed to fetch indicators';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
