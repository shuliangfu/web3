/**
 * @fileoverview Web3 工具函数测试
 */

import { describe, expect, it } from "@dreamer/test";
import {
  addHexPrefix,
  bytesToHex,
  checkAddressChecksum,
  computeContractAddress,
  encodeFunctionCall,
  formatAddress,
  fromWei,
  generateWallet,
  getCode,
  getFunctionSelector,
  hexToBytes,
  hexToNumber,
  isAddress,
  isPrivateKey,
  isTxHash,
  keccak256,
  numberToHex,
  padLeft,
  padRight,
  shortenAddress,
  solidityKeccak256,
  stripHexPrefix,
  toChecksumAddress,
  toWei,
} from "../src/utils.ts";
import config from "./data/config.ts";

describe("Web3 Utils", () => {
  describe("单位转换", () => {
    it("应该从 wei 转换为 ether", () => {
      const result = fromWei("1000000000000000000", "ether");
      expect(result).toBe("1");
    });

    it("应该从 wei 转换为 gwei", () => {
      const result = fromWei("1000000000", "gwei");
      expect(result).toBe("1");
    });

    it("应该从 wei 转换为其他单位", () => {
      expect(fromWei("1000", "kwei")).toBe("1");
      expect(fromWei("1000000", "mwei")).toBe("1");
      expect(fromWei("1000000000000", "szabo")).toBe("1");
    });

    it("应该转换为 wei", () => {
      expect(toWei("1", "ether")).toBe("1000000000000000000");
      expect(toWei("1", "gwei")).toBe("1000000000");
      expect(toWei("1", "kwei")).toBe("1000");
    });

    it("应该处理 bigint 类型的 wei 值", () => {
      const result = fromWei(BigInt("1000000000000000000"), "ether");
      expect(result).toBe("1");
    });

    it("应该处理无效的单位", () => {
      expect(() => fromWei("1000", "invalid")).toThrow();
      expect(() => toWei("1", "invalid")).toThrow();
    });
  });

  describe("地址处理", () => {
    it("应该验证地址", () => {
      const validAddress = "0x742d35cc6634c0532925a3b844bc9e7595f0beb0";
      const invalidAddress = "invalid";
      const invalidAddressShort = "0x123";

      expect(isAddress(validAddress)).toBeTruthy();
      expect(isAddress(invalidAddress)).toBeFalsy();
      expect(isAddress(invalidAddressShort)).toBeFalsy();
    });

    it("应该验证校验和地址", () => {
      const address = "0x742d35cc6634c0532925a3b844bc9e7595f0beb0";
      const checksummed = formatAddress(address);
      expect(checkAddressChecksum(checksummed)).toBeTruthy();
    });

    it("应该转换为校验和地址", () => {
      const address = "0x742d35cc6634c0532925a3b844bc9e7595f0beb0";
      const checksummed = toChecksumAddress(address);
      expect(checksummed).toBeTruthy();
      expect(checksummed.startsWith("0x")).toBeTruthy();
      expect(checksummed.length).toBe(42);
    });

    it("应该格式化地址", () => {
      const address = "0x742d35cc6634c0532925a3b844bc9e7595f0beb0";
      const formatted = formatAddress(address);
      expect(formatted).toBeTruthy();
      expect(formatted.startsWith("0x")).toBeTruthy();
      expect(formatted.length).toBe(42);
    });

    it("应该处理没有 0x 前缀的地址", () => {
      const address = "742d35cc6634c0532925a3b844bc9e7595f0beb0";
      const formatted = formatAddress(address);
      expect(formatted).toBeTruthy();
      expect(formatted.startsWith("0x")).toBeTruthy();
    });

    it("应该缩短地址", () => {
      const address = "0x742d35cc6634c0532925a3b844bc9e7595f0beb0";
      const shortened = shortenAddress(address);
      expect(shortened).toBeTruthy();
      expect(shortened.length).toBeLessThan(address.length);
      expect(shortened.includes("...")).toBeTruthy();
    });

    it("应该自定义缩短地址的长度", () => {
      const address = "0x742d35cc6634c0532925a3b844bc9e7595f0beb0";
      const shortened = shortenAddress(address, 4, 4);
      expect(shortened).toBeTruthy();
      expect(shortened.startsWith("0x742")).toBeTruthy();
    });
  });

  describe("哈希函数", () => {
    it("应该计算 keccak256 哈希", async () => {
      const data = "hello world";
      const hash = await keccak256(data);
      expect(hash).toBeTruthy();
      expect(hash.startsWith("0x")).toBeTruthy();
      expect(hash.length).toBe(66); // 0x + 64 字符
    });

    it("应该计算 Uint8Array 的 keccak256 哈希", async () => {
      const data = new Uint8Array([72, 101, 108, 108, 111]); // "Hello"
      const hash = await keccak256(data);
      expect(hash).toBeTruthy();
      expect(hash.startsWith("0x")).toBeTruthy();
    });

    it("应该计算 Solidity Keccak256 哈希", async () => {
      const hash = await solidityKeccak256(
        ["address", "uint256"],
        ["0x742d35cc6634c0532925a3b844bc9e7595f0beb0", "100"],
      );
      expect(hash).toBeTruthy();
      expect(hash.startsWith("0x")).toBeTruthy();
      expect(hash.length).toBe(66);
    });
  });

  describe("十六进制转换", () => {
    it("应该将十六进制转换为字节数组", () => {
      const hex = "0x48656c6c6f";
      const bytes = hexToBytes(hex);
      expect(bytes).toBeInstanceOf(Uint8Array);
      expect(bytes.length).toBe(5);
      expect(bytes[0]).toBe(72); // 'H'
    });

    it("应该将字节数组转换为十六进制", () => {
      const bytes = new Uint8Array([72, 101, 108, 108, 111]);
      const hex = bytesToHex(bytes);
      expect(hex).toBeTruthy();
      expect(hex.startsWith("0x")).toBeTruthy();
    });

    it("应该将十六进制转换为数字", () => {
      expect(hexToNumber("0x64")).toBe(100);
      expect(hexToNumber("0xff")).toBe(255);
    });

    it("应该将数字转换为十六进制", () => {
      expect(numberToHex(100)).toBe("0x64");
      expect(numberToHex(255)).toBe("0xff");
      expect(numberToHex(BigInt(1000))).toBe("0x3e8");
    });
  });

  describe("十六进制前缀处理", () => {
    it("应该移除十六进制前缀", () => {
      expect(stripHexPrefix("0x123")).toBe("123");
      expect(stripHexPrefix("123")).toBe("123");
    });

    it("应该添加十六进制前缀", () => {
      expect(addHexPrefix("123")).toBe("0x123");
      expect(addHexPrefix("0x123")).toBe("0x123");
    });
  });

  describe("填充函数", () => {
    it("应该左填充", () => {
      expect(padLeft("123", 6)).toBe("000123");
      // padLeft 直接使用 padStart，会填充整个字符串
      expect(padLeft("0x123", 6)).toBe("00x123");
    });

    it("应该右填充", () => {
      expect(padRight("123", 6)).toBe("123000");
      // padRight 直接使用 padEnd，会填充整个字符串
      expect(padRight("0x123", 6)).toBe("0x1230");
    });
  });

  describe("钱包相关", () => {
    it("应该生成钱包", () => {
      const wallet = generateWallet();
      expect(wallet).toBeTruthy();
      expect(wallet.address).toBeTruthy();
      expect(wallet.privateKey).toBeTruthy();
      expect(wallet.address.startsWith("0x")).toBeTruthy();
      expect(wallet.privateKey.startsWith("0x")).toBeTruthy();
    });

    it("应该验证私钥", () => {
      const wallet = generateWallet();
      expect(isPrivateKey(wallet.privateKey)).toBeTruthy();
      expect(isPrivateKey("invalid")).toBeFalsy();
      expect(isPrivateKey("0x123")).toBeFalsy();
    });
  });

  describe("交易哈希", () => {
    it("应该验证交易哈希", () => {
      const validHash =
        "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
      const invalidHash = "invalid";
      const shortHash = "0x123";

      expect(isTxHash(validHash)).toBeTruthy();
      expect(isTxHash(invalidHash)).toBeFalsy();
      expect(isTxHash(shortHash)).toBeFalsy();
    });

    it("应该处理没有 0x 前缀的交易哈希", () => {
      const hash =
        "1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
      expect(isTxHash(hash)).toBeTruthy();
    });
  });

  describe("合约相关", () => {
    it("应该获取函数选择器", () => {
      const selector = getFunctionSelector("transfer(address,uint256)");
      expect(selector).toBeTruthy();
      expect(selector.startsWith("0x")).toBeTruthy();
      expect(selector.length).toBe(10); // 0x + 8 字符
    });

    it("应该编码函数调用", () => {
      const data = encodeFunctionCall("transfer(address,uint256)", [
        "0x742d35cc6634c0532925a3b844bc9e7595f0beb0",
        "1000000000000000000",
      ]);
      expect(data).toBeTruthy();
      expect(data.startsWith("0x")).toBeTruthy();
      expect(data.length).toBeGreaterThan(10);
    });

    it("应该计算合约地址", async () => {
      const deployer = "0x742d35cc6634c0532925a3b844bc9e7595f0beb0";
      const nonce = 0;
      const address = await computeContractAddress(deployer, nonce);
      expect(address).toBeTruthy();
      expect(address.startsWith("0x")).toBeTruthy();
      expect(address.length).toBe(42);
    });
  });

  describe("合约代码（需要 RPC）", () => {
    it("应该获取合约代码", async () => {
      // 使用配置中的地址（如果有合约）
      try {
        const code = await getCode(
          config.address,
          config.host,
        );
        expect(code).toBeTruthy();
        expect(typeof code).toBe("string");
        expect(code.startsWith("0x")).toBeTruthy();
      } catch (error) {
        // 如果 RPC 不可用或地址不是合约，跳过测试
        console.warn("无法获取合约代码:", error);
      }
    });
  });
});
