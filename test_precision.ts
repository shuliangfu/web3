/**
 * 测试 fromWei 和 toWei 的精度
 */

import { fromWei, toWei } from "./src/utils.ts";

console.log("测试 fromWei 和 toWei 的精度修复...\n");

// 测试 1: 基本转换
console.log("测试 1: 基本转换");
const test1 = fromWei("1000000000000000000", "ether");
console.log(`fromWei('1000000000000000000', 'ether') = ${test1}`);
console.log(`期望: 1`);
console.log(`结果: ${test1 === "1" ? "✓ 通过" : "✗ 失败"}\n`);

// 测试 2: 小数转换 fromWei
console.log("测试 2: 小数转换 fromWei");
const test2 = fromWei("1500000000000000000", "ether");
console.log(`fromWei('1500000000000000000', 'ether') = ${test2}`);
console.log(`期望: 1.5`);
console.log(`结果: ${test2 === "1.5" ? "✓ 通过" : "✗ 失败"}\n`);

// 测试 3: 小数转换 toWei
console.log("测试 3: 小数转换 toWei");
const test3 = toWei("1.5", "ether");
console.log(`toWei('1.5', 'ether') = ${test3}`);
console.log(`期望: 1500000000000000000`);
console.log(`结果: ${test3 === "1500000000000000000" ? "✓ 通过" : "✗ 失败"}\n`);

// 测试 4: 往返转换
console.log("测试 4: 往返转换");
const original = "1234567890123456789";
const converted = fromWei(original, "ether");
const back = toWei(converted, "ether");
console.log(`原始: ${original}`);
console.log(`转换为 ether: ${converted}`);
console.log(`转回 wei: ${back}`);
console.log(`结果: ${back === original ? "✓ 通过" : "✗ 失败"}\n`);

// 测试 5: 大数转换
console.log("测试 5: 大数转换");
const largeWei = "999999999999999999999999999";
const largeEther = fromWei(largeWei, "ether");
const largeBack = toWei(largeEther, "ether");
console.log(`原始: ${largeWei}`);
console.log(`转换为 ether: ${largeEther}`);
console.log(`转回 wei: ${largeBack}`);
console.log(`结果: ${largeBack === largeWei ? "✓ 通过" : "✗ 失败"}\n`);

// 测试 6: 小数精度
console.log("测试 6: 小数精度");
const precise = toWei("0.123456789012345678", "ether");
const preciseBack = fromWei(precise, "ether");
console.log(`原始: 0.123456789012345678`);
console.log(`转换为 wei: ${precise}`);
console.log(`转回 ether: ${preciseBack}`);
console.log(`结果: ${preciseBack === "0.123456789012345678" ? "✓ 通过" : "✗ 失败"}\n`);

console.log("所有测试完成！");
