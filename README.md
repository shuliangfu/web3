# @dreamer/web3

> Server-side Web3 helper for Deno and Bun: RPC calls and contract interaction

English | [中文 (Chinese)](./docs/zh-CN/README.md)

[![JSR](https://jsr.io/badges/@dreamer/web3)](https://jsr.io/@dreamer/web3)
[![License: Apache-2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](./LICENSE)
[![Tests](https://img.shields.io/badge/tests-139%20passed-brightgreen)](./docs/zh-CN/TEST_REPORT.md)

---

## Features

Server-side Web3 abstraction: RPC calls, contract read/write, and utilities for
Deno and Bun.

---

## Installation

### Deno

```bash
deno add jsr:@dreamer/web3
```

### Bun

```bash
bunx jsr add @dreamer/web3
```

---

## Compatibility

| Environment    | Version | Status                                                        |
| -------------- | ------- | ------------------------------------------------------------- |
| **Deno**       | 2.6+    | ✅ Supported                                                  |
| **Bun**        | 1.3.5+  | ✅ Supported                                                  |
| **Server**     | -       | ✅ RPC via URL (Deno/Bun)                                     |
| **Client**     | -       | ✅ Browser via `jsr:@dreamer/web3/client` (wallet connection) |
| **Dependency** | -       | 📦 Requires `npm:viem@^2.43.3`                                |

---

## Capabilities

- **RPC**:
  - Connect via RPC URL
  - Chain ID, block number, network info
  - Account balance and transaction queries
- **Contracts**:
  - Read contract data (view/pure)
  - Read public state via `readProperty`
  - Multi-return values as named object (`returnJson` default true)
  - Call contract methods (private key required on server)
  - Contract bytecode and event listening (RPC)
  - Contract proxy: `web3.contracts.<name>`
- **Blocks & transactions**:
  - Block and transaction queries, receipts
  - Gas estimation and fee data
- **Signing**:
  - Sign and verify messages with private key
- **Utilities**:
  - Units (wei, ether, etc.), address (validate, format, checksum)
  - Keccak-256, hex, function selector and encoding
- **Service integration**:
  - `@dreamer/service` DI; Web3Manager and `createWeb3Manager`

---

## Use cases

- **RPC**: Chain data, blocks, transaction status
- **Contract read**: State and data queries
- **Indexing**: Block scan, transaction indexing, on-chain analysis
- **Backend**: Chain data API, contract query services

---

## Quick start

### Basic RPC

```typescript
import { Web3Client } from "jsr:@dreamer/web3";

const web3 = new Web3Client({
  rpcUrl: "https://eth-mainnet.g.alchemy.com/v2/YOUR_API_KEY",
});

const chainId = await web3.getChainId();
console.log("Chain ID:", chainId);

const blockNumber = await web3.getBlockNumber();
console.log("Block number:", blockNumber);

const balance = await web3.getBalance(
  "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
);
console.log("Balance:", balance);
```

### Read contract

```typescript
import { Web3Client } from "jsr:@dreamer/web3";

const web3 = new Web3Client({
  rpcUrl: "https://eth-mainnet.g.alchemy.com/v2/YOUR_API_KEY",
});

const result = await web3.readContract({
  address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", // USDC
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

console.log("Total supply:", result);

// Multiple return values as named object (returnJson default true)
// e.g. getInfo() returns (string name, uint256 value, address owner)
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
// Returns: { name: "...", value: 123n, owner: "0x..." }

// Array format: returnJson: false
const infoArray = await web3.readContract({
  // ...same config
  returnJson: false,
});
// Returns: ["...", 123n, "0x..."]
```

### Contract proxy

```typescript
import { Web3Client } from "jsr:@dreamer/web3";

const usdtContract = {
  name: "USDT",
  address: "0xe52de483b5B089B4CBF01c2749Dfbf4Fa66CBda6",
  abi: [/* ABI array */],
};

const web3 = new Web3Client({
  rpcUrl: "https://eth-mainnet.g.alchemy.com/v2/YOUR_API_KEY",
  contracts: usdtContract, // or contracts: [usdtContract, other]
});

const balance = await web3.contracts.USDT.readContract("balanceOf", ["0x..."]);
await web3.contracts.USDT.callContract("transfer", ["0x...", "1000000"]);

// readProperty: shorthand for public getters (e.g. totalSupply(), decimals())
const totalSupply = await web3.contracts.USDT.readProperty("totalSupply");
console.log("Total supply:", totalSupply);

const decimals1 = await web3.contracts.USDT.readProperty("decimals");
const decimals2 = await web3.contracts.USDT.readContract("decimals");
// decimals1 === decimals2
```

### Transaction queries

```typescript
import { Web3Client } from "jsr:@dreamer/web3";

const web3 = new Web3Client({
  rpcUrl: "https://eth-mainnet.g.alchemy.com/v2/YOUR_API_KEY",
});

const tx = await web3.getTransaction("0x...");
console.log("Transaction:", tx);

const receipt = await web3.getTransactionReceipt("0x...");
if (receipt.success) {
  console.log("Success:", receipt);
} else {
  console.log("Failed:", receipt.error, receipt.message);
}

const confirmedReceipt = await web3.waitForTransaction("0x...", 3);
console.log("Confirmed:", confirmedReceipt);
```

### Block queries

```typescript
import { Web3Client } from "jsr:@dreamer/web3";

const web3 = new Web3Client({
  rpcUrl: "https://eth-mainnet.g.alchemy.com/v2/YOUR_API_KEY",
});

const latestBlock = await web3.getBlock();
console.log("Latest block:", latestBlock);

const block = await web3.getBlock(1000000);
console.log("Block:", block);

const transactions = await web3.getBlockTransactions(1000000, true);
console.log("Block transactions:", transactions);
```

### Event listening (RPC polling)

```typescript
import { Web3Client } from "jsr:@dreamer/web3";

const web3 = new Web3Client({
  rpcUrl: "https://eth-mainnet.g.alchemy.com/v2/YOUR_API_KEY",
});

const unsubscribe = web3.onBlock((blockNumber, block) => {
  console.log("New block:", blockNumber);
});

const unsubscribeEvent = web3.onContractEvent(
  "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
  "Transfer",
  (event) => {
    console.log("Transfer:", event);
  },
  {
    fromBlock: "latest",
    abi: [...],
  }
);

unsubscribe();
unsubscribeEvent();
```

### Message signing

```typescript
import { Web3Client } from "jsr:@dreamer/web3";

const web3 = new Web3Client({
  rpcUrl: "https://eth-mainnet.g.alchemy.com/v2/YOUR_API_KEY",
  privateKey: "0x...", // optional; can pass per call
});

const message = "Hello, Web3!";
const signature = await web3.signMessage(message);

const signature2 = await web3.signMessage(message, "0x...");

const address = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb";
const isValid = await web3.verifyMessage(message, signature, address);
console.log("Valid:", isValid);
```

### Utilities

#### Unit conversion

```typescript
import { fromWei, toWei } from "jsr:@dreamer/web3/mod";

const eth = fromWei("1000000000000000000", "ether"); // "1.0"
const wei = toWei("1", "ether"); // "1000000000000000000"
```

#### Address

```typescript
import {
  formatAddress,
  isAddress,
  shortenAddress,
  toChecksumAddress,
} from "jsr:@dreamer/web3/mod";

if (isAddress("0x742d35cc6634c0532925a3b844bc9e7595f0beb")) {
  const checksum = toChecksumAddress(
    "0x742d35cc6634c0532925a3b844bc9e7595f0beb",
  );
  const formatted = formatAddress("0x742d35cc6634c0532925a3b844bc9e7595f0beb");
  const short = shortenAddress("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb");
  // "0x742d...0bEb"
}
```

#### Hash

```typescript
import { keccak256, solidityKeccak256 } from "jsr:@dreamer/web3/mod";

const hash = keccak256("Hello, Web3!");
const solidityHash = solidityKeccak256(
  ["address", "uint256"],
  ["0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb", "1000000"],
);
```

#### Contract helpers

```typescript
import {
  computeContractAddress,
  encodeFunctionCall,
  getFunctionSelector,
} from "jsr:@dreamer/web3/mod";

const selector = getFunctionSelector("transfer(address,uint256)");
// "0xa9059cbb"

const data = encodeFunctionCall("transfer(address,uint256)", [
  "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  "1000000",
]);

const contractAddress = computeContractAddress(
  "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  0, // nonce
);
```

---

## API overview

### Server Web3Client

**Config**: `getConfig()`, `updateConfig(config)`\
**Network**: `getChainId()`, `getNetwork()`, `getBlockNumber()`\
**Accounts**: `getBalance(address)`, `getBalances(addresses)`,
`getTransactionCount(address)`\
**Transactions**: `sendTransaction(options)`,
`waitForTransaction(txHash, confirmations?)`, `getTransaction(txHash)`,
`getTransactionReceipt(txHash)`, `estimateGas(options)`, `getGasPrice()`,
`getGasLimit(blockNumber?)`, `getFeeData()`\
**Blocks**: `getBlock(blockNumber?)`,
`getBlockTransactions(blockNumber, includeTransactions?)`\
**Contracts**: `readContract(options)`,
`callContract(options, waitForConfirmation?)`, `getCode(address)`,
`isContract(address)`, `getAddressTransactions(...)`,
`scanContractMethodTransactions(...)`\
**Proxy**: `contracts[name]` — `readContract(fn, args?)`,
`readProperty(propertyName)`, `callContract(fn, args?, wait?)`, `address`,
`abi`, `name`\
**Signing**: `signMessage(message, privateKey?)`,
`verifyMessage(message, signature, address)`\
**Events**: `onBlock(callback)`, `offBlock()`, `onTransaction(callback)`,
`offTransaction()`, `onContractEvent(...)`, `offContractEvent(...)`

### Utilities (import from `jsr:@dreamer/web3/mod`)

**Units**: `fromWei(value, unit?)`, `toWei(value, unit?)`\
**Address**: `isAddress()`, `checkAddressChecksum()`, `toChecksumAddress()`,
`formatAddress()`, `shortenAddress()`\
**Hash**: `keccak256()`, `solidityKeccak256()`\
**Hex**: `hexToBytes()`, `bytesToHex()`, `hexToNumber()`, `numberToHex()`,
`stripHexPrefix()`, `addHexPrefix()`, `padLeft()`, `padRight()`\
**Contract**: `getCode(address, rpcUrl?)`, `computeContractAddress()`,
`getFunctionSelector()`, `encodeFunctionCall()`

---

## Test report

All 139 tests pass with 100% coverage. See
[TEST_REPORT.md](./docs/en-US/TEST_REPORT.md).

| Item       | Value  |
| ---------- | ------ |
| **Total**  | 139    |
| **Passed** | 139 ✅ |
| **Failed** | 0      |
| **Rate**   | 100%   |

| Module            | Count | Status  |
| ----------------- | ----- | ------- |
| Web3Client        | 61    | ✅ Done |
| Web3Manager       | 11    | ✅ Done |
| ServiceContainer  | 4     | ✅ Done |
| createWeb3Manager | 5     | ✅ Done |
| Client tests      | 27    | ✅ Done |
| Utils tests       | 30    | ✅ Done |

Full report: [TEST_REPORT.md](./docs/en-US/TEST_REPORT.md)

---

## ServiceContainer integration

### createWeb3Manager

```typescript
import { ServiceContainer } from "@dreamer/service";
import { createWeb3Manager, Web3Manager } from "jsr:@dreamer/web3";

const container = new ServiceContainer();

container.registerSingleton(
  "web3:main",
  () => createWeb3Manager({ name: "main" }),
);

const manager = container.get<Web3Manager>("web3:main");

manager.registerClient("ethereum", {
  rpcUrl: "https://eth-mainnet.g.alchemy.com/v2/YOUR_API_KEY",
  chainId: 1,
});

manager.registerClient("polygon", {
  rpcUrl: "https://polygon-mainnet.g.alchemy.com/v2/YOUR_API_KEY",
  chainId: 137,
});

const ethClient = manager.getClient("ethereum");
const balance = await ethClient.getBalance("0x...");
```

### Web3Manager API

| Method                            | Description                 |
| --------------------------------- | --------------------------- |
| `getName()`                       | Get manager name            |
| `setContainer(container)`         | Set service container       |
| `getContainer()`                  | Get service container       |
| `fromContainer(container, name?)` | Get from container          |
| `registerClient(name, config)`    | Register Web3 client config |
| `getClient(name)`                 | Get or create Web3 client   |
| `hasClient(name)`                 | Check if client exists      |
| `removeClient(name)`              | Remove client               |
| `getClientNames()`                | List client names           |
| `close()`                         | Close all clients           |

---

## Client (browser)

- **Entry**: `jsr:@dreamer/web3/client` — TypeScript source entrypoint. Bundle
  it in your app (Vite, esbuild, etc.) for type-checking and tree-shaking.

---

## Notes

- **Server vs client**: Use root package for server; `jsr:@dreamer/web3/client`
  for browser.
- **Unified API**: Same-style API on server and client.
- **RPC**: Server requires `rpcUrl`.
- **Contract proxy**: Access via `web3.contracts.<name>`.
- **Signing**: Private key sign/verify on server.
- **Types**: Full TypeScript types.
- **Dependency**: `npm:viem@^2.43.3`.

---

## Changelog

**v1.1.0** (2026-03-14): **Changed** – Client `connectWallet()` eagerly
initializes `publicClient` and `walletClient` after success. See
[docs/en-US/CHANGELOG.md](./docs/en-US/CHANGELOG.md).

---

## Contributing

Issues and Pull Requests welcome.

---

## License

Apache License 2.0 — see [LICENSE](./LICENSE).

---

<div align="center">

**Made with ❤️ by Dreamer Team**

</div>
