import assert from "node:assert/strict";
import { test } from "node:test";

import { groupJumps, groupSlug } from "./payload-groups.ts";

test("groupSlug turns a group name into the section id the index uses", () => {
  assert.equal(groupSlug("Injection"), "injection");
  assert.equal(groupSlug("Access Control"), "access-control");
  assert.equal(groupSlug("Auth & Session"), "auth-session");
  assert.equal(groupSlug("  Client-Side / Browser  "), "client-side-browser");
});

test("groupJumps lists every group in order, with its category count", () => {
  const categories = [{ group: "Injection" }, { group: "Access Control" }, { group: "Injection" }];
  assert.deepEqual(groupJumps(["Injection", "Access Control", "Other"], categories), [
    { group: "Injection", slug: "injection", count: 2 },
    { group: "Access Control", slug: "access-control", count: 1 },
    { group: "Other", slug: "other", count: 0 },
  ]);
});
