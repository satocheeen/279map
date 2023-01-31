import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import typescript from "@rollup/plugin-typescript";
import json from "@rollup/plugin-json";
import dts from "rollup-plugin-dts";
import postcss from 'rollup-plugin-postcss';
import del from 'rollup-plugin-delete';
import image from '@rollup/plugin-image';
import urlResolve from 'rollup-plugin-url-resolve';

const packageJson = require("./package.json");

export default [
  {
    input: "src/entry.ts",
    output: [
      {
        dir: packageJson.main,
        entryFileNames: () => "index.js",
        format: "cjs",
        sourcemap: false,
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
      del({ targets: packageJson.main + '/*' }),
      image(),
      urlResolve(),
    ],
  },
  {
    input: "src/entry.ts",
    output: [
      {
        dir: packageJson.module,
        entryFileNames: () => "index.js",
        format: "esm",
        sourcemap: false,
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
      del({ targets: packageJson.module + '/*' }),
      image(),
      urlResolve(),
    ],
  },
  // make index.d.ts
  {
    input: "dist/esm/types/entry.d.ts",
    output: [{ file: "dist/index.d.ts", format: "esm" }],
    external: [/\.scss$/],
    plugins: [dts()],
  },
];