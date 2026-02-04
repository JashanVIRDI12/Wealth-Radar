import { NextResponse, NextRequest } from 'next/server';
import axios from 'axios';

const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes

type Article = {
  title: string;
  description: string;
  source: string;
  url: string;
  publishedAt: string;
  thumbnail?: string;
};

let newsCache: { articles: Article[]; lastUpdated: string; source: string } | null = null;
let lastFetchTime = 0;

// Yahoo Finance API - Primary source (JPY=X quote-specific news)
async function fetchYahooNews(): Promise<Article[]> {
  const timestamp = Date.now();
  const allArticles: Article[] = [];
  const seenUrls = new Set<string>();

  try {
    // Fetch news specifically for JPY=X quote from Yahoo Finance
    const url = `https://query1.finance.yahoo.com/v1/finance/search?q=JPY=X&newsCount=50&quotesCount=0&_=${timestamp}`;

    console.log('[Yahoo] Fetching news for JPY=X...');

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        'Accept': 'application/json',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://finance.yahoo.com/quote/JPY=X/',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
      },
    });

    if (!response.ok) {
      console.error(`[Yahoo] HTTP error: ${response.status}`);
      return [];
    }

    const data = await response.json();
    const newsItems = data.news || [];

    console.log(`[Yahoo] Received ${newsItems.length} news items for JPY=X`);

    newsItems.forEach((item: {
      title?: string;
      publisher?: string;
      link?: string;
      providerPublishTime?: number;
      thumbnail?: { resolutions?: Array<{ url: string }>; };
    }) => {
      const title = item.title || '';
      const url = item.link || '';

      // Skip duplicates and articles without URLs
      if (!url || seenUrls.has(url)) return;

      // Strict forex relevance check
      const titleLower = title.toLowerCase();

      // Exclude non-financial topics
      const excludeKeywords = [
        'lottery', 'ikea', 'pest', 'furniture', 'recipe', 'weather', 'celebrity',
        'entertainment', 'duvet', 'sports team', 'bison', 'ecosystem', 'real estate',
        'buy now pay later', 'bnpl', 'klarna', 'paypal', 'shopping', 'retail',
        'nato', 'military', 'bouquet', 'banknote bouquet', 'jail', 'cuba', 'russia slams',
        'bp shareholders', 'fossil fuel', 'pivot will pay', 'seafood exporters',
        'msme', 'labour-intensive', 'arctic security'
      ];
      if (excludeKeywords.some(keyword => titleLower.includes(keyword))) {
        console.log(`[Yahoo] Excluded (blacklist): "${title}"`);
        return;
      }

      // Strong forex keywords (any one of these is enough)
      const strongForexKeywords = [
        'forex', 'currency pair', 'usdjpy', 'jpy=x', 'eurusd', 'gbpusd', 'exchange rate',
        'fx market', 'fx trading', 'boj', 'bank of japan', 'fed rate',
        'federal reserve rate', 'currency trading', 'foreign exchange'
      ];

      // Weak forex keywords (need at least 2)
      const weakForexKeywords = [
        'jpy', 'yen', 'dollar', 'usd', 'currency', 'fx',
        'federal reserve', 'monetary policy', 'central bank',
        'interest rate', 'treasury', 'bond yield', 'inflation',
        'gold price', 'oil price', 'carry trade'
      ];

      const hasStrongTerm = strongForexKeywords.some(kw => titleLower.includes(kw));
      const weakMatches = weakForexKeywords.filter(kw => titleLower.includes(kw)).length;

      const isForexRelevant = hasStrongTerm || weakMatches >= 2;

      if (!isForexRelevant) {
        console.log(`[Yahoo] Excluded (weak match): "${title}"`);
        return;
      }

      console.log(`[Yahoo] ✓ Included: "${title}"`);

      seenUrls.add(url);
      allArticles.push({
        title,
        description: '',
        source: item.publisher || 'Yahoo Finance',
        url,
        publishedAt: item.providerPublishTime
          ? new Date(item.providerPublishTime * 1000).toISOString()
          : new Date().toISOString(),
        thumbnail: item.thumbnail?.resolutions?.[0]?.url || undefined,
      });
    });

    console.log(`[Yahoo] Successfully filtered ${allArticles.length} forex-relevant articles`);
    return allArticles;
  } catch (error) {
    console.error('[Yahoo] Error fetching news:', error);
    return [];
  }
}

