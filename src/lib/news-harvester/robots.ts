const ROBOTS_CACHE = new Map<string, { fetchedAt: number; rules: RobotsRules }>();
const CACHE_TTL_MS = 6 * 60 * 60 * 1000;

type RobotsRules = {
  disallow: string[];
  allow: string[];
};

export type RobotsPermission = {
  allowed: boolean;
  reason: string;
  robotsUrl: string;
};

export async function checkRobotsPermission(targetUrl: string, userAgent = "PetaKuasaNewsHarvester"): Promise<RobotsPermission> {
  const url = new URL(targetUrl);
  const robotsUrl = `${url.origin}/robots.txt`;
  const cached = ROBOTS_CACHE.get(url.origin);
  const rules = cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS ? cached.rules : await fetchRobots(robotsUrl);

  if (!cached || Date.now() - cached.fetchedAt >= CACHE_TTL_MS) {
    ROBOTS_CACHE.set(url.origin, { fetchedAt: Date.now(), rules });
  }

  const path = `${url.pathname}${url.search}`;
  const explicitAllow = rules.allow.some((rule) => path.startsWith(rule));
  const blockedBy = rules.disallow.find((rule) => rule !== "" && path.startsWith(rule));

  if (explicitAllow || !blockedBy) {
    return { allowed: true, reason: `Allowed for ${userAgent}`, robotsUrl };
  }

  return { allowed: false, reason: `Disallowed by robots.txt rule: ${blockedBy}`, robotsUrl };
}

async function fetchRobots(robotsUrl: string): Promise<RobotsRules> {
  try {
    const response = await fetch(robotsUrl, {
      headers: {
        "user-agent": "PetaKuasaNewsHarvester/0.1 (+editorial review only)"
      },
      next: { revalidate: 21600 }
    });

    if (!response.ok) {
      return { allow: [], disallow: [] };
    }

    return parseRobots(await response.text());
  } catch {
    return { allow: [], disallow: [] };
  }
}

function parseRobots(text: string): RobotsRules {
  const rules: RobotsRules = { allow: [], disallow: [] };
  let applies = false;

  for (const rawLine of text.split("\n")) {
    const line = rawLine.split("#")[0]?.trim();
    if (!line) continue;
    const [rawKey, ...rawValue] = line.split(":");
    const key = rawKey?.trim().toLowerCase();
    const value = rawValue.join(":").trim();

    if (key === "user-agent") {
      applies = value === "*" || /petakuasanewsharvester/i.test(value);
      continue;
    }

    if (!applies) continue;
    if (key === "allow") rules.allow.push(value);
    if (key === "disallow") rules.disallow.push(value);
  }

  return rules;
}
