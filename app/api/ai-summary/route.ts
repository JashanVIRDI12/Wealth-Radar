import { NextRequest, NextResponse } from 'next/server';

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const DEFAULT_MODEL = 'deepseek/deepseek-chat-v3-0324';

// Cache for AI summary - 1 hour to minimize API costs
type SummaryCache = {
    data: AISummaryOutput;
    timestamp: number;
};
let summaryCache: SummaryCache | null = null;
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

export type AISummaryOutput = {
    // Market Overview
    marketBias: 'bullish' | 'bearish' | 'neutral';
    biasStrength: 'strong' | 'moderate' | 'weak';

    // Technical Analysis
    technicalAnalysis: {
        trend: string;
        momentum: string;
        keyLevels: {
            support: string;
            resistance: string;
        };
        signals: string[];
    };

    // Macro Analysis
    macroAnalysis: {
        interestRateDifferential: string;
        inflationOutlook: string;
        centralBankStance: string;
        keyDrivers: string[];
    };

    // Trading Recommendation
    tradingRecommendation: {
        action: 'buy' | 'sell' | 'hold' | 'wait';
        confidence: 'high' | 'medium' | 'low';
        reasoning: string;
        riskLevel: 'high' | 'medium' | 'low';
        timeframe: string;
    };

    // Key Risks
    risks: string[];

    // Summary
    executiveSummary: string;

    // Meta
    generatedAt: string;
};

function getBaseUrl(request: NextRequest): string {
    try {
        return new URL(request.url).origin;
    } catch {
        return process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000';
    }
}

type IndicatorsData = {
    price?: number;
    rsi?: number;
    ema20?: number;
    ema50?: number;
    trend?: string;
};

type MacroData = {
    us10yYield?: number;
    usInflation?: number;
    japanInflation?: number;
};

type CalendarEvent = {
    currency: string;
    event: string;
    hoursToEvent: number;
    eventState: string;
    forecast?: string;
    previous?: string;
};

type Headline = {
    title: string;
    source: string;
};

function buildDetailedPrompt(
    indicators: IndicatorsData,
    macro: MacroData,
    calendar: CalendarEvent[],
    headlines: Headline[]
): string {
    // Technical data section
    const technicalStr = [
        indicators.price != null && `Current Price: ${indicators.price.toFixed(3)}`,
        indicators.rsi != null && `RSI(14): ${indicators.rsi.toFixed(2)}`,
        indicators.ema20 != null && `EMA 20: ${indicators.ema20.toFixed(3)}`,
        indicators.ema50 != null && `EMA 50: ${indicators.ema50.toFixed(3)}`,
        indicators.trend && `Current Trend: ${indicators.trend}`,
    ].filter(Boolean).join('\n') || 'No technical data available';

    // Macro data section
    const macroStr = [
        macro.us10yYield != null && `US 10Y Treasury Yield: ${macro.us10yYield}%`,
        macro.usInflation != null && `US Inflation Rate: ${macro.usInflation}%`,
        macro.japanInflation != null && `Japan Inflation Rate: ${macro.japanInflation}%`,
        macro.usInflation != null && macro.japanInflation != null &&
        `Inflation Differential (US-JP): ${(macro.usInflation - macro.japanInflation).toFixed(2)}%`,
    ].filter(Boolean).join('\n') || 'No macro data available';

    // Calendar events
    const upcomingEvents = calendar
        .filter(e => e.hoursToEvent > 0 && e.hoursToEvent < 72)
        .slice(0, 5);
    const calendarStr = upcomingEvents.length
        ? upcomingEvents.map(e =>
            `- ${e.currency} ${e.event} in ${e.hoursToEvent.toFixed(1)}h${e.forecast ? ` (F: ${e.forecast})` : ''}`
        ).join('\n')
        : 'No major events in next 72 hours';

    // News headlines
    const newsStr = headlines.length
        ? headlines.slice(0, 5).map(h => `- ${h.title}`).join('\n')
        : 'No recent headlines';

    return `You are an expert FX analyst providing a comprehensive trading analysis for USD/JPY. Analyze ALL the data provided below and generate a detailed, actionable trading summary.

=== TECHNICAL DATA ===
${technicalStr}

=== MACRO DATA ===
${macroStr}

=== UPCOMING ECONOMIC EVENTS ===
${calendarStr}

=== RECENT NEWS ===
${newsStr}

=== YOUR ANALYSIS REQUIREMENTS ===
Provide a comprehensive JSON response with the following structure. Be specific and actionable:

{
    "marketBias": "bullish" | "bearish" | "neutral",
    "biasStrength": "strong" | "moderate" | "weak",
    "technicalAnalysis": {
        "trend": "Brief description of current trend state",
        "momentum": "RSI interpretation and momentum assessment",
        "keyLevels": {
            "support": "Key support level with reasoning",
            "resistance": "Key resistance level with reasoning"
        },
        "signals": ["signal1", "signal2", "signal3"] // 3 key technical signals
    },
    "macroAnalysis": {
        "interestRateDifferential": "Analysis of US-Japan rate differential impact",
        "inflationOutlook": "Inflation comparison and implications",
        "centralBankStance": "Fed vs BOJ policy outlook",
        "keyDrivers": ["driver1", "driver2"] // 2-3 key macro drivers
    },
    "tradingRecommendation": {
        "action": "buy" | "sell" | "hold" | "wait",
        "confidence": "high" | "medium" | "low",
        "reasoning": "One sentence explaining the recommendation",
        "riskLevel": "high" | "medium" | "low",
        "timeframe": "Recommended timeframe (e.g., 'Intraday', '1-2 days', 'Swing')"
    },
    "risks": ["risk1", "risk2", "risk3"], // 3 key risks to watch
    "executiveSummary": "2-3 sentence executive summary of the analysis and recommendation"
}

RULES:
1. Base your analysis ONLY on the data provided above
2. Be specific with price levels when discussing support/resistance
3. Consider the upcoming events when assessing risk
4. If data is missing, note it but still provide analysis based on available data
5. Keep all text fields concise (under 50 words each)
6. Return ONLY valid JSON, no markdown or code blocks`;
}

