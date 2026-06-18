import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { SAMPLE_QUEUE, SAMPLE_SOURCES, SAMPLE_STATS } from "./sample-data";
import type {
  ClassifiedArticle,
  EditorialActionType,
  EditorialQueueItem,
  EditorialStatus,
  HarvestRunResult,
  NewsSource
} from "./types";

type StatsRow = { label: string; count: number };

export type DashboardSnapshot = {
  queue: EditorialQueueItem[];
  stats: {
    byState: StatsRow[];
    byDun: StatsRow[];
    byParty: StatsRow[];
    byIssue: StatsRow[];
  };
  sampleMode: boolean;
};

let supabase: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;

  supabase ??= createClient(url, key, {
    auth: { persistSession: false }
  });
  return supabase;
}

export async function getApprovedSources(): Promise<NewsSource[]> {
  const client = getSupabaseAdmin();
  if (!client) return SAMPLE_SOURCES;

  const { data, error } = await client.from("news_sources").select("*").eq("approved", true).order("name");
  if (error) throw error;

  return (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    type: row.type,
    url: row.url,
    approved: row.approved,
    credibilityScore: row.credibility_score,
    permissionsNote: row.permissions_note
  }));
}

export async function createHarvestRun(): Promise<string> {
  const client = getSupabaseAdmin();
  if (!client) return `sample-run-${Date.now()}`;

  const { data, error } = await client
    .from("harvester_runs")
    .insert({ status: "running", started_at: new Date().toISOString() })
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
}

export async function finishHarvestRun(result: HarvestRunResult): Promise<void> {
  const client = getSupabaseAdmin();
  if (!client) return;

  await client
    .from("harvester_runs")
    .update({
      status: result.failed > 0 ? "completed_with_errors" : "completed",
      finished_at: result.finishedAt,
      fetched_count: result.fetched,
      inserted_count: result.inserted,
      merged_count: result.merged,
      failed_count: result.failed
    })
    .eq("id", result.runId);
}

export async function recordHarvestError(runId: string, source: string, message: string): Promise<void> {
  const client = getSupabaseAdmin();
  if (!client) return;

  await client.from("harvester_run_errors").insert({ run_id: runId, source, message });
}

export async function getRecentClusters(): Promise<Array<{ clusterKey: string; title: string; canonicalUrl?: string | null }>> {
  const client = getSupabaseAdmin();
  if (!client) {
    return SAMPLE_QUEUE.map((item) => ({
      clusterKey: item.clusterKey,
      title: item.title,
      canonicalUrl: item.originalUrl
    }));
  }

  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await client
    .from("harvested_articles")
    .select("cluster_key,title,canonical_url")
    .gte("created_at", since)
    .limit(500);
  if (error) throw error;

  return (data ?? []).map((row) => ({
    clusterKey: row.cluster_key,
    title: row.title,
    canonicalUrl: row.canonical_url
  }));
}

export async function saveArticleToEditorialQueue(article: ClassifiedArticle, duplicateClusterKey?: string): Promise<"inserted" | "merged"> {
  const client = getSupabaseAdmin();
  if (!client) return duplicateClusterKey ? "merged" : "inserted";

  const clusterKey = duplicateClusterKey ?? article.clusterKey;
  const { data: existing } = await client
    .from("harvested_articles")
    .select("id")
    .or(`canonical_url.eq.${article.canonicalUrl},content_hash.eq.${article.contentHash}`)
    .maybeSingle();

  if (existing) {
    await client.from("article_cluster_members").upsert({
      cluster_key: clusterKey,
      article_id: existing.id,
      similarity_score: 1,
      match_reason: "existing_article"
    });
    return "merged";
  }

  await client.from("article_clusters").upsert({
    cluster_key: clusterKey,
    representative_title: article.title,
    state: article.labels.state,
    dun: article.labels.dun,
    party: article.labels.party,
    leader: article.labels.leader,
    issue: article.labels.issue,
    updated_at: new Date().toISOString()
  });

  const { data, error } = await client
    .from("harvested_articles")
    .insert({
      title: article.title,
      source_name: article.sourceName,
      source_type: article.sourceType,
      source_url: article.sourceUrl,
      original_url: article.originalUrl,
      canonical_url: article.canonicalUrl,
      published_at: article.publishedAt,
      summary: article.summary,
      snippet: article.snippet,
      ai_summary: article.aiSummary,
      state: article.labels.state,
      dun: article.labels.dun,
      party: article.labels.party,
      leader: article.labels.leader,
      issue: article.labels.issue,
      attribution: article.attribution,
      image_permission_status: article.imagePermissionStatus ?? "not_requested",
      relevance_score: article.relevanceScore,
      source_credibility_score: article.sourceCredibilityScore,
      urgency_score: article.urgencyScore,
      content_hash: article.contentHash,
      cluster_key: clusterKey,
      editorial_status: "pending_review"
    })
    .select("id")
    .single();

  if (error) throw error;

  await client.from("article_cluster_members").insert({
    cluster_key: clusterKey,
    article_id: data.id,
    similarity_score: duplicateClusterKey ? 0.8 : 1,
    match_reason: duplicateClusterKey ? "deduplication_engine" : "new_cluster"
  });

  await client.from("editorial_queue").insert({
    article_id: data.id,
    status: "pending_review",
    priority_score: Math.max(article.relevanceScore, article.urgencyScore)
  });

  return duplicateClusterKey ? "merged" : "inserted";
}

