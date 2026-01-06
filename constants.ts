/**
 * 环境检测常量
 * 用于判断当前运行环境是否为客户端（浏览器）环境
 */

/**
 * 判断是否在客户端（浏览器）环境中运行
 * 通过检查 globalThis.window 是否存在来判断
 * @returns {boolean} 如果在客户端环境中返回 true，否则返回 false
 */
export const IS_CLIENT = typeof globalThis.window !== "undefined";
