import { useMemo, useState, useCallback } from "react";
import { NAV_TREE } from "./data/treeData.js";
import { Sidebar } from "./components/Sidebar.jsx";
import { Topbar } from "./components/Topbar.jsx";
import { TreePanel } from "./components/TreePanel.jsx";
import { RightRail } from "./components/RightRail.jsx";

/** Default = selected frame: L2 “Staff picks” under “What to cook” */
const DEFAULT_SELECTION = {
  kind: "l2",
  l1: "What to cook",
  l2: "Staff picks",
};

function activeL1FromSelection(sel) {
  if (!sel) return null;
  return sel.l1;
}

export default function App() {
  const [selection, setSelection] = useState(DEFAULT_SELECTION);
  const [dirty, setDirty] = useState(false);
  /** Figma: alt_a = wider split rail; alt_b = fixed 384px rail + tree column */
  const [layoutVariant, setLayoutVariant] = useState("a");

  const l1Labels = useMemo(() => NAV_TREE.map((b) => b.label), []);

  const activeL1 = activeL1FromSelection(selection);

  const onSelect = useCallback((sel) => {
    setSelection(sel);
    setDirty(true);
  }, []);

  const onPickL1 = useCallback((title) => {
    setSelection({ kind: "l1", l1: title });
    setDirty(true);
  }, []);

  return (
    <div className={`app app--layout-${layoutVariant}`}>
      <Sidebar />
      <div className="app__main">
        <Topbar
          dirty={dirty}
          layoutVariant={layoutVariant}
          onLayoutVariantChange={setLayoutVariant}
        />
        <div className="workspace">
          <div className="workspace__scroll" id="workspace-scroll">
            <TreePanel tree={NAV_TREE} selection={selection} onSelect={onSelect} />
          </div>
          <RightRail
            l1Labels={l1Labels}
            activeL1={activeL1}
            onPickL1={onPickL1}
          />
        </div>
      </div>
    </div>
  );
}
