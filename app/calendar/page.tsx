'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type CalendarEvent = {
    date: string;
    time: string;
    currency: string;
    event: string;
    impact: 'high' | 'medium' | 'low';
    forecast?: string;
    previous?: string;
    actual?: string;
    hoursToEvent?: number;
};

export default function CalendarPage() {
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filter, setFilter] = useState<'all' | 'USD' | 'EUR' | 'JPY' | 'GBP'>('all');

    useEffect(() => {
        async function fetchCalendar() {
            try {
                const res = await fetch('/api/calendar');
                const data = await res.json();
                if (data.events) {
                    setEvents(data.events);
                } else if (data.error) {
                    setError(data.error);
                }
            } catch (err) {
                setError('Failed to load economic calendar');
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
        fetchCalendar();
    }, []);

    const filteredEvents = filter === 'all'
        ? events
        : events.filter(e => e.currency === filter);

    const getImpactColor = (impact: string) => {
        if (impact === 'high') return 'bg-rose-500/20 text-rose-400 border-rose-500/30';
        if (impact === 'medium') return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
        return 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30';
    };

    const getCurrencyFlag = (currency: string) => {
        switch (currency) {
            case 'USD': return '🇺🇸';
            case 'EUR': return '🇪🇺';
            case 'JPY': return '🇯🇵';
            case 'GBP': return '🇬🇧';
            case 'CHF': return '🇨🇭';
            case 'AUD': return '🇦🇺';
            case 'CAD': return '🇨🇦';
            case 'NZD': return '🇳🇿';
            default: return '🌐';
        }
    };

    return (
        <div className="min-h-screen gradient-bg">
            {/* Header */}
            <header className="border-b border-zinc-800/50 bg-zinc-900/50 backdrop-blur-sm sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Link href="/" className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                </svg>
                                <span className="hidden sm:inline">Home</span>
                            </Link>
                            <div className="h-6 w-px bg-zinc-700"></div>
                            <div>
                                <h1 className="text-xl sm:text-2xl font-bold text-white">Economic Calendar</h1>
                                <p className="text-xs sm:text-sm text-zinc-400">High-impact forex events</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Link href="/news" className="px-4 py-2 rounded-xl glass-card hover:bg-zinc-700/50 text-sm text-zinc-300 transition-colors">
                                📰 News
                            </Link>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
                {/* Currency Filter */}
                <div className="mb-6 flex flex-wrap gap-2">
                    {(['all', 'USD', 'EUR', 'JPY', 'GBP'] as const).map((curr) => (
                        <button
                            key={curr}
                            onClick={() => setFilter(curr)}
                            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${filter === curr
                                    ? 'bg-violet-600 text-white'
                                    : 'glass-card text-zinc-400 hover:text-white'
                                }`}
                        >
                            {curr === 'all' ? '🌐 All' : `${getCurrencyFlag(curr)} ${curr}`}
                        </button>
                    ))}
                </div>

                {/* Calendar Card */}
                <div className="glass-card rounded-2xl p-4 sm:p-6">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <div>
                            <h2 className="text-lg sm:text-xl font-semibold text-white">Upcoming Events</h2>
                            <p className="text-sm text-zinc-500">Next 72 hours • High impact</p>
                        </div>
                    </div>

                    {loading ? (
                        <div className="space-y-3">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="h-20 bg-zinc-800/30 rounded-xl animate-pulse"></div>
                            ))}
                        </div>
                    ) : error ? (
                        <div className="p-6 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-center">
                            {error}
                        </div>
                    ) : filteredEvents.length === 0 ? (
                        <div className="p-8 text-center text-zinc-500">
                            No high-impact events scheduled for next 72 hours
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {filteredEvents.map((event, i) => (
                                <div
                                    key={i}
                                    className="p-4 rounded-xl bg-zinc-800/30 border border-zinc-700/30 hover:border-zinc-600/50 transition-colors"
                                >
                                    <div className="flex flex-wrap items-start justify-between gap-4">
                                        <div className="flex items-start gap-4">
                                            <div className="text-2xl">{getCurrencyFlag(event.currency)}</div>
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="font-semibold text-white">{event.event}</span>
                                                    <span className={`text-xs px-2 py-0.5 rounded-full border ${getImpactColor(event.impact)}`}>
                                                        {event.impact.toUpperCase()}
                                                    </span>
                                                </div>
                                                <div className="text-sm text-zinc-500">
                                                    {event.currency} • {event.date} at {event.time}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4 text-sm">
                                            {event.previous && (
                                                <div className="text-center">
                                                    <div className="text-xs text-zinc-500">Previous</div>
                                                    <div className="text-zinc-300">{event.previous}</div>
                                                </div>
                                            )}
                                            {event.forecast && (
                                                <div className="text-center">
                                                    <div className="text-xs text-zinc-500">Forecast</div>
                                                    <div className="text-amber-400">{event.forecast}</div>
                                                </div>
                                            )}
                                            {event.hoursToEvent && (
                                                <div className="px-3 py-1.5 rounded-lg bg-violet-500/20 border border-violet-500/30">
                                                    <span className="text-violet-400 font-medium">
                                                        {event.hoursToEvent < 1
                                                            ? 'Soon'
                                                            : `${Math.round(event.hoursToEvent)}h`}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Legend & Info */}
                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="glass-card rounded-xl p-5">
                        <h3 className="text-lg font-semibold text-white mb-4">Impact Levels</h3>
                        <div className="space-y-3 text-sm">
                            <div className="flex items-center gap-3">
                                <span className="px-2 py-1 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs">HIGH</span>
                                <span className="text-zinc-400">Can move markets 50+ pips</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="px-2 py-1 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs">MEDIUM</span>
                                <span className="text-zinc-400">May cause 20-50 pip moves</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="px-2 py-1 rounded-full bg-zinc-500/20 text-zinc-400 border border-zinc-500/30 text-xs">LOW</span>
                                <span className="text-zinc-400">Usually minor market impact</span>
                            </div>
                        </div>
                    </div>

                    <div className="glass-card rounded-xl p-5">
                        <h3 className="text-lg font-semibold text-white mb-4">Quick Links</h3>
                        <div className="grid grid-cols-2 gap-3">
                            <Link href="/forex" className="flex items-center gap-2 p-3 rounded-xl bg-zinc-800/30 hover:bg-zinc-700/50 transition-colors">
                                <span className="text-purple-400">💹</span>
                                <span className="text-sm text-zinc-300">USD/JPY</span>
                            </Link>
                            <Link href="/eurusd" className="flex items-center gap-2 p-3 rounded-xl bg-zinc-800/30 hover:bg-zinc-700/50 transition-colors">
                                <span className="text-cyan-400">💱</span>
                                <span className="text-sm text-zinc-300">EUR/USD</span>
                            </Link>
                            <Link href="/news" className="flex items-center gap-2 p-3 rounded-xl bg-zinc-800/30 hover:bg-zinc-700/50 transition-colors">
                                <span className="text-amber-400">📰</span>
                                <span className="text-sm text-zinc-300">News</span>
                            </Link>
                            <Link href="/" className="flex items-center gap-2 p-3 rounded-xl bg-zinc-800/30 hover:bg-zinc-700/50 transition-colors">
                                <span className="text-emerald-400">🏠</span>
                                <span className="text-sm text-zinc-300">Home</span>
                            </Link>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