function extractJson(text: string): string | null {
    let s = text.trim();
    s = s.replace(/^```json?\s*/i, '').replace(/\s*```\s*$/g, '').trim();
    const start = s.indexOf('{');
    if (start === -1) return null;
    let depth = 0;
    let end = -1;
    for (let i = start; i < s.length; i++) {
        if (s[i] === '{') depth++;
        else if (s[i] === '}') {
            depth--;
            if (depth === 0) {
                end = i;
                break;
            }
        }
    }
    if (end === -1) return null;
    return s.slice(start, end + 1);
}

function parseAISummary(text: string): AISummaryOutput | null {
    const jsonStr = extractJson(text);
    if (!jsonStr) return null;

    try {
        const parsed = JSON.parse(jsonStr);

        // Validate and normalize the response
        const validBias = ['bullish', 'bearish', 'neutral'].includes(parsed.marketBias)
            ? parsed.marketBias
            : 'neutral';
        const validStrength = ['strong', 'moderate', 'weak'].includes(parsed.biasStrength)
            ? parsed.biasStrength
            : 'moderate';
        const validAction = ['buy', 'sell', 'hold', 'wait'].includes(parsed.tradingRecommendation?.action)
            ? parsed.tradingRecommendation.action
            : 'hold';
        const validConfidence = ['high', 'medium', 'low'].includes(parsed.tradingRecommendation?.confidence)
            ? parsed.tradingRecommendation.confidence
            : 'medium';
        const validRisk = ['high', 'medium', 'low'].includes(parsed.tradingRecommendation?.riskLevel)
            ? parsed.tradingRecommendation.riskLevel
            : 'medium';

        return {
            marketBias: validBias,
            biasStrength: validStrength,
            technicalAnalysis: {
                trend: parsed.technicalAnalysis?.trend || 'Trend data unavailable',
                momentum: parsed.technicalAnalysis?.momentum || 'Momentum data unavailable',
                keyLevels: {
                    support: parsed.technicalAnalysis?.keyLevels?.support || 'N/A',
                    resistance: parsed.technicalAnalysis?.keyLevels?.resistance || 'N/A',
                },
                signals: Array.isArray(parsed.technicalAnalysis?.signals)
                    ? parsed.technicalAnalysis.signals.slice(0, 3)
                    : ['No signals available'],
            },
            macroAnalysis: {
                interestRateDifferential: parsed.macroAnalysis?.interestRateDifferential || 'N/A',
                inflationOutlook: parsed.macroAnalysis?.inflationOutlook || 'N/A',
                centralBankStance: parsed.macroAnalysis?.centralBankStance || 'N/A',
                keyDrivers: Array.isArray(parsed.macroAnalysis?.keyDrivers)
                    ? parsed.macroAnalysis.keyDrivers.slice(0, 3)
                    : ['No drivers identified'],
            },
            tradingRecommendation: {
                action: validAction,
                confidence: validConfidence,
                reasoning: parsed.tradingRecommendation?.reasoning || 'See analysis above',
                riskLevel: validRisk,
                timeframe: parsed.tradingRecommendation?.timeframe || 'Not specified',
            },
            risks: Array.isArray(parsed.risks)
                ? parsed.risks.slice(0, 3)
                : ['Market volatility'],
            executiveSummary: parsed.executiveSummary || 'Analysis complete. Review sections above for details.',
            generatedAt: new Date().toISOString(),
        };
    } catch {
        return null;
    }
}

