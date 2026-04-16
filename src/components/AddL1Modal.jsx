import { useState, useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { uniqueAmong, l3Label } from "../data/treeMutations.js";

function siblingLabelsForAdd(tree, parentL1, parentL2, level, showLevelSelect) {
  if (parentL1 == null) return tree.map((b) => b.label);
  const block = tree.find((b) => b.label === parentL1);
  if (!block) return [];
  if (parentL2 != null) {
    const l2 = block.l2s.find((l) => l.label === parentL2);
    return l2?.l3s.map(l3Label) ?? [];
  }
  if (!showLevelSelect || level === "column") return block.l2s.map((l) => l.label);
  return block.l2s.flatMap((l) => l.l3s.map(l3Label));
}

/**
 * Modal for adding nav items. Top-level: `parentL1` null — L1 section (display name, type, link).
 * Under an L1 (no L2): Column (L2) vs Item (L3). Under an L2: L3 link only — no level row.
 *
 * @param {{
 *   open: boolean;
 *   tree: { label: string; l2s: { label: string; l3s: (string | object)[] }[] }[];
 *   parentL1: string | null;
 *   parentL2: string | null;
 *   onClose: () => void;
 *   onConfirm: (payload: object) => void;
 *   title?: string;
 * }} props
 */
export function AddL1Modal({
  open,
  tree,
  parentL1,
  parentL2 = null,
  onClose,
  onConfirm,
  title,
}) {
  const titleId = useId();
  const panelRef = useRef(null);
  const [displayName, setDisplayName] = useState("");
  /** Used only when `showLevelSelect` — empty until user picks */
  const [level, setLevel] = useState("");
  const [navType, setNavType] = useState("");
  const [navLink, setNavLink] = useState("");

  const showLevelSelect = parentL1 != null && parentL2 == null;
  /** L3-only modal — display name, type, and link are all required */
  const isL3AddModal = parentL1 != null && parentL2 != null;
  /** Type required for link rows (L3); optional for new L1 section and new L2 column */
  const typeRequired =
    isL3AddModal || (showLevelSelect && level === "item");
  const modalTitle =
    title ??
    (parentL2 != null ? "Add link" : parentL1 == null ? "Add section" : "Add item");

  useEffect(() => {
    if (!open) return;
    setDisplayName("");
    setLevel("");
    setNavType("");
    setNavLink("");
  }, [open, parentL1, parentL2]);

  useEffect(() => {
    if (!open) return;
    const focusSel = showLevelSelect ? "#add-l1-level" : "#add-l1-display";
    const t = window.setTimeout(() => {
      panelRef.current?.querySelector?.(focusSel)?.focus?.();
    }, 0);
    return () => window.clearTimeout(t);
  }, [open, showLevelSelect]);

  useEffect(() => {
    if (!open) return;
    function onKey(e) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const trimmed = displayName.trim();
  const trimmedLink = navLink.trim();
  const levelForSubmit = showLevelSelect ? level : "column";
  const needsLevel = showLevelSelect;
  const levelOk = !needsLevel || level === "column" || level === "item";
  const navTypeOk =
    !typeRequired ||
    navType === "collection" ||
    navType === "super-collection" ||
    navType === "link";
  const l3FieldsOk = !isL3AddModal || trimmedLink.length > 0;
  const canSubmit = levelOk && trimmed.length > 0 && navTypeOk && l3FieldsOk;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!canSubmit) return;

    if (parentL2 != null && parentL1 != null) {
      if (!navTypeOk || trimmedLink.length === 0) return;
      const taken = siblingLabelsForAdd(tree, parentL1, parentL2, levelForSubmit, showLevelSelect);
      const finalLabel = uniqueAmong(trimmed, taken);
      onConfirm({
        parentL1,
        parentL2,
        displayName: finalLabel,
        navType,
        navLink: trimmedLink,
      });
      return;
    }

    if (showLevelSelect && !levelOk) return;
    if (!navTypeOk) return;
    const taken = siblingLabelsForAdd(tree, parentL1, parentL2, levelForSubmit, showLevelSelect);
    const finalLabel = uniqueAmong(trimmed, taken);
    const meta = {
      displayName: finalLabel,
      level: levelForSubmit,
      navLink: trimmedLink,
      ...(navType ? { navType } : {}),
    };
    onConfirm({
      parentL1,
      ...meta,
    });
  };

  if (!open) return null;

  return createPortal(
    <div className="add-l1-modal" role="presentation">
      <button type="button" className="add-l1-modal__backdrop" aria-label="Close dialog" onClick={onClose} />
      <div
        ref={panelRef}
        className="add-l1-modal__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <div className="add-l1-modal__header">
          <h2 id={titleId} className="add-l1-modal__title">
            {modalTitle}
          </h2>
          <button type="button" className="add-l1-modal__close" onClick={onClose} aria-label="Close">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path
                d="M5 5l10 10M15 5L5 15"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
        <form className="add-l1-modal__body" onSubmit={handleSubmit}>
          {showLevelSelect ? (
            <div className="field-group">
              <label className="field-label" htmlFor="add-l1-level">
                Select level<span className="field-label__req">*</span>
              </label>
              <select
                id="add-l1-level"
                className="field-select"
                required
                value={level}
                onChange={(e) => {
                  const v = e.target.value;
                  setLevel(v === "item" ? "item" : v === "column" ? "column" : "");
                }}
              >
                <option value="" disabled>
                  Select level
                </option>
                <option value="column">Column (L2)</option>
                <option value="item">Item (L3)</option>
              </select>
            </div>
          ) : null}
          <div className="field-group">
            <label className="field-label" htmlFor="add-l1-display">
              Display name<span className="field-label__req">*</span>
            </label>
            <input
              id="add-l1-display"
              type="text"
              className="field-input"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g. Seasonal"
              autoComplete="off"
              required
            />
          </div>
          <div className="field-group">
            <label className="field-label" htmlFor="add-l1-type">
              Type{typeRequired ? <span className="field-label__req">*</span> : null}
            </label>
            <select
              id="add-l1-type"
              className="field-select"
              value={navType}
              onChange={(e) => setNavType(e.target.value)}
              required={typeRequired}
            >
              <option value="" disabled>
                Select type
              </option>
              <option value="collection">Collection</option>
              <option value="super-collection">Super collection</option>
              <option value="link">Link</option>
            </select>
          </div>
          <div className="field-group">
            <label className="field-label" htmlFor="add-l1-link">
              Link{isL3AddModal ? <span className="field-label__req">*</span> : null}
            </label>
            <input
              id="add-l1-link"
              type="text"
              className="field-input"
              value={navLink}
              onChange={(e) => setNavLink(e.target.value)}
              placeholder="/cooking/…"
              autoComplete="off"
              required={isL3AddModal}
            />
          </div>
          <div className="add-l1-modal__footer">
            <button type="button" className="btn btn--secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn--primary" disabled={!canSubmit}>
              Add
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
