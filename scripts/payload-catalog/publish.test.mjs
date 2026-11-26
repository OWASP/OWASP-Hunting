// End-to-end tests of the publish step against real local git remotes.
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const HERE = fileURLToPath(new URL(".", import.meta.url));
const GEN = join(HERE, "generate.mjs");
const PUBLISH = join(HERE, "publish.sh");
const IDENT = ["-c", "user.name=t", "-c", "user.email=t@example.test"];

const git = (cwd, ...args) => execFileSync("git", ["-C", cwd, ...IDENT, ...args], { encoding: "utf8" }).trim();
const tmp = () => mkdtempSync(join(tmpdir(), "publish-test-"));

function setup() {
  const base = tmp();
  const source = join(base, "source");
  mkdirSync(join(source, "XSS"), { recursive: true });
  git(source, "init", "-q", "-b", "main");
  writeFileSync(join(source, "XSS", "README.md"), "# XSS\n\n## Description\nScripts.\n");
  writeFileSync(join(source, "XSS", "xss.txt"), "<svg onload=1>\n");
  git(source, "add", ".");
  git(source, "commit", "-qm", "c1");

  const remote = join(base, "remote.git");
  execFileSync("git", ["init", "-q", "--bare", "-b", "website", remote]);
  const seed = join(base, "seed");
  execFileSync("git", ["clone", "-q", remote, seed], { stdio: "ignore" });
  git(seed, "switch", "-q", "-c", "website");
  mkdirSync(join(seed, "src"), { recursive: true });
  writeFileSync(join(seed, "src", "app.ts"), "export {};\n");
  git(seed, "add", ".");
  git(seed, "commit", "-qm", "site");
  git(seed, "push", "-q", "origin", "website");

  const site = join(base, "site");
  execFileSync("git", ["clone", "-q", "-b", "website", remote, site], { stdio: "ignore" });
  return { base, source, remote, seed, site };
}

function generate(ctx) {
  const sha = git(ctx.source, "rev-parse", "HEAD");
  const r = spawnSync(process.execPath, [GEN, "--source", ctx.source, "--out", join(ctx.site, "public", "payload-catalog")], { encoding: "utf8" });
  assert.equal(r.status, 0, r.stderr);
  return sha;
}

function publish(ctx, sha, extraEnv = {}) {
  const r = spawnSync("bash", [PUBLISH], {
    encoding: "utf8",
    env: { ...process.env, SITE_DIR: ctx.site, SOURCE_DIR: ctx.source, REMOTE: ctx.remote, BRANCH: "website", SOURCE_SHA: sha, RETRY_DELAY: "0", ...extraEnv },
  });
  const out = Object.fromEntries(r.stdout.split("\n").filter(Boolean).map((l) => l.split("=")));
  return { status: r.status, out, stderr: r.stderr };
}

const remoteHeadFile = (ctx, path) => execFileSync("git", ["-C", ctx.remote, "show", `website:${path}`], { encoding: "utf8" }).trimEnd();
const remoteRevision = (ctx) => JSON.parse(remoteHeadFile(ctx, "public/payload-catalog/index.json")).source.revision;

test("publishes a new catalog to the website branch and leaves unrelated files alone", () => {
  const ctx = setup();
  const sha = generate(ctx);
  const r = publish(ctx, sha);
  assert.equal(r.status, 0, r.stderr);
  assert.equal(r.out.published, "true");
  assert.equal(remoteRevision(ctx), sha);
  assert.equal(remoteHeadFile(ctx, "src/app.ts"), "export {};");
  const msg = git(ctx.remote, "log", "-1", "--format=%s%n%b", "website");
  assert.match(msg, /chore\(catalog\): sync payloads from main@/);
  assert.match(msg, new RegExp(`commit/${sha}`));
});

test("running again with nothing changed creates no commit", () => {
  const ctx = setup();
  const sha = generate(ctx);
  assert.equal(publish(ctx, sha).out.published, "true");
  const before = git(ctx.remote, "rev-parse", "website");
  generate(ctx);
  const again = publish(ctx, sha);
  assert.equal(again.status, 0, again.stderr);
  assert.equal(again.out.published, "false");
  assert.equal(git(ctx.remote, "rev-parse", "website"), before);
});

