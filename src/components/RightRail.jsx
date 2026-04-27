import { useState, useEffect, useRef } from "react";
import { l3Label } from "../data/treeMutations.js";
import { l1HasAtLeastOneLink, l2HasAtLeastOneLink } from "../navValidation.js";
import { NAV_TYPE_PLAIN_TEXT, isNavTypeWithLink } from "../data/navTypes.js";
import { IconEdit, IconErrorWarning, IconTrash } from "./RailIcons.jsx";

function getBlock(tree, l1) {
  return tree.find((b) => b.label === l1);
}

function getL2(block, l2) {
  return block?.l2s.find((x) => x.label === l2);
}

function RailCloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M5 5l10 10M15 5L5 15"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function RailValidationBanner({ message }) {
  return (
    <div className="rail-validation-banner" role="alert">
      <IconErrorWarning className="rail-validation-banner__icon" />
      <p className="rail-validation-banner__text">{message}</p>
    </div>
  );
}

function RailHeaderDetail({ title, titleSize, showClose, onClose }) {
  return (
    <div className="right-rail__view right-rail__view--detail is-active">
      <div className="right-rail__heading-block">
        <h2 className={`right-rail__title${titleSize === "xl" ? " right-rail__title--xl" : ""}`}>{title}</h2>
      </div>
      {showClose && onClose ? (
        <button type="button" className="right-rail__close" onClick={onClose} aria-label="Close panel">
          <RailCloseIcon />
        </button>
      ) : null}
    </div>
  );
}

const DRAFT_NAME_DEBOUNCE_MS = 320;
const DETAIL_DEBOUNCE_MS = 320;

const L1ListDragDots = () => (
  <span className="l1-list__drag" aria-hidden="true" draggable={false}>
    <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
      <circle cx="5" cy="5" r="1.5" fill="currentColor" />
      <circle cx="10" cy="5" r="1.5" fill="currentColor" />
      <circle cx="15" cy="5" r="1.5" fill="currentColor" />
      <circle cx="5" cy="10" r="1.5" fill="currentColor" />
      <circle cx="10" cy="10" r="1.5" fill="currentColor" />
      <circle cx="15" cy="10" r="1.5" fill="currentColor" />
      <circle cx="5" cy="15" r="1.5" fill="currentColor" />
      <circle cx="10" cy="15" r="1.5" fill="currentColor" />
      <circle cx="15" cy="15" r="1.5" fill="currentColor" />
    </svg>
  </span>
);