export async function GET(request: NextRequest) {
    try {
        const now = Date.now();

        // Check cache first - return cached data if still valid
        if (summaryCache && (now - summaryCache.timestamp) < CACHE_DURATION) {
            return NextResponse.json({
                ...summaryCache.data,
                cached: true,
                cacheAge: Math.round((now - summaryCache.timestamp) / 60000), // minutes
                nextRefresh: Math.round((CACHE_DURATION - (now - summaryCache.timestamp)) / 60000), // minutes
            });
        }

        const apiKey = process.env.OPENROUTER_API_KEY;
        if (!apiKey) {
            return NextResponse.json(
                { error: 'OPENROUTER_API_KEY not configured' },
                { status: 500 }
            );
        }

        const base = getBaseUrl(request);

        // Fetch all data in parallel
        const [indicatorsRes, macroRes, calendarRes, newsRes] = await Promise.all([
            fetch(`${base}/api/indicators`),
            fetch(`${base}/api/macro`),
            fetch(`${base}/api/calendar`),
            fetch(`${base}/api/news`),
        ]);

        const [indicatorsJson, macroJson, calendarJson, newsJson] = await Promise.all([
            indicatorsRes.json().catch(() => ({})),
            macroRes.json().catch(() => ({})),
            calendarRes.json().catch(() => ({ events: [] })),
            newsRes.json().catch(() => ({ headlines: [] })),
        ]);

        const indicators: IndicatorsData = {
            price: indicatorsJson?.price,
            rsi: indicatorsJson?.rsi,
            ema20: indicatorsJson?.ema20,
            ema50: indicatorsJson?.ema50,
            trend: indicatorsJson?.trend,
        };

        const macro: MacroData = {
            us10yYield: macroJson?.us10yYield,
            usInflation: macroJson?.usInflation,
            japanInflation: macroJson?.japanInflation,
        };

        const calendar: CalendarEvent[] = Array.isArray(calendarJson?.events)
            ? calendarJson.events
            : [];

        const headlines: Headline[] = Array.isArray(newsJson?.headlines)
            ? newsJson.headlines.map((h: { title?: string; source?: string }) => ({
                title: h.title ?? '',
                source: h.source ?? '',
            }))
            : [];

        const prompt = buildDetailedPrompt(indicators, macro, calendar, headlines);
        const model = process.env.OPENROUTER_MODEL ?? DEFAULT_MODEL;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 90_000);

        const openRouterRes = await fetch(OPENROUTER_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model,
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.3,
                max_tokens: 1500,
            }),
            signal: controller.signal,
        }).finally(() => clearTimeout(timeoutId));

        if (!openRouterRes.ok) {
            const errBody = await openRouterRes.text();
            console.error('OpenRouter API error:', openRouterRes.status, errBody);

            // Return cached data if available on error
            if (summaryCache) {
                return NextResponse.json({
                    ...summaryCache.data,
                    cached: true,
                    stale: true,
                    error: 'Using cached data due to API error',
                });
            }

            return NextResponse.json(
                { error: 'OpenRouter request failed', details: errBody.slice(0, 500) },
                { status: 502 }
            );
        }

        const openRouterJson = (await openRouterRes.json()) as {
            choices?: Array<{ message?: { content?: string | null } }>;
            error?: { message?: string };
        };

        if (openRouterJson?.error?.message) {
            if (summaryCache) {
                return NextResponse.json({
                    ...summaryCache.data,
                    cached: true,
                    stale: true,
                    error: 'Using cached data due to API error',
                });
            }
            return NextResponse.json(
                { error: 'OpenRouter error', details: openRouterJson.error.message },
                { status: 502 }
            );
        }

        const text = openRouterJson?.choices?.[0]?.message?.content?.trim() ?? '';
        if (!text) {
            if (summaryCache) {
                return NextResponse.json({
                    ...summaryCache.data,
                    cached: true,
                    stale: true,
                    error: 'Using cached data - AI returned empty response',
                });
            }
            return NextResponse.json(
                { error: 'AI returned no content' },
                { status: 502 }
            );
        }

        const output = parseAISummary(text);
        if (!output) {
            if (summaryCache) {
                return NextResponse.json({
                    ...summaryCache.data,
                    cached: true,
                    stale: true,
                    error: 'Using cached data - could not parse AI response',
                });
            }
            return NextResponse.json(
                { error: 'Invalid AI response format', details: text.slice(0, 800) },
                { status: 502 }
            );
        }

        // Update cache
        summaryCache = {
            data: output,
            timestamp: now,
        };

        return NextResponse.json({
            ...output,
            cached: false,
        });

    } catch (error) {
        console.error('AI summary route error:', error);

        // Return cached data if available
        if (summaryCache) {
            return NextResponse.json({
                ...summaryCache.data,
                cached: true,
                stale: true,
                error: error instanceof Error ? error.message : 'Request failed',
            });
        }

        const message =
            error instanceof Error
                ? error.name === 'AbortError'
                    ? 'Request timed out (90s)'
                    : error.message
                : 'AI summary failed';
        return NextResponse.json(
            { error: 'AI summary failed', details: message },
            { status: 500 }
        );
    }
}
