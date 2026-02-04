# API limits & cache settings

Cache durations are set so you stay under each provider's free-tier / rate limits.

| API | Limit (free tier) | Our cache | Max requests/day |
|-----|-------------------|-----------|------------------|
| **Yahoo Finance** (indicators) | **UNLIMITED** (scraping) | **1 min** | ∞ |
| **Yahoo Finance** (pivots/ATR) | **UNLIMITED** (scraping) | 1 hour | ∞ |
| **NewsAPI** | 100 requests/day | 15 min | ~96 |
| **FRED** (macro) | Rate-limited (429 if exceeded) | 24 hours | 3 |
| **FMP** (calendar) | Free tier | 30 min | ~48 |
| **OpenRouter** (AI) | Free tier by model | 1 hour | ~24 |

> ⚡ **Primary data (Price, RSI, EMA, ATR, Pivots) now uses FREE Yahoo Finance scraping with no API limits!**

## Two-Tier Caching System

We use a **two-tier caching system** to minimize API usage:

### 1. Browser Cache (localStorage)
- **Location**: User's browser (`localStorage`)
- **Purpose**: Prevents API route calls on page refresh
- **Indicator**: 📦 Browser (blue text)
- **Behavior**: Data persists across page refreshes and browser sessions

| Data | Browser Cache TTL |
|------|-------------------|
| **Indicators (Free)** | **1 min** ⚡ |
| Pivots/ATR | 55 min |
| Macro | 23 hours |
| News | 12 min |
| Calendar | 25 min |
| AI Summary | 55 min |

### 2. Server Cache (in-memory)
- **Location**: Next.js server memory
- **Purpose**: Prevents external API calls when browser cache misses
- **Indicator**: 🖥 Server (gray text)
- **Behavior**: Shared across all users; resets on server restart/deployment

### How it works on page refresh:

```
Page Refresh → Check Browser Cache
                    ↓
              [Cache Valid?]
                /       \
             YES         NO
              ↓           ↓
        Return data   Call /api/*
        (no API call)     ↓
                    [Server Cache Valid?]
                      /       \
                   YES         NO
                    ↓           ↓
             Return cached   Fetch from
               server data   external API
```

## API Details

- **NewsAPI** – Developer: 100 requests/day. 15 min cache → up to ~96 requests/day (under 100).
- **Twelve Data** – Basic: 800 credits/day, 8 credits/minute. Price = 1 credit; RSI, EMA 20, EMA 50 = 1 credit each (4 credits per indicators run). Price route: 30 min cache → ~48 requests/day. Indicators route: 30 min cache → ~48 runs/day (~192 credits). Total Twelve Data usage stays under 800/day.
- **FRED** – No published daily number; returns 429 when limit exceeded. Macro route does 3 series per run. 24h cache → 3 requests/day.
- **RapidAPI Twitter (twitter288)** – Free BASIC: 1000 requests/hour, 500k/month. No Apify rent. 2h cache → ~12 requests/day. Get key at [rapidapi.com/xtwitter/api/twitter288](https://rapidapi.com/xtwitter/api/twitter288).
- **OpenRouter (AI bias)** – Used when user clicks "Send to AI". Combines cached price, macro, and headlines; returns structured JSON (bias, confidence, 3 reasons, 1 risk). Default model: `openai/gpt-oss-20b:free`. Get key at [openrouter.ai/keys](https://openrouter.ai/keys). Set `OPENROUTER_API_KEY` in `.env.local`. Optional: `OPENROUTER_MODEL` to override model.

## Customizing Cache Duration

- **Browser cache**: Edit durations in `app/lib/browserCache.ts` → `CACHE_DURATIONS` object
- **Server cache**: Edit durations in each `app/api/*/route.ts` route file

If you upgrade a provider's plan, you can shorten cache in the route files (see comments at top of each `app/api/*/route.ts`).
