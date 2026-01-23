# 服务端与客户端代码优化分析

## 一、代码重复与可提取逻辑

### 1. `findMatchingFunction`（高优先级）**【已优化】**

- **位置**：`src/mod.ts` 约 894–952 行，`src/client/mod.ts` 约 415–472 行
- **现状**：两处实现完全一致（约 60 行），用于按函数名、参数个数、view/pure 与 payable/nonpayable 匹配 ABI 中的函数
- **建议**：抽到 `src/utils.ts`，以 `export function findMatchingFunction(...)` 导出，供 `mod.ts` 和 `client/mod.ts` 使用；不在 `mod`/`client` 的对外 re-export 中暴露，仅作内部使用
- **收益**：减少重复、后续重载逻辑只需改一处

---

### 2. 地址参数格式化（`formatAddressArgs`）（高优先级）**【已优化】**

- **位置**：
  - 客户端：`readContract`、`callContract` 中各有一段 `options.args?.map(... getAddress(arg) ...)`，逻辑相同
  - 服务端：`readContract`、`callContract` 中**未**对 `options.args` 做地址格式化，直接使用 `options.args`
- **现状**：  
  - 客户端：对“0x + 42 字符”的字符串做 `getAddress` 格式化，避免 viem 校验和问题  
  - 服务端：未做同等处理，在部分 RPC/viem 下可能因非校验和地址报错
- **建议**：
  1. 在 `utils.ts` 中新增 `formatAddressArgs(args?: unknown[]): unknown[] | undefined`，集中实现上述 `map` 逻辑
  2. 服务端、客户端的 `readContract` / `callContract` 在调用 viem 前统一使用：`args: formatAddressArgs(options.args) ?? options.args`
  3. 合约地址 `contractAddress` 在两边也统一用 `getAddress(contractAddress)` 再传入 viem
- **收益**：消除重复、统一行为，避免服务端因地址格式导致的隐蔽错误

---

### 3. `ContractProxy` 类（中优先级）**【已优化】**

- **位置**：`src/mod.ts` 约 178–254 行，`src/client/mod.ts` 约 126–202 行
- **现状**：实现一致，仅依赖 `web3Client.readContract` / `callContract` 及 `ContractConfig`
- **建议**：
  - 抽到 `src/internal/contract-proxy.ts`（或 `src/shared/contract-proxy.ts`），不通过 `deno.json` 的 `exports` 暴露
  - 定义最小接口，例如：  
    `{ readContract(opts: { address: string; functionName: string; args?: unknown[]; abi: … }): Promise<unknown>; callContract(opts: …, wait?: boolean): Promise<unknown> }`  
    令服务端/客户端 `Web3Client` 均满足该接口，`ContractProxy` 只依赖此接口
- **收益**：删掉约 80 行重复，后续代理行为只维护一处

---

### 4. 合约列表初始化（低优先级）**【已优化】**

- **位置**：`Web3Client` 构造函数中，`config.contracts` 的 `Array.isArray` 判断、遍历、`ContractProxy` 的创建
- **现状**：服务端与客户端这段逻辑相同
- **建议**：若已抽取 `ContractProxy`，可再抽一个 `buildContractsProxy(client, config.contracts): ContractsProxy`，在两端 `constructor` 中调用
- **收益**：构造函数更短，逻辑更集中

---

### 5. 错误信息提取（低优先级）**【已优化】**

- **现状**：多处使用  
  `const msg = error instanceof Error ? error.message : String(error);`
- **建议**：在 `utils.ts` 增加：  
  `export function getErrorMessage(err: unknown): string { return err instanceof Error ? err.message : String(err); }`  
  并在 `mod` / `client` 中替换为 `getErrorMessage(error)`
- **收益**：代码更统一，后续若要做错误分类、上报也便于集中扩展

---

## 二、行为一致性与缺失功能

### 1. 服务端 `readContract` / `callContract` 未做地址格式化（建议修复）**【已优化】**

- **问题**：未对 `contractAddress`、`options.args` 中的地址调用 `getAddress`，与客户端不一致，且在严格校验和环境下可能出错
- **建议**：按“一.2”在服务端也使用 `formatAddressArgs`，并对 `contractAddress` 使用 `getAddress`

---

### 2. 客户端 `readContract` 未使用 `findMatchingFunction`（建议修复）**【已优化】**

- **问题**：  
  - `callContract` 在 ABI 为“对象数组”时，会走 `findMatchingFunction` 做重载匹配  
  - `readContract` 在同样情况下直接 `parsedAbi = abiSource as unknown as Abi`，未做重载匹配
- **建议**：对“对象数组 ABI”分支，与 `callContract` 一样先 `findMatchingFunction(abiSource, options.functionName, options.args?.length ?? 0, true)`，若匹配到则用 `[matchedFunction]` 作 `parsedAbi`，否则再回退到完整 ABI
- **收益**：客户端 `readContract` 与 `callContract` 在重载行为上一致

---

### 3. 服务端 `updateConfig` 未重置 WebSocket 客户端（建议修复）**【已优化】**

- **问题**：`updateConfig` 中已对 `publicClient`、`walletClient`、`chain` 置 `null`，但未对 `wsClient`、`wsTransport` 做清理。若用户修改 `rpcUrl` / `wss`，事件监听仍可能沿用旧连接
- **建议**：在 `updateConfig` 中增加：  
  `this.wsClient = null;`  
  `this.wsTransport = null;`  
  并在需要时关闭旧 `wsTransport`（若 viem 提供 `close` 一类 API）
- **收益**：配置变更后，事件监听使用新 RPC/WebSocket，避免脏状态

---

## 三、性能相关

### 1. `scanContractMethodTransactions` 中 `getTransactionReceipt` 的调用方式（中优先级）**【已优化】**

