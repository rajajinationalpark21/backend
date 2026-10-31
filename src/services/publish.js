import { env } from "../config/env.js";

/**
 * Keeps the public website in step with admin edits.
 *
 * The website is a static build: its prerendered pages, sitemap and the cached
 * CMS file are written at deploy time. After an admin saves content or a blog
 * post, this asks Vercel to rebuild (one deploy per burst of edits), then tells
 * IndexNow (Bing, Yandex and others; Bing also feeds ChatGPT and Copilot search)
 * which pages changed once the new build should be live.
 *
 * Everything here is best-effort: a failure is logged and never fails the save.
 */

const QUIET_MS = 2 * 60 * 1000; // wait for edits to stop before rebuilding
const MIN_GAP_MS = 10 * 60 * 1000; // at most one rebuild per 10 minutes
const LIVE_AFTER_MS = 5 * 60 * 1000; // a Vercel build is usually live within this

const state = {
  timer: null,
  lastDeployAt: 0,
  paths: new Set(),
};

/** Overridable in tests. */
export const publishDeps = {
  fetch: (...args) => fetch(...args),
  now: () => Date.now(),
  setTimeout: (...args) => setTimeout(...args),
  clearTimeout: (...args) => clearTimeout(...args),
  log: (...args) => console.log(...args),
  config: env.publish,
};

/**
 * The site paths a content section is shown on. Pages take their address from
 * the section's `slug`; zones from each zone's slug.
 */
export function sectionPaths(section, data = {}) {
  if (section === "home" || section === "settings") return ["/"];
  if (section === "safari") {
    return ["/zones", ...(data.zones || []).map((zone) => zone?.slug && `/${zone.slug}`).filter(Boolean)];
  }
  const paths = [];
  if (data.slug) paths.push(`/${data.slug}`);
  if (section === "fauna" && data.hubSlug) paths.push(`/${data.hubSlug}`);
  return paths;
}

/** Paths for a blog post (and the old address when its slug changed). */
export function blogPaths(...slugs) {
  return ["/blog", ...new Set(slugs.filter(Boolean).map((slug) => `/blog/${slug}`))];
}

/**
 * Ask for a rebuild that will include `paths`. Calls within the quiet period
 * are merged into one rebuild; rebuilds are spaced at least MIN_GAP_MS apart.
 */
export function schedulePublish(paths = []) {
  const { deployHookUrl } = publishDeps.config;
  if (!deployHookUrl) return; // not configured (local development)

  paths.forEach((path) => state.paths.add(path));
  if (state.timer) publishDeps.clearTimeout(state.timer);

  const sinceLast = publishDeps.now() - state.lastDeployAt;
  const wait = Math.max(QUIET_MS, MIN_GAP_MS - sinceLast);
  state.timer = publishDeps.setTimeout(runPublish, wait);
}

async function runPublish() {
  state.timer = null;
  const paths = [...state.paths];
  state.paths.clear();
  state.lastDeployAt = publishDeps.now();

  const { deployHookUrl } = publishDeps.config;
  try {
    const res = await publishDeps.fetch(deployHookUrl, { method: "POST" });
    publishDeps.log(`[publish] website rebuild requested (${res.status}) for ${paths.length} changed page(s)`);
    if (!res.ok) return;
  } catch (error) {
    publishDeps.log(`[publish] website rebuild request failed: ${error.message}`);
    return;
  }

  if (paths.length) {
    publishDeps.setTimeout(() => pingIndexNow(paths), LIVE_AFTER_MS);
  }
}

/** Tell IndexNow which URLs changed. https://www.indexnow.org/documentation */
export async function pingIndexNow(paths) {
  const { siteUrl, indexNowKey } = publishDeps.config;
  if (!indexNowKey || !paths.length) return;

  const host = new URL(siteUrl).host;
  const body = {
    host,
    key: indexNowKey,
    keyLocation: `${siteUrl}/${indexNowKey}.txt`,
    urlList: [...new Set(paths)].map((path) => `${siteUrl}${path === "/" ? "/" : path}`),
  };
  try {
    const res = await publishDeps.fetch("https://api.indexnow.org/indexnow", {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify(body),
    });
    publishDeps.log(`[publish] IndexNow notified of ${body.urlList.length} URL(s) (${res.status})`);
  } catch (error) {
    publishDeps.log(`[publish] IndexNow ping failed: ${error.message}`);
  }
}

/** For tests: forget any pending rebuild. */
export function resetPublishState() {
  if (state.timer) publishDeps.clearTimeout(state.timer);
  state.timer = null;
  state.lastDeployAt = 0;
  state.paths.clear();
}
