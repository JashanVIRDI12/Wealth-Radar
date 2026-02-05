import { NextRequest, NextResponse } from 'next/server';

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const DEFAULT_MODEL = 'deepseek/deepseek-chat-v3-0324';

// Cache for AI summary - 1 hour to minimize API costs
type SummaryCache = {
    data: AISummaryOutput;
    timestamp: number;
};
let summaryCache: Record<string, SummaryCache | null> = {
    USDJPY: null,
    EURUSD: null,
};
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

export type AISummaryOutput = {
    marketBias: 'bullish' | 'bearish' | 'neutral';
    biasStrength: 'strong' | 'moderate' | 'weak';
    technicalAnalysis: {
        trend: string;
        momentum: string;
        keyLevels: {
            support: string;
            resistance: string;
        };
        signals: string[];
    };
    macroAnalysis: {
        interestRateDifferential: string;
        inflationOutlook: string;
        centralBankStance: string;
        keyDrivers: string[];
    };
    tradingRecommendation: {
        action: 'buy' | 'sell' | 'hold' | 'wait';
        confidence: 'high' | 'medium' | 'low';
        reasoning: string;
        riskLevel: 'high' | 'medium' | 'low';
        timeframe: string;
    };
    risks: string[];
    executiveSummary: string;
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
    priceChange?: number;
    priceChangePercent?: number;
    dayHigh?: number;
    dayLow?: number;
};

type PivotData = {
    pivots?: {
        pp: number;
        r1: number;
        r2: number;
        r3: number;
        s1: number;
        s2: number;
        s3: number;
    };
    atr?: {
        value: number;
        period: number;
        volatility: string;
    };
    pricePosition?: {
        zone: string;
        nearestLevel: string;
        nearestValue: number;
        distance: number;
    };
    rangeAnalysis?: {
        currentRange: number;
        atrPercent: number;
        rangeRemaining: number;
    };
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
    description?: string;
    source: string;
};

type MTFData = {
    timeframes?: Array<{
        timeframe: string;
        label: string;
        bias: string;
        ema20: number;
        ema50: number;
        rsi: number;
        trend: string;
    }>;
    alignment?: {
        direction: string;
        percentage: number;
    };
};

type KeyLevelsData = {
    previousDay?: { high: number; low: number; close: number };
    currentPrice?: number;
    priceVsPDC?: { position: string; bias: string; distance: number };
    activeSession?: string;
};

