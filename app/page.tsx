"use client";

import { useEffect, useMemo, useState } from 'react';

type Metadata = {
  url: string;
  title?: string;
  description?: string;
  image?: string;
  favicon?: string;
  error?: string;
};

const DEFAULT_URL = 'https://lovable.dev/projects/1b4afbf4-9a33-44c5-8729-12137c6bf0da';

export default function HomePage() {
  const [url, setUrl] = useState<string>(DEFAULT_URL);
  const [loading, setLoading] = useState<boolean>(false);
  const [data, setData] = useState<Metadata | null>(null);
  const isValid = useMemo(() => {
    try {
      // eslint-disable-next-line no-new
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }, [url]);

  useEffect(() => {
    void preview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function preview() {
    if (!isValid) return;
    setLoading(true);
    setData(null);
    try {
      const endpoint = `/api/metadata?url=${encodeURIComponent(url)}`;
      const res = await fetch(endpoint);
      const json = (await res.json()) as Metadata;
      setData(json);
    } catch (err) {
      setData({ url, error: 'Failed to fetch metadata' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Agentic Link Preview</h1>
        <p className="text-sm text-gray-600">Enter any URL to preview its metadata. Preloaded with your project link.</p>
      </header>

      <section className="flex flex-col sm:flex-row gap-3">
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://example.com"
          className="flex-1 rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-black focus:outline-none"
        />
        <button
          onClick={preview}
          disabled={!isValid || loading}
          className="rounded-md bg-black px-4 py-2 text-white disabled:bg-gray-300"
        >
          {loading ? 'Loading?' : 'Preview'}
        </button>
      </section>

      {data && (
        <article className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="p-4 md:p-6 space-y-3">
            <div className="flex items-center gap-2">
              {data.favicon && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={data.favicon} alt="favicon" className="h-5 w-5" />
              )}
              <a href={data.url} target="_blank" rel="noreferrer" className="truncate text-sm text-blue-600 hover:underline">
                {data.url}
              </a>
            </div>
            <h2 className="text-lg font-medium">
              {data.title || 'No title found'}
            </h2>
            <p className="text-sm text-gray-600">
              {data.description || 'No description available'}
            </p>
            {data.image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={data.image} alt="preview" className="mt-2 max-h-64 w-full rounded-md object-cover" />
            )}
            {data.error && (
              <p className="text-sm text-red-600">{data.error}</p>
            )}
          </div>
        </article>
      )}

      <footer className="text-xs text-gray-500">
        Works best with sites that provide Open Graph or standard meta tags.
      </footer>
    </main>
  );
}