- **现状**：在扫描到每笔匹配交易后，在循环内 `await this.getTransactionReceipt(txObj.hash)`，即按交易顺序串行请求
- **建议**：  
  - 先按区块收集本批次中所有匹配交易的 `hash`  
  - 再对该 `hash[]` 做 `Promise.all(hashes.map(h => this.getTransactionReceipt(h)))`  
- **收益**：同一批区块内的收据请求并行，减少总等待时间；若 RPC 限流，可再在外部加简单并发上限（如 `p-limit` 或自实现队列）
- **实现**：区块扫描结束后，对 `allTransactions` 的 `hash[]` 做 `Promise.all(hashes.map(h => this.getTransactionReceipt(h)))`，再回写 `receipt` 与 `gasUsed`

---

### 2. `getAddressTransactions` / `scanContractMethodTransactions` 的区块扫描（低优先级）**【已优化】**

- **现状**：`batchSize = 50`，`Promise.all(blockPromises)` 一批 50 个 `getBlock(includeTransactions: true)`，对公共 RPC 可能触发限流
- **建议**：  
  - 将 `batchSize` 做成可配置，默认保留 50，在文档中说明“遇限流可调小”  
  - 可选：在每批 `Promise.all` 后 `await new Promise(r => setTimeout(r, 100))`，减轻突发并发  
- **收益**：在弱 RPC 环境下更稳，同时保留当前默认性能
- **实现**：`getAddressTransactions` 增加可选参数 `options?: { batchSize?: number }`（默认 50）；`scanContractMethodTransactions` 的 `options` 增加 `batchSize?: number`（默认 50）

---

### 3. `getBalances`（保持现状即可）

- **现状**：`Promise.all(addresses.map(addr => client.getBalance({ address })))`，思路正确
- **说明**：viem 若未来提供 `multicall` 之类批量 balance 接口，可再替换；当前实现无需调整

---

### 4. `findMatchingFunction` 与 ABI 规模（无需优化）

- **现状**：对 ABI 做一次 `filter` 与一次 `for`，复杂度与 ABI 条数线性，通常 ABI 规模很小
- **结论**：不必做缓存或更复杂结构

---

### 5. `getPublicClient` / `getWalletClient` / `getWsClient` 懒加载（保持现状）

- **现状**：未使用时不会创建 viem 客户端，避免多余连接与内存
- **结论**：继续保留懒加载即可

---

## 四、可维护性与类型安全（低优先级）

### 1. 减少 `as any`、`as unknown as Abi`

- **现状**：`args as any`、`options.abi as unknown as Abi` 等较多
- **建议**：  
  - 为 `readContract` / `callContract` 的 `options` 使用更清晰的泛型或重载，让 `abi`、`args` 的类型从调用处推导  
  - 对 viem 所需类型，在边界处做集中断言或薄封装，而不是在业务逻辑中四处 `as any`  
- **收益**：类型更稳，重构时更易发现错误

---

### 2. `(publicClient as any).chain`、`(walletClient as any).chain`

- **现状**：客户端 `getWalletClient` 中通过 `(publicClient as any).chain` 取链信息
- **建议**：查看 viem 的 `PublicClient`/`WalletClient` 类型是否提供 `chain` 或等价只读属性；若有，改为正式属性并去掉 `as any`
- **收益**：在 viem 升级时更不易静默出错

---

## 五、实施顺序建议

| 优先级 | 项目 | 预估改动 | 风险 | 状态 |
|--------|------|----------|------|------|
| 高 | 提取 `findMatchingFunction` 到 `utils` | 中 | 低 | **已优化** |
| 高 | 新增 `formatAddressArgs`，服务端/客户端统一地址格式化 | 中 | 低 | **已优化** |
| 高 | 服务端 `readContract`/`callContract` 使用 `getAddress`+`formatAddressArgs` | 小 | 低 | **已优化** |
| 高 | 客户端 `readContract` 对对象数组 ABI 使用 `findMatchingFunction` | 小 | 低 | **已优化** |
| 中 | 提取 `ContractProxy` 到 `internal` 或 `shared` | 中 | 中（需确认类型与导出） | **已优化** |
| 中 | `scanContractMethodTransactions` 内对 `getTransactionReceipt` 做并行批处理 | 小 | 低 | **已优化** |
| 中 | `updateConfig` 中重置 `wsClient` / `wsTransport` | 小 | 低 | **已优化** |
| 低 | 提取 `getErrorMessage`、`buildContractsProxy` | 小 | 低 | **已优化** |
| 低 | 区块扫描 `batchSize` 可配置、可选节流 | 小 | 低 | **已优化** |
| 低 | 收紧 `as any`、`as unknown as Abi` 等类型 | 中 | 中 | 待做 |

---

## 六、小结

- **已完成的优化**：  
  - `findMatchingFunction`、`formatAddressArgs`、`getErrorMessage` 已抽到 `utils` 并统一使用；  
  - 服务端 `readContract`/`callContract` 已使用 `getAddress`+`formatAddressArgs`；  
  - 客户端 `readContract` 对对象数组 ABI 已使用 `findMatchingFunction`；  
  - `updateConfig` 中已重置 `wsClient`、`wsTransport`；  
  - `ContractProxy`、`buildContractsProxy` 已抽取到 `src/internal/contract-proxy.ts`；  
  - `scanContractMethodTransactions` 已在区块扫描结束后用 `Promise.all` 并行拉取收据；  
  - `getAddressTransactions`、`scanContractMethodTransactions` 的 `batchSize` 已可配置（默认 50）。  

- **待做**：  
  - 收紧 `as any`、`as unknown as Abi` 等类型，可在日常迭代中逐步做。

以上已完成的调整不改变对外 API，仅优化实现、一致性和性能；已跑现有用例回归通过。