// NewsAPI - Forex-focused source
async function fetchNewsAPIFallback(): Promise<Article[]> {
  const apiKey = process.env.NEWSAPI_KEY;
  if (!apiKey) return [];

  try {
    const from = new Date();
    from.setDate(from.getDate() - 3); // Last 3 days for fresher news

    const response = await axios.get('https://newsapi.org/v2/everything', {
      params: {
        q: '(forex OR currency OR "exchange rate" OR dollar OR yen OR USDJPY OR "Federal Reserve" OR BOJ OR Fed OR gold OR oil OR "interest rate" OR bond OR yield OR inflation OR tariff)',
        apiKey,
        language: 'en',
        sortBy: 'publishedAt',
        pageSize: 30,
        from: from.toISOString().split('T')[0],
      },
    });

    if (response.data?.status !== 'ok') {
      throw new Error('NewsAPI error');
    }

    // Filter for forex & financial relevance with stronger criteria
    const excludeKeywords = [
      'lottery', 'ikea', 'pest', 'furniture', 'recipe', 'weather', 'celebrity',
      'entertainment', 'duvet', 'sports', 'bison', 'ecosystem', 'real estate',
      'bnpl', 'klarna', 'afterpay', 'affirm', 'zip', 'paypal', 'buy now pay later',
      'nato', 'military', 'bouquet', 'banknote bouquet', 'jail', 'cuba sanctions',
      'bp shareholders', 'fossil fuel pivot', 'seafood', 'arctic'
    ];

    const forexKeywords = [
      'forex', 'currency', 'exchange rate', 'dollar', 'yen', 'usdjpy', 'jpy', 'usd', 'fx',
      'federal reserve', 'fed rate', 'boj', 'bank of japan', 'central bank', 'rba', 'ecb',
      'monetary policy', 'interest rate', 'treasury', 'bond', 'yield', 'inflation',
      'gold price', 'silver', 'crude oil', 'carry trade',
      "tariff's", 'gdp growth', 'forex reserves'
    ];

    return response.data.articles
      .filter((item: { title?: string; description?: string }) => {
        const text = `${item.title || ''} ${item.description || ''}`.toLowerCase();

        // First check: exclude articles with blacklisted keywords
        if (excludeKeywords.some(keyword => text.includes(keyword))) {
          return false;
        }

        // Second check: article must contain at least one forex keyword
        return forexKeywords.some(keyword => text.includes(keyword));
      })
      .map((item: {
        title?: string;
        description?: string;
        source?: { name?: string };
        url?: string;
        publishedAt?: string;
        urlToImage?: string;
      }) => ({
        title: item.title || '',
        description: item.description || '',
        source: item.source?.name || 'Unknown',
        url: item.url || '',
        publishedAt: item.publishedAt || new Date().toISOString(),
        thumbnail: item.urlToImage,
      }));
  } catch (error) {
    console.error('NewsAPI fallback error:', error);
    return [];
  }
}

export async function GET(request: NextRequest) {
  try {
    const now = Date.now();
    const { searchParams } = new URL(request.url);
    const forceRefresh = searchParams.get('refresh') === 'true';
    const clearCache = searchParams.get('clear') === 'true';

    // Clear cache if requested
    if (clearCache) {
      newsCache = null;
      lastFetchTime = 0;
      console.log('[News] Cache cleared');
    }

    // Return cached data if still valid (unless force refresh)
    if (!forceRefresh && newsCache && now - lastFetchTime < CACHE_DURATION) {
      return NextResponse.json({
        articles: newsCache.articles,
        lastUpdated: newsCache.lastUpdated,
        cached: true,
        source: newsCache.source,
      });
    }

    if (forceRefresh) {
      console.log('[News] Force refresh requested');
    }

    // Fetch from BOTH sources in parallel for freshest news
    const [yahooArticles, newsApiArticles] = await Promise.all([
      fetchYahooNews(),
      fetchNewsAPIFallback()
    ]);

    // Merge and deduplicate based on title similarity
    const allArticles: Article[] = [];
    const seenTitles = new Set<string>();

    const addArticle = (article: Article) => {
      // Normalize title for duplicate detection
      const normalizedTitle = article.title.toLowerCase().trim();
      if (!seenTitles.has(normalizedTitle) && article.title.length > 10) {
        seenTitles.add(normalizedTitle);
        allArticles.push(article);
      }
    };

    // Add all articles from both sources
    yahooArticles.forEach(addArticle);
    newsApiArticles.forEach(addArticle);

    // Sort by publish time (newest first) and take top 20
    allArticles.sort((a, b) =>
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    );

    const articles = allArticles.slice(0, 20);
    const source = `Yahoo Finance + NewsAPI (${yahooArticles.length}/${newsApiArticles.length})`;

    const lastUpdated = new Date().toISOString();

    newsCache = { articles, lastUpdated, source };
    lastFetchTime = now;

    return NextResponse.json({
      articles,
      lastUpdated,
      cached: false,
      source,
      totalArticles: articles.length,
    });
  } catch (error) {
    console.error('News route error:', error);

    if (newsCache) {
      return NextResponse.json({
        articles: newsCache.articles,
        lastUpdated: newsCache.lastUpdated,
        cached: true,
        stale: true,
        source: newsCache.source,
        error: 'Using cached news',
      });
    }

    return NextResponse.json(
      { error: 'Failed to fetch news', articles: [] },
      { status: 500 }
    );
  }
}
