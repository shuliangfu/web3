# @dreamer/web3

一个用于 Deno 的 Web3 操作辅助库，提供统一的 Web3 接口，支持服务端 RPC 调用和客户端钱包交互。

## 功能

Web3 操作辅助库，提供统一的 Web3 抽象层，支持服务端 RPC 调用和客户端钱包交互。

## 特性

### 服务端 Web3（@dreamer/web3）

- **RPC 调用**：
  - 通过 RPC URL 连接区块链网络
  - 读取链信息（链 ID、区块号、网络信息）
  - 账户余额查询
  - 交易查询和状态检查
- **合约交互**：
  - 读取合约数据（只读方法）
  - 调用合约方法（需要私钥签名）
  - 合约字节码查询
  - 合约事件监听（通过 RPC）
- **区块和交易**：
  - 区块信息查询
  - 交易信息查询
  - 交易收据查询
  - Gas 估算和费用查询
- **工具函数**：
  - 单位转换（wei、ether 等）
  - 地址工具（验证、格式化、校验和）
  - 哈希工具（Keccak-256）
  - 十六进制工具
  - 合约工具（函数选择器、编码等）

### 客户端 Web3（@dreamer/web3/client）

- **钱包连接**：
  - 自动检测和连接 EIP-1193 兼容钱包（MetaMask 等）
  - 不需要设置 RPC URL，直接使用钱包提供的 RPC
  - 账户连接和断开
  - 账户列表获取
- **钱包交互**：
  - 发送交易（通过钱包签名）
  - 消息签名和验证
  - 合约交互（通过钱包签名）
  - 交易确认等待
- **事件监听**：
  - 账户变化监听
  - 链切换监听
  - 区块监听
  - 交易监听
  - 合约事件监听
- **工具函数**：
  - 与服务端相同的工具函数
  - 钱包生成（仅客户端，不推荐在生产环境使用）

## 设计原则

