import test, { beforeEach } from "node:test";
import assert from "node:assert/strict";
import { blogPaths, pingIndexNow, publishDeps, resetPublishState, schedulePublish, sectionPaths } from "./publish.js";

// Fake clock and network: timers run only when the test advances time.
let now;
let timers;
let calls;

beforeEach(() => {
  resetPublishState();
  now = 1_000_000;
  timers = [];
  calls = [];
  Object.assign(publishDeps, {
    now: () => now,
    setTimeout: (fn, ms) => { const timer = { fn, at: now + ms }; timers.push(timer); return timer; },
    clearTimeout: (timer) => { timers = timers.filter((t) => t !== timer); },
    fetch: async (url, options = {}) => { calls.push({ url, options }); return { ok: true, status: 200 }; },
    log: () => {},
    config: { deployHookUrl: "https://hooks.example/deploy", siteUrl: "https://www.example.com", indexNowKey: "abc123" },
  });
});

async function advance(ms) {
  now += ms;
  for (;;) {
    const due = timers.filter((t) => t.at <= now).sort((a, b) => a.at - b.at)[0];
    if (!due) break;
    timers = timers.filter((t) => t !== due);
    await due.fn();
  }
}

test("pages a content section appears on", () => {
  assert.deepEqual(sectionPaths("home", {}), ["/"]);
  assert.deepEqual(sectionPaths("settings", {}), ["/"]);
  assert.deepEqual(sectionPaths("safari", { zones: [{ slug: "chilla-jeep-safari" }, {}] }), ["/zones", "/chilla-jeep-safari"]);
  assert.deepEqual(sectionPaths("fauna", { slug: "mammals", hubSlug: "wildlife-hub" }), ["/mammals", "/wildlife-hub"]);
  assert.deepEqual(sectionPaths("tickets", { slug: "tickets-page" }), ["/tickets-page"]);
  assert.deepEqual(sectionPaths("tickets", {}), []);
});

test("blog paths include the old address after a slug change", () => {
  assert.deepEqual(blogPaths("new-slug", "old-slug"), ["/blog", "/blog/new-slug", "/blog/old-slug"]);
  assert.deepEqual(blogPaths("same", "same"), ["/blog", "/blog/same"]);
});

test("a burst of edits becomes one rebuild, then one IndexNow ping", async () => {
  schedulePublish(["/a"]);
  await advance(60_000);
  schedulePublish(["/b"]); // restarts the quiet period
  await advance(119_000);
  assert.equal(calls.length, 0);

  await advance(1_000);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, "https://hooks.example/deploy");

  await advance(5 * 60_000);
  assert.equal(calls.length, 2);
  const ping = JSON.parse(calls[1].options.body);
  assert.equal(calls[1].url, "https://api.indexnow.org/indexnow");
  assert.equal(ping.host, "www.example.com");
  assert.equal(ping.keyLocation, "https://www.example.com/abc123.txt");
  assert.deepEqual(ping.urlList.sort(), ["https://www.example.com/a", "https://www.example.com/b"]);
});

test("rebuilds are at least 10 minutes apart", async () => {
  schedulePublish(["/a"]);
  await advance(2 * 60_000);
  assert.equal(calls.filter((c) => c.url.includes("hooks")).length, 1);

  schedulePublish(["/b"]);
  await advance(2 * 60_000);
  assert.equal(calls.filter((c) => c.url.includes("hooks")).length, 1, "too soon after the last rebuild");

  await advance(7 * 60_000); // 9 minutes after the first rebuild
  assert.equal(calls.filter((c) => c.url.includes("hooks")).length, 1);

  await advance(60_000); // 10 minutes after the first rebuild
  assert.equal(calls.filter((c) => c.url.includes("hooks")).length, 2);
});

test("does nothing without a deploy hook", async () => {
  publishDeps.config = { ...publishDeps.config, deployHookUrl: "" };
  schedulePublish(["/a"]);
  await advance(60 * 60_000);
  assert.equal(calls.length, 0);
});

test("a failed rebuild request skips the ping and never throws", async () => {
  publishDeps.fetch = async (url) => { calls.push({ url }); throw new Error("network down"); };
  schedulePublish(["/a"]);
  await advance(30 * 60_000);
  assert.equal(calls.length, 1);
});

test("IndexNow ping is skipped without a key", async () => {
  publishDeps.config = { ...publishDeps.config, indexNowKey: "" };
  await pingIndexNow(["/a"]);
  assert.equal(calls.length, 0);
});
