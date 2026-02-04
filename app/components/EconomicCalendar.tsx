'use client';

import { useEffect, useState } from 'react';
import { fetchWithCache } from '../lib/browserCache';

type ForexFactoryEvent = {
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

type CalendarData = {
    events: ForexFactoryEvent[];
    cached?: boolean;
    stale?: boolean;
    lastUpdated: string;
    error?: string;
};

export default function EconomicCalendar() {
    const [data, setData] = useState<CalendarData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [browserCached, setBrowserCached] = useState(false);

    useEffect(() => {
        fetchWithCache<CalendarData>('calendar', '/api/calendar')
            .then(({ data: json, fromBrowserCache }) => {
                setBrowserCached(fromBrowserCache);
                if (json.error && !json.events) {
                    setError(json.error);
                    return;
                }
                setData(json);
            })
            .catch(() => setError('Failed to load economic calendar'))
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="p-4 rounded-xl bg-zinc-800/30 animate-pulse">
                        <div className="flex items-center justify-between mb-2">
                            <div className="h-4 bg-zinc-700/50 rounded w-32"></div>
                            <div className="h-5 bg-zinc-700/50 rounded w-16"></div>
                        </div>
                        <div className="h-3 bg-zinc-700/50 rounded w-48"></div>
                    </div>
                ))}
            </div>
        );
    }
    if (error) {
        return (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                {error}
            </div>
        );
    }
    if (!data || !data.events || data.events.length === 0) {
        return (
            <div className="p-4 rounded-xl bg-zinc-800/40 text-zinc-500 text-sm text-center">
                No upcoming high-impact events.
            </div>
        );
    }

    // Format date for display
    const formatEventTime = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
        });
    };

    // Get event state badge
    const getEventStateBadge = (state: ForexFactoryEvent['eventState']) => {
        switch (state) {
            case 'EVENT_RISK':
                return {
                    text: 'RISK',
                    className: 'bg-red-500/20 text-red-400 border-red-500/30',
                };
            case 'CAUTION':
                return {
                    text: '⏰ SOON',
                    className: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
                };
            case 'POST_EVENT':
                return {
                    text: 'OUT',
                    className: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
                };
            case 'CLEAR':
            default:
                return {
                    text: '✓',
                    className: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
                };
        }
    };

    // Get currency flag emoji
    const getCurrencyFlag = (currency: string) => {
        switch (currency) {
            case 'USD':
                return '🇺🇸';
            case 'JPY':
                return '🇯🇵';
            default:
                return '🌐';
        }
    };

    // Format hours to event
    const formatHoursToEvent = (hours: number) => {
        if (hours < 0) {
            const absHours = Math.abs(hours);
            if (absHours < 1) {
                return `${Math.round(absHours * 60)}m ago`;
            }
            return `${absHours.toFixed(1)}h ago`;
        }
        if (hours < 1) {
            return `in ${Math.round(hours * 60)}m`;
        }
        if (hours < 24) {
            return `in ${hours.toFixed(1)}h`;
        }
        const days = Math.floor(hours / 24);
        return `in ${days}d`;
    };

    // Check if there's an active event risk
    const hasEventRisk = data.events.some(e => e.eventState === 'EVENT_RISK');
    const hasCaution = data.events.some(e => e.eventState === 'CAUTION');

    return (
        <div className="space-y-3">
            {/* Event Risk Warning */}
            {hasEventRisk && (
                <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 animate-pulse">
                    <p className="text-sm text-red-400 font-medium">
                        <strong>EVENT RISK</strong> — Expect volatility
                    </p>
                </div>
            )}

            {!hasEventRisk && hasCaution && (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30">
                    <p className="text-xs text-amber-400">
                        ⏰ High-impact event approaching
                    </p>
                </div>
            )}

            {/* Events List */}
            {data.events.map((event) => {
                const stateBadge = getEventStateBadge(event.eventState);

                return (
                    <div
                        key={event.id}
                        className={`p-3 rounded-xl border transition-all ${event.eventState === 'EVENT_RISK'
                            ? 'bg-red-500/10 border-red-500/30'
                            : event.eventState === 'CAUTION'
                                ? 'bg-amber-500/5 border-amber-500/20'
                                : 'bg-zinc-800/30 border-zinc-700/20 hover:border-zinc-600/40'
                            }`}
                    >
                        <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-base">{getCurrencyFlag(event.currency)}</span>
                                    <h4 className="text-sm font-medium text-zinc-200 truncate">
                                        {event.event}
                                    </h4>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-zinc-500">
                                    <span>{formatEventTime(event.date)}</span>
                                    <span className={`font-medium ${event.hoursToEvent < 0 ? 'text-blue-400' :
                                        event.hoursToEvent < 2 ? 'text-red-400' :
                                            event.hoursToEvent < 6 ? 'text-amber-400' :
                                                'text-zinc-400'
                                        }`}>
                                        {formatHoursToEvent(event.hoursToEvent)}
                                    </span>
                                </div>
                            </div>
                            <span className={`px-2 py-1 text-xs font-medium rounded-lg border shrink-0 ${stateBadge.className}`}>
                                {stateBadge.text}
                            </span>
                        </div>
                        {(event.forecast || event.previous) && (
                            <div className="flex items-center gap-3 mt-2 text-xs text-zinc-500">
                                {event.forecast && (
                                    <span>Fcst: <span className="text-zinc-400">{event.forecast}</span></span>
                                )}
                                {event.previous && (
                                    <span>Prev: <span className="text-zinc-400">{event.previous}</span></span>
                                )}
                            </div>
                        )}
                    </div>
                );
            })}

            {/* Cache status */}
            <div className="flex items-center justify-between pt-2 text-xs text-zinc-600">
                <span>{data.events.length} event{data.events.length !== 1 ? 's' : ''}</span>
                <div className="flex items-center gap-2">
                    {browserCached && (
                        <span className="flex items-center gap-1 text-blue-400">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                            </svg>
                            Browser
                        </span>
                    )}
                    <span>{data.cached ? '30m cache' : 'Fresh'}</span>
                </div>
            </div>
        </div>
    );
}
