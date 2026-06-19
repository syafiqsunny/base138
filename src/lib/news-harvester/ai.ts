import OpenAI from "openai";
import type { HarvestedArticleInput } from "./types";

let openai: OpenAI | null = null;

function getOpenAI(): OpenAI | null {
  if (!process.env.OPENAI_API_KEY) return null;
  openai ??= new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return openai;
}

export async function summarizeWithoutRepublishing(article: HarvestedArticleInput): Promise<string> {
  const sourceText = [article.title, article.summary, article.snippet].filter(Boolean).join("\n");

  if (!sourceText.trim()) {
    return "Ringkasan belum tersedia. Editor perlu menyemak pautan sumber asal.";
  }

  const client = getOpenAI();
  if (!client) {
    return fallbackSummary(article);
  }

  const completion = await client.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.2,
    max_tokens: 160,
    messages: [
      {
        role: "system",
        content:
          "Anda membantu editor membuat ringkasan pendek berita politik. Jangan salin artikel penuh, jangan reka fakta, dan kekalkan atribusi kepada sumber asal."
      },
      {
        role: "user",
        content: `Bina ringkasan Bahasa Melayu maksimum 80 patah perkataan berdasarkan metadata/snippet sahaja.\n\nSumber: ${article.sourceName}\nTajuk: ${article.title}\nSnippet/Ringkasan: ${sourceText}`
      }
    ]
  });

  return completion.choices[0]?.message.content?.trim() || fallbackSummary(article);
}

function fallbackSummary(article: HarvestedArticleInput): string {
  const snippet = article.summary || article.snippet || article.title;
  const shortSnippet = snippet.length > 260 ? `${snippet.slice(0, 257).trim()}...` : snippet;
  return `Ringkasan editorial berdasarkan metadata sumber: ${shortSnippet} Sila baca pautan asal untuk konteks penuh.`;
}
