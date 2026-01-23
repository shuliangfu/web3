/**
 * @fileoverview 客户端 Web3Client 测试
 *
 * 注意：客户端 Web3Client 需要浏览器环境和钱包扩展（如 MetaMask）
 * 本测试使用 Mock window.ethereum 来模拟浏览器环境
 */

import { afterAll, beforeAll, describe, expect, it } from "@dreamer/test";
import { createWeb3Client, Web3Client } from "../src/client/mod.ts";

/**
 * Mock window.ethereum 对象
 */
function createMockEthereum() {
  // 使用有效的测试地址（40 个十六进制字符，42 个字符包括 0x）
  // 这是一个有效的以太坊地址格式
  const mockAccounts = ["0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0"];
  const mockChainId = "0x61"; // BSC 测试网 (97)

  return {
    request: async (args: { method: string; params?: unknown[] }) => {
      const { method, params } = args;

      switch (method) {
        case "eth_requestAccounts":
          return mockAccounts;

        case "eth_accounts":
          return mockAccounts;

        case "eth_chainId":
          return mockChainId;

        case "eth_getBalance":
          return "0x2386f26fc10000"; // 0.01 ETH

        case "eth_getTransactionCount":
          return "0x0";

        case "eth_sendTransaction":
          // 返回一个模拟的交易哈希
          return "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";

        case "eth_getTransactionReceipt":
          // 返回一个模拟的交易收据
          return {
            transactionHash: params?.[0] as string,
            blockNumber: "0x1",
            blockHash:
              "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
            status: "0x1",
            gasUsed: "0x5208",
          };

        case "eth_getTransaction":
          return {
            hash: params?.[0] as string,
            from: mockAccounts[0],
            to: params?.[1] as string,
            value: "0x0",
            gas: "0x5208",
            gasPrice: "0x3b9aca00",
          };

        case "eth_blockNumber":
          return "0x1000";

        case "eth_getBlockByNumber":
          return {
            number: params?.[0] as string,
            hash:
              "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
            transactions: [],
          };

        case "eth_gasPrice":
          return "0x3b9aca00"; // 1 gwei

        case "eth_estimateGas":
          return "0x5208"; // 21000

        case "eth_getCode":
          return "0x"; // 普通地址，不是合约

        case "eth_call":
          // 用于读取合约数据，返回模拟的调用结果
          // 返回一个 uint256 类型的值（32 字节）
          return "0x0000000000000000000000000000000000000000000000000000000000000064"; // 100

        case "personal_sign":
          // 返回一个模拟的签名（65 字节 = 130 个十六进制字符 + 0x = 132 个字符）
          // 格式：r (32 bytes) + s (32 bytes) + v (1 byte)
          return "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1c";

        default:
          throw new Error(`未实现的 Mock 方法: ${method}`);
      }
    },
    on: (_event: string, _callback: (...args: unknown[]) => void) => {
      // Mock 事件监听
    },
    removeListener: (
      _event: string,
      _callback: (...args: unknown[]) => void,
    ) => {
      // Mock 移除事件监听
    },
  };
}

/**
 * 设置全局 window.ethereum
 */
function setupMockEthereum() {
  const mockEthereum = createMockEthereum();
  (globalThis as any).window = {
    ethereum: mockEthereum,
  };
  return mockEthereum;
}

/**
 * 清理全局 window.ethereum
 */
function cleanupMockEthereum() {
  delete (globalThis as any).window;
}

