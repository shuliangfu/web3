# @dreamer/web3

一个用于 Deno 的 Web3 操作辅助库，提供钱包连接、合约交互、交易处理等功能。

## 特性

- 🔗 **钱包连接**：支持 MetaMask 等 EIP-1193 兼容的钱包
- 📝 **合约交互**：简化智能合约的调用和交互
- 💸 **交易处理**：便捷的交易发送和状态监听
- 🌐 **多链支持**：支持以太坊及兼容链
- 🔒 **类型安全**：完整的 TypeScript 类型支持
- 🚀 **现代 API**：基于 EIP-1193 标准，使用 viem 库

## 安装

```bash
deno add npm:viem@^2.43.3
```

或者直接在代码中导入：

```typescript
import { Web3Client, createWeb3Client } from "jsr:@dreamer/web3/mod";
```

## 环境兼容性

- **Deno 版本**：要求 Deno 2.5 或更高版本
- **服务端**：✅ 支持（Deno 运行时）
- **客户端**：✅ 支持（浏览器环境，需要支持 EIP-1193 的钱包）
- **依赖**：需要 `npm:viem@^2.43.3`

## 使用方法

### 基本使用

```typescript
import { Web3Client, createWeb3Client } from "jsr:@dreamer/web3/mod";

// 创建 Web3Client 实例
const web3 = new Web3Client();
// 或使用便捷函数
const web32 = createWeb3Client();

// 连接钱包（仅在客户端环境）
if (typeof window !== "undefined") {
  const accounts = await web3.connectWallet();
  console.log("已连接账户:", accounts);
}
```

### 读取链信息

```typescript
// 获取当前链 ID
const chainId = await web3.getChainId();

// 获取当前账户
const accounts = await web3.getAccounts();
const account = accounts[0];

// 获取账户余额
const balance = await web3.getBalance(account);
```

### 发送交易

```typescript
// 发送 ETH
const txHash = await web3.sendTransaction({
  to: "0x...",
  value: "1000000000000000000", // 1 ETH
});
```

### 合约交互

```typescript
// 读取合约数据（只读方法）
const result = await web3.readContract({
  address: "0x...",
  abi: [...],
  functionName: "myFunction",
  args: [...],
});

// 调用合约方法（写入操作）
const receipt = await web3.callContract({
  address: "0x...",
  abi: [...],
  functionName: "myFunction",
  args: [...],
});
```

### 事件监听

```typescript
// 监听新区块
web3.onBlock((blockNumber, block) => {
  console.log("新区块:", blockNumber);
});

// 监听账户变化
web3.onAccountsChanged((accounts) => {
  console.log("账户变化:", accounts);
});

// 监听链切换
web3.onChainChanged((chainId) => {
  console.log("链切换:", chainId);
});

// 监听合约事件
const unsubscribe = web3.onContractEvent(
  "0x...", // 合约地址
  "Transfer", // 事件名称
  (event) => {
    console.log("合约事件:", event);
  },
  {
    fromBlock: 1000000, // 可选：从指定区块开始扫描
    abi: [...], // 可选：合约 ABI
  }
);
// 取消监听
unsubscribe();
```

## API 文档

### Web3Client 类

主要的辅助类，提供所有 Web3 相关功能。

#### 配置方法

- `getConfig()`: 获取当前配置
- `updateConfig(config)`: 更新配置
- `setReconnectConfig(delay?, maxAttempts?)`: 设置重连配置

#### 钱包方法

- `connectWallet()`: 连接钱包，返回账户地址数组
- `getAccounts()`: 获取当前连接的账户地址数组

#### 账户和余额方法

- `getBalance(address)`: 获取账户余额（wei，字符串格式）
- `getBalances(addresses)`: 批量获取多个账户余额
- `getTransactionCount(address)`: 获取账户交易计数（nonce）

#### 网络和链信息方法

- `getChainId()`: 获取当前链 ID
- `getNetwork()`: 获取网络信息（chainId 和 name）
- `getBlockNumber()`: 获取当前区块号

#### 交易方法

- `sendTransaction(options)`: 发送交易，返回交易哈希
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
- `callContract(options, waitForConfirmation?)`: 调用合约方法（写入操作）
- `getCode(address)`: 获取合约字节码
- `isContract(address)`: 检查地址是否为合约
- `getAddressTransactions(address, fromBlock?, toBlock?)`: 获取地址相关的交易
- `scanContractMethodTransactions(...)`: 扫描合约方法调用交易

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

### 工具函数

除了 `Web3Client` 类，库还提供了许多实用的工具函数：

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

- `generateWallet()`: 生成新的钱包地址和私钥
- `isPrivateKey(privateKey)`: 验证私钥格式
- `isTxHash(txHash)`: 验证交易哈希格式

#### 合约工具

- `getCode(address, rpcUrl?)`: 获取合约代码
- `computeContractAddress(deployerAddress, nonce)`: 计算合约地址（CREATE）
- `getFunctionSelector(functionSignature)`: 获取函数选择器
- `encodeFunctionCall(functionSignature, args)`: 编码函数调用数据

#### 使用示例

```typescript
import {
  fromWei,
  toWei,
  isAddress,
  toChecksumAddress,
  generateWallet,
  getFunctionSelector,
} from "jsr:@dreamer/web3/mod";

// 单位转换
const eth = fromWei("1000000000000000000", "ether"); // "1.0"
const wei = toWei("1", "ether"); // "1000000000000000000"

// 地址验证和格式化
if (isAddress("0x742d35cc6634c0532925a3b844bc9e7595f0beb")) {
  const checksum = toChecksumAddress("0x742d35cc6634c0532925a3b844bc9e7595f0beb");
  // "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
}

// 生成钱包
const wallet = generateWallet();
console.log(wallet.address, wallet.privateKey);

// 获取函数选择器
const selector = getFunctionSelector("transfer(address,uint256)");
// "0xa9059cbb"
```

## 环境要求

- **客户端**：大部分功能需要在浏览器环境使用（需要钱包扩展如 MetaMask）
- **服务端**：部分功能（如 RPC 调用、合约交互）可以在服务端使用
- **注意**：钱包连接、签名等功能只能在客户端使用

## 依赖

- [viem](https://viem.sh/) - 以太坊工具库

## 许可证

MIT License - 详见 [LICENSE.md](./LICENSE.md)

## 版本

当前版本：[![JSR](https://jsr.io/badges/@dreamer/web3)](https://jsr.io/@dreamer/web3)

## 贡献

欢迎提交 Issue 和 Pull Request！
