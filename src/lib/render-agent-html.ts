/** Splits an agent reply into a plain-text summary and the HTML card markup. */
export function splitReply(raw: string): { summary: string; html: string } {
  const cleaned = raw.replace(/```html/gi, "").replace(/```/g, "").trim();
  const idx = cleaned.search(/<div\s+class="(card-grid|destination-card|restaurant-card|shopping-card)"/i);
  if (idx === -1) return { summary: cleaned, html: "" };
  return { summary: cleaned.slice(0, idx).trim(), html: sanitize(cleaned.slice(idx)) };
}

/** Minimal sanitizer: drops scripts/iframes/styles and inline event handlers. */
export function sanitize(html: string): string {
  return html
    .replace(/<\s*(script|iframe|style|object|embed|link|meta)[\s\S]*?<\s*\/\s*\1\s*>/gi, "")
    .replace(/<\s*(script|iframe|style|object|embed|link|meta)[^>]*\/?>/gi, "")
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/(href|src)\s*=\s*("|')\s*javascript:[^"']*\2/gi, '$1="#"');
}
