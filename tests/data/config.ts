/**
 * Web3 测试配置
 *
 * 注意：这是测试用的配置，使用 Anvil 本地测试节点
 * 请确保 Anvil 在 http://127.0.0.1:8545 运行
 * 请勿在生产环境使用这些私钥
 */

const config = {
  /** 链 ID */
  chainId: 31337, // Anvil 默认 chain ID

  /** RPC 节点 URL */
  host: "http://127.0.0.1:8545",

  /** WebSocket RPC 节点 URL */
  wss: "ws://127.0.0.1:8545",

  /** 测试账户地址 */
  address: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",

  /** 测试账户私钥（仅用于测试，请勿在生产环境使用） */
  privateKey:
    "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
};

export default config;
