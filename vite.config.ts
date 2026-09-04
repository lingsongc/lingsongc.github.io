import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
    plugins: [react()],
    build: {
        rollupOptions: {
            input: {
                main: "index.html",
                modulo: "projects/modulo/index.html",
                pneurelief: "projects/pneurelief/index.html",
            },
        },
    },
});
