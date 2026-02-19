# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.7] - 2026-02-19

### Added

- **Client (browser)**:
  - New export `./client/external`: ESM bundle with **viem external** (~12 KB
    minified); use with import map or bundler-provided `viem` for smaller
    payload.
  - Build outputs: `dist/web3-client.esm.min.js` (full),
    `dist/web3-client.esm.external.min.js` (external), `dist/meta.json` for
    [bundle analysis](https://esbuild.github.io/analyze/).
- **Client utils**: `getErrorMessage`, `asViemAbi`, `formatAddressArgs`,
  `findMatchingFunction` added in `client/utils.ts` (from server utils) so
  client does not depend on server utils.
- **Client contract proxy**: Dedicated `client/contract-proxy.ts` (no i18n);
  server keeps `internal/contract-proxy.ts` with i18n.

### Changed

- **i18n**: Renamed translation method from `$t` to `$tr` to avoid conflict with
  global `$t`. Update existing code to use `$tr` for package messages.
- **Client build**: Minified build uses `legalComments: "none"` and
  `drop: ["debugger"]` to reduce size; `deno.json` exports
  `"./client/external"`.
- **Docs**: README “Client (browser)” section documents default entry, smaller
  bundle (external), and import map example; `docs/zh-CN/README.md` updated
  accordingly.

---

## [1.0.6] - 2026-02-18

### Added

- **Web3Manager** and **ServiceContainer** integration: `createWeb3Manager()`,
  multi-chain client registration (`registerClient`, `getClient`, etc.).
- **readProperty**: Convenience method to read contract public state (getters);
  server and client.
- **returnJson** option for `readContract`: multi-return values as named object
  (default `true`); optional array format with `returnJson: false`.
- **i18n**: Server error and warning messages in `zh-CN` and `en-US` (via
  `@dreamer/i18n`); locale from env.
- **wssUrl** configuration for WebSocket RPC; `updateConfig()` resets WS client
  when config changes.
- **ExtendedTransactionReceipt** type with `success` and error fields.
- TypeScript declaration generation in client build (`dist/*.d.ts`).

### Changed

- **License**: Switched to Apache License 2.0.
- **returnAsObject** renamed to **returnJson** (default remains `true`).
- Client export path: `./client` now points to `./dist/web3-client.esm.min.js`
  (built ESM).
- Gas estimation and transaction receipt handling: better error handling and
  revert detection.
- Contract proxy extracted to shared `internal/contract-proxy`; scan receipts
  fetched in parallel; `batchSize` configurable for block scan.

### Fixed

- **fromWei** / **toWei** precision (BigInt-based).
- Address formatting in contract call args (checksum).
- **readContract** / **callContract** function overload matching by argument
  count (view/pure, payable/nonpayable); client and server.
- Block scan: limit to recent 10k blocks; ignore missing blocks (e.g. local
  Anvil); local test error handling.
- Linter: replace `continue` with `return` in block scan loop.

### Removed

- Client contract event listening (only wallet events: accounts changed, chain
  changed).

### Documentation

- README and docs reorganized; client README and API; test report updates.
- Tests switched to Anvil local network (Chain ID 31337); config not found test
  passes in English locale (regex).

---

## [1.0.5] - 2026-01-08

### Added

- **Contract proxy**: `contracts[name]` with `readContract`, `callContract`,
  `address`, `abi`, `name`.
- **Message signing and verification**: `signMessage(message, privateKey?)`,
  `verifyMessage(message, signature, address)` on server.
- Docs split: separate server and client documentation.

---

## [1.0.4] - 2026-01-06

### Changed

- Version bump to 1.0.4; release and CI adjustments (tag-triggered workflow, dev
  branch publish).

---

## [1.0.3] - 2026-01-06

### Changed

- Release configuration and version numbering; beta publish tests.

---

## [1.0.2] - 2026-01-06

### Added

- Tag-triggered CI for pre-release (beta) publish.
- Publish allowed from dev branch.

### Changed

- Publish configuration and version handling.

---

## [1.0.1] - 2026-01-06

### Changed

- JSR publish workflow and config; initial publish tests.

---

## [1.0.0] - 2026-01-06

### Added

- Initial release.
- **Server package** (`jsr:@dreamer/web3`): Web3Client (RPC,
  chain/block/transaction/contract, balance, gas, signing), utilities (units,
  address, hash, hex, contract helpers).
- **Client package** (`jsr:@dreamer/web3/client`): Web3Client for browser
  (EIP-1193 wallet, no RPC URL), same utilities.
- Deno and Bun support; `npm:viem` dependency.
