import { createHash } from "node:crypto";
import {
  ISSUE_KEYWORDS,
  JOHOR_DUN,
  LEADER_KEYWORDS,
  NEGERI_SEMBILAN_DUN,
  PARTY_KEYWORDS
} from "./keywords";
import type { ClassifiedArticle, HarvestedArticleInput, MalaysianState } from "./types";

const STOPWORDS = new Set([
  "dan",
  "yang",
  "untuk",
  "dengan",
  "dalam",
  "pada",
  "the",
  "a",
  "an",
  "of",
  "to",
  "in",
  "for",
  "is",
  "are"
]);

export function normalizeText(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/https?:\/\/\S+/g, " ")
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function canonicalizeUrl(value: string): string {
  try {
    const url = new URL(value);
    url.hash = "";
    for (const param of [...url.searchParams.keys()]) {
      if (/^(utm_|fbclid|gclid|mc_)/i.test(param)) {
        url.searchParams.delete(param);
      }
    }
    return url.toString();
  } catch {
    return value.trim();
  }
}

export function contentHash(parts: Array<string | null | undefined>): string {
  const normalized = parts.map((part) => normalizeText(part ?? "")).join("|");
  return createHash("sha256").update(normalized).digest("hex");
}

export function tokenSet(value: string): Set<string> {
  return new Set(
    normalizeText(value)
      .split(" ")
      .filter((token) => token.length > 2 && !STOPWORDS.has(token))
  );
}

export function buildClusterKey(title: string, publishedAt?: string | null): string {
  const tokens = [...tokenSet(title)].slice(0, 8).join("-");
  const date = publishedAt ? publishedAt.slice(0, 10) : "undated";
  return contentHash([tokens, date]).slice(0, 20);
}

function findKeyword(text: string, candidates: readonly string[]): string | null {
  const normalized = normalizeText(text);
  return candidates.find((candidate) => normalized.includes(normalizeText(candidate.replace("SAMPLE DATA - ", "")))) ?? null;
}

export function classifyArticle(input: HarvestedArticleInput): ClassifiedArticle["labels"] {
  const haystack = [input.title, input.summary, input.snippet, input.state, input.dun, input.party, input.leader, input.issue]
    .filter(Boolean)
    .join(" ");

  const johorDun = findKeyword(haystack, JOHOR_DUN);
  const nsDun = findKeyword(haystack, NEGERI_SEMBILAN_DUN);
  const state: MalaysianState =
    input.state && input.state !== "Unknown"
      ? input.state
      : johorDun
        ? "Johor"
        : nsDun
          ? "Negeri Sembilan"
          : normalizeText(haystack).includes("johor")
            ? "Johor"
            : normalizeText(haystack).includes("negeri sembilan")
              ? "Negeri Sembilan"
              : "Malaysia";

  return {
    state,
    dun: input.dun ?? johorDun ?? nsDun,
    party: input.party ?? findKeyword(haystack, PARTY_KEYWORDS),
    leader: input.leader ?? findKeyword(haystack, LEADER_KEYWORDS),
    issue: input.issue ?? findKeyword(haystack, ISSUE_KEYWORDS)
  };
}
