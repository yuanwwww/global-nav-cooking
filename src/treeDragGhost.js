/**
 * Custom HTML5 drag image (Figma 770:30983 — nav item_L2 “ghost” while reordering).
 */

const NS = "http://www.w3.org/2000/svg";

const GRIP_SVG = `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="${NS}">
<circle cx="6" cy="5" r="1.5" fill="currentColor"/><circle cx="12" cy="5" r="1.5" fill="currentColor"/>
<circle cx="6" cy="10" r="1.5" fill="currentColor"/><circle cx="12" cy="10" r="1.5" fill="currentColor"/>
<circle cx="6" cy="15" r="1.5" fill="currentColor"/><circle cx="12" cy="15" r="1.5" fill="currentColor"/>
</svg>`;

const CHEVRON_SVG = `<svg width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="${NS}">
<path d="M5 7.5L10 12.5 15 7.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

const OVERFLOW_SVG = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="${NS}">
<circle cx="8" cy="3" r="1.5" fill="currentColor"/><circle cx="8" cy="8" r="1.5" fill="currentColor"/><circle cx="8" cy="13" r="1.5" fill="currentColor"/>
</svg>`;

/**
 * @param {DataTransfer} dataTransfer
 * @param {DragEvent} nativeEvent
 * @param {{ level: "l1" | "l2" | "l3"; title: string }} opts
 */
export function setTreeDragImage(dataTransfer, nativeEvent, { level, title }) {
  if (typeof dataTransfer?.setDragImage !== "function") return;

  const el = document.createElement("div");
  el.className = `tree-drag-ghost tree-drag-ghost--${level}`;
  el.setAttribute("aria-hidden", "true");

  const grip = document.createElement("span");
  grip.className = "tree-drag-ghost__grip";
  grip.innerHTML = GRIP_SVG;

  const main = document.createElement("div");
  main.className = "tree-drag-ghost__main";

  if (level === "l2") {
    const chev = document.createElement("span");
    chev.className = "tree-drag-ghost__chevron";
    chev.innerHTML = CHEVRON_SVG;
    const label = document.createElement("span");
    label.className = "tree-drag-ghost__label";
    label.textContent = title;
    main.appendChild(chev);
    main.appendChild(label);
  } else if (level === "l3") {
    const spacer = document.createElement("span");
    spacer.className = "tree-drag-ghost__spacer";
    spacer.setAttribute("aria-hidden", "true");
    const label = document.createElement("span");
    label.className = "tree-drag-ghost__label tree-drag-ghost__label--l3";
    label.textContent = title;
    main.appendChild(spacer);
    main.appendChild(label);
  } else {
    const label = document.createElement("span");
    label.className = "tree-drag-ghost__label tree-drag-ghost__label--l1";
    label.textContent = title;
    main.appendChild(label);
  }

  el.appendChild(grip);
  el.appendChild(main);

  if (level === "l2") {
    const overflow = document.createElement("span");
    overflow.className = "tree-drag-ghost__overflow";
    overflow.innerHTML = OVERFLOW_SVG;
    overflow.setAttribute("aria-hidden", "true");
    el.appendChild(overflow);
  }

  document.body.appendChild(el);
  void el.offsetWidth;

  const rect = el.getBoundingClientRect();
  let ox = nativeEvent.offsetX;
  let oy = nativeEvent.offsetY;
  if (!Number.isFinite(ox) || ox <= 0) {
    ox = level === "l2" ? 40 : level === "l3" ? 48 : 44;
  }
  if (!Number.isFinite(oy) || oy <= 0) {
    oy = Math.min(20, rect.height / 2);
  }
  ox = Math.min(Math.max(ox, 4), Math.max(rect.width - 4, 4));
  oy = Math.min(Math.max(oy, 4), Math.max(rect.height - 4, 4));

  try {
    dataTransfer.setDragImage(el, ox, oy);
  } catch {
    /* Safari older / non-standard */
  }
  requestAnimationFrame(() => {
    el.remove();
  });
}
