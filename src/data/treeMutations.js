/** Immutable nav tree edits */

import { NAV_TYPE_PLAIN_TEXT } from "./navTypes.js";

/** @param {string | { label: string; navType?: string; navLink?: string }} l3 */
export function l3Label(l3) {
  if (l3 == null) return "";
  return typeof l3 === "string" ? l3 : l3.label ?? "";
}

function normalizeL3Object(entry) {
  const label = entry.label ?? "Untitled";
  const navType = entry.navType ?? "collection";
  if (navType === NAV_TYPE_PLAIN_TEXT) {
    return { label, navType: NAV_TYPE_PLAIN_TEXT };
  }
  const navLink = typeof entry.navLink === "string" ? entry.navLink.trim() : "";
  return {
    label,
    navType,
    ...(navLink !== "" ? { navLink } : {}),
  };
}

/** Append a new top-level (L1) block. */
export function addL1Block(tree, block) {
  return [...tree, block];
}

/** Remove a top-level (L1) block by label. */
export function removeL1Block(tree, l1Label) {
  return tree.filter((b) => b.label !== l1Label);
}

/**
 * @param {"column" | "item"} level — Column (L2): empty L2 list; Item (L3): one default L2 row for L3 links.
 * @param {{ navType?: string; navLink?: string }} [meta] — matches L1 detail rail: Type + Link.
 */
export function createNewL1Block(label, level, meta = {}) {
  const navType = meta.navType ?? "collection";
  const navLink = typeof meta.navLink === "string" ? meta.navLink.trim() : "";
  if (navType === NAV_TYPE_PLAIN_TEXT) {
    const base = { label, navType: NAV_TYPE_PLAIN_TEXT };
    if (level === "item") {
      return { ...base, l2s: [{ label: "New column", l3s: [] }] };
    }
    return { ...base, l2s: [] };
  }
  const base = {
    label,
    navType,
    ...(navLink !== "" ? { navLink } : {}),
  };
  if (level === "item") {
    return {
      ...base,
      l2s: [{ label: "New column", l3s: [] }],
    };
  }
  return { ...base, l2s: [] };
}

export function addL2Child(tree, l1Label, l2Entry) {
  return tree.map((b) =>
    b.label === l1Label ? { ...b, l2s: [...b.l2s, { ...l2Entry }] } : b
  );
}

export function addL3Child(tree, l1Label, l2Label, l3Entry) {
  const entry =
    typeof l3Entry === "string" ? l3Entry : normalizeL3Object(l3Entry);
  return tree.map((b) => {
    if (b.label !== l1Label) return b;
    return {
      ...b,
      l2s: b.l2s.map((l2) =>
        l2.label === l2Label ? { ...l2, l3s: [...l2.l3s, entry] } : l2
      ),
    };
  });
}

export function removeL2Child(tree, l1Label, l2Label) {
  return tree.map((b) =>
    b.label === l1Label ? { ...b, l2s: b.l2s.filter((l2) => l2.label !== l2Label) } : b
  );
}

export function renameL2Child(tree, l1Label, oldL2Label, newL2Label) {
  return tree.map((b) => {
    if (b.label !== l1Label) return b;
    return {
      ...b,
      l2s: b.l2s.map((l2) =>
        l2.label === oldL2Label ? { ...l2, label: newL2Label } : l2
      ),
    };
  });
}

export function removeL3Child(tree, l1Label, l2Label, label) {
  return tree.map((b) => {
    if (b.label !== l1Label) return b;
    return {
      ...b,
      l2s: b.l2s.map((l2) =>
        l2.label === l2Label
          ? { ...l2, l3s: l2.l3s.filter((x) => l3Label(x) !== label) }
          : l2
      ),
    };
  });
}

export function renameL3Child(tree, l1Label, l2Label, oldL3Label, newL3Label) {
  return tree.map((b) => {
    if (b.label !== l1Label) return b;
    return {
      ...b,
      l2s: b.l2s.map((l2) =>
        l2.label === l2Label
          ? {
              ...l2,
              l3s: l2.l3s.map((x) => {
                if (l3Label(x) !== oldL3Label) return x;
                if (typeof x === "string") return newL3Label;
                return { ...x, label: newL3Label };
              }),
            }
          : l2
      ),
    };
  });
}

/**
 * Move one item to `toIndex` (0-based row the user dropped on).
 * After removing `fromIndex`, insert at `toIndex` so the item lands on that slot — no extra -1.
 */
export function reorderByIndex(list, fromIndex, toIndex) {
  if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0) return list;
  if (fromIndex >= list.length || toIndex >= list.length) return list;
  const next = [...list];
  const [moved] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, moved);
  return next;
}

