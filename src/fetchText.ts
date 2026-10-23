export async function fetchText(url: string): Promise<{ text: string } | { error: string }> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      return { error: `Could not fetch ${url}: ${response.status} ${response.statusText}` };
    }
    return { text: await response.text() };
  } catch {
    return {
      error: `Could not fetch ${url}. The browser blocked the request, often because the server does not allow this page to read it (CORS).`,
    };
  }
}
