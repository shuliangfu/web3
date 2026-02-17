# @dreamer/web3 Test Report

## Test Overview

### Test Statistics

- **Total tests**: 139 (Deno)
- **Passed**: 139 (100%)
- **Failed**: 0
- **Test files**: 3
- **Test code lines**: ~2,800+
- **Execution time**: ~10s (Deno)

### Test Environment

- **Package version**: @dreamer/web3@1.0.6-beta.11
- **Service container**: @dreamer/service@1.0.0-beta.4
- **Test framework**: @dreamer/test (Deno and Bun compatible)
- **Test date**: 2026-01-30
- **Environment**:
  - **Deno**: 2.6.5
  - **Bun**: 1.3.5
  - **Blockchain**: Anvil local test network (Chain ID: 31337)

### Test Files

| Test file            | Tests (Deno) | Description                                                    |
| -------------------- | ------------ | -------------------------------------------------------------- |
| `mod.test.ts`        | 82           | Server Web3Client + Web3Manager + ServiceContainer integration |
| `client-mod.test.ts` | 27           | Client Web3Client (mock environment)                           |
| `utils.test.ts`      | 30           | Web3 utility functions                                         |

**Total**: 3 test files, 139 test cases, all passed ✅

## Test Results

### Summary

- **Total tests**: 139
- **Passed**: 139 ✅
- **Failed**: 0
- **Pass rate**: 100% ✅
- **Execution time**: ~10s (Deno)

### Per-file Statistics

| Test file            | Tests (Deno) | Deno status | Description                                                    |
| -------------------- | ------------ | ----------- | -------------------------------------------------------------- |
| `mod.test.ts`        | 82           | ✅ All pass | Server Web3Client + Web3Manager + ServiceContainer integration |
| `client-mod.test.ts` | 27           | ✅ All pass | Client Web3Client (mock environment)                           |
| `utils.test.ts`      | 30           | ✅ All pass | Web3 utility functions                                         |

## Module Coverage

### 1. Server Web3Client

#### 1.1 Client Creation

- ✅ Creates client instance with `new Web3Client()` and validates config
  (rpcUrl, chainId)
- ✅ Creates client with contract config (name, address, abi) and validates
  `contracts[name]`
- ✅ Creates client via `createWeb3Client()` and validates instance type

**Result**: 4 tests passed

#### 1.2 Config

- ✅ Gets current config and validates (rpcUrl, chainId)
- ✅ Updates config (e.g. chainId) and validates

**Result**: 2 tests passed

#### 1.3 Network and Chain

- ✅ Gets network info (chainId, name) and return shape
- ✅ Gets chain ID (type and value)
- ✅ Gets current block number (value > 0)

**Result**: 3 tests passed

#### 1.4 Accounts and Balance

- ✅ Gets balance (wei) for address and validates format
- ✅ Batch gets balances for multiple addresses
- ✅ Gets transaction count (nonce) and validates type/range

**Result**: 3 tests passed

#### 1.5 Gas

- ✅ Gets gas price and validates format
- ✅ Gets fee data (EIP-1559: maxFeePerGas, maxPriorityFeePerGas)
- ✅ Estimates gas and validates format
- ✅ Gets block gas limit and validates format

**Result**: 4 tests passed

#### 1.6 Blocks

- ✅ Gets block by number and validates shape
- ✅ Gets latest block and validates shape
- ✅ Gets block transactions and validates array

**Result**: 3 tests passed

#### 1.7 Transactions

- ✅ Gets transaction by hash; validates error for invalid hash
- ✅ Gets transaction receipt; validates error for invalid hash
- ✅ Sends ETH transfer; validates hash and confirmation
- ✅ Sends EIP-1559 transaction; validates maxFeePerGas and maxPriorityFeePerGas
- ✅ Sends Legacy transaction (gasPrice)
- ✅ Waits for confirmation (1 and 2 confirmations) and receipt shape
- ✅ Handles send error (insufficient balance)

**Result**: 7 tests passed

#### 1.8 Contracts

- ✅ Reads contract (e.g. `name`, `balanceOf`) and validates return
- ✅ Reads USDT balance and format
- ✅ Gets contract code (bytecode hex)
- ✅ Checks if address is contract vs EOA
- ✅ Executes USDT transfer, listens for Transfer event, validates event and
  balance change
- ✅ Scans USDT `transfer` calls in recent blocks; validates list and param
  decode; handles missing block

**Result**: 6 tests passed

#### 1.9 Function Overloads

- ✅ readContract matches view overloads by argument count (e.g. `register(pid)`
  vs `register(uid, pid)`)
- ✅ readContract supports pure overloads
- ✅ callContract matches nonpayable overloads by argument count
- ✅ callContract supports payable overloads
- ✅ Contract proxy calls overloaded functions
- ✅ readProperty for public state (`_decimals`, `_name`, `_owner`); equivalence
  with readContract
- ✅ readContract for public state; consistency with readProperty
- ✅ readContract returnJson: named object (default) vs array (returnJson:
  false)

