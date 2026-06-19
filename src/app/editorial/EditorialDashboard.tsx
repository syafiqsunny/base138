"use client";

import { useMemo, useState, useTransition } from "react";
import type { DashboardSnapshot } from "@/lib/news-harvester/repository";
import type { EditorialActionType, EditorialQueueItem } from "@/lib/news-harvester/types";

export function EditorialDashboard({ snapshot }: { snapshot: DashboardSnapshot }) {
  const [items, setItems] = useState(snapshot.queue);
  const [isPending, startTransition] = useTransition();

  return (
    <>
      {snapshot.sampleMode ? (
        <div className="sample-banner">
          SAMPLE DATA MODE - Supabase belum dikonfigurasi. Semua item demonstrasi dilabel SAMPLE DATA dan bukan fakta sebenar.
        </div>
      ) : null}

      <StatsGrid stats={snapshot.stats} />

      <section className="panel" style={{ marginBottom: 18 }}>
        <p className="eyebrow">Editorial Review Queue</p>
        <h2>Menunggu semakan editor</h2>
        <p className="muted">
          Artikel yang dituai tidak diterbitkan secara automatik. Editor mesti approve, reject, merge, assign reporter atau blacklist source.
        </p>
      </section>

      <div className="queue">
        {items.map((item) => (
          <QueueCard
            key={item.id}
            item={item}
            disabled={isPending}
            onAction={(action, payload) =>
              startTransition(async () => {
                await submitAction(item, action, payload);
                setItems((current) => current.filter((candidate) => candidate.id !== item.id));
              })
            }
          />
        ))}
        {items.length === 0 ? <div className="panel muted">Tiada item pending review.</div> : null}
      </div>
    </>
  );
}

function StatsGrid({ stats }: { stats: DashboardSnapshot["stats"] }) {
  return (
    <div className="grid stats-grid">
      <StatsPanel title="Mengikut negeri" rows={stats.byState} />
      <StatsPanel title="Mengikut DUN" rows={stats.byDun} />
      <StatsPanel title="Mengikut parti" rows={stats.byParty} />
      <StatsPanel title="Mengikut isu" rows={stats.byIssue} />
    </div>
  );
}

function StatsPanel({ title, rows }: { title: string; rows: Array<{ label: string; count: number }> }) {
  return (
    <section className="panel">
      <h3>{title}</h3>
      {rows.slice(0, 6).map((row) => (
        <div className="stat-row" key={row.label}>
          <span>{row.label}</span>
          <strong>{row.count}</strong>
        </div>
      ))}
      {rows.length === 0 ? <p className="muted">Belum ada data.</p> : null}
    </section>
  );
}

function QueueCard({
  item,
  disabled,
  onAction
}: {
  item: EditorialQueueItem;
  disabled: boolean;
  onAction: (action: EditorialActionType, payload?: Record<string, string>) => void;
}) {
  const [reporterId, setReporterId] = useState("");
  const [targetClusterKey, setTargetClusterKey] = useState(item.clusterKey);
  const published = useMemo(() => (item.publishedAt ? new Date(item.publishedAt).toLocaleString("ms-MY") : "Tarikh tidak diketahui"), [item.publishedAt]);

  return (
    <article className="queue-card">
      <div className="queue-head">
        <div>
          <p className="eyebrow">{item.sourceType}</p>
          <h2>{item.title}</h2>
          <p className="muted">
            {item.sourceName} · {published}
          </p>
        </div>
        <a className="button" href={item.originalUrl} target="_blank" rel="noreferrer">
          Sumber asal
        </a>
      </div>

      <div className="meta">
        <span className="badge">{item.state}</span>
        {item.dun ? <span className="badge">DUN: {item.dun}</span> : null}
        {item.party ? <span className="badge">Parti: {item.party}</span> : null}
        {item.leader ? <span className="badge">Pemimpin: {item.leader}</span> : null}
        {item.issue ? <span className="badge">Isu: {item.issue}</span> : null}
      </div>

      <p>{item.aiSummary}</p>

      <div className="scores">
        <span className="score">
          Relevance <strong>{item.relevanceScore}</strong>
        </span>
        <span className="score">
          Credibility <strong>{item.sourceCredibilityScore}</strong>
        </span>
        <span className="score">
          Urgency <strong>{item.urgencyScore}</strong>
        </span>
        <span className="score">Cluster {item.clusterKey}</span>
      </div>

      <div className="actions">
        <button className="button approve" disabled={disabled} onClick={() => onAction("approve", { note: "Approved for editorial workflow only." })}>
          Approve
        </button>
        <button className="button reject" disabled={disabled} onClick={() => onAction("reject", { note: "Rejected by editor." })}>
          Reject
        </button>
        <input className="inline-input" value={targetClusterKey} onChange={(event) => setTargetClusterKey(event.target.value)} aria-label="Target cluster key" />
        <button className="button merge" disabled={disabled} onClick={() => onAction("merge", { targetClusterKey, note: "Merged by editor." })}>
          Merge
        </button>
        <input className="inline-input" placeholder="Reporter ID" value={reporterId} onChange={(event) => setReporterId(event.target.value)} aria-label="Reporter ID" />
        <button className="button" disabled={disabled || !reporterId} onClick={() => onAction("assign_reporter", { reporterId, note: "Assigned by editor." })}>
          Assign reporter
        </button>
        <button
          className="button blacklist"
          disabled={disabled}
          onClick={() => onAction("blacklist_source", { sourceUrl: item.originalUrl, reason: "Blacklisted from review queue." })}
        >
          Blacklist source
        </button>
      </div>
    </article>
  );
}

async function submitAction(item: EditorialQueueItem, action: EditorialActionType, payload: Record<string, string> = {}) {
  const response = await fetch("/api/news-harvester/editorial/actions", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      queueId: item.id,
      action,
      editorId: "sample-editor",
      ...payload
    })
  });

  if (!response.ok) {
    throw new Error(`Editorial action failed: ${response.status}`);
  }
}