/** Layout A rest state (Figma 522-19003): full L1 list when no tree selection */
function RailL1RestList({ tree, onPickL1, onAddItem }) {
  const l1Labels = tree.map((b) => b.label);
  return (
    <>
      <div className="right-rail__header">
        <div className="right-rail__view right-rail__view--list is-active">
          <h2 className="right-rail__title">All L1s</h2>
        </div>
      </div>
      <div className="right-rail__body">
        <div className="rail-panel rail-panel--list is-active">
          <div className="rail-panel__toolbar">
            <button type="button" className="rail-add-btn" id="btn-add-new-l1" onClick={() => onAddItem?.()}>
              Add item
            </button>
          </div>
          <ul className="l1-list" id="l1-list">
            {l1Labels.map((title) => (
              <li
                key={title}
                className="l1-list__item js-l1-row"
                data-tree-label={title}
              >
                <L1ListDragDots />
                <div className="l1-list__main">
                  <button
                    type="button"
                    className="js-l1-name l1-list__name-btn"
                    onClick={() => onPickL1(title)}
                  >
                    {title}
                  </button>
                </div>
                <div className="l1-list__actions">
                  <button type="button" className="l1-list__icon-btn js-l1-edit" aria-label={`Edit ${title}`}>
                    <IconEdit className="l1-list__icon" />
                  </button>
                  <button type="button" className="l1-list__icon-btn js-l1-delete" aria-label={`Delete ${title}`}>
                    <IconTrash className="l1-list__icon" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
}

function RailAddL2Form({ parentL1, initialDisplayName, onDraftUpdate, onDismissRailDraft, headerShowClose }) {
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [type, setType] = useState("");
  const [link, setLink] = useState("");
  const snapshot = useRef({ displayName, type, link });
  snapshot.current = { displayName, type, link };
  const debounceRef = useRef(null);

  useEffect(() => {
    setDisplayName(initialDisplayName);
  }, [initialDisplayName]);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      onDraftUpdate(snapshot.current);
    }, DRAFT_NAME_DEBOUNCE_MS);
    return () => clearTimeout(debounceRef.current);
  }, [displayName, onDraftUpdate]);

  const pushImmediate = (next) => {
    clearTimeout(debounceRef.current);
    onDraftUpdate(next);
  };

  return (
    <>
      <div className="right-rail__header">
        <RailHeaderDetail
          title="NEW L2"
          titleSize="xl"
          showClose={headerShowClose}
          onClose={onDismissRailDraft}
        />
      </div>
      <div className="right-rail__body">
        <div className="detail-stack">
          <div className="field-group">
            <label className="field-label" htmlFor="rail-add-l2-display">
              Display name<span className="field-label__req">*</span>
            </label>
            <input
              id="rail-add-l2-display"
              type="text"
              className="field-input"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              autoComplete="off"
            />
          </div>
          <div className="field-group">
            <label className="field-label" htmlFor="rail-add-l2-type">
              Type
            </label>
            <select
              id="rail-add-l2-type"
              className="field-select"
              value={type}
              onChange={(e) => {
                const v = e.target.value;
                setType(v);
                pushImmediate({ displayName, type: v, link });
              }}
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
            <label className="field-label" htmlFor="rail-add-l2-link">
              Link
            </label>
            <input
              id="rail-add-l2-link"
              type="text"
              className="field-input"
              value={link}
              onChange={(e) => {
                const v = e.target.value;
                setLink(v);
                pushImmediate({ displayName, type, link: v });
              }}
              placeholder="/cooking/…"
              autoComplete="off"
            />
          </div>
        </div>
      </div>
    </>
  );
}

function RailAddL3Form({ parentL1, parentL2, initialDisplayName, onDraftUpdate, onDismissRailDraft, headerShowClose }) {
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [type, setType] = useState("");
  const [link, setLink] = useState("");
  const snapshot = useRef({ displayName, type, link });
  snapshot.current = { displayName, type, link };
  const debounceRef = useRef(null);

  useEffect(() => {
    setDisplayName(initialDisplayName);
  }, [initialDisplayName]);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      onDraftUpdate(snapshot.current);
    }, DRAFT_NAME_DEBOUNCE_MS);
    return () => clearTimeout(debounceRef.current);
  }, [displayName, onDraftUpdate]);

  const pushImmediate = (next) => {
    clearTimeout(debounceRef.current);
    onDraftUpdate(next);
  };

  return (
    <>
      <div className="right-rail__header">
        <RailHeaderDetail
          title="NEW L3"
          titleSize="xl"
          showClose={headerShowClose}
          onClose={onDismissRailDraft}
        />
      </div>
      <div className="right-rail__body">
        <div className="detail-stack">
          <div className="field-group">
            <label className="field-label" htmlFor="rail-add-l3-display">
              Display name<span className="field-label__req">*</span>
            </label>
            <input
              id="rail-add-l3-display"
              type="text"
              className="field-input"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              autoComplete="off"
            />
          </div>
          <div className="field-group">
            <label className="field-label" htmlFor="rail-add-l3-type">
              Type<span className="field-label__req">*</span>
            </label>
            <select
              id="rail-add-l3-type"
              className="field-select"
              value={type}
              onChange={(e) => {
                const v = e.target.value;
                setType(v);
                pushImmediate({ displayName, type: v, link });
              }}
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
            <label className="field-label" htmlFor="rail-add-l3-link">
              Link<span className="field-label__req">*</span>
            </label>
            <input
              id="rail-add-l3-link"
              type="url"
              className="field-input"
              value={link}
              onChange={(e) => {
                const v = e.target.value;
                setLink(v);
                pushImmediate({ displayName, type, link: v });
              }}
              placeholder="https://"
              autoComplete="off"
              required
            />
          </div>
        </div>
      </div>
    </>
  );
}

