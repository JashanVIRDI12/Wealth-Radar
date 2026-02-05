import { NextResponse } from 'next/server';

// Cache for macro data (24 hours)
let cache: { data: MacroResponse; timestamp: number } | null = null;
const CACHE_DURATION = 24 * 60 * 60 * 1000;

type MacroResponse = {
    us10yYield: number | null;
    usInflation: number | null;
    japanInflation: number | null;
    // Backwards-compatible aliases used by some endpoints
    usCPI?: number | null;
    japanCPI?: number | null;
    lastUpdated: string;
    cached?: boolean;
    stale?: boolean;
    error?: string;
};

async function fetchFredSeriesLatestValue(seriesId: string, apiKey: string): Promise<number | null> {
    const url = new URL('https://api.stlouisfed.org/fred/series/observations');
    url.searchParams.set('series_id', seriesId);
    url.searchParams.set('api_key', apiKey);
    url.searchParams.set('file_type', 'json');
    url.searchParams.set('sort_order', 'desc');
    url.searchParams.set('limit', '10');

    const res = await fetch(url.toString(), { cache: 'no-store' });
    if (!res.ok) {
        throw new Error(`FRED ${seriesId} failed: ${res.status}`);
    }

    const json = (await res.json()) as { observations?: Array<{ value?: string }> };
    const observations = Array.isArray(json.observations) ? json.observations : [];

    for (const obs of observations) {
        const v = Number(obs.value);
        if (Number.isFinite(v)) return v;
    }

    return null;
}

async function fetchFredSeriesYoYPercent(seriesId: string, apiKey: string): Promise<number | null> {
    const url = new URL('https://api.stlouisfed.org/fred/series/observations');
    url.searchParams.set('series_id', seriesId);
    url.searchParams.set('api_key', apiKey);
    url.searchParams.set('file_type', 'json');
    url.searchParams.set('sort_order', 'desc');
    url.searchParams.set('limit', '36');

    const res = await fetch(url.toString(), { cache: 'no-store' });
    if (!res.ok) {
        throw new Error(`FRED ${seriesId} failed: ${res.status}`);
    }

    const json = (await res.json()) as { observations?: Array<{ value?: string }> };
    const observations = Array.isArray(json.observations) ? json.observations : [];

    const vals = observations
        .map((o) => Number(o.value))
        .filter((n) => Number.isFinite(n));

    if (vals.length < 13) return null;

    const latest = vals[0];
    const yearAgo = vals[12];
    if (yearAgo === 0) return null;

    return ((latest - yearAgo) / yearAgo) * 100;
}

export async function GET() {
    try {
        const now = Date.now();

        if (cache && now - cache.timestamp < CACHE_DURATION) {
            return NextResponse.json({ ...cache.data, cached: true });
        }

        const apiKey = process.env.FRED_API_KEY;
        if (!apiKey) {
            return NextResponse.json(
                { error: 'FRED_API_KEY not configured', us10yYield: null, usInflation: null, japanInflation: null, lastUpdated: new Date().toISOString() },
                { status: 500 }
            );
        }

        const [us10yYield, usInflation, japanInflation] = await Promise.all([
            fetchFredSeriesLatestValue('DGS10', apiKey),
            fetchFredSeriesYoYPercent('CPIAUCSL', apiKey),
            fetchFredSeriesYoYPercent('JPNCPIALLMINMEI', apiKey),
        ]);

        const payload: MacroResponse = {
            us10yYield,
            usInflation,
            japanInflation,
            usCPI: usInflation,
            japanCPI: japanInflation,
            lastUpdated: new Date().toISOString(),
        };

        cache = { data: payload, timestamp: now };
        return NextResponse.json(payload);
    } catch (error) {
        console.error('Macro route error:', error);

        if (cache) {
            return NextResponse.json({
                ...cache.data,
                cached: true,
                stale: true,
                error: error instanceof Error ? error.message : 'Macro request failed',
            });
        }

        return NextResponse.json(
            {
                error: error instanceof Error ? error.message : 'Macro request failed',
                us10yYield: null,
                usInflation: null,
                japanInflation: null,
                lastUpdated: new Date().toISOString(),
            },
            { status: 500 }
        );
    }
}
