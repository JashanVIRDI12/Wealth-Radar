'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type Article = {
    title: string;
    description: string;
    url: string;
    source: string;
    publishedAt: string;
    urlToImage?: string;
};

export default function NewsPage() {
    const [articles, setArticles] = useState<Article[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filter, setFilter] = useState<'all' | 'usd' | 'eur' | 'forex'>('all');

    useEffect(() => {
        async function fetchNews() {
            try {
                const res = await fetch('/api/news');
                const data = await res.json();
                if (data.articles) {
                    setArticles(data.articles);
                } else if (data.error) {
                    setError(data.error);
                }
            } catch (err) {
                setError('Failed to load news');
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
        fetchNews();
    }, []);

    const filteredArticles = filter === 'all'
        ? articles
        : articles.filter(a => {
            const text = `${a.title} ${a.description}`.toLowerCase();
            if (filter === 'usd') return text.includes('usd') || text.includes('dollar') || text.includes('fed') || text.includes('us ');
            if (filter === 'eur') return text.includes('eur') || text.includes('euro') || text.includes('ecb');
            if (filter === 'forex') return text.includes('forex') || text.includes('fx') || text.includes('currency');
            return true;
        });

    const formatTimeAgo = (dateString: string) => {
        try {
            const date = new Date(dateString);
            const now = new Date();
            const diffMs = now.getTime() - date.getTime();
            const diffMins = Math.floor(diffMs / 60000);
            const diffHours = Math.floor(diffMins / 60);
            const diffDays = Math.floor(diffHours / 24);

            if (diffMins < 60) return `${diffMins}m ago`;
            if (diffHours < 24) return `${diffHours}h ago`;
            if (diffDays === 1) return 'Yesterday';
            return `${diffDays}d ago`;
        } catch {
            return '';
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
                                <h1 className="text-xl sm:text-2xl font-bold text-white">Market News</h1>
                                <p className="text-xs sm:text-sm text-zinc-400">Latest forex & market updates</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Link href="/calendar" className="px-4 py-2 rounded-xl glass-card hover:bg-zinc-700/50 text-sm text-zinc-300 transition-colors">
                                📅 Calendar
                            </Link>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
                {/* Filter Tabs */}
                <div className="mb-6 flex flex-wrap gap-2">
                    {(['all', 'usd', 'eur', 'forex'] as const).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setFilter(tab)}
                            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${filter === tab
                                    ? 'bg-violet-600 text-white'
                                    : 'glass-card text-zinc-400 hover:text-white'
                                }`}
                        >
                            {tab === 'all' ? '📰 All News' :
                                tab === 'usd' ? '🇺🇸 USD' :
                                    tab === 'eur' ? '🇪🇺 EUR' : '💱 Forex'}
                        </button>
                    ))}
                </div>

                {/* News Grid */}
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="glass-card rounded-xl p-4 animate-pulse">
                                <div className="h-4 bg-zinc-800 rounded w-3/4 mb-3"></div>
                                <div className="h-3 bg-zinc-800 rounded w-full mb-2"></div>
                                <div className="h-3 bg-zinc-800 rounded w-2/3"></div>
                            </div>
                        ))}
                    </div>
                ) : error ? (
                    <div className="glass-card rounded-2xl p-8 text-center">
                        <svg className="w-16 h-16 text-rose-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <h2 className="text-xl font-bold text-white mb-2">Error Loading News</h2>
                        <p className="text-zinc-400">{error}</p>
                    </div>
                ) : filteredArticles.length === 0 ? (
                    <div className="glass-card rounded-2xl p-8 text-center text-zinc-500">
                        No articles found for this filter
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredArticles.map((article, i) => (
                            <a
                                key={i}
                                href={article.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="glass-card rounded-xl p-5 hover:border-zinc-600/50 hover:bg-zinc-800/50 transition-all group"
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <span className="text-xs px-2 py-1 rounded-full bg-violet-500/20 text-violet-400 border border-violet-500/30">
                                        {article.source}
                                    </span>
                                    <span className="text-xs text-zinc-500">{formatTimeAgo(article.publishedAt)}</span>
                                </div>
                                <h3 className="text-base font-semibold text-white mb-2 line-clamp-2 group-hover:text-violet-400 transition-colors">
                                    {article.title}
                                </h3>
                                {article.description && (
                                    <p className="text-sm text-zinc-400 line-clamp-3">
                                        {article.description}
                                    </p>
                                )}
                                <div className="mt-3 flex items-center gap-1 text-xs text-zinc-500">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                    </svg>
                                    <span>Read more</span>
                                </div>
                            </a>
                        ))}
                    </div>
                )}

                {/* Quick Links */}
                <div className="mt-8 glass-card rounded-xl p-5">
                    <h3 className="text-lg font-semibold text-white mb-4">Quick Links</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <Link href="/forex" className="flex items-center gap-2 p-3 rounded-xl bg-zinc-800/30 hover:bg-zinc-700/50 transition-colors">
                            <span className="text-purple-400">💹</span>
                            <span className="text-sm text-zinc-300">USD/JPY</span>
                        </Link>
                        <Link href="/eurusd" className="flex items-center gap-2 p-3 rounded-xl bg-zinc-800/30 hover:bg-zinc-700/50 transition-colors">
                            <span className="text-cyan-400">💱</span>
                            <span className="text-sm text-zinc-300">EUR/USD</span>
                        </Link>
                        <Link href="/calendar" className="flex items-center gap-2 p-3 rounded-xl bg-zinc-800/30 hover:bg-zinc-700/50 transition-colors">
                            <span className="text-amber-400">📅</span>
                            <span className="text-sm text-zinc-300">Calendar</span>
                        </Link>
                        <Link href="/" className="flex items-center gap-2 p-3 rounded-xl bg-zinc-800/30 hover:bg-zinc-700/50 transition-colors">
                            <span className="text-emerald-400">🏠</span>
                            <span className="text-sm text-zinc-300">Home</span>
                        </Link>
                    </div>
                </div>
            </main>
        </div>
    );
}