export async function getDashboardSnapshot(): Promise<DashboardSnapshot> {
  const client = getSupabaseAdmin();
  if (!client) {
    return { queue: SAMPLE_QUEUE, stats: SAMPLE_STATS, sampleMode: true };
  }

  const [{ data: queueData, error: queueError }, byState, byDun, byParty, byIssue] = await Promise.all([
    client
      .from("editorial_queue")
      .select(
        "id,status,article_id,harvested_articles(title,source_name,source_type,original_url,published_at,ai_summary,state,dun,party,leader,issue,relevance_score,source_credibility_score,urgency_score,cluster_key)"
      )
      .eq("status", "pending_review")
      .order("priority_score", { ascending: false })
      .limit(50),
    fetchStats("news_stats_by_state"),
    fetchStats("news_stats_by_dun"),
    fetchStats("news_stats_by_party"),
    fetchStats("news_stats_by_issue")
  ]);

  if (queueError) throw queueError;

  return {
    queue: (queueData ?? []).map((row) => {
      const article = Array.isArray(row.harvested_articles) ? row.harvested_articles[0] : row.harvested_articles;
      return {
        id: row.id,
        articleId: row.article_id,
        title: article.title,
        sourceName: article.source_name,
        sourceType: article.source_type,
        originalUrl: article.original_url,
        publishedAt: article.published_at,
        aiSummary: article.ai_summary,
        state: article.state,
        dun: article.dun,
        party: article.party,
        leader: article.leader,
        issue: article.issue,
        relevanceScore: article.relevance_score,
        sourceCredibilityScore: article.source_credibility_score,
        urgencyScore: article.urgency_score,
        status: row.status,
        clusterKey: article.cluster_key
      };
    }),
    stats: { byState, byDun, byParty, byIssue },
    sampleMode: false
  };
}

export async function applyEditorialAction(input: {
  queueId: string;
  action: EditorialActionType;
  editorId: string;
  note?: string;
  targetClusterKey?: string;
  reporterId?: string;
}): Promise<void> {
  const client = getSupabaseAdmin();
  if (!client) return;

  const statusByAction: Record<EditorialActionType, EditorialStatus> = {
    approve: "approved",
    reject: "rejected",
    merge: "merged",
    assign_reporter: "assigned",
    blacklist_source: "rejected"
  };

  const { data: queue, error } = await client.from("editorial_queue").select("article_id").eq("id", input.queueId).single();
  if (error) throw error;

  await client
    .from("editorial_queue")
    .update({
      status: statusByAction[input.action],
      assigned_reporter_id: input.reporterId ?? null,
      reviewed_at: new Date().toISOString(),
      reviewed_by: input.editorId
    })
    .eq("id", input.queueId);

  await client
    .from("harvested_articles")
    .update({ editorial_status: statusByAction[input.action] })
    .eq("id", queue.article_id);

  if (input.action === "merge" && input.targetClusterKey) {
    await client.from("article_cluster_members").upsert({
      cluster_key: input.targetClusterKey,
      article_id: queue.article_id,
      similarity_score: 1,
      match_reason: "editor_merge"
    });
  }

  await client.from("editorial_actions_audit").insert({
    queue_id: input.queueId,
    article_id: queue.article_id,
    action: input.action,
    editor_id: input.editorId,
    note: input.note,
    metadata: {
      targetClusterKey: input.targetClusterKey,
      reporterId: input.reporterId
    }
  });
}

export async function blacklistSource(input: { sourceUrl: string; editorId: string; reason: string }): Promise<void> {
  const client = getSupabaseAdmin();
  if (!client) return;

  await client.from("source_blacklist").upsert({
    source_url: input.sourceUrl,
    reason: input.reason,
    blacklisted_by: input.editorId,
    active: true
  });
}

async function fetchStats(viewName: string): Promise<StatsRow[]> {
  const client = getSupabaseAdmin();
  if (!client) return [];

  const { data, error } = await client.from(viewName).select("label,count").limit(20);
  if (error) throw error;
  return (data ?? []).map((row) => ({ label: row.label, count: row.count }));
}
