import { buildClusterKey, canonicalizeUrl, contentHash, tokenSet } from "./normalization";
import type { ClassifiedArticle, DeduplicationMatch, HarvestedArticleInput } from "./types";

export function classifyForDedup(
  article: HarvestedArticleInput,
  aiSummary: string,
  labels: ClassifiedArticle["labels"],
  relevanceScore: number,
  sourceCredibilityScore: number,
  urgencyScore: number
): ClassifiedArticle {
  const canonicalUrl = canonicalizeUrl(article.originalUrl);
  return {
    ...article,
    canonicalUrl,
    contentHash: contentHash([article.title, canonicalUrl, article.publishedAt]),
    aiSummary,
    relevanceScore,
    sourceCredibilityScore,
    urgencyScore,
    clusterKey: buildClusterKey(article.title, article.publishedAt),
    labels
  };
}

export function findDuplicateCluster(
  article: Pick<ClassifiedArticle, "title" | "clusterKey" | "canonicalUrl">,
  existing: Array<{ clusterKey: string; title: string; canonicalUrl?: string | null }>
): DeduplicationMatch | null {
  const exactUrl = existing.find((candidate) => candidate.canonicalUrl === article.canonicalUrl);
  if (exactUrl) {
    return { clusterKey: exactUrl.clusterKey, similarity: 1, reason: "canonical_url_match" };
  }

  const sameKey = existing.find((candidate) => candidate.clusterKey === article.clusterKey);
  if (sameKey) {
    return { clusterKey: sameKey.clusterKey, similarity: 0.95, reason: "cluster_key_match" };
  }

  let best: DeduplicationMatch | null = null;
  for (const candidate of existing) {
    const similarity = jaccard(article.title, candidate.title);
    if (similarity >= 0.72 && (!best || similarity > best.similarity)) {
      best = {
        clusterKey: candidate.clusterKey,
        similarity,
        reason: "title_token_similarity"
      };
    }
  }

  return best;
}

export function jaccard(left: string, right: string): number {
  const a = tokenSet(left);
  const b = tokenSet(right);
  const intersection = [...a].filter((token) => b.has(token)).length;
  const union = new Set([...a, ...b]).size;
  return union === 0 ? 0 : intersection / union;
}