**Result**: 8 tests passed (12 scenarios)

#### 1.10 Message Signing

- ✅ Signs message with private key and validates signature
- ✅ Signs with given private key
- ✅ Verifies message signature and signer address

**Result**: 3 tests passed

#### 1.11 Event Listeners

- ✅ Registers block listener and gets unsubscribe function; unsubscribes
- ✅ Unsubscribes all block listeners; idempotent
- ✅ Registers transaction listener and unsubscribes
- ✅ Unsubscribes all transaction listeners
- ✅ Registers contract event listener and unsubscribes
- ✅ Unsubscribes specific contract event
- ✅ Unsubscribes all events for a contract

**Result**: 7 tests passed

#### 1.12 Reconnect Config

- ✅ Sets reconnect delay and max attempts and validates

**Result**: 1 test passed

#### 1.13 Transaction History

- ✅ Gets address transaction history and validates list
- ✅ Scans contract method transactions and validates list and param decode

**Result**: 2 tests passed

### 2. Client Web3Client

#### 2.1 Client Creation

- ✅ Creates client with `new Web3Client()` (no rpcUrl); validates instance
- ✅ Creates client with contract config; validates proxy
- ✅ Creates via `createWeb3Client()` and validates type

**Result**: 3 tests passed

#### 2.2 Config

- ✅ Gets config
- ✅ Updates config (e.g. chainId)

**Result**: 2 tests passed

#### 2.3 Wallet Connection

- ✅ Connects wallet (mock MetaMask); validates returned addresses
- ✅ Gets current accounts and format

**Result**: 2 tests passed

#### 2.4 Network and Chain

- ✅ Gets chain ID (from wallet)
- ✅ Gets network info (chainId, name) and format

**Result**: 2 tests passed

#### 2.5 Contracts

- ✅ Reads contract (view) and validates return
- ✅ Reads via `contracts[name].readContract()` and validates

**Result**: 2 tests passed

#### 2.6 Function Overloads

- ✅ readContract view overloads by argument count
- ✅ readContract pure overloads
- ✅ callContract nonpayable overloads by argument count
- ✅ callContract payable overloads
- ✅ Contract proxy overloads
- ✅ readProperty for public state; equivalence with readContract
- ✅ readContract for public state; consistency with readProperty

**Result**: 7 tests passed (9 scenarios)

#### 2.7 Wallet Event Listeners

**Note**: Client Web3Client has no contract event listeners; only wallet events
(accounts changed, chain changed).

- ✅ Registers accounts-changed listener and unsubscribes
- ✅ Unsubscribes all accounts-changed listeners
- ✅ Registers chain-changed listener and unsubscribes
- ✅ Unsubscribes all chain-changed listeners

**Result**: 4 tests passed

#### 2.8 Message Signing

- ✅ Signs message with wallet (mock); validates signature format
- ✅ Verifies message signature (mock signatures may not verify on curve; signer
  address validated)

**Result**: 2 tests passed

### 3. Utility Functions

#### 3.1 Unit Conversion

- ✅ fromWei: wei → ether (1 ether = 10^18 wei)
- ✅ fromWei: wei → gwei
- ✅ fromWei: kwei, mwei, szabo, finney
- ✅ toWei: ether, gwei, etc. → wei
- ✅ Handles bigint wei input
- ✅ Invalid unit throws

**Result**: 6 tests passed

#### 3.2 Address

- ✅ Valid/invalid address format
- ✅ EIP-55 checksum validation
- ✅ toChecksumAddress
- ✅ formatAddress (0x prefix, checksum)
- ✅ Address without 0x prefix (auto-add)
- ✅ shortenAddress for UI
- ✅ shortenAddress custom lengths

**Result**: 7 tests passed

#### 3.3 Hash

- ✅ keccak256 for string; validates format
- ✅ keccak256 for Uint8Array
- ✅ solidityKeccak256 (ABI-encoded); validates format

**Result**: 3 tests passed

#### 3.4 Hex Conversion

- ✅ hexToBytes
- ✅ bytesToHex
- ✅ hexToNumber
- ✅ numberToHex (including bigint)

**Result**: 4 tests passed

#### 3.5 Hex Prefix

- ✅ stripHexPrefix
- ✅ addHexPrefix (if missing)

**Result**: 2 tests passed

#### 3.6 Padding

- ✅ padLeft
- ✅ padRight

**Result**: 2 tests passed

#### 3.7 Wallet

- ✅ generateWallet; validates address and private key format
- ✅ isPrivateKey (64 hex chars)

**Result**: 2 tests passed

#### 3.8 Transaction Hash

- ✅ isTxHash (64 hex chars)
- ✅ Tx hash without 0x prefix

**Result**: 2 tests passed

#### 3.9 Contract Utils

- ✅ getFunctionSelector (first 4 bytes of signature)
- ✅ encodeFunctionCall
- ✅ computeContractAddress (CREATE)
- ✅ getCode (requires RPC)

