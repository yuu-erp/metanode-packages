import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  dts: true,
  minify: true,
  bundle: true, // ✅ bundle all deps
  platform: "browser", // ✅ browser friendly
  splitting: false,
  sourcemap: true,
  clean: true,
  outDir: "dist",
  outExtension({ format }) {
    return format === "esm" ? { js: ".mjs" } : { js: ".cjs" };
  },
});
