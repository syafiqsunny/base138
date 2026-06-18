# PetaKuasa News Harvester

Modul Next.js + TypeScript untuk menuai metadata berita politik daripada RSS feed diluluskan, Google Programmable Search API, NewsAPI dan GDELT. Semua hasil masuk ke Editorial Review Queue; sistem ini **tidak menerbitkan berita secara automatik**.

## Komponen

- `src/lib/news-harvester/*` - worker, source clients, robots.txt checks, deduplication, klasifikasi, scoring dan AI summary.
- `src/app/api/news-harvester/cron` - endpoint cron/n8n untuk menjalankan harvester berkala.
- `src/app/api/news-harvester/editorial/actions` - approve, reject, merge, assign reporter dan blacklist source dengan audit log.
- `src/app/editorial` - dashboard editorial dan statistik mengikut negeri, DUN, parti dan isu.
- `supabase/schema.sql` - skema PostgreSQL.
- `supabase/seed.sample.sql` - SAMPLE DATA sahaja; bukan fakta sebenar.
- `src/payload.config.ts` - koleksi Payload CMS untuk sumber, artikel, queue, cluster dan audit log.
- `n8n/news-harvester-workflow.json` - workflow SAMPLE DATA untuk jadual berkala dan retry.

## Guardrails editorial dan copyright

1. Harvester menyimpan tajuk, sumber, URL asal, tarikh penerbitan, ringkasan/snippet metadata, attribution dan skor.
2. AI summary dibina daripada metadata/snippet sahaja; ia tidak memuat turun atau menerbitkan artikel penuh.
3. Imej tidak dimuat turun atau diterbitkan semula. `image_permission_status` default ialah `not_requested`.
4. RSS feed diperiksa terhadap `robots.txt` sebelum fetch.
5. Source perlu `approved = true`.
6. Semua item masuk `pending_review`; editor mesti approve/reject/merge/assign/blacklist.
7. Tindakan editor direkod dalam `editorial_actions_audit`.
8. Source blacklist disimpan dalam `source_blacklist`.

## Setup

```bash
npm install
cp .env.example .env.local
```

Isi nilai berikut:

- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `DATABASE_URI`
- `PAYLOAD_SECRET`
- `GOOGLE_PROGRAMMABLE_SEARCH_API_KEY`
- `GOOGLE_PROGRAMMABLE_SEARCH_ENGINE_ID`
- `NEWSAPI_KEY`
- `OPENAI_API_KEY` (optional; fallback summary tersedia)
- `NEWS_HARVESTER_CRON_SECRET`

Jalankan skema Supabase:

```bash
psql "$DATABASE_URI" -f supabase/schema.sql
psql "$DATABASE_URI" -f supabase/seed.sample.sql
```

> `seed.sample.sql` mengandungi SAMPLE DATA sahaja dan tidak boleh dipersembahkan sebagai fakta sebenar.

## Development

```bash
npm run dev
npm run typecheck
npm run build
```

Dashboard: `/editorial`

Run harvester sekali:

```bash
npm run harvest:once
```

Run via API:

```bash
curl -X POST "$NEXT_PUBLIC_APP_URL/api/news-harvester/cron" \
  -H "x-cron-secret: $NEWS_HARVESTER_CRON_SECRET"
```

## Payload CMS

Payload menggunakan `DATABASE_URI` PostgreSQL yang sama. Jalankan:

```bash
npm run payload
```

Koleksi Payload disediakan untuk pengurusan editorial; skema Supabase tetap menjadi kontrak data utama untuk worker dan dashboard.

## n8n

Import `n8n/news-harvester-workflow.json`, set environment variables:

- `NEXT_PUBLIC_APP_URL`
- `NEWS_HARVESTER_CRON_SECRET`

Workflow SAMPLE DATA menjadualkan run setiap jam dan retry panggilan API sehingga 3 kali.
