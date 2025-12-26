// rollup.config.cjs
const resolve = require("@rollup/plugin-node-resolve").default;
const commonjs = require("@rollup/plugin-commonjs");
const typescript = require("@rollup/plugin-typescript");
const { terser } = require("rollup-plugin-terser");

module.exports = {
  input: "src/index.ts",
  output: {
    file: "dist/index.mjs",
    format: "esm",
    sourcemap: true,
  },
  plugins: [
    resolve({ browser: true }),
    commonjs(),
    typescript({ tsconfig: "./tsconfig.json" }),
    terser(),
  ],
};