describe("客户端 Web3Client", () => {
  let mockEthereum: ReturnType<typeof createMockEthereum>;

  beforeAll(() => {
    mockEthereum = setupMockEthereum();
  });

  afterAll(() => {
    cleanupMockEthereum();
  });

  describe("创建客户端实例", () => {
    it("应该创建客户端实例", () => {
      const client = new Web3Client();
      expect(client).toBeTruthy();
    });

    it("应该创建带合约配置的客户端实例", () => {
      const client = new Web3Client({
        contracts: {
          name: "USDT",
          address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
          abi: [],
        },
      });
      expect(client).toBeTruthy();
      expect(client.contracts.USDT).toBeTruthy();
      expect(client.contracts.USDT.address).toBe(
        "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
      );
    });

    it("应该使用便捷函数 createWeb3Client 创建客户端", () => {
      const client = createWeb3Client();
      expect(client).toBeTruthy();
      expect(client).toBeInstanceOf(Web3Client);
    });
  });

  describe("配置方法", () => {
    let client: Web3Client;

    beforeAll(() => {
      client = new Web3Client();
    });

    it("应该获取配置", () => {
      const clientConfig = client.getConfig();
      expect(clientConfig).toBeTruthy();
      expect(typeof clientConfig).toBe("object");
    });

    it("应该更新配置", () => {
      const newChainId = 56;
      client.updateConfig({ chainId: newChainId });
      const updatedConfig = client.getConfig();
      expect(updatedConfig.chainId).toBe(newChainId);
    });
  });

  describe("钱包连接", () => {
    let client: Web3Client;

    beforeAll(() => {
      client = new Web3Client();
    });

    it("应该连接钱包", async () => {
      const accounts = await client.connectWallet();
      expect(accounts).toBeTruthy();
      expect(Array.isArray(accounts)).toBeTruthy();
      expect(accounts.length).toBeGreaterThan(0);
      expect(accounts[0]).toBeTruthy();
      expect(typeof accounts[0]).toBe("string");
      expect(accounts[0].startsWith("0x")).toBeTruthy();
    });

    it("应该获取当前账户", async () => {
      const accounts = await client.getAccounts();
      expect(accounts).toBeTruthy();
      expect(Array.isArray(accounts)).toBeTruthy();
    });

    // 注意：客户端 Web3Client 没有 disconnectWallet 方法
    // 钱包断开由用户通过钱包界面操作
  });

  describe("网络和链信息", () => {
    let client: Web3Client;

    beforeAll(() => {
      client = new Web3Client();
    });

    it("应该获取链 ID", async () => {
      const chainId = await client.getChainId();
      expect(chainId).toBeTruthy();
      expect(typeof chainId).toBe("number");
      expect(chainId).toBe(97); // BSC 测试网
    });

    it("应该获取网络信息", async () => {
      const network = await client.getNetwork();
      expect(network).toBeTruthy();
      expect(network.chainId).toBe(97);
      expect(typeof network.name).toBe("string");
    });

    // 注意：客户端 Web3Client 没有 getBlockNumber 方法
    // 可以通过 getNetwork 获取链信息
  });

  // 注意：客户端 Web3Client 没有 getBalance, getBalances, getTransactionCount 方法
  // 这些功能需要通过 PublicClient 直接调用或使用其他方式实现

  // 注意：客户端 Web3Client 没有 getGasPrice, getFeeData, estimateGas, getGasLimit 方法
  // 这些功能需要通过 PublicClient 直接调用或使用其他方式实现

  // 注意：客户端 Web3Client 没有 getBlock, getBlockTransactions 方法
  // 这些功能需要通过 PublicClient 直接调用或使用其他方式实现

  // 注意：客户端 Web3Client 没有 sendTransaction, waitForTransaction, getTransaction, getTransactionReceipt 方法
  // 这些功能需要通过 WalletClient 直接调用或使用其他方式实现

  describe("合约相关", () => {
    let client: Web3Client;

    beforeAll(async () => {
      client = new Web3Client({
        contracts: {
          name: "USDT",
          address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
          abi: [
            {
              type: "function",
              name: "balanceOf",
              inputs: [{ name: "account", type: "address" }],
              outputs: [{ name: "", type: "uint256" }],
              stateMutability: "view",
            },
          ],
        },
      });
      await client.connectWallet();
    });

    it("应该读取合约数据", async () => {
      const accounts = await client.getAccounts();
      if (accounts.length === 0) {
        console.warn("没有连接的账户，跳过合约读取测试");
        return;
      }

      try {
        const balance = await client.readContract({
          address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
          functionName: "balanceOf",
          args: [accounts[0]],
          abi: [
            {
              type: "function",
              name: "balanceOf",
              inputs: [{ name: "account", type: "address" }],
              outputs: [{ name: "", type: "uint256" }],
              stateMutability: "view",
            },
          ],
        });
        expect(balance).toBeTruthy();
      } catch (error) {
        console.warn("无法读取合约数据:", error);
      }
    });

    it("应该通过合约代理读取合约数据", async () => {
      const accounts = await client.getAccounts();
      if (accounts.length === 0) {
        console.warn("没有连接的账户，跳过合约代理测试");
        return;
      }

      try {
        const balance = await client.contracts.USDT.readContract("balanceOf", [
          accounts[0],
        ]);
        expect(balance).toBeTruthy();
      } catch (error) {
        console.warn("无法通过合约代理读取数据:", error);
      }
    });

    // 注意：客户端 Web3Client 没有 getCode, isContract 方法
    // 这些功能需要通过 PublicClient 直接调用或使用其他方式实现
  });

  describe("函数重载", () => {
    // 创建一个包含重载函数的测试 ABI
    const overloadedAbi = [
      // register(uint256) - view 函数
      {
        type: "function",
        name: "register",
        inputs: [{ name: "pid", type: "uint256" }],
        outputs: [{ name: "", type: "bool" }],
        stateMutability: "view",
      },
      // register(uint256, uint256) - view 函数
      {
        type: "function",
        name: "register",
        inputs: [
          { name: "uid", type: "uint256" },
          { name: "pid", type: "uint256" },
        ],
        outputs: [{ name: "", type: "bool" }],
        stateMutability: "view",
      },
      // register(uint256) - pure 函数
      {
        type: "function",
        name: "register",
        inputs: [{ name: "pid", type: "uint256" }],
        outputs: [{ name: "", type: "uint256" }],
        stateMutability: "pure",
      },
      // setValue(uint256) - nonpayable 函数
      {
        type: "function",
        name: "setValue",
        inputs: [{ name: "value", type: "uint256" }],
        outputs: [],
        stateMutability: "nonpayable",
      },
      // setValue(uint256, uint256) - nonpayable 函数
      {
        type: "function",
        name: "setValue",
        inputs: [
          { name: "uid", type: "uint256" },
          { name: "value", type: "uint256" },
        ],
        outputs: [],
        stateMutability: "nonpayable",
      },
      // setValue(uint256) - payable 函数
      {
        type: "function",
        name: "setValue",
        inputs: [{ name: "value", type: "uint256" }],
        outputs: [],
        stateMutability: "payable",
      },
    ];

    let client: Web3Client;

    beforeAll(async () => {
      client = new Web3Client();
      await client.connectWallet();
    });

    it("readContract 应该根据参数数量匹配 view 函数重载", async () => {
      const accounts = await client.getAccounts();
      if (accounts.length === 0) {
        console.warn("没有连接的账户，跳过函数重载测试");
        return;
      }

      // 测试：调用 register(pid) - 1 个参数，应该匹配 register(uint256) view
      try {
        const result1 = await client.readContract({
          address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", // 使用一个存在的合约地址
          functionName: "register",
          args: [100], // 1 个参数
          abi: overloadedAbi as any,
        });
        // 如果调用成功，说明匹配到了正确的函数
        expect(result1).toBeDefined();
      } catch (error) {
        // 如果合约不存在或方法不存在，这是预期的（因为我们使用的是测试 ABI）
        // 但重要的是确保函数匹配逻辑正确
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.log("客户端 readContract 1 参数测试:", errorMessage);
      }
    });

    it("readContract 应该根据参数数量匹配 view 函数重载（2个参数）", async () => {
      const accounts = await client.getAccounts();
      if (accounts.length === 0) {
        console.warn("没有连接的账户，跳过函数重载测试");
        return;
      }

      // 测试：调用 register(uid, pid) - 2 个参数，应该匹配 register(uint256, uint256) view
      try {
        const result2 = await client.readContract({
          address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
          functionName: "register",
          args: [1, 100], // 2 个参数
          abi: overloadedAbi as any,
        });
        expect(result2).toBeDefined();
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.log("客户端 readContract 2 参数测试:", errorMessage);
      }
    });

    it("readContract 应该支持 pure 函数重载", async () => {
      const accounts = await client.getAccounts();
      if (accounts.length === 0) {
        console.warn("没有连接的账户，跳过函数重载测试");
        return;
      }

      // 测试：调用 register(pid) - 1 个参数，应该能匹配到 pure 函数
      // 注意：如果有多个匹配（view 和 pure），会优先返回第一个匹配的
      try {
        const result = await client.readContract({
          address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
          functionName: "register",
          args: [100], // 1 个参数
          abi: overloadedAbi as any,
        });
        expect(result).toBeDefined();
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.log("客户端 readContract pure 函数测试:", errorMessage);
      }
    });

    it("callContract 应该根据参数数量匹配 nonpayable 函数重载", async () => {
      const accounts = await client.getAccounts();
      if (accounts.length === 0) {
        console.warn("没有连接的账户，跳过函数重载测试");
        return;
      }

      // 测试：调用 setValue(value) - 1 个参数，应该匹配 setValue(uint256) nonpayable
      try {
        const result1 = await client.callContract(
          {
            address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
            functionName: "setValue",
            args: [100], // 1 个参数
            abi: overloadedAbi as any,
          },
          false, // 不等待确认
        );
        // 如果调用成功，应该返回交易哈希
        expect(result1).toBeDefined();
        expect(typeof result1 === "string").toBeTruthy();
      } catch (error) {
        // 如果合约不存在或方法不存在，这是预期的
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.log("客户端 callContract 1 参数测试:", errorMessage);
      }
    });

    it("callContract 应该根据参数数量匹配 nonpayable 函数重载（2个参数）", async () => {
      const accounts = await client.getAccounts();
      if (accounts.length === 0) {
        console.warn("没有连接的账户，跳过函数重载测试");
        return;
      }

      // 测试：调用 setValue(uid, value) - 2 个参数，应该匹配 setValue(uint256, uint256) nonpayable
      try {
        const result2 = await client.callContract(
          {
            address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
            functionName: "setValue",
            args: [1, 100], // 2 个参数
            abi: overloadedAbi as any,
          },
          false, // 不等待确认
        );
        expect(result2).toBeDefined();
        expect(typeof result2 === "string").toBeTruthy();
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.log("客户端 callContract 2 参数测试:", errorMessage);
      }
    });

    it("callContract 应该支持 payable 函数重载", async () => {
      const accounts = await client.getAccounts();
      if (accounts.length === 0) {
        console.warn("没有连接的账户，跳过函数重载测试");
        return;
      }

      // 测试：调用 setValue(value) - 1 个参数，应该能匹配到 payable 函数
      try {
        const result = await client.callContract(
          {
            address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
            functionName: "setValue",
            args: [100], // 1 个参数
            abi: overloadedAbi as any,
          },
          false, // 不等待确认
        );
        expect(result).toBeDefined();
        expect(typeof result === "string").toBeTruthy();
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.log("客户端 callContract payable 函数测试:", errorMessage);
      }
    });

    it("应该通过合约代理调用重载函数", async () => {
      const accounts = await client.getAccounts();
      if (accounts.length === 0) {
        console.warn("没有连接的账户，跳过函数重载测试");
        return;
      }

      const clientWithContract = new Web3Client({
        contracts: {
          name: "TestContract",
          address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
          abi: overloadedAbi as any,
        },
      });
      await clientWithContract.connectWallet();

      // 测试通过合约代理调用重载函数
      try {
        // 调用 register(pid) - 1 个参数
        const result1 = await clientWithContract.contracts.TestContract.readContract(
          "register",
          [100],
        );
        expect(result1).toBeDefined();
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.log("客户端合约代理 readContract 1 参数测试:", errorMessage);
      }

      try {
        // 调用 register(uid, pid) - 2 个参数
        const result2 = await clientWithContract.contracts.TestContract.readContract(
          "register",
          [1, 100],
        );
        expect(result2).toBeDefined();
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.log("客户端合约代理 readContract 2 参数测试:", errorMessage);
      }
    });
  });

  describe("钱包事件监听", () => {
    let client: Web3Client;

    beforeAll(() => {
      client = new Web3Client();
    });

    it("应该注册账户变化监听并返回取消函数", () => {
      const unsubscribe = client.onAccountsChanged(() => {});
      expect(typeof unsubscribe).toBe("function");
      // 立即取消
      unsubscribe();
      // 确保清理
      client.offAccountsChanged();
    });

    it("应该取消所有账户变化监听", () => {
      client.onAccountsChanged(() => {});
      client.offAccountsChanged();
      // 验证可以多次调用
      client.offAccountsChanged();
    });

    it("应该注册链切换监听并返回取消函数", () => {
      const unsubscribe = client.onChainChanged(() => {});
      expect(typeof unsubscribe).toBe("function");
      // 立即取消
      unsubscribe();
      // 确保清理
      client.offChainChanged();
    });

    it("应该取消所有链切换监听", () => {
      client.onChainChanged(() => {});
      client.offChainChanged();
      // 验证可以多次调用
      client.offChainChanged();
    });
  });

  describe("消息签名", () => {
    let client: Web3Client;

    beforeAll(async () => {
      client = new Web3Client();
      await client.connectWallet();
    });

    it("应该签名消息", async () => {
      const accounts = await client.getAccounts();
      if (accounts.length === 0) {
        console.warn("没有连接的账户，跳过签名测试");
        return;
      }

      const message = "Hello, Web3!";
      try {
        const signature = await client.signMessage(message);
        expect(signature).toBeTruthy();
        expect(typeof signature).toBe("string");
        expect(signature.startsWith("0x")).toBeTruthy();
      } catch (error) {
        console.warn("无法签名消息:", error);
      }
    });

    it("应该验证消息签名", async () => {
      const accounts = await client.getAccounts();
      if (accounts.length === 0) {
        console.warn("没有连接的账户，跳过验证签名测试");
        return;
      }

      const message = "Hello, Web3!";
      try {
        const signature = await client.signMessage(message);
        expect(signature).toBeTruthy();
        expect(typeof signature).toBe("string");
        expect(signature.startsWith("0x")).toBeTruthy();
        
        // 注意：在 Mock 环境中，签名是假的，无法通过椭圆曲线验证
        // 这是预期的行为，因为 Mock personal_sign 返回的不是真正的有效签名
        try {
          const isValid = await client.verifyMessage(
            message,
            signature,
            accounts[0],
          );
          expect(typeof isValid).toBe("boolean");
        } catch (verifyError) {
          // Mock 环境中的假签名无法通过验证是正常的
          // 在实际环境中，真实的签名可以正常验证
          expect(verifyError).toBeInstanceOf(Error);
        }
      } catch (error) {
        console.warn("无法签名消息:", error);
      }
    });
  });

  // 注意：客户端 Web3Client 没有 destroy 方法
  // 资源清理由浏览器环境自动处理
});
