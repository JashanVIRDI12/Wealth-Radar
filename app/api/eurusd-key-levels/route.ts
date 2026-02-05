import { NextResponse } from 'next/server';

// Cache for 5 minutes
let cache: { data: KeyLevelsData; timestamp: number } | null = null;
const CACHE_DURATION = 5 * 60 * 1000;

type SessionData = {
    name: string;
    high: number;
    low: number;
    range: number;
    isActive: boolean;
    startHour: number;
    endHour: number;
};

type KeyLevelsData = {
    previousDay: {
        high: number;      // PDH
        low: number;       // PDL
        close: number;     // PDC
        date: string;
    };
    currentPrice: number;
    priceVsPDC: {
        position: 'above' | 'below';
        bias: 'bullish' | 'bearish';
        distance: number;
        distancePercent: number;
    };
    pricePosition: {
        withinPDRange: boolean;
        percentInRange: number;
        zone: 'above_pdh' | 'upper_half' | 'lower_half' | 'below_pdl';
    };
    sessions: SessionData[];
    activeSession: string;
    lastUpdated: string;
    cached: boolean;
};

// Session definitions (UTC hours)
const SESSIONS = {
    asian: { name: 'Asian', start: 0, end: 9, emoji: '🇯🇵' },
    london: { name: 'London', start: 8, end: 16, emoji: '🇬🇧' },
    newYork: { name: 'New York', start: 13, end: 22, emoji: '🇺🇸' },
};

// Fetch daily data from Yahoo Finance
async function fetchDailyData(): Promise<{ yesterday: { high: number; low: number; close: number; date: string }; todayBars: { time: number; high: number; low: number; close: number }[] }> {
    const symbol = 'EURUSD=X';
    const now = Math.floor(Date.now() / 1000);
    const fiveDaysAgo = now - (5 * 24 * 60 * 60);

    // Get daily data for previous day levels
    const dailyUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?period1=${fiveDaysAgo}&period2=${now}&interval=1d`;

    const dailyRes = await fetch(dailyUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
        cache: 'no-store',
    });

    if (!dailyRes.ok) throw new Error(`Daily data failed: ${dailyRes.status}`);

    const dailyData = await dailyRes.json();
    const result = dailyData.chart?.result?.[0];

    if (!result?.timestamp || !result.indicators?.quote?.[0]) {
        throw new Error('Invalid daily data');
    }

    const timestamps = result.timestamp;
    const quotes = result.indicators.quote[0];

    // Get yesterday's data (second to last complete day)
    const completeDays = timestamps.length >= 2 ? timestamps.length - 1 : 0;
    const yesterdayIdx = Math.max(0, completeDays - 1);

    const yesterday = {
        high: quotes.high[yesterdayIdx] || 0,
        low: quotes.low[yesterdayIdx] || 0,
        close: quotes.close[yesterdayIdx] || 0,
        date: new Date(timestamps[yesterdayIdx] * 1000).toISOString().split('T')[0],
    };

    // Get intraday data for session high/low
    const intradayUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?period1=${now - 86400}&period2=${now}&interval=15m`;

    const intradayRes = await fetch(intradayUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
        cache: 'no-store',
    });

    const intradayData = await intradayRes.json();
    const intradayResult = intradayData.chart?.result?.[0];

    const todayBars: { time: number; high: number; low: number; close: number }[] = [];

    if (intradayResult?.timestamp && intradayResult.indicators?.quote?.[0]) {
        const iTimestamps = intradayResult.timestamp;
        const iQuotes = intradayResult.indicators.quote[0];

        for (let i = 0; i < iTimestamps.length; i++) {
            if (iQuotes.high?.[i] && iQuotes.low?.[i] && iQuotes.close?.[i]) {
                todayBars.push({
                    time: iTimestamps[i],
                    high: iQuotes.high[i],
                    low: iQuotes.low[i],
                    close: iQuotes.close[i],
                });
            }
        }
    }

    return { yesterday, todayBars };
}

