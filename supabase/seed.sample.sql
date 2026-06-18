insert into news_sources (name, type, url, approved, credibility_score, permissions_note)
values
  (
    'SAMPLE DATA - Portal Berita Diluluskan A',
    'rss',
    'https://example.com/sample-politics-rss.xml',
    true,
    72,
    'SAMPLE DATA - RSS metadata only; no image republication.'
  ),
  (
    'SAMPLE DATA - Google Programmable Search',
    'google_cse',
    'https://www.googleapis.com/customsearch/v1',
    true,
    65,
    'SAMPLE DATA - Search result metadata only.'
  ),
  (
    'SAMPLE DATA - NewsAPI',
    'newsapi',
    'https://newsapi.org/v2/everything',
    true,
    66,
    'SAMPLE DATA - API metadata only.'
  ),
  (
    'SAMPLE DATA - GDELT',
    'gdelt',
    'https://api.gdeltproject.org/api/v2/doc/doc',
    true,
    61,
    'SAMPLE DATA - Monitoring metadata only.'
  )
on conflict (url) do nothing;

insert into monitored_keywords (keyword, state, dun, party, leader, issue, active, sample_data)
values
  ('SAMPLE DATA - politik Johor banjir', 'Johor', 'SAMPLE DATA - Kota Iskandar', 'SAMPLE DATA - Parti A', 'SAMPLE DATA - Pemimpin Johor A', 'SAMPLE DATA - banjir', true, true),
  ('SAMPLE DATA - pembangunan luar bandar Negeri Sembilan', 'Negeri Sembilan', 'SAMPLE DATA - Gemas', 'SAMPLE DATA - Parti B', 'SAMPLE DATA - Pemimpin Negeri Sembilan A', 'SAMPLE DATA - pembangunan luar bandar', true, true),
  ('SAMPLE DATA - kos sara hidup Malaysia', 'Malaysia', null, 'SAMPLE DATA - Parti C', 'SAMPLE DATA - Pemimpin Nasional A', 'SAMPLE DATA - kos sara hidup', true, true);

insert into article_clusters (cluster_key, representative_title, state, dun, party, leader, issue)
values
  ('sample-cluster-1', 'SAMPLE DATA - Isu banjir dibincang dalam kempen setempat', 'Johor', 'SAMPLE DATA - Kota Iskandar', 'SAMPLE DATA - Parti A', 'SAMPLE DATA - Pemimpin Johor A', 'SAMPLE DATA - banjir'),
  ('sample-cluster-2', 'SAMPLE DATA - Debat pembangunan luar bandar menjadi tumpuan', 'Negeri Sembilan', 'SAMPLE DATA - Gemas', 'SAMPLE DATA - Parti B', 'SAMPLE DATA - Pemimpin Negeri Sembilan A', 'SAMPLE DATA - pembangunan luar bandar')
on conflict (cluster_key) do nothing;

with inserted_articles as (
  insert into harvested_articles (
    title,
    source_name,
    source_type,
    source_url,
    original_url,
    canonical_url,
    published_at,
    summary,
    snippet,
    ai_summary,
    state,
    dun,
    party,
    leader,
    issue,
    attribution,
    image_permission_status,
    relevance_score,
    source_credibility_score,
    urgency_score,
    content_hash,
    cluster_key,
    editorial_status
  )
  values
    (
      'SAMPLE DATA - Isu banjir dibincang dalam kempen setempat',
      'SAMPLE DATA - Portal Berita Diluluskan A',
      'rss',
      'https://example.com/sample-politics-rss.xml',
      'https://example.com/sample-politics-story',
      'https://example.com/sample-politics-story',
      '2026-06-18T00:00:00Z',
      'SAMPLE DATA - Metadata menyebut isu banjir dalam konteks kempen setempat.',
      'SAMPLE DATA - Snippet ringkas untuk tujuan demonstrasi sahaja.',
      'SAMPLE DATA - Ringkasan editorial menyatakan bahawa isu banjir disebut dalam konteks kempen setempat. Editor perlu menyemak pautan asal sebelum sebarang penerbitan.',
      'Johor',
      'SAMPLE DATA - Kota Iskandar',
      'SAMPLE DATA - Parti A',
      'SAMPLE DATA - Pemimpin Johor A',
      'SAMPLE DATA - banjir',
      'SAMPLE DATA - Attribution retained with original source link.',
      'not_requested',
      88,
      72,
      67,
      'sample-content-hash-1',
      'sample-cluster-1',
      'pending_review'
    ),
    (
      'SAMPLE DATA - Debat pembangunan luar bandar menjadi tumpuan',
      'SAMPLE DATA - NewsAPI',
      'newsapi',
      'https://newsapi.org/v2/everything',
      'https://example.com/sample-ns-story',
      'https://example.com/sample-ns-story',
      '2026-06-17T15:00:00Z',
      'SAMPLE DATA - Metadata menyebut pembangunan luar bandar.',
      'SAMPLE DATA - Snippet ringkas untuk tujuan demonstrasi sahaja.',
      'SAMPLE DATA - Metadata sumber menggambarkan perbincangan pembangunan luar bandar. Kandungan ini menunggu semakan editor dan bukan fakta sebenar.',
      'Negeri Sembilan',
      'SAMPLE DATA - Gemas',
      'SAMPLE DATA - Parti B',
      'SAMPLE DATA - Pemimpin Negeri Sembilan A',
      'SAMPLE DATA - pembangunan luar bandar',
      'SAMPLE DATA - Attribution retained with original source link.',
      'not_requested',
      81,
      66,
      42,
      'sample-content-hash-2',
      'sample-cluster-2',
      'pending_review'
    )
  on conflict (canonical_url) do nothing
  returning id, cluster_key
)
insert into article_cluster_members (cluster_key, article_id, similarity_score, match_reason)
select cluster_key, id, 1, 'SAMPLE DATA - seed'
from inserted_articles
on conflict do nothing;

insert into editorial_queue (article_id, status, priority_score)
select id, 'pending_review', greatest(relevance_score, urgency_score)
from harvested_articles
where title like 'SAMPLE DATA -%'
on conflict (article_id) do nothing;
