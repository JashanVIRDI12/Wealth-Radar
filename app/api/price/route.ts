import { NextResponse } from 'next/server';
import axios from 'axios';

// In-memory cache
let priceCache: {
    price: number;
    lastUpdated: string;
} | null = null;

let lastFetchTime = 0;
// Twelve Data free: 800 credits/day, 8 credits/min. Price = 1 credit. 30 min → ~48 requests/day.
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

export async function GET() {
    try {
        const now = Date.now();

        // Check if we have cached data and it's still valid
        if (priceCache && (now - lastFetchTime) < CACHE_DURATION) {
            return NextResponse.json({
                price: priceCache.price,
                lastUpdated: priceCache.lastUpdated,
                cached: true,
            });
        }

        // Fetch fresh data from Twelve Data
        const apiKey = process.env.TWELVE_DATA_API_KEY;

        if (!apiKey) {
            return NextResponse.json(
                { error: 'API key not configured' },
                { status: 500 }
            );
        }

        const response = await axios.get('https://api.twelvedata.com/price', {
            params: {
                symbol: 'USD/JPY',
                apikey: apiKey,
            },
        });

        if (response.data.price) {
            const currentPrice = parseFloat(response.data.price);
            const timestamp = new Date().toISOString();

            // Update cache
            priceCache = {
                price: currentPrice,
                lastUpdated: timestamp,
            };
            lastFetchTime = now;

            return NextResponse.json({
                price: currentPrice,
                lastUpdated: timestamp,
                cached: false,
            });
        } else {
            throw new Error('Invalid response from Twelve Data API');
        }
    } catch (error) {
        console.error('Error fetching price:', error);

        // If we have cached data, return it even if expired
        if (priceCache) {
            return NextResponse.json({
                price: priceCache.price,
                lastUpdated: priceCache.lastUpdated,
                cached: true,
                error: 'Failed to fetch fresh data, returning cached price',
            });
        }

        return NextResponse.json(
            { error: 'Failed to fetch price data' },
            { status: 500 }
        );
    }
}
