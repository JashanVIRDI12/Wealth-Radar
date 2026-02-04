'use client';

import { useEffect, useState, useCallback } from 'react';
import { fetchWithCache, clearCache, CACHE_DURATIONS } from '../lib/browserCache';

type Article = {
  title: string;
  description?: string;
  source: string;
  url: string;
  publishedAt: string;
  thumbnail?: string;
};

type NewsResponse = {
  articles?: Article[];
  error?: string;
  cached?: boolean;
  source?: string;
};

function timeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);

  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${Math.floor(diffHours / 24)}d ago`;
}

function NewsCard({ article }: { article: Article }) {
  const [imgError, setImgError] = useState(false);

  return (
    <a
      href={article.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block group"
    >
      <div className="p-4 rounded-xl bg-zinc-800/40 border border-zinc-700/30 hover:bg-zinc-800/60 hover:border-zinc-600/50 transition-all duration-300">
        <div className="flex gap-4">
          {/* Thumbnail or Gradient Placeholder */}
          <div className="w-20 h-16 rounded-lg overflow-hidden flex-shrink-0">
            {article.thumbnail && !imgError ? (
              <img
                src={article.thumbnail}
                alt=""
                className="w-full h-full object-cover"
                onError={() => setImgError(true)}
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-violet-600 to-blue-600 flex items-center justify-center">
                <svg className="w-6 h-6 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-medium text-zinc-200 group-hover:text-white transition-colors leading-snug mb-2 line-clamp-2">
              {article.title}
            </h4>
            <div className="flex items-center gap-2 text-xs text-zinc-500">
              <span className="px-2 py-0.5 rounded bg-zinc-700/50 text-zinc-400 truncate max-w-[120px]">
                {article.source}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {timeAgo(article.publishedAt)}
              </span>
              <span className="ml-auto text-violet-400 group-hover:underline flex items-center gap-1">
                Read
                <svg className="w-3 h-3 transform group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </span>
            </div>
          </div>
        </div>
      </div>
    </a>
  );
}

export default function NewsHeadlines() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<string>('');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [nextRefresh, setNextRefresh] = useState<number>(CACHE_DURATIONS.news);

  const fetchNews = useCallback(async (forceRefresh = false) => {
    try {
      if (forceRefresh) {
        clearCache('news');
        setRefreshing(true);
      }

      // Clear old cache format if exists (had 'grouped' instead of 'articles')
      const oldCache = localStorage.getItem('wealth-radar-cache-news');
      if (oldCache) {
        try {
          const parsed = JSON.parse(oldCache);
          if (parsed.data?.grouped && !parsed.data?.articles) {
            localStorage.removeItem('wealth-radar-cache-news');
            console.log('[News] Cleared old cache format');
          }
        } catch {
          localStorage.removeItem('wealth-radar-cache-news');
        }
      }

      // Add refresh param to bypass server cache when force refreshing
      const apiUrl = forceRefresh ? '/api/news?refresh=true' : '/api/news';

      // If force refresh, don't use browser cache utility - fetch directly
      let data: NewsResponse;
      let fromBrowserCache = false;

      if (forceRefresh) {
        const response = await fetch(apiUrl);
        data = await response.json();
      } else {
        const result = await fetchWithCache<NewsResponse>('news', apiUrl);
        data = result.data;
        fromBrowserCache = result.fromBrowserCache;
      }

      // Handle both old grouped format and new articles format
      if (data.articles) {
        setArticles(data.articles);
      } else if ((data as unknown as { grouped?: Record<string, Article[]> }).grouped) {
        // Flatten old grouped format
        const grouped = (data as unknown as { grouped: Record<string, Article[]> }).grouped;
        const flat = [
          ...(grouped.reuters || []),
          ...(grouped.bloomberg || []),
          ...(grouped.cnbc || []),
          ...(grouped.fx || []),
        ];
        setArticles(flat);
      } else {
        setArticles([]);
      }
      setSource(data.source ?? 'Yahoo Finance');
      setLastUpdated(new Date());
      setNextRefresh(CACHE_DURATIONS.news);

      // Cache the fresh data after force refresh
      if (forceRefresh && data.articles) {
        const { setCache } = await import('../lib/browserCache');
        setCache('news', data);
        console.log('[News] Force refresh complete - cached new data');
      } else if (!fromBrowserCache) {
        console.log('[News] Fresh data fetched from API');
      }
    } catch {
      setError('Failed to load news');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Initial fetch and auto-refresh interval
  useEffect(() => {
    fetchNews();

    // Auto-refresh every 15 minutes (matching server cache)
    const refreshInterval = setInterval(() => {
      console.log('[News] Auto-refreshing...');
      fetchNews(true);
    }, CACHE_DURATIONS.news * 60 * 1000);

    // Countdown timer (updates every minute)
    const countdownInterval = setInterval(() => {
      setNextRefresh(prev => Math.max(0, prev - 1));
    }, 60 * 1000);

    return () => {
      clearInterval(refreshInterval);
      clearInterval(countdownInterval);
    };
  }, [fetchNews]);

  const handleManualRefresh = () => {
    fetchNews(true);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="p-4 rounded-xl bg-zinc-800/40 animate-pulse">
            <div className="flex gap-4">
              <div className="w-20 h-16 rounded-lg bg-zinc-700/50"></div>
              <div className="flex-1">
                <div className="h-4 bg-zinc-700/50 rounded w-full mb-2"></div>
                <div className="h-4 bg-zinc-700/50 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-zinc-700/50 rounded w-32"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 rounded-xl bg-red-500/10 border border-red-500/20 text-center">
        <svg className="w-10 h-10 text-red-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <p className="text-red-400">{error}</p>
      </div>
    );
  }

  if (articles.length === 0) {
    return (
      <div className="p-6 rounded-xl bg-zinc-800/40 text-center">
        <svg className="w-10 h-10 text-zinc-500 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
        </svg>
        <p className="text-zinc-500">No news available.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with source, refresh info, and button */}
      <div className="flex items-center justify-between mb-4 px-1">
        <div className="flex items-center gap-3">
          <span className="text-xs text-zinc-500">
            {articles.length} articles from {source || 'Yahoo Finance'}
          </span>
          {lastUpdated && (
            <span className="text-xs text-zinc-600">
              • Updated {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          {nextRefresh > 0 && (
            <span className="text-xs text-zinc-600">
              • Next refresh in {nextRefresh}m
            </span>
          )}
        </div>
        <button
          onClick={handleManualRefresh}
          disabled={refreshing}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-800/60 hover:bg-zinc-700/60 border border-zinc-700/50 hover:border-zinc-600/50 text-zinc-300 hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg
            className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* News list */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {articles.map((article, i) => (
          <NewsCard key={`${article.url}-${i}`} article={article} />
        ))}
      </div>
    </div>
  );
}
