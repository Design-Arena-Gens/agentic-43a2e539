import { NextRequest } from 'next/server';

function parseMeta(html: string, url: URL) {
  const get = (pattern: RegExp): string | undefined => {
    const match = html.match(pattern);
    return match?.[1]?.trim();
  };

  const title = get(/<meta\s+property=["']og:title["']\s+content=["']([^"']+)["'][^>]*>/i)
    || get(/<meta\s+name=["']twitter:title["']\s+content=["']([^"']+)["'][^>]*>/i)
    || get(/<title>([^<]+)<\/title>/i);

  const description = get(/<meta\s+property=["']og:description["']\s+content=["']([^"']+)["'][^>]*>/i)
    || get(/<meta\s+name=["']description["']\s+content=["']([^"']+)["'][^>]*>/i)
    || get(/<meta\s+name=["']twitter:description["']\s+content=["']([^"']+)["'][^>]*>/i);

  const imageRaw = get(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["'][^>]*>/i)
    || get(/<meta\s+name=["']twitter:image["']\s+content=["']([^"']+)["'][^>]*>/i);

  let image: string | undefined = imageRaw;
  if (image && !/^https?:\/\//i.test(image)) {
    try {
      image = new URL(image, url.origin).toString();
    } catch {
      image = undefined;
    }
  }

  // favicon: prefer explicit, else default /favicon.ico
  const iconHref = get(/<link[^>]+rel=["'](?:shortcut )?icon["'][^>]*href=["']([^"']+)["'][^>]*>/i);
  let favicon = iconHref ? iconHref : '/favicon.ico';
  try {
    favicon = new URL(favicon, url.origin).toString();
  } catch {
    favicon = `${url.origin}/favicon.ico`;
  }

  return { title, description, image, favicon };
}

export async function GET(req: NextRequest) {
  const input = req.nextUrl.searchParams.get('url');
  if (!input) {
    return new Response(JSON.stringify({ error: 'Missing url parameter' }), { status: 400 });
  }

  let target: URL;
  try {
    target = new URL(input);
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid URL' }), { status: 400 });
  }

  const ac = new AbortController();
  const timeout = setTimeout(() => ac.abort(), 8000);
  try {
    const res = await fetch(target.toString(), {
      signal: ac.signal,
      // Disable caching for freshness; rely on platform edge cache if any
      cache: 'no-store',
      headers: {
        'user-agent': 'Mozilla/5.0 (compatible; AgenticPreview/1.0)'
      }
    });

    if (!res.ok) {
      return new Response(JSON.stringify({ url: target.toString(), error: `Upstream responded ${res.status}` }), { status: 200 });
    }

    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('text/html')) {
      return new Response(JSON.stringify({ url: target.toString(), error: 'Not an HTML page' }), { status: 200 });
    }

    const html = await res.text();
    const meta = parseMeta(html, target);
    return new Response(
      JSON.stringify({ url: target.toString(), ...meta }),
      { status: 200, headers: { 'content-type': 'application/json' } }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return new Response(JSON.stringify({ url: target.toString(), error: message }), { status: 200 });
  } finally {
    clearTimeout(timeout);
  }
}
