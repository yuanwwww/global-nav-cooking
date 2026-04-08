/** Immutable nav tree edits */

export function addL2Child(tree, l1Label, l2Entry) {
  return tree.map((b) =>
    b.label === l1Label ? { ...b, l2s: [...b.l2s, { ...l2Entry }] } : b
  );
}

export function addL3Child(tree, l1Label, l2Label, l3Label) {
  return tree.map((b) => {
    if (b.label !== l1Label) return b;
    return {
      ...b,
      l2s: b.l2s.map((l2) =>
        l2.label === l2Label ? { ...l2, l3s: [...l2.l3s, l3Label] } : l2
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

export function removeL3Child(tree, l1Label, l2Label, l3Label) {
  return tree.map((b) => {
    if (b.label !== l1Label) return b;
    return {
      ...b,
      l2s: b.l2s.map((l2) =>
        l2.label === l2Label ? { ...l2, l3s: l2.l3s.filter((x) => x !== l3Label) } : l2
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
          ? { ...l2, l3s: l2.l3s.map((x) => (x === oldL3Label ? newL3Label : x)) }
          : l2
      ),
    };
  });
}

function reorderByIndex(list, fromIndex, toIndex) {
  if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0) return list;
  if (fromIndex >= list.length || toIndex >= list.length) return list;
  const next = [...list];
  const [moved] = next.splice(fromIndex, 1);
  const insertAt = fromIndex < toIndex ? toIndex - 1 : toIndex;
  next.splice(insertAt, 0, moved);
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
