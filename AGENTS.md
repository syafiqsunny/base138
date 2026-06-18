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

### Gotchas
- `npm run lint` is **broken on Next.js 16**: the `next lint` command was removed and now misreads `lint` as a directory arg (`Invalid project directory provided, no such directory: .../lint`). To lint, run ESLint directly, e.g. `npx eslint .` (config: `eslint-config-next`). `typecheck` and `build` are unaffected.
- **Sample mode only triggers when `NEXT_PUBLIC_SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY` are EMPTY.** If `NEXT_PUBLIC_SUPABASE_URL` is set but not a valid `https://` URL (e.g. a placeholder), `getSupabaseAdmin()` (`src/lib/news-harvester/repository.ts`) throws `Invalid supabaseUrl: Must be a valid HTTP or HTTPS URL`, which crashes the `/editorial` dashboard and the `/api/news-harvester/cron` harvest instead of falling back to sample data. If you only want the sample-mode demo, leave those two vars unset (or remove the registered secrets).