/** Layout A: L1 shows L2 list only; L2 shows L3 list. L2 rows with `hideL2Header` list L3 links only (no columns). */
function RailLayoutANestedL1({ block, l1, onSelect }) {
  if (!block) return null;
  const onlyFlatL3 =
    block.l2s.length > 0 && block.l2s.every((l2) => l2.hideL2Header);
  if (onlyFlatL3) {
    const rows = block.l2s.flatMap((l2) =>
      (l2.l3s ?? []).map((l3) => {
        const lab = l3Label(l3);
        return (
          <div key={`${l2.label}::${lab}`} className="detail-l2-row">
            <button
              type="button"
              className="detail-l2-row__label"
              onClick={() => onSelect?.({ kind: "l3", l1, l2: l2.label, l3: lab })}
            >
              {lab}
            </button>
          </div>
        );
      })
    );
    return (
      <div className="detail-layout-a__outline">
        <p className="detail-layout-a__outline-caption">Links (L3)</p>
        {rows.length === 0 ? (
          <p className="detail-layout-a__empty">No links yet.</p>
        ) : (
          <div className="detail-l2-tiles">{rows}</div>
        )}
      </div>
    );
  }
  return (
    <div className="detail-layout-a__outline">
      <p className="detail-layout-a__outline-caption">Sections (L2)</p>
      {block.l2s.length === 0 ? (
        <p className="detail-layout-a__empty">No L2 sections yet. Use Add L2.</p>
      ) : (
        <div className="detail-l2-tiles">
          {block.l2s.flatMap((l2) =>
            l2.hideL2Header
              ? (l2.l3s ?? []).map((l3) => {
                  const lab = l3Label(l3);
                  return (
                    <div key={`${l2.label}::${lab}`} className="detail-l2-row">
                      <button
                        type="button"
                        className="detail-l2-row__label"
                        onClick={() => onSelect?.({ kind: "l3", l1, l2: l2.label, l3: lab })}
                      >
                        {lab}
                      </button>
                    </div>
                  );
                })
              : [
                  <div key={l2.label} className="detail-l2-row">
                    <button
                      type="button"
                      className="detail-l2-row__label"
                      onClick={() => onSelect?.({ kind: "l2", l1, l2: l2.label })}
                    >
                      {l2.label}
                    </button>
                  </div>,
                ]
          )}
        </div>
      )}
    </div>
  );
}

