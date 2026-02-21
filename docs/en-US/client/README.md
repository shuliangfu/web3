# @dreamer/web3/client

> Browser Web3 helper: wallet connection and interaction

[![JSR](https://jsr.io/badges/@dreamer/web3/client)](https://jsr.io/@dreamer/web3/client)
[![License: Apache-2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](../../../LICENSE)

---

## Features

Client-side Web3 abstraction: wallet connect, contract read/write, and signing
via the user’s wallet.

---

## Entrypoints

| Path                       | Description                                          |
| -------------------------- | ---------------------------------------------------- |
| `jsr:@dreamer/web3/client` | TypeScript source; bundle in your app (recommended). |

---

## Installation

### Deno

```bash
deno add jsr:@dreamer/web3/client
```

### Bun

```bash
bunx jsr add @dreamer/web3/client
```

---

## Compatibility

| Environment    | Version | Status                                                         |
| -------------- | ------- | -------------------------------------------------------------- |
| **Deno**       | 2.5+    | ✅ Supported                                                   |
| **Bun**        | 1.0+    | ✅ Supported                                                   |
| **Server**     | -       | ❌ Not for server (browser only)                               |
| **Client**     | -       | ✅ Browser via `jsr:@dreamer/web3/client`; no RPC URL required |
| **Dependency** | -       | 📦 Requires `npm:viem@^2.43.3`                                 |

---

## Capabilities

- **Wallet connection**
  - Detect and connect EIP-1193 wallets (e.g. MetaMask)
  - No RPC URL; uses wallet’s RPC
  - Connect/disconnect accounts, get account list
- **Wallet interaction**
  - Sign and verify messages
  - Contract calls (signed by wallet)
  - Wait for transaction confirmation
- **Events**
  - Account change, chain change
- **Utilities**
  - Same helpers as server package
  - Wallet generation (client-only; not for production)

---

## Use cases

- **DApp**: Decentralized app frontends
- **Wallet integration**: MetaMask and similar
- **User flows**: Send tx, sign message, contract calls
- **Reactive UI**: Account and chain change listeners

---

## Quick start

### Wallet connection

```typescript
import { Web3Client } from "jsr:@dreamer/web3/client";

const web3 = new Web3Client();

const accounts = await web3.connectWallet();
console.log("Connected accounts:", accounts);

const currentAccounts = await web3.getAccounts();
console.log("Current accounts:", currentAccounts);

const chainId = await web3.getChainId();
console.log("Chain ID:", chainId);
```

### Contract interaction (via wallet)

```typescript
import { Web3Client } from "jsr:@dreamer/web3/client";

const web3 = new Web3Client();

await web3.connectWallet();

const result = await web3.readContract({
  address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", // USDC
  abi: [...],
  functionName: "balanceOf",
  args: ["0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"],
});

console.log("Balance:", result);

const receipt = await web3.callContract({
  address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
  abi: [...],
  functionName: "transfer",
  args: ["0x...", "1000000"],
}, true);

console.log("Receipt:", receipt);
```

### Contract proxy

```typescript
import { Web3Client } from "jsr:@dreamer/web3/client";

const usdtContract = {
  name: "USDT",
  address: "0xe52de483b5B089B4CBF01c2749Dfbf4Fa66CBda6",
  abi: [/* ABI array */],
};

const web3 = new Web3Client({
  contracts: usdtContract,
  // or contracts: [usdtContract, otherContract],
});

await web3.connectWallet();

const balance = await web3.contracts.USDT.readContract("balanceOf", ["0x..."]);
await web3.contracts.USDT.callContract("transfer", ["0x...", "1000000"]);
```

### Message signing

```typescript
import { Web3Client } from "jsr:@dreamer/web3/client";

const web3 = new Web3Client();

await web3.connectWallet();

const message = "Hello, Web3!";
const signature = await web3.signMessage(message);
console.log("Signature:", signature);

const accounts = await web3.getAccounts();
const isValid = await web3.verifyMessage(message, signature, accounts[0]);
console.log("Valid:", isValid);
```

### Event listeners

```typescript
import { Web3Client } from "jsr:@dreamer/web3/client";

const web3 = new Web3Client();

web3.onAccountsChanged((accounts) => {
  console.log("Accounts changed:", accounts);
  if (accounts.length === 0) {
    console.log("Wallet disconnected");
  }
});

web3.onChainChanged((chainId) => {
  console.log("Chain changed:", chainId);
});
```

### Utilities

#### Unit conversion

```typescript
import { fromWei, toWei } from "jsr:@dreamer/web3/client";

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
} from "jsr:@dreamer/web3/client";

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
import { keccak256, solidityKeccak256 } from "jsr:@dreamer/web3/client";

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
} from "jsr:@dreamer/web3/client";

const selector = getFunctionSelector("transfer(address,uint256)");
console.log(selector); // "0xa9059cbb"

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

### Web3Client

**Config**: `getConfig()`, `updateConfig(config)`\
**Wallet**: `connectWallet()` (returns account addresses; no RPC URL),
`getAccounts()`\
**Network**: `getChainId()`, `getNetwork()` (uses wallet RPC)\
**Contracts**: `readContract(options)`,
`callContract(options, waitForConfirmation?)`\
**Proxy**: `contracts[name]` — `readContract(fn, args?)`,
`callContract(fn, args?, wait?)`, `address`, `abi`, `name`\
**Signing**: `signMessage(message)`,
`verifyMessage(message, signature, address)`\
**Events**: `onAccountsChanged(callback)`, `offAccountsChanged()`,
`onChainChanged(callback)`, `offChainChanged()`

### Utilities (import from `jsr:@dreamer/web3/client`)

**Units**: `fromWei(value, unit?)`, `toWei(value, unit?)`\
**Address**: `isAddress()`, `checkAddressChecksum()`, `toChecksumAddress()`,
`formatAddress()`, `shortenAddress()`\
**Hash**: `keccak256()`, `solidityKeccak256()`\
**Wallet**: `generateWallet()`, `isPrivateKey()`, `isTxHash()`\
**Hex**: `hexToBytes()`, `bytesToHex()`, `hexToNumber()`, `numberToHex()`,
`stripHexPrefix()`, `addHexPrefix()`, `padLeft()`, `padRight()`\
**Contract**: `computeContractAddress()`, `getFunctionSelector()`,
`encodeFunctionCall()`

---

## Server / main package

For server-side Web3 (RPC URL, private key, etc.) see the
[main README](../../../README.md).

---

## Notes

- **Browser only**: Not for Node/Deno server.
- **Wallet**: EIP-1193 (e.g. MetaMask); no RPC URL needed.
- **Contract proxy**: `web3.contracts.<name>`.
- **Types**: Full TypeScript types.
- **Dependency**: `npm:viem@^2.43.3`.

---

## Contributing

Issues and Pull Requests welcome.

---

## License

Apache License 2.0 — see [LICENSE](../../../LICENSE).

---

<div align="center">

**Made with ❤️ by Dreamer Team**

</div>
