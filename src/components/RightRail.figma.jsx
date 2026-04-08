import figma from "@figma/code-connect/react";
import { NAV_TREE } from "../data/treeData.js";
import { RightRail } from "./RightRail.jsx";

/**
 * Figma: Right Rail-Desktop “All L1s” panel
 */
figma.connect(
  RightRail,
  "https://www.figma.com/design/iB0GVTl3402z2Hvs11EEvn/Global-Nav-in-cooking?node-id=522-16246",
  {
    example: () => (
      <RightRail
        tree={NAV_TREE}
        selection={{ kind: "l2", l1: "What to Cook", l2: "Staff picks" }}
        onSelect={() => {}}
      />
    ),
  },
);
