/**
 * @fileoverview Web3 测试
 */

import { describe, expect, it } from "jsr:@dreamer/test@^1.0.0-beta.4";
import { Web3Client } from "../src/mod.ts";
import { formatAddress, isAddress } from "../src/utils.ts";

describe("Web3", () => {
  describe("Web3Client", () => {
    it("应该创建客户端实例", () => {
      const client = new Web3Client("https://mainnet.infura.io/v3/test");
      expect(client).toBeTruthy();
    });
  });

  describe("工具函数", () => {
    it("应该验证地址", () => {
      const validAddress = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb";
      const invalidAddress = "invalid";

      expect(isAddress(validAddress)).toBeTruthy();
      expect(isAddress(invalidAddress)).toBeFalsy();
    });

    it("应该格式化地址", () => {
      const address = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb";
      const formatted = formatAddress(address);

      expect(formatted).toBeTruthy();
      expect(typeof formatted).toBe("string");
    });
  });
});
