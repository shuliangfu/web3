#!/usr/bin/env -S deno run -A
// deno run -A build-browser.ts
/**
 * 构建浏览器版本的客户端 bundle
 *
 * 将 src/client/mod.ts 及其依赖打包成 ESM 文件。
 * - 默认构建：包含 viem，单文件即可使用。
 * - external 构建：不包含 viem，需通过 import map 或 bundler 提供 viem，体积更小。
 *
 * 使用方法：
 *   deno run -A build-browser.ts
 *
 * 输出：
 *   dist/web3-client.esm.js              - 完整版（含 sourcemap）
 *   dist/web3-client.esm.min.js           - 压缩版（含 viem）
 *   dist/web3-client.esm.external.min.js  - 压缩版（viem 外置，体积更小）
 *   dist/meta.json                        - 体积分析用 metafile（用于 https://esbuild.github.io/analyze/）
 */

import * as esbuild from "npm:esbuild@0.19.12";
import { dirname, resolve } from "jsr:@std/path@1";

// 获取当前脚本所在目录作为项目根目录
const ROOT = dirname(new URL(import.meta.url).pathname);
const DIST = resolve(ROOT, "dist");

// 确保 dist 目录存在
await Deno.mkdir(DIST, { recursive: true });

const entry = resolve(ROOT, "src/client/mod.ts");
const common = {
  entryPoints: [entry],
  bundle: true,
  format: "esm" as const,
  platform: "browser" as const,
  target: ["es2020", "chrome90", "firefox88", "safari14"],
  treeShaking: true,
  define: {
    "process.env.NODE_ENV": '"production"',
    "global": "globalThis",
  },
  logLevel: "info" as const,
};

console.log("[build-browser] 开始构建客户端 bundle...");

// 1. 构建完整版（带 sourcemap）
await esbuild.build({
  ...common,
  outfile: resolve(DIST, "web3-client.esm.js"),
  sourcemap: true,
  minify: false,
  external: [],
});
console.log("[build-browser] ✅ dist/web3-client.esm.js");

// 2. 构建压缩版（含 viem），并生成 metafile 便于体积分析
const minResult = await esbuild.build({
  ...common,
  outfile: resolve(DIST, "web3-client.esm.min.js"),
  sourcemap: false,
  minify: true,
  legalComments: "none", // 移除 license 等注释，减小体积
  drop: ["debugger"], // 移除 debugger 语句
  external: [],
  metafile: true,
});
console.log("[build-browser] ✅ dist/web3-client.esm.min.js");

if (minResult.metafile) {
  await Deno.writeTextFile(
    resolve(DIST, "meta.json"),
    JSON.stringify(minResult.metafile, null, 2),
  );
  console.log(
    "[build-browser] ✅ dist/meta.json（可上传至 https://esbuild.github.io/analyze/ 查看体积构成）",
  );
}

// 3. 构建 external 版（viem 外置，体积更小；使用时需通过 import map 或 bundler 提供 viem）
await esbuild.build({
  ...common,
  outfile: resolve(DIST, "web3-client.esm.external.min.js"),
  sourcemap: false,
  minify: true,
  external: ["viem"],
});
console.log("[build-browser] ✅ dist/web3-client.esm.external.min.js");

// 4. 生成类型声明文件（完整版与 external 版共用同一类型）
const dtsContent = `/**
 * 客户端 Web3 操作类型声明
 * 此文件从 TypeScript 源文件重新导出类型
 */
export * from "../src/client/mod.ts";
`;

await Deno.writeTextFile(resolve(DIST, "web3-client.esm.d.ts"), dtsContent);
await Deno.writeTextFile(
  resolve(DIST, "web3-client.esm.min.d.ts"),
  dtsContent,
);
await Deno.writeTextFile(
  resolve(DIST, "web3-client.esm.external.min.d.ts"),
  dtsContent,
);
console.log("[build-browser] ✅ dist/*.d.ts");

// 输出体积
const fmt = (bytes: number) => `${(bytes / 1024).toFixed(1)} KB`;
const minStats = await Deno.stat(resolve(DIST, "web3-client.esm.min.js"));
const extStats = await Deno.stat(
  resolve(DIST, "web3-client.esm.external.min.js"),
);
console.log(
  `[build-browser] 压缩版（含 viem）: ${fmt(minStats.size)}`,
);
console.log(
  `[build-browser] 压缩版（viem 外置）: ${fmt(extStats.size)}`,
);
console.log("[build-browser] ✅ 构建完成！");

esbuild.stop();
