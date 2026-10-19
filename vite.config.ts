import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ command, mode }) => ({
  plugins: [react()],
  // Fail closed outside the local dev server and Vercel Preview builds.
  define: {
    __DEMO_MENU__: JSON.stringify(command === "serve" || loadEnv(mode, ".", "VERCEL_ENV").VERCEL_ENV === "preview"),
  },
}));
