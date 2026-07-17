import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
    base: process.env.GITHUB_PAGES ? "/looksmatch/" : "/",
    plugins: [react()],
    server: {
        port: 3000,
        open: true,
    },
});
