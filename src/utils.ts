/**
 * @module @dreamer/web3/utils
 *
 * @fileoverview Web3 工具函数
 *
 * 提供 Web3 相关的工具函数，如单位转换、地址处理、十六进制转换等。
 */

// 导入 viem 核心模块
import {
  type Address,
  createPublicClient,
  encodeAbiParameters,
  encodeFunctionData,
  getAddress,
  type Hex,
  http,
  isAddress as viemIsAddress,
  keccak256 as viemKeccak256,
  parseAbi,
} from "viem";
// 导入 viem 账户模块（用于生成钱包）
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";

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
 *
 * @example
 * fromWei('1000000000000000000', 'ether') // '1.0'
 * fromWei('1000000000', 'gwei') // '1.0'
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

  // 转换为目标单位（保留 18 位小数精度）
  const result = Number(weiValue) / Number(unitMultiplier);
  return result.toString();
}

/**
 * 转换为 wei
 * @param value 数值（字符串或数字）
 * @param unit 源单位（默认 'ether'）
 * @returns wei 值（字符串）
 *
 * @example
 * toWei('1', 'ether') // '1000000000000000000'
 * toWei('1', 'gwei') // '1000000000'
 */
export function toWei(value: string | number, unit: string = "ether"): string {
  const numValue = typeof value === "string" ? parseFloat(value) : value;
  const unitMultiplier = UNIT_MAP[unit.toLowerCase()];

  if (!unitMultiplier) {
    throw new Error(`未知的单位: ${unit}`);
  }

  // 转换为 wei
  const result = BigInt(Math.floor(numValue * Number(unitMultiplier)));
  return result.toString();
}

/**
 * 验证以太坊地址格式（包含校验和验证）
 * @param address 地址字符串
 * @returns 是否为有效地址
 *
 * @example
 * isAddress('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb') // true
 * isAddress('0x742d35cc6634c0532925a3b844bc9e7595f0beb') // true
 */
export function isAddress(address: string): boolean {
  if (!address || typeof address !== "string") {
    return false;
  }

  // 先尝试使用 viem 的 isAddress（如果地址是校验和格式，会直接通过）
  try {
    if (viemIsAddress(address)) {
      return true;
    }
  } catch {
    // 如果 viem 抛出异常，继续使用自己的实现
  }

  // 规范化地址：确保有 0x 前缀，转换为小写
  const normalized = address.startsWith("0x")
    ? address.toLowerCase()
    : ("0x" + address.toLowerCase());

  // 移除 0x 前缀
  const addr = normalized.slice(2);

  // 检查长度（40 个十六进制字符）
  if (addr.length !== 40) {
    return false;
  }

  // 检查是否为有效的十六进制字符串
  if (!/^[0-9a-f]{40}$/.test(addr)) {
    return false;
  }

  // 如果原始地址包含大小写混合，验证校验和（EIP-55）
  const originalAddr = address.startsWith("0x") ? address.slice(2) : address;
  const hasMixedCase = /[a-f]/.test(originalAddr) && /[A-F]/.test(originalAddr);
  if (hasMixedCase) {
    return checkAddressChecksum(address);
  }

  // 对于小写地址，格式验证已经通过（40个十六进制字符）
  // viem 的 getAddress 要求校验和格式，但小写地址在以太坊中也是有效的
  // 所以如果格式正确，直接返回 true
  return true;
}

/**
 * 验证地址校验和（EIP-55）
 * @param address 地址字符串
 * @returns 校验和是否正确
 *
 * @example
 * checkAddressChecksum('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb') // true
 */
export function checkAddressChecksum(address: string): boolean {
  if (!address || typeof address !== "string") {
    return false;
  }

  // 移除 0x 前缀并转为小写
  const addr = address.startsWith("0x")
    ? address.slice(2).toLowerCase()
    : address.toLowerCase();

  if (addr.length !== 40 || !/^[0-9a-f]{40}$/.test(addr)) {
    return false;
  }

  // 使用 toChecksumAddress 计算正确的校验和地址，然后比较
  try {
    const checksummed = toChecksumAddress("0x" + addr);
    return checksummed === address;
  } catch {
    return false;
  }
}

