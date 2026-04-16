import { useMemo, useState, useCallback, useEffect, useLayoutEffect, useRef } from "react";
import { reorderByIndex, l3Label } from "../data/treeMutations.js";
import { setTreeDragImage } from "../treeDragGhost.js";
import { IconErrorWarning, IconTrash } from "./RailIcons.jsx";
import { l1HasAtLeastOneLink, l2HasAtLeastOneLink } from "../navValidation.js";

const DND_L2 = "application/x-global-nav-l2";
const DND_L3 = "application/x-global-nav-l3";

function l2Key(l1, l2) {
  return `${l1}::${l2}`;
}

function l1SortSubtitle(block) {
  if (block.l1SortSubtitle) return block.l1SortSubtitle;
  return block.l2s
    .map((l) =>
      l.hideL2Header ? (l.l3s ?? []).map(l3Label).join(", ") : l.label
    )
    .join(", ");
}

function reorderL1Blocks(items, fromIndex, toIndex) {
  return reorderByIndex(items, fromIndex, toIndex);
}

function AddL1Icon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M10 4.5v11M4.5 10h11"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function DragIndicatorIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <circle cx="6" cy="5" r="1.5" fill="currentColor" />
      <circle cx="12" cy="5" r="1.5" fill="currentColor" />
      <circle cx="6" cy="10" r="1.5" fill="currentColor" />
      <circle cx="12" cy="10" r="1.5" fill="currentColor" />
      <circle cx="6" cy="15" r="1.5" fill="currentColor" />
      <circle cx="12" cy="15" r="1.5" fill="currentColor" />
    </svg>
  );
}

