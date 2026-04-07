import { IconEdit, IconTrash } from "./RailIcons.jsx";

const DragDots = () => (
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

export function RightRail({ l1Labels, activeL1, onPickL1 }) {
  return (
    <aside className="right-rail" id="right-rail" aria-label="Navigation editor">
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
                className={`l1-list__item js-l1-row${title === activeL1 ? " is-active" : ""}`}
                data-tree-label={title}
              >
                <DragDots />
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
                  <button
                    type="button"
                    className="l1-list__icon-btn js-l1-delete"
                    aria-label={`Delete ${title}`}
                  >
                    <IconTrash className="l1-list__icon" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </aside>
  );
}
