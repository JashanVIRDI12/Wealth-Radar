import { NextRequest, NextResponse } from 'next/server';

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
// Free model on OpenRouter; override with OPENROUTER_MODEL in .env
const DEFAULT_MODEL = 'deepseek/deepseek-v3.2';

export type AIBiasOutput = {
    bias: 'bullish' | 'bearish' | 'neutral';
    confidence: 'high' | 'medium' | 'low';
    reasons: [string, string, string];
    risk: string;
};

function getBaseUrl(request: NextRequest): string {
    try {
        return new URL(request.url).origin;
    } catch {
        return process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000';
    }
}

function buildPrompt(price: number | null, macro: Record<string, unknown>, headlines: { title: string; source: string }[]): string {
    const macroStr = [
        macro.us10yYield != null && `US 10Y yield: ${macro.us10yYield}`,
        macro.usCPI != null && `US CPI: ${macro.usCPI}`,
        macro.japanCPI != null && `Japan CPI: ${macro.japanCPI}`,
    ].filter(Boolean).join('; ') || 'No macro data';
    const priceStr = price != null ? `USD/JPY price: ${price}` : 'No price';
    const newsStr = headlines.length
        ? headlines.map((h) => `- ${h.title} (${h.source})`).join('\n')
        : 'No headlines';
    return `You are a concise FX analyst for USD/JPY. Use ONLY the data below. Reply with a short, logical JSON object and nothing else.

Data:
${priceStr}
${macroStr}

Headlines:
${newsStr}

Respond with exactly this JSON (no markdown, no code block):
{"bias":"bullish"|"bearish"|"neutral","confidence":"high"|"medium"|"low","reasons":["reason1","reason2","reason3"],"risk":"one short sentence"}

Rules: bias = directional view on USD/JPY; reasons = exactly 3 short bullets; risk = one main risk; keep each reason and risk under 15 words.`;
}

/** Extract JSON object from text that may have thinking/reasoning before or markdown around it. */
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

function parseAIOutput(text: string): AIBiasOutput | null {
    const jsonStr = extractJson(text);
    if (!jsonStr) return null;
    try {
        const parsed = JSON.parse(jsonStr) as Record<string, unknown>;
        const bias = String(parsed.bias ?? 'neutral').toLowerCase().trim();
        const confidence = String(parsed.confidence ?? 'medium').toLowerCase().trim();
        let reasons = Array.isArray(parsed.reasons)
            ? (parsed.reasons as string[]).map((r) => String(r).trim()).filter(Boolean)
            : [];
        if (Array.isArray(parsed.reason)) {
            reasons = (parsed.reason as string[]).map((r) => String(r).trim()).filter(Boolean);
        }
        while (reasons.length < 3) reasons.push('—');
        const risk = typeof parsed.risk === 'string' ? parsed.risk.trim() : '';
        const validBias = ['bullish', 'bearish', 'neutral'].includes(bias) ? bias : 'neutral';
        const validConf = ['high', 'medium', 'low'].includes(confidence) ? confidence : 'medium';
        return {
            bias: validBias as AIBiasOutput['bias'],
            confidence: validConf as AIBiasOutput['confidence'],
            reasons: [reasons[0], reasons[1], reasons[2]],
            risk: risk || '—',
        };
    } catch {
        return null;
    }
}

export async function GET(request: NextRequest) {
    try {
        const apiKey = process.env.OPENROUTER_API_KEY;
        if (!apiKey) {
            return NextResponse.json(
                { error: 'OPENROUTER_API_KEY not configured. Add it to .env.local (get key at https://openrouter.ai/keys)' },
                { status: 500 }
            );
        }

        const base = getBaseUrl(request);
        const [priceRes, macroRes, newsRes] = await Promise.all([
            fetch(`${base}/api/price`),
            fetch(`${base}/api/macro`),
            fetch(`${base}/api/news`),
        ]);

        const [priceJson, macroJson, newsJson] = await Promise.all([
            priceRes.json().catch(() => ({})),
            macroRes.json().catch(() => ({})),
            newsRes.json().catch(() => ({})),
        ]);

        const price = typeof priceJson?.price === 'number' ? priceJson.price : null;
        const macro = {
            us10yYield: macroJson?.us10yYield ?? null,
            usCPI: macroJson?.usCPI ?? null,
            japanCPI: macroJson?.japanCPI ?? null,
        };
        const headlines = Array.isArray(newsJson?.headlines)
            ? newsJson.headlines.map((h: { title?: string; source?: string }) => ({
                title: h.title ?? '',
                source: h.source ?? '',
            }))
            : [];

        const prompt = buildPrompt(price, macro, headlines);
        const model = process.env.OPENROUTER_MODEL ?? DEFAULT_MODEL;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 60_000);

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
                max_tokens: 512,
            }),
            signal: controller.signal,
        }).finally(() => clearTimeout(timeoutId));

        if (!openRouterRes.ok) {
            const errBody = await openRouterRes.text();
            console.error('OpenRouter API error:', openRouterRes.status, errBody);
            let details = errBody.slice(0, 500);
            try {
                const errJson = JSON.parse(errBody) as { error?: { message?: string } };
                if (errJson?.error?.message) details = errJson.error.message;
            } catch {
                // keep raw slice
            }
            if (/data policy|privacy|free model publication/i.test(details)) {
                return NextResponse.json(
                    {
                        error: 'OpenRouter data policy',
                        details: 'Enable free models in your OpenRouter privacy settings: https://openrouter.ai/settings/privacy',
                    },
                    { status: 502 }
                );
            }
            return NextResponse.json(
                { error: 'OpenRouter request failed', details: details || `HTTP ${openRouterRes.status}` },
                { status: 502 }
            );
        }

        const openRouterJson = (await openRouterRes.json()) as {
            choices?: Array<{ message?: { content?: string | null } }>;
            error?: { message?: string };
        };
        if (openRouterJson?.error?.message) {
            return NextResponse.json(
                { error: 'OpenRouter error', details: openRouterJson.error.message },
                { status: 502 }
            );
        }
        const text = openRouterJson?.choices?.[0]?.message?.content?.trim() ?? '';
        if (!text) {
            return NextResponse.json(
                { error: 'AI returned no content', details: 'Model produced an empty response. Try another model or retry.' },
                { status: 502 }
            );
        }
        const output = parseAIOutput(text);
        if (!output) {
            return NextResponse.json(
                { error: 'Invalid AI response format', details: text.slice(0, 800) },
                { status: 502 }
            );
        }

        return NextResponse.json({
            ...output,
            meta: { price, macro, headlineCount: headlines.length },
        });
    } catch (error) {
        console.error('AI bias route error:', error);
        const message =
            error instanceof Error
                ? error.name === 'AbortError'
                    ? 'Request timed out (60s). Try again or use a faster model.'
                    : error.message
                : 'AI bias failed';
        return NextResponse.json(
            { error: 'AI bias failed', details: message },
            { status: 500 }
        );
    }
}
