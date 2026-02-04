'use client';

import { useEffect, useState } from 'react';

type Session = {
    name: string;
    city: string;
    flag: string;
    isActive: boolean;
    opensAt: string;
    closesAt: string;
    timeRemaining: string;
    overlap?: string;
};

type SessionData = {
    currentSession: Session | null;
    allSessions: Session[];
    nextSession: Session | null;
    marketPhase: 'tokyo' | 'london' | 'newyork' | 'overlap' | 'closed';
};

function getSessionData(): SessionData {
    const now = new Date();
    const utcHour = now.getUTCHours();
    const utcMinutes = now.getUTCMinutes();
    const totalMinutes = utcHour * 60 + utcMinutes;

    // Session times in UTC (approximate)
    const sessions = {
        tokyo: { start: 0, end: 9, name: 'Tokyo', city: 'Asia', flag: '🇯🇵' },
        london: { start: 8, end: 17, name: 'London', city: 'Europe', flag: '🇬🇧' },
        newyork: { start: 13, end: 22, name: 'New York', city: 'Americas', flag: '🇺🇸' },
    };

    const formatTime = (hour: number) => {
        const h = hour % 24;
        const ampm = h >= 12 ? 'PM' : 'AM';
        const h12 = h % 12 || 12;
        return `${h12}:00 ${ampm}`;
    };

    const getTimeRemaining = (endHour: number) => {
        let endMinutes = endHour * 60;
        if (endMinutes < totalMinutes) endMinutes += 24 * 60;
        const remaining = endMinutes - totalMinutes;
        const hours = Math.floor(remaining / 60);
        const mins = remaining % 60;
        return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
    };

    const allSessions: Session[] = [];
    let currentSession: Session | null = null;
    let marketPhase: SessionData['marketPhase'] = 'closed';

    // Tokyo Session
    const tokyoActive = utcHour >= sessions.tokyo.start && utcHour < sessions.tokyo.end;
    allSessions.push({
        name: 'Tokyo',
        city: 'Asia',
        flag: '🇯🇵',
        isActive: tokyoActive,
        opensAt: formatTime(sessions.tokyo.start),
        closesAt: formatTime(sessions.tokyo.end),
        timeRemaining: tokyoActive ? getTimeRemaining(sessions.tokyo.end) : '',
    });
    if (tokyoActive) {
        currentSession = allSessions[0];
        marketPhase = 'tokyo';
    }

    // London Session
    const londonActive = utcHour >= sessions.london.start && utcHour < sessions.london.end;
    const tokyoLondonOverlap = tokyoActive && londonActive;
    allSessions.push({
        name: 'London',
        city: 'Europe',
        flag: '🇬🇧',
        isActive: londonActive,
        opensAt: formatTime(sessions.london.start),
        closesAt: formatTime(sessions.london.end),
        timeRemaining: londonActive ? getTimeRemaining(sessions.london.end) : '',
        overlap: tokyoLondonOverlap ? 'Tokyo' : undefined,
    });
    if (londonActive) {
        currentSession = allSessions[1];
        marketPhase = tokyoLondonOverlap ? 'overlap' : 'london';
    }

    // New York Session
    const nyActive = utcHour >= sessions.newyork.start && utcHour < sessions.newyork.end;
    const londonNYOverlap = londonActive && nyActive;
    allSessions.push({
        name: 'New York',
        city: 'Americas',
        flag: '🇺🇸',
        isActive: nyActive,
        opensAt: formatTime(sessions.newyork.start),
        closesAt: formatTime(sessions.newyork.end),
        timeRemaining: nyActive ? getTimeRemaining(sessions.newyork.end) : '',
        overlap: londonNYOverlap ? 'London' : undefined,
    });
    if (nyActive) {
        currentSession = allSessions[2];
        marketPhase = londonNYOverlap ? 'overlap' : 'newyork';
    }

    // Find next session if market is closed
    let nextSession: Session | null = null;
    if (!currentSession) {
        // Find next session to open
        if (utcHour < sessions.tokyo.start || utcHour >= sessions.newyork.end) {
            nextSession = allSessions[0]; // Tokyo
        } else if (utcHour < sessions.london.start) {
            nextSession = allSessions[1]; // London
        } else if (utcHour < sessions.newyork.start) {
            nextSession = allSessions[2]; // NY
        }
    }

    return { currentSession, allSessions, nextSession, marketPhase };
}

export default function SessionClock() {
    const [data, setData] = useState<SessionData | null>(null);
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const updateData = () => {
            setData(getSessionData());
            setTime(new Date());
        };
        updateData();
        const interval = setInterval(updateData, 60000); // Update every minute
        return () => clearInterval(interval);
    }, []);

    if (!data) return null;

    const getPhaseColor = (phase: string) => {
        switch (phase) {
            case 'overlap': return 'from-amber-500 to-orange-600';
            case 'tokyo': return 'from-rose-500 to-pink-600';
            case 'london': return 'from-blue-500 to-indigo-600';
            case 'newyork': return 'from-emerald-500 to-teal-600';
            default: return 'from-zinc-500 to-zinc-600';
        }
    };

    const getPhaseLabel = (phase: string) => {
        switch (phase) {
            case 'overlap': return 'Session Overlap';
            case 'tokyo': return 'Asian Session';
            case 'london': return 'European Session';
            case 'newyork': return 'US Session';
            default: return 'Markets Closed';
        }
    };

    return (
        <div className="space-y-3">
            {/* Current Phase Header */}
            <div className={`p-4 rounded-xl bg-gradient-to-r ${getPhaseColor(data.marketPhase)} shadow-lg`}>
                <div className="flex items-center justify-between">
                    <div>
                        <div className="text-xs text-white/70 uppercase tracking-wide">Current Phase</div>
                        <div className="text-lg font-bold text-white">{getPhaseLabel(data.marketPhase)}</div>
                    </div>
                    <div className="text-right">
                        <div className="text-2xl font-bold text-white">
                            {time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        <div className="text-xs text-white/70">Local Time</div>
                    </div>
                </div>
            </div>

            {/* Session List */}
            <div className="space-y-2">
                {data.allSessions.map((session) => (
                    <div
                        key={session.name}
                        className={`p-3 rounded-xl border transition-all ${session.isActive
                            ? 'bg-zinc-800/50 border-violet-500/30'
                            : 'bg-zinc-800/20 border-zinc-700/20'
                            }`}
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <span className="text-xl">{session.flag}</span>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className={`font-medium ${session.isActive ? 'text-white' : 'text-zinc-400'}`}>
                                            {session.name}
                                        </span>
                                        {session.isActive && (
                                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-medium">
                                                ACTIVE
                                            </span>
                                        )}
                                        {session.overlap && (
                                            <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-xs">
                                                + {session.overlap}
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-xs text-zinc-500">
                                        {session.opensAt} — {session.closesAt} UTC
                                    </div>
                                </div>
                            </div>
                            {session.isActive && session.timeRemaining && (
                                <div className="text-right">
                                    <div className="text-sm font-medium text-violet-400">{session.timeRemaining}</div>
                                    <div className="text-xs text-zinc-500">remaining</div>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Volatility Note */}
            <div className="p-3 rounded-xl bg-zinc-800/30 border border-zinc-700/20">
                <p className="text-xs text-zinc-500 flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    <span className="text-zinc-400">Best USD/JPY volatility:</span> Tokyo open, London-NY overlap
                </p>
            </div>
        </div>
    );
}
