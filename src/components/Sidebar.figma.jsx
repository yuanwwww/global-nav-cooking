import figma from "@figma/code-connect/react";
import { Sidebar } from "./Sidebar.jsx";

/**
 * Figma: Global Nav sidebar instance
 */
figma.connect(
  Sidebar,
  "https://www.figma.com/design/iB0GVTl3402z2Hvs11EEvn/Global-Nav-in-cooking?node-id=522-16304",
  {
    example: () => <Sidebar />,
  },
);
