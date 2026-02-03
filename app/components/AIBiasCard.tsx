'use client';

import { useState } from 'react';

type Bias = 'bullish' | 'bearish' | 'neutral';
type Confidence = 'high' | 'medium' | 'low';

type AIBiasResult = {
    bias: Bias;
    confidence: Confidence;
    reasons: [string, string, string];
    risk: string;
};

function biasLabel(b: Bias): string {
    if (b === 'bullish') return 'Bullish';
    if (b === 'bearish') return 'Bearish';
    return 'Neutral';
}

function biasColor(b: Bias): string {
    if (b === 'bullish') return 'text-emerald-400';
    if (b === 'bearish') return 'text-red-400';
    return 'text-amber-400';
}

function confidenceColor(c: Confidence): string {
    if (c === 'high') return 'text-emerald-400';
    if (c === 'medium') return 'text-amber-400';
    return 'text-zinc-400';
}

export default function AIBiasCard() {
    const [result, setResult] = useState<AIBiasResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function sendToAI() {
        setLoading(true);
        setError(null);
        setResult(null);
        try {
            const res = await fetch('/api/ai-bias');
            const data = await res.json();
            if (!res.ok) {
                const msg = data.details
                    ? `${data.error ?? 'Request failed'}: ${data.details}`
                    : (data.error || 'Request failed');
                setError(msg);
                return;
            }
            if (data.bias && Array.isArray(data.reasons) && data.reasons.length >= 3 && data.risk != null) {
                setResult({
                    bias: data.bias,
                    confidence: data.confidence ?? 'medium',
                    reasons: [data.reasons[0], data.reasons[1], data.reasons[2]],
                    risk: data.risk,
                });
            } else {
                setError('Invalid response format');
            }
        } catch {
            setError('Failed to get AI analysis');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="bg-zinc-900 rounded-2xl p-6 shadow-2xl border border-zinc-800">
            <div className="mb-3 flex items-center justify-between flex-wrap gap-2">
                <h2 className="text-lg font-semibold text-zinc-50">AI Bias</h2>
                <span className="text-xs text-zinc-600">
                    Price + macro + headlines → OpenRouter (free tier)
                </span>
            </div>

            <div className="mb-4">
                <button
                    type="button"
                    onClick={sendToAI}
                    disabled={loading}
                    className="px-4 py-2 rounded-lg bg-zinc-700 hover:bg-zinc-600 disabled:opacity-50 disabled:cursor-not-allowed text-zinc-100 font-medium transition-colors"
                >
                    {loading ? 'Sending…' : 'Send to AI'}
                </button>
            </div>

            {error && (
                <p className="text-sm text-red-400 mb-4" role="alert">
                    {error}
                </p>
            )}

            {result && (
                <div className="space-y-4 text-sm">
                    <div className="flex flex-wrap items-center gap-3">
                        <span className="text-zinc-500">Bias</span>
                        <span className={`font-semibold ${biasColor(result.bias)}`}>
                            {biasLabel(result.bias)}
                        </span>
                        <span className="text-zinc-500">·</span>
                        <span className="text-zinc-500">Confidence</span>
                        <span className={confidenceColor(result.confidence)}>
                            {result.confidence}
                        </span>
                    </div>
                    <div>
                        <div className="text-zinc-500 mb-1">Reasons</div>
                        <ul className="list-disc list-inside space-y-1 text-zinc-300">
                            {result.reasons.map((r, i) => (
                                <li key={i}>{r}</li>
                            ))}
                        </ul>
                    </div>
                    <div>
                        <div className="text-zinc-500 mb-1">Risk</div>
                        <p className="text-zinc-300">{result.risk}</p>
                    </div>
                </div>
            )}

            {!result && !loading && !error && (
                <p className="text-zinc-500 text-sm">
                    Combines cached price, macro data, and headlines. Click &quot;Send to AI&quot; for a short bias, confidence, 3 reasons, and 1 risk.
                </p>
            )}
        </div>
    );
}
