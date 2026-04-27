import { useState, useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { uniqueAmong, l3Label } from "../data/treeMutations.js";
import { NAV_TYPE_PLAIN_TEXT, isNavTypeWithLink } from "../data/navTypes.js";

const VALID_NAV_TYPES = ["collection", "super-collection", "link", NAV_TYPE_PLAIN_TEXT];
/** L3 added under an L2 is always navigable — no plain-text row */
const VALID_L3_FROM_L2_TYPES = ["collection", "super-collection", "link"];

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
 * Under an L1 (no L2): Column (L2) vs Item (L3). Under an L2: add L3 with display name, type, and
 * link (all required for navigable rows; no plain-text type in that context).
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
  const isL3AddModal = parentL1 != null && parentL2 != null;
  const isUnderL1 = parentL1 != null;
  /** Under a selected L1: type is always required for L2 column, L3 item, or L3-only add */
  const typeRequired =
    isL3AddModal ||
    (showLevelSelect && (level === "column" || level === "item"));
  const isPlainText = navType === NAV_TYPE_PLAIN_TEXT;
  /** Add L3 under L2: type + link required; display name is always required */
  const linkFieldVisible = isL3AddModal
    ? true
    : isUnderL1
      ? typeRequired && isNavTypeWithLink(navType)
      : navType !== NAV_TYPE_PLAIN_TEXT;
  const linkRequired =
    isL3AddModal || (isUnderL1 && linkFieldVisible);
  const modalTitle =
    title ??
    (parentL2 != null ? "Add link" : parentL1 == null ? "Add section" : "Add item");

  useEffect(() => {
    if (!open) return;
    setDisplayName("");
    setLevel("");
    setNavType(parentL1 != null && parentL2 != null ? "link" : "");
    setNavLink("");
  }, [open, parentL1, parentL2]);

  useEffect(() => {
    if (navType === NAV_TYPE_PLAIN_TEXT) setNavLink("");
  }, [navType]);

  useEffect(() => {
    if (showLevelSelect && level !== "column" && level !== "item") {
      setNavType("");
      setNavLink("");
    }
  }, [level, showLevelSelect]);

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
  /** Do not show type/link until Column vs Item is chosen; avoids `typeRequired` false while a type is selected */
  const typeBlockReady = !showLevelSelect || level === "column" || level === "item";
  const navTypeOk =
    !typeRequired ||
    (navType &&
      (isL3AddModal ? VALID_L3_FROM_L2_TYPES : VALID_NAV_TYPES).includes(navType));
  const linkOk = isL3AddModal
    ? trimmedLink.length > 0
    : isPlainText || !linkRequired || trimmedLink.length > 0;
  /** L3 under L2: display name, type, and link are all required */
  const l3AddAllFieldsComplete =
    trimmed.length > 0 &&
    Boolean(navType) &&
    VALID_L3_FROM_L2_TYPES.includes(navType) &&
    trimmedLink.length > 0;
  const canSubmit = isL3AddModal
    ? l3AddAllFieldsComplete
    : levelOk && trimmed.length > 0 && typeBlockReady && navTypeOk && linkOk;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!canSubmit) return;

    if (parentL2 != null && parentL1 != null) {
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

    if (parentL1 == null) {
      const taken = siblingLabelsForAdd(tree, parentL1, parentL2, levelForSubmit, showLevelSelect);
      const finalLabel = uniqueAmong(trimmed, taken);
      onConfirm({
        parentL1: null,
        displayName: finalLabel,
        level: levelForSubmit,
        ...(navType ? { navType } : {}),
        ...(!isPlainText && trimmedLink ? { navLink: trimmedLink } : {}),
      });
      return;
    }

    if (showLevelSelect && !levelOk) return;
    if (!navTypeOk) return;
    const taken = siblingLabelsForAdd(tree, parentL1, parentL2, levelForSubmit, showLevelSelect);
    const finalLabel = uniqueAmong(trimmed, taken);
    onConfirm({
      parentL1,
      displayName: finalLabel,
      level: levelForSubmit,
      navType,
      ...(isPlainText ? {} : { navLink: trimmedLink }),
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
        <form className="add-l1-modal__body" onSubmit={handleSubmit} noValidate>
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
          {typeBlockReady ? (
            <>
              <div className="field-group">
                <label className="field-label" htmlFor="add-l1-type">
                  Type{typeRequired ? <span className="field-label__req">*</span> : null}
                </label>
                <select
                  id="add-l1-type"
                  className="field-select"
                  value={navType}
                  onChange={(e) => setNavType(e.target.value)}
                >
                  <option value="" disabled>
                    Select type
                  </option>
                  <option value="collection">Collection</option>
                  <option value="super-collection">Super collection</option>
                  <option value="link">Link</option>
                  {!isL3AddModal ? (
                    <option value={NAV_TYPE_PLAIN_TEXT}>Plain text</option>
                  ) : null}
                </select>
              </div>
              {linkFieldVisible ? (
                <div className="field-group">
                  <label className="field-label" htmlFor="add-l1-link">
                    Link{linkRequired ? <span className="field-label__req">*</span> : null}
                  </label>
                  <input
                    id="add-l1-link"
                    type="text"
                    className="field-input"
                    value={navLink}
                    onChange={(e) => setNavLink(e.target.value)}
                    placeholder={isL3AddModal ? "https://…" : "/cooking/…"}
                    autoComplete="off"
                  />
                </div>
              ) : null}
            </>
          ) : null}
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
