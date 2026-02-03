# API limits & cache settings

Cache durations are set so you stay under each provider’s free-tier / rate limits.

| API | Limit (free tier) | Our cache | Max requests/day |
|-----|-------------------|-----------|------------------|
| **NewsAPI** | 100 requests/day | 15 min | ~96 |
| **Twelve Data** (price) | 800 credits/day, 8 credits/min | 30 min | ~48 |
| **Twelve Data** (indicators) | 800 credits/day, 8 credits/min | 30 min | ~48 runs (~192 credits) |
| **FRED** (macro) | Rate-limited (429 if exceeded) | 24 hours | 3 |
| **RapidAPI Twitter** (tweets) | Free: 1000 req/hour, 500k/month | 2 hours | ~12 |
| **OpenRouter** (AI bias) | Free tier by model | On demand | User-triggered |

## Details

- **NewsAPI** – Developer: 100 requests/day. 15 min cache → up to ~96 requests/day (under 100).
- **Twelve Data** – Basic: 800 credits/day, 8 credits/minute. Price = 1 credit; RSI, EMA 20, EMA 50 = 1 credit each (4 credits per indicators run). Price route: 30 min cache → ~48 requests/day. Indicators route: 30 min cache → ~48 runs/day (~192 credits). Total Twelve Data usage stays under 800/day.
- **FRED** – No published daily number; returns 429 when limit exceeded. Macro route does 3 series per run. 24h cache → 3 requests/day.
- **RapidAPI Twitter (twitter288)** – Free BASIC: 1000 requests/hour, 500k/month. No Apify rent. 2h cache → ~12 requests/day. Get key at [rapidapi.com/xtwitter/api/twitter288](https://rapidapi.com/xtwitter/api/twitter288).
- **OpenRouter (AI bias)** – Used when user clicks “Send to AI”. Combines cached price, macro, and headlines; returns structured JSON (bias, confidence, 3 reasons, 1 risk). Default model: `openai/gpt-oss-20b:free`. Get key at [openrouter.ai/keys](https://openrouter.ai/keys). Set `OPENROUTER_API_KEY` in `.env.local`. Optional: `OPENROUTER_MODEL` to override model.

If you upgrade a provider’s plan, you can shorten cache in the route files (see comments at top of each `app/api/*/route.ts`).
