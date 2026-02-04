'use client';

import { useEffect, useState } from 'react';

export default function NiftySessionClock() {
    const [time, setTime] = useState(new Date());
    const [marketStatus, setMarketStatus] = useState<'PRE' | 'OPEN' | 'CLOSED'>('CLOSED');

    useEffect(() => {
        const timer = setInterval(() => {
            const now = new Date();
            setTime(now);

            // Convert to IST
            const istTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
            const hour = istTime.getHours();
            const minute = istTime.getMinutes();
            const day = istTime.getDay();

            // NSE hours: Mon-Fri, 9:15 AM - 3:30 PM IST
            if (day >= 1 && day <= 5) {
                if ((hour === 9 && minute >= 15) || (hour > 9 && hour < 15) || (hour === 15 && minute <= 30)) {
                    setMarketStatus('OPEN');
                } else if (hour < 9 || (hour === 9 && minute < 15)) {
                    setMarketStatus('PRE');
                } else {
                    setMarketStatus('CLOSED');
                }
            } else {
                setMarketStatus('CLOSED');
            }
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    const istTime = new Date(time.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));

    return (
        <div className="space-y-4">
            {/* Current IST Time */}
            <div className="text-center py-4 rounded-xl bg-gradient-to-r from-cyan-500/10 to-blue-500/5 border border-cyan-500/20">
                <div className="text-xs text-zinc-500 mb-1">India Standard Time</div>
                <div className="text-3xl font-bold text-white font-mono">
                    {istTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </div>
                <div className="text-xs text-cyan-400 mt-1">IST (UTC+5:30)</div>
            </div>

            {/* Market Status */}
            <div className={`p-4 rounded-xl border ${marketStatus === 'OPEN'
                    ? 'bg-emerald-500/10 border-emerald-500/30'
                    : marketStatus === 'PRE'
                        ? 'bg-amber-500/10 border-amber-500/30'
                        : 'bg-zinc-500/10 border-zinc-500/30'
                }`}>
                <div className="flex items-center justify-between">
                    <div>
                        <div className="text-xs text-zinc-500 mb-1">Market Status</div>
                        <div className={`text-lg font-bold ${marketStatus === 'OPEN'
                                ? 'text-emerald-400'
                                : marketStatus === 'PRE'
                                    ? 'text-amber-400'
                                    : 'text-zinc-400'
                            }`}>
                            {marketStatus === 'OPEN' ? '🟢 Market Open' : marketStatus === 'PRE' ? '🟡 Pre-Market' : '🔴 Market Closed'}
                        </div>
                    </div>
                    <div className="relative">
                        {marketStatus === 'OPEN' && (
                            <>
                                <div className="h-3 w-3 rounded-full bg-emerald-500 pulse-glow"></div>
                                <div className="absolute inset-0 h-3 w-3 rounded-full bg-emerald-500 animate-ping opacity-75"></div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* NSE Trading Hours */}
            <div className="space-y-2">
                <div className="text-xs text-zinc-500 font-medium">NSE Trading Hours</div>

                <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-zinc-800/30">
                    <span className="text-sm text-zinc-400">Pre-Open</span>
                    <span className="text-sm text-white font-medium">9:00 - 9:15 AM</span>
                </div>

                <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-zinc-800/30">
                    <span className="text-sm text-zinc-400">Regular Session</span>
                    <span className="text-sm text-white font-medium">9:15 AM - 3:30 PM</span>
                </div>

                <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-zinc-800/30">
                    <span className="text-sm text-zinc-400">Post-Close</span>
                    <span className="text-sm text-white font-medium">3:40 - 4:00 PM</span>
                </div>
            </div>

            {/* Trading Days */}
            <div className="pt-3 border-t border-zinc-800/50">
                <div className="text-xs text-zinc-500 mb-2">Trading Week</div>
                <div className="flex gap-1">
                    {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, index) => {
                        const isToday = istTime.getDay() === (index + 1) % 7;
                        const isTradingDay = index < 5;
                        return (
                            <div
                                key={index}
                                className={`flex-1 h-8 rounded-lg flex items-center justify-center text-xs font-medium transition-all ${isToday && isTradingDay
                                        ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/30'
                                        : isTradingDay
                                            ? 'bg-zinc-800/50 text-zinc-400'
                                            : 'bg-zinc-900/50 text-zinc-700'
                                    }`}
                            >
                                {day}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
