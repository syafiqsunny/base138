import { summarizeWithoutRepublishing } from "./ai";
import { classifyForDedup, findDuplicateCluster } from "./dedup";
import { buildScheduledQueries } from "./keywords";
import { classifyArticle } from "./normalization";
import {
  createHarvestRun,
  finishHarvestRun,
  getApprovedSources,
  getRecentClusters,
  recordHarvestError,
  saveArticleToEditorialQueue
} from "./repository";
import { scoreRelevance, scoreSourceCredibility, scoreUrgency } from "./scoring";
import { fetchFromSource } from "./source-clients";
import type { HarvestRunResult, HarvestedArticleInput } from "./types";

export async function runNewsHarvest(): Promise<HarvestRunResult> {
  const startedAt = new Date().toISOString();
  const runId = await createHarvestRun();
  const sources = await getApprovedSources();
  const queries = buildScheduledQueries();
  const recentClusters = await getRecentClusters();
  const errors: HarvestRunResult["errors"] = [];
  let fetched = 0;
  let inserted = 0;
  let merged = 0;

  for (const source of sources) {
    try {
      const sourceResults = await fetchFromSource(source, queries);
      fetched += sourceResults.length;

      for (const rawArticle of sourceResults) {
        const labels = classifyArticle(rawArticle);
        const articleWithLabels: HarvestedArticleInput = {
          ...rawArticle,
          state: labels.state,
          dun: labels.dun,
          party: labels.party,
          leader: labels.leader,
          issue: labels.issue
        };
        const aiSummary = await summarizeWithoutRepublishing(articleWithLabels);
        const classified = classifyForDedup(
          articleWithLabels,
          aiSummary,
          labels,
          scoreRelevance(articleWithLabels),
          scoreSourceCredibility(source),
          scoreUrgency(articleWithLabels)
        );

        const duplicate = findDuplicateCluster(classified, recentClusters);
        const status = await saveArticleToEditorialQueue(classified, duplicate?.clusterKey);
        if (status === "merged") {
          merged += 1;
        } else {
          inserted += 1;
          recentClusters.push({
            clusterKey: classified.clusterKey,
            title: classified.title,
            canonicalUrl: classified.canonicalUrl
          });
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown source error";
      errors.push({ source: source.name, message });
      await recordHarvestError(runId, source.name, message);
    }
  }

  const result: HarvestRunResult = {
    runId,
    startedAt,
    finishedAt: new Date().toISOString(),
    fetched,
    inserted,
    merged,
    failed: errors.length,
    errors
  };

  await finishHarvestRun(result);
  return result;
}
