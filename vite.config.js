import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/global-nav-cooking/",
  plugins: [react()],
});
