import figma from "@figma/code-connect/react";
import { TreePanel } from "./TreePanel.jsx";
import { NAV_TREE } from "../data/treeData.js";

/**
 * Figma: middle column Frame 628553 (tree + L1 stacks)
 */
figma.connect(
  TreePanel,
  "https://www.figma.com/design/iB0GVTl3402z2Hvs11EEvn/Global-Nav-in-cooking?node-id=522-16257",
  {
    example: () => (
      <TreePanel
        tree={NAV_TREE}
        selection={{ kind: "l2", l1: "What to cook", l2: "Staff picks" }}
        onSelect={() => {}}
      />
    ),
  },
);
