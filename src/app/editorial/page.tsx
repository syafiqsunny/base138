import { EditorialDashboard } from "./EditorialDashboard";
import { getDashboardSnapshot } from "@/lib/news-harvester/repository";

export const dynamic = "force-dynamic";

export default async function EditorialPage() {
  const snapshot = await getDashboardSnapshot();

  return (
    <main className="shell">
      <section className="hero">
        <p className="eyebrow">PetaKuasa News Harvester</p>
        <h1>Political news monitoring & editorial review</h1>
        <p className="muted">
          RSS diluluskan, Google Programmable Search, NewsAPI dan GDELT dihantar ke queue editor dengan deduplication, klasifikasi, skor dan audit trail.
        </p>
      </section>
      <EditorialDashboard snapshot={snapshot} />
    </main>
  );
}
