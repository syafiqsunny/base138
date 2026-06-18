export type MalaysianState = "Johor" | "Negeri Sembilan" | "Malaysia" | "Unknown";

export type SourceType = "rss" | "google_cse" | "newsapi" | "gdelt";

export type EditorialStatus =
  | "pending_review"
  | "approved"
  | "rejected"
  | "merged"
  | "assigned";

export type EditorialActionType =
  | "approve"
  | "reject"
  | "merge"
  | "assign_reporter"
  | "blacklist_source";

export type NewsSource = {
  id: string;
  name: string;
  type: SourceType;
  url: string;
  approved: boolean;
  credibilityScore: number;
  permissionsNote?: string | null;
};

export type HarvestQuery = {
  keyword: string;
  state?: MalaysianState;
  dun?: string;
  party?: string;
  leader?: string;
  issue?: string;
};

export type HarvestedArticleInput = {
  title: string;
  sourceName: string;
  sourceType: SourceType;
  sourceUrl?: string;
  originalUrl: string;
  publishedAt?: string | null;
  summary?: string | null;
  snippet?: string | null;
  state?: MalaysianState;
  dun?: string | null;
  party?: string | null;
  leader?: string | null;
  issue?: string | null;
  attribution: string;
  imagePermissionStatus?: "not_requested" | "forbidden" | "licensed";
};

export type ClassifiedArticle = HarvestedArticleInput & {
  canonicalUrl: string;
  contentHash: string;
  aiSummary: string;
  relevanceScore: number;
  sourceCredibilityScore: number;
  urgencyScore: number;
  clusterKey: string;
  labels: {
    state: MalaysianState;
    dun: string | null;
    party: string | null;
    leader: string | null;
    issue: string | null;
  };
};

export type DeduplicationMatch = {
  clusterKey: string;
  similarity: number;
  reason: string;
};

export type HarvestRunResult = {
  runId: string;
  startedAt: string;
  finishedAt: string;
  fetched: number;
  inserted: number;
  merged: number;
  failed: number;
  errors: Array<{ source: string; message: string }>;
};

export type EditorialQueueItem = {
  id: string;
  articleId: string;
  title: string;
  sourceName: string;
  sourceType: SourceType;
  originalUrl: string;
  publishedAt: string | null;
  aiSummary: string;
  state: MalaysianState;
  dun: string | null;
  party: string | null;
  leader: string | null;
  issue: string | null;
  relevanceScore: number;
  sourceCredibilityScore: number;
  urgencyScore: number;
  status: EditorialStatus;
  clusterKey: string;
};
