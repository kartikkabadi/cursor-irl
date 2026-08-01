export function extractCursorTokens(html: string): number | null {
  const match = html.match(/tokensOverTime\\?":\[(.*?)\]/s);
  if (!match) return null;
  const series = match[1].replaceAll('\\', '');
  const values = [...series.matchAll(/"date":"\d{4}-\d{2}-\d{2}","tokens":(\d+)/g)].map((entry) => Number(entry[1]));
  return values.length ? values.reduce((total, value) => total + value, 0) : null;
}

export async function fetchCursorTokens(handle: string): Promise<number | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  try {
    const response = await fetch(`https://cursor.com/@${encodeURIComponent(handle)}`, {
      headers: { accept: 'text/html', 'user-agent': 'Cursor-IRL public profile lookup' },
      signal: controller.signal,
    });
    if (!response.ok) return null;
    const html = await response.text();
    if (html.includes('NEXT_HTTP_ERROR_FALLBACK;404')) return null;
    return extractCursorTokens(html);
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
