export function Sidebar() {
  return (
    <aside className="sidebar" aria-label="Product">
      <div className="sidebar__brand">
        <div className="sidebar__logo-row">
          <div className="sidebar__logo-mark" aria-hidden="true">
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden="true">
              <rect width="48" height="48" rx="9.21" fill="#fff" />
              <text
                x="24"
                y="30"
                textAnchor="middle"
                fill="#1f1f1f"
                fontSize="16"
                fontWeight="700"
                fontFamily="inherit"
              >
                T
              </text>
            </svg>
          </div>
          <span className="sidebar__env" title="Environment">
            Product
          </span>
        </div>
      </div>
      <nav className="sidebar__nav" aria-label="Applications">
        <a className="sidebar__item" href="#">
          Oak
        </a>
        <a className="sidebar__item" href="#">
          Story Dash
        </a>
        <a className="sidebar__item" href="#">
          Live Admin
        </a>
        <a className="sidebar__item sidebar__item--active" href="#">
          All
        </a>
      </nav>
      <div className="sidebar__footer">
        <button type="button" className="sidebar__help" aria-label="Help">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="12" cy="12" r="9" stroke="rgba(255,255,255,0.45)" strokeWidth="1.5" />
            <path
              d="M9.5 9.5a2.5 2.5 0 0 1 4.6-1.3c.5 1-.1 1.7-.8 2.4-.6.5-1.2 1-1.2 2.1"
              stroke="rgba(255,255,255,0.85)"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <circle cx="12" cy="17" r="1" fill="rgba(255,255,255,0.85)" />
          </svg>
        </button>
        <div className="sidebar__profile" title="Profile">
          EL
        </div>
      </div>
    </aside>
  );
}
