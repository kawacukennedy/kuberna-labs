#!/usr/bin/env node
/**
 * Star history SVG generator.
 *
 * GitHub restricted public access to the stargazers API, which broke the
 * third-party star-history.com badge. This script fetches the star timeline
 * using an authenticated token (available in Actions / locally via gh) and
 * renders an SVG chart that gets committed to the repo — so it always loads.
 *
 * Usage:
 *   GH_TOKEN=... node scripts/star-history.mjs kawacukennedy kuberna-labs
 */

const OWNER = process.argv[2] || 'kawacukennedy';
const REPO = process.argv[3] || 'kuberna-labs';
const OUT = process.argv[4] || 'docs/assets/star-history.svg';

const TOKEN = process.env.GH_TOKEN || process.env.GITHUB_TOKEN;

if (!TOKEN) {
  console.error('GH_TOKEN or GITHUB_TOKEN is required');
  process.exit(1);
}

const PAGE_SIZE = 100;

async function fetchStargazers() {
  const stars = [];
  let page = 1;
  let pagesRemaining = true;
  while (pagesRemaining) {
    const res = await fetch(
      `https://api.github.com/repos/${OWNER}/${REPO}/stargazers?per_page=${PAGE_SIZE}&page=${page}`,
      {
        headers: {
          Authorization: `Bearer ${TOKEN}`,
          Accept: 'application/vnd.github.star+json',
          'User-Agent': 'kuberna-star-history',
          'X-GitHub-Api-Version': '2022-11-28',
        },
      }
    );
    if (res.status === 401) {
      throw new Error('Stargazers API requires authentication (401). Token must have repo scope.');
    }
    if (!res.ok) {
      throw new Error(`Stargazers API returned ${res.status}: ${await res.text()}`);
    }
    const body = await res.json();
    if (!Array.isArray(body) || body.length === 0) {
      pagesRemaining = false;
      break;
    }
    for (const entry of body) {
      stars.push({
        login: entry.user?.login ?? 'unknown',
        starredAt: entry.starred_at ?? entry.user?.starred_at,
      });
    }
    const link = res.headers.get('link') ?? '';
    pagesRemaining = /rel="next"/.test(link);
    page += 1;
  }
  return stars;
}

function buildTimeline(stars) {
  const points = [];
  // dedupe + sort by date so the cumulative curve is monotonic
  const unique = [];
  const seen = new Set();
  for (const s of stars) {
    const key = `${s.login}@${s.starredAt ?? ''}`;
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(s);
    }
  }
  unique.sort((a, b) => new Date(a.starredAt).getTime() - new Date(b.starredAt).getTime());
  let running = 0;
  for (const s of unique) {
    if (!s.starredAt) continue;
    running += 1;
    points.push({ date: new Date(s.starredAt), count: running });
  }
  return { points, total: running };
}

function renderSvg({ points, total }) {
  const W = 720;
  const H = 260;
  const PAD = { l: 60, r: 20, t: 30, b: 40 };

  if (points.length === 0) {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <rect width="${W}" height="${H}" fill="#fff"/>
  <text x="${W / 2}" y="${H / 2}" font-family="monospace" font-size="18" fill="#666" text-anchor="middle">No star data yet</text>
</svg>
`;
  }

  const t0 = points[0].date.getTime();
  const t1 = points[points.length - 1].date.getTime();
  const span = Math.max(1, t1 - t0);
  const maxY = total;

  const x = (d) => PAD.l + ((d.getTime() - t0) / span) * (W - PAD.l - PAD.r);
  const y = (c) => H - PAD.b - (c / maxY) * (H - PAD.t - PAD.b);

  const linePoints = points
    .map((p) => `${x(p.date).toFixed(1)},${y(p.count).toFixed(1)}`)
    .join(' ');

  const fmtDate = (ms) =>
    new Date(ms)
      .toISOString()
      .slice(0, 10)
      .replace(/^(\d{4})-(\d{2})-(\d{2})$/, '$2/$1');

  const yTicks = [];
  for (let i = 1; i <= 5; i++) {
    yTicks.push(Math.round((maxY * i) / 5));
  }

  const xTicks = [0, 0.5, 1].map((f) => t0 + span * f);

  let axis = '';
  for (const t of yTicks) {
    const yy = y(t);
    axis += `<line x1="${PAD.l}" y1="${yy}" x2="${W - PAD.r}" y2="${yy}" stroke="#eee" stroke-dasharray="3,3"/>
  <text x="${PAD.l - 8}" y="${yy + 4}" font-family="monospace" font-size="11" fill="#888" text-anchor="end">${t}</text>\n`;
  }
  for (const t of xTicks) {
    const xx = x(new Date(t));
    axis += `<text x="${xx}" y="${H - PAD.b + 18}" font-family="monospace" font-size="11" fill="#888" text-anchor="middle">${fmtDate(t)}</text>\n`;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="#fff"/>
  <text x="${PAD.l}" y="${16}" font-family="monospace" font-size="14" font-weight="bold" fill="#111">★ ${total} stars · ${OWNER}/${REPO}</text>
  ${axis}
  <polyline fill="none" stroke="#f0ad4e" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round" points="${linePoints}"/>
  <circle cx="${x(points[points.length - 1].date).toFixed(1)}" cy="${y(maxY).toFixed(1)}" r="4" fill="#e89217"/>
</svg>
`;
}

async function main() {
  console.log(`Fetching stargazers for ${OWNER}/${REPO}...`);
  const stars = await fetchStargazers();
  const { points, total } = buildTimeline(stars);
  console.log(
    `Fetched ${stars.length} star records → ${points.length} timeline points (${total} total)`
  );
  const svg = renderSvg({ points, total });
  const fs = await import('fs');
  const path = await import('path');
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, svg);
  console.log(`Wrote ${OUT}`);
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
