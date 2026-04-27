import { useState, useCallback, useEffect, useLayoutEffect, useRef } from "react";
import { flushSync } from "react-dom";
import { NAV_TREE } from "./data/treeData.js";
import { NAV_TYPE_PLAIN_TEXT } from "./data/navTypes.js";
import {
  addL1Block,
  addL2Child,
  addL3Child,
  createNewL1Block,
  uniqueAmong,
  removeL1Block,
  removeL2Child,
  renameL2Child,
  removeL3Child,
  renameL3Child,
  reorderL2Children,
  reorderL3Children,
  l3Label,
  updateL1Block,
  updateL2Entry,
  updateL3Entry,
} from "./data/treeMutations.js";
import { Sidebar } from "./components/Sidebar.jsx";
import { Topbar } from "./components/Topbar.jsx";
import { TreePanel } from "./components/TreePanel.jsx";
import { RightRail } from "./components/RightRail.jsx";
import { AddL1Modal } from "./components/AddL1Modal.jsx";
import { ConfirmDeleteModal } from "./components/ConfirmDeleteModal.jsx";

export default function App() {
  /** null = no tree focus; layout B hides the right rail until something is selected */
  const [selection, setSelection] = useState(null);
  const [dirty, setDirty] = useState(false);
  /** Figma: alt_a = wider split rail; alt_b = tree column + rest-state cards (default) */
  const [layoutVariant, setLayoutVariant] = useState("b");
  /** Working copy; L1 order updated after Reorder Sections → Confirm changes */
  const [navTree, setNavTree] = useState(() => [...NAV_TREE]);
  /** Right-rail add flow: replaces detail with NEW L2 / NEW L3 form */
  const [railDraft, setRailDraft] = useState(null);
  /** One-shot: expand L2 accordion after adding a child L2 */
  const [expandL2Target, setExpandL2Target] = useState(null);
  /** Add nav modal: `parentL1` null = new L1; set + `parentL2` null = under L1; set both = L3 under L2 */
  const [addNavModal, setAddNavModal] = useState({
    open: false,
    parentL1: null,
    parentL2: null,
  });
  /** One-shot: scroll tree panel to this L1 label after add */
  const [scrollTreeToL1, setScrollTreeToL1] = useState(null);
  /** Confirm-delete modal: `kind` + labels for removeL1Block / removeL2Child / removeL3Child */
  const [deleteModal, setDeleteModal] = useState(null);

  const railDraftRef = useRef(null);
  railDraftRef.current = railDraft;
  const selectionRef = useRef(null);
  selectionRef.current = selection;
  /** set inside setNavTree updaters; applied in useLayoutEffect so selection matches renamed labels */
  const selectionAfterTree = useRef(null);

  const onSelect = useCallback((sel) => {
    setSelection(sel);
    setDirty(true);
  }, []);

  const onL1Reorder = useCallback((blocks) => {
    setNavTree(blocks);
    setDirty(true);
  }, []);

  const onL2Reorder = useCallback((l1, fromIndex, toIndex) => {
    setNavTree((prev) => reorderL2Children(prev, l1, fromIndex, toIndex));
    setDirty(true);
  }, []);

  const onL3Reorder = useCallback((l1, l2, fromIndex, toIndex) => {
    setNavTree((prev) => reorderL3Children(prev, l1, l2, fromIndex, toIndex));
    setDirty(true);
  }, []);

  const onCloseRail = useCallback(() => {
    setRailDraft((current) => {
      if (current?.kind === "add-l2" && current.draftL2Label) {
        setNavTree((prev) => removeL2Child(prev, current.l1, current.draftL2Label));
      } else if (current?.kind === "add-l3" && current.draftL3Label) {
        setNavTree((prev) => removeL3Child(prev, current.l1, current.l2, current.draftL3Label));
      }
      return null;
    });
    setSelection(null);
  }, []);

  const onDismissRailDraft = useCallback(() => {
    setRailDraft((current) => {
      if (current?.kind === "add-l2" && current.draftL2Label) {
        setNavTree((prev) => removeL2Child(prev, current.l1, current.draftL2Label));
        setSelection({ kind: "l1", l1: current.l1 });
      } else if (current?.kind === "add-l3" && current.draftL3Label) {
        setNavTree((prev) => removeL3Child(prev, current.l1, current.l2, current.draftL3Label));
        setSelection({ kind: "l2", l1: current.l1, l2: current.l2 });
      }
      return null;
    });
  }, []);

  const newDraftId = useCallback(() => {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return crypto.randomUUID();
    }
    return `draft-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }, []);

  const onRequestAddL2 = useCallback(() => {
    if (selection?.kind !== "l1") return;
    const l1 = selection.l1;
    const draftId = newDraftId();
    let draftL2Label;
    flushSync(() => {
      setNavTree((prev) => {
        const block = prev.find((b) => b.label === l1);
        const existing = block?.l2s.map((l) => l.label) ?? [];
        draftL2Label = uniqueAmong("New L2", existing);
        return addL2Child(prev, l1, { label: draftL2Label, l3s: [] });
      });
    });
    setRailDraft({ kind: "add-l2", l1, draftL2Label, draftId });
    setSelection({ kind: "l2", l1, l2: draftL2Label });
    setExpandL2Target({ l1, l2: draftL2Label });
    setDirty(true);
  }, [selection, newDraftId]);

  const onRequestAddL3 = useCallback(() => {
    if (selection?.kind !== "l2") return;
    const { l1, l2 } = selection;
    const draftId = newDraftId();
    let draftL3Label;
    flushSync(() => {
      setNavTree((prev) => {
        const block = prev.find((b) => b.label === l1);
        const l2node = block?.l2s.find((x) => x.label === l2);
        const existing = (l2node?.l3s ?? []).map(l3Label);
        draftL3Label = uniqueAmong("New link", existing);
        return addL3Child(prev, l1, l2, draftL3Label);
      });
    });
    setRailDraft({ kind: "add-l3", l1, l2, draftL3Label, draftId });
    setSelection({ kind: "l3", l1, l2, l3: draftL3Label });
    setExpandL2Target({ l1, l2 });
    setDirty(true);
  }, [selection, newDraftId]);

  const onUpdateAddL2Draft = useCallback((payload) => {
    const d = railDraftRef.current;
    if (d?.kind !== "add-l2" || !d.draftL2Label) return;
    const { l1, draftL2Label } = d;
    let finalLabel;
    flushSync(() => {
      setNavTree((prev) => {
        const block = prev.find((b) => b.label === l1);
        const existing = block?.l2s.map((l) => l.label) ?? [];
        const taken = existing.filter((x) => x !== draftL2Label);
        finalLabel = uniqueAmong(payload.displayName, taken);
        if (finalLabel === draftL2Label) return prev;
        return renameL2Child(prev, l1, draftL2Label, finalLabel);
      });
    });
    setRailDraft((prev) =>
      prev?.kind === "add-l2" && prev.draftL2Label === draftL2Label
        ? { ...prev, draftL2Label: finalLabel }
        : prev
    );
    setSelection((sel) => {
      if (sel?.kind === "l2" && sel.l1 === l1 && sel.l2 === draftL2Label) {
        return { ...sel, l2: finalLabel };
      }
      return sel;
    });
    setExpandL2Target({ l1, l2: finalLabel });
    setDirty(true);
  }, []);

  const onUpdateAddL3Draft = useCallback((payload) => {
    const d = railDraftRef.current;
    if (d?.kind !== "add-l3" || !d.draftL3Label) return;
    const { l1, l2, draftL3Label } = d;
    let finalLabel;
    flushSync(() => {
      setNavTree((prev) => {
        const block = prev.find((b) => b.label === l1);
        const l2node = block?.l2s.find((x) => x.label === l2);
        const existing = (l2node?.l3s ?? []).map(l3Label);
        const taken = existing.filter((x) => x !== draftL3Label);
        finalLabel = uniqueAmong(payload.displayName, taken);
        if (finalLabel === draftL3Label) return prev;
        return renameL3Child(prev, l1, l2, draftL3Label, finalLabel);
      });
    });
    setRailDraft((prev) =>
      prev?.kind === "add-l3" && prev.draftL3Label === draftL3Label
        ? { ...prev, draftL3Label: finalLabel }
        : prev
    );
    setSelection((sel) => {
      if (sel?.kind === "l3" && sel.l1 === l1 && sel.l2 === l2 && sel.l3 === draftL3Label) {
        return { ...sel, l3: finalLabel };
      }
      return sel;
    });
    setDirty(true);
  }, []);

  useEffect(() => {
    if (railDraft?.kind !== "add-l2" || !railDraft.draftL2Label) return;
    const stillOnDraft =
      selection?.kind === "l2" &&
      selection.l1 === railDraft.l1 &&
      selection.l2 === railDraft.draftL2Label;
    if (stillOnDraft) return;
    setNavTree((prev) => removeL2Child(prev, railDraft.l1, railDraft.draftL2Label));
    setRailDraft(null);
  }, [selection, railDraft]);

  useEffect(() => {
    if (railDraft?.kind !== "add-l3" || !railDraft.draftL3Label) return;
    const stillOnDraft =
      selection?.kind === "l3" &&
      selection.l1 === railDraft.l1 &&
      selection.l2 === railDraft.l2 &&
      selection.l3 === railDraft.draftL3Label;
    if (stillOnDraft) return;
    setNavTree((prev) => removeL3Child(prev, railDraft.l1, railDraft.l2, railDraft.draftL3Label));
    setRailDraft(null);
  }, [selection, railDraft]);

  const onExpandL2Consumed = useCallback(() => setExpandL2Target(null), []);

  const onScrollTreeToL1Consumed = useCallback(() => setScrollTreeToL1(null), []);

  const onUpdateL1Detail = useCallback((fields) => {
    const s = selectionRef.current;
    if (s?.kind !== "l1") return;
    setNavTree((prev) => {
      const { tree, resolved } = updateL1Block(prev, s.l1, fields);
      selectionAfterTree.current = { t: "l1", from: s.l1, to: resolved.l1 };
      return tree;
    });
    setDirty(true);
  }, []);

  const onUpdateL2Detail = useCallback((fields) => {
    const s = selectionRef.current;
    if (s?.kind !== "l2") return;
    setNavTree((prev) => {
      const { tree, resolved } = updateL2Entry(prev, s.l1, s.l2, fields);
      selectionAfterTree.current = {
        t: "l2",
        l1: s.l1,
        from: s.l2,
        to: resolved.l2,
      };
      return tree;
    });
    setDirty(true);
  }, []);

  const onUpdateL3Detail = useCallback((fields) => {
    const s = selectionRef.current;
    if (s?.kind !== "l3") return;
    setNavTree((prev) => {
      const { tree, resolved } = updateL3Entry(prev, s.l1, s.l2, s.l3, fields);
      selectionAfterTree.current = {
        t: "l3",
        l1: s.l1,
        l2: s.l2,
        from: s.l3,
        to: resolved.l3,
      };
      return tree;
    });
    setDirty(true);
  }, []);

  useLayoutEffect(() => {
    const p = selectionAfterTree.current;
    if (!p) return;
    selectionAfterTree.current = null;
    if (p.t === "l1") {
      setSelection((cur) => (cur?.kind === "l1" && cur.l1 === p.from ? { kind: "l1", l1: p.to } : cur));
    } else if (p.t === "l2") {
      setSelection((cur) =>
        cur?.kind === "l2" && cur.l1 === p.l1 && cur.l2 === p.from
          ? { kind: "l2", l1: p.l1, l2: p.to }
          : cur
      );
    } else {
      setSelection((cur) =>
        cur?.kind === "l3" && cur.l1 === p.l1 && cur.l2 === p.l2 && cur.l3 === p.from
          ? { kind: "l3", l1: p.l1, l2: p.l2, l3: p.to }
          : cur
      );
    }
  }, [navTree]);

  const openAddNavModal = useCallback((parentL1, parentL2 = null) => {
    setAddNavModal({ open: true, parentL1, parentL2 });
  }, []);

  const openDeleteModal = useCallback((payload) => {
    setDeleteModal(payload);
  }, []);

  const closeDeleteModal = useCallback(() => setDeleteModal(null), []);

  const onConfirmDelete = useCallback(() => {
    const d = deleteModal;
    if (!d) return;
    setDeleteModal(null);
    setRailDraft(null);
    setExpandL2Target(null);
    if (d.kind === "l1") {
      setNavTree((prev) => removeL1Block(prev, d.l1));
      setSelection((sel) => {
        if (!sel || sel.l1 !== d.l1) return sel;
        return null;
      });
    } else if (d.kind === "l2") {
      setNavTree((prev) => removeL2Child(prev, d.l1, d.l2));
      setSelection((sel) => {
        if (!sel || sel.l1 !== d.l1) return sel;
        if (sel.kind === "l1") return sel;
        if (sel.kind === "l2" && sel.l2 === d.l2) return { kind: "l1", l1: d.l1 };
        if (sel.kind === "l3" && sel.l2 === d.l2) return { kind: "l1", l1: d.l1 };
        return sel;
      });
    } else {
      setNavTree((prev) => removeL3Child(prev, d.l1, d.l2, d.l3));
      setSelection((sel) => {
        if (!sel) return sel;
        if (sel.kind === "l3" && sel.l1 === d.l1 && sel.l2 === d.l2 && sel.l3 === d.l3) {
          return { kind: "l2", l1: d.l1, l2: d.l2 };
        }
        return sel;
      });
    }
    setDirty(true);
  }, [deleteModal]);

  const onConfirmAddNav = useCallback(
    ({ parentL1, parentL2, displayName, level, navType, navLink }) => {
      const linkTrim = typeof navLink === "string" ? navLink.trim() : "";
      if (parentL1 != null && parentL2 != null) {
        setNavTree((prev) =>
          addL3Child(prev, parentL1, parentL2, {
            label: displayName,
            navType,
            ...(linkTrim !== "" ? { navLink: linkTrim } : {}),
          })
        );
        setSelection({ kind: "l3", l1: parentL1, l2: parentL2, l3: displayName });
        setRailDraft(null);
        setExpandL2Target({ l1: parentL1, l2: parentL2 });
        setAddNavModal({ open: false, parentL1: null, parentL2: null });
        setDirty(true);
        return;
      }
      if (parentL1 == null) {
        const block = createNewL1Block(displayName, level, {
          ...(navType ? { navType } : {}),
          navLink,
        });
        setNavTree((prev) => addL1Block(prev, block));
        setSelection({ kind: "l1", l1: displayName });
        setRailDraft(null);
        if (level === "item") {
          setExpandL2Target({ l1: displayName, l2: "New column" });
        }
        setScrollTreeToL1(displayName);
      } else if (level === "column") {
        setNavTree((prev) =>
          addL2Child(prev, parentL1, {
            label: displayName,
            l3s: [],
            ...(navType ? { navType } : {}),
            ...(linkTrim !== "" ? { navLink: linkTrim } : {}),
          })
        );
        setSelection({ kind: "l2", l1: parentL1, l2: displayName });
        setRailDraft(null);
        setExpandL2Target({ l1: parentL1, l2: displayName });
      } else {
        let colName;
        const linkTrim = typeof navLink === "string" ? navLink.trim() : "";
        const plain = navType === NAV_TYPE_PLAIN_TEXT;
        setNavTree((prev) => {
          const block = prev.find((b) => b.label === parentL1);
          const existing = block?.l2s.map((l) => l.label) ?? [];
          colName = uniqueAmong("New column", existing);
          const l3Payload = plain
            ? { label: displayName, navType: NAV_TYPE_PLAIN_TEXT }
            : {
                label: displayName,
                navType: navType || "collection",
                ...(linkTrim !== "" ? { navLink: linkTrim } : {}),
              };
          return addL2Child(prev, parentL1, { label: colName, l3s: [l3Payload] });
        });
        setSelection({ kind: "l3", l1: parentL1, l2: colName, l3: displayName });
        setRailDraft(null);
        setExpandL2Target({ l1: parentL1, l2: colName });
      }
      setAddNavModal({ open: false, parentL1: null, parentL2: null });
      setDirty(true);
    },
    []
  );

  return (
    <div className={`app app--layout-${layoutVariant}`}>
      <Sidebar />
      <div className="app__main">
        <Topbar
          dirty={dirty}
          layoutVariant={layoutVariant}
          onLayoutVariantChange={setLayoutVariant}
        />
        <div
          className={`workspace${layoutVariant === "b" && selection == null ? " workspace--b-no-rail" : ""}`}
        >
          <div className="workspace__scroll" id="workspace-scroll">
            <TreePanel
              tree={navTree}
              selection={selection}
              onSelect={onSelect}
              onL1Reorder={onL1Reorder}
              onL2Reorder={onL2Reorder}
              onL3Reorder={onL3Reorder}
              layoutVariant={layoutVariant}
              expandL2Target={expandL2Target}
              onExpandL2Consumed={onExpandL2Consumed}
              onAddSection={() => openAddNavModal(null)}
              scrollToL1Label={scrollTreeToL1}
              onScrollToL1Consumed={onScrollTreeToL1Consumed}
              onRequestDelete={openDeleteModal}
            />
          </div>
          <RightRail
            tree={navTree}
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
            onOpenAddNavModal={openAddNavModal}
          />
        </div>
      </div>
      <AddL1Modal
        open={addNavModal.open}
        tree={navTree}
        parentL1={addNavModal.parentL1}
        parentL2={addNavModal.parentL2}
        onClose={() => setAddNavModal({ open: false, parentL1: null, parentL2: null })}
        onConfirm={onConfirmAddNav}
      />
      <ConfirmDeleteModal
        open={deleteModal != null}
        kind={deleteModal?.kind ?? null}
        onClose={closeDeleteModal}
        onConfirm={onConfirmDelete}
      />
    </div>
  );
}
