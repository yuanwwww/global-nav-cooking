(function () {
  "use strict";

  var detailMode = "simple";
  var railCurrentL2Title = "";
  var railCurrentL1Title = "";
  var railCurrentL1TitleEl = null;
  var addNewL1ListRowEl = null;
  var addNewL2TitleEl = null;
  var l3LabelTreeEl = null;
  var sortableIgnoreClicksUntil = 0;

  var treePanel = document.getElementById("tree-panel");
  var workspaceScroll = document.getElementById("workspace-scroll");
  var rightRail = document.getElementById("right-rail");
  var railViewList = document.getElementById("rail-view-list");
  var railViewDetail = document.getElementById("rail-view-detail");
  var railPanelList = document.getElementById("rail-panel-list");
  var railPanelDetail = document.getElementById("rail-panel-detail");
  var railDetailTitle = document.getElementById("rail-detail-title");
  var l1ListEl = document.getElementById("l1-list");
  var btnAddNewL1 = document.getElementById("btn-add-new-l1");
  var popoverEl = document.getElementById("popover");
  var toastEl = document.getElementById("toast");
  var publishDropdown = document.getElementById("publish-dropdown");
  var btnPublishMenu = document.getElementById("btn-publish-menu");
  var btnPublishMain = document.getElementById("btn-publish-main");

  var panelSimple = document.getElementById("detail-panel-simple");
  var panelL1 = document.getElementById("detail-panel-l1");
  var panelL2 = document.getElementById("detail-panel-l2");
  var panelL3 = document.getElementById("detail-panel-l3");
  var panelAddL1 = document.getElementById("detail-panel-add-l1");
  var panelAddL2 = document.getElementById("detail-panel-add-l2");
  var panelAddL3 = document.getElementById("detail-panel-add-l3");

  var fieldDisplay = document.getElementById("field-display");
  var fieldLink = document.getElementById("field-link");
  var fieldL1Display = document.getElementById("field-l1-display");
  var fieldL1Slug = document.getElementById("field-l1-slug");
  var fieldL2Display = document.getElementById("field-l2-display");
  var fieldL2Slug = document.getElementById("field-l2-slug");
  var fieldL3Display = document.getElementById("field-l3-display");
  var fieldL3Type = document.getElementById("field-l3-type");
  var fieldL3Link = document.getElementById("field-l3-link");
  var addNewL1Title = document.getElementById("add-new-l1-title");
  var addNewL1Slug = document.getElementById("add-new-l1-slug");
  var addNewL2Title = document.getElementById("add-new-l2-title");
  var addNewL2Slug = document.getElementById("add-new-l2-slug");
  var addNewL3Label = document.getElementById("add-new-l3-label");
  var addNewL3Type = document.getElementById("add-new-l3-type");
  var addNewL3Link = document.getElementById("add-new-l3-link");

  var detailL1Tiles = document.getElementById("detail-l1-tiles");
  var jsAddL2UnderL1 = document.getElementById("js-add-l2-under-l1");
  var detailL3List = document.getElementById("detail-l3-list");
  var jsDetailAddL3 = document.getElementById("js-detail-add-l3");

  var selectedTreeEl = null;
  var toastTimer = null;
  var popoverTarget = null;

  function showToast(message) {
    toastEl.textContent = message;
    toastEl.hidden = false;
    toastEl.classList.add("is-visible");
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      toastEl.hidden = true;
      toastEl.classList.remove("is-visible");
    }, 2400);
  }

  function hidePopover() {
    popoverEl.hidden = true;
    popoverEl.innerHTML = "";
    popoverTarget = null;
  }

  function positionPopover(anchorRect) {
    var pad = 8;
    popoverEl.style.left = Math.min(window.innerWidth - popoverEl.offsetWidth - pad, anchorRect.right - popoverEl.offsetWidth) + "px";
    popoverEl.style.top = anchorRect.bottom + pad + "px";
  }

  function openPopover(items, anchorEl) {
    popoverEl.innerHTML = "";
    items.forEach(function (item) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "popover__item" + (item.danger ? " popover__item--danger" : "");
      b.textContent = item.label;
      b.addEventListener("click", function () {
        hidePopover();
        item.onClick();
      });
      popoverEl.appendChild(b);
    });
    popoverEl.hidden = false;
    popoverTarget = anchorEl;
    var r = anchorEl.getBoundingClientRect();
    positionPopover(r);
  }

  document.addEventListener("click", function (e) {
    if (!popoverEl.hidden && !popoverEl.contains(e.target) && e.target !== popoverTarget && !popoverTarget.contains(e.target)) {
      hidePopover();
    }
  });

  function getAllTreeBlocks() {
    return Array.prototype.slice.call(treePanel.querySelectorAll(".tree-block"));
  }

  function findTreeBlockByL1Title(title) {
    var blocks = getAllTreeBlocks();
    for (var i = 0; i < blocks.length; i++) {
      if (blocks[i].getAttribute("data-tree-label") === title) return blocks[i];
    }
    return null;
  }

  function getL1TitleFromBlock(block) {
    return block.getAttribute("data-tree-label") || "";
  }

  function findL1RowEl(title) {
    return l1ListEl.querySelector('.js-l1-row[data-tree-label="' + cssEscape(title) + '"]');
  }

  function cssEscape(s) {
    if (window.CSS && CSS.escape) return CSS.escape(s);
    return s.replace(/"/g, '\\"');
  }

  function applyTreeSelection(level, el) {
    treePanel.querySelectorAll(".is-selected").forEach(function (n) {
      n.classList.remove("is-selected");
    });
    if (el) {
      el.classList.add("is-selected");
      selectedTreeEl = el;
    } else {
      selectedTreeEl = null;
    }
  }

  function syncAccordionExpandedForL2(l2, expanded) {
    if (!l2) return;
    var v = expanded ? "true" : "false";
    var hdr = l2.querySelector(".js-accordion-header");
    if (hdr) hdr.setAttribute("aria-expanded", v);
  }

  function ensureSelectionExpandedAndVisible(el) {
    if (!el) return;
    var block = el.closest(".tree-block");
    if (block) {
      var p = el;
      while (p && p !== block) {
        if (p.classList && p.classList.contains("accordion-body")) {
          p.classList.remove("is-collapsed");
          var l2root = p.closest(".tree-l2");
          syncAccordionExpandedForL2(l2root, true);
        }
        p = p.parentElement;
      }
    }
    try {
      el.scrollIntoView({ block: "nearest", behavior: "smooth" });
    } catch (e) {
      el.scrollIntoView();
    }
  }

  function setDetailPanels(activePanel) {
    [panelSimple, panelL1, panelL2, panelL3, panelAddL1, panelAddL2, panelAddL3].forEach(function (p) {
      p.classList.remove("is-active");
      p.hidden = true;
    });
    if (activePanel) {
      activePanel.hidden = false;
      activePanel.classList.add("is-active");
    }
  }

  function openRailDetail(title) {
    railViewList.classList.remove("is-active");
    railViewList.hidden = true;
    railViewDetail.classList.add("is-active");
    railViewDetail.hidden = false;
    railPanelList.classList.remove("is-active");
    railPanelList.hidden = true;
    railPanelDetail.classList.add("is-active");
    railPanelDetail.hidden = false;
    railDetailTitle.textContent = title;
  }

  function showListView() {
    detailMode = "simple";
    railCurrentL2Title = "";
    railCurrentL1Title = "";
    railCurrentL1TitleEl = null;
    addNewL1ListRowEl = null;
    addNewL2TitleEl = null;
    l3LabelTreeEl = null;
    railViewList.classList.add("is-active");
    railViewList.hidden = false;
    railViewDetail.classList.remove("is-active");
    railViewDetail.hidden = true;
    railPanelList.classList.add("is-active");
    railPanelList.hidden = false;
    railPanelDetail.classList.remove("is-active");
    railPanelDetail.hidden = true;
    setDetailPanels(null);
    treePanel.querySelectorAll(".is-selected").forEach(function (n) {
      n.classList.remove("is-selected");
    });
    selectedTreeEl = null;
  }

  function showSimpleDetail(title) {
    detailMode = "simple";
    openRailDetail(title || "Edit");
    setDetailPanels(panelSimple);
  }

  function showL1Detail(l1Title, l1RowEl) {
    detailMode = "l1";
    railCurrentL1Title = l1Title;
    railCurrentL2Title = "";
    railCurrentL1TitleEl = l1RowEl || findL1RowEl(l1Title);
    l3LabelTreeEl = null;
    openRailDetail(l1Title);
    setDetailPanels(panelL1);
    var block = findTreeBlockByL1Title(l1Title);
    if (block) {
      var row = block.querySelector(".js-tree-l1");
      fieldL1Display.value = row ? row.getAttribute("data-tree-label") || l1Title : l1Title;
      fieldL1Slug.value = (fieldL1Slug.value && fieldL1Slug.dataset.bound === l1Title) ? fieldL1Slug.value : slugify(fieldL1Display.value);
      fieldL1Slug.dataset.bound = l1Title;
    } else {
      fieldL1Display.value = l1Title;
    }
    populateL1Tiles(l1Title);
  }

  function showL2Detail(l1Title, l2Title) {
    detailMode = "l2";
    railCurrentL1Title = l1Title;
    railCurrentL2Title = l2Title;
    railCurrentL1TitleEl = findL1RowEl(l1Title);
    l3LabelTreeEl = null;
    openRailDetail(l2Title);
    setDetailPanels(panelL2);
    fieldL2Display.value = l2Title;
    fieldL2Slug.value = (fieldL2Slug.dataset.bound === l1Title + "|" + l2Title) ? fieldL2Slug.value : slugify(l2Title);
    fieldL2Slug.dataset.bound = l1Title + "|" + l2Title;
    populateL3List(l1Title, l2Title);
    setupSortableList(detailL3List, "l3");
  }

  function showL3Detail(l1Title, l2Title, l3Row) {
    detailMode = "l3";
    railCurrentL1Title = l1Title;
    railCurrentL2Title = l2Title;
    l3LabelTreeEl = l3Row;
    railCurrentL1TitleEl = findL1RowEl(l1Title);
    var label = l3Row ? l3Row.getAttribute("data-tree-label") || "" : "";
    openRailDetail(label);
    setDetailPanels(panelL3);
    fieldL3Display.value = label;
    fieldL3Type.value = l3Row.getAttribute("data-l3-type") || "link";
    fieldL3Link.value = l3Row.getAttribute("href") === "#" ? "" : l3Row.getAttribute("href") || "";
  }

  function showAddNewL1Detail() {
    detailMode = "add-l1";
    railCurrentL2Title = "";
    railCurrentL1Title = "";
    railCurrentL1TitleEl = null;
    l3LabelTreeEl = null;
    openRailDetail("New L1 section");
    setDetailPanels(panelAddL1);
    addNewL1Title.value = uniqueNewL1Title();
    addNewL1Slug.value = slugify(addNewL1Title.value);
  }

  function uniqueNewL1Title() {
    var base = "New L1 section";
    var titles = {};
    getAllTreeBlocks().forEach(function (b) {
      titles[getL1TitleFromBlock(b)] = true;
    });
    if (!titles[base]) return base;
    var n = 2;
    while (titles[base + " " + n]) n++;
    return base + " " + n;
  }

  function uniqueNewL2Title(l1Title) {
    var block = findTreeBlockByL1Title(l1Title);
    var used = {};
    if (block) {
      block.querySelectorAll(".tree-l2__title").forEach(function (t) {
        used[t.getAttribute("data-tree-label") || t.textContent.trim()] = true;
      });
    }
    var base = "New L2";
    if (!used[base]) return base;
    var n = 2;
    while (used[base + " " + n]) n++;
    return base + " " + n;
  }

  function uniqueNewL3Label(l1Title, l2Title) {
    var labels = getL3LabelsForL2Section(l1Title, l2Title);
    var map = {};
    labels.forEach(function (l) {
      map[l] = true;
    });
    var base = "New link";
    if (!map[base]) return base;
    var n = 2;
    while (map[base + " " + n]) n++;
    return base + " " + n;
  }

  function slugify(s) {
    return String(s || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }

  function createL1ListItem(title) {
    var li = document.createElement("li");
    li.className = "l1-list__item js-l1-row";
    li.setAttribute("data-tree-level", "l1");
    li.setAttribute("data-tree-label", title);
    li.innerHTML =
      '<button type="button" class="l1-list__drag" aria-label="Reorder" draggable="false">' +
      '<svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true"><circle cx="5" cy="4" r="1.5" fill="currentColor"/><circle cx="11" cy="4" r="1.5" fill="currentColor"/><circle cx="5" cy="8" r="1.5" fill="currentColor"/><circle cx="11" cy="8" r="1.5" fill="currentColor"/><circle cx="5" cy="12" r="1.5" fill="currentColor"/><circle cx="11" cy="12" r="1.5" fill="currentColor"/></svg></button>' +
      '<div class="l1-list__main"><div class="js-l1-name">' + escapeHtml(title) + "</div></div>" +
      '<div class="l1-list__actions">' +
      '<button type="button" class="js-l1-edit">Edit</button>' +
      '<button type="button" class="js-l1-delete">Delete</button>' +
      "</div>";
    return li;
  }

  function escapeHtml(t) {
    var d = document.createElement("div");
    d.textContent = t;
    return d.innerHTML;
  }

  function createAndAppendL1ListItem(title) {
    var li = createL1ListItem(title);
    l1ListEl.appendChild(li);
    return li;
  }

  function rebuildL1ListFromTree() {
    l1ListEl.innerHTML = "";
    getAllTreeBlocks().forEach(function (block) {
      var t = getL1TitleFromBlock(block);
      l1ListEl.appendChild(createL1ListItem(t));
    });
    setupSortableList(l1ListEl, "l1");
  }

  function insertNewL1TreeBlockAtEnd(title) {
    var section = document.createElement("section");
    section.className = "tree-block";
    section.setAttribute("data-tree-level", "l1");
    section.setAttribute("data-tree-label", title);
    var displayTitle = title;
    section.innerHTML =
      '<div class="tree-l1 js-tree-l1" data-tree-level="l1" data-tree-label="' +
      escapeAttr(displayTitle) +
      '" tabindex="0">' +
      '<span class="tree-l1__label">' +
      escapeHtml(displayTitle) +
      '</span><button type="button" class="tree-overflow js-tree-overflow" aria-label="' +
      escapeAttr(displayTitle + " options") +
      '"></button></div>' +
      '<div class="tree-l2">' +
      '<div class="accordion-header js-accordion-header" role="button" tabindex="0" aria-expanded="true">' +
      '<span class="accordion-header__chevron" aria-hidden="true"></span>' +
      '<span class="tree-l2__title js-tree-l2" data-tree-level="l2" data-tree-label="Placeholder">Placeholder</span>' +
      '<button type="button" class="tree-overflow js-tree-overflow" aria-label="Placeholder options"></button>' +
      "</div>" +
      '<div class="accordion-body">' +
      '<a href="#" class="tree-l3 js-tree-l3" data-tree-level="l3" data-tree-label="Sample link" data-l3-type="link">' +
      '<span class="tree-l3__icon" aria-hidden="true"><svg class="tree-l3__link-icon" viewBox="0 0 16 16" width="16" height="16"><path fill="currentColor" d="M6 2h8v8h-2V5.4L3.7 13 2 11.3 10.3 3H6V2z"/></svg></span>' +
      '<span class="tree-l3__label">Sample link</span></a></div></div>';
    treePanel.appendChild(section);
    initAccordionsInRoot(section);
    bindL1Handlers(section.querySelector(".js-tree-l1"));
    section.querySelectorAll(".js-tree-l2").forEach(bindL2Handlers);
    section.querySelectorAll(".js-tree-l3").forEach(bindL3Handlers);
    section.querySelectorAll(".js-tree-overflow").forEach(bindTreeOverflowButton);
    return section;
  }

  function escapeAttr(s) {
    return String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
  }

  function startAddNewL1FromList() {
    showAddNewL1Detail();
  }

  function startAddNewL2UnderL1(l1Title) {
    detailMode = "add";
    railCurrentL1Title = l1Title;
    railCurrentL2Title = "";
    railCurrentL1TitleEl = findL1RowEl(l1Title);
    l3LabelTreeEl = null;
    openRailDetail("New L2");
    setDetailPanels(panelAddL2);
    addNewL2Title.value = uniqueNewL2Title(l1Title);
    addNewL2Slug.value = slugify(addNewL2Title.value);
  }

  function startAddNewL3UnderL2(l2Title) {
    detailMode = "add-l3";
    railCurrentL2Title = l2Title;
    var label = uniqueNewL3Label(railCurrentL1Title, l2Title);
    openRailDetail("New L3");
    setDetailPanels(panelAddL3);
    addNewL3Label.value = label;
    addNewL3Type.value = "link";
    addNewL3Link.value = "";
    var row = insertNewL3TreeRow(railCurrentL1Title, l2Title, label, "link", "");
    l3LabelTreeEl = row;
    applyTreeSelection("l3", row);
    ensureSelectionExpandedAndVisible(row);
    populateL3List(railCurrentL1Title, l2Title);
    setupSortableList(detailL3List, "l3");
  }

  function findAccordionBodyAfterHeader(header) {
    var n = header.nextElementSibling;
    while (n) {
      if (n.classList && n.classList.contains("accordion-body")) return n;
      n = n.nextElementSibling;
    }
    return null;
  }

  function findAccordionBodyForL2Section(l1Title, l2Title) {
    var block = findTreeBlockByL1Title(l1Title);
    if (!block) return null;
    var headers = block.querySelectorAll(".accordion-header");
    for (var i = 0; i < headers.length; i++) {
      var tit = headers[i].querySelector(".tree-l2__title");
      var lab = tit ? tit.getAttribute("data-tree-label") : "";
      if (lab === l2Title) {
        return findAccordionBodyAfterHeader(headers[i]);
      }
    }
    return null;
  }

  function getL3LabelsForL2Section(l1Title, l2Title) {
    var body = findAccordionBodyForL2Section(l1Title, l2Title);
    if (!body) return [];
    return Array.prototype.map.call(body.querySelectorAll(".js-tree-l3"), function (a) {
      return a.getAttribute("data-tree-label") || "";
    });
  }

  function findL3RowByL2AndLabel(l1Title, l2Title, label) {
    var body = findAccordionBodyForL2Section(l1Title, l2Title);
    if (!body) return null;
    var rows = body.querySelectorAll(".js-tree-l3");
    for (var i = 0; i < rows.length; i++) {
      if (rows[i].getAttribute("data-tree-label") === label) return rows[i];
    }
    return null;
  }

  function getL2ParentTitleForL3Row(l3El) {
    var hdr = l3El.closest(".tree-l2") && l3El.closest(".tree-l2").querySelector(".accordion-header .tree-l2__title");
    return hdr ? hdr.getAttribute("data-tree-label") || hdr.textContent.trim() : "";
  }

  function insertNewL2UnderL1Block(l1Title, displayTitle) {
    var block = findTreeBlockByL1Title(l1Title);
    if (!block) return null;
    var wrap = document.createElement("div");
    wrap.className = "tree-l2";
    wrap.innerHTML =
      '<div class="accordion-header js-accordion-header" role="button" tabindex="0" aria-expanded="true">' +
      '<span class="accordion-header__chevron" aria-hidden="true"></span>' +
      '<span class="tree-l2__title js-tree-l2" data-tree-level="l2" data-tree-label="' +
      escapeAttr(displayTitle) +
      '">' +
      escapeHtml(displayTitle) +
      "</span>" +
      '<button type="button" class="tree-overflow js-tree-overflow" aria-label="' +
      escapeAttr(displayTitle + " options") +
      '"></button></div>' +
      '<div class="accordion-body">' +
      '<a href="#" class="tree-l3 js-tree-l3" data-tree-level="l3" data-tree-label="New link" data-l3-type="link">' +
      '<span class="tree-l3__icon" aria-hidden="true"><svg class="tree-l3__link-icon" viewBox="0 0 16 16" width="16" height="16"><path fill="currentColor" d="M6 2h8v8h-2V5.4L3.7 13 2 11.3 10.3 3H6V2z"/></svg></span>' +
      '<span class="tree-l3__label">New link</span></a></div>';
    block.appendChild(wrap);
    bindAccordionForL2(wrap);
    var l2t = wrap.querySelector(".js-tree-l2");
    var l3 = wrap.querySelector(".js-tree-l3");
    bindL2Handlers(l2t);
    bindL3Handlers(l3);
    wrap.querySelectorAll(".js-tree-overflow").forEach(bindTreeOverflowButton);
    return wrap;
  }

  function insertNewL3TreeRow(l1Title, l2Title, label, type, link) {
    var body = findAccordionBodyForL2Section(l1Title, l2Title);
    if (!body) return null;
    var a = document.createElement("a");
    a.href = link || "#";
    a.className = "tree-l3 js-tree-l3";
    a.setAttribute("data-tree-level", "l3");
    a.setAttribute("data-tree-label", label);
    a.setAttribute("data-l3-type", type || "link");
    a.innerHTML =
      '<span class="tree-l3__icon" aria-hidden="true"><svg class="tree-l3__link-icon" viewBox="0 0 16 16" width="16" height="16"><path fill="currentColor" d="M6 2h8v8h-2V5.4L3.7 13 2 11.3 10.3 3H6V2z"/></svg></span>' +
      '<span class="tree-l3__label">' +
      escapeHtml(label) +
      "</span>";
    body.appendChild(a);
    bindL3Handlers(a);
    var ov = body.closest(".tree-l2").querySelector(".js-tree-overflow");
    if (ov) bindTreeOverflowButton(ov);
    return a;
  }

  function populateL1Tiles(l1Title) {
    detailL1Tiles.innerHTML = "";
    var block = findTreeBlockByL1Title(l1Title);
    if (!block) return;
    var headers = block.querySelectorAll(".accordion-header");
    headers.forEach(function (hdr) {
      var tit = hdr.querySelector(".tree-l2__title");
      var name = tit ? tit.getAttribute("data-tree-label") || tit.textContent.trim() : "";
      if (!name) return;
      var row = document.createElement("div");
      row.className = "detail-l2-row";
      row.setAttribute("data-l2-name", name);
      row.innerHTML =
        '<span class="detail-l2-row__label">' +
        escapeHtml(name) +
        '</span><button type="button" class="js-detail-l1-l2-delete">Remove</button>';
      row.querySelector(".js-detail-l1-l2-delete").addEventListener("click", function () {
        removeL2SectionFromBlock(l1Title, name);
        populateL1Tiles(l1Title);
        if (detailMode === "l2" && railCurrentL2Title === name) {
          showL1Detail(l1Title);
        }
        showToast("Removed L2: " + name);
      });
      detailL1Tiles.appendChild(row);
    });
  }

  function removeL2SectionFromBlock(l1Title, l2Title) {
    var block = findTreeBlockByL1Title(l1Title);
    if (!block) return;
    var headers = block.querySelectorAll(".accordion-header");
    for (var i = 0; i < headers.length; i++) {
      var tit = headers[i].querySelector(".tree-l2__title");
      var lab = tit ? tit.getAttribute("data-tree-label") : "";
      if (lab === l2Title) {
        var treeL2 = headers[i].closest(".tree-l2");
        if (treeL2) treeL2.remove();
        return;
      }
    }
  }

  function populateL3List(l1Title, l2Title) {
    detailL3List.innerHTML = "";
    var body = findAccordionBodyForL2Section(l1Title, l2Title);
    if (!body) return;
    var rows = body.querySelectorAll(".js-tree-l3");
    Array.prototype.forEach.call(rows, function (row) {
      var label = row.getAttribute("data-tree-label") || "";
      var li = document.createElement("li");
      li.className = "detail-l3-row";
      li.setAttribute("data-l3-label", label);
      li.innerHTML =
        '<button type="button" class="detail-l3-row__drag" aria-label="Reorder">' +
        '<svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true"><circle cx="5" cy="4" r="1.5" fill="currentColor"/><circle cx="11" cy="4" r="1.5" fill="currentColor"/><circle cx="5" cy="8" r="1.5" fill="currentColor"/><circle cx="11" cy="8" r="1.5" fill="currentColor"/><circle cx="5" cy="12" r="1.5" fill="currentColor"/><circle cx="11" cy="12" r="1.5" fill="currentColor"/></svg></button>' +
        '<div class="detail-l3-row__meta">' +
        '<div class="detail-l3-row__label">' +
        escapeHtml(label) +
        "</div>" +
        '<div class="detail-l3-row__type">' +
        escapeHtml(row.getAttribute("data-l3-type") || "link") +
        "</div></div>" +
        '<button type="button" class="detail-l3-row__delete" data-label="' +
        escapeAttr(label) +
        '">Delete</button>';
      detailL3List.appendChild(li);
    });
  }

  var sortableState = { type: null, dragEl: null, fromIndex: -1 };

  function setupSortableList(root, type) {
    root.dataset.sortableType = type;
    var items = root.classList.contains("l1-list") ? root.querySelectorAll(".js-l1-row") : root.querySelectorAll(".detail-l3-row");
    Array.prototype.forEach.call(items, function (item) {
      if (item.dataset.sortableBound) return;
      item.dataset.sortableBound = "1";
      item.setAttribute("draggable", "true");
      item.addEventListener("dragstart", function (e) {
        var handle = type === "l1" ? item.querySelector(".l1-list__drag") : item.querySelector(".detail-l3-row__drag");
        if (!handle || !handle.contains(e.target)) {
          e.preventDefault();
          return;
        }
        sortableState.type = type;
        sortableState.dragEl = item;
        sortableState.fromIndex = Array.prototype.indexOf.call(item.parentNode.children, item);
        item.classList.add("is-dragging");
        if (item.classList.contains("l1-list__item")) item.classList.add("is-sortable-dragging");
        root.classList.add("is-sortable-dragging");
        e.dataTransfer.effectAllowed = "move";
        try {
          e.dataTransfer.setData("text/plain", String(sortableState.fromIndex));
        } catch (err) {}
        sortableIgnoreClicksUntil = Date.now() + 500;
      });
      item.addEventListener("dragend", function () {
        item.classList.remove("is-dragging");
        item.classList.remove("is-sortable-dragging");
        root.classList.remove("is-sortable-dragging");
        sortableState.dragEl = null;
        sortableState.type = null;
        sortableState.fromIndex = -1;
      });
    });
    if (!root.dataset.sortableRootBound) {
      root.dataset.sortableRootBound = "1";
      root.addEventListener("dragover", function (e) {
        e.preventDefault();
        var dragEl = sortableState.dragEl;
        if (!dragEl || dragEl.parentNode !== root) return;
        var siblings = Array.prototype.filter.call(root.children, function (c) {
          return c.classList.contains("js-l1-row") || c.classList.contains("detail-l3-row");
        });
        var y = e.clientY;
        var insertBefore = null;
        for (var i = 0; i < siblings.length; i++) {
          if (siblings[i] === dragEl) continue;
          var box = siblings[i].getBoundingClientRect();
          var mid = box.top + box.height / 2;
          if (y < mid) {
            insertBefore = siblings[i];
            break;
          }
        }
        if (insertBefore == null) {
          root.appendChild(dragEl);
        } else {
          root.insertBefore(dragEl, insertBefore);
        }
      });
      root.addEventListener("drop", function (e) {
        e.preventDefault();
        if (sortableState.type === "l1") syncTreeBlocksOrderFromL1List();
        if (sortableState.type === "l3") syncTreeL3OrderFromDetailList();
      });
    }
  }

  function syncTreeBlocksOrderFromL1List() {
    var order = Array.prototype.map.call(l1ListEl.querySelectorAll(".js-l1-row"), function (li) {
      return li.getAttribute("data-tree-label");
    });
    order.forEach(function (title) {
      var block = findTreeBlockByL1Title(title);
      if (block) treePanel.appendChild(block);
    });
  }

  function syncTreeL3OrderFromDetailList() {
    var l1 = railCurrentL1Title;
    var l2 = railCurrentL2Title;
    var body = findAccordionBodyForL2Section(l1, l2);
    if (!body) return;
    var detailRows = detailL3List.querySelectorAll(".detail-l3-row");
    Array.prototype.forEach.call(detailRows, function (dr) {
      var label = dr.getAttribute("data-l3-label");
      var treeRow = findL3RowByL2AndLabel(l1, l2, label);
      if (treeRow) body.appendChild(treeRow);
    });
  }

  function deleteL1FromListRow(li) {
    var title = li.getAttribute("data-tree-label");
    var block = findTreeBlockByL1Title(title);
    if (block) block.remove();
    li.remove();
    if (railCurrentL1Title === title) showListView();
  }

  function bindL1Handlers(row) {
    if (!row || row.dataset.boundL1) return;
    row.dataset.boundL1 = "1";
    row.addEventListener("click", function (e) {
      if (e.target.closest(".tree-overflow")) return;
      var title = row.getAttribute("data-tree-label");
      applyTreeSelection("l1", row);
      ensureSelectionExpandedAndVisible(row);
      showL1Detail(title, findL1RowEl(title));
    });
    row.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        row.click();
      }
    });
  }

  function bindL2Handlers(titleEl) {
    if (!titleEl || titleEl.dataset.boundL2) return;
    titleEl.dataset.boundL2 = "1";
    titleEl.addEventListener("click", function (e) {
      e.stopPropagation();
      var l2Title = titleEl.getAttribute("data-tree-label");
      var block = titleEl.closest(".tree-block");
      var l1Title = block ? getL1TitleFromBlock(block) : "";
      var hdr = titleEl.closest(".accordion-header");
      applyTreeSelection("l2", hdr);
      ensureSelectionExpandedAndVisible(hdr);
      showL2Detail(l1Title, l2Title);
    });
  }

  function bindL3Handlers(anchor) {
    if (!anchor || anchor.dataset.boundL3) return;
    anchor.dataset.boundL3 = "1";
    anchor.addEventListener("click", function (e) {
      e.preventDefault();
      var block = anchor.closest(".tree-block");
      var l1Title = block ? getL1TitleFromBlock(block) : "";
      var l2Title = getL2ParentTitleForL3Row(anchor);
      applyTreeSelection("l3", anchor);
      ensureSelectionExpandedAndVisible(anchor);
      showL3Detail(l1Title, l2Title, anchor);
    });
  }

  function toggleAccordionSectionForL2(l2) {
    var body = l2.querySelector(":scope > .accordion-body");
    if (!body) return;
    var open = !body.classList.contains("is-collapsed");
    if (open) {
      body.classList.add("is-collapsed");
      syncAccordionExpandedForL2(l2, false);
    } else {
      body.classList.remove("is-collapsed");
      syncAccordionExpandedForL2(l2, true);
    }
  }

  function bindAccordionForL2(l2) {
    if (!l2 || l2.dataset.accToggleBound === "1") return;
    l2.dataset.accToggleBound = "1";
    function maybeToggle(e) {
      if (e.target.closest(".tree-l2__title")) return;
      if (e.target.closest(".tree-overflow")) return;
      toggleAccordionSectionForL2(l2);
    }
    var hdr = l2.querySelector(".js-accordion-header");
    if (hdr) {
      hdr.addEventListener("click", maybeToggle);
      hdr.addEventListener("keydown", function (e) {
        if (e.target.closest(".tree-overflow")) return;
        if (e.key === "Enter" || e.key === " ") {
          if (e.target.closest(".tree-l2__title")) return;
          e.preventDefault();
          toggleAccordionSectionForL2(l2);
        }
      });
    }
  }

  function initAccordionsInRoot(root) {
    root.querySelectorAll(".js-accordion-bar").forEach(function (bar) {
      bar.remove();
    });
    root.querySelectorAll(".tree-l2").forEach(function (l2) {
      var children = Array.prototype.slice.call(l2.children);
      var header = children.find(function (c) {
        return c.classList.contains("accordion-header");
      });
      var directL3 = children.filter(function (c) {
        return c.classList.contains("tree-l3");
      });
      if (directL3.length) {
        var body = document.createElement("div");
        body.className = "accordion-body";
        directL3.forEach(function (n) {
          body.appendChild(n);
        });
        if (header && header.nextSibling !== body) {
          l2.insertBefore(body, header.nextSibling);
        } else if (!header) {
          l2.appendChild(body);
        }
      }
      bindAccordionForL2(l2);
    });
  }

  function initAccordions() {
    initAccordionsInRoot(treePanel);
  }

  function initL2L3Clicks() {
    treePanel.querySelectorAll(".js-tree-l2").forEach(bindL2Handlers);
    treePanel.querySelectorAll(".js-tree-l3").forEach(bindL3Handlers);
  }

  function initL1TreeRows() {
    treePanel.querySelectorAll(".js-tree-l1").forEach(bindL1Handlers);
  }

  function bindTreeOverflowButton(btn) {
    if (!btn || btn.dataset.ovBound) return;
    btn.dataset.ovBound = "1";
    btn.addEventListener("click", function (e) {
      e.stopPropagation();
      var rect = btn.getBoundingClientRect();
      var block = btn.closest(".tree-block");
      var l1Title = block ? getL1TitleFromBlock(block) : "";
      var l2Title = "";
      var l3Row = btn.closest(".tree-l3");
      if (btn.closest(".accordion-header")) {
        var t = btn.closest(".accordion-header").querySelector(".tree-l2__title");
        l2Title = t ? t.getAttribute("data-tree-label") : "";
      }
      openPopover(
        [
          {
            label: "Edit in rail",
            onClick: function () {
              if (btn.closest(".js-tree-l1")) {
                showL1Detail(l1Title);
              } else if (btn.closest(".accordion-header")) {
                showL2Detail(l1Title, l2Title);
              } else if (l3Row) {
                showL3Detail(l1Title, getL2ParentTitleForL3Row(l3Row), l3Row);
              }
            },
          },
          {
            label: "Quick edit (simple)",
            onClick: function () {
              showSimpleDetail("Quick edit");
              fieldDisplay.value = l3Row ? l3Row.getAttribute("data-tree-label") : l2Title || l1Title;
              fieldLink.value = l3Row && l3Row.href !== "#" ? l3Row.href : "";
            },
          },
        ],
        btn
      );
      positionPopover(rect);
    });
  }

  function initOverflowMenus() {
    treePanel.querySelectorAll(".js-tree-overflow").forEach(bindTreeOverflowButton);
  }

  function syncDirtyFromFields() {
    if (detailMode === "l1" && railCurrentL1Title) {
      var block = findTreeBlockByL1Title(railCurrentL1Title);
      if (block) {
        var row = block.querySelector(".js-tree-l1");
        var v = fieldL1Display.value.trim();
        if (v && row) {
          row.setAttribute("data-tree-label", v);
          row.querySelector(".tree-l1__label").textContent = v;
          block.setAttribute("data-tree-label", v);
          var li = findL1RowEl(railCurrentL1Title);
          if (li) {
            li.setAttribute("data-tree-label", v);
            li.querySelector(".js-l1-name").textContent = v;
          }
          railCurrentL1Title = v;
          railDetailTitle.textContent = v;
        }
        fieldL1Slug.value = slugify(fieldL1Display.value);
      }
    }
    if (detailMode === "l2" && railCurrentL1Title && railCurrentL2Title) {
      var hdr = null;
      var block = findTreeBlockByL1Title(railCurrentL1Title);
      if (block) {
        var headers = block.querySelectorAll(".accordion-header");
        for (var i = 0; i < headers.length; i++) {
          var tit = headers[i].querySelector(".tree-l2__title");
          if (tit && tit.getAttribute("data-tree-label") === railCurrentL2Title) {
            hdr = headers[i];
            break;
          }
        }
      }
      if (hdr) {
        var tit2 = hdr.querySelector(".tree-l2__title");
        var v2 = fieldL2Display.value.trim();
        if (v2 && tit2) {
          tit2.setAttribute("data-tree-label", v2);
          tit2.textContent = v2;
          railCurrentL2Title = v2;
          railDetailTitle.textContent = v2;
          populateL3List(railCurrentL1Title, railCurrentL2Title);
          setupSortableList(detailL3List, "l3");
        }
        fieldL2Slug.value = slugify(fieldL2Display.value);
      }
    }
    if (detailMode === "l3" && l3LabelTreeEl) {
      var v3 = fieldL3Display.value.trim();
      if (v3) {
        var old = l3LabelTreeEl.getAttribute("data-tree-label");
        l3LabelTreeEl.setAttribute("data-tree-label", v3);
        var lab = l3LabelTreeEl.querySelector(".tree-l3__label");
        if (lab) lab.textContent = v3;
        railDetailTitle.textContent = v3;
        if (old && railCurrentL1Title && railCurrentL2Title) {
          populateL3List(railCurrentL1Title, railCurrentL2Title);
          setupSortableList(detailL3List, "l3");
        }
      }
      l3LabelTreeEl.setAttribute("data-l3-type", fieldL3Type.value);
      var href = fieldL3Link.value.trim();
      l3LabelTreeEl.setAttribute("href", href || "#");
    }
    if (detailMode === "add-l3" && l3LabelTreeEl) {
      var va = addNewL3Label.value.trim();
      if (va) {
        l3LabelTreeEl.setAttribute("data-tree-label", va);
        var lb = l3LabelTreeEl.querySelector(".tree-l3__label");
        if (lb) lb.textContent = va;
        railDetailTitle.textContent = va;
        populateL3List(railCurrentL1Title, railCurrentL2Title);
        setupSortableList(detailL3List, "l3");
      }
      l3LabelTreeEl.setAttribute("data-l3-type", addNewL3Type.value);
      l3LabelTreeEl.setAttribute("href", addNewL3Link.value.trim() || "#");
    }
  }

  function commitAddL1() {
    var title = addNewL1Title.value.trim() || uniqueNewL1Title();
    insertNewL1TreeBlockAtEnd(title);
    var li = createAndAppendL1ListItem(title);
    setupSortableList(l1ListEl, "l1");
    bindL1ListRow(li);
    showL1Detail(title, li);
    showToast("Created L1: " + title);
  }

  function commitAddL2() {
    var displayName = addNewL2Title.value.trim() || uniqueNewL2Title(railCurrentL1Title);
    insertNewL2UnderL1Block(railCurrentL1Title, displayName);
    var hdr = null;
    var block = findTreeBlockByL1Title(railCurrentL1Title);
    if (block) {
      var titles = block.querySelectorAll(".tree-l2__title");
      for (var i = titles.length - 1; i >= 0; i--) {
        if (titles[i].getAttribute("data-tree-label") === displayName) {
          hdr = titles[i].closest(".accordion-header");
          break;
        }
      }
    }
    if (hdr) {
      applyTreeSelection("l2", hdr);
      ensureSelectionExpandedAndVisible(hdr);
    }
    populateL1Tiles(railCurrentL1Title);
    showL2Detail(railCurrentL1Title, displayName);
    showToast("Added L2: " + displayName);
  }

  function commitAddL3() {
    syncDirtyFromFields();
    var row = l3LabelTreeEl;
    var label = row ? row.getAttribute("data-tree-label") || addNewL3Label.value.trim() : addNewL3Label.value.trim();
    if (row) {
      fieldL3Display.value = row.getAttribute("data-tree-label") || "";
      fieldL3Type.value = row.getAttribute("data-l3-type") || "link";
      fieldL3Link.value = row.getAttribute("href") === "#" ? "" : row.getAttribute("href") || "";
      populateL3List(railCurrentL1Title, railCurrentL2Title);
      setupSortableList(detailL3List, "l3");
      showL3Detail(railCurrentL1Title, railCurrentL2Title, row);
    }
    showToast("Added L3: " + (label || "link"));
  }

  function bindL1ListRow(li) {
    li.querySelector(".js-l1-edit").addEventListener("click", function (e) {
      e.stopPropagation();
      if (Date.now() < sortableIgnoreClicksUntil) return;
      var title = li.getAttribute("data-tree-label");
      showL1Detail(title, li);
    });
    li.querySelector(".js-l1-delete").addEventListener("click", function (e) {
      e.stopPropagation();
      if (Date.now() < sortableIgnoreClicksUntil) return;
      if (confirm("Delete L1 section \"" + li.getAttribute("data-tree-label") + "\"?")) deleteL1FromListRow(li);
    });
  }

  function initRailControls() {
    [fieldL1Display, fieldL1Slug].forEach(function (el) {
      el.addEventListener("input", syncDirtyFromFields);
    });
    [fieldL2Display, fieldL2Slug].forEach(function (el) {
      el.addEventListener("input", syncDirtyFromFields);
    });
    [fieldL3Display, fieldL3Type, fieldL3Link].forEach(function (el) {
      el.addEventListener("input", syncDirtyFromFields);
      el.addEventListener("change", syncDirtyFromFields);
    });
    [addNewL1Title, addNewL1Slug, addNewL2Title, addNewL2Slug, addNewL3Label, addNewL3Type, addNewL3Link].forEach(function (el) {
      el.addEventListener("input", syncDirtyFromFields);
      el.addEventListener("change", syncDirtyFromFields);
    });

    jsAddL2UnderL1.addEventListener("click", function () {
      startAddNewL2UnderL1(railCurrentL1Title);
    });
    jsDetailAddL3.addEventListener("click", function () {
      startAddNewL3UnderL2(railCurrentL2Title);
    });

    detailL1Tiles.addEventListener("click", function (e) {
      if (e.target.closest(".js-detail-l1-l2-delete")) return;
      var row = e.target.closest(".detail-l2-row");
      if (!row || detailMode !== "l1") return;
      var name = row.getAttribute("data-l2-name") || row.querySelector(".detail-l2-row__label").textContent.trim();
      showL2Detail(railCurrentL1Title, name);
    });

    detailL3List.addEventListener("click", function (e) {
      var del = e.target.closest(".detail-l3-row__delete");
      if (!del) {
        var row = e.target.closest(".detail-l3-row");
        if (row && !e.target.closest(".detail-l3-row__drag") && Date.now() >= sortableIgnoreClicksUntil) {
          var lab = row.getAttribute("data-l3-label");
          var treeRow = findL3RowByL2AndLabel(railCurrentL1Title, railCurrentL2Title, lab);
          if (treeRow) {
            showL3Detail(railCurrentL1Title, railCurrentL2Title, treeRow);
            showToast("Editing: " + lab);
          }
        }
        return;
      }
      var label = del.getAttribute("data-label");
      var tr = findL3RowByL2AndLabel(railCurrentL1Title, railCurrentL2Title, label);
      if (tr) tr.remove();
      del.closest(".detail-l3-row").remove();
      showToast("Removed L3");
    });

    l1ListEl.addEventListener("click", function (e) {
      if (Date.now() < sortableIgnoreClicksUntil) return;
      var row = e.target.closest(".js-l1-row");
      if (!row) return;
      if (e.target.closest(".l1-list__drag")) return;
    });

    document.querySelector(".js-rail-back").addEventListener("click", showListView);
    document.querySelector(".js-rail-close").addEventListener("click", showListView);

    btnAddNewL1.addEventListener("click", startAddNewL1FromList);
  }

  function initPublishMenu() {
    function baselinePublish() {
      if (detailMode === "add") {
        commitAddL2();
        return;
      }
      if (detailMode === "add-l1") {
        commitAddL1();
        return;
      }
      if (detailMode === "add-l3") {
        commitAddL3();
        if (railCurrentL1Title && railCurrentL2Title) {
          populateL3List(railCurrentL1Title, railCurrentL2Title);
          setupSortableList(detailL3List, "l3");
        }
        return;
      }
      syncDirtyFromFields();
      showToast("Published navigation draft");
    }

    btnPublishMain.addEventListener("click", baselinePublish);

    btnPublishMenu.addEventListener("click", function (e) {
      e.stopPropagation();
      var open = !publishDropdown.hidden;
      publishDropdown.hidden = open;
      btnPublishMenu.setAttribute("aria-expanded", String(!open));
    });

    publishDropdown.querySelectorAll("[data-publish-action]").forEach(function (item) {
      item.addEventListener("click", function () {
        publishDropdown.hidden = true;
        btnPublishMenu.setAttribute("aria-expanded", "false");
        var act = item.getAttribute("data-publish-action");
        if (act === "publish-now") baselinePublish();
        else if (act === "schedule") showToast("Schedule flow (prototype)");
        else if (act === "discard") {
          showToast("Discarded draft (prototype)");
          showListView();
        }
      });
    });

    document.addEventListener("click", function (e) {
      if (!e.target.closest(".split-button")) {
        publishDropdown.hidden = true;
        btnPublishMenu.setAttribute("aria-expanded", "false");
      }
    });
  }

  function init() {
    rebuildL1ListFromTree();
    l1ListEl.querySelectorAll(".js-l1-row").forEach(bindL1ListRow);
    initAccordions();
    initL2L3Clicks();
    initL1TreeRows();
    initOverflowMenus();
    initRailControls();
    initPublishMenu();
    showListView();
  }

  init();
})();
