#!/usr/bin/env node
// Poll the live site until it serves the expected payload revision.
//
//   node verify-live.mjs --url https://hunting.0d4y.dev --revision <sha>
//        [--timeout 900] [--interval 20]
//
// Exit 0 once /payload-catalog/index.json reports the revision, 1 on timeout.

import { parseArgs } from "node:util";

export async function fetchRevision(baseUrl, fetchImpl = fetch) {
  const url = new URL("payload-catalog/index.json", baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`);
  url.searchParams.set("verify", String(Date.now()));
  const response = await fetchImpl(url, { headers: { "cache-control": "no-cache" } });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const index = await response.json();
  return index?.source?.revision ?? null;
}

export async function waitForRevision({ url, revision, timeoutSeconds = 900, intervalSeconds = 20, fetchImpl = fetch, sleep = (ms) => new Promise((r) => setTimeout(r, ms)), log = console.log }) {
  const deadline = Date.now() + timeoutSeconds * 1000;
  let last = "no response yet";
  for (;;) {
    try {
      const live = await fetchRevision(url, fetchImpl);
      last = live ? live.slice(0, 7) : "no revision field";
      if (live === revision) return true;
    } catch (error) {
      last = error.message;
    }
    if (Date.now() >= deadline) {
      log(`Timed out. Live revision: ${last}; expected ${revision.slice(0, 7)}.`);
      return false;
    }
    log(`Live revision: ${last}; waiting for ${revision.slice(0, 7)}…`);
    await sleep(intervalSeconds * 1000);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { values } = parseArgs({
    options: { url: { type: "string" }, revision: { type: "string" }, timeout: { type: "string", default: "900" }, interval: { type: "string", default: "20" } },
  });
  if (!values.url || !/^[0-9a-f]{40}$/.test(values.revision ?? "")) {
    console.error("--url and a 40-character --revision are required");
    process.exit(2);
  }
  const ok = await waitForRevision({ url: values.url, revision: values.revision, timeoutSeconds: Number(values.timeout), intervalSeconds: Number(values.interval) });
  if (ok) console.log(`Live site serves ${values.revision.slice(0, 7)}.`);
  process.exit(ok ? 0 : 1);
}
