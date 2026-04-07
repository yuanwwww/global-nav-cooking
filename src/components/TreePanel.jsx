import { useMemo, useState, useCallback } from "react";
import { LinkOutIcon } from "./LinkOutIcon.jsx";

function l2Key(l1, l2) {
  return `${l1}::${l2}`;
}

const DragHandle = () => (
  <span className="tree-l1__drag" aria-hidden="true">
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <circle cx="6" cy="5" r="1.3" fill="currentColor" />
      <circle cx="10" cy="5" r="1.3" fill="currentColor" />
      <circle cx="14" cy="5" r="1.3" fill="currentColor" />
      <circle cx="6" cy="10" r="1.3" fill="currentColor" />
      <circle cx="10" cy="10" r="1.3" fill="currentColor" />
      <circle cx="14" cy="10" r="1.3" fill="currentColor" />
      <circle cx="6" cy="15" r="1.3" fill="currentColor" />
      <circle cx="10" cy="15" r="1.3" fill="currentColor" />
      <circle cx="14" cy="15" r="1.3" fill="currentColor" />
    </svg>
  </span>
);

export function TreePanel({ tree, selection, onSelect }) {
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

  const toggleL2 = useCallback((l1, l2) => {
    const k = l2Key(l1, l2);
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      return next;
    });
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
      {tree.map((block) => (
        <section
          key={block.label}
          className="tree-block"
          data-tree-level="l1"
          data-tree-label={block.label}
        >
          <div
            tabIndex={0}
            className={`tree-l1${block.withDrag ? " tree-l1--with-drag" : ""}${isL1Selected(block.label) ? " is-selected" : ""}`}
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
            {block.withDrag ? <DragHandle /> : null}
            <span className="tree-l1__label">{block.label}</span>
            <button
              type="button"
              className="tree-overflow js-tree-overflow"
              aria-label={`${block.label} options`}
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          {block.l2s.map((l2) => {
            const open = expanded.has(l2Key(block.label, l2.label));
            const hdrSelected = isL2Selected(block.label, l2.label);
            return (
              <div key={l2.label} className="tree-l2">
                <div
                  className={`accordion-header js-accordion-header${hdrSelected ? " is-selected" : ""}`}
                >
                  <button
                    type="button"
                    className="accordion-header__chevron-btn"
                    aria-expanded={open}
                    aria-label={open ? `Collapse ${l2.label}` : `Expand ${l2.label}`}
                    onClick={() => toggleL2(block.label, l2.label)}
                  >
                    <span className="accordion-header__chevron" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    className="tree-l2__title js-tree-l2"
                    data-tree-level="l2"
                    data-tree-label={l2.label}
                    onClick={() =>
                      onSelect({
                        kind: "l2",
                        l1: block.label,
                        l2: l2.label,
                      })
                    }
                  >
                    {l2.label}
                  </button>
                  <button
                    type="button"
                    className="tree-overflow js-tree-overflow"
                    aria-label={`${l2.label} options`}
                  />
                </div>
                <div className={`accordion-body${open ? "" : " is-collapsed"}`}>
                  {l2.l3s.map((l3) => (
                    <a
                      key={l3}
                      href="#"
                      className={`tree-l3 js-tree-l3${isL3Selected(block.label, l2.label, l3) ? " is-selected" : ""}`}
                      data-tree-level="l3"
                      data-tree-label={l3}
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
                      <span className="tree-l3__icon" aria-hidden="true">
                        <LinkOutIcon />
                      </span>
                      <span className="tree-l3__label">{l3}</span>
                    </a>
                  ))}
                </div>
              </div>
            );
          })}
        </section>
      ))}
    </div>
  );
}