function buildDetailedPrompt(
    indicators: IndicatorsData,
    pivots: PivotData,
    macro: MacroData,
    calendar: CalendarEvent[],
    headlines: Headline[],
    mtf: MTFData,
    keyLevels: KeyLevelsData,
    pairLabel: string
): string {
    // Technical data
    const technicalStr = [
        indicators.price != null && `Current Price: ${indicators.price.toFixed(3)}`,
        indicators.priceChange != null && `Price Change: ${indicators.priceChange >= 0 ? '+' : ''}${indicators.priceChange.toFixed(3)} (${indicators.priceChangePercent?.toFixed(2)}%)`,
        indicators.dayHigh != null && indicators.dayLow != null && `Day Range: ${indicators.dayLow.toFixed(2)} - ${indicators.dayHigh.toFixed(2)}`,
        indicators.rsi != null && `RSI(14): ${indicators.rsi.toFixed(2)}${indicators.rsi >= 70 ? ' (OVERBOUGHT)' : indicators.rsi <= 30 ? ' (OVERSOLD)' : ''}`,
        indicators.ema20 != null && `EMA 20: ${indicators.ema20.toFixed(3)}`,
        indicators.ema50 != null && `EMA 50: ${indicators.ema50.toFixed(3)}`,
        indicators.ema20 != null && indicators.ema50 != null && `EMA Cross: ${indicators.ema20 > indicators.ema50 ? 'BULLISH (20>50)' : 'BEARISH (20<50)'}`,
        indicators.trend && `Trend: ${indicators.trend.toUpperCase()}`,
    ].filter(Boolean).join('\n') || 'No technical data available';

    // MTF Analysis
    const mtfStr = mtf.timeframes?.length ? [
        `MTF Alignment: ${mtf.alignment?.direction?.toUpperCase() || 'MIXED'} (${mtf.alignment?.percentage || 0}% aligned)`,
        ...mtf.timeframes.map(tf =>
            `- ${tf.label}: ${tf.bias.toUpperCase()} | EMA20 ${tf.ema20.toFixed(2)} vs EMA50 ${tf.ema50.toFixed(2)} | RSI ${tf.rsi.toFixed(1)} | Trend: ${tf.trend}`
        )
    ].join('\n') : 'No MTF data available';

    // Key Levels
    const keyLevelsStr = keyLevels.previousDay ? [
        `Previous Day High (PDH): ${keyLevels.previousDay.high.toFixed(3)}`,
        `Previous Day Low (PDL): ${keyLevels.previousDay.low.toFixed(3)}`,
        `Previous Day Close (PDC): ${keyLevels.previousDay.close.toFixed(3)}`,
        keyLevels.priceVsPDC && `Price vs PDC: ${keyLevels.priceVsPDC.position.toUpperCase()} by ${keyLevels.priceVsPDC.distance.toFixed(3)} pips (${keyLevels.priceVsPDC.bias.toUpperCase()} bias)`,
        keyLevels.activeSession && `Active Session: ${keyLevels.activeSession}`,
    ].filter(Boolean).join('\n') : 'No key levels data';

    // ATR & Volatility (dedicated section)
    const atrStr = pivots.atr ? [
        `ATR(14): ${pivots.atr.value.toFixed(3)} pips`,
        `Volatility Level: ${pivots.atr.volatility.toUpperCase()}`,
        pivots.rangeAnalysis && `Today's Range Used: ${pivots.rangeAnalysis.currentRange.toFixed(3)} pips (${pivots.rangeAnalysis.atrPercent.toFixed(0)}% of ATR)`,
        pivots.rangeAnalysis && `Remaining Expected Range: ${pivots.rangeAnalysis.rangeRemaining.toFixed(3)} pips`,
        `Stop Loss Suggestion: ${(pivots.atr.value * 1.5).toFixed(3)} pips (1.5x ATR)`,
        `Take Profit Target: ${(pivots.atr.value * 2).toFixed(3)} pips (2x ATR)`,
    ].filter(Boolean).join('\n') : 'No ATR data available';

    // Pivot Points
    const pivotStr = pivots.pivots ? [
        `Pivot Point (PP): ${pivots.pivots.pp}`,
        `Resistance: R1=${pivots.pivots.r1}, R2=${pivots.pivots.r2}, R3=${pivots.pivots.r3}`,
        `Support: S1=${pivots.pivots.s1}, S2=${pivots.pivots.s2}, S3=${pivots.pivots.s3}`,
        pivots.pricePosition && `Price Zone: ${pivots.pricePosition.zone.replace(/_/g, ' ').toUpperCase()}`,
        pivots.pricePosition && `Nearest Level: ${pivots.pricePosition.nearestLevel} at ${pivots.pricePosition.nearestValue} (${pivots.pricePosition.distance.toFixed(2)} pips away)`,
    ].filter(Boolean).join('\n') : 'No pivot data available';

    // Macro data
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
        ? headlines.slice(0, 8).map(h =>
            `- [${h.source}] ${h.title}`
        ).join('\n')
        : 'No recent headlines';

    return `You are an expert FX analyst providing a comprehensive trading analysis for ${pairLabel}. Analyze ALL the data provided below and generate a detailed, actionable trading summary.

=== CURRENT PRICE & TECHNICALS ===
${technicalStr}

=== MULTI-TIMEFRAME ANALYSIS ===
${mtfStr}

=== KEY LEVELS (PDH/PDL/PDC) ===
${keyLevelsStr}

=== ATR & VOLATILITY ===
${atrStr}

=== PIVOT POINTS ===
${pivotStr}

=== MACRO DATA ===
${macroStr}

=== UPCOMING ECONOMIC EVENTS ===
${calendarStr}

=== RECENT NEWS (Last 7 days) ===
${newsStr}

=== YOUR ANALYSIS REQUIREMENTS ===
Provide a comprehensive JSON response with the following structure. Be specific and actionable:

{
    "marketBias": "bullish" | "bearish" | "neutral",
    "biasStrength": "strong" | "moderate" | "weak",
    "technicalAnalysis": {
        "trend": "Brief description of current trend state based on MTF alignment",
        "momentum": "RSI interpretation across timeframes",
        "keyLevels": {
            "support": "Key support level (use PDL, S1, or EMA levels)",
            "resistance": "Key resistance level (use PDH, R1, or EMA levels)"
        },
        "signals": ["signal1", "signal2", "signal3"]
    },
    "macroAnalysis": {
        "interestRateDifferential": "Analysis of US-Japan rate differential impact",
        "inflationOutlook": "Inflation comparison and implications",
        "centralBankStance": "Fed vs BOJ policy outlook based on news",
        "keyDrivers": ["driver1", "driver2"]
    },
    "tradingRecommendation": {
        "action": "buy" | "sell" | "hold" | "wait",
        "confidence": "high" | "medium" | "low",
        "reasoning": "One sentence explaining the recommendation, reference MTF alignment and key levels",
        "riskLevel": "high" | "medium" | "low",
        "timeframe": "Recommended timeframe (e.g., 'Intraday', '1-2 days', 'Swing')"
    },
    "risks": ["risk1", "risk2", "risk3"],
    "executiveSummary": "2-3 sentence executive summary including MTF bias and news impact"
}

RULES:
1. Base your analysis ONLY on the data provided above
2. Consider MTF alignment when determining bias strength (100% = strong)
3. Factor in news sentiment when assessing market direction
4. Use PDH/PDL/PDC and pivot levels for support/resistance
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

        const url = new URL(request.url);
        const symbolParam = (url.searchParams.get('symbol') || 'USDJPY').toUpperCase().trim();
        const symbol = symbolParam === 'EURUSD' ? 'EURUSD' : 'USDJPY';
        const pairLabel = symbol === 'EURUSD' ? 'EUR/USD' : 'USD/JPY';

        const cachedEntry = summaryCache[symbol];

        // Check cache first
        if (cachedEntry && (now - cachedEntry.timestamp) < CACHE_DURATION) {
            return NextResponse.json({
                ...cachedEntry.data,
                cached: true,
                cacheAge: Math.round((now - cachedEntry.timestamp) / 60000),
                nextRefresh: Math.round((CACHE_DURATION - (now - cachedEntry.timestamp)) / 60000),
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

        const endpoints = symbol === 'EURUSD'
            ? {
                indicators: '/api/eurusd-indicators',
                pivots: '/api/eurusd-pivots',
                mtf: '/api/eurusd-mtf',
                keyLevels: '/api/eurusd-key-levels',
            }
            : {
                indicators: '/api/indicators-free',
                pivots: '/api/pivots',
                mtf: '/api/mtf',
                keyLevels: '/api/key-levels',
            };

        // Fetch ALL data sources in parallel
        const [indicatorsRes, pivotsRes, macroRes, calendarRes, newsRes, mtfRes, keyLevelsRes] = await Promise.all([
            fetch(`${base}${endpoints.indicators}`),
            fetch(`${base}${endpoints.pivots}`),
            fetch(`${base}/api/macro`),
            fetch(`${base}/api/calendar`),
            fetch(`${base}/api/news`),
            fetch(`${base}${endpoints.mtf}`),
            fetch(`${base}${endpoints.keyLevels}`),
        ]);

        const [indicatorsJson, pivotsJson, macroJson, calendarJson, newsJson, mtfJson, keyLevelsJson] = await Promise.all([
            indicatorsRes.json().catch(() => ({})),
            pivotsRes.json().catch(() => ({})),
            macroRes.json().catch(() => ({})),
            calendarRes.json().catch(() => ({ events: [] })),
            newsRes.json().catch(() => ({ articles: [] })),
            mtfRes.json().catch(() => ({})),
            keyLevelsRes.json().catch(() => ({})),
        ]);

        const indicators: IndicatorsData = {
            price: indicatorsJson?.price,
            rsi: indicatorsJson?.rsi,
            ema20: indicatorsJson?.ema20,
            ema50: indicatorsJson?.ema50,
            trend: indicatorsJson?.trend,
            priceChange: indicatorsJson?.priceChange,
            priceChangePercent: indicatorsJson?.priceChangePercent,
            dayHigh: indicatorsJson?.dayHigh,
            dayLow: indicatorsJson?.dayLow,
        };

        const pivots: PivotData = {
            pivots: pivotsJson?.pivots,
            atr: pivotsJson?.atr,
            pricePosition: pivotsJson?.pricePosition,
            rangeAnalysis: pivotsJson?.rangeAnalysis,
        };

        const macro: MacroData = {
            us10yYield: macroJson?.us10yYield,
            usInflation: macroJson?.usInflation,
            japanInflation: macroJson?.japanInflation,
        };

        const calendar: CalendarEvent[] = Array.isArray(calendarJson?.events)
            ? calendarJson.events
            : [];

        // Handle news - now a flat articles array
        const headlines: Headline[] = Array.isArray(newsJson?.articles)
            ? newsJson.articles.slice(0, 10).map((h: { title?: string; description?: string; source?: string }) => ({
                title: h.title ?? '',
                description: h.description ?? '',
                source: h.source ?? '',
            }))
            : [];

        const mtf: MTFData = {
            timeframes: mtfJson?.timeframes,
            alignment: mtfJson?.alignment,
        };

        const keyLevels: KeyLevelsData = {
            previousDay: keyLevelsJson?.previousDay,
            currentPrice: keyLevelsJson?.currentPrice,
            priceVsPDC: keyLevelsJson?.priceVsPDC,
            activeSession: keyLevelsJson?.activeSession,
        };

        const prompt = buildDetailedPrompt(indicators, pivots, macro, calendar, headlines, mtf, keyLevels, pairLabel);
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

            if (cachedEntry) {
                return NextResponse.json({
                    ...cachedEntry.data,
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
            const cachedEntry = summaryCache[symbol];
            if (cachedEntry) {
                return NextResponse.json({
                    ...cachedEntry.data,
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
            if (cachedEntry) {
                return NextResponse.json({
                    ...cachedEntry.data,
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
            if (cachedEntry) {
                return NextResponse.json({
                    ...cachedEntry.data,
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
        summaryCache[symbol] = {
            data: output,
            timestamp: now,
        };

        return NextResponse.json({
            ...output,
            cached: false,
        });

    } catch (error) {
        console.error('AI summary route error:', error);

        const url = new URL(request.url);
        const symbolParam = (url.searchParams.get('symbol') || 'USDJPY').toUpperCase().trim();
        const symbol = symbolParam === 'EURUSD' ? 'EURUSD' : 'USDJPY';
        const cachedEntry = summaryCache[symbol];

        if (cachedEntry) {
            return NextResponse.json({
                ...cachedEntry.data,
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
