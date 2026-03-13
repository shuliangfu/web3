# 变更日志

本项目的所有重要变更将记录于此文件。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，版本号遵循
[语义化版本](https://semver.org/lang/zh-CN/)。

---

## [1.1.1] - 2026-03-14

### 变更

- **ContractConfig**：字段 `name` 更名为 `contractName`（客户端与服务端一致）。
  与常见合约元数据对齐；`ContractProxy` 的 getter `name`
  仍返回合约名以保持兼容。

---

## [1.1.0] - 2026-03-14

### 变更

- **客户端**：`connectWallet()` 在成功获取账户后会立即初始化 `publicClient` 与
  `walletClient`，连接完成后实例即可用于 `readContract` / `callContract`，调试时
  对象状态完整。

---

## [1.0.10] - 2026-02-21

### 移除

- **导出**：移除包导出中的 `./client/bundle` 与 `./client/bundle/external`
  入口，请使用 `./client`（TypeScript 源码）并在应用内自行打包。

### 文档

- **同步**：README 与 client 文档不再提及预构建包；中英文文档一致。根 README
  链接至中文文档，中文文档链接至英文文档。
- **变更日志（README）**：已更新为 v1.0.10。

---

## [1.0.9] - 2026-02-20

### 变更

- **依赖**：将 `@dreamer/runtime-adapter` 升级为 `^1.0.15`，`@dreamer/service`
  升级为 `^1.0.2`，`@dreamer/test` 升级为 `^1.0.12`。
- **i18n**：`initWeb3I18n()` 不再导出；i18n
  在模块加载时自动初始化，调用方无需再在 `$tr()` 前调用 `initWeb3I18n()`。
- **客户端入口**：`./client` 改为指向 TypeScript
  源码（`./src/client/mod.ts`），预构建包移至 `./client/bundle` 与
  `./client/bundle/external`。原先使用 `jsr:@dreamer/web3/client/external`
  的请改为 `jsr:@dreamer/web3/client/bundle/external`。
- **文档**：README 与 docs/zh-CN/README.md 已按新入口更新；client
  子文档增加「入口路径」说明；主入口与 client 入口补充 `@module` 模块说明。

---

## [1.0.8] - 2026-02-19

### 文档

- **客户端（浏览器）** 体积说明：README 与文档中补充默认包约 294
  KB（minified）、 Brotli 后约 **70 KB**；external 包约 12–13
  KB（minified），避免用户误以为体积过大。

---

## [1.0.7] - 2026-02-19

### 新增

- **客户端（浏览器）**：
  - 新导出 `./client/external`：**viem 外置**的 ESM 包（约 12 KB 压缩）；配合
    import map 或由 bundler 提供 `viem` 可减小体积。
  - 构建产物：`dist/web3-client.esm.min.js`（完整）、
    `dist/web3-client.esm.external.min.js`（external）、`dist/meta.json`
    用于[体积分析](https://esbuild.github.io/analyze/)。
- **客户端工具**：在 `client/utils.ts` 中新增
  `getErrorMessage`、`asViemAbi`、`formatAddressArgs`、`findMatchingFunction`（自服务端
  utils 复制），客户端不再依赖服务端 utils。
- **客户端合约代理**：独立实现 `client/contract-proxy.ts`（无 i18n）；服务端
  继续使用带 i18n 的 `internal/contract-proxy.ts`。

### 变更

- **i18n**：翻译方法由 `$t` 重命名为 `$tr`，避免与全局 `$t`
  冲突。请将现有代码中本包消息改为使用 `$tr`。
- **客户端构建**：压缩构建使用 `legalComments: "none"` 与 `drop: ["debugger"]`
  以减小体积；`deno.json` 新增导出 `"./client/external"`。
- **文档**：README「Client (browser)」小节补充默认入口、更小体积（external）及
  import map 示例；`docs/zh-CN/README.md` 已同步更新。

---

## [1.0.6] - 2026-02-18

### 新增

- **Web3Manager** 与 **ServiceContainer**
  集成：`createWeb3Manager()`，多链客户端注册（`registerClient`、`getClient`
  等）。
- **readProperty**：便捷读取合约公有状态（getter）；服务端与客户端均支持。
- **readContract** 的 **returnJson** 选项：多返回值以命名对象返回（默认
  `true`）；`returnJson: false` 时返回数组。
- **i18n**：服务端错误与警告文案支持 zh-CN、en-US（基于
  `@dreamer/i18n`）；语言由环境变量检测。
- **wssUrl** 配置支持 WebSocket RPC；`updateConfig()` 时重置 WS 客户端。
- **ExtendedTransactionReceipt** 类型，含 `success` 与错误信息。
- 客户端构建生成 TypeScript 声明（`dist/*.d.ts`）。

### 变更

- **许可证**：变更为 Apache License 2.0。
- **returnAsObject** 重命名为 **returnJson**（默认仍为 `true`）。
- 客户端导出路径：`./client` 指向 `./dist/web3-client.esm.min.js`（构建产物）。
- Gas 估算与交易收据：错误处理与 revert 检测改进。
- 合约代理抽至共享 `internal/contract-proxy`；扫描收据并行拉取；区块扫描
  `batchSize` 可配置。

### 修复

- **fromWei** / **toWei** 精度（基于 BigInt）。
- 合约调用参数中的地址格式（校验和）。
- **readContract** / **callContract**
  按参数数量匹配函数重载（view/pure、payable/nonpayable）；客户端与服务端。
- 区块扫描：限制为最近 1 万区块；忽略缺失区块（如本地
  Anvil）；本地测试错误处理。
- Lint：区块扫描循环中以 `return` 替代 `continue`。

### 移除

- 客户端合约事件监听（仅保留钱包事件：账户变化、链切换）。

### 文档

- README 与文档结构调整；客户端 README 与 API；测试报告更新。
- 测试改为 Anvil 本地网络（Chain ID
  31337）；未注册配置测试在英文环境下通过（正则匹配）。

---

## [1.0.5] - 2026-01-08

### 新增

- **合约代理**：`contracts[name]`，提供
  `readContract`、`callContract`、`address`、`abi`、`name`。
- **消息签名与验证**：服务端
  `signMessage(message, privateKey?)`、`verifyMessage(message, signature, address)`。
- 文档拆分：服务端与客户端文档分离。

---

## [1.0.4] - 2026-01-06

### 变更

- 版本号更新至 1.0.4；发布与 CI 调整（标签触发工作流、dev 分支发布）。

---

## [1.0.3] - 2026-01-06

### 变更

- 发布配置与版本号；beta 发布测试。

---

## [1.0.2] - 2026-01-06

### 新增

- 预发布（beta）标签触发 CI 发布。
- 允许从 dev 分支发布。

### 变更

- 发布配置与版本处理。

---

## [1.0.1] - 2026-01-06

### 变更

- JSR 发布流程与配置；首次发布测试。

---

## [1.0.0] - 2026-01-06

### 新增

- 首次发布。
- **服务端包**（`jsr:@dreamer/web3`）：Web3Client（RPC、链/区块/交易/合约、余额、Gas、签名），工具函数（单位、地址、哈希、十六进制、合约辅助）。
- **客户端包**（`jsr:@dreamer/web3/client`）：浏览器端 Web3Client（EIP-1193
  钱包，无需 RPC URL），相同工具函数。
- 支持 Deno 与 Bun；依赖 `npm:viem`。
