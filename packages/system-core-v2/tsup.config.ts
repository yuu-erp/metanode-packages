import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  bundle: true,
  splitting: false,
  minify: false,
  sourcemap: true,
  clean: true,
  platform: "neutral",
  target: "es2020",
  outDir: "dist",
  noExternal: [/.*/], // ép bundle mọi package, kể cả ESM
  outExtension({ format }) {
    return format === "esm" ? { js: ".mjs" } : { js: ".cjs" };
  },
});
