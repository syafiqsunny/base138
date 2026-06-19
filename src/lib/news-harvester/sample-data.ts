import type { EditorialQueueItem, NewsSource } from "./types";

export const SAMPLE_SOURCES: NewsSource[] = [
  {
    id: "sample-rss-1",
    name: "SAMPLE DATA - Portal Berita Diluluskan A",
    type: "rss",
    url: "https://example.com/sample-politics-rss.xml",
    approved: true,
    credibilityScore: 72,
    permissionsNote: "SAMPLE DATA - RSS metadata only; no image republication."
  },
  {
    id: "sample-google-cse",
    name: "SAMPLE DATA - Google Programmable Search",
    type: "google_cse",
    url: "https://www.googleapis.com/customsearch/v1",
    approved: true,
    credibilityScore: 65,
    permissionsNote: "SAMPLE DATA - search result metadata only."
  },
  {
    id: "sample-newsapi",
    name: "SAMPLE DATA - NewsAPI",
    type: "newsapi",
    url: "https://newsapi.org/v2/everything",
    approved: true,
    credibilityScore: 66,
    permissionsNote: "SAMPLE DATA - API metadata only."
  },
  {
    id: "sample-gdelt",
    name: "SAMPLE DATA - GDELT",
    type: "gdelt",
    url: "https://api.gdeltproject.org/api/v2/doc/doc",
    approved: true,
    credibilityScore: 61,
    permissionsNote: "SAMPLE DATA - monitoring metadata only."
  }
];

export const SAMPLE_QUEUE: EditorialQueueItem[] = [
  {
    id: "sample-queue-1",
    articleId: "sample-article-1",
    title: "SAMPLE DATA - Isu banjir dibincang dalam kempen setempat",
    sourceName: "SAMPLE DATA - Portal Berita Diluluskan A",
    sourceType: "rss",
    originalUrl: "https://example.com/sample-politics-story",
    publishedAt: "2026-06-18T00:00:00.000Z",
    aiSummary:
      "SAMPLE DATA - Ringkasan editorial menyatakan bahawa isu banjir disebut dalam konteks kempen setempat. Editor perlu menyemak pautan asal sebelum sebarang penerbitan.",
    state: "Johor",
    dun: "Kota Iskandar",
    party: "SAMPLE DATA - Parti A",
    leader: "SAMPLE DATA - Pemimpin Johor A",
    issue: "SAMPLE DATA - banjir",
    relevanceScore: 88,
    sourceCredibilityScore: 72,
    urgencyScore: 67,
    status: "pending_review",
    clusterKey: "sample-cluster-1"
  },
  {
    id: "sample-queue-2",
    articleId: "sample-article-2",
    title: "SAMPLE DATA - Debat pembangunan luar bandar menjadi tumpuan",
    sourceName: "SAMPLE DATA - NewsAPI",
    sourceType: "newsapi",
    originalUrl: "https://example.com/sample-ns-story",
    publishedAt: "2026-06-17T15:00:00.000Z",
    aiSummary:
      "SAMPLE DATA - Metadata sumber menggambarkan perbincangan pembangunan luar bandar. Kandungan ini menunggu semakan editor dan bukan fakta sebenar.",
    state: "Negeri Sembilan",
    dun: "Gemas",
    party: "SAMPLE DATA - Parti B",
    leader: "SAMPLE DATA - Pemimpin Negeri Sembilan A",
    issue: "SAMPLE DATA - pembangunan luar bandar",
    relevanceScore: 81,
    sourceCredibilityScore: 66,
    urgencyScore: 42,
    status: "pending_review",
    clusterKey: "sample-cluster-2"
  }
];

export const SAMPLE_STATS = {
  byState: [
    { label: "SAMPLE DATA - Johor", count: 18 },
    { label: "SAMPLE DATA - Negeri Sembilan", count: 11 },
    { label: "SAMPLE DATA - Malaysia", count: 9 }
  ],
  byDun: [
    { label: "SAMPLE DATA - Kota Iskandar", count: 6 },
    { label: "SAMPLE DATA - Gemas", count: 5 },
    { label: "SAMPLE DATA - Seremban Jaya", count: 4 }
  ],
  byParty: [
    { label: "SAMPLE DATA - Parti A", count: 10 },
    { label: "SAMPLE DATA - Parti B", count: 7 }
  ],
  byIssue: [
    { label: "SAMPLE DATA - banjir", count: 8 },
    { label: "SAMPLE DATA - pembangunan luar bandar", count: 6 }
  ]
};
