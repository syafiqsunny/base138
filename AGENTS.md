# AGENTS.md

## Cursor Cloud specific instructions

This branch contains the **PetaKuasa News Harvester** app: a Next.js 16 + React 19 + TypeScript 6 project using Payload CMS 3 and the Supabase JS client. (The repo also still contains a legacy standalone static file `index.html.html` from the `main` branch; it is unrelated to this app.)

Standard commands live in `package.json` and `README.md` — refer to those. Notes below are the non-obvious cloud caveats.

### Dependencies
- Dependencies install from the committed `package-lock.json` via `npm ci` (the cloud update script runs this automatically on startup, guarded so it is a no-op when `package.json` is absent, e.g. on `main`).
- Node 22 works fine for Next.js 16 / React 19.

### Build & typecheck (no env / DB required)
- `npm run typecheck` (`tsc --noEmit`) and `npm run build` (`next build`) both succeed **without any environment variables or a database connection**. Payload CMS and the Supabase client are lazily initialized, so the build does not touch `DATABASE_URI`/Supabase.

### Running the app
- `npm run dev` serves at `http://localhost:3000`. The root `/` 307-redirects to `/editorial` (the editorial review dashboard).
- With no `NEXT_PUBLIC_SUPABASE_URL` configured, the dashboard runs in **SAMPLE DATA MODE** (a yellow banner is shown) and is fully interactive against in-memory sample data — no Supabase/Postgres needed to demo the UI.
- For real data, copy `.env.example` to `.env.local` and fill in Supabase / `DATABASE_URI` / Payload / API-key values (see `README.md`), then load `supabase/schema.sql`.

### Live data & auto-update (harvester)
- **Runtime needs only `NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`.** The harvester worker and dashboard talk to Supabase over PostgREST (`client.from(...)` in `src/lib/news-harvester/repository.ts`); they do NOT use `DATABASE_URI`. `DATABASE_URI` is only used by Payload (`src/payload.config.ts`) and for loading the schema.
- **Create the tables first:** run `supabase/schema.sql` once (via `psql "$DATABASE_URI" -f supabase/schema.sql`, or paste it into the Supabase SQL Editor). It creates the enums + 10 tables + indexes used by the queue/stats.
- **`news_sources` starts EMPTY**, so a harvest fetches nothing until you insert at least one approved source. RSS sources need no API key (only a robots.txt check) — e.g. insert a row `{type:'rss', url:'https://www.freemalaysiatoday.com/feed/', approved:true}`. Google CSE / NewsAPI source types additionally need their API keys.
- **Trigger a harvest** either with `npm run harvest:once` (calls `runNewsHarvest()` directly, bypasses the cron secret) or `POST /api/news-harvester/cron` with header `x-cron-secret: $NEWS_HARVESTER_CRON_SECRET`. Scheduled auto-update is wired via Vercel Cron in `vercel.json` (hourly) hitting that endpoint, or via the n8n workflow.
- **Invalid `OPENAI_API_KEY` breaks harvests:** if `OPENAI_API_KEY` is set but not a real key, `summarizeWithoutRepublishing` throws on every article and each source ends with `failed`. OpenAI is optional (there is a non-AI fallback summary) — leave `OPENAI_API_KEY` UNSET to use the fallback.

### Gotchas
- `npm run lint` is **broken on Next.js 16**: the `next lint` command was removed and now misreads `lint` as a directory arg (`Invalid project directory provided, no such directory: .../lint`). To lint, run ESLint directly, e.g. `npx eslint .` (config: `eslint-config-next`). `typecheck` and `build` are unaffected.
- **Sample mode only triggers when `NEXT_PUBLIC_SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY` are EMPTY.** If `NEXT_PUBLIC_SUPABASE_URL` is set but not a valid `https://` URL (e.g. a placeholder), `getSupabaseAdmin()` (`src/lib/news-harvester/repository.ts`) throws `Invalid supabaseUrl: Must be a valid HTTP or HTTPS URL`, which crashes the `/editorial` dashboard and the `/api/news-harvester/cron` harvest instead of falling back to sample data. If you only want the sample-mode demo, leave those two vars unset (or remove the registered secrets).
