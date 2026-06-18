import RSSParser from "rss-parser";
import { checkRobotsPermission } from "./robots";
import type { HarvestQuery, HarvestedArticleInput, NewsSource } from "./types";

const rssParser = new RSSParser();

type FetchOptions = {
  retries?: number;
  retryDelayMs?: number;
};

export async function fetchFromSource(source: NewsSource, queries: HarvestQuery[]): Promise<HarvestedArticleInput[]> {
  if (!source.approved) return [];

  if (source.type === "rss") {
    return fetchRss(source);
  }

  if (source.type === "google_cse") {
    return fetchGoogleProgrammableSearch(source, queries);
  }

  if (source.type === "newsapi") {
    return fetchNewsApi(source, queries);
  }

  if (source.type === "gdelt") {
    return fetchGdelt(source, queries);
  }

  return [];
}

async function fetchRss(source: NewsSource): Promise<HarvestedArticleInput[]> {
  const permission = await checkRobotsPermission(source.url);
  if (!permission.allowed) {
    throw new Error(`RSS feed blocked by robots.txt: ${permission.reason}`);
  }

  const feed = await rssParser.parseURL(source.url);
  return (feed.items ?? []).slice(0, 30).map((item) => ({
    title: safeTitle(item.title),
    sourceName: source.name,
    sourceType: "rss",
    sourceUrl: source.url,
    originalUrl: item.link ?? source.url,
    publishedAt: item.isoDate ?? item.pubDate ?? null,
    summary: item.contentSnippet ?? item.summary ?? null,
    snippet: item.contentSnippet ?? null,
    attribution: `Metadata RSS daripada ${source.name}. Pautan asal dikekalkan.`,
    imagePermissionStatus: "not_requested"
  }));
}

async function fetchGoogleProgrammableSearch(source: NewsSource, queries: HarvestQuery[]): Promise<HarvestedArticleInput[]> {
  const key = process.env.GOOGLE_PROGRAMMABLE_SEARCH_API_KEY;
  const cx = process.env.GOOGLE_PROGRAMMABLE_SEARCH_ENGINE_ID;
  if (!key || !cx) return [];

  const results = await Promise.all(
    queries.slice(0, 20).map(async (query) => {
      const url = new URL("https://www.googleapis.com/customsearch/v1");
      url.searchParams.set("key", key);
      url.searchParams.set("cx", cx);
      url.searchParams.set("q", query.keyword);
      url.searchParams.set("num", "5");
      url.searchParams.set("safe", "active");
      const json = await fetchJsonWithRetry<GoogleCseResponse>(url.toString());
      return (json.items ?? []).map((item) => ({
        title: safeTitle(item.title),
        sourceName: item.displayLink || source.name,
        sourceType: "google_cse" as const,
        sourceUrl: item.displayLink ? `https://${item.displayLink}` : source.url,
        originalUrl: item.link,
        publishedAt: null,
        summary: item.snippet,
        snippet: item.snippet,
        state: query.state,
        dun: query.dun,
        party: query.party,
        leader: query.leader,
        issue: query.issue,
        attribution: `Google Programmable Search result. Original source link retained: ${item.displayLink || item.link}.`,
        imagePermissionStatus: "not_requested" as const
      }));
    })
  );

  return results.flat();
}

async function fetchNewsApi(source: NewsSource, queries: HarvestQuery[]): Promise<HarvestedArticleInput[]> {
  const key = process.env.NEWSAPI_KEY;
  if (!key) return [];

  const results = await Promise.all(
    queries.slice(0, 20).map(async (query) => {
      const url = new URL("https://newsapi.org/v2/everything");
      url.searchParams.set("apiKey", key);
      url.searchParams.set("q", query.keyword);
      url.searchParams.set("language", "en");
      url.searchParams.set("pageSize", "10");
      url.searchParams.set("sortBy", "publishedAt");
      const json = await fetchJsonWithRetry<NewsApiResponse>(url.toString());
      return (json.articles ?? []).map((item) => ({
        title: safeTitle(item.title),
        sourceName: item.source?.name || source.name,
        sourceType: "newsapi" as const,
        sourceUrl: source.url,
        originalUrl: item.url,
        publishedAt: item.publishedAt ?? null,
        summary: item.description,
        snippet: item.content ?? item.description,
        state: query.state,
        dun: query.dun,
        party: query.party,
        leader: query.leader,
        issue: query.issue,
        attribution: `NewsAPI metadata from ${item.source?.name || "source"}. Original URL retained.`,
        imagePermissionStatus: "not_requested" as const
      }));
    })
  );

  return results.flat();
}

async function fetchGdelt(source: NewsSource, queries: HarvestQuery[]): Promise<HarvestedArticleInput[]> {
  const results = await Promise.all(
    queries.slice(0, 20).map(async (query) => {
      const url = new URL("https://api.gdeltproject.org/api/v2/doc/doc");
      url.searchParams.set("query", query.keyword);
      url.searchParams.set("mode", "artlist");
      url.searchParams.set("format", "json");
      url.searchParams.set("maxrecords", "10");
      url.searchParams.set("sort", "hybridrel");
      const json = await fetchJsonWithRetry<GdeltResponse>(url.toString());
      return (json.articles ?? []).map((item) => ({
        title: safeTitle(item.title),
        sourceName: item.sourceCountry ? `GDELT ${item.sourceCountry}` : source.name,
        sourceType: "gdelt" as const,
        sourceUrl: item.domain ? `https://${item.domain}` : source.url,
        originalUrl: item.url,
        publishedAt: item.seendate ?? null,
        summary: item.title,
        snippet: item.title,
        state: query.state,
        dun: query.dun,
        party: query.party,
        leader: query.leader,
        issue: query.issue,
        attribution: `GDELT monitoring metadata. Original source URL retained.`,
        imagePermissionStatus: "not_requested" as const
      }));
    })
  );

  return results.flat();
}

async function fetchJsonWithRetry<T>(url: string, options: FetchOptions = {}): Promise<T> {
  const retries = options.retries ?? 3;
  const retryDelayMs = options.retryDelayMs ?? 500;
  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: {
          "user-agent": "PetaKuasaNewsHarvester/0.1 (+editorial review only)"
        }
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status} ${response.statusText}`);
      }
      return (await response.json()) as T;
    } catch (error) {
      lastError = error;
      if (attempt < retries) {
        await new Promise((resolve) => setTimeout(resolve, retryDelayMs * 2 ** attempt));
      }
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Unknown fetch failure");
}

function safeTitle(title: string | undefined | null): string {
  return title?.trim() || "Untitled source result";
}

type GoogleCseResponse = {
  items?: Array<{
    title?: string;
    link: string;
    snippet?: string;
    displayLink?: string;
  }>;
};

type NewsApiResponse = {
  articles?: Array<{
    title?: string;
    url: string;
    publishedAt?: string;
    description?: string | null;
    content?: string | null;
    source?: { name?: string | null };
  }>;
};

type GdeltResponse = {
  articles?: Array<{
    title?: string;
    url: string;
    seendate?: string;
    domain?: string;
    sourceCountry?: string;
  }>;
};