**所有 @dreamer/* 库都遵循以下原则**：

- **主包（@dreamer/xxx）**：用于服务端（Deno 运行时）
- **客户端子包（@dreamer/xxx/client）**：用于客户端（浏览器环境）

这样可以：
- 明确区分服务端和客户端代码
- 避免在客户端代码中引入服务端依赖
- 提供更好的类型安全和代码提示
- 支持更好的 tree-shaking

## 使用场景

### 服务端

- **RPC 调用**：查询链数据、区块信息、交易状态
- **合约读取**：读取合约状态、查询合约数据
- **数据索引**：扫描区块、索引交易、分析链上数据
- **后端服务**：提供链数据 API、合约查询服务

### 客户端

- **DApp 开发**：去中心化应用开发
- **钱包集成**：集成 MetaMask 等钱包
- **用户交互**：发送交易、签名消息、合约交互
- **实时监听**：监听账户变化、链切换、合约事件

## 优先级

⭐⭐（特定场景）

## 安装

### 服务端

```bash
deno add jsr:@dreamer/web3
```

### 客户端

```bash
deno add jsr:@dreamer/web3/client
```

## 环境兼容性

- **Deno 版本**：要求 Deno 2.5 或更高版本
- **服务端**：✅ 支持（Deno 运行时，通过 RPC URL 连接区块链网络）
- **客户端**：✅ 支持（浏览器环境，通过 `jsr:@dreamer/web3/client` 使用钱包连接，不需要 RPC URL）
- **依赖**：需要 `npm:viem@^2.43.3`

## 使用示例

### 服务端 Web3

#### 基本使用（RPC 调用）

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
const balance = await web3.getBalance("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb");
console.log("余额:", balance);
```

#### 合约交互（只读）

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
```

#### 交易查询

```typescript
import { Web3Client } from "jsr:@dreamer/web3";

const web3 = new Web3Client({
  rpcUrl: "https://eth-mainnet.g.alchemy.com/v2/YOUR_API_KEY",
});

// 获取交易信息
const tx = await web3.getTransaction("0x...");
console.log("交易信息:", tx);

// 获取交易收据
const receipt = await web3.getTransactionReceipt("0x...");
console.log("交易收据:", receipt);

// 等待交易确认
const confirmedReceipt = await web3.waitForTransaction("0x...", 3); // 等待 3 个确认
console.log("交易已确认:", confirmedReceipt);
```

#### 区块查询

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

#### 事件监听（通过 RPC）

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

### 客户端 Web3

#### 基本使用（钱包连接）

```typescript
import { Web3Client } from "jsr:@dreamer/web3/client";

// 创建 Web3Client 实例（不需要 RPC URL，直接使用钱包）
const web3 = new Web3Client();

// 连接钱包（自动检测 MetaMask 等钱包）
const accounts = await web3.connectWallet();
console.log("已连接账户:", accounts);

// 获取当前账户
const currentAccounts = await web3.getAccounts();
console.log("当前账户:", currentAccounts);

// 获取链信息（使用钱包提供的 RPC）
const chainId = await web3.getChainId();
console.log("链 ID:", chainId);
```

#### 发送交易（通过钱包）

```typescript
import { Web3Client } from "jsr:@dreamer/web3/client";

const web3 = new Web3Client();

// 先连接钱包
await web3.connectWallet();

// 发送 ETH（通过钱包签名）
const txHash = await web3.sendTransaction({
  to: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  value: "1000000000000000000", // 1 ETH
});

console.log("交易哈希:", txHash);

// 等待交易确认
const receipt = await web3.waitForTransaction(txHash, 1);
console.log("交易已确认:", receipt);
```

#### 合约交互（通过钱包）

```typescript
import { Web3Client } from "jsr:@dreamer/web3/client";

const web3 = new Web3Client();

// 先连接钱包
await web3.connectWallet();

// 读取合约数据（只读方法，不需要签名）
const result = await web3.readContract({
  address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", // USDC 合约
  abi: [...],
  functionName: "balanceOf",
  args: ["0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"],
});

console.log("余额:", result);

// 调用合约方法（写入操作，需要钱包签名）
const receipt = await web3.callContract({
  address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
  abi: [...],
  functionName: "transfer",
  args: ["0x...", "1000000"], // 转账地址和金额
}, true); // 等待确认

console.log("交易收据:", receipt);
```

#### 消息签名

```typescript
import { Web3Client } from "jsr:@dreamer/web3/client";

const web3 = new Web3Client();

// 先连接钱包
await web3.connectWallet();

// 签名消息
const message = "Hello, Web3!";
const signature = await web3.signMessage(message);
console.log("签名:", signature);

// 验证签名
const accounts = await web3.getAccounts();
const isValid = await web3.verifyMessage(message, signature, accounts[0]);
console.log("签名有效:", isValid);
```

#### 事件监听

```typescript
import { Web3Client } from "jsr:@dreamer/web3/client";

const web3 = new Web3Client();

// 监听账户变化
web3.onAccountsChanged((accounts) => {
  console.log("账户变化:", accounts);
  if (accounts.length === 0) {
    console.log("钱包已断开");
  }
});

// 监听链切换
web3.onChainChanged((chainId) => {
  console.log("链切换:", chainId);
  // 可以在这里更新 UI
});

// 监听新区块
web3.onBlock((blockNumber, block) => {
  console.log("新区块:", blockNumber);
});

// 监听合约事件
const unsubscribe = web3.onContractEvent(
  "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
  "Transfer",
  (event) => {
    console.log("Transfer 事件:", event);
  }
);

// 取消监听
unsubscribe();
```

### 工具函数（服务端和客户端通用）

#### 单位转换

```typescript
import { fromWei, toWei } from "jsr:@dreamer/web3/mod";
// 或客户端
// import { fromWei, toWei } from "jsr:@dreamer/web3/client";

// 从 wei 转换为 ether
const eth = fromWei("1000000000000000000", "ether"); // "1.0"

// 从 ether 转换为 wei
const wei = toWei("1", "ether"); // "1000000000000000000"
```

#### 地址工具

```typescript
import {
  isAddress,
  toChecksumAddress,
  formatAddress,
  shortenAddress,
} from "jsr:@dreamer/web3/mod";

// 验证地址
if (isAddress("0x742d35cc6634c0532925a3b844bc9e7595f0beb")) {
  // 转换为校验和地址
  const checksum = toChecksumAddress("0x742d35cc6634c0532925a3b844bc9e7595f0beb");
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
  ["0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb", "1000000"]
);
```

#### 合约工具

```typescript
import {
  getFunctionSelector,
  encodeFunctionCall,
  computeContractAddress,
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
  0 // nonce
);
```

## API 文档

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
- `callContract(options, waitForConfirmation?)`: 调用合约方法（需要私钥，服务端使用）
- `getCode(address)`: 获取合约字节码
- `isContract(address)`: 检查地址是否为合约
- `getAddressTransactions(address, fromBlock?, toBlock?)`: 获取地址相关的交易
- `scanContractMethodTransactions(...)`: 扫描合约方法调用交易

#### 事件监听方法

- `onBlock(callback)`: 监听新区块（通过轮询），返回取消监听的函数
- `offBlock()`: 停止所有区块监听
- `onTransaction(callback)`: 监听新交易（通过轮询），返回取消监听的函数
- `offTransaction()`: 停止所有交易监听
- `onContractEvent(contractAddress, eventName, callback, options?)`: 监听合约事件（通过 RPC 轮询），返回取消监听的函数
- `offContractEvent(contractAddress, eventName?)`: 停止合约事件监听

### 客户端 Web3Client 类

#### 钱包方法

- `connectWallet()`: 连接钱包，返回账户地址数组（不需要 RPC URL）
- `getAccounts()`: 获取当前连接的账户地址数组
- `disconnectWallet()`: 断开钱包连接

#### 账户和余额方法

- `getBalance(address)`: 获取账户余额（wei，字符串格式）
- `getBalances(addresses)`: 批量获取多个账户余额
- `getTransactionCount(address)`: 获取账户交易计数（nonce）

#### 网络和链信息方法

- `getChainId()`: 获取当前链 ID（使用钱包提供的 RPC）
- `getNetwork()`: 获取网络信息（chainId 和 name）
- `getBlockNumber()`: 获取当前区块号

#### 交易方法

- `sendTransaction(options)`: 发送交易（通过钱包签名），返回交易哈希
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
- `callContract(options, waitForConfirmation?)`: 调用合约方法（通过钱包签名），返回交易收据
- `getCode(address)`: 获取合约字节码
- `isContract(address)`: 检查地址是否为合约

#### 消息签名方法

- `signMessage(message)`: 签名消息，返回签名
- `verifyMessage(message, signature, address)`: 验证消息签名

#### 事件监听方法

- `onBlock(callback)`: 监听新区块，返回取消监听的函数
- `offBlock()`: 停止所有区块监听
- `onTransaction(callback)`: 监听新交易，返回取消监听的函数
- `offTransaction()`: 停止所有交易监听
- `onContractEvent(contractAddress, eventName, callback, options?)`: 监听合约事件，返回取消监听的函数
- `offContractEvent(contractAddress, eventName?)`: 停止合约事件监听
- `onAccountsChanged(callback)`: 监听账户变化，返回取消监听的函数
- `offAccountsChanged()`: 停止账户变化监听
- `onChainChanged(callback)`: 监听链切换，返回取消监听的函数
- `offChainChanged()`: 停止链切换监听

### 工具函数（服务端和客户端通用）

工具函数在服务端和客户端都可以使用，导入路径不同：

```typescript
// 服务端
import { fromWei, toWei, isAddress } from "jsr:@dreamer/web3/mod";

// 客户端
import { fromWei, toWei, isAddress } from "jsr:@dreamer/web3/client";
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

#### 钱包工具

- `generateWallet()`: 生成新的钱包地址和私钥（仅客户端，不推荐在生产环境使用）
- `isPrivateKey(privateKey)`: 验证私钥格式
- `isTxHash(txHash)`: 验证交易哈希格式

#### 合约工具

- `getCode(address, rpcUrl?)`: 获取合约代码（服务端需要 rpcUrl，客户端不需要）
- `computeContractAddress(deployerAddress, nonce)`: 计算合约地址（CREATE）
- `getFunctionSelector(functionSignature)`: 获取函数选择器
- `encodeFunctionCall(functionSignature, args)`: 编码函数调用数据

## 服务端和客户端对比

| 功能 | 服务端（@dreamer/web3） | 客户端（@dreamer/web3/client） |
|------|----------------------|-------------------------------|
| **RPC URL** | ✅ 必须设置 | ❌ 不需要（使用钱包提供的 RPC） |
| **钱包连接** | ❌ 不支持 | ✅ 支持（自动检测和连接） |
| **发送交易** | ✅ 支持（需要私钥） | ✅ 支持（通过钱包签名） |
| **消息签名** | ❌ 不支持 | ✅ 支持（通过钱包签名） |
| **合约读取** | ✅ 支持 | ✅ 支持 |
| **合约调用** | ✅ 支持（需要私钥） | ✅ 支持（通过钱包签名） |
| **事件监听** | ✅ 支持（通过 RPC 轮询） | ✅ 支持（实时监听） |
| **账户变化监听** | ❌ 不支持 | ✅ 支持 |
| **链切换监听** | ❌ 不支持 | ✅ 支持 |

## 状态

🚧 **开发中**

## 备注

- **服务端和客户端分离**：通过 `/client` 子路径明确区分服务端和客户端代码
- **服务端**：专注于 RPC 调用、合约读取、数据查询，不需要钱包连接
- **客户端**：专注于钱包交互、用户操作，不需要设置 RPC URL
- **统一工具函数**：服务端和客户端都提供相同的工具函数
- **类型安全**：完整的 TypeScript 类型支持
- **依赖**：需要 `npm:viem@^2.43.3`
