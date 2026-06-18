import { postgresAdapter } from "@payloadcms/db-postgres";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import { buildConfig } from "payload";

export default buildConfig({
  admin: {
    user: "users",
    meta: {
      titleSuffix: "- PetaKuasa News Harvester"
    }
  },
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || "development-only-payload-secret",
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URI
    }
  }),
  collections: [
    {
      slug: "users",
      auth: true,
      admin: { useAsTitle: "email" },
      fields: [
        {
          name: "role",
          type: "select",
          defaultValue: "editor",
          options: ["admin", "editor", "reporter"]
        }
      ]
    },
    {
      slug: "news-sources",
      admin: { useAsTitle: "name" },
      fields: [
        { name: "name", type: "text", required: true },
        {
          name: "type",
          type: "select",
          required: true,
          options: ["rss", "google_cse", "newsapi", "gdelt"]
        },
        { name: "url", type: "text", required: true, unique: true },
        { name: "approved", type: "checkbox", defaultValue: false },
        { name: "credibilityScore", type: "number", min: 0, max: 100, defaultValue: 50 },
        { name: "permissionsNote", type: "textarea" },
        { name: "robotsAllowed", type: "checkbox" },
        { name: "robotsLastCheckedAt", type: "date" }
      ]
    },
    {
      slug: "harvested-articles",
      admin: { useAsTitle: "title" },
      fields: [
        { name: "title", type: "text", required: true },
        { name: "sourceName", type: "text", required: true },
        { name: "sourceType", type: "select", required: true, options: ["rss", "google_cse", "newsapi", "gdelt"] },
        { name: "originalUrl", type: "text", required: true },
        { name: "publishedAt", type: "date" },
        { name: "aiSummary", type: "textarea", required: true },
        { name: "state", type: "text" },
        { name: "dun", type: "text" },
        { name: "party", type: "text" },
        { name: "leader", type: "text" },
        { name: "issue", type: "text" },
        { name: "attribution", type: "textarea", required: true },
        { name: "imagePermissionStatus", type: "select", options: ["not_requested", "forbidden", "licensed"], defaultValue: "not_requested" },
        { name: "relevanceScore", type: "number", min: 0, max: 100 },
        { name: "sourceCredibilityScore", type: "number", min: 0, max: 100 },
        { name: "urgencyScore", type: "number", min: 0, max: 100 },
        { name: "clusterKey", type: "text", required: true },
        { name: "editorialStatus", type: "select", options: ["pending_review", "approved", "rejected", "merged", "assigned"], defaultValue: "pending_review" }
      ]
    },
    {
      slug: "editorial-queue",
      admin: { useAsTitle: "status" },
      fields: [
        { name: "articleId", type: "text", required: true },
        { name: "status", type: "select", options: ["pending_review", "approved", "rejected", "merged", "assigned"], defaultValue: "pending_review" },
        { name: "priorityScore", type: "number", min: 0, max: 100 },
        { name: "assignedReporterId", type: "text" },
        { name: "reviewedBy", type: "text" },
        { name: "reviewedAt", type: "date" }
      ]
    },
    {
      slug: "article-clusters",
      admin: { useAsTitle: "representativeTitle" },
      fields: [
        { name: "clusterKey", type: "text", required: true, unique: true },
        { name: "representativeTitle", type: "text", required: true },
        { name: "state", type: "text" },
        { name: "dun", type: "text" },
        { name: "party", type: "text" },
        { name: "leader", type: "text" },
        { name: "issue", type: "text" }
      ]
    },
    {
      slug: "editorial-audit-log",
      admin: { useAsTitle: "action" },
      fields: [
        { name: "queueId", type: "text" },
        { name: "articleId", type: "text" },
        { name: "action", type: "select", required: true, options: ["approve", "reject", "merge", "assign_reporter", "blacklist_source"] },
        { name: "editorId", type: "text", required: true },
        { name: "note", type: "textarea" },
        { name: "metadata", type: "json" }
      ]
    }
  ]
});
