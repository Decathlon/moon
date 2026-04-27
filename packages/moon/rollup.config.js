import typescript from "@rollup/plugin-typescript";
import commonjs from "@rollup/plugin-commonjs";
import external from "rollup-plugin-peer-deps-external";
import resolve from "@rollup/plugin-node-resolve";
import json from "@rollup/plugin-json";
import { readFileSync } from "fs";

// Rollup 4 runs config files as strict ESM, where `import pkg from "./package.json"`
// is no longer accepted without an import attribute. Read via fs to stay
// portable across Node 18+ without relying on import-attribute syntax.
const pkg = JSON.parse(readFileSync(new URL("./package.json", import.meta.url), "utf-8"));

const TARGETS = [
  { format: "umd", name: "Moon", dir: "./dist", tsconfig: "./tsconfig.umd.json" },
  { format: "es", file: pkg.module, tsconfig: "./tsconfig.es.json" }
];

export default TARGETS.map(target => ({
  input: "src/index.ts",
  output: {
    name: target.name,
    file: target.file,
    format: target.format,
    exports: "named",
    sourcemap: true,
    dir: target.dir
  },
  plugins: [typescript({ tsconfig: target.tsconfig }), json(), external(), resolve(), commonjs()]
}));
