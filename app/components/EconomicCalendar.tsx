'use client';

import { useEffect, useState } from 'react';

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

    useEffect(() => {
        fetch('/api/calendar')
            .then((res) => res.json())
            .then((json) => {
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
            <div className="text-zinc-500 text-sm animate-pulse">
                Loading economic calendar…
            </div>
        );
    }
    if (error) {
        return (
            <p className="text-zinc-500 text-sm" role="status">
                {error}
            </p>
        );
    }
    if (!data || !data.events || data.events.length === 0) {
        return (
            <p className="text-zinc-500 text-sm">No upcoming high-impact events for USD/JPY.</p>
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

    // Get impact badge color
    const getImpactColor = (impact: string) => {
        switch (impact) {
            case 'High':
                return 'bg-red-500/20 text-red-400 border-red-500/30';
            case 'Medium':
                return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
            case 'Low':
                return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
            default:
                return 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30';
        }
    };

    // Get event state badge
    const getEventStateBadge = (state: ForexFactoryEvent['eventState']) => {
        switch (state) {
            case 'EVENT_RISK':
                return {
                    text: '⚠️ RISK',
                    className: 'bg-red-500/30 text-red-300 border-red-500/50 animate-pulse',
                };
            case 'CAUTION':
                return {
                    text: '⏰ SOON',
                    className: 'bg-amber-500/30 text-amber-300 border-amber-500/50',
                };
            case 'POST_EVENT':
                return {
                    text: '📊 OUT',
                    className: 'bg-blue-500/30 text-blue-300 border-blue-500/50',
                };
            case 'CLEAR':
            default:
                return {
                    text: '✓ CLEAR',
                    className: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
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
        return `in ${days}d ${Math.round(hours % 24)}h`;
    };

    // Get row styling based on event state
    const getRowStyle = (state: ForexFactoryEvent['eventState']) => {
        switch (state) {
            case 'EVENT_RISK':
                return 'border-red-500/50 ring-2 ring-red-500/20 bg-red-900/10';
            case 'CAUTION':
                return 'border-amber-500/40 ring-1 ring-amber-500/10';
            case 'POST_EVENT':
                return 'border-blue-500/40 bg-blue-900/10';
            default:
                return 'border-zinc-700/50 hover:border-zinc-600/50';
        }
    };

    // Check if there's an active event risk
    const hasEventRisk = data.events.some(e => e.eventState === 'EVENT_RISK');
    const hasCaution = data.events.some(e => e.eventState === 'CAUTION');

    return (
        <div className="space-y-3" aria-label="Economic Calendar">
            {/* Event Risk Warning */}
            {hasEventRisk && (
                <div className="bg-red-900/30 border border-red-500/40 rounded-lg p-3 animate-pulse">
                    <p className="text-sm text-red-300 font-medium">
                        ⚠️ <strong>EVENT RISK ACTIVE</strong> — Bias neutral, expect fake moves, reduce size
                    </p>
                </div>
            )}

            {!hasEventRisk && hasCaution && (
                <div className="bg-amber-900/20 border border-amber-500/30 rounded-lg p-3">
                    <p className="text-xs text-amber-300">
                        ⏰ High-impact event approaching — Consider reducing exposure
                    </p>
                </div>
            )}

            {data.events.map((event) => {
                const stateBadge = getEventStateBadge(event.eventState);

                return (
                    <div
                        key={event.id}
                        className={`bg-zinc-800/60 rounded-xl p-4 border transition-all duration-300 ${getRowStyle(event.eventState)}`}
                    >
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1.5">
                                    <span className="text-lg" title={event.currency}>
                                        {getCurrencyFlag(event.currency)}
                                    </span>
                                    <h4 className="text-sm font-medium text-zinc-100 truncate">
                                        {event.event}
                                    </h4>
                                    <span
                                        className={`px-1.5 py-0.5 text-xs font-medium rounded border ${getImpactColor(event.impact)}`}
                                    >
                                        {event.impact}
                                    </span>
                                </div>
                                <div className="flex items-center gap-3 text-xs text-zinc-500 flex-wrap">
                                    <span className="font-medium text-zinc-400">
                                        {formatEventTime(event.date)}
                                    </span>
                                    <span className={`font-semibold ${event.hoursToEvent < 0 ? 'text-blue-400' :
                                            event.hoursToEvent < 2 ? 'text-red-400' :
                                                event.hoursToEvent < 6 ? 'text-amber-400' :
                                                    'text-zinc-400'
                                        }`}>
                                        {formatHoursToEvent(event.hoursToEvent)}
                                    </span>
                                </div>
                                {(event.forecast || event.previous) && (
                                    <div className="flex items-center gap-3 text-xs text-zinc-500 mt-1">
                                        {event.forecast && (
                                            <span>Fcst: <span className="text-zinc-300">{event.forecast}</span></span>
                                        )}
                                        {event.previous && (
                                            <span>Prev: <span className="text-zinc-300">{event.previous}</span></span>
                                        )}
                                    </div>
                                )}
                            </div>
                            <div className="shrink-0">
                                <span
                                    className={`px-2 py-1 text-xs font-bold rounded border ${stateBadge.className}`}
                                >
                                    {stateBadge.text}
                                </span>
                            </div>
                        </div>
                    </div>
                );
            })}

            {/* Trading Logic Summary */}
            <div className="bg-zinc-800/40 border border-zinc-700/30 rounded-lg p-3 mt-2">
                <p className="text-xs text-zinc-500">
                    <strong className="text-zinc-400">Event Logic:</strong>{' '}
                    <span className="text-red-400">RISK</span> = Neutral bias | {' '}
                    <span className="text-amber-400">SOON</span> = Reduce size | {' '}
                    <span className="text-blue-400">OUT</span> = Follow momentum | {' '}
                    <span className="text-emerald-400">CLEAR</span> = Trade structure
                </p>
            </div>

            {/* Cache status */}
            <div className="flex items-center justify-between text-xs text-zinc-600 pt-1">
                <span>
                    {data.events.length} USD/JPY event{data.events.length !== 1 ? 's' : ''}
                </span>
                <span>
                    {data.stale ? 'Stale · ' : ''}{data.cached ? 'Cached · 30m' : 'Fresh'}
                </span>
            </div>
        </div>
    );
}
