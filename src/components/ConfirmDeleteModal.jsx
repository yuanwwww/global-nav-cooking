import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";

const COPY = {
  l1: {
    title: "Confirm deleting section",
    body: "All the links under this section will be deleted.",
  },
  l2: {
    title: "Confirm deleting column",
    body: "All the links under this column will be deleted.",
  },
  l3: {
    title: "Confirm deleting item",
    body: "This link will be removed from the nav.",
  },
};

/**
 * Figma 891:38816 — confirm delete section / column / item
 * @param {{
 *   open: boolean;
 *   kind: 'l1' | 'l2' | 'l3' | null;
 *   onClose: () => void;
 *   onConfirm: () => void;
 * }} props
 */
export function ConfirmDeleteModal({ open, kind, onClose, onConfirm }) {
  const titleId = useId();
  const panelRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => {
      panelRef.current?.querySelector?.(".confirm-delete-modal__confirm")?.focus?.();
    }, 0);
    return () => window.clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKey(e) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || kind == null) return null;

  const { title, body } = COPY[kind] ?? COPY.l1;

  return createPortal(
    <div className="add-l1-modal confirm-delete-modal" role="presentation">
      <button type="button" className="add-l1-modal__backdrop" aria-label="Close dialog" onClick={onClose} />
      <div
        ref={panelRef}
        className="add-l1-modal__panel confirm-delete-modal__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <div className="add-l1-modal__header confirm-delete-modal__header">
          <h2 id={titleId} className="add-l1-modal__title confirm-delete-modal__title">
            {title}
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
        <div className="confirm-delete-modal__message">
          <p className="confirm-delete-modal__text">{body}</p>
        </div>
        <div className="add-l1-modal__footer confirm-delete-modal__footer">
          <button type="button" className="btn btn--secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="btn btn--primary confirm-delete-modal__confirm" onClick={onConfirm}>
            Yes, delete
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
