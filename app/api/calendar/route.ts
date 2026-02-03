import { NextResponse } from 'next/server';
import axios from 'axios';

// Types
export type ForexFactoryEvent = {
    id: string;
    currency: string;
    impact: 'High' | 'Medium' | 'Low';
    event: string;
    date: string;
    forecast?: string;
    previous?: string;
    hoursToEvent: number;
    eventState: 'EVENT_RISK' | 'CAUTION' | 'POST_EVENT' | 'CLEAR';
};

type RawFFEvent = {
    title: string;
    country: string;
    date: string;
    impact: string;
    forecast?: string;
    previous?: string;
};

// In-memory cache
let cachedEvents: ForexFactoryEvent[] | null = null;
let lastFetchTime = 0;
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

// High-impact keywords to filter
const HIGH_IMPACT_KEYWORDS = [
    'CPI',
    'NFP',
    'Non-Farm',
    'Nonfarm',
    'Retail Sales',
    'Interest Rate',
    'Fed',
    'FOMC',
    'BOJ',
    'Powell',
    'Ueda',
    'GDP',
    'Unemployment',
    'Trade Balance',
    'PMI',
    'Core PCE',
    'PPI',
    'Employment',
    'Inflation',
];

export async function GET() {
    try {
        const now = Date.now();

        // Return cached data if valid
        if (cachedEvents && (now - lastFetchTime) < CACHE_DURATION) {
            return NextResponse.json({
                events: cachedEvents,
                cached: true,
                lastUpdated: new Date(lastFetchTime).toISOString(),
            });
        }

        // Fetch from the free Forex Factory JSON feed
        const response = await axios.get<RawFFEvent[]>(
            'https://nfs.faireconomy.media/ff_calendar_thisweek.json',
            { timeout: 10000 }
        );

        const rawEvents = response.data || [];

        // Filter for USD/JPY and high-impact events
        const filteredEvents = rawEvents.filter(e => {
            // Must be USD or JPY
            if (e.country !== 'USD' && e.country !== 'JPY') return false;

            // Must have a title
            if (!e.title) return false;

            // For high impact events, check keywords
            if (e.impact === 'High') {
                return HIGH_IMPACT_KEYWORDS.some(k =>
                    e.title.toLowerCase().includes(k.toLowerCase())
                );
            }

            return false;
        });

        // Convert to our format with event state
        const events: ForexFactoryEvent[] = filteredEvents.map((e, index) => {
            const eventDate = new Date(e.date);
            const hoursToEvent = (eventDate.getTime() - now) / (1000 * 60 * 60);
            const roundedHours = Math.round(hoursToEvent * 10) / 10;

            // Determine event state based on hours to event
            let eventState: ForexFactoryEvent['eventState'] = 'CLEAR';
            if (roundedHours < 0 && roundedHours > -1) {
                eventState = 'POST_EVENT'; // Just released (within last hour)
            } else if (roundedHours >= 0 && roundedHours < 2) {
                eventState = 'EVENT_RISK';
            } else if (roundedHours >= 2 && roundedHours < 6) {
                eventState = 'CAUTION';
            } else {
                eventState = 'CLEAR';
            }

            return {
                id: `ff-${index}`,
                currency: e.country,
                impact: e.impact as ForexFactoryEvent['impact'],
                event: e.title,
                date: e.date,
                forecast: e.forecast || undefined,
                previous: e.previous || undefined,
                hoursToEvent: roundedHours,
                eventState,
            };
        });

        // Sort by time (soonest first) and take upcoming/recent events
        events.sort((a, b) => a.hoursToEvent - b.hoursToEvent);

        // Filter to show: past 2 hours to next 7 days
        const relevantEvents = events.filter(e => e.hoursToEvent > -2 && e.hoursToEvent < 168);

        // Limit to 10 events
        const limitedEvents = relevantEvents.slice(0, 10);

        // Update cache
        cachedEvents = limitedEvents;
        lastFetchTime = now;

        return NextResponse.json({
            events: limitedEvents,
            cached: false,
            lastUpdated: new Date().toISOString(),
        });
    } catch (error) {
        console.error('Error fetching calendar:', error);

        // Return cached data on error
        if (cachedEvents) {
            return NextResponse.json({
                events: cachedEvents,
                cached: true,
                stale: true,
                error: 'Using cached data due to fetch error',
                lastUpdated: new Date(lastFetchTime).toISOString(),
            });
        }

        return NextResponse.json(
            { error: 'Failed to fetch economic calendar' },
            { status: 500 }
        );
    }
}
