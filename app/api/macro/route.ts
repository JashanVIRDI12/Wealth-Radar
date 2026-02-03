import { NextResponse } from 'next/server';
import axios from 'axios';

// In-memory cache for macro data
let macroCache: {
    us10yYield: number | null;
    usInflation: number | null;
    japanInflation: number | null;
    lastUpdated: string;
} | null = null;

let lastFetchTime = 0;
// FRED: rate-limited (429 if exceeded). We do 3 requests per fetch. 24h → 3 requests/day.
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

// Helper function to fetch latest value from FRED
async function fetchFREDSeries(seriesId: string, apiKey: string): Promise<number | null> {
    try {
        const response = await axios.get(
            `https://api.stlouisfed.org/fred/series/observations`,
            {
                params: {
                    series_id: seriesId,
                    api_key: apiKey,
                    file_type: 'json',
                    sort_order: 'desc',
                    limit: 1,
                },
            }
        );

        if (response.data.observations && response.data.observations.length > 0) {
            const value = response.data.observations[0].value;
            // Handle "." (missing data) from FRED
            if (value === '.') return null;
            return parseFloat(value);
        }
        return null;
    } catch (error) {
        console.error(`Error fetching FRED series ${seriesId}:`, error);
        return null;
    }
}

export async function GET() {
    try {
        const now = Date.now();

        // Check if we have cached data and it's still valid
        if (macroCache && (now - lastFetchTime) < CACHE_DURATION) {
            return NextResponse.json({
                ...macroCache,
                cached: true,
            });
        }

        // Fetch fresh data from FRED
        const fredApiKey = process.env.FRED_API_KEY;

        if (!fredApiKey) {
            return NextResponse.json(
                { error: 'FRED API key not configured' },
                { status: 500 }
            );
        }

        // Fetch all three series in parallel
        // Using inflation rate series which are directly comparable
        const [us10yYield, usInflation, japanInflation] = await Promise.all([
            fetchFREDSeries('DGS10', fredApiKey),           // US 10-Year Treasury Yield
            fetchFREDSeries('FPCPITOTLZGUSA', fredApiKey),  // US Inflation Rate (% annual)
            fetchFREDSeries('FPCPITOTLZGJPN', fredApiKey),  // Japan Inflation Rate (% annual)
        ]);

        const timestamp = new Date().toISOString();

        // Update cache
        macroCache = {
            us10yYield,
            usInflation,
            japanInflation,
            lastUpdated: timestamp,
        };
        lastFetchTime = now;

        return NextResponse.json({
            us10yYield,
            usInflation,
            japanInflation,
            lastUpdated: timestamp,
            cached: false,
        });
    } catch (error) {
        console.error('Error fetching macro data:', error);

        // If we have cached data, return it even if expired
        if (macroCache) {
            return NextResponse.json({
                ...macroCache,
                cached: true,
                error: 'Failed to fetch fresh data, returning cached macro data',
            });
        }

        return NextResponse.json(
            { error: 'Failed to fetch macro data' },
            { status: 500 }
        );
    }
}
