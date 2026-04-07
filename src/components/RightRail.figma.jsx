import figma from "@figma/code-connect/react";
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
        l1Labels={["What to cook", "From our newsletters", "Cooking guides"]}
        activeL1="What to cook"
        onPickL1={() => {}}
      />
    ),
  },
);
