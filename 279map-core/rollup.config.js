import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import typescript from "@rollup/plugin-typescript";
import json from "@rollup/plugin-json";
import dts from "rollup-plugin-dts";
import postcss from 'rollup-plugin-postcss';
import del from 'rollup-plugin-delete';
import image from '@rollup/plugin-image';
import urlResolve from 'rollup-plugin-url-resolve';
import { terser } from 'rollup-plugin-terser';

const packageJson = require("./package.json");

function getPlugins(name) {
  return [
    terser({
      format: {
        comments: false,
      }
    }),
      resolve(),
      commonjs(),
      typescript({
        tsconfig: "./tsconfig.json",
        declarationDir: name + '/types',
        removeComments: true,
      }),
      postcss({
        extract: false,
        modules: {
          // CSS Modulesの設定
          generateScopedName: '[name]__[local]___[hash:base64:5]',
          exclude: 'react-tooltip/dist/react-tooltip.css', // 除外するファイルの指定
        },
        use: ['sass'],
        extensions: ['.css', '.scss']
      }),
      json(),
      del({ targets: name + '/*' }),
      image(),
      urlResolve(),
  ]
}
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
    plugins: getPlugins(packageJson.main),
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
    plugins: getPlugins(packageJson.module),
  },
  // make index.d.ts
  {
    input: "dist/esm/types/entry.d.ts",
    output: [{ file: "dist/index.d.ts", format: "esm" }],
    external: [/\.scss$/],
    plugins: [dts()],
  },
];