import { useState, useCallback, useEffect, useRef } from "react";
import { flushSync } from "react-dom";
import { NAV_TREE } from "./data/treeData.js";
import {
  addL2Child,
  addL3Child,
  uniqueAmong,
  removeL2Child,
  renameL2Child,
  removeL3Child,
  renameL3Child,
  reorderL2Children,
  reorderL3Children,
} from "./data/treeMutations.js";
import { Sidebar } from "./components/Sidebar.jsx";
import { Topbar } from "./components/Topbar.jsx";
import { TreePanel } from "./components/TreePanel.jsx";
import { RightRail } from "./components/RightRail.jsx";

export default function App() {
  /** null = no tree focus; layout B hides the right rail until something is selected */
  const [selection, setSelection] = useState(null);
  const [dirty, setDirty] = useState(false);
  /** Figma: alt_a = wider split rail; alt_b = tree column + rest-state cards (default) */
  const [layoutVariant, setLayoutVariant] = useState("b");
  /** Working copy; L1 order updated after Sort L1 → Okay */
  const [navTree, setNavTree] = useState(() => [...NAV_TREE]);
  /** Right-rail add flow: replaces detail with NEW L2 / NEW L3 form */
  const [railDraft, setRailDraft] = useState(null);
  /** One-shot: expand L2 accordion after adding a child L2 */
  const [expandL2Target, setExpandL2Target] = useState(null);

  const railDraftRef = useRef(null);
  railDraftRef.current = railDraft;

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
        const existing = l2node?.l3s ?? [];
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
        const existing = l2node?.l3s ?? [];
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
          />
        </div>
      </div>
    </div>
  );
}
