/**
 * Global nav validation — at least one navigable link per section (L1) and per column (L2).
 * "Link" = URL on the row (L1/L2) and/or at least one L3 item under that subtree.
 */

function linkTrim(s) {
  return typeof s === "string" ? s.trim() : "";
}

/** L2 column is valid if it has a column-level link or at least one L3 item. */
export function l2HasAtLeastOneLink(l2) {
  if (!l2) return false;
  if (linkTrim(l2.navLink) !== "") return true;
  return (l2.l3s?.length ?? 0) > 0;
}

/**
 * L1 section is valid if it has a section-level URL, or any L2 column URL,
 * or at least one L3 item anywhere under the section (any column).
 */
export function l1HasAtLeastOneLink(block) {
  if (!block) return false;
  if (linkTrim(block.navLink) !== "") return true;
  if (block.l2s.some((l2) => linkTrim(l2.navLink) !== "")) return true;
  const l3Count = block.l2s.reduce((n, l2) => n + (l2.l3s?.length ?? 0), 0);
  return l3Count > 0;
}

export function getInvalidL1Labels(tree) {
  return tree.filter((b) => !l1HasAtLeastOneLink(b)).map((b) => b.label);
}

/** @returns {Set<string>} keys `l1::l2` */
export function getInvalidL2Keys(tree) {
  const keys = new Set();
  tree.forEach((b) => {
    b.l2s.forEach((l2) => {
      if (l2.hideL2Header) return;
      if (!l2HasAtLeastOneLink(l2)) keys.add(`${b.label}::${l2.label}`);
    });
  });
  return keys;
}
