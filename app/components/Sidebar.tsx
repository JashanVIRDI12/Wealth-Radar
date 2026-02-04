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
    market?: 'forex' | 'nifty';
};

export default function Sidebar({ market = 'forex' }: SidebarProps) {
    const [collapsed, setCollapsed] = useState(false);
    const pathname = usePathname();

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
        ...(market === 'forex' ? [{
            name: 'Calendar',
            href: `/${market}/calendar`,
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
            ),
        }] : []),
        {
            name: 'News',
            href: `/${market}/news`,
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                </svg>
            ),
        },
        ...(market === 'nifty' ? [{
            name: 'Scanner',
            href: `/${market}/scanner`,
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
            ),
        }] : []),
    ];

    const marketConfig = {
        forex: {
            emoji: '💱',
            name: 'USD/JPY',
            label: 'Forex Pair',
            color: 'from-violet-500 to-purple-600',
            colorLight: 'from-violet-500/20 to-purple-500/10',
            colorBorder: 'border-violet-500/30',
            colorText: 'text-violet-400',
        },
        nifty: {
            emoji: '📊',
            name: 'NIFTY 50',
            label: 'Indian Index',
            color: 'from-cyan-500 to-blue-600',
            colorLight: 'from-cyan-500/20 to-blue-500/10',
            colorBorder: 'border-cyan-500/30',
            colorText: 'text-cyan-400',
        },
    };

    const config = marketConfig[market];

    return (
        <aside className={`fixed left-0 top-0 h-screen bg-zinc-900/80 backdrop-blur-xl border-r border-zinc-800/50 transition-all duration-300 z-50 ${collapsed ? 'w-20' : 'w-64'}`}>
            {/* Logo */}
            <div className="p-6 border-b border-zinc-800/50">
                <Link href="/" className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${config.color} flex items-center justify-center shadow-lg shadow-${market === 'forex' ? 'violet' : 'cyan'}-500/20`}>
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                    </div>
                    {!collapsed && (
                        <div>
                            <h1 className="text-lg font-bold text-white">Wealth Radar</h1>
                            <p className="text-xs text-zinc-500">{market === 'forex' ? 'Forex' : 'Indices'} Dashboard</p>
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
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${isActive
                                ? `bg-gradient-to-r ${config.colorLight} text-white border ${config.colorBorder}`
                                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
                                }`}
                        >
                            <span className={isActive ? config.colorText : `text-zinc-500 group-hover:${config.colorText} transition-colors`}>
                                {item.icon}
                            </span>
                            {!collapsed && <span className="font-medium">{item.name}</span>}
                        </Link>
                    );
                })}
            </nav>

            {/* Market Switcher */}
            {!collapsed && (
                <div className="p-4">
                    <div className="text-xs text-zinc-500 mb-2 px-2">Switch Market</div>
                    <Link
                        href={market === 'forex' ? '/nifty' : '/forex'}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl bg-zinc-800/30 hover:bg-zinc-800/50 text-zinc-400 hover:text-white transition-all duration-200"
                    >
                        <span className="text-lg">
                            {market === 'forex' ? '📊' : '💱'}
                        </span>
                        <div>
                            <div className="text-sm font-medium">
                                {market === 'forex' ? 'NIFTY 50' : 'USD/JPY'}
                            </div>
                            <div className="text-xs text-zinc-600">
                                {market === 'forex' ? 'Indices' : 'Forex'}
                            </div>
                        </div>
                    </Link>
                </div>
            )}

            {/* Pair Badge */}
            {!collapsed && (
                <div className="absolute bottom-20 left-4 right-4">
                    <div className={`p-3 rounded-xl bg-gradient-to-r ${config.colorLight} border ${config.colorBorder}`}>
                        <div className="flex items-center gap-2">
                            <span className="text-lg">{config.emoji}</span>
                            <div>
                                <div className="text-sm font-medium text-white">{config.name}</div>
                                <div className="text-xs text-zinc-500">{config.label}</div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Collapse button */}
            <button
                onClick={() => setCollapsed(!collapsed)}
                className="absolute bottom-6 left-1/2 -translate-x-1/2 p-2 rounded-lg bg-zinc-800/50 text-zinc-400 hover:text-white hover:bg-zinc-700/50 transition-all"
            >
                <svg className={`w-5 h-5 transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                </svg>
            </button>
        </aside>
    );
}