/** Reorder L2 rows within one L1 block */
export function reorderL2Children(tree, l1Label, fromIndex, toIndex) {
  return tree.map((b) => {
    if (b.label !== l1Label) return b;
    return { ...b, l2s: reorderByIndex(b.l2s, fromIndex, toIndex) };
  });
}

/** Reorder L3 labels within one L2 */
export function reorderL3Children(tree, l1Label, l2Label, fromIndex, toIndex) {
  return tree.map((b) => {
    if (b.label !== l1Label) return b;
    return {
      ...b,
      l2s: b.l2s.map((l2) =>
        l2.label === l2Label ? { ...l2, l3s: reorderByIndex(l2.l3s, fromIndex, toIndex) } : l2
      ),
    };
  });
}

export function uniqueAmong(base, existing) {
  const trimmed = (base || "").trim() || "Untitled";
  if (!existing.includes(trimmed)) return trimmed;
  let n = 2;
  while (existing.includes(`${trimmed} (${n})`)) n += 1;
  return `${trimmed} (${n})`;
}

/**
 * @param {string} l1Label
 * @param {{ displayName: string; navType: string; navLink: string }} fields
 */
export function updateL1Block(tree, l1Label, { displayName, navType, navLink }) {
  const otherL1 = tree.map((b) => b.label).filter((l) => l !== l1Label);
  const finalName = uniqueAmong((displayName || "").trim() || "Untitled", otherL1);
  const linkTrim = typeof navLink === "string" ? navLink.trim() : "";
  const newTree = tree.map((b) => {
    if (b.label !== l1Label) return b;
    const resolvedNavType = navType ?? b.navType ?? "collection";
    let next = {
      ...b,
      label: finalName,
      navType: resolvedNavType,
    };
    if (resolvedNavType === NAV_TYPE_PLAIN_TEXT) {
      const { navLink: _r, ...rest } = next;
      next = rest;
    } else if (linkTrim === "") {
      const { navLink: _n, ...rest } = next;
      next = rest;
    } else {
      next = { ...next, navLink: linkTrim };
    }
    return next;
  });
  return { tree: newTree, resolved: { l1: finalName } };
}

/**
 * @param {{ displayName: string; navLink: string }} fields
 */
export function updateL2Entry(tree, l1Label, l2Label, { displayName, navLink }) {
  let finalL2 = l2Label;
  const newTree = tree.map((b) => {
    if (b.label !== l1Label) return b;
    const siblings = b.l2s.map((l) => l.label).filter((x) => x !== l2Label);
    return {
      ...b,
      l2s: b.l2s.map((l2) => {
        if (l2.label !== l2Label) return l2;
        finalL2 = uniqueAmong((displayName || "").trim() || "Untitled", siblings);
        const linkTrim = typeof navLink === "string" ? navLink.trim() : "";
        let next = { ...l2, label: finalL2 };
        if (linkTrim === "") {
          const { navLink: _n, ...rest } = next;
          next = rest;
        } else {
          next = { ...next, navLink: linkTrim };
        }
        return next;
      }),
    };
  });
  return { tree: newTree, resolved: { l1: l1Label, l2: finalL2 } };
}

function ensureL3Object(x) {
  if (x == null) return { label: "Untitled", navType: "link" };
  if (typeof x === "string") return { label: x, navType: "link" };
  return { ...x, label: x.label ?? "Untitled" };
}

/**
 * @param {string} oldL3Label
 * @param {{ displayName: string; navType: string; navLink: string }} fields
 */
export function updateL3Entry(tree, l1Label, l2Label, oldL3Label, { displayName, navType, navLink }) {
  let finalL3 = oldL3Label;
  const newTree = tree.map((b) => {
    if (b.label !== l1Label) return b;
    return {
      ...b,
      l2s: b.l2s.map((l2) => {
        if (l2.label !== l2Label) return l2;
        const taken = (l2.l3s ?? []).map((x) => l3Label(x)).filter((s) => s !== oldL3Label);
        return {
          ...l2,
          l3s: l2.l3s.map((x) => {
            if (l3Label(x) !== oldL3Label) return x;
            finalL3 = uniqueAmong((displayName || "").trim() || "Untitled", taken);
            const linkTrim = typeof navLink === "string" ? navLink.trim() : "";
            const resolvedType = navType ?? "collection";
            if (resolvedType === NAV_TYPE_PLAIN_TEXT) {
              return { label: finalL3, navType: NAV_TYPE_PLAIN_TEXT };
            }
            let o = { ...ensureL3Object(x), label: finalL3, navType: resolvedType };
            if (linkTrim === "") {
              const { navLink: _n, ...rest } = o;
              o = rest;
            } else {
              o = { ...o, navLink: linkTrim };
            }
            return o;
          }),
        };
      }),
    };
  });
  return { tree: newTree, resolved: { l1: l1Label, l2: l2Label, l3: finalL3 } };
}
