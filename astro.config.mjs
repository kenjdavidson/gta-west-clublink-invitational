import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  base: "/gta-west-clublink-invitational/",
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
  },
});
