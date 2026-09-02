/** Splits an agent reply into a plain-text summary and the HTML card markup. */
export function splitReply(raw: string): { summary: string; html: string } {
  const cleaned = raw.replace(/```html/gi, "").replace(/```/g, "").trim();
  const idx = cleaned.search(
    /<div\s+class="(card-grid|destination-card|restaurant-card|shopping-card|itinerary-card|route-card)"/i,
  );
  if (idx === -1) return { summary: cleaned, html: "" };
  return { summary: cleaned.slice(0, idx).trim(), html: rewriteLinks(sanitize(cleaned.slice(idx))) };
}

/** Minimal sanitizer: drops scripts/iframes/styles and inline event handlers. */
export function sanitize(html: string): string {
  return html
    .replace(/<\s*(script|iframe|style|object|embed|link|meta)[\s\S]*?<\s*\/\s*\1\s*>/gi, "")
    .replace(/<\s*(script|iframe|style|object|embed|link|meta)[^>]*\/?>/gi, "")
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/(href|src)\s*=\s*("|')\s*javascript:[^"']*\2/gi, '$1="#"');
}

/** URLs known to resolve — deep links outside this list are replaced with searches. */
const STABLE_URLS = new Set(
  [
    "https://delhitourism.gov.in/dt/explore-the-city.html",
    "https://www.delhimetrorail.com",
    "https://www.delhimetrorail.com/",
    "https://lbb.in/delhi",
    "https://www.zomato.com/ncr",
    "https://www.google.com/maps/search/?api=1&query=hotels+in+delhi",
    "https://www.booking.com/city/in/new-delhi.html",
  ].map((u) => u.toLowerCase().replace(/\/$/, "")),
);

function searchUrlFor(kind: string, name: string, area: string): string {
  const place = [name, area, "Delhi NCR"].filter(Boolean).join(", ");
  // Google Maps place search resolves to the exact venue and never 404s.
  const maps = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place)}`;
  if (kind === "restaurant-card")
    return `https://www.zomato.com/ncr/restaurants?q=${encodeURIComponent(name)}`;
  if (kind === "shopping-card") return `https://lbb.in/delhi/search/?q=${encodeURIComponent(name)}`;
  return maps;
}

/** Splits the HTML into card chunks, tolerating nested <div>s inside a card. */
function splitCards(html: string): string[] {
  const starts: number[] = [];
  const re =
    /<div\s+class="(?:destination-card|restaurant-card|shopping-card|itinerary-card|route-card)"/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) starts.push(m.index);
  if (starts.length === 0) return [html];
  const chunks: string[] = [];
  if (starts[0]! > 0) chunks.push(html.slice(0, starts[0]));
  for (let i = 0; i < starts.length; i++)
    chunks.push(html.slice(starts[i]!, starts[i + 1] ?? html.length));
  return chunks;
}

/**
 * Replaces model-invented deep links (the usual 404 source) with either a known
 * stable landing page or a precise search URL built from the card's title/area.
 */
export function rewriteLinks(html: string): string {
  const rewritten = splitCards(html)
    .map((chunk) => {
      const kind = chunk
        .match(
          /^<div\s+class="(destination-card|restaurant-card|shopping-card|itinerary-card|route-card)"/i,
        )?.[1]
        ?.toLowerCase();
      if (!kind) return chunk;
      const text = (sel: RegExp) =>
        (chunk.match(sel)?.[1] ?? "").replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
      const name = text(/<h3[^>]*>([\s\S]*?)<\/h3>/i);
      if (!name) return chunk;
      const area = text(/<[^>]*class="[^"]*(?:area|metro|location)[^"]*"[^>]*>([\s\S]*?)<\//i);
      const fallback = searchUrlFor(kind, name, area);
      return chunk.replace(/href\s*=\s*("|')(.*?)\1/gi, (m2, _q, url: string) => {
        const clean = String(url).trim().toLowerCase().replace(/\/$/, "");
        return STABLE_URLS.has(clean) ? m2 : `href="${fallback}"`;
      });
    })
    .join("");

  // Open every card link in a new tab so external sites never replace the app.
  return rewritten.replace(/<a\b([^>]*)>/gi, (match, attrs: string) => {
    if (/\btarget\s*=/i.test(attrs)) return match;
    return `<a target="_blank" rel="noopener noreferrer"${attrs}>`;
  });
}
