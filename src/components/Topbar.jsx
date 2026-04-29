import { useState, useRef, useEffect } from "react";

/** Opens in a new tab; set `VITE_PREVIEW_URL` in `.env` to override the default. */
const DEFAULT_PREVIEW_URL = "https://cooking.nytimes.com";

export function Topbar({ dirty }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const splitRef = useRef(null);
  const previewUrl = import.meta.env.VITE_PREVIEW_URL || DEFAULT_PREVIEW_URL;

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
        <span className="breadcrumb__text breadcrumb__text--current" aria-current="page">
          Global Nav
        </span>
      </nav>

      <div className="topbar__center">
        <a
          href={previewUrl}
          className="btn btn--preview-chip"
          target="_blank"
          rel="noopener noreferrer"
          title={`Open preview: ${previewUrl}`}
        >
          Preview
        </a>
      </div>

      <div className="topbar__actions">
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
