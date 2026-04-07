import { useState, useRef, useEffect } from "react";

export function Topbar({ dirty, layoutVariant, onLayoutVariantChange }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const splitRef = useRef(null);

  useEffect(() => {
    function onDoc(e) {
      if (!splitRef.current?.contains(e.target)) setMenuOpen(false);
    }
    document.addEventListener("click", onDoc);
    return () => document.removeEventListener("click", onDoc);
  }, []);

  return (
    <header className="topbar">
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <span className="breadcrumb__text">Cooking</span>
        <span className="breadcrumb__sep" aria-hidden="true">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path
              d="M7.5 5L12.5 10L7.5 15"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
        <span className="breadcrumb__text">Global Nav</span>
      </nav>

      <div className="topbar__center">
        <button type="button" className="btn btn--preview-chip">
          Preview
        </button>
      </div>

      <div className="topbar__actions">
        <div
          className="layout-variant-switch layout-variant-switch--compact"
          role="group"
          aria-label="Workspace layout"
        >
          <div className="layout-variant-switch__buttons">
            <button
              type="button"
              className={`layout-variant-switch__btn${layoutVariant === "a" ? " is-active" : ""}`}
              aria-pressed={layoutVariant === "a"}
              onClick={() => onLayoutVariantChange("a")}
            >
              A
            </button>
            <button
              type="button"
              className={`layout-variant-switch__btn${layoutVariant === "b" ? " is-active" : ""}`}
              aria-pressed={layoutVariant === "b"}
              onClick={() => onLayoutVariantChange("b")}
            >
              B
            </button>
          </div>
        </div>
        <span
          id="save-status"
          className={`topbar__saved${dirty ? " topbar__saved--dirty" : ""}`}
        >
          {dirty ? "Unsaved changes" : "Saved"}
        </span>
        <div className="avatar-stack avatar-stack--figma" aria-hidden="true">
          <span className="avatar avatar--figma avatar--cat1">AA</span>
          <span className="avatar avatar--figma avatar--cat3">AA</span>
        </div>
        <div className="split-button" ref={splitRef}>
          <button type="button" className="btn btn--primary split-button__main">
            Publish
          </button>
          <button
            type="button"
            className="btn btn--primary split-button__caret"
            aria-haspopup="true"
            aria-expanded={menuOpen}
            aria-label="Publish options"
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen((o) => !o);
            }}
          />
          {menuOpen ? (
            <div className="dropdown" role="menu">
              <button type="button" className="dropdown__item" role="menuitem">
                Publish now
              </button>
              <button type="button" className="dropdown__item" role="menuitem">
                Schedule…
              </button>
              <button type="button" className="dropdown__item" role="menuitem">
                Discard draft
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