function RailLayoutANestedL2({ l2, l1, l2Label, onSelect }) {
  if (!l2) return null;
  return (
    <div className="detail-layout-a__outline">
      <p className="detail-layout-a__outline-caption">Links (L3)</p>
      {l2.l3s.length === 0 ? (
        <p className="detail-layout-a__empty">No L3 links yet. Use Add.</p>
      ) : (
        <ul className="detail-l3-list">
          {l2.l3s.map((l3) => {
            const lab = l3Label(l3);
            return (
              <li key={lab}>
                <button
                  type="button"
                  className="detail-l3-row detail-l3-row--rail-only"
                  onClick={() => onSelect?.({ kind: "l3", l1, l2: l2Label, l3: lab })}
                >
                  <span className="detail-l3-row__meta">
                    <span className="detail-l3-row__label">{lab}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function RailL1Column({
  block,
  l1,
  l1Invalid,
  layoutVariant,
  onUpdate,
  onSelect,
  onOpenAddNavModal,
  showClose,
  onClose,
  formKey,
}) {
  const [displayName, setDisplayName] = useState(l1);
  const [navType, setNavType] = useState(block?.navType ?? "collection");
  const [navLink, setNavLink] = useState(block?.navLink ?? "");
  const snapshot = useRef({ displayName, navType, navLink });
  snapshot.current = { displayName, navType, navLink };
  const debounceRef = useRef(null);
  const skipFirstDebounce = useRef(true);

  useEffect(() => {
    setDisplayName(l1);
    setNavType(block?.navType ?? "collection");
    setNavLink(block?.navLink ?? "");
    skipFirstDebounce.current = true;
  }, [l1, block?.navType, block?.navLink, block?.label]);

  useEffect(() => {
    if (navType === NAV_TYPE_PLAIN_TEXT) setNavLink("");
  }, [navType]);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (skipFirstDebounce.current) {
        skipFirstDebounce.current = false;
        return;
      }
      onUpdate(snapshot.current);
    }, DETAIL_DEBOUNCE_MS);
    return () => clearTimeout(debounceRef.current);
  }, [displayName, navType, navLink, onUpdate]);

  return (
    <>
      <div className="right-rail__header">
        <RailHeaderDetail
          title={displayName}
          titleSize="xl"
          showClose={showClose}
          onClose={onClose}
        />
      </div>
      <div className="right-rail__body">
        <div className="rail-panel is-active">
          <div className="rail-layout-b__form">
            {l1Invalid ? (
              <RailValidationBanner message="Sections must contain at least one link, either at the section, column, or item level." />
            ) : null}
            <div className="rail-layout-b__add-row">
              <button
                type="button"
                className="btn btn--secondary btn--signal-outline"
                onClick={() => onOpenAddNavModal?.(l1)}
              >
                Add link
              </button>
            </div>
            <form className="detail-stack" key={formKey} onSubmit={(e) => e.preventDefault()}>
              <div className="field-group">
                <label className="field-label" htmlFor={`field-l1-display-${formKey}`}>
                  Display name<span className="field-label__req">*</span>
                </label>
                <input
                  id={`field-l1-display-${formKey}`}
                  type="text"
                  className="field-input"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  autoComplete="off"
                />
              </div>
              <div className="field-group">
                <label className="field-label" htmlFor={`field-l1-type-${formKey}`}>
                  Type<span className="field-label__req">*</span>
                </label>
                <select
                  id={`field-l1-type-${formKey}`}
                  className="field-select"
                  value={navType}
                  onChange={(e) => setNavType(e.target.value)}
                >
                  <option value="collection">Collection</option>
                  <option value="super-collection">Super collection</option>
                  <option value="link">Link</option>
                  <option value={NAV_TYPE_PLAIN_TEXT}>Plain text</option>
                </select>
              </div>
              {isNavTypeWithLink(navType) ? (
                <div className="field-group">
                  <label className="field-label" htmlFor={`field-l1-link-${formKey}`}>
                    Link<span className="field-label__req">*</span>
                  </label>
                  <input
                    id={`field-l1-link-${formKey}`}
                    type="text"
                    className="field-input"
                    value={navLink}
                    onChange={(e) => setNavLink(e.target.value)}
                    placeholder="/cooking/…"
                    autoComplete="off"
                  />
                </div>
              ) : null}
            </form>
            {layoutVariant === "a" ? <RailLayoutANestedL1 block={block} l1={l1} onSelect={onSelect} /> : null}
          </div>
        </div>
      </div>
    </>
  );
}

function RailL2Column({
  l1,
  l2,
  l2Node,
  l2Invalid,
  layoutVariant,
  onUpdate,
  onSelect,
  onOpenAddNavModal,
  formKey,
  showClose,
  onClose,
}) {
  const [displayName, setDisplayName] = useState(l2);
  const [navLink, setNavLink] = useState(l2Node?.navLink ?? "");
  const snapshot = useRef({ displayName, navLink });
  snapshot.current = { displayName, navLink };
  const debounceRef = useRef(null);
  const skipFirstDebounce = useRef(true);

  useEffect(() => {
    setDisplayName(l2);
    setNavLink(l2Node?.navLink ?? "");
    skipFirstDebounce.current = true;
  }, [l1, l2, l2Node?.navLink, l2Node?.label]);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (skipFirstDebounce.current) {
        skipFirstDebounce.current = false;
        return;
      }
      onUpdate(snapshot.current);
    }, DETAIL_DEBOUNCE_MS);
    return () => clearTimeout(debounceRef.current);
  }, [displayName, navLink, onUpdate]);

  return (
    <>
      <div className="right-rail__header">
        <RailHeaderDetail title={displayName} showClose={showClose} onClose={onClose} />
      </div>
      <div className="right-rail__body">
        <div className="rail-panel is-active">
          {!l2Node ? (
            <p className="right-rail__context">This section is not in the current tree data.</p>
          ) : (
            <div className="rail-layout-b__form">
              {l2Invalid ? (
                <RailValidationBanner message="Columns must contain at least one link, either at the column or item level." />
              ) : null}
              <div className="rail-layout-b__add-row">
                <button
                  type="button"
                  className="btn btn--secondary btn--signal-outline"
                  onClick={() => onOpenAddNavModal?.(l1, l2)}
                >
                  Add link
                </button>
              </div>
              <form className="detail-stack" key={formKey} onSubmit={(e) => e.preventDefault()}>
                <div className="field-group">
                  <label className="field-label" htmlFor={`field-l2-display-${formKey}`}>
                    Display name<span className="field-label__req">*</span>
                  </label>
                  <input
                    id={`field-l2-display-${formKey}`}
                    type="text"
                    className="field-input"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    autoComplete="off"
                  />
                </div>
                {l2Node?.navType !== NAV_TYPE_PLAIN_TEXT ? (
                  <div className="field-group">
                    <label className="field-label" htmlFor={`field-l2-slug-${formKey}`}>
                      Link<span className="field-label__req">*</span>
                    </label>
                    <input
                      id={`field-l2-slug-${formKey}`}
                      type="text"
                      className="field-input"
                      value={navLink}
                      onChange={(e) => setNavLink(e.target.value)}
                      placeholder="/cooking/…"
                      autoComplete="off"
                    />
                  </div>
                ) : null}
              </form>
              {layoutVariant === "a" ? (
                <RailLayoutANestedL2 l2={l2Node} l1={l1} l2Label={l2} onSelect={onSelect} />
              ) : null}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function RailL3Column({ l1, l2, l3, l3Entry, l3Exists, onUpdate, formKey, showClose, onClose }) {
  const [displayName, setDisplayName] = useState(l3);
  const [navType, setNavType] = useState(
    typeof l3Entry === "object" && l3Entry != null ? l3Entry.navType ?? "collection" : "link"
  );
  const [navLink, setNavLink] = useState(
    typeof l3Entry === "object" && l3Entry != null ? l3Entry.navLink ?? "" : ""
  );
  const snapshot = useRef({ displayName, navType, navLink });
  snapshot.current = { displayName, navType, navLink };
  const debounceRef = useRef(null);
  const skipFirstDebounce = useRef(true);

  useEffect(() => {
    setDisplayName(l3);
    setNavType(
      typeof l3Entry === "object" && l3Entry != null ? l3Entry.navType ?? "collection" : "link"
    );
    setNavLink(typeof l3Entry === "object" && l3Entry != null ? l3Entry.navLink ?? "" : "");
    skipFirstDebounce.current = true;
  }, [l1, l2, l3, l3Entry]);

  useEffect(() => {
    if (navType === NAV_TYPE_PLAIN_TEXT) setNavLink("");
  }, [navType]);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (skipFirstDebounce.current) {
        skipFirstDebounce.current = false;
        return;
      }
      onUpdate(snapshot.current);
    }, DETAIL_DEBOUNCE_MS);
    return () => clearTimeout(debounceRef.current);
  }, [displayName, navType, navLink, onUpdate]);

  return (
    <>
      <div className="right-rail__header">
        <RailHeaderDetail title={displayName} showClose={showClose} onClose={onClose} />
      </div>
      <div className="right-rail__body">
        <div className="rail-panel is-active">
          {!l3Exists ? (
            <p className="right-rail__context">This link is not in the current tree data.</p>
          ) : (
            <form className="detail-stack" key={formKey} onSubmit={(e) => e.preventDefault()}>
              <div className="field-group">
                <label className="field-label" htmlFor={`field-display-${formKey}`}>
                  Display name<span className="field-label__req">*</span>
                </label>
                <input
                  id={`field-display-${formKey}`}
                  type="text"
                  className="field-input"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  autoComplete="off"
                />
              </div>
              <div className="field-group">
                <label className="field-label" htmlFor={`field-type-${formKey}`}>
                  Type<span className="field-label__req">*</span>
                </label>
                <select
                  id={`field-type-${formKey}`}
                  className="field-select"
                  value={navType}
                  onChange={(e) => setNavType(e.target.value)}
                >
                  <option value="collection">Collection</option>
                  <option value="super-collection">Super collection</option>
                  <option value="link">Link</option>
                  <option value={NAV_TYPE_PLAIN_TEXT}>Plain text</option>
                </select>
              </div>
              {isNavTypeWithLink(navType) ? (
                <div className="field-group">
                  <label className="field-label" htmlFor={`field-link-${formKey}`}>
                    Link<span className="field-label__req">*</span>
                  </label>
                  <input
                    id={`field-link-${formKey}`}
                    type="url"
                    className="field-input"
                    value={navLink}
                    onChange={(e) => setNavLink(e.target.value)}
                    placeholder="https://"
                    autoComplete="off"
                  />
                </div>
              ) : null}
            </form>
          )}
        </div>
      </div>
    </>
  );
}

