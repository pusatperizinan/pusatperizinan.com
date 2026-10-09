import { beforeAll, describe, expect, test } from "bun:test";
import { exportWordPressContent, escapeHtml, type WordPressRecord } from "./wordpress-content";
import { ALL_SERVICE_PAGES } from "../src/lib/catalog";
import { BLOG_ARTICLES } from "../src/lib/blog-content";
import { ALL_SEO_PAGES } from "../src/lib/seo-pages";
import { classifyPage } from "../src/lib/seo-policy";

let result: ReturnType<typeof exportWordPressContent>;
let pages: Map<string, WordPressRecord>;
beforeAll(() => {
  result = exportWordPressContent();
  pages = new Map(result.records.map((v) => [v.path, v]));
});

describe("WordPress migration coverage", () => {
  test("keeps every current sitemap URL without duplicates", () => {
    expect(result.sourcePaths.length).toBeGreaterThan(9000);
    expect(pages.size).toBe(result.records.length);
    for (const path of result.sourcePaths) expect(pages.has(path)).toBe(true);
  });
  test("preserves service narratives, requirements, and indexing decisions", () => {
    for (const source of ALL_SERVICE_PAGES) {
      const page = pages.get(`/layanan/${source.slug}`)!;
      expect(page.content).toContain(escapeHtml(source.intro));
      for (const paragraph of source.longDesc) expect(page.content).toContain(escapeHtml(paragraph));
      for (const item of source.requirements) expect(page.content).toContain(escapeHtml(item));
      expect(page.index).toBe(classifyPage(source).index);
    }
  });
  test("exports complete articles, dates, and SEO expansion", () => {
    for (const source of BLOG_ARTICLES) {
      const page = pages.get(`/blog/${source.slug}`)!;
      expect(page.date).toBe(source.publishedAt);
      expect(page.modified).toBe(source.updatedAt);
      for (const section of source.sections) for (const text of section.paragraphs) expect(page.content).toContain(escapeHtml(text));
    }
    for (const source of ALL_SEO_PAGES) {
      const page = pages.get(`/${source.kind === "svc-industry" ? "industri" : source.kind}/${source.slug}`)!;
      expect(page.seoTitle).toBe(source.title);
      for (const text of source.intro) expect(page.content).toContain(escapeHtml(text));
    }
  });
  test("orders parents before children for native WordPress permalinks", () => {
    const seen = new Set<string>();
    for (const page of result.records) {
      const parent = page.path.slice(0, page.path.lastIndexOf("/"));
      if (parent) expect(seen.has(parent)).toBe(true);
      seen.add(page.path);
      expect(page.title.length).toBeGreaterThan(0);
      expect(page.content.length).toBeGreaterThan(0);
      expect(page.hash).toMatch(/^[a-f0-9]{64}$/);
    }
  });
  test("leaves no broken internal page links or old runtime requests", () => {
    for (const page of result.records) {
      for (const match of page.content.matchAll(/href="(\/[^"#?]*)(?:[?#][^"]*)?"/g)) expect(pages.has(match[1] || "/")).toBe(true);
      expect(page.content).not.toMatch(/fetch\(|\/api\/(chat|leads)|\.vercel\.app|<script\b|<iframe\b/);
    }
  });
  test("labels replaced AI functions honestly", () => {
    expect(pages.get("/roadmap")!.content).toContain("bukan pembuat roadmap AI otomatis");
    expect(pages.get("/cek-dokumen")!.content).toContain("bukan AI otomatis");
    expect(pages.get("/kontak")!.content).toContain("[pp_consultation]");
  });
});
