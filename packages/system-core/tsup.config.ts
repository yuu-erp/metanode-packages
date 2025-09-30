import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  dts: true, // sinh file .d.ts
  sourcemap: true, // debug dễ hơn
  clean: true, // xoá dist trước khi build
  minify: false, // lib thường không minify
});
