import { differenceInHours, parseISO } from "date-fns";
import { JOHOR_DUN, NEGERI_SEMBILAN_DUN, PARTY_KEYWORDS } from "./keywords";
import { normalizeText } from "./normalization";
import type { HarvestedArticleInput, NewsSource } from "./types";

const URGENCY_TERMS = [
  "breaking",
  "terkini",
  "segera",
  "rasmi",
  "sidang media",
  "spr",
  "mahkamah",
  "banjir",
  "krisis",
  "letak jawatan"
];

export function scoreRelevance(article: HarvestedArticleInput): number {
  const text = normalizeText([article.title, article.summary, article.snippet].filter(Boolean).join(" "));
  let score = 25;

  if (text.includes("politik") || text.includes("kerajaan") || text.includes("dun")) score += 20;
  if (text.includes("johor") || text.includes("negeri sembilan") || text.includes("malaysia")) score += 15;
  if ([...JOHOR_DUN, ...NEGERI_SEMBILAN_DUN].some((dun) => text.includes(normalizeText(dun)))) score += 20;
  if (PARTY_KEYWORDS.some((party) => text.includes(normalizeText(party)))) score += 15;
  if (article.issue || article.party || article.leader || article.dun) score += 10;

  return clamp(score);
}

export function scoreSourceCredibility(source?: Pick<NewsSource, "credibilityScore"> | null): number {
  if (!source) return 50;
  return clamp(Math.round(source.credibilityScore));
}

export function scoreUrgency(article: HarvestedArticleInput): number {
  const text = normalizeText([article.title, article.summary, article.snippet].filter(Boolean).join(" "));
  let score = URGENCY_TERMS.some((term) => text.includes(normalizeText(term))) ? 55 : 25;

  if (article.publishedAt) {
    const published = parseISO(article.publishedAt);
    const hours = Number.isNaN(published.getTime()) ? 999 : differenceInHours(new Date(), published);
    if (hours <= 6) score += 30;
    else if (hours <= 24) score += 20;
    else if (hours <= 72) score += 10;
  }

  return clamp(score);
}

function clamp(value: number): number {
  return Math.max(0, Math.min(100, value));
}
