import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/CCPD_TV/client/",
  plugins: [react()]
});