/** Tree-driven detail: full IA stays in the tree; rail shows L1/L2/L3 forms */
function TreeSelectionDetail({
  tree,
  selection,
  layoutVariant,
  onSelect,
  onCloseRail,
  railDraft,
  onDismissRailDraft,
  onRequestAddL2,
  onRequestAddL3,
  onUpdateAddL2Draft,
  onUpdateAddL3Draft,
  onUpdateL1Detail,
  onUpdateL2Detail,
  onUpdateL3Detail,
  onOpenAddNavModal,
}) {
  const block = selection ? getBlock(tree, selection.l1) : null;
  const showCloseLayoutB = layoutVariant === "b" && typeof onCloseRail === "function";
  const headerShowClose = showCloseLayoutB || !!railDraft;

  if (
    railDraft?.kind === "add-l2" &&
    railDraft.draftL2Label &&
    selection?.kind === "l2" &&
    selection.l1 === railDraft.l1 &&
    selection.l2 === railDraft.draftL2Label
  ) {
    return (
      <RailAddL2Form
        key={railDraft.draftId ?? `${railDraft.l1}::${railDraft.draftL2Label}`}
        parentL1={railDraft.l1}
        initialDisplayName={selection.l2}
        onDraftUpdate={onUpdateAddL2Draft}
        onDismissRailDraft={onDismissRailDraft}
        headerShowClose={headerShowClose}
      />
    );
  }

  if (
    railDraft?.kind === "add-l3" &&
    railDraft.draftL3Label &&
    selection?.kind === "l3" &&
    selection.l1 === railDraft.l1 &&
    selection.l2 === railDraft.l2 &&
    selection.l3 === railDraft.draftL3Label
  ) {
    return (
      <RailAddL3Form
        key={railDraft.draftId ?? `${railDraft.l1}::${railDraft.l2}::${railDraft.draftL3Label}`}
        parentL1={railDraft.l1}
        parentL2={railDraft.l2}
        initialDisplayName={selection.l3}
        onDraftUpdate={onUpdateAddL3Draft}
        onDismissRailDraft={onDismissRailDraft}
        headerShowClose={headerShowClose}
      />
    );
  }

  if (selection.kind === "l1") {
    const formKey = `l1-${selection.l1}`;
    const l1Invalid = block != null && !l1HasAtLeastOneLink(block);
    return (
      <RailL1Column
        formKey={formKey}
        block={block}
        l1={selection.l1}
        l1Invalid={l1Invalid}
        layoutVariant={layoutVariant}
        onUpdate={onUpdateL1Detail}
        onSelect={onSelect}
        onOpenAddNavModal={onOpenAddNavModal}
        showClose={showCloseLayoutB}
        onClose={onCloseRail}
      />
    );
  }

  if (selection.kind === "l2") {
    const l2 = block ? getL2(block, selection.l2) : null;
    const formKey = `l2-${selection.l1}-${selection.l2}`;
    const l2Invalid = l2 != null && !l2HasAtLeastOneLink(l2);
    return (
      <RailL2Column
        formKey={formKey}
        l1={selection.l1}
        l2={selection.l2}
        l2Node={l2}
        l2Invalid={l2Invalid}
        layoutVariant={layoutVariant}
        onUpdate={onUpdateL2Detail}
        onSelect={onSelect}
        onOpenAddNavModal={onOpenAddNavModal}
        showClose={showCloseLayoutB}
        onClose={onCloseRail}
      />
    );
  }

  const l2ForL3 = block ? getL2(block, selection.l2) : null;
  const l3Exists = l2ForL3?.l3s.some((x) => l3Label(x) === selection.l3);
  const l3Entry = l2ForL3?.l3s.find((x) => l3Label(x) === selection.l3);
  const formKey = `${selection.l1}-${selection.l2}-${selection.l3}`;

  return (
    <RailL3Column
      formKey={formKey}
      l1={selection.l1}
      l2={selection.l2}
      l3={selection.l3}
      l3Entry={l3Entry}
      l3Exists={l3Exists}
      onUpdate={onUpdateL3Detail}
      showClose={showCloseLayoutB}
      onClose={onCloseRail}
    />
  );
}

