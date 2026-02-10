'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

type NavItem = {
    name: string;
    href: string;
    icon: React.ReactNode;
};

type SidebarProps = {
    market?: 'forex' | 'eurusd';
    pairName?: string;
    pairEmoji?: string;
};

export default function Sidebar({ market = 'forex', pairName, pairEmoji }: SidebarProps) {
    const [collapsed, setCollapsed] = useState(false);
    const pathname = usePathname();

    const calendarHref = market === 'eurusd' ? '/calendar' : `/${market}/calendar`;
    const newsHref = market === 'eurusd' ? '/news' : `/${market}/news`;

    // Market-specific navigation
    const navItems: NavItem[] = [
        {
            name: 'Dashboard',
            href: `/${market}`,
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
            ),
        },
        ...((market === 'forex' || market === 'eurusd') ? [{
            name: 'Calendar',
            href: calendarHref,
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
            ),
        }] : []),
        {
            name: 'News',
            href: newsHref,
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                </svg>
            ),
        },
    ];

    const marketConfig = {
        forex: {
            emoji: '💱',
            name: 'USD/JPY',
            label: 'Forex Pair',
            accent: 'text-violet-300',
        },
        eurusd: {
            emoji: '💱',
            name: 'EUR/USD',
            label: 'Forex Pair',
            accent: 'text-violet-300',
        },
    };

    const config = marketConfig[market];
    const resolvedName = pairName ?? config.name;

    const pairIcon = (
        <svg className="w-5 h-5 text-white/90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    );

    return (
        <aside className={`fixed left-0 top-0 h-screen bg-black/35 border-r border-white/5 transition-all duration-300 z-50 ${collapsed ? 'w-20' : 'w-64'}`}>
            {/* Logo */}
            <div className="p-6 border-b border-white/5">
                <Link href="/" className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                    </div>
                    {!collapsed && (
                        <div>
                            <h1 className="text-[15px] font-semibold text-white tracking-tight">Wealth Radar</h1>
                            <p className="text-[11px] text-white/40 tracking-[0.16em] uppercase">{market === 'forex' ? 'Forex' : 'Indices'}</p>
                        </div>
                    )}
                </Link>
            </div>

            {/* Navigation */}
            <nav className="p-4 space-y-2">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors duration-150 group border ${isActive
                                ? `bg-white/5 text-white border-white/10`
                                : 'text-white/60 hover:text-white border-transparent hover:bg-white/3'
                                }`}
                        >
                            <span className={isActive ? config.accent : 'text-white/35 group-hover:text-white/70 transition-colors'}>
                                {item.icon}
                            </span>
                            {!collapsed && <span className="text-sm font-medium tracking-tight">{item.name}</span>}
                        </Link>
                    );
                })}
            </nav>

            {/* Market Switcher */}
            {!collapsed && (
                <div className="p-4">
                    <div className="text-[11px] text-white/35 mb-2 px-2 tracking-[0.16em] uppercase">Switch</div>
                    <Link
                        href={market === 'forex' ? '/eurusd' : '/forex'}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/3 hover:bg-white/5 text-white/65 hover:text-white transition-colors duration-150 border border-white/5"
                    >
                        <span className="w-8 h-8 rounded-lg bg-black/30 border border-white/10 flex items-center justify-center">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h8m0 0v8m0-8l-8 8" />
                            </svg>
                        </span>
                        <div>
                            <div className="text-sm font-medium tracking-tight">
                                {market === 'forex' ? 'EUR/USD' : 'USD/JPY'}
                            </div>
                            <div className="text-[11px] text-white/35 tracking-[0.16em] uppercase">
                                Forex
                            </div>
                        </div>
                    </Link>
                </div>
            )}

            {/* Pair Badge */}
            {!collapsed && (
                <div className="absolute bottom-20 left-4 right-4">
                    <div className="p-3 rounded-xl bg-white/3 border border-white/5">
                        <div className="flex items-center gap-2">
                            <span className="w-8 h-8 rounded-lg bg-black/25 border border-white/10 flex items-center justify-center">
                                {pairIcon}
                            </span>
                            <div>
                                <div className="text-sm font-medium text-white tracking-tight">{resolvedName}</div>
                                <div className="text-[11px] text-white/35 tracking-[0.16em] uppercase">{config.label}</div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Collapse button */}
            <button
                onClick={() => setCollapsed(!collapsed)}
                className="absolute bottom-6 left-1/2 -translate-x-1/2 p-2 rounded-lg bg-white/3 text-white/55 hover:text-white hover:bg-white/5 transition-colors"
            >
                <svg className={`w-5 h-5 transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                </svg>
            </button>
        </aside>
    );
}
