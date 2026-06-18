import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";

export const dynamic = "force-dynamic";

export default async function SupabaseDemoPage() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  // The starter example queries a `todos` table; this project does not have one,
  // so we read a real table to prove the SSR client (publishable key) works.
  const { data: sources, error } = await supabase
    .from("news_sources")
    .select("id,name,type,url,approved")
    .order("name");

  return (
    <main style={{ maxWidth: 720, margin: "40px auto", padding: "0 20px", fontFamily: "system-ui, sans-serif" }}>
      <h1>Supabase SSR demo</h1>
      <p>
        Data fetched server-side via <code>@supabase/ssr</code> (<code>@/utils/supabase/server</code>) using the
        publishable key.
      </p>
      {error ? (
        <p style={{ color: "crimson" }}>Error: {error.message}</p>
      ) : (
        <ul>
          {(sources ?? []).map((s) => (
            <li key={s.id}>
              <strong>{s.name}</strong> — {s.type} · {s.approved ? "approved" : "pending"} · {s.url}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
