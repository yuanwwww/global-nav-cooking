import { useMemo, useState, useCallback, useEffect, useRef } from "react";

const DND_L2 = "application/x-global-nav-l2";
const DND_L3 = "application/x-global-nav-l3";

function l2Key(l1, l2) {
  return `${l1}::${l2}`;
}

function l1SortSubtitle(block) {
  if (block.l1SortSubtitle) return block.l1SortSubtitle;
  return block.l2s.map((l) => l.label).join(", ");
}

function reorderL1Blocks(items, fromIndex, toIndex) {
  if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0) return items;
  if (fromIndex >= items.length || toIndex >= items.length) return items;
  const next = [...items];
  const [moved] = next.splice(fromIndex, 1);
  const insertAt = fromIndex < toIndex ? toIndex - 1 : toIndex;
  next.splice(insertAt, 0, moved);
  return next;
}

function SortL1Icon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M4 6h12M4 10h8M4 14h10"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M15 12l2 2-2 2"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
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

function OkayIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M5 10l3 3 7-7"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
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

function ChevronDownMdIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M5 7.5L10 12.5 15 7.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
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

  const onL1SortDragStart = useCallback((e, index) => {
    dragL1IndexRef.current = index;
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", String(index));
    setL1DraggingIndex(index);
  }, []);

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

  const handleL2DragStart = useCallback((e, l1, fromIndex, label) => {
    e.stopPropagation();
    l2DragSourceRef.current = { l1, fromIndex, label };
    const payload = JSON.stringify({ l1, fromIndex, label });
    e.dataTransfer.setData(DND_L2, payload);
    e.dataTransfer.setData("text/plain", payload);
    e.dataTransfer.effectAllowed = "move";
  }, []);

  const handleL2DragOver = useCallback((e, l1, dropIndex) => {
    const src = l2DragSourceRef.current;
    if (!src || src.l1 !== l1) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setL2DropOver({ l1, index: dropIndex });
  }, []);

  const handleL2DragLeave = useCallback((e) => {
    const next = e.relatedTarget;
    if (!next || !e.currentTarget.contains(next)) {
      setL2DropOver(null);
    }
  }, []);

  const handleL2Drop = useCallback(
    (e, blockL1, dropIndex) => {
      e.preventDefault();
      e.stopPropagation();
      setL2DropOver(null);
      let payload;
      try {
        payload = JSON.parse(e.dataTransfer.getData(DND_L2) || e.dataTransfer.getData("text/plain"));
      } catch {
        return;
      }
      if (!payload || payload.l1 !== blockL1) return;
      const { fromIndex, label } = payload;
      if (typeof fromIndex !== "number" || fromIndex === dropIndex) return;
      onL2Reorder?.(blockL1, fromIndex, dropIndex);
      setExpanded((prev) => {
        const next = new Set(prev);
        next.delete(l2Key(blockL1, label));
        return next;
      });
      l2DragSourceRef.current = null;
    },
    [onL2Reorder]
  );

  const handleL2DragEnd = useCallback(() => {
    l2DragSourceRef.current = null;
    setL2DropOver(null);
  }, []);

  const handleL3DragStart = useCallback((e, l1, l2, fromIndex, l3Label) => {
    e.stopPropagation();
    l3DragSourceRef.current = { l1, l2, fromIndex, label: l3Label };
    const payload = JSON.stringify({ l1, l2, fromIndex, label: l3Label });
    e.dataTransfer.setData(DND_L3, payload);
    e.dataTransfer.setData("text/plain", payload);
    e.dataTransfer.effectAllowed = "move";
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
      if (!payload || payload.l1 !== blockL1 || payload.l2 !== l2Label) return;
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
            <>
              <button
                type="button"
                className="btn btn--secondary btn--tree-toolbar"
                onClick={commitL1Sort}
              >
                <OkayIcon />
                Okay
              </button>
              <button type="button" className="btn btn--secondary btn--tree-toolbar">
                <AddL1Icon />
                Add L1
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className="btn btn--secondary btn--tree-toolbar"
                onClick={beginL1Sort}
              >
                <SortL1Icon />
                Sort L1
              </button>
              <button type="button" className="btn btn--secondary btn--tree-toolbar">
                <AddL1Icon />
                Add L1
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
              draggable
              aria-grabbed={l1DraggingIndex === index}
              aria-label={`${block.label}. Drag to reorder.`}
              onDragStart={(e) => onL1SortDragStart(e, index)}
              onDragEnd={onL1SortDragEnd}
            >
              <span className="tree-panel__l1-sort-drag" aria-hidden="true">
                <DragIndicatorIcon />
              </span>
              <div className="tree-panel__l1-sort-text">
                <span className="tree-panel__l1-sort-title">{block.label}</span>
                <span className="tree-panel__l1-sort-sub">{l1SortSubtitle(block)}</span>
              </div>
              {block.l1SortChevron ? (
                <span className="tree-panel__l1-sort-chevron" aria-hidden="true">
                  <ChevronDownMdIcon />
                </span>
              ) : null}
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
              <button
                type="button"
                className="tree-overflow js-tree-overflow"
                aria-label={`${block.label} options`}
                onClick={(e) => e.stopPropagation()}
              />
            </div>

            {block.l2s.map((l2, l2Index) => {
              const open = expanded.has(l2Key(block.label, l2.label));
              const hdrSelected = isL2Selected(block.label, l2.label);
              const l2RowDropActive =
                l2DropOver?.l1 === block.label && l2DropOver?.index === l2Index;
              return (
                <div
                  key={l2Key(block.label, l2.label)}
                  className={`tree-l2${l2RowDropActive ? " tree-l2--drop-hover" : ""}`}
                  onDragOver={(e) => handleL2DragOver(e, block.label, l2Index)}
                  onDragLeave={handleL2DragLeave}
                  onDrop={(e) => handleL2Drop(e, block.label, l2Index)}
                >
                  <div
                    className={`accordion-header js-accordion-header${hdrSelected ? " is-selected" : ""}`}
                    onClick={(e) => {
                      if (
                        e.target.closest(".tree-row__drag-handle--l2") ||
                        e.target.closest(".tree-overflow")
                      ) {
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
                    <button
                      type="button"
                      className="tree-l2__title js-tree-l2"
                      data-tree-level="l2"
                      data-tree-label={l2.label}
                    >
                      {l2.label}
                    </button>
                    <button
                      type="button"
                      className="tree-overflow js-tree-overflow"
                      aria-label={`${l2.label} options`}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                  <div className={`accordion-body${open ? "" : " is-collapsed"}`}>
                    {l2.l3s.map((l3, l3Index) => {
                      const l3RowDropActive =
                        l3DropOver?.l1 === block.label &&
                        l3DropOver?.l2 === l2.label &&
                        l3DropOver?.index === l3Index;
                      return (
                      <a
                        key={`${l2Key(block.label, l2.label)}::${l3}`}
                        href="#"
                        draggable={false}
                        className={`tree-l3 js-tree-l3${isL3Selected(block.label, l2.label, l3) ? " is-selected" : ""}${l3RowDropActive ? " tree-l3--drop-hover" : ""}`}
                        data-tree-level="l3"
                        data-tree-label={l3}
                        onDragOver={(e) => handleL3DragOver(e, block.label, l2.label, l3Index)}
                        onDragLeave={handleL3DragLeave}
                        onDrop={(e) => handleL3Drop(e, block.label, l2.label, l3Index)}
                        onClick={(e) => {
                          e.preventDefault();
                          onSelect({
                            kind: "l3",
                            l1: block.label,
                            l2: l2.label,
                            l3,
                          });
                        }}
                      >
                        <span
                          className="tree-row__drag-handle tree-row__drag-handle--l3"
                          role="button"
                          tabIndex={-1}
                          aria-label={`Drag to reorder ${l3}`}
                          draggable
                          onDragStart={(e) =>
                            handleL3DragStart(e, block.label, l2.label, l3Index, l3)
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
                        <span className="tree-l3__label">{l3}</span>
                      </a>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </section>
        ))
      )}
    </div>
  );
}