export function TreePanel({
  tree,
  selection,
  onSelect,
  onL1Reorder,
  onL2Reorder,
  onL3Reorder,
  layoutVariant = "a",
  expandL2Target = null,
  onExpandL2Consumed,
  onAddSection,
  scrollToL1Label = null,
  onScrollToL1Consumed,
  onRequestDelete,
}) {
  const allL2Keys = useMemo(() => {
    const keys = [];
    tree.forEach((block) => {
      block.l2s.forEach((l2) => {
        keys.push(l2Key(block.label, l2.label));
      });
    });
    return keys;
  }, [tree]);

  const [expanded, setExpanded] = useState(() => new Set(allL2Keys));
  const [l1SortMode, setL1SortMode] = useState(false);
  const [sortBlocks, setSortBlocks] = useState([]);
  const dragL1IndexRef = useRef(null);
  const [l1DraggingIndex, setL1DraggingIndex] = useState(null);
  const [l1DragOverIndex, setL1DragOverIndex] = useState(null);
  const [l2DropOver, setL2DropOver] = useState(null);
  const [l3DropOver, setL3DropOver] = useState(null);
  /** dragOver cannot read dataTransfer; mirrors payload for valid drop targets */
  const l2DragSourceRef = useRef(null);
  const l3DragSourceRef = useRef(null);
  /** L2 DnD: snapshot full expansion; restore on drag end (other L1s stay as-is during drag). */
  const expandedBeforeL2DragRef = useRef(null);
  /** Latest expanded Set (drag start must not sync setState before drag locks — avoids cancelling DnD mid-start) */
  const expandedRef = useRef(expanded);
  expandedRef.current = expanded;
  /** JSON string from dragstart — drop sometimes loses custom MIME; use as fallback */
  const l2DragPayloadStrRef = useRef(null);
  const l2WindowDragOverRef = useRef(null);
  const l2CollapseTimeoutRef = useRef(null);

  useEffect(() => {
    if (layoutVariant !== "b") setL1SortMode(false);
  }, [layoutVariant]);

  useEffect(() => {
    if (!expandL2Target) return;
    const { l1, l2 } = expandL2Target;
    setExpanded((prev) => {
      const next = new Set(prev);
      next.add(l2Key(l1, l2));
      return next;
    });
    onExpandL2Consumed?.();
  }, [expandL2Target, onExpandL2Consumed]);

  const toggleL2 = useCallback((l1, l2) => {
    const k = l2Key(l1, l2);
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      return next;
    });
  }, []);

  const beginL1Sort = useCallback(() => {
    setSortBlocks([...tree]);
    setL1SortMode(true);
    onSelect(null);
  }, [tree, onSelect]);

  const commitL1Sort = useCallback(() => {
    onL1Reorder?.([...sortBlocks]);
    setL1SortMode(false);
  }, [onL1Reorder, sortBlocks]);

  const cancelL1Sort = useCallback(() => {
    setL1SortMode(false);
    setSortBlocks([]);
    dragL1IndexRef.current = null;
    setL1DraggingIndex(null);
    setL1DragOverIndex(null);
  }, []);

  /** Draft list only; commit applies removal. At least one L1 must remain. */
  const removeSortBlockAt = useCallback((index) => {
    setSortBlocks((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((_, i) => i !== index);
    });
    dragL1IndexRef.current = null;
    setL1DraggingIndex(null);
    setL1DragOverIndex(null);
  }, []);

  const onL1SortDragStart = useCallback(
    (e, index) => {
      dragL1IndexRef.current = index;
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", String(index));
      setL1DraggingIndex(index);
      const t = sortBlocks[index]?.label ?? "";
      if (t) setTreeDragImage(e.dataTransfer, e.nativeEvent, { level: "l1", title: t });
    },
    [sortBlocks]
  );

  /** Board-level handlers: inner text/SVG gets dragover/drop targets — row handlers never saw preventDefault */
  const onL1SortBoardDragOver = useCallback((e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    const row = e.target.closest?.("[data-l1-sort-index]");
    if (row && e.currentTarget.contains(row)) {
      setL1DragOverIndex(Number(row.dataset.l1SortIndex));
    } else {
      setL1DragOverIndex(null);
    }
  }, []);

  const onL1SortBoardDragLeave = useCallback((e) => {
    const next = e.relatedTarget;
    if (!next || !e.currentTarget.contains(next)) {
      setL1DragOverIndex(null);
    }
  }, []);

  const onL1SortBoardDrop = useCallback((e) => {
    e.preventDefault();
    const row = e.target.closest?.("[data-l1-sort-index]");
    if (!row || !e.currentTarget.contains(row)) {
      setL1DraggingIndex(null);
      setL1DragOverIndex(null);
      return;
    }
    const dropIndex = Number(row.dataset.l1SortIndex);
    const raw = e.dataTransfer.getData("text/plain");
    const from = dragL1IndexRef.current ?? (raw !== "" ? Number(raw) : NaN);
    dragL1IndexRef.current = null;
    if (Number.isNaN(from) || Number.isNaN(dropIndex)) {
      setL1DraggingIndex(null);
      setL1DragOverIndex(null);
      return;
    }
    setSortBlocks((prev) => reorderL1Blocks(prev, from, dropIndex));
    setL1DraggingIndex(null);
    setL1DragOverIndex(null);
  }, []);

  const onL1SortDragEnd = useCallback(() => {
    dragL1IndexRef.current = null;
    setL1DraggingIndex(null);
    setL1DragOverIndex(null);
  }, []);

  /** L2 DnD is scoped to one L1 block only (payload.l1 / src.l1); collapse only that block’s L2 rows. */
  const handleL2DragStart = useCallback(
    (e, l1, fromIndex, label) => {
      e.stopPropagation();
      if (l2WindowDragOverRef.current) {
        window.removeEventListener("dragover", l2WindowDragOverRef.current);
        l2WindowDragOverRef.current = null;
      }
      if (l2CollapseTimeoutRef.current) {
        window.clearTimeout(l2CollapseTimeoutRef.current);
        l2CollapseTimeoutRef.current = null;
      }
      l2DragSourceRef.current = { l1, fromIndex, label };
      const payload = JSON.stringify({ kind: "l2", l1, fromIndex, label });
      l2DragPayloadStrRef.current = payload;
      e.dataTransfer.setData(DND_L2, payload);
      e.dataTransfer.setData("text/plain", payload);
      e.dataTransfer.effectAllowed = "move";
      setTreeDragImage(e.dataTransfer, e.nativeEvent, { level: "l2", title: label });
      expandedBeforeL2DragRef.current = new Set(expandedRef.current);
      const block = tree.find((b) => b.label === l1);
      const collapseKeys = block?.l2s.map((l2) => l2Key(l1, l2.label)) ?? [];
      /** Defer so re-render does not replace the drag source node mid-start. */
      l2CollapseTimeoutRef.current = window.setTimeout(() => {
        l2CollapseTimeoutRef.current = null;
        setExpanded((prev) => {
          const next = new Set(prev);
          collapseKeys.forEach((k) => next.delete(k));
          return next;
        });
      }, 0);
      const onWin = (ev) => {
        const src = l2DragSourceRef.current;
        if (!src) return;
        /** Allow drop only for valid HTML5 DnD target; same-L1 hit-testing is on section capture. */
        ev.preventDefault();
        ev.dataTransfer.dropEffect = "move";
      };
      l2WindowDragOverRef.current = onWin;
      window.addEventListener("dragover", onWin, { passive: false });
    },
    [tree]
  );

  /** Same idea as L1 sort board: inner controls often miss bubbling dragOver; capture on the L1 block. */
  /** Drop highlight + preventDefault only when reordering within the source L1. */
  const handleL2BlockDragOverCapture = useCallback((e) => {
    const blockL1 = e.currentTarget.getAttribute("data-tree-label");
    if (!blockL1) return;
    const src = l2DragSourceRef.current;
    if (!src || src.l1 !== blockL1) return;
    const row = e.target.closest?.("[data-l2-row-index]");
    if (!row || !e.currentTarget.contains(row)) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    const idx = Number(row.dataset.l2RowIndex);
    if (!Number.isNaN(idx)) {
      setL2DropOver({ l1: blockL1, index: idx });
    }
  }, []);

  const handleL2BlockDragLeave = useCallback((e) => {
    const next = e.relatedTarget;
    if (!next || !e.currentTarget.contains(next)) {
      setL2DropOver(null);
    }
  }, []);

  const applyL2Drop = useCallback(
    (blockL1, dropIndex, payload) => {
      if (!payload || payload.kind !== "l2" || payload.l1 !== blockL1) return; /* cross-L1 drop ignored */
      const { fromIndex } = payload;
      if (typeof fromIndex !== "number" || fromIndex === dropIndex) return;
      onL2Reorder?.(blockL1, fromIndex, dropIndex);
    },
    [onL2Reorder]
  );

  const handleL2DragEnd = useCallback(() => {
    if (l2CollapseTimeoutRef.current) {
      window.clearTimeout(l2CollapseTimeoutRef.current);
      l2CollapseTimeoutRef.current = null;
    }
    if (l2WindowDragOverRef.current) {
      window.removeEventListener("dragover", l2WindowDragOverRef.current);
      l2WindowDragOverRef.current = null;
    }
    l2DragSourceRef.current = null;
    l2DragPayloadStrRef.current = null;
    setL2DropOver(null);
    const snap = expandedBeforeL2DragRef.current;
    expandedBeforeL2DragRef.current = null;
    if (snap != null) {
      const keys = Array.from(snap);
      /** Updater + fresh Set so restore always wins over any in-flight collapse update */
      queueMicrotask(() => {
        setExpanded(() => new Set(keys));
      });
    }
  }, []);

  const handleL3DragStart = useCallback((e, l1, l2, fromIndex, l3Label) => {
    e.stopPropagation();
    l3DragSourceRef.current = { l1, l2, fromIndex, label: l3Label };
    const payload = JSON.stringify({ kind: "l3", l1, l2, fromIndex, label: l3Label });
    e.dataTransfer.setData(DND_L3, payload);
    e.dataTransfer.setData("text/plain", payload);
    e.dataTransfer.effectAllowed = "move";
    setTreeDragImage(e.dataTransfer, e.nativeEvent, { level: "l3", title: l3Label });
  }, []);

  const handleL3DragOver = useCallback((e, l1, l2, dropIndex) => {
    const src = l3DragSourceRef.current;
    if (!src || src.l1 !== l1 || src.l2 !== l2) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setL3DropOver({ l1, l2, index: dropIndex });
  }, []);

  const handleL3DragLeave = useCallback((e) => {
    const next = e.relatedTarget;
    if (!next || !e.currentTarget.contains(next)) {
      setL3DropOver(null);
    }
  }, []);

  const handleL3Drop = useCallback(
    (e, blockL1, l2Label, dropIndex) => {
      e.preventDefault();
      e.stopPropagation();
      setL3DropOver(null);
      let payload;
      try {
        payload = JSON.parse(e.dataTransfer.getData(DND_L3) || e.dataTransfer.getData("text/plain"));
      } catch {
        return;
      }
      if (!payload || payload.kind !== "l3" || payload.l1 !== blockL1 || payload.l2 !== l2Label) return;
      const { fromIndex } = payload;
      if (typeof fromIndex !== "number" || fromIndex === dropIndex) return;
      onL3Reorder?.(blockL1, l2Label, fromIndex, dropIndex);
      l3DragSourceRef.current = null;
    },
    [onL3Reorder]
  );

  const handleL3DragEnd = useCallback(() => {
    l3DragSourceRef.current = null;
    setL3DropOver(null);
  }, []);

  useLayoutEffect(() => {
    if (!scrollToL1Label) return;
    const label = scrollToL1Label;
    const el = document.querySelector(
      `.tree-block[data-tree-label="${CSS.escape(label)}"]`
    );
    if (el) {
      el.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
    onScrollToL1Consumed?.();
  }, [scrollToL1Label, tree, onScrollToL1Consumed]);

  const isL1Selected = (label) =>
    selection?.kind === "l1" && selection.l1 === label;
  const isL2Selected = (l1, l2) =>
    selection?.kind === "l2" && selection.l1 === l1 && selection.l2 === l2;
  const isL3Selected = (l1, l2, l3) =>
    selection?.kind === "l3" &&
    selection.l1 === l1 &&
    selection.l2 === l2 &&
    selection.l3 === l3;

  return (
    <div className="tree-panel" id="tree-panel">
      {layoutVariant === "b" ? (
        <div className="tree-panel__toolbar" role="toolbar" aria-label="Top-level section actions">
          {l1SortMode ? (
            <div className="tree-panel__sort-toolbar">
              <div className="tree-panel__sort-cta-row">
                <button
                  type="button"
                  className="btn btn--tree-sort-cancel btn--tree-toolbar"
                  onClick={cancelL1Sort}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn--secondary btn--signal-outline btn--tree-toolbar"
                  onClick={commitL1Sort}
                >
                  Confirm changes
                </button>
              </div>
              <p className="tree-panel__sort-hint">
                Click Confirm changes to save changes made to L1
              </p>
            </div>
          ) : (
            <>
              <button
                type="button"
                className="btn btn--secondary btn--tree-toolbar"
                onClick={beginL1Sort}
              >
                Reorder Sections
              </button>
              <button
                type="button"
                className="btn btn--secondary btn--tree-toolbar"
                onClick={() => onAddSection?.()}
              >
                <AddL1Icon />
                Add Section
              </button>
            </>
          )}
        </div>
      ) : null}

      {layoutVariant === "b" && l1SortMode ? (
        <div
          className="tree-panel__l1-sort-board"
          role="list"
          aria-label="Reorder top-level sections"
          onDragOver={onL1SortBoardDragOver}
          onDragLeave={onL1SortBoardDragLeave}
          onDrop={onL1SortBoardDrop}
        >
          {sortBlocks.map((block, index) => (
            <div
              key={block.label}
              data-l1-sort-index={index}
              className={`tree-panel__l1-sort-row${l1DraggingIndex === index ? " tree-panel__l1-sort-row--dragging" : ""}${l1DragOverIndex === index ? " tree-panel__l1-sort-row--over" : ""}`}
              role="listitem"
              aria-label={block.label}
            >
              <span
                className="tree-panel__l1-sort-drag"
                draggable
                aria-grabbed={l1DraggingIndex === index}
                aria-label={`Drag to reorder ${block.label}`}
                onDragStart={(e) => onL1SortDragStart(e, index)}
                onDragEnd={onL1SortDragEnd}
              >
                <DragIndicatorIcon />
              </span>
              <div className="tree-panel__l1-sort-text">
                <span className="tree-panel__l1-sort-title">{block.label}</span>
                <span className="tree-panel__l1-sort-sub">{l1SortSubtitle(block)}</span>
              </div>
              <button
                type="button"
                className="tree-panel__l1-sort-delete"
                aria-label={`Remove ${block.label}`}
                disabled={sortBlocks.length <= 1}
                onClick={(e) => {
                  e.stopPropagation();
                  removeSortBlockAt(index);
                }}
              >
                <IconTrash className="tree-panel__l1-sort-delete__icon" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        tree.map((block) => (
          <section
            key={block.label}
            className="tree-block"
            data-tree-level="l1"
            data-tree-label={block.label}
            onDragOverCapture={handleL2BlockDragOverCapture}
            onDragLeave={handleL2BlockDragLeave}
            onDrop={(e) => {
              const raw =
                e.dataTransfer.getData(DND_L2) ||
                e.dataTransfer.getData("text/plain") ||
                l2DragPayloadStrRef.current ||
                "";
              let payload;
              try {
                payload = raw ? JSON.parse(raw) : null;
              } catch {
                return;
              }
              if (!payload || payload.kind !== "l2") return;
              const blockL1 = e.currentTarget.getAttribute("data-tree-label");
              if (payload.l1 !== blockL1) return;
              e.preventDefault();
              e.stopPropagation();
              const row = e.target.closest?.("[data-l2-row-index]");
              if (!row || !e.currentTarget.contains(row)) {
                setL2DropOver(null);
                return;
              }
              const dropIndex = Number(row.dataset.l2RowIndex);
              if (Number.isNaN(dropIndex)) return;
              setL2DropOver(null);
              applyL2Drop(blockL1, dropIndex, payload);
            }}
          >
            <div
              tabIndex={0}
              className={`tree-l1${block.l1TightPadding ? " tree-l1--tight" : ""}${isL1Selected(block.label) ? " is-selected" : ""}`}
              data-tree-level="l1"
              data-tree-label={block.label}
              onClick={() => onSelect({ kind: "l1", l1: block.label })}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelect({ kind: "l1", l1: block.label });
                }
              }}
            >
              <span className="tree-l1__label">{block.label}</span>
              {!l1HasAtLeastOneLink(block) ? (
                <span className="tree-row__validation-icon" aria-hidden="true">
                  <IconErrorWarning className="tree-row__validation-icon__svg" />
                </span>
              ) : null}
              <button
                type="button"
                className="tree-row__delete tree-row__delete--l1"
                aria-label={`Remove ${block.label}`}
                tabIndex={-1}
                disabled={tree.length <= 1}
                onClick={(e) => {
                  e.stopPropagation();
                  onRequestDelete?.({ kind: "l1", l1: block.label });
                }}
              >
                <IconTrash className="tree-row__delete__icon" aria-hidden="true" />
              </button>
            </div>

            {block.l2s.map((l2, l2Index) => {
              const open = l2.hideL2Header || expanded.has(l2Key(block.label, l2.label));
              const hdrSelected = isL2Selected(block.label, l2.label);
              const l2RowDropActive =
                l2DropOver?.l1 === block.label && l2DropOver?.index === l2Index;

              const l3Rows = l2.l3s.map((l3, l3Index) => {
                const lab = l3Label(l3);
                const l3RowDropActive =
                  l3DropOver?.l1 === block.label &&
                  l3DropOver?.l2 === l2.label &&
                  l3DropOver?.index === l3Index;
                return (
                  <div
                    key={`${l2Key(block.label, l2.label)}::${lab}`}
                    role="treeitem"
                    tabIndex={0}
                    className={`tree-l3 js-tree-l3${isL3Selected(block.label, l2.label, lab) ? " is-selected" : ""}${l3RowDropActive ? " tree-l3--drop-hover" : ""}`}
                    data-tree-level="l3"
                    data-tree-label={lab}
                    onDragOver={(e) => handleL3DragOver(e, block.label, l2.label, l3Index)}
                    onDragLeave={handleL3DragLeave}
                    onDrop={(e) => handleL3Drop(e, block.label, l2.label, l3Index)}
                    onClick={(e) => {
                      if (e.target.closest(".tree-row__drag-handle--l3, .tree-row__delete--l3")) {
                        return;
                      }
                      onSelect({
                        kind: "l3",
                        l1: block.label,
                        l2: l2.label,
                        l3: lab,
                      });
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        onSelect({
                          kind: "l3",
                          l1: block.label,
                          l2: l2.label,
                          l3: lab,
                        });
                      }
                    }}
                  >
                    <span
                      className="tree-row__drag-handle tree-row__drag-handle--l3"
                      role="button"
                      tabIndex={-1}
                      aria-label={`Drag to reorder ${lab}`}
                      draggable
                      onDragStart={(e) =>
                        handleL3DragStart(e, block.label, l2.label, l3Index, lab)
                      }
                      onDragEnd={handleL3DragEnd}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      onMouseDown={(e) => e.stopPropagation()}
                    >
                      <DragIndicatorIcon />
                    </span>
                    <span className="tree-l3__spacer" aria-hidden="true" />
                    <span className="tree-l3__label">{lab}</span>
                    <button
                      type="button"
                      className="tree-row__delete tree-row__delete--l3"
                      aria-label={`Remove ${lab}`}
                      tabIndex={-1}
                      onClick={(e) => {
                        e.stopPropagation();
                        onRequestDelete?.({
                          kind: "l3",
                          l1: block.label,
                          l2: l2.label,
                          l3: lab,
                        });
                      }}
                    >
                      <IconTrash className="tree-row__delete__icon" aria-hidden="true" />
                    </button>
                  </div>
                );
              });

              if (l2.hideL2Header) {
                return (
                  <div
                    key={l2Key(block.label, l2.label)}
                    className={`tree-l2 tree-l2--flat${l2RowDropActive ? " tree-l2--drop-hover" : ""}`}
                    data-l2-row-index={l2Index}
                  >
                    <div className="accordion-body tree-l2__flat-body">{l3Rows}</div>
                  </div>
                );
              }

              return (
                <div
                  key={l2Key(block.label, l2.label)}
                  className={`tree-l2${l2RowDropActive ? " tree-l2--drop-hover" : ""}`}
                  data-l2-row-index={l2Index}
                >
                  <div
                    className={`accordion-header js-accordion-header${hdrSelected ? " is-selected" : ""}`}
                    onClick={(e) => {
                      if (e.target.closest(".tree-row__drag-handle--l2, .tree-row__delete--l2")) {
                        return;
                      }
                      onSelect({
                        kind: "l2",
                        l1: block.label,
                        l2: l2.label,
                      });
                    }}
                  >
                    <span
                      className="tree-row__drag-handle tree-row__drag-handle--l2"
                      role="button"
                      tabIndex={-1}
                      aria-label={`Drag to reorder ${l2.label}`}
                      draggable
                      onDragStart={(e) =>
                        handleL2DragStart(e, block.label, l2Index, l2.label)
                      }
                      onDragEnd={handleL2DragEnd}
                      onMouseDown={(e) => e.stopPropagation()}
                    >
                      <DragIndicatorIcon />
                    </span>
                    <button
                      type="button"
                      className="accordion-header__chevron-btn"
                      aria-expanded={open}
                      aria-label={open ? `Collapse ${l2.label}` : `Expand ${l2.label}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleL2(block.label, l2.label);
                      }}
                    >
                      <span className="accordion-header__chevron" aria-hidden="true" />
                    </button>
                    <div className="tree-l2__title-group">
                      <button
                        type="button"
                        className="tree-l2__title js-tree-l2"
                        data-tree-level="l2"
                        data-tree-label={l2.label}
                      >
                        <span className="tree-l2__title-text">{l2.label}</span>
                      </button>
                      {!l2HasAtLeastOneLink(l2) ? (
                        <span className="tree-row__validation-icon" aria-hidden="true">
                          <IconErrorWarning className="tree-row__validation-icon__svg" />
                        </span>
                      ) : null}
                    </div>
                    <button
                      type="button"
                      className="tree-row__delete tree-row__delete--l2"
                      aria-label={`Remove ${l2.label}`}
                      tabIndex={-1}
                      onClick={(e) => {
                        e.stopPropagation();
                        onRequestDelete?.({ kind: "l2", l1: block.label, l2: l2.label });
                      }}
                    >
                      <IconTrash className="tree-row__delete__icon" aria-hidden="true" />
                    </button>
                  </div>
                  <div className={`accordion-body${open ? "" : " is-collapsed"}`}>{l3Rows}</div>
                </div>
              );
            })}
          </section>
        ))
      )}
    </div>
  );
}