function calculateSessionHighLow(bars: { time: number; high: number; low: number }[], startHour: number, endHour: number): { high: number; low: number } {
    const sessionBars = bars.filter(bar => {
        const hour = new Date(bar.time * 1000).getUTCHours();
        if (startHour < endHour) {
            return hour >= startHour && hour < endHour;
        } else {
            return hour >= startHour || hour < endHour;
        }
    });

    if (sessionBars.length === 0) {
        return { high: 0, low: 0 };
    }

    const high = Math.max(...sessionBars.map(b => b.high));
    const low = Math.min(...sessionBars.map(b => b.low));

    return { high, low };
}

function getActiveSession(): string {
    const hour = new Date().getUTCHours();

    if (hour >= 0 && hour < 9) return 'asian';
    if (hour >= 8 && hour < 16) return 'london';
    if (hour >= 13 && hour < 22) return 'newYork';

    if (hour >= 22 || hour < 0) return 'asian';
    return 'london';
}

export async function GET() {
    try {
        // Check cache
        if (cache && Date.now() - cache.timestamp < CACHE_DURATION) {
            return NextResponse.json({ ...cache.data, cached: true });
        }

        const { yesterday, todayBars } = await fetchDailyData();
        const currentPrice = todayBars.length > 0 ? todayBars[todayBars.length - 1].close : yesterday.close;

        // Calculate price vs PDC (in pips for EURUSD: 1 pip = 0.0001)
        const pdcDistance = currentPrice - yesterday.close;
        const pdcDistancePips = pdcDistance * 10000; // Convert to pips
        const pdcDistancePercent = (pdcDistance / yesterday.close) * 100;

        const priceVsPDC = {
            position: (currentPrice >= yesterday.close ? 'above' : 'below') as 'above' | 'below',
            bias: (currentPrice >= yesterday.close ? 'bullish' : 'bearish') as 'bullish' | 'bearish',
            distance: Math.abs(pdcDistancePips),
            distancePercent: Math.abs(pdcDistancePercent),
        };

        // Calculate position within PDH-PDL range
        const pdRange = yesterday.high - yesterday.low;
        const positionFromLow = currentPrice - yesterday.low;
        const percentInRange = pdRange > 0 ? (positionFromLow / pdRange) * 100 : 50;

        let zone: 'above_pdh' | 'upper_half' | 'lower_half' | 'below_pdl' = 'lower_half';
        if (currentPrice > yesterday.high) zone = 'above_pdh';
        else if (currentPrice < yesterday.low) zone = 'below_pdl';
        else if (percentInRange >= 50) zone = 'upper_half';

        const pricePosition = {
            withinPDRange: currentPrice >= yesterday.low && currentPrice <= yesterday.high,
            percentInRange: Math.max(0, Math.min(100, percentInRange)),
            zone,
        };

        // Calculate session high/low
        const activeSession = getActiveSession();
        const sessions: SessionData[] = Object.entries(SESSIONS).map(([key, session]) => {
            const { high, low } = calculateSessionHighLow(todayBars, session.start, session.end);
            return {
                name: `${session.emoji} ${session.name}`,
                high,
                low,
                range: (high - low) * 10000, // Convert to pips
                isActive: key === activeSession,
                startHour: session.start,
                endHour: session.end,
            };
        });

        const keyLevelsData: KeyLevelsData = {
            previousDay: yesterday,
            currentPrice,
            priceVsPDC,
            pricePosition,
            sessions,
            activeSession: SESSIONS[activeSession as keyof typeof SESSIONS]?.name || 'Unknown',
            lastUpdated: new Date().toISOString(),
            cached: false,
        };

        cache = { data: keyLevelsData, timestamp: Date.now() };

        return NextResponse.json(keyLevelsData);
    } catch (error) {
        console.error('EURUSD key levels API error:', error);

        if (cache) {
            return NextResponse.json({ ...cache.data, cached: true, stale: true });
        }

        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to fetch key levels' },
            { status: 500 }
        );
    }
}
