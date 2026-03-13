# @dreamer/web3

> 服务端 Web3 操作辅助包，兼容 Deno 和 Bun 运行时，支持 RPC 调用和合约交互

[English](../../README.md) | 中文 (Chinese)

[![JSR](https://jsr.io/badges/@dreamer/web3)](https://jsr.io/@dreamer/web3)
[![License: Apache-2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](../../LICENSE)
[![Tests](https://img.shields.io/badge/tests-139%20passed-brightgreen)](../en-US/TEST_REPORT.md)

---

## 🎯 功能

服务端 Web3 操作辅助包，提供统一的 Web3 抽象层，支持 RPC 调用和合约交互。

---

## 📦 安装

### Deno

```bash
deno add jsr:@dreamer/web3
```

### Bun

```bash
bunx jsr add @dreamer/web3
```

---

## 🌍 环境兼容性

| 环境       | 版本要求 | 状态                                                                |
| ---------- | -------- | ------------------------------------------------------------------- |
| **Deno**   | 2.6+     | ✅ 完全支持                                                         |
| **Bun**    | 1.3.5+   | ✅ 完全支持                                                         |
| **服务端** | -        | ✅ 支持（兼容 Deno 和 Bun 运行时，通过 RPC URL 连接区块链网络）     |
| **客户端** | -        | ✅ 支持（浏览器环境，通过 `jsr:@dreamer/web3/client` 使用钱包连接） |
| **依赖**   | -        | 📦 需要 `npm:viem@^2.43.3`                                          |

---

## ✨ 特性

- **RPC 调用**：
  - 通过 RPC URL 连接区块链网络
  - 读取链信息（链 ID、区块号、网络信息）
  - 账户余额查询
  - 交易查询和状态检查
- **合约交互**：
  - 读取合约数据（只读方法）
  - 读取合约公有属性（便捷方法 `readProperty`）
  - 多返回值自动转换为命名对象（`returnJson` 默认 true）
  - 调用合约方法（需要私钥签名）
  - 合约字节码查询
  - 合约事件监听（通过 RPC）
  - 合约代理功能（通过 `web3.contracts.合约名称` 访问）
- **区块和交易**：
  - 区块信息查询
  - 交易信息查询
  - 交易收据查询
  - Gas 估算和费用查询
- **消息签名和验证**：
  - 使用私钥签名消息
  - 验证消息签名
- **工具函数**：
  - 单位转换（wei、ether 等）
  - 地址工具（验证、格式化、校验和）
  - 哈希工具（Keccak-256）
  - 十六进制工具
  - 合约工具（函数选择器、编码等）
- **服务容器集成**：
  - 支持 `@dreamer/service` 依赖注入
  - Web3Manager 管理多个 Web3 客户端
  - 提供 `createWeb3Manager` 工厂函数

---

## 🎯 使用场景

- **RPC 调用**：查询链数据、区块信息、交易状态
- **合约读取**：读取合约状态、查询合约数据
- **数据索引**：扫描区块、索引交易、分析链上数据
- **后端服务**：提供链数据 API、合约查询服务

---

## 🚀 快速开始

### 基本使用（RPC 调用）

```typescript
import { Web3Client } from "jsr:@dreamer/web3";

// 创建 Web3Client 实例（需要 RPC URL）
const web3 = new Web3Client({
  rpcUrl: "https://eth-mainnet.g.alchemy.com/v2/YOUR_API_KEY",
});

// 获取链信息
const chainId = await web3.getChainId();
console.log("链 ID:", chainId);

const blockNumber = await web3.getBlockNumber();
console.log("当前区块号:", blockNumber);

// 获取账户余额
const balance = await web3.getBalance(
  "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
);
console.log("余额:", balance);
```

### 合约交互（只读）

```typescript
import { Web3Client } from "jsr:@dreamer/web3";

const web3 = new Web3Client({
  rpcUrl: "https://eth-mainnet.g.alchemy.com/v2/YOUR_API_KEY",
});

// 读取合约数据（只读方法，不需要签名）
const result = await web3.readContract({
  address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", // USDC 合约
  abi: [
    {
      name: "totalSupply",
      type: "function",
      stateMutability: "view",
      inputs: [],
      outputs: [{ type: "uint256" }],
    },
  ],
  functionName: "totalSupply",
});

console.log("总供应量:", result);

// 多返回值自动转换为命名对象（returnJson 默认为 true）
// 例如：function getInfo() returns (string name, uint256 value, address owner)
const info = await web3.readContract({
  address: "0x...",
  abi: [
    {
      name: "getInfo",
      type: "function",
      stateMutability: "view",
      inputs: [],
      outputs: [
        { name: "name", type: "string" },
        { name: "value", type: "uint256" },
        { name: "owner", type: "address" },
      ],
    },
  ],
  functionName: "getInfo",
});
// 返回: { name: "...", value: 123n, owner: "0x..." }

// 如需返回数组格式，设置 returnJson: false
const infoArray = await web3.readContract({
  // ...同上配置
  returnJson: false,
});
// 返回: ["...", 123n, "0x..."]
```

### 合约代理功能

```typescript
import { Web3Client } from "jsr:@dreamer/web3";

// 配置合约
const usdtContract = {
  name: "USDT",
  address: "0xe52de483b5B089B4CBF01c2749Dfbf4Fa66CBda6",
  abi: [/* ABI 数组 */],
};

const web3 = new Web3Client({
  rpcUrl: "https://eth-mainnet.g.alchemy.com/v2/YOUR_API_KEY",
  contracts: usdtContract, // 单个合约
  // 或 contracts: [usdtContract, nodeContract], // 多个合约
});

// 通过合约名称访问
const balance = await web3.contracts.USDT.readContract("balanceOf", ["0x..."]);
await web3.contracts.USDT.callContract("transfer", ["0x...", "1000000"]);

// 读取合约公有属性（便捷方法）
// Solidity 的公有状态变量会自动生成 getter 函数
// 例如：uint256 public totalSupply; 会自动生成 function totalSupply() view returns (uint256)
const totalSupply = await web3.contracts.USDT.readProperty("totalSupply");
console.log("总供应量:", totalSupply);

// readProperty 等价于 readContract，但更简洁
const decimals1 = await web3.contracts.USDT.readProperty("decimals");
const decimals2 = await web3.contracts.USDT.readContract("decimals");
// decimals1 === decimals2
```

### 交易查询

```typescript
import { Web3Client } from "jsr:@dreamer/web3";

const web3 = new Web3Client({
  rpcUrl: "https://eth-mainnet.g.alchemy.com/v2/YOUR_API_KEY",
});

// 获取交易信息
const tx = await web3.getTransaction("0x...");
console.log("交易信息:", tx);

// 获取交易收据（返回 ExtendedTransactionReceipt，包含 success 字段）
const receipt = await web3.getTransactionReceipt("0x...");
if (receipt.success) {
  console.log("交易成功:", receipt);
} else {
  console.log("交易失败:", receipt.error, receipt.message);
}

// 等待交易确认
const confirmedReceipt = await web3.waitForTransaction("0x...", 3); // 等待 3 个确认
console.log("交易已确认:", confirmedReceipt);
```

### 区块查询

```typescript
import { Web3Client } from "jsr:@dreamer/web3";

const web3 = new Web3Client({
  rpcUrl: "https://eth-mainnet.g.alchemy.com/v2/YOUR_API_KEY",
});

// 获取最新区块
const latestBlock = await web3.getBlock();
console.log("最新区块:", latestBlock);

// 获取指定区块
const block = await web3.getBlock(1000000);
console.log("区块信息:", block);

// 获取区块中的交易
const transactions = await web3.getBlockTransactions(1000000, true);
console.log("区块交易:", transactions);
```

### 事件监听（通过 RPC）

```typescript
import { Web3Client } from "jsr:@dreamer/web3";

const web3 = new Web3Client({
  rpcUrl: "https://eth-mainnet.g.alchemy.com/v2/YOUR_API_KEY",
});

// 监听新区块（通过轮询）
const unsubscribe = web3.onBlock((blockNumber, block) => {
  console.log("新区块:", blockNumber);
});

// 监听合约事件（通过 RPC 轮询）
const unsubscribeEvent = web3.onContractEvent(
  "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", // USDC 合约
  "Transfer", // 事件名称
  (event) => {
    console.log("Transfer 事件:", event);
  },
  {
    fromBlock: "latest", // 从最新区块开始
    abi: [...], // 合约 ABI
  }
);

// 取消监听
unsubscribe();
unsubscribeEvent();
```

### 消息签名和验证

```typescript
import { Web3Client } from "jsr:@dreamer/web3";

const web3 = new Web3Client({
  rpcUrl: "https://eth-mainnet.g.alchemy.com/v2/YOUR_API_KEY",
  privateKey: "0x...", // 可选，也可以在调用时传入
});

// 签名消息（使用配置中的 privateKey）
const message = "Hello, Web3!";
const signature = await web3.signMessage(message);

// 或使用参数传入私钥
const signature2 = await web3.signMessage(message, "0x...");

// 验证签名
const address = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb";
const isValid = await web3.verifyMessage(message, signature, address);
console.log("签名有效:", isValid);
```

### 工具函数

#### 单位转换

```typescript
import { fromWei, toWei } from "jsr:@dreamer/web3/mod";

// 从 wei 转换为 ether
const eth = fromWei("1000000000000000000", "ether"); // "1.0"

// 从 ether 转换为 wei
const wei = toWei("1", "ether"); // "1000000000000000000"
```

#### 地址工具

```typescript
import {
  formatAddress,
  isAddress,
  shortenAddress,
  toChecksumAddress,
} from "jsr:@dreamer/web3/mod";

// 验证地址
if (isAddress("0x742d35cc6634c0532925a3b844bc9e7595f0beb")) {
  // 转换为校验和地址
  const checksum = toChecksumAddress(
    "0x742d35cc6634c0532925a3b844bc9e7595f0beb",
  );
  // "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"

  // 格式化地址
  const formatted = formatAddress("0x742d35cc6634c0532925a3b844bc9e7595f0beb");

  // 缩短地址（用于 UI 显示）
  const short = shortenAddress("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb");
  // "0x742d...0bEb"
}
```

#### 哈希工具

```typescript
import { keccak256, solidityKeccak256 } from "jsr:@dreamer/web3/mod";

// Keccak-256 哈希
const hash = keccak256("Hello, Web3!");
console.log(hash);

// Solidity Keccak-256 哈希（处理 ABI 编码）
const solidityHash = solidityKeccak256(
  ["address", "uint256"],
  ["0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb", "1000000"],
);
```

#### 合约工具

```typescript
import {
  computeContractAddress,
  encodeFunctionCall,
  getFunctionSelector,
} from "jsr:@dreamer/web3/mod";

// 获取函数选择器
const selector = getFunctionSelector("transfer(address,uint256)");
console.log(selector); // "0xa9059cbb"

// 编码函数调用
const data = encodeFunctionCall("transfer(address,uint256)", [
  "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  "1000000",
]);

// 计算合约地址（CREATE）
const contractAddress = computeContractAddress(
  "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  0, // nonce
);
```

---

## 📚 API 文档

### 服务端 Web3Client 类

#### 配置方法

- `getConfig()`: 获取当前配置
- `updateConfig(config)`: 更新配置（包括 RPC URL）

#### 网络和链信息方法

- `getChainId()`: 获取当前链 ID
- `getNetwork()`: 获取网络信息（chainId 和 name）
- `getBlockNumber()`: 获取当前区块号

#### 账户和余额方法

- `getBalance(address)`: 获取账户余额（wei，字符串格式）
- `getBalances(addresses)`: 批量获取多个账户余额
- `getTransactionCount(address)`: 获取账户交易计数（nonce）

#### 交易方法

- `sendTransaction(options)`: 发送交易（需要私钥，服务端使用）
- `waitForTransaction(txHash, confirmations?)`: 等待交易确认，返回交易收据
- `getTransaction(txHash)`: 获取交易信息
- `getTransactionReceipt(txHash)`: 获取交易收据
- `estimateGas(options)`: 估算交易 gas 消耗
- `getGasPrice()`: 获取当前 gas 价格
- `getGasLimit(blockNumber?)`: 获取区块 gas 限制
- `getFeeData()`: 获取费用数据（gasPrice 和 maxFeePerGas）

#### 区块方法

- `getBlock(blockNumber?)`: 获取区块信息
- `getBlockTransactions(blockNumber, includeTransactions?)`: 获取区块中的交易

#### 合约方法

- `readContract(options)`: 读取合约数据（只读方法）
- `callContract(options, waitForConfirmation?)`:
  调用合约方法（需要私钥，服务端使用）
- `getCode(address)`: 获取合约字节码
- `isContract(address)`: 检查地址是否为合约
- `getAddressTransactions(address, fromBlock?, toBlock?)`: 获取地址相关的交易
- `scanContractMethodTransactions(...)`: 扫描合约方法调用交易

#### 合约代理

- `contracts[合约名称]`: 通过合约名称访问合约代理
  - `readContract(functionName, args?)`: 读取合约数据
  - `readProperty(propertyName)`: 读取合约公有属性（便捷方法，等价于调用无参数的
    getter 函数）
  - `callContract(functionName, args?, waitForConfirmation?)`: 调用合约方法
  - `address`: 获取合约地址
  - `abi`: 获取合约 ABI
  - `name`: 获取合约名称

#### 消息签名方法

- `signMessage(message, privateKey?)`: 签名消息（使用私钥），返回签名
- `verifyMessage(message, signature, address)`: 验证消息签名

#### 事件监听方法

- `onBlock(callback)`: 监听新区块（通过轮询），返回取消监听的函数
- `offBlock()`: 停止所有区块监听
- `onTransaction(callback)`: 监听新交易（通过轮询），返回取消监听的函数
- `offTransaction()`: 停止所有交易监听
- `onContractEvent(contractAddress, eventName, callback, options?)`:
  监听合约事件（通过 RPC 轮询），返回取消监听的函数
- `offContractEvent(contractAddress, eventName?)`: 停止合约事件监听

### 工具函数

工具函数在服务端可以使用，导入路径：

```typescript
import { fromWei, isAddress, toWei } from "jsr:@dreamer/web3/mod";
```

#### 单位转换

- `fromWei(value, unit?)`: 从 wei 转换为其他单位（默认 ether）
- `toWei(value, unit?)`: 转换为 wei（默认从 ether）

#### 地址工具

- `isAddress(address)`: 验证以太坊地址格式
- `checkAddressChecksum(address)`: 验证地址校验和（EIP-55）
- `toChecksumAddress(address)`: 转换为校验和地址（EIP-55）
- `formatAddress(address)`: 格式化地址（添加 0x 前缀，转换为校验和）
- `shortenAddress(address, startLength?, endLength?)`: 缩短地址显示（用于 UI）

#### 哈希工具

- `keccak256(data)`: Keccak-256 哈希
- `solidityKeccak256(types, values)`: Solidity Keccak-256 哈希（处理 ABI 编码）

#### 十六进制工具

- `hexToBytes(hex)`: 十六进制字符串转字节数组
- `bytesToHex(bytes)`: 字节数组转十六进制字符串
- `hexToNumber(hex)`: 十六进制字符串转数字
- `numberToHex(value)`: 数字转十六进制字符串
- `stripHexPrefix(hex)`: 移除 0x 前缀
- `addHexPrefix(hex)`: 添加 0x 前缀
- `padLeft(value, length, padChar?)`: 左填充
- `padRight(value, length, padChar?)`: 右填充

#### 合约工具

- `getCode(address, rpcUrl?)`: 获取合约代码（服务端需要 rpcUrl）
- `computeContractAddress(deployerAddress, nonce)`: 计算合约地址（CREATE）
- `getFunctionSelector(functionSignature)`: 获取函数选择器
- `encodeFunctionCall(functionSignature, args)`: 编码函数调用数据

---

## 📊 测试报告

本包经过全面测试，所有 138 个测试用例均已通过，测试覆盖率达到
100%。详细测试报告请查看 [TEST_REPORT.md](../en-US/TEST_REPORT.md)。

| 项目         | 详情   |
| ------------ | ------ |
| **总测试数** | 138    |
| **通过**     | 138 ✅ |
| **失败**     | 0      |
| **通过率**   | 100%   |

| 测试模块                   | 测试数量 | 状态    |
| -------------------------- | -------- | ------- |
| Web3Client                 | 61       | ✅ 完成 |
| Web3Manager                | 11       | ✅ 完成 |
| ServiceContainer 集成      | 4        | ✅ 完成 |
| createWeb3Manager 工厂函数 | 5        | ✅ 完成 |
| 客户端测试                 | 27       | ✅ 完成 |
| 工具函数测试               | 30       | ✅ 完成 |

查看完整测试报告：[TEST_REPORT.md](../en-US/TEST_REPORT.md)

---

## 🔗 ServiceContainer 集成

### 使用 createWeb3Manager 工厂函数

```typescript
import { ServiceContainer } from "@dreamer/service";
import { createWeb3Manager, Web3Manager } from "@dreamer/web3";

// 创建服务容器
const container = new ServiceContainer();

// 注册 Web3Manager
container.registerSingleton(
  "web3:main",
  () => createWeb3Manager({ name: "main" }),
);

// 获取 Web3Manager
const manager = container.get<Web3Manager>("web3:main");

// 注册多链配置
manager.registerClient("ethereum", {
  rpcUrl: "https://eth-mainnet.g.alchemy.com/v2/YOUR_API_KEY",
  chainId: 1,
});

manager.registerClient("polygon", {
  rpcUrl: "https://polygon-mainnet.g.alchemy.com/v2/YOUR_API_KEY",
  chainId: 137,
});

// 获取客户端并使用
const ethClient = manager.getClient("ethereum");
const balance = await ethClient.getBalance("0x...");
```

### Web3Manager API

| 方法                              | 说明                   |
| --------------------------------- | ---------------------- |
| `getName()`                       | 获取管理器名称         |
| `setContainer(container)`         | 设置服务容器           |
| `getContainer()`                  | 获取服务容器           |
| `fromContainer(container, name?)` | 从服务容器获取实例     |
| `registerClient(name, config)`    | 注册 Web3 客户端配置   |
| `getClient(name)`                 | 获取或创建 Web3 客户端 |
| `hasClient(name)`                 | 检查客户端是否存在     |
| `removeClient(name)`              | 移除客户端             |
| `getClientNames()`                | 获取所有客户端名称     |
| `close()`                         | 关闭所有客户端         |

---

## 🌐 客户端支持（浏览器）

- **入口**：`jsr:@dreamer/web3/client` — TypeScript 源码入口，在应用内自行打包
  （Vite、esbuild 等）以获得类型检查与 tree-shaking。

---

## 📝 注意事项

- **服务端和客户端分离**：通过 `/client` 子路径明确区分服务端和客户端代码
- **统一接口**：服务端和客户端使用相似的 API 接口，降低学习成本
- **RPC 连接**：服务端必须配置 RPC URL 才能使用
- **合约代理**：支持通过 `web3.contracts.合约名称` 访问合约
- **消息签名**：支持使用私钥签名和验证消息
- **类型安全**：完整的 TypeScript 类型支持
- **依赖**：需要 `npm:viem@^2.43.3`

---

## 变更日志

**v1.1.1**（2026-03-14）：**变更** – ContractConfig 字段 `name` 更名为
`contractName`（客户端与服务端）。详见 [CHANGELOG.md](./CHANGELOG.md)。

---

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

---

## 📄 许可证

Apache License 2.0 - 详见 [LICENSE](../../LICENSE)

---

<div align="center">

**Made with ❤️ by Dreamer Team**

</div>
