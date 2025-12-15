import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  bundle: true,
  splitting: false,
  minify: false,
  sourcemap: true,
  clean: true,
  platform: "browser", // buộc tsup bundle cho browser
  external: [], // buộc bundle mọi package
  target: "es2020",
  outDir: "dist",
  outExtension({ format }) {
    return format === "esm" ? { js: ".mjs" } : { js: ".cjs" };
  },
});
