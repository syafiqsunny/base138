import type { HarvestQuery, MalaysianState } from "./types";

export const JOHOR_DUN = [
  "Buloh Kasap",
  "Jementah",
  "Pemanis",
  "Kemelah",
  "Tenang",
  "Bekok",
  "Bukit Kepong",
  "Bukit Pasir",
  "Gambir",
  "Tangkak",
  "Serom",
  "Bentayan",
  "Simpang Jeram",
  "Bukit Naning",
  "Maharani",
  "Sungai Balang",
  "Semerah",
  "Sri Medan",
  "Yong Peng",
  "Semarang",
  "Parit Yaani",
  "Parit Raja",
  "Penggaram",
  "Senggarang",
  "Rengit",
  "Machap",
  "Layang-Layang",
  "Mengkibol",
  "Mahkota",
  "Paloh",
  "Kahang",
  "Endau",
  "Tenggaroh",
  "Panti",
  "Pasir Raja",
  "Sedili",
  "Johor Lama",
  "Penawar",
  "Tanjung Surat",
  "Tiram",
  "Puteri Wangsa",
  "Johor Jaya",
  "Permas",
  "Larkin",
  "Stulang",
  "Perling",
  "Kempas",
  "Skudai",
  "Kota Iskandar",
  "Bukit Permai",
  "Bukit Batu",
  "Senai",
  "Benut",
  "Pulai Sebatang",
  "Pekan Nanas",
  "Kukup"
] as const;

export const NEGERI_SEMBILAN_DUN = [
  "Chennah",
  "Pertang",
  "Sungai Lui",
  "Klawang",
  "Serting",
  "Palong",
  "Jeram Padang",
  "Bahau",
  "Lenggeng",
  "Nilai",
  "Lobak",
  "Temiang",
  "Sikamat",
  "Ampangan",
  "Juasseh",
  "Seri Menanti",
  "Senaling",
  "Pilah",
  "Johol",
  "Labu",
  "Bukit Kepayang",
  "Rahang",
  "Mambau",
  "Seremban Jaya",
  "Paroi",
  "Chembong",
  "Rantau",
  "Kota",
  "Chuah",
  "Lukut",
  "Bagan Pinang",
  "Linggi",
  "Sri Tanjung",
  "Gemas",
  "Gemencheh",
  "Repah"
] as const;

export const PARTY_KEYWORDS = [
  "Barisan Nasional",
  "BN",
  "Pakatan Harapan",
  "PH",
  "Perikatan Nasional",
  "PN",
  "UMNO",
  "MCA",
  "MIC",
  "DAP",
  "PKR",
  "Amanah",
  "PAS",
  "Bersatu",
  "Muda",
  "Pejuang",
  "Warisan"
] as const;

export const ISSUE_KEYWORDS = [
  "SAMPLE DATA - kos sara hidup",
  "SAMPLE DATA - pembangunan luar bandar",
  "SAMPLE DATA - banjir",
  "SAMPLE DATA - perumahan mampu milik",
  "SAMPLE DATA - peluang pekerjaan",
  "SAMPLE DATA - pengangkutan awam",
  "SAMPLE DATA - pendidikan",
  "SAMPLE DATA - kesihatan",
  "SAMPLE DATA - integriti",
  "SAMPLE DATA - pilihan raya",
  "SAMPLE DATA - belia",
  "SAMPLE DATA - ekonomi negeri"
] as const;

export const LEADER_KEYWORDS = [
  "SAMPLE DATA - Pemimpin Johor A",
  "SAMPLE DATA - Pemimpin Johor B",
  "SAMPLE DATA - Pemimpin Negeri Sembilan A",
  "SAMPLE DATA - Pemimpin Nasional A"
] as const;

export const BASE_POLITICAL_QUERIES = [
  "politik Malaysia",
  "politik Johor",
  "politik Negeri Sembilan",
  "DUN Johor",
  "DUN Negeri Sembilan",
  "kerajaan negeri Johor",
  "kerajaan negeri Negeri Sembilan",
  "parti politik Malaysia"
] as const;

export function buildScheduledQueries(): HarvestQuery[] {
  const dunQueries = [
    ...JOHOR_DUN.map((dun) => ({ keyword: `"${dun}" politik`, state: "Johor" as const, dun })),
    ...NEGERI_SEMBILAN_DUN.map((dun) => ({
      keyword: `"${dun}" politik`,
      state: "Negeri Sembilan" as const,
      dun
    }))
  ];

  const partyQueries = PARTY_KEYWORDS.map((party) => ({
    keyword: `${party} Malaysia politik`,
    state: "Malaysia" as MalaysianState,
    party
  }));

  const issueQueries = ISSUE_KEYWORDS.map((issue) => ({
    keyword: issue.replace("SAMPLE DATA - ", ""),
    state: "Malaysia" as MalaysianState,
    issue
  }));

  return [
    ...BASE_POLITICAL_QUERIES.map((keyword) => ({ keyword, state: "Malaysia" as const })),
    ...dunQueries,
    ...partyQueries,
    ...issueQueries
  ];
}
