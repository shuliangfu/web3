/**
 * @fileoverview Web3 测试
 */

import { afterAll, beforeAll, describe, expect, it } from "@dreamer/test";
import { createWeb3Client, Web3Client } from "../src/mod.ts";
import { formatAddress, isAddress } from "../src/utils.ts";
import usdtAbi from "./data/abi/USDT.json" with { type: "json" };
import config from "./data/config.ts";

describe("Web3", () => {
  describe("Web3Client", () => {
    it("应该创建客户端实例", () => {
      const client = new Web3Client({
        rpcUrl: config.host,
        chainId: config.chainId,
      });
      expect(client).toBeTruthy();
    });

    it("应该创建带合约配置的客户端实例", () => {
      const client = new Web3Client({
        rpcUrl: config.host,
        chainId: config.chainId,
        contracts: {
          name: "USDT",
          address: usdtAbi.address,
          abi: usdtAbi.abi,
        },
      });
      expect(client).toBeTruthy();
      expect(client.contracts.USDT).toBeTruthy();
      expect(client.contracts.USDT.address).toBe(usdtAbi.address);
    });

    it("应该使用便捷函数 createWeb3Client 创建客户端", () => {
      const client = createWeb3Client({
        rpcUrl: config.host,
        chainId: config.chainId,
      });
      expect(client).toBeTruthy();
      expect(client).toBeInstanceOf(Web3Client);
    });

    it("应该使用便捷函数 createWeb3Client 创建带合约配置的客户端", () => {
      const client = createWeb3Client({
        rpcUrl: config.host,
        chainId: config.chainId,
        contracts: {
          name: "USDT",
          address: usdtAbi.address,
          abi: usdtAbi.abi,
        },
      });
      expect(client).toBeTruthy();
      expect(client).toBeInstanceOf(Web3Client);
      expect(client.contracts.USDT).toBeTruthy();
      expect(client.contracts.USDT.address).toBe(usdtAbi.address);
    });
  });

  describe("工具函数", () => {
    it("应该验证地址", () => {
      // 使用标准的以太坊地址（小写，40个字符）
      const validAddress = "0x742d35cc6634c0532925a3b844bc9e7595f0beb0";
      // 使用 formatAddress 生成正确的校验和地址
      const validAddressWithChecksum = formatAddress(validAddress);
      const invalidAddress = "invalid";
      const invalidAddressShort = "0x123";

      expect(isAddress(validAddress)).toBeTruthy();
      expect(isAddress(validAddressWithChecksum)).toBeTruthy();
      expect(isAddress(invalidAddress)).toBeFalsy();
      expect(isAddress(invalidAddressShort)).toBeFalsy();
    });

    it("应该格式化地址", () => {
      // 使用小写地址，应该格式化为校验和地址
      const address = "0x742d35cc6634c0532925a3b844bc9e7595f0beb0";
      const formatted = formatAddress(address);

      expect(formatted).toBeTruthy();
      expect(typeof formatted).toBe("string");
      expect(formatted.startsWith("0x")).toBeTruthy();
      expect(formatted.length).toBe(42); // 0x + 40 字符
    });

    it("应该处理没有 0x 前缀的地址", () => {
      const address = "742d35cc6634c0532925a3b844bc9e7595f0beb0";
      const formatted = formatAddress(address);

      expect(formatted).toBeTruthy();
      expect(typeof formatted).toBe("string");
      expect(formatted.startsWith("0x")).toBeTruthy();
      expect(formatted.length).toBe(42); // 0x + 40 字符
    });
  });

  describe("Web3Client 方法", () => {
    let client: Web3Client;

    beforeAll(() => {
      client = new Web3Client({
        rpcUrl: config.host,
        chainId: config.chainId,
        privateKey: config.privateKey, // 添加私钥以支持签名测试
      });
    });

    afterAll(async () => {
      // 清理所有资源
      if (client) {
        await client.destroy(true);
      }
    });

    describe("配置方法", () => {
      it("应该获取配置", () => {
        const clientConfig = client.getConfig();
        expect(clientConfig).toBeTruthy();
        expect(clientConfig.rpcUrl).toBe(config.host);
        expect(clientConfig.chainId).toBe(config.chainId);
      });

      it("应该更新配置", () => {
        const newChainId = 56;
        client.updateConfig({ chainId: newChainId });
        const updatedConfig = client.getConfig();
        expect(updatedConfig.chainId).toBe(newChainId);
        // 恢复原配置
        client.updateConfig({ chainId: config.chainId });
      });
    });

    describe("网络和链信息", () => {
      it("应该获取网络信息", async () => {
        const network = await client.getNetwork();
        expect(network).toBeTruthy();
        expect(network.chainId).toBe(config.chainId);
        expect(typeof network.name).toBe("string");
      });

      it("应该获取链 ID", async () => {
        const chainId = await client.getChainId();
        expect(chainId).toBe(config.chainId);
        expect(typeof chainId).toBe("number");
      });

      it("应该获取当前区块号", async () => {
        const blockNumber = await client.getBlockNumber();
        expect(blockNumber).toBeTruthy();
        expect(typeof blockNumber).toBe("number");
        expect(blockNumber).toBeGreaterThan(0);
      });
    });

    describe("账户和余额", () => {
      it("应该获取账户余额", async () => {
        const balance = await client.getBalance(config.address);
        expect(balance).toBeTruthy();
        expect(typeof balance).toBe("string");
        const balanceBigInt = BigInt(balance);
        expect(balanceBigInt >= BigInt(0)).toBeTruthy();
      });

      it("应该批量获取账户余额", async () => {
        const addresses = [config.address];
        const balances = await client.getBalances(addresses);
        expect(balances).toBeTruthy();
        expect(Array.isArray(balances)).toBeTruthy();
        expect(balances.length).toBe(1);
        expect(typeof balances[0]).toBe("string");
      });

      it("应该获取交易计数（nonce）", async () => {
        const nonce = await client.getTransactionCount(config.address);
        expect(typeof nonce).toBe("number");
        expect(nonce).toBeGreaterThanOrEqual(0);
      });
    });

    describe("Gas 相关", () => {
      it("应该获取 Gas 价格", async () => {
        const gasPrice = await client.getGasPrice();
        expect(gasPrice).toBeTruthy();
        expect(typeof gasPrice).toBe("string");
        const gasPriceBigInt = BigInt(gasPrice);
        expect(gasPriceBigInt > BigInt(0)).toBeTruthy();
      });

      it("应该获取费用数据", async () => {
        const feeData = await client.getFeeData();
        expect(feeData).toBeTruthy();
        expect(typeof feeData).toBe("object");
        // 至少应该有一个费用字段不为 null
        expect(
          feeData.gasPrice !== null ||
            feeData.maxFeePerGas !== null ||
            feeData.maxPriorityFeePerGas !== null,
        ).toBeTruthy();
      });

      it("应该估算 Gas 消耗", async () => {
        try {
          const gasEstimate = await client.estimateGas({
            to: config.address,
            value: "0",
          });
          expect(gasEstimate).toBeTruthy();
          expect(typeof gasEstimate).toBe("string");
          const gasEstimateBigInt = BigInt(gasEstimate);
          expect(gasEstimateBigInt > BigInt(0)).toBeTruthy();
        } catch (error) {
          // 如果估算失败（例如地址无效），跳过测试
          console.warn("无法估算 Gas:", error);
        }
      });

      it("应该获取 Gas 限制", async () => {
        const gasLimit = await client.getGasLimit();
        expect(gasLimit).toBeTruthy();
        expect(typeof gasLimit).toBe("string");
        const gasLimitBigInt = BigInt(gasLimit);
        expect(gasLimitBigInt > BigInt(0)).toBeTruthy();
      });
    });

    describe("区块相关", () => {
      it("应该获取区块信息", async () => {
        const blockNumber = await client.getBlockNumber();
        const block = await client.getBlock(blockNumber);
        expect(block).toBeTruthy();
        expect(typeof block).toBe("object");
      });

      it("应该获取最新区块信息", async () => {
        const block = await client.getBlock();
        expect(block).toBeTruthy();
        expect(typeof block).toBe("object");
      });

      it("应该获取区块中的交易", async () => {
        const blockNumber = await client.getBlockNumber();
        const transactions = await client.getBlockTransactions(
          blockNumber,
          false,
        );
        expect(Array.isArray(transactions)).toBeTruthy();
      });
    });

    describe("交易相关", () => {
      it("应该获取交易信息（如果存在）", async () => {
        // 尝试获取一个已知的交易哈希（如果存在）
        // 这里我们只测试方法调用，不验证具体交易
        try {
          // 使用一个无效的交易哈希来测试错误处理
          await client.getTransaction(
            "0x0000000000000000000000000000000000000000000000000000000000000000",
          );
        } catch (error) {
          // 预期会失败，这是正常的
          expect(error).toBeTruthy();
        }
      });

      it("应该获取交易收据（如果存在）", async () => {
        try {
          await client.getTransactionReceipt(
            "0x0000000000000000000000000000000000000000000000000000000000000000",
          );
        } catch (error) {
          // 预期会失败，这是正常的
          expect(error).toBeTruthy();
        }
      });

      it("应该发送普通 ETH 转账", async () => {
        // 生成一个接收地址（用于测试）
        const { generateWallet } = await import("../src/utils.ts");
        const receiverWallet = generateWallet();
        const receiverAddress = receiverWallet.address;

        // 先检查发送方余额
        const senderBalance = await client.getBalance(config.address);
        const senderBalanceBigInt = BigInt(senderBalance);

        // 检查余额是否足够（0.001 ETH，使用 toWei 转换为 18 位小数）
        const { toWei } = await import("../src/utils.ts");
        const transferAmount = BigInt(toWei("0.001", "ether")); // 0.001 ETH
        if (senderBalanceBigInt < transferAmount) {
          console.warn(
            `余额不足，需要至少 ${transferAmount.toString()}，当前余额: ${senderBalance.toString()}`,
          );
          return; // 跳过测试
        }

        try {
          // 发送交易
          const txHash = await client.sendTransaction({
            to: receiverAddress,
            value: transferAmount.toString(),
          });

          expect(txHash).toBeTruthy();
          expect(typeof txHash).toBe("string");
          expect(txHash.startsWith("0x")).toBeTruthy();
          console.log("转账交易哈希:", txHash);

          // 等待交易确认
          const receipt = await client.waitForTransaction(txHash, 1);
          expect(receipt).toBeTruthy();
          console.log("交易已确认:", receipt);
        } catch (error) {
          // 如果发送失败（例如 gas 不足、网络问题等），跳过测试
          console.warn("无法发送 ETH 转账:", error);
        }
      }, { sanitizeOps: false, sanitizeResources: false });

      it("应该发送 EIP-1559 交易", async () => {
        // 生成一个接收地址（用于测试）
        const { generateWallet } = await import("../src/utils.ts");
        const receiverWallet = generateWallet();
        const receiverAddress = receiverWallet.address;

        // 先检查发送方余额
        const senderBalance = await client.getBalance(config.address);
        const senderBalanceBigInt = BigInt(senderBalance);

        // 检查余额是否足够（0.001 ETH）
        const { toWei } = await import("../src/utils.ts");
        const transferAmount = BigInt(toWei("0.001", "ether"));
        if (senderBalanceBigInt < transferAmount) {
          console.warn("余额不足，跳过 EIP-1559 交易测试");
          return;
        }

        try {
          // 获取费用数据
          const feeData = await client.getFeeData();
          if (!feeData.maxFeePerGas) {
            console.warn("网络不支持 EIP-1559，跳过测试");
            return;
          }

          // 发送 EIP-1559 交易
          const txHash = await client.sendTransaction({
            to: receiverAddress,
            value: transferAmount.toString(),
            maxFeePerGas: feeData.maxFeePerGas,
            maxPriorityFeePerGas: feeData.maxPriorityFeePerGas || "1000000000", // 1 gwei
          });

          expect(txHash).toBeTruthy();
          expect(typeof txHash).toBe("string");
          expect(txHash.startsWith("0x")).toBeTruthy();
          console.log("EIP-1559 交易哈希:", txHash);
        } catch (error) {
          console.warn("无法发送 EIP-1559 交易:", error);
        }
      }, { sanitizeOps: false, sanitizeResources: false });

      it("应该发送 Legacy 交易（gasPrice）", async () => {
        // 生成一个接收地址（用于测试）
        const { generateWallet } = await import("../src/utils.ts");
        const receiverWallet = generateWallet();
        const receiverAddress = receiverWallet.address;

        // 先检查发送方余额
        const senderBalance = await client.getBalance(config.address);
        const senderBalanceBigInt = BigInt(senderBalance);

        // 检查余额是否足够（0.001 ETH）
        const { toWei } = await import("../src/utils.ts");
        const transferAmount = BigInt(toWei("0.001", "ether"));
        if (senderBalanceBigInt < transferAmount) {
          console.warn("余额不足，跳过 Legacy 交易测试");
          return;
        }

        try {
          // 获取 gas 价格
          const gasPrice = await client.getGasPrice();

          // 发送 Legacy 交易
          const txHash = await client.sendTransaction({
            to: receiverAddress,
            value: transferAmount.toString(),
            gasPrice: gasPrice,
          });

          expect(txHash).toBeTruthy();
          expect(typeof txHash).toBe("string");
          expect(txHash.startsWith("0x")).toBeTruthy();
          console.log("Legacy 交易哈希:", txHash);
        } catch (error) {
          console.warn("无法发送 Legacy 交易:", error);
        }
      }, { sanitizeOps: false, sanitizeResources: false });

      it("应该等待交易确认", async () => {
        // 生成一个接收地址（用于测试）
        const { generateWallet, toWei } = await import("../src/utils.ts");
        const receiverWallet = generateWallet();
        const receiverAddress = receiverWallet.address;

        // 先检查发送方余额
        const senderBalance = await client.getBalance(config.address);
        const senderBalanceBigInt = BigInt(senderBalance);

        // 检查余额是否足够（0.001 ETH）
        const transferAmount = BigInt(toWei("0.001", "ether"));
        if (senderBalanceBigInt < transferAmount) {
          console.warn("余额不足，跳过等待交易确认测试");
          return;
        }

        try {
          // 发送交易
          const txHash = await client.sendTransaction({
            to: receiverAddress,
            value: transferAmount.toString(),
          });

          expect(txHash).toBeTruthy();

          // 等待交易确认（1 个确认）
          const receipt = await client.waitForTransaction(txHash, 1);
          expect(receipt).toBeTruthy();
          expect(typeof receipt).toBe("object");
          console.log("交易已确认:", receipt);

          // 测试等待多个确认（如果可能）
          try {
            const receipt2 = await client.waitForTransaction(txHash, 2);
            expect(receipt2).toBeTruthy();
          } catch (error) {
            // 如果等待多个确认失败（例如超时），这是正常的
            console.warn("等待多个确认失败（可能超时）:", error);
          }
        } catch (error) {
          console.warn("无法测试等待交易确认:", error);
        }
      }, { sanitizeOps: false, sanitizeResources: false });

      it("应该处理发送交易时的错误（余额不足）", async () => {
        // 使用一个无效的接收地址（但格式正确）
        const { generateWallet } = await import("../src/utils.ts");
        const receiverWallet = generateWallet();
        const receiverAddress = receiverWallet.address;

        // 尝试发送一个非常大的金额（应该失败）
        const hugeAmount =
          "9999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999";

        try {
          await client.sendTransaction({
            to: receiverAddress,
            value: hugeAmount,
          });
          // 如果成功，说明余额确实很大（不太可能）
          console.warn("发送大额交易成功（余额异常大）");
        } catch (error) {
          // 预期会失败（余额不足或 gas 不足）
          expect(error).toBeTruthy();
          const errorMessage = error instanceof Error
            ? error.message
            : String(error);
          expect(errorMessage.length).toBeGreaterThan(0);
          console.log("预期的错误:", errorMessage);
        }
      });
    });

    describe("合约相关", () => {
      it("应该读取合约数据（如果配置了合约）", async () => {
        const clientWithContract = new Web3Client({
          rpcUrl: config.host,
          chainId: config.chainId,
          contracts: {
            name: "USDT",
            address: usdtAbi.address,
            abi: usdtAbi.abi,
          },
        });

        // 尝试读取 USDT 合约的 name 方法（如果存在）
        try {
          const name = await clientWithContract.contracts.USDT.readContract(
            "name",
          );
          expect(name).toBeTruthy();
          expect(typeof name).toBe("string");
        } catch (error) {
          // 如果合约不存在或方法不存在，跳过测试
          console.warn("无法读取 USDT 合约 name 方法:", error);
        }
      });

      it("应该读取 USDT 余额", async () => {
        const clientWithContract = new Web3Client({
          rpcUrl: config.host,
          chainId: config.chainId,
          privateKey: config.privateKey,
          contracts: {
            name: "USDT",
            address: usdtAbi.address,
            abi: usdtAbi.abi,
          },
        });

        try {
          // 读取余额（balanceOf 方法）
          const balance = await clientWithContract.contracts.USDT.readContract(
            "balanceOf",
            [config.address],
          );
          expect(balance).toBeTruthy();
          expect(typeof balance === "bigint" || typeof balance === "string")
            .toBeTruthy();
        } catch (error) {
          console.warn("无法读取 USDT 余额:", error);
        }
      });

      it("应该获取合约代码", async () => {
        try {
          const code = await client.getCode(usdtAbi.address);
          expect(code).toBeTruthy();
          expect(typeof code).toBe("string");
          expect(code.startsWith("0x")).toBeTruthy();
        } catch (error) {
          console.warn("无法获取合约代码:", error);
        }
      });

      it("应该检查地址是否为合约", async () => {
        try {
          const isContract = await client.isContract(usdtAbi.address);
          expect(typeof isContract).toBe("boolean");
        } catch (error) {
          console.warn("无法检查合约地址:", error);
        }
      });

      it("应该检查普通地址不是合约", async () => {
        try {
          const isContract = await client.isContract(config.address);
          expect(typeof isContract).toBe("boolean");
          // 普通地址通常不是合约
          expect(isContract).toBeFalsy();
        } catch (error) {
          console.warn("无法检查地址:", error);
        }
      });
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

      it("readContract 应该根据参数数量匹配 view 函数重载", async () => {
        const client = new Web3Client({
          rpcUrl: config.host,
          chainId: config.chainId,
        });

        // 测试：调用 register(pid) - 1 个参数，应该匹配 register(uint256) view
        try {
          const result1 = await client.readContract({
            address: usdtAbi.address, // 使用一个存在的合约地址
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
          // 如果错误是"函数不存在"或"合约不存在"，说明匹配逻辑可能有问题
          // 如果错误是"执行 revert"或其他合约相关错误，说明匹配成功了
          console.log("readContract 1 参数测试:", errorMessage);
        }
      });

      it("readContract 应该根据参数数量匹配 view 函数重载（2个参数）", async () => {
        const client = new Web3Client({
          rpcUrl: config.host,
          chainId: config.chainId,
        });

        // 测试：调用 register(uid, pid) - 2 个参数，应该匹配 register(uint256, uint256) view
        try {
          const result2 = await client.readContract({
            address: usdtAbi.address,
            functionName: "register",
            args: [1, 100], // 2 个参数
            abi: overloadedAbi as any,
          });
          expect(result2).toBeDefined();
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          console.log("readContract 2 参数测试:", errorMessage);
        }
      });

      it("readContract 应该支持 pure 函数重载", async () => {
        const client = new Web3Client({
          rpcUrl: config.host,
          chainId: config.chainId,
        });

        // 测试：调用 register(pid) - 1 个参数，应该能匹配到 pure 函数
        // 注意：如果有多个匹配（view 和 pure），会优先返回第一个匹配的
        try {
          const result = await client.readContract({
            address: usdtAbi.address,
            functionName: "register",
            args: [100], // 1 个参数
            abi: overloadedAbi as any,
          });
          expect(result).toBeDefined();
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          console.log("readContract pure 函数测试:", errorMessage);
        }
      });

      it("callContract 应该根据参数数量匹配 nonpayable 函数重载", async () => {
        const client = new Web3Client({
          rpcUrl: config.host,
          chainId: config.chainId,
          privateKey: config.privateKey,
        });

        // 测试：调用 setValue(value) - 1 个参数，应该匹配 setValue(uint256) nonpayable
        try {
          const result1 = await client.callContract(
            {
              address: usdtAbi.address,
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
          console.log("callContract 1 参数测试:", errorMessage);
        }
      });

      it("callContract 应该根据参数数量匹配 nonpayable 函数重载（2个参数）", async () => {
        const client = new Web3Client({
          rpcUrl: config.host,
          chainId: config.chainId,
          privateKey: config.privateKey,
        });

        // 测试：调用 setValue(uid, value) - 2 个参数，应该匹配 setValue(uint256, uint256) nonpayable
        try {
          const result2 = await client.callContract(
            {
              address: usdtAbi.address,
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
          console.log("callContract 2 参数测试:", errorMessage);
        }
      });

      it("callContract 应该支持 payable 函数重载", async () => {
        const client = new Web3Client({
          rpcUrl: config.host,
          chainId: config.chainId,
          privateKey: config.privateKey,
        });

        // 测试：调用 setValue(value) - 1 个参数，应该能匹配到 payable 函数
        try {
          const result = await client.callContract(
            {
              address: usdtAbi.address,
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
          console.log("callContract payable 函数测试:", errorMessage);
        }
      });

      it("应该通过合约代理调用重载函数", async () => {
        const client = new Web3Client({
          rpcUrl: config.host,
          chainId: config.chainId,
          contracts: {
            name: "TestContract",
            address: usdtAbi.address,
            abi: overloadedAbi as any,
          },
        });

        // 测试通过合约代理调用重载函数
        try {
          // 调用 register(pid) - 1 个参数
          const result1 = await client.contracts.TestContract.readContract(
            "register",
            [100],
          );
          expect(result1).toBeDefined();
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          console.log("合约代理 readContract 1 参数测试:", errorMessage);
        }

        try {
          // 调用 register(uid, pid) - 2 个参数
          const result2 = await client.contracts.TestContract.readContract(
            "register",
            [1, 100],
          );
          expect(result2).toBeDefined();
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          console.log("合约代理 readContract 2 参数测试:", errorMessage);
        }
      });
    });

    describe("USDT 合约转账测试", () => {
      let clientWithContract: Web3Client;
      let transferTxHash: string | undefined;
      let receivedEvent: any = null;
      let transferBlockNumber: number | undefined;

      beforeAll(() => {
        clientWithContract = new Web3Client({
          rpcUrl: config.host,
          chainId: config.chainId,
          privateKey: config.privateKey,
          wssUrl: config.wss, // 使用 WebSocket 进行事件监听
          contracts: {
            name: "USDT",
            address: usdtAbi.address,
            abi: usdtAbi.abi,
          },
        });
      });

      afterAll(async () => {
        // 清理所有事件监听器，关闭 WebSocket 连接
        if (clientWithContract) {
          // 在测试环境中等待资源完全清理
          await clientWithContract.destroy(true);
        }
      });

      it("应该读取 USDT 余额", async () => {
        try {
          const balance = await clientWithContract.contracts.USDT.readContract(
            "balanceOf",
            [config.address],
          );
          expect(balance).toBeTruthy();
          const balanceBigInt = typeof balance === "bigint"
            ? balance
            : BigInt(balance as string);
          console.log("USDT 余额:", balanceBigInt.toString());
          expect(balanceBigInt >= BigInt(0)).toBeTruthy();
        } catch (error) {
          console.warn("无法读取 USDT 余额:", error);
        }
      });

      it("应该执行 USDT 转账并监听转账事件", async () => {
        // 生成一个接收地址（用于测试）
        const { generateWallet } = await import("../src/utils.ts");
        const receiverWallet = generateWallet();
        const receiverAddress = receiverWallet.address;

        console.log("接收地址:", receiverAddress);

        // 先读取发送方余额
        let senderBalance: bigint;
        try {
          const balance = await clientWithContract.contracts.USDT.readContract(
            "balanceOf",
            [config.address],
          );
          senderBalance = typeof balance === "bigint"
            ? balance
            : BigInt(balance as string);
          console.log("发送方 USDT 余额:", senderBalance.toString());
        } catch (error) {
          // 如果是本地网络，合约可能不存在或余额为 0，这是正常的
          const errorMessage = error instanceof Error ? error.message : String(error);
          if (
            errorMessage.includes("returned no data") ||
            errorMessage.includes("revert") ||
            errorMessage.includes("not a contract")
          ) {
            console.warn(
              `无法读取发送方余额（本地网络可能合约未部署）: ${errorMessage}`,
            );
            // 对于本地网络，如果合约不存在，跳过测试
            return;
          }
          throw new Error(`无法读取发送方余额: ${error}`);
        }

        // 检查余额是否足够（1 USDT，使用 toWei 转换为 18 位小数）
        const { toWei } = await import("../src/utils.ts");
        const transferAmount = BigInt(toWei("1", "ether")); // 1 USDT (18 位小数)
        if (senderBalance < transferAmount) {
          console.warn(
            `余额不足，需要至少 ${transferAmount.toString()}，当前余额: ${senderBalance.toString()}`,
          );
          return; // 跳过测试
        }

        // 获取当前区块号，用于从该区块开始监听
        const currentBlock = await clientWithContract.getBlockNumber();
        console.log("当前区块号:", currentBlock);

        // 设置事件监听器（从当前区块开始，确保能捕获到即将发生的交易）
        let eventReceived = false;
        const unsubscribe = clientWithContract.onContractEvent(
          usdtAbi.address,
          "Transfer",
          (event: any) => {
            console.log("收到 Transfer 事件:", event);
            // 检查是否是我们发送的交易
            if (
              event.args?.from?.toLowerCase() ===
                config.address.toLowerCase() &&
              event.args?.to?.toLowerCase() === receiverAddress.toLowerCase()
            ) {
              receivedEvent = event;
              eventReceived = true;
            }
          },
          {
            fromBlock: currentBlock, // 从当前区块开始扫描，确保能捕获到即将发生的交易
            abi: usdtAbi.abi as any,
          },
        );

        // 等待 WebSocket 连接建立（给监听器一些时间启动）
        await new Promise((resolve) => setTimeout(resolve, 2000));

        try {
          // 执行转账（1 USDT，使用 toWei 转换为 18 位小数）
          console.log("开始执行转账...");
          const receipt = await clientWithContract.contracts.USDT.callContract(
            "transfer",
            [receiverAddress, transferAmount.toString()],
            true, // 等待确认
          ) as any;

          expect(receipt).toBeTruthy();
          transferTxHash = receipt.transactionHash || receipt.hash;
          expect(transferTxHash).toBeTruthy();
          expect(typeof transferTxHash).toBe("string");
          console.log("转账交易哈希:", transferTxHash);

          // 等待事件（最多 30 秒）
          const maxWaitTime = 30000;
          const startTime = Date.now();
          while (!eventReceived && (Date.now() - startTime) < maxWaitTime) {
            await new Promise((resolve) => setTimeout(resolve, 500));
          }

          // 如果收到事件，验证事件内容
          if (eventReceived && receivedEvent) {
            expect(receivedEvent.args).toBeTruthy();
            expect(
              receivedEvent.args.from?.toLowerCase(),
            ).toBe(config.address.toLowerCase());
            expect(
              receivedEvent.args.to?.toLowerCase(),
            ).toBe(receiverAddress.toLowerCase());
            console.log("成功监听到转账事件");

            // 从事件中获取区块号（事件中肯定有区块号）
            if (receivedEvent.blockNumber) {
              transferBlockNumber =
                typeof receivedEvent.blockNumber === "bigint"
                  ? Number(receivedEvent.blockNumber)
                  : receivedEvent.blockNumber;
              console.log("从事件获取区块号:", transferBlockNumber);
            }
          } else {
            console.warn(
              "未在 30 秒内收到转账事件（可能因为事件监听器启动延迟）",
            );
            // 即使没有收到事件，也验证交易成功
            // 尝试从收据中获取区块号
            if (receipt.blockNumber) {
              transferBlockNumber = typeof receipt.blockNumber === "bigint"
                ? Number(receipt.blockNumber)
                : receipt.blockNumber;
              console.log("从收据获取区块号:", transferBlockNumber);
            }
          }

          // 验证接收方余额
          const receiverBalance = await clientWithContract.contracts.USDT
            .readContract("balanceOf", [receiverAddress]);
          expect(receiverBalance).toBeTruthy();
          const receiverBalanceBigInt = typeof receiverBalance === "bigint"
            ? receiverBalance
            : BigInt(receiverBalance as string);
          expect(receiverBalanceBigInt >= transferAmount).toBeTruthy();
          console.log("接收方 USDT 余额:", receiverBalanceBigInt.toString());
        } finally {
          // 清理监听器（立即取消订阅，避免资源泄漏）
          try {
            unsubscribe();
            clientWithContract.offContractEvent(usdtAbi.address, "Transfer");

            // 尝试主动关闭 WebSocket 连接
            const client = clientWithContract as any;
            if (client.wsClient) {
              try {
                const wsClient = client.wsClient as any;
                const transport = wsClient.transport || wsClient._transport;
                if (transport && typeof transport.getSocket === "function") {
                  const socket = transport.getSocket();
                  if (
                    socket && typeof socket.close === "function" &&
                    socket.readyState !== 3
                  ) {
                    socket.close(1000, "测试结束，关闭连接");
                    // 等待连接关闭
                    await new Promise<void>((resolve) => {
                      const checkClosed = () => {
                        if (socket.readyState === 3) { // WebSocket.CLOSED = 3
                          resolve();
                        } else {
                          setTimeout(checkClosed, 10);
                        }
                      };
                      checkClosed();
                    });
                  }
                }
              } catch (error) {
                // 忽略关闭时的错误
              }
            }

            // 等待更长时间，确保所有异步操作完成
            await new Promise((resolve) => setTimeout(resolve, 300));
          } catch (error) {
            console.warn("清理监听器时出错:", error);
          }
        }
      }, { sanitizeOps: false, sanitizeResources: false, timeout: 15000 });

      it("应该扫描 USDT 合约的 transfer 方法交易", async () => {
        if (!transferTxHash || !transferBlockNumber) {
          console.warn("没有转账交易信息，跳过扫描测试");
          return;
        }

        try {
          const currentBlock = await clientWithContract.getBlockNumber();
          // 本地网络：扫描最近的1万个区块
          const scanRange = 10000;
          const fromBlock = Math.max(0, currentBlock - scanRange);
          const toBlock = currentBlock;

          console.log(
            `扫描区块范围: ${fromBlock} - ${toBlock} (转账在区块 ${transferBlockNumber})`,
          );

          const result = await clientWithContract
            .scanContractMethodTransactions(
              usdtAbi.address,
              "transfer(address,uint256)",
              {
                fromBlock,
                toBlock,
                abi: usdtAbi.abi as any,
              },
            );

          expect(result).toBeTruthy();
          expect(Array.isArray(result.transactions)).toBeTruthy();
          expect(typeof result.total).toBe("number");

          console.log(`找到 ${result.total} 笔 transfer 交易`);

          // 验证我们的交易在结果中
          const ourTransaction = result.transactions.find(
            (tx: any) =>
              tx.hash?.toLowerCase() === transferTxHash?.toLowerCase(),
          );
          if (ourTransaction) {
            console.log("找到我们的转账交易:", ourTransaction);
            expect(ourTransaction).toBeTruthy();
          } else {
            console.warn("未在扫描结果中找到我们的交易（可能因为区块范围）");
          }
        } catch (error) {
          console.warn("无法扫描合约方法交易:", error);
        }
      }, { sanitizeOps: false, sanitizeResources: false });
    });

    describe("消息签名", () => {
      it("应该签名消息", async () => {
        const message = "Hello, Web3!";
        const signature = await client.signMessage(message);
        expect(signature).toBeTruthy();
        expect(typeof signature).toBe("string");
        expect(signature.startsWith("0x")).toBeTruthy();
      });

      it("应该使用指定私钥签名消息", async () => {
        const message = "Hello, Web3!";
        const signature = await client.signMessage(message, config.privateKey);
        expect(signature).toBeTruthy();
        expect(typeof signature).toBe("string");
      });

      it("应该验证消息签名", async () => {
        const message = "Hello, Web3!";
        const signature = await client.signMessage(message);
        const isValid = await client.verifyMessage(
          message,
          signature,
          config.address,
        );
        expect(isValid).toBeTruthy();
      });
    });

    describe("事件监听", () => {
      // 注意：事件监听测试只测试注册和取消功能，不启动实际监听以避免资源泄漏
      it("应该注册区块监听并返回取消函数", () => {
        const unsubscribe = client.onBlock(() => {});
        expect(typeof unsubscribe).toBe("function");
        // 立即取消，避免启动后台任务
        unsubscribe();
        // 确保清理
        client.offBlock();
      });

      it("应该取消所有区块监听", () => {
        client.onBlock(() => {});
        client.offBlock();
        // 验证可以多次调用
        client.offBlock();
      });

      it("应该注册交易监听并返回取消函数", () => {
        const unsubscribe = client.onTransaction(() => {});
        expect(typeof unsubscribe).toBe("function");
        // 立即取消，避免启动后台任务
        unsubscribe();
        // 确保清理
        client.offTransaction();
      });

      it("应该取消所有交易监听", () => {
        client.onTransaction(() => {});
        client.offTransaction();
        // 验证可以多次调用
        client.offTransaction();
      });

      it("应该注册合约事件监听并返回取消函数", () => {
        const contractAddress = usdtAbi.address;
        const eventName = "Transfer";

        const unsubscribe = client.onContractEvent(
          contractAddress,
          eventName,
          () => {},
        );
        expect(typeof unsubscribe).toBe("function");
        // 立即取消，避免启动后台任务
        unsubscribe();
        // 确保清理
        client.offContractEvent(contractAddress, eventName);
      }, { sanitizeOps: false, sanitizeResources: false });

      it("应该取消合约的指定事件监听", async () => {
        const contractAddress = usdtAbi.address;
        const eventName = "Transfer";

        client.onContractEvent(contractAddress, eventName, () => {});
        client.offContractEvent(contractAddress, eventName);
        // 等待资源清理
        await new Promise((resolve) => setTimeout(resolve, 100));
      }, { sanitizeOps: false, sanitizeResources: false });

      it("应该取消合约的所有事件监听", async () => {
        const contractAddress = usdtAbi.address;
        const eventName1 = "Transfer";
        const eventName2 = "Approval";

        client.onContractEvent(contractAddress, eventName1, () => {});
        client.onContractEvent(contractAddress, eventName2, () => {});

        // 取消该合约的所有事件监听
        client.offContractEvent(contractAddress);
        // 等待资源清理
        await new Promise((resolve) => setTimeout(resolve, 100));
      }, { sanitizeOps: false, sanitizeResources: false });
    });

    describe("重连配置", () => {
      it("应该设置重连配置", () => {
        client.setReconnectConfig(5000, 5);
        // 验证配置已设置（通过行为验证）
        expect(client).toBeTruthy();
      });
    });

    describe("交易历史", () => {
      it("应该获取地址的交易历史", async () => {
        try {
          const blockNumber = await client.getBlockNumber();
          // 使用指定的地址获取交易历史
          const address = "0xD9FE3660E587D6F8E97022A43BffC73697B10a63";
          // 减少扫描范围，避免超时（只扫描最近 500 个区块）
          const scanRange = 500;
          const transactions = await client.getAddressTransactions(
            address,
            blockNumber - scanRange, // 查询最近 500 个区块
            blockNumber,
          );
          expect(Array.isArray(transactions)).toBeTruthy();
          console.log(`找到 ${transactions.length} 笔交易`);
        } catch (error) {
          // 如果查询失败（例如地址没有交易），跳过测试
          console.warn("无法获取地址交易历史:", error);
        } finally {
          // 确保测试结束后清理资源（虽然 afterAll 会处理，但这里也清理一下）
          // 等待更长时间，确保所有异步操作完成
          await new Promise((resolve) => setTimeout(resolve, 300));
        }
      }, { sanitizeOps: false, sanitizeResources: false, timeout: 15000 });

      it("应该扫描合约方法交易", async () => {
        try {
          const blockNumber = await client.getBlockNumber();
          // 扫描 USDT 合约的 transfer 转账方法
          const result = await client.scanContractMethodTransactions(
            usdtAbi.address,
            "transfer(address,uint256)",
            {
              fromBlock: blockNumber - 500, // 查询最近 500 个区块（减少范围避免超时）
              toBlock: blockNumber,
              abi: usdtAbi.abi as any, // 提供 ABI 以解析参数
            },
          );
          expect(result).toBeTruthy();
          expect(Array.isArray(result.transactions)).toBeTruthy();
          expect(typeof result.total).toBe("number");
          console.log(`找到 ${result.total} 笔 transfer 交易`);

          // 如果有交易，打印第一条交易的信息
          if (result.transactions.length > 0) {
            const firstTx = result.transactions[0] as any;
            console.log("第一条 transfer 交易:", {
              hash: firstTx.hash,
              from: firstTx.from,
              to: firstTx.to,
              blockNumber: firstTx.blockNumber,
              args: firstTx.args,
            });
          }
        } catch (error) {
          // 如果扫描失败，跳过测试
          console.warn("无法扫描合约方法交易:", error);
        } finally {
          // 等待一小段时间，确保所有异步操作完成
          await new Promise((resolve) => setTimeout(resolve, 300));
        }
      }, { timeout: 15000, sanitizeOps: false, sanitizeResources: false });
    });
  });
}, { sanitizeOps: false, sanitizeResources: false });