test("retries after a concurrent push to website and keeps the other commit", () => {
  const ctx = setup();
  const sha = generate(ctx);
  // Someone else pushes to website after this run checked it out.
  writeFileSync(join(ctx.seed, "src", "other.ts"), "export const a = 1;\n");
  git(ctx.seed, "add", ".");
  git(ctx.seed, "commit", "-qm", "unrelated website change");
  git(ctx.seed, "push", "-q", "origin", "website");

  const r = publish(ctx, sha);
  assert.equal(r.status, 0, r.stderr);
  assert.equal(r.out.published, "true");
  assert.match(r.stderr, /rejected/);
  assert.equal(remoteRevision(ctx), sha);
  assert.equal(remoteHeadFile(ctx, "src/other.ts"), "export const a = 1;");
  assert.equal(git(ctx.remote, "rev-list", "--count", "website"), "3");
});

test("a run that finds the same catalog already published does not add a commit", () => {
  const ctx = setup();
  const sha = generate(ctx);
  // Another run publishes the identical catalog first.
  const other = join(ctx.base, "other-site");
  execFileSync("git", ["clone", "-q", "-b", "website", ctx.remote, other], { stdio: "ignore" });
  const gen = spawnSync(process.execPath, [GEN, "--source", ctx.source, "--out", join(other, "public", "payload-catalog")], { encoding: "utf8" });
  assert.equal(gen.status, 0);
  git(other, "add", ".");
  git(other, "commit", "-qm", "other run");
  git(other, "push", "-q", "origin", "website");
  const before = git(ctx.remote, "rev-parse", "website");

  const r = publish(ctx, sha);
  assert.equal(r.status, 0, r.stderr);
  assert.equal(r.out.published, "false");
  assert.equal(git(ctx.remote, "rev-parse", "website"), before);
});

test("an older run never overwrites a catalog generated from a newer main commit", () => {
  const ctx = setup();
  const older = generate(ctx);

  // main moves on; a newer run publishes first.
  writeFileSync(join(ctx.source, "XSS", "xss.txt"), "<svg onload=1>\n<img src=x onerror=1>\n");
  git(ctx.source, "commit", "-qam", "c2");
  const newer = git(ctx.source, "rev-parse", "HEAD");
  const newerSite = join(ctx.base, "newer-site");
  execFileSync("git", ["clone", "-q", "-b", "website", ctx.remote, newerSite], { stdio: "ignore" });
  assert.equal(spawnSync(process.execPath, [GEN, "--source", ctx.source, "--out", join(newerSite, "public", "payload-catalog")], { encoding: "utf8" }).status, 0);
  git(newerSite, "add", ".");
  git(newerSite, "commit", "-qm", "newer run");
  git(newerSite, "push", "-q", "origin", "website");
  assert.equal(remoteRevision(ctx), newer);

  // The older run still holds its c1 catalog, and its checkout of main is back at c1.
  git(ctx.source, "checkout", "-q", older);
  const r = publish(ctx, older);
  assert.equal(r.status, 0, r.stderr);
  assert.equal(r.out.published, "false");
  assert.equal(r.out.stale, "true");
  assert.equal(remoteRevision(ctx), newer, "the newer catalog must survive");
});

test("refuses to publish when the source checkout is not at the stated revision", () => {
  const ctx = setup();
  generate(ctx);
  const r = publish(ctx, "0".repeat(40));
  assert.equal(r.status, 1);
  assert.match(r.stderr, /refusing to publish/);
});

test("fails cleanly when the push is permanently rejected", () => {
  const ctx = setup();
  const sha = generate(ctx);
  const hook = join(ctx.remote, "hooks", "pre-receive");
  writeFileSync(hook, "#!/bin/sh\necho 'protected branch' >&2\nexit 1\n");
  chmodSync(hook, 0o755);
  const before = git(ctx.remote, "rev-parse", "website");
  const r = publish(ctx, sha);
  assert.equal(r.status, 1);
  assert.match(r.stderr, /Could not update website/);
  assert.equal(git(ctx.remote, "rev-parse", "website"), before, "remote must be unchanged");
});

test("the workflow calls the same scripts that are tested here", () => {
  const wf = join(HERE, "..", "..", ".github", "workflows", "sync-payloads.yml");
  if (!existsSync(wf)) return; // the workflow lives on main
  const text = readFileSync(wf, "utf8");
  assert.match(text, /scripts\/payload-catalog\/publish\.sh/);
});