**Result**: 4 tests passed

## Coverage Analysis

### Server Web3Client (37/37 – 100%)

**Config**: constructor, getConfig, updateConfig\
**Network**: getNetwork, getChainId, getBlockNumber\
**Accounts**: getBalance, getBalances, getTransactionCount\
**Gas**: getGasPrice, getFeeData, estimateGas, getGasLimit\
**Blocks**: getBlock, getBlockTransactions\
**Transactions**: sendTransaction, waitForTransaction, getTransaction,
getTransactionReceipt\
**Contracts**: readContract, callContract, getCode, isContract,
getAddressTransactions, scanContractMethodTransactions,
contracts[name].readProperty\
**Events**: onBlock, offBlock, onTransaction, offTransaction, onContractEvent,
offContractEvent\
**Signing**: signMessage, verifyMessage\
**Other**: setReconnectConfig, destroy\
**Factory**: createWeb3Client

### Client Web3Client (100% of exposed API)

**Config**: constructor, getConfig, updateConfig\
**Wallet**: connectWallet, getAccounts\
**Network**: getNetwork, getChainId\
**Contracts**: readContract, callContract, contracts[name],
contracts[name].readProperty\
**Events**: onAccountsChanged, offAccountsChanged, onChainChanged,
offChainChanged\
**Signing**: signMessage, verifyMessage\
**Factory**: createWeb3Client

### Utilities (26/26 – 100%)

**Units**: fromWei, toWei\
**Address**: isAddress, checkAddressChecksum, toChecksumAddress, formatAddress,
shortenAddress\
**Hash**: keccak256, solidityKeccak256\
**Hex**: hexToBytes, bytesToHex, hexToNumber, numberToHex, stripHexPrefix,
addHexPrefix\
**Padding**: padLeft, padRight\
**Wallet**: generateWallet, isPrivateKey\
**Tx**: isTxHash\
**Contract**: getFunctionSelector, encodeFunctionCall, computeContractAddress,
getCode

## Test Characteristics

1. **Real blockchain**: Anvil local network; real USDT-style contract, sends,
   confirmations, and event listening.
2. **Error handling**: Insufficient balance, invalid tx hash, invalid address,
   network errors.
3. **Transaction formats**: Legacy (gasPrice), EIP-1559 (maxFeePerGas,
   maxPriorityFeePerGas), ETH transfer, contract calls.
4. **Event listeners**: Block, transaction, contract events (including history
   scan), wallet (accounts/chain).
5. **Mock**: Client tests use mock `window.ethereum` for browser wallet
   behavior.

## Notes

### Network

- Tests use Anvil at `http://127.0.0.1:8545` (Chain ID: 31337).
- Default Anvil accounts and balances are used.

### Accounts

- Default test address: `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`.
- Test private keys are for testing only; do not use in production.

### Timeouts and Cleanup

- Some tests use longer timeouts (e.g. 15s) for confirmations and events.
- Resources are cleaned with `destroy(true)`.

## Running Tests

### Deno

```bash
deno test -A
```

### Bun

```bash
bun test
```

### Single file

```bash
deno test -A tests/mod.test.ts
deno test -A tests/client-mod.test.ts
deno test -A tests/utils.test.ts
```

## Coverage Summary

| Module                | Methods | Tested | Coverage    |
| --------------------- | ------- | ------ | ----------- |
| **Server Web3Client** | 37      | 37     | **100%** ✅ |
| **Client Web3Client** | ~16     | ~16    | **100%** ✅ |
| **Utilities**         | 26      | 26     | **100%** ✅ |
| **Total**             | ~79     | ~79    | **100%** ✅ |

## Conclusion

All 139 tests pass with **100%** coverage of the covered surface. The package is
tested for:

- Real chain interaction (Anvil)
- Multiple transaction formats
- Event listeners (block, transaction, contract, wallet)
- Utility functions
- Server and client usage
- Function overloads (readContract, callContract)
- Block scan error handling (ignore missing blocks)
- Public property reading (readProperty and equivalence with readContract)

The package is ready for production use.

---

**Report date**: 2026-01-23 · **Framework**: @dreamer/test@^1.0.0-beta.22\
**Network**: Anvil local (Chain ID: 31337) · **Execution**: Deno ~10s

## Changelog (report)

### 2026-01-23

1. **Environment**: Switched from BSC testnet to Anvil local (Chain ID: 31337);
   execution time ~44s → ~10s.
2. **Counts**: Server 52→61, client 18→27, utils 32; total 102→118.
3. **Overloads**: readContract/callContract overload tests (view/pure,
   payable/nonpayable); server and client.
4. **Block scan**: Ignore BlockNotFoundError; limit to recent 10k blocks.
5. **Precision**: fromWei/toWei use BigInt for exact arithmetic.
6. **Address format**: readContract/callContract auto-format address params to
   checksum.
7. **readProperty**: New tests for public state getters; equivalence with
   readContract; server and client.
