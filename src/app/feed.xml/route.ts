import { BLOG_ARTICLES } from "@/lib/blog-content";
import { SITE_URL } from "@/lib/site";

// ============================================================
// PUSATPERIZINAN.COM — RSS 2.0 Feed untuk Blog
// Menambah jalur penemuan konten: RSS reader, IFTTT, Google News
// preparasi, dan agregator. Static-export friendly (force-static).
// ============================================================
export const dynamic = "force-static";
export const revalidate = 86400;

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function GET() {
  const items = BLOG_ARTICLES.map(
    (a) => `    <item>
      <title>${escapeXml(a.title)}</title>
      <link>${SITE_URL}/blog/${a.slug}</link>
      <guid isPermaLink="true">${SITE_URL}/blog/${a.slug}</guid>
      <description>${escapeXml(a.excerpt)}</description>
      <category>${escapeXml(a.category)}</category>
      <pubDate>${new Date(a.publishedAt).toUTCString()}</pubDate>
      <dc:creator>${escapeXml(a.author)}</dc:creator>
    </item>`
  ).join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Blog PusatPerizinan.com — Wawasan Perizinan Usaha</title>
    <link>${SITE_URL}/blog</link>
    <atom:link href="${SITE_URL}/feed.xml" rel="self" type="application/rss+xml" />
    <description>Artikel mendalam seputar perizinan usaha Indonesia: NIB, PT, PMA, halal, BPOM, PBG/SLF, pajak, PPIU/PPIH, dan lainnya — ditulis konsultan senior.</description>
    <language>id-ID</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
  });
}
