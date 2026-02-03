import { NextResponse } from 'next/server';
import axios from 'axios';

const MAX_HEADLINES = 5;
// NewsAPI Developer free: 100 requests/day. ~15 min cache → up to 96 requests/day.
const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes

type CachedArticle = {
  title: string;
  source: string;
  url: string;
  publishedAt: string;
};

let newsCache: { headlines: CachedArticle[]; lastUpdated: string } | null = null;
let lastFetchTime = 0;

export async function GET() {
  try {
    const now = Date.now();
    if (newsCache && now - lastFetchTime < CACHE_DURATION) {
      return NextResponse.json({
        headlines: newsCache.headlines,
        lastUpdated: newsCache.lastUpdated,
        cached: true,
      });
    }

    const apiKey = process.env.NEWSAPI_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'NewsAPI key not configured' },
        { status: 500 }
      );
    }

    // Query: Fed, BOJ, USDJPY — searchIn title,description for relevance
    const from = new Date();
    from.setDate(from.getDate() - 7);

    const response = await axios.get('https://newsapi.org/v2/everything', {
      params: {
        q: 'Fed OR BOJ OR USDJPY',
        apiKey,
        language: 'en',
        sortBy: 'relevancy',
        pageSize: MAX_HEADLINES,
        searchIn: 'title,description',
        from: from.toISOString().split('T')[0],
      },
    });

    if (response.data?.status !== 'ok' || !Array.isArray(response.data?.articles)) {
      throw new Error('Invalid NewsAPI response');
    }

    const headlines: CachedArticle[] = response.data.articles
      .slice(0, MAX_HEADLINES)
      .filter((a: { title?: string }) => a?.title)
      .map((a: { title: string; source?: { name?: string }; url: string; publishedAt: string }) => ({
        title: a.title,
        source: a.source?.name ?? 'Unknown',
        url: a.url,
        publishedAt: a.publishedAt,
      }));

    const lastUpdated = new Date().toISOString();
    newsCache = { headlines, lastUpdated };
    lastFetchTime = now;

    return NextResponse.json({
      headlines,
      lastUpdated,
      cached: false,
    });
  } catch (error) {
    console.error('Error fetching news:', error);
    if (newsCache) {
      return NextResponse.json({
        headlines: newsCache.headlines,
        lastUpdated: newsCache.lastUpdated,
        cached: true,
        error: 'Using cached news',
      });
    }
    return NextResponse.json(
      { error: 'Failed to fetch news' },
      { status: 500 }
    );
  }
}
