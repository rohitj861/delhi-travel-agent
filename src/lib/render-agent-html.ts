/** Splits an agent reply into a plain-text summary and the HTML card markup. */
export function splitReply(raw: string): { summary: string; html: string } {
  const cleaned = raw.replace(/```html/gi, "").replace(/```/g, "").trim();
  const idx = cleaned.search(
    /<div\s+class="(card-grid|destination-card|restaurant-card|shopping-card)"/i,
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
    "https://www.swiggy.com/city/delhi/dineout",
    "https://www.makemytrip.com/hotels/new_delhi_and_ncr-hotels.html",
    "https://www.booking.com/city/in/new-delhi.html",
    "https://www.rome2rio.com/s/Delhi",
  ].map((u) => u.toLowerCase()),
);

function searchUrlFor(kind: string, name: string): string {
  const q = encodeURIComponent(`${name} Delhi NCR`);
  if (kind === "restaurant-card") return `https://www.zomato.com/ncr/restaurants?q=${q}`;
  if (kind === "shopping-card") return `https://lbb.in/delhi/search/?q=${encodeURIComponent(name)}`;
  return `https://www.google.com/search?q=${q}`;
}

/**
 * Replaces model-invented deep links (the usual 404 source) with either a known
 * stable landing page or a search URL built from the card's title.
 */
export function rewriteLinks(html: string): string {
  return html.replace(
    /<div\s+class="(destination-card|restaurant-card|shopping-card)"[\s\S]*?<\/div>/gi,
    (card, kind: string) => {
      const name = (card.match(/<h3[^>]*>([\s\S]*?)<\/h3>/i)?.[1] ?? "")
        .replace(/<[^>]*>/g, "")
        .trim();
      if (!name) return card;
      const fallback = searchUrlFor(kind.toLowerCase(), name);
      return card.replace(/href\s*=\s*("|')(.*?)\1/gi, (m, _q, url: string) => {
        const clean = String(url).trim();
        return STABLE_URLS.has(clean.toLowerCase().replace(/\/$/, "").concat(""))
          ? m
          : STABLE_URLS.has(clean.toLowerCase())
            ? m
            : `href="${fallback}"`;
      });
    },
  );
}
