'use client';

import { useEffect, useState } from 'react';

type Headline = {
  title: string;
  source: string;
  url: string;
  publishedAt: string;
};

export default function NewsHeadlines() {
  const [headlines, setHeadlines] = useState<Headline[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/news')
      .then((res) => res.json())
      .then((data) => {
        if (data.error && !data.headlines) {
          setError(data.error);
          return;
        }
        setHeadlines(data.headlines ?? []);
      })
      .catch(() => setError('Failed to load news'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="text-zinc-500 text-sm animate-pulse">
        Loading headlines…
      </div>
    );
  }
  if (error) {
    return (
      <p className="text-zinc-500 text-sm" role="status">
        {error}
      </p>
    );
  }
  if (headlines.length === 0) {
    return (
      <p className="text-zinc-500 text-sm">No headlines right now.</p>
    );
  }

  return (
    <ul className="space-y-2" aria-label="Fed, BOJ, USD/JPY headlines">
      {headlines.map((h, i) => (
        <li key={`${h.url}-${i}`}>
          <a
            href={h.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block text-zinc-300 hover:text-zinc-50 text-sm leading-snug transition-colors"
          >
            {h.title}
          </a>
          <span className="text-zinc-600 text-xs">
            {h.source}
            {h.publishedAt && (
              <> · {new Date(h.publishedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</>
            )}
          </span>
        </li>
      ))}
    </ul>
  );
}
