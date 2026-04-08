import { useState, useEffect, useRef } from "react";
import { IconEdit, IconTrash } from "./RailIcons.jsx";

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

function RailHeaderDetail({ title, context, titleSize, showClose, onClose }) {
  return (
    <div className="right-rail__view right-rail__view--detail is-active">
      <div className="right-rail__heading-block">
        <h2 className={`right-rail__title${titleSize === "xl" ? " right-rail__title--xl" : ""}`}>{title}</h2>
        {context ? <p className="right-rail__context">{context}</p> : null}
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
function RailL1RestList({ tree, onPickL1 }) {
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
            <button type="button" className="rail-add-btn" id="btn-add-new-l1">
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
  const [type, setType] = useState("section");
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
          context={parentL1}
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
              <option value="section">Section</option>
              <option value="link">Link</option>
              <option value="group">Group</option>
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
  const [type, setType] = useState("link");
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
          context={`${parentL1} › ${parentL2}`}
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
              Type
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
              <option value="link">Link</option>
              <option value="collection">Collection</option>
              <option value="search">Search</option>
            </select>
          </div>
          <div className="field-group">
            <label className="field-label" htmlFor="rail-add-l3-link">
              Link
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
            />
          </div>
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
  onCloseRail,
  railDraft,
  onDismissRailDraft,
  onRequestAddL2,
  onRequestAddL3,
  onUpdateAddL2Draft,
  onUpdateAddL3Draft,
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
    return (
      <>
        <div className="right-rail__header">
          <RailHeaderDetail
            title={selection.l1}
            titleSize="xl"
            showClose={showCloseLayoutB}
            onClose={onCloseRail}
          />
        </div>
        <div className="right-rail__body">
          <div className="rail-panel is-active">
            <div className="rail-layout-b__form">
              <div className="rail-layout-b__add-row">
                <button type="button" className="btn btn--secondary btn--signal-outline" onClick={onRequestAddL2}>
                  Add L2
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
                    defaultValue={selection.l1}
                    autoComplete="off"
                  />
                </div>
                <div className="field-group">
                  <label className="field-label" htmlFor={`field-l1-type-${formKey}`}>
                    Type
                  </label>
                  <select id={`field-l1-type-${formKey}`} className="field-select" defaultValue="section">
                    <option value="section">Section</option>
                    <option value="link">Link</option>
                    <option value="group">Group</option>
                  </select>
                </div>
                <div className="field-group">
                  <label className="field-label" htmlFor={`field-l1-link-${formKey}`}>
                    Link
                  </label>
                  <input
                    id={`field-l1-link-${formKey}`}
                    type="text"
                    className="field-input"
                    placeholder="/cooking/…"
                    autoComplete="off"
                  />
                </div>
              </form>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (selection.kind === "l2") {
    const l2 = block ? getL2(block, selection.l2) : null;
    const formKey = `l2-${selection.l1}-${selection.l2}`;
    return (
      <>
        <div className="right-rail__header">
          <RailHeaderDetail
            title={selection.l2}
            context={selection.l1}
            showClose={showCloseLayoutB}
            onClose={onCloseRail}
          />
        </div>
        <div className="right-rail__body">
          <div className="rail-panel is-active">
            {!l2 ? (
              <p className="right-rail__context">This section is not in the current tree data.</p>
            ) : (
              <div className="rail-layout-b__form">
                <div className="rail-layout-b__add-row">
                  <button type="button" className="btn btn--secondary btn--signal-outline" onClick={onRequestAddL3}>
                    Add L3
                  </button>
                </div>
                <form className="detail-stack" key={formKey} onSubmit={(e) => e.preventDefault()}>
                  <div className="field-group">
                    <label className="field-label" htmlFor={`field-l2-display-${formKey}`}>
                      Display name
                    </label>
                    <input
                      id={`field-l2-display-${formKey}`}
                      type="text"
                      className="field-input"
                      defaultValue={selection.l2}
                      autoComplete="off"
                    />
                  </div>
                  <div className="field-group">
                    <label className="field-label" htmlFor={`field-l2-slug-${formKey}`}>
                      Link
                    </label>
                    <input
                      id={`field-l2-slug-${formKey}`}
                      type="text"
                      className="field-input"
                      placeholder="/cooking/…"
                      autoComplete="off"
                    />
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </>
    );
  }

  const l2ForL3 = block ? getL2(block, selection.l2) : null;
  const l3Exists = l2ForL3?.l3s.includes(selection.l3);
  const formKey = `${selection.l1}-${selection.l2}-${selection.l3}`;

  return (
    <>
      <div className="right-rail__header">
        <RailHeaderDetail
          title={selection.l3}
          context={`${selection.l1} › ${selection.l2}`}
          showClose={showCloseLayoutB}
          onClose={onCloseRail}
        />
      </div>
      <div className="right-rail__body">
        <div className="rail-panel is-active">
          {!l3Exists ? (
            <p className="right-rail__context">This link is not in the current tree data.</p>
          ) : (
            <form className="detail-stack" key={formKey} onSubmit={(e) => e.preventDefault()}>
              <div className="field-group">
                <label className="field-label" htmlFor={`field-display-${formKey}`}>
                  Display name
                </label>
                <input
                  id={`field-display-${formKey}`}
                  type="text"
                  className="field-input"
                  defaultValue={selection.l3}
                  autoComplete="off"
                />
              </div>
              <div className="field-group">
                <label className="field-label" htmlFor={`field-type-${formKey}`}>
                  Type
                </label>
                <select id={`field-type-${formKey}`} className="field-select" defaultValue="link">
                  <option value="link">Link</option>
                  <option value="collection">Collection</option>
                  <option value="search">Search</option>
                </select>
              </div>
              <div className="field-group">
                <label className="field-label" htmlFor={`field-link-${formKey}`}>
                  Link
                </label>
                <input
                  id={`field-link-${formKey}`}
                  type="url"
                  className="field-input"
                  placeholder="https://"
                  autoComplete="off"
                />
              </div>
            </form>
          )}
        </div>
      </div>
    </>
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
        onCloseRail={onCloseRail}
        railDraft={railDraft}
        onDismissRailDraft={onDismissRailDraft}
        onRequestAddL2={onRequestAddL2}
        onRequestAddL3={onRequestAddL3}
        onUpdateAddL2Draft={onUpdateAddL2Draft}
        onUpdateAddL3Draft={onUpdateAddL3Draft}
      />
    </aside>
  );
}
