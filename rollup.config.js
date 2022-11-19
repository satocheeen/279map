import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import typescript from "@rollup/plugin-typescript";
import json from "@rollup/plugin-json";
import dts from "rollup-plugin-dts";
import postcss from 'rollup-plugin-postcss';
import del from 'rollup-plugin-delete';

const packageJson = require("./package.json");

export default [
  {
    input: "src/index.ts",
    output: [
      {
        dir: packageJson.main,
        format: "cjs",
        sourcemap: true,
      },
    ],
    external: ["react", "react-dom"],
    plugins: [
      resolve(),
      commonjs(),
      typescript({
        tsconfig: "./tsconfig.json",
        declarationDir: packageJson.main + '/types',
      }),
      postcss({
        extract: false,
        modules: true,
        use: ['sass'],
      }),
      json(),
      del({ targets: packageJson.main + '/*' })
    ],
  },
  {
    input: "src/index.ts",
    output: [
      {
        dir: packageJson.module,
        format: "esm",
        sourcemap: true,
      },
    ],
    external: ["react", "react-dom"],
    plugins: [
      resolve(),
      commonjs(),
      typescript({
        tsconfig: "./tsconfig.json",
        declarationDir: packageJson.module + '/types',
      }),
      postcss({
        extract: false,
        modules: true,
        use: ['sass'],
      }),
      json(),
      del({ targets: packageJson.module + '/*' })
    ],
  },
  {
    input: "dist/esm/types/index.d.ts",
    output: [{ file: "dist/index.d.ts", format: "esm" }],
    plugins: [dts()],
  },
];