import typescript from "@rollup/plugin-typescript";
import commonjs from "@rollup/plugin-commonjs";
import external from "rollup-plugin-peer-deps-external";
import resolve from "@rollup/plugin-node-resolve";
import json from "@rollup/plugin-json";

import pkg from "./package.json";

const TARGETS = [
  { format: "umd", name: "MoonGraphQL", dir: "./dist", tsconfig: "./tsconfig.umd.json" },
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