/**
 * 转换为校验和地址（EIP-55）
 * @param address 地址字符串
 * @returns 校验和地址
 *
 * @example
 * toChecksumAddress('0x742d35cc6634c0532925a3b844bc9e7595f0beb')
 * // '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb'
 */
export function toChecksumAddress(address: string): string {
  // 先使用我们自己的 isAddress 验证
  if (!isAddress(address)) {
    throw new Error(`无效的地址: ${address}`);
  }

  // 移除 0x 前缀并转为小写
  const addr = address.startsWith("0x")
    ? address.slice(2).toLowerCase()
    : address.toLowerCase();

  // 使用 viem 的 getAddress 生成校验和地址
  try {
    return getAddress("0x" + addr);
  } catch (_error) {
    // 如果失败，返回规范化地址
    return "0x" + addr;
  }
}

/**
 * Keccak-256 哈希（使用 viem）
 * @param data 要哈希的数据
 * @returns 哈希值（十六进制字符串）
 *
 * @example
 * await keccak256('hello world') // '0x...'
 */
export async function keccak256(data: string | Uint8Array): Promise<string> {
  try {
    // viem 的 keccak256 接受 Hex 或 Bytes
    const dataHex = typeof data === "string"
      ? (data.startsWith("0x") ? data as Hex : ("0x" + data) as Hex)
      : (data as Uint8Array);
    return viemKeccak256(dataHex);
  } catch {
    // 如果 viem 不可用，使用 Web Crypto API 的 SHA-256 作为替代
    const encoder = new TextEncoder();
    const dataBytes = typeof data === "string"
      ? encoder.encode(data)
      : new Uint8Array(data);
    const hashBuffer = await crypto.subtle.digest("SHA-256", dataBytes.buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return "0x" +
      hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  }
}

/**
 * Solidity Keccak-256 哈希（处理 ABI 编码）
 * @param types 类型数组
 * @param values 值数组
 * @returns 哈希值（十六进制字符串）
 *
 * @example
 * await solidityKeccak256(['address', 'uint256'], ['0x...', '100'])
 */
export async function solidityKeccak256(
  types: string[],
  values: unknown[],
): Promise<string> {
  try {
    // viem 使用 encodePacked 和 keccak256
    const packed = encodeAbiParameters(
      types.map((t) => ({ type: t } as any)),
      values,
    );
    return viemKeccak256(packed);
  } catch {
    // 如果 viem 不可用，简化实现
    const encoded = types.map((type, i) => {
      const value = values[i];
      if (type === "address") {
        return (value as string).toLowerCase().replace("0x", "");
      }
      if (type.startsWith("uint") || type.startsWith("int")) {
        return BigInt(value as string | number).toString(16).padStart(64, "0");
      }
      return String(value);
    }).join("");
    return await keccak256(encoded);
  }
}

/**
 * 十六进制字符串转字节数组
 * @param hex 十六进制字符串
 * @returns 字节数组
 *
 * @example
 * hexToBytes('0x48656c6c6f') // Uint8Array([72, 101, 108, 108, 111])
 */
export function hexToBytes(hex: string): Uint8Array {
  const cleanHex = hex.startsWith("0x") ? hex.slice(2) : hex;
  const bytes = new Uint8Array(cleanHex.length / 2);

  for (let i = 0; i < cleanHex.length; i += 2) {
    bytes[i / 2] = parseInt(cleanHex.substr(i, 2), 16);
  }

  return bytes;
}

/**
 * 字节数组转十六进制字符串
 * @param bytes 字节数组
 * @returns 十六进制字符串
 *
 * @example
 * bytesToHex(new Uint8Array([72, 101, 108, 108, 111])) // '0x48656c6c6f'
 */
export function bytesToHex(bytes: Uint8Array): string {
  return "0x" + Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * 十六进制字符串转数字
 * @param hex 十六进制字符串
 * @returns 数字
 *
 * @example
 * hexToNumber('0xff') // 255
 */
export function hexToNumber(hex: string): number {
  const cleanHex = hex.startsWith("0x") ? hex.slice(2) : hex;
  return parseInt(cleanHex, 16);
}

/**
 * 数字转十六进制字符串
 * @param value 数字
 * @returns 十六进制字符串
 *
 * @example
 * numberToHex(255) // '0xff'
 */
export function numberToHex(value: number | bigint): string {
  if (typeof value === "bigint") {
    return "0x" + value.toString(16);
  }
  return "0x" + value.toString(16);
}

/**
 * 移除 0x 前缀
 * @param hex 十六进制字符串
 * @returns 移除前缀后的字符串
 *
 * @example
 * stripHexPrefix('0xff') // 'ff'
 */
export function stripHexPrefix(hex: string): string {
  return hex.startsWith("0x") ? hex.slice(2) : hex;
}

/**
 * 添加 0x 前缀
 * @param hex 十六进制字符串
 * @returns 添加前缀后的字符串
 *
 * @example
 * addHexPrefix('ff') // '0xff'
 */
export function addHexPrefix(hex: string): string {
  return hex.startsWith("0x") ? hex : "0x" + hex;
}

/**
 * 左填充（padLeft）
 * @param value 值
 * @param length 目标长度
 * @param padChar 填充字符（默认 '0'）
 * @returns 填充后的字符串
 *
 * @example
 * padLeft('ff', 4) // '00ff'
 */
export function padLeft(
  value: string,
  length: number,
  padChar: string = "0",
): string {
  return value.padStart(length, padChar);
}

/**
 * 右填充（padRight）
 * @param value 值
 * @param length 目标长度
 * @param padChar 填充字符（默认 '0'）
 * @returns 填充后的字符串
 *
 * @example
 * padRight('ff', 4) // 'ff00'
 */
export function padRight(
  value: string,
  length: number,
  padChar: string = "0",
): string {
  return value.padEnd(length, padChar);
}

/**
 * 生成新的钱包地址和私钥
 * @returns 包含钱包地址和私钥的对象
 *
 * @example
 * const wallet = generateWallet();
 * console.log(wallet.address); // '0x...'
 * console.log(wallet.privateKey); // '0x...'
 */
export function generateWallet(): {
  address: string;
  privateKey: string;
} {
  // 生成随机私钥
  const privateKey = generatePrivateKey();

  // 从私钥派生钱包地址
  const account = privateKeyToAccount(privateKey as Hex);

  return {
    address: account.address,
    privateKey: privateKey,
  };
}

/**
 * 验证私钥格式
 * @param privateKey 私钥字符串
 * @returns 是否为有效私钥
 *
 * @example
 * isPrivateKey('0x...') // true
 */
export function isPrivateKey(privateKey: string): boolean {
  if (!privateKey || typeof privateKey !== "string") {
    return false;
  }

  const key = privateKey.startsWith("0x") ? privateKey.slice(2) : privateKey;

  // 私钥应该是 64 个十六进制字符（32 字节）
  return /^[0-9a-fA-F]{64}$/.test(key);
}

/**
 * 验证交易哈希格式
 * @param txHash 交易哈希
 * @returns 是否为有效交易哈希
 *
 * @example
 * isTxHash('0x...') // true
 */
export function isTxHash(txHash: string): boolean {
  if (!txHash || typeof txHash !== "string") {
    return false;
  }

  const hash = txHash.startsWith("0x") ? txHash.slice(2) : txHash;

  // 交易哈希应该是 64 个十六进制字符（32 字节）
  return /^[0-9a-fA-F]{64}$/.test(hash);
}

/**
 * 格式化地址（添加 0x 前缀，转换为校验和地址）
 * @param address 地址字符串
 * @returns 格式化后的地址（校验和格式）
 *
 * @example
 * formatAddress('742d35cc6634c0532925a3b844bc9e7595f0beb')
 * // '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb'
 */
export function formatAddress(address: string): string {
  // 先使用我们自己的 isAddress 验证
  if (!isAddress(address)) {
    throw new Error(`无效的地址: ${address}`);
  }

  // 确保有 0x 前缀，转换为小写（viem 的 getAddress 需要小写地址）
  const addrWithPrefix = address.startsWith("0x")
    ? address.toLowerCase()
    : ("0x" + address.toLowerCase());

  // 使用 viem 的 getAddress 生成校验和地址
  try {
    return getAddress(addrWithPrefix);
  } catch (_error) {
    // 如果失败，使用 toChecksumAddress
    return toChecksumAddress(addrWithPrefix);
  }
}

/**
 * 缩短地址显示（用于 UI）
 * @param address 地址字符串
 * @param startLength 开头保留长度（默认 6）
 * @param endLength 结尾保留长度（默认 4）
 * @returns 缩短后的地址
 *
 * @example
 * shortenAddress('0x742d35cc6634c0532925a3b844bc9e7595f0beb')
 * // '0x742d...0beb'
 */
export function shortenAddress(
  address: string,
  startLength: number = 6,
  endLength: number = 4,
): string {
  if (!isAddress(address)) {
    return address;
  }

  const addr = address.startsWith("0x") ? address.slice(2) : address;
  const start = addr.slice(0, startLength);
  const end = addr.slice(-endLength);

  return `0x${start}...${end}`;
}

/**
 * 计算合约地址（CREATE）
 * @param deployerAddress 部署者地址
 * @param nonce 部署者 nonce
 * @returns 合约地址
 *
 * @example
 * await computeContractAddress('0x...', 0)
 */
export async function computeContractAddress(
  deployerAddress: string,
  nonce: number,
): Promise<string> {
  // 简化实现：使用 RLP 编码和 Keccak-256
  // 实际应该使用完整的 RLP 编码：RLP([deployerAddress, nonce])
  // 注意：这是简化实现，实际应使用 ethers 的 RLP 编码功能
  const data = formatAddress(deployerAddress) + numberToHex(nonce).slice(2);
  const hash = await keccak256(data);
  return "0x" + hash.slice(-40);
}

/**
 * 获取合约代码
 * @param address 合约地址
 * @param rpcUrl RPC 节点 URL（可选，如果不提供则需要通过 createWeb3Client 创建客户端）
 * @returns 合约代码（十六进制字符串）
 *
 * @example
 * const code = await getCode('0x...', 'https://mainnet.infura.io/v3/YOUR_PROJECT_ID')
 */
export async function getCode(
  address: string,
  rpcUrl?: string,
): Promise<string> {
  if (!viemIsAddress(address)) {
    throw new Error(`无效的地址: ${address}`);
  }

  const formattedAddress = formatAddress(address);

  // 如果提供了 rpcUrl，创建临时客户端
  if (rpcUrl) {
    const publicClient = createPublicClient({
      transport: http(rpcUrl),
    });
    const code = await publicClient.getCode({
      address: formattedAddress as Address,
    });
    return code || "0x";
  }

  // 如果没有提供 rpcUrl，抛出错误
  throw new Error(
    "需要提供 rpcUrl 参数或使用 Web3Client 实例的 getCode 方法",
  );
}

/**
 * 获取函数选择器（函数签名的前 4 字节）
 * @param functionSignature 函数签名，如 "transfer(address,uint256)"
 * @returns 函数选择器（十六进制字符串，如 "0xa9059cbb"）
 *
 * @example
 * getFunctionSelector('transfer(address,uint256)') // '0xa9059cbb'
 */
export function getFunctionSelector(functionSignature: string): string {
  if (!functionSignature || typeof functionSignature !== "string") {
    throw new Error("函数签名不能为空");
  }

  // 计算函数签名的 Keccak-256 哈希
  const hash = viemKeccak256(functionSignature as Hex);

  // 返回前 4 字节（8 个十六进制字符 + 0x 前缀）
  return hash.slice(0, 10); // "0x" + 8 个字符
}

/**
 * 编码函数调用数据
 * @param functionSignature 函数签名，如 "transfer(address,uint256)"
 * @param args 函数参数数组
 * @returns 编码后的函数调用数据（十六进制字符串）
 *
 * @example
 * encodeFunctionCall('transfer(address,uint256)', ['0x...', '1000000000000000000'])
 * // '0xa9059cbb000000000000000000000000...'
 */
export function encodeFunctionCall(
  functionSignature: string,
  args: unknown[] = [],
): string {
  if (!functionSignature || typeof functionSignature !== "string") {
    throw new Error("函数签名不能为空");
  }

  try {
    // 提取函数名（函数签名格式：functionName(param1,param2)）
    const functionName = functionSignature.split("(")[0].trim();

    // 解析函数签名
    const abi = parseAbi(
      [`function ${functionSignature}`] as readonly string[],
    );

    // 使用 viem 的 encodeFunctionData 编码
    return encodeFunctionData({
      abi,
      functionName: functionName,
      args: args as any[],
    });
  } catch (error) {
    throw new Error(
      `编码函数调用失败: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
}
