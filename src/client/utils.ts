/**
 * @module @dreamer/web3/client/utils
 *
 * 客户端导出的 Web3 工具函数（仅单位转换与地址相关）
 * 供 client/mod.ts 重新导出：formatAddress, fromWei, isAddress, toChecksumAddress, toWei, Unit
 */

import { getAddress, isAddress as viemIsAddress } from "viem";

// ==================== 对外工具 ====================

/**
 * 以太坊单位枚举
 */
export enum Unit {
  wei = "wei",
  kwei = "kwei",
  mwei = "mwei",
  gwei = "gwei",
  szabo = "szabo",
  finney = "finney",
  ether = "ether",
}

/**
 * 单位转换表（相对于 wei 的倍数）
 */
const UNIT_MAP: Record<string, bigint> = {
  wei: BigInt(1),
  kwei: BigInt(1000),
  mwei: BigInt(1000000),
  gwei: BigInt(1000000000),
  szabo: BigInt(1000000000000),
  finney: BigInt(1000000000000000),
  ether: BigInt(1000000000000000000),
};

/**
 * 从 wei 转换为其他单位
 * @param value wei 值（字符串或 bigint）
 * @param unit 目标单位（默认 'ether'）
 * @returns 转换后的值（字符串）
 */
export function fromWei(
  value: string | bigint,
  unit: string = "ether",
): string {
  const weiValue = typeof value === "string" ? BigInt(value) : value;
  const unitMultiplier = UNIT_MAP[unit.toLowerCase()];

  if (!unitMultiplier) {
    throw new Error(`未知的单位: ${unit}`);
  }

  const quotient = weiValue / unitMultiplier;
  const remainder = weiValue % unitMultiplier;

  if (remainder === BigInt(0)) {
    return quotient.toString();
  }

  const unitStr = unitMultiplier.toString();
  const unitDecimals = unitStr.length - 1;
  const remainderStr = remainder.toString().padStart(unitDecimals, "0");

  let decimalPart = remainderStr;
  while (
    decimalPart.length > 0 && decimalPart[decimalPart.length - 1] === "0"
  ) {
    decimalPart = decimalPart.slice(0, -1);
  }

  if (decimalPart === "" || decimalPart === "0") {
    return quotient.toString();
  }

  return `${quotient.toString()}.${decimalPart}`;
}

/**
 * 转换为 wei
 * @param value 数值（字符串或数字）
 * @param unit 源单位（默认 'ether'）
 * @returns wei 值（字符串）
 */
export function toWei(value: string | number, unit: string = "ether"): string {
  const unitMultiplier = UNIT_MAP[unit.toLowerCase()];

  if (!unitMultiplier) {
    throw new Error(`未知的单位: ${unit}`);
  }

  const valueStr = typeof value === "string" ? value : value.toString();
  const isNegative = valueStr.startsWith("-");
  const cleanValue = isNegative ? valueStr.slice(1) : valueStr;
  const [integerPart, decimalPart = ""] = cleanValue.split(".");

  const integerWei = BigInt(integerPart) * unitMultiplier;

  if (!decimalPart || decimalPart === "") {
    return isNegative ? `-${integerWei.toString()}` : integerWei.toString();
  }

  const unitStr = unitMultiplier.toString();
  const unitDecimals = unitStr.length - 1;
  const decimalDigits = decimalPart.length > unitDecimals
    ? decimalPart.slice(0, unitDecimals)
    : decimalPart.padEnd(unitDecimals, "0");

  const decimalWei = BigInt(decimalDigits);
  const totalWei = integerWei + decimalWei;

  return isNegative ? `-${totalWei.toString()}` : totalWei.toString();
}

/**
 * 验证地址校验和（EIP-55），供 isAddress 内部使用
 */
function checkAddressChecksum(address: string): boolean {
  if (!address || typeof address !== "string") {
    return false;
  }

  const addr = address.startsWith("0x")
    ? address.slice(2).toLowerCase()
    : address.toLowerCase();

  if (addr.length !== 40 || !/^[0-9a-f]{40}$/.test(addr)) {
    return false;
  }

  try {
    const checksummed = toChecksumAddress("0x" + addr);
    return checksummed === address;
  } catch {
    return false;
  }
}

/**
 * 验证以太坊地址格式（包含校验和验证）
 * @param address 地址字符串
 * @returns 是否为有效地址
 */
export function isAddress(address: string): boolean {
  if (!address || typeof address !== "string") {
    return false;
  }

  try {
    if (viemIsAddress(address)) {
      return true;
    }
  } catch {
    // 继续使用下方实现
  }

  const normalized = address.startsWith("0x")
    ? address.toLowerCase()
    : ("0x" + address.toLowerCase());
  const addr = normalized.slice(2);

  if (addr.length !== 40) {
    return false;
  }
  if (!/^[0-9a-f]{40}$/.test(addr)) {
    return false;
  }

  const originalAddr = address.startsWith("0x") ? address.slice(2) : address;
  const hasMixedCase = /[a-f]/.test(originalAddr) && /[A-F]/.test(originalAddr);
  if (hasMixedCase) {
    return checkAddressChecksum(address);
  }

  return true;
}

/**
 * 转换为校验和地址（EIP-55）
 * @param address 地址字符串
 * @returns 校验和地址
 */
export function toChecksumAddress(address: string): string {
  if (!isAddress(address)) {
    throw new Error(`无效的地址: ${address}`);
  }

  const addr = address.startsWith("0x")
    ? address.slice(2).toLowerCase()
    : address.toLowerCase();

  try {
    return getAddress("0x" + addr);
  } catch (_error) {
    return "0x" + addr;
  }
}

/**
 * 格式化地址（添加 0x 前缀，转换为校验和地址）
 * @param address 地址字符串
 * @returns 格式化后的地址（校验和格式）
 */
export function formatAddress(address: string): string {
  if (!isAddress(address)) {
    throw new Error(`无效的地址: ${address}`);
  }

  const addrWithPrefix = address.startsWith("0x")
    ? address.toLowerCase()
    : ("0x" + address.toLowerCase());

  try {
    return getAddress(addrWithPrefix);
  } catch (_error) {
    return toChecksumAddress(addrWithPrefix);
  }
}
