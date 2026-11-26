// Category groups on the Payloads index: their section ids, and the jump links to them.

export const groupSlug = (group: string) =>
  group
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

export interface GroupJump {
  group: string;
  slug: string;
  count: number;
}

/** One jump link per group, in the catalog's group order, with the number of categories in it. */
export function groupJumps(groups: string[], categories: { group: string }[]): GroupJump[] {
  return groups.map((group) => ({
    group,
    slug: groupSlug(group),
    count: categories.filter((c) => c.group === group).length,
  }));
}
