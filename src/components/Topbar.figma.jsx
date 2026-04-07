import figma from "@figma/code-connect/react";
import { Topbar } from "./Topbar.jsx";

/**
 * Figma: Top Bar-Desktop (prototype alt_b)
 * If publish fails, replace URL with “Copy link to selection” on your component.
 */
figma.connect(
  Topbar,
  "https://www.figma.com/design/iB0GVTl3402z2Hvs11EEvn/Global-Nav-in-cooking?node-id=522-16292",
  {
    example: () => (
      <Topbar
        dirty={false}
        layoutVariant="b"
        onLayoutVariantChange={() => {}}
      />
    ),
  },
);