export function RightRail({
  tree,
  selection,
  layoutVariant = "a",
  onSelect,
  onCloseRail,
  railDraft,
  onDismissRailDraft,
  onRequestAddL2,
  onRequestAddL3,
  onUpdateAddL2Draft,
  onUpdateAddL3Draft,
  onUpdateL1Detail = () => {},
  onUpdateL2Detail = () => {},
  onUpdateL3Detail = () => {},
  onOpenAddNavModal,
}) {
  if (layoutVariant === "b" && selection == null) {
    return null;
  }

  if (layoutVariant === "a" && selection == null) {
    return (
      <aside className="right-rail" id="right-rail" aria-label="Navigation editor">
        <RailL1RestList
          tree={tree}
          onPickL1={(l1) => onSelect?.({ kind: "l1", l1 })}
          onAddItem={() => onOpenAddNavModal?.(null)}
        />
      </aside>
    );
  }

  return (
    <aside
      className={`right-rail${railDraft ? " right-rail--add-draft" : ""}`}
      id="right-rail"
      aria-label="Navigation editor"
    >
      <TreeSelectionDetail
        tree={tree}
        selection={selection}
        layoutVariant={layoutVariant}
        onSelect={onSelect}
        onCloseRail={onCloseRail}
        railDraft={railDraft}
        onDismissRailDraft={onDismissRailDraft}
        onRequestAddL2={onRequestAddL2}
        onRequestAddL3={onRequestAddL3}
        onUpdateAddL2Draft={onUpdateAddL2Draft}
        onUpdateAddL3Draft={onUpdateAddL3Draft}
        onUpdateL1Detail={onUpdateL1Detail}
        onUpdateL2Detail={onUpdateL2Detail}
        onUpdateL3Detail={onUpdateL3Detail}
        onOpenAddNavModal={onOpenAddNavModal}
      />
    </aside>
  );
}
