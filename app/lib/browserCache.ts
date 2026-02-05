/**
 * Browser-side caching utility using localStorage
 * 
 * This prevents API calls on page refresh by caching data in the browser.
 * Each cache entry has its own TTL (time-to-live) in minutes.
 */

type CacheEntry<T> = {
    data: T;
    timestamp: number;
    ttl: number; // TTL in minutes
};

// Cache durations in minutes (should match or be slightly less than server cache)
export const CACHE_DURATIONS = {
    indicators: 25,        // Server: 30 min (Twelve Data)
    indicatorsFree: 2,     // Server: 2 min (Yahoo Finance with fallback)
    eurusdIndicatorsFree: 2,
    mtf: 2,                // Server: 2 min (Multi-timeframe alignment)
    eurusdMtf: 2,
    keyLevels: 5,          // Server: 5 min (PDH/PDL/PDC & Session levels - USDJPY)
    keyLevelsNifty: 5,     // Server: 5 min (PDH/PDL/PDC & Session levels - NIFTY)
    eurusdKeyLevels: 5,
    macro: 60 * 23,        // Server: 24h (cache for 23h on browser)
    news: 12,              // Server: 15 min
    calendar: 25,          // Server: 30 min
    aiSummary: 55,         // Server: 1h
    eurusdAiSummary: 55,   // Server: 1h
    pivots: 55,            // Server: 1h (pivots change once per day)
    eurusdPivots: 55,
} as const;

export type CacheKey = keyof typeof CACHE_DURATIONS;

/**
 * Get cached data from localStorage
 * Returns null if no cache, expired, or error
 */
export function getCache<T>(key: CacheKey): T | null {
    if (typeof window === 'undefined') return null;

    try {
        const raw = localStorage.getItem(`wealth-radar-cache-${key}`);
        if (!raw) return null;

        const entry: CacheEntry<T> = JSON.parse(raw);
        const now = Date.now();
        const ageMinutes = (now - entry.timestamp) / (1000 * 60);

        // Check if cache has expired
        if (ageMinutes > entry.ttl) {
            localStorage.removeItem(`wealth-radar-cache-${key}`);
            return null;
        }

        return entry.data;
    } catch (e) {
        console.warn(`[Cache] Failed to read ${key}:`, e);
        return null;
    }
}

/**
 * Set data in localStorage cache
 */
export function setCache<T>(key: CacheKey, data: T): void {
    if (typeof window === 'undefined') return;

    try {
        const entry: CacheEntry<T> = {
            data,
            timestamp: Date.now(),
            ttl: CACHE_DURATIONS[key],
        };
        localStorage.setItem(`wealth-radar-cache-${key}`, JSON.stringify(entry));
    } catch (e) {
        console.warn(`[Cache] Failed to write ${key}:`, e);
    }
}

/**
 * Clear specific cache entry
 */
export function clearCache(key: CacheKey): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(`wealth-radar-cache-${key}`);
}

/**
 * Clear all Wealth Radar cache entries
 */
export function clearAllCache(): void {
    if (typeof window === 'undefined') return;

    Object.keys(CACHE_DURATIONS).forEach((key) => {
        localStorage.removeItem(`wealth-radar-cache-${key}`);
    });
}

/**
 * Get cache age in minutes (for display purposes)
 */
export function getCacheAge(key: CacheKey): number | null {
    if (typeof window === 'undefined') return null;

    try {
        const raw = localStorage.getItem(`wealth-radar-cache-${key}`);
        if (!raw) return null;

        const entry: CacheEntry<unknown> = JSON.parse(raw);
        return Math.round((Date.now() - entry.timestamp) / (1000 * 60));
    } catch {
        return null;
    }
}

/**
 * Fetch with browser cache - the main utility function
 * First checks browser cache, only fetches from API if cache is expired
 */
export async function fetchWithCache<T>(
    key: CacheKey,
    url: string,
    options?: RequestInit
): Promise<{ data: T; fromBrowserCache: boolean }> {
    // Check browser cache first
    const cached = getCache<T>(key);
    if (cached) {
        return { data: cached, fromBrowserCache: true };
    }

    // Fetch from API
    const response = await fetch(url, options);
    const data = await response.json();

    // Cache the response (only if it's valid)
    if (response.ok) {
        setCache(key, data);
    }

    return { data, fromBrowserCache: false };
}
