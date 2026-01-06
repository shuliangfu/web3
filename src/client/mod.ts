/**
 * 客户端 Web3 操作辅助类
 * 提供客户端 Web3 相关的操作功能，如钱包连接、合约交互等
 *
 * 环境兼容性：
 * - 仅支持客户端（浏览器环境）
 * - 需要钱包扩展（如 MetaMask）
 * - 不需要 RPC URL，直接使用钱包提供的 RPC
 *
 * API 使用说明：
 * - 本实现使用现代的 EIP-1193 标准（window.ethereum.request()）
 * - 使用 viem 库来与钱包和区块链交互
 *
 * 依赖：
 * - 需要安装 viem: npm:viem@^2.43.5
 */

// 导入 viem 核心模块
import {
  type Abi,
  type Address,
  type Chain,
  createPublicClient,
  createWalletClient,
  custom,
  getAddress,
  type Hex,
  isAddress as viemIsAddress,
  parseAbi,
  type PublicClient,
  verifyMessage as viemVerifyMessage,
  type WalletClient,
} from "npm:viem@^2.43.5";

/**
 * 扩展 Window 接口以支持 ethereum
 */
interface WindowWithEthereum extends Window {
  ethereum?: {
    request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
    on?: (event: string, callback: (...args: unknown[]) => void) => void;
    removeListener?: (
      event: string,
      callback: (...args: unknown[]) => void,
    ) => void;
  };
}

/**
 * 合约事件回调函数类型
 */
export type ContractEventListener = (event: unknown) => void | Promise<void>;

/**
 * 账户变化回调函数类型
 */
export type AccountsChangedListener = (
  accounts: string[],
) => void | Promise<void>;

/**
 * 链切换回调函数类型
 */
export type ChainChangedListener = (chainId: string) => void | Promise<void>;

/**
 * 合约配置接口
 */
export interface ContractConfig {
  /** 合约名称（用于访问，如 "USDT"、"Node"） */
  name: string;
  /** 合约地址 */
  address: string;
  /** 合约 ABI */
  abi: Abi | Array<Record<string, unknown>>;
}

/**
 * Web3 配置选项（客户端版本，不需要 rpcUrl）
 */
export interface Web3Config {
  /** 链 ID（可选） */
  chainId?: number;
  /** 网络名称（可选） */
  network?: string;
  /** 合约 ABI（已废弃，使用 contracts 配置） */
  abi?: Abi;
  /** 合约地址（已废弃，使用 contracts 配置） */
  address?: string;
  /** 合约配置（单个合约对象或合约数组） */
  contracts?: ContractConfig | ContractConfig[];
  /** 其他配置选项 */
  [key: string]: unknown;
}

/**
 * 合约调用选项
 */
export interface ContractCallOptions {
  /** 合约地址（可选，如果未提供则使用配置中的 address） */
  address?: string;
  /** 函数名 */
  functionName: string;
  /** 函数参数 */
  args?: unknown[];
  /** 交易金额（wei） */
  value?: string | bigint;
  /** Gas 限制 */
  gasLimit?: string | bigint;
  /** 完整 ABI（可选），如果提供则优先使用，如果未提供则使用配置中的 abi */
  abi?: string[] | Array<Record<string, unknown>> | Abi;
}

/**
 * 合约读取选项
 */
export interface ContractReadOptions {
  /** 合约地址（可选，如果未提供则使用配置中的 address） */
  address?: string;
  /** 函数名 */
  functionName: string;
  /** 函数参数 */
  args?: unknown[];
  /** 完整 ABI（可选），如果提供则优先使用，如果未提供则使用配置中的 abi */
  abi?: string[] | Array<Record<string, unknown>> | Abi;
}

/**
 * 合约代理类
 * 提供通过合约名称访问合约的代理功能
 */
class ContractProxy {
  private web3Client: Web3Client;
  private contractConfig: ContractConfig;

  constructor(web3Client: Web3Client, contractConfig: ContractConfig) {
    this.web3Client = web3Client;
    this.contractConfig = contractConfig;
  }

  /**
   * 读取合约数据（只读操作）
   * @param functionName 函数名
   * @param args 函数参数（可选）
   * @returns 函数返回值
   */
  async readContract(
    functionName: string,
    args?: unknown[],
  ): Promise<unknown> {
    return await this.web3Client.readContract({
      address: this.contractConfig.address,
      functionName,
      args,
      abi: this.contractConfig.abi as
        | string[]
        | Array<Record<string, unknown>>
        | Abi,
    });
  }

  /**
   * 调用合约方法（写入操作）
   * @param functionName 函数名
   * @param args 函数参数（可选）
   * @param waitForConfirmation 是否等待交易确认（默认 true）
   * @returns 如果 waitForConfirmation 为 true，返回交易收据；否则返回交易哈希
   */
  async callContract(
    functionName: string,
    args?: unknown[],
    waitForConfirmation: boolean = true,
  ): Promise<unknown> {
    return await this.web3Client.callContract(
      {
        address: this.contractConfig.address,
        functionName,
        args,
        abi: this.contractConfig.abi as
          | string[]
          | Array<Record<string, unknown>>
          | Abi,
      },
      waitForConfirmation,
    );
  }

  /**
   * 获取合约地址
   */
  get address(): string {
    return this.contractConfig.address;
  }

  /**
   * 获取合约 ABI
   */
  get abi(): Abi | Array<Record<string, unknown>> {
    return this.contractConfig.abi;
  }

  /**
   * 获取合约名称
   */
  get name(): string {
    return this.contractConfig.name;
  }
}

/**
 * 合约代理对象类型
 */
type ContractsProxy = {
  [contractName: string]: ContractProxy;
};

/**
 * 客户端 Web3 操作类
 * 提供客户端 Web3 相关的操作方法
 */
export class Web3Client {
  private config: Web3Config;
  private publicClient: PublicClient | null = null;
  private walletClient: WalletClient | null = null;
  private chain: Chain | null = null;
  // 合约代理对象
  public readonly contracts: ContractsProxy;
  // 事件监听器存储
  private contractEventListeners: Map<string, Set<ContractEventListener>> =
    new Map();
  private accountsChangedListeners: Set<AccountsChangedListener> = new Set();
  private chainChangedListeners: Set<ChainChangedListener> = new Set();
  // 钱包事件监听器是否已启动
  private walletListenersStarted: boolean = false;
  // 钱包事件监听器的包装函数（用于移除）
  private walletAccountsChangedWrapper?: (...args: unknown[]) => void;
  private walletChainChangedWrapper?: (...args: unknown[]) => void;
  // viem watch 取消函数
  private contractWatchUnsubscribes: Map<string, () => void> = new Map();

  /**
   * 创建 Web3 客户端实例（客户端版本，不需要 rpcUrl）
   * @param config Web3 配置选项
   */
  constructor(config: Web3Config = {}) {
    this.config = config;

    // 初始化合约代理对象
    const contractsProxy: ContractsProxy = {};
    if (config.contracts) {
      const contracts = Array.isArray(config.contracts)
        ? config.contracts
        : [config.contracts];
      for (const contract of contracts) {
        if (!contract.name) {
          throw new Error("合约配置必须包含 name 字段");
        }
        if (!contract.address) {
          throw new Error(`合约 ${contract.name} 必须包含 address 字段`);
        }
        if (!contract.abi) {
          throw new Error(`合约 ${contract.name} 必须包含 abi 字段`);
        }
        contractsProxy[contract.name] = new ContractProxy(this, contract);
      }
    }
    this.contracts = contractsProxy;
  }

  /**
   * 获取配置
   * @returns 当前配置
   */
  getConfig(): Web3Config {
    return { ...this.config };
  }

  /**
   * 更新配置
   * @param config 新的配置选项
   */
  updateConfig(config: Partial<Web3Config>): void {
    this.config = { ...this.config, ...config };
    // 重置客户端，以便使用新配置
    this.publicClient = null;
    this.walletClient = null;
    this.chain = null;
  }

  /**
   * 获取或创建 PublicClient（懒加载）
   * 客户端版本：只使用 window.ethereum
   * @returns PublicClient 实例
   */
  private getPublicClient(): PublicClient {
    if (this.publicClient) {
      return this.publicClient;
    }

    const win = globalThis.window as WindowWithEthereum;
    if (!win.ethereum) {
      throw new Error("未检测到钱包，请安装 MetaMask 或其他 Web3 钱包");
    }

    try {
      // 使用 custom transport 从 window.ethereum 创建 public client
      this.publicClient = createPublicClient({
        transport: custom(win.ethereum),
      });
      return this.publicClient;
    } catch (error) {
      throw new Error(
        `从钱包创建 PublicClient 失败: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  /**
   * 获取或创建 WalletClient（懒加载）
   * 客户端版本：只使用 window.ethereum
   * @returns WalletClient 实例
   */
  private getWalletClient(): WalletClient {
    if (this.walletClient) {
      return this.walletClient;
    }

    const win = globalThis.window as WindowWithEthereum;
    if (!win.ethereum) {
      throw new Error("未检测到钱包，请安装 MetaMask 或其他 Web3 钱包");
    }

    try {
      // 尝试获取 chain（从 PublicClient 或配置中）
      let chain: Chain | undefined = this.chain || undefined;

      // 如果还没有 chain，尝试从 PublicClient 获取
      if (!chain) {
        try {
          const publicClient = this.getPublicClient();
          chain = (publicClient as any).chain;
          if (chain) {
            this.chain = chain;
          }
        } catch {
          // 如果获取失败，chain 保持为 undefined
        }
      }

      this.walletClient = createWalletClient({
        chain: chain,
        transport: custom(win.ethereum),
      });

      // 如果 walletClient 有 chain 属性，保存它
      if ((this.walletClient as any).chain && !this.chain) {
        this.chain = (this.walletClient as any).chain;
      }

      return this.walletClient;
    } catch (error) {
      throw new Error(
        `从钱包创建 WalletClient 失败: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  /**
   * 连接钱包（浏览器环境）
   * @returns 钱包地址数组
   */
  async connectWallet(): Promise<string[]> {
    const win = globalThis.window as WindowWithEthereum;
    if (!win.ethereum) {
      throw new Error("未检测到钱包，请安装 MetaMask 或其他 Web3 钱包");
    }

    try {
      const accounts = await win.ethereum.request({
        method: "eth_requestAccounts",
      });
      return accounts as string[];
    } catch (error) {
      throw new Error(
        `连接钱包失败: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  /**
   * 获取当前连接的账户地址
   * @returns 账户地址数组
   */
  async getAccounts(): Promise<string[]> {
    const win = globalThis.window as WindowWithEthereum;
    if (!win.ethereum) {
      return [];
    }

    try {
      const accounts = await win.ethereum.request({
        method: "eth_accounts",
      });
      return accounts as string[];
    } catch {
      return [];
    }
  }

  /**
   * 读取合约数据（只读操作）
   * @param options 合约读取选项
   * @returns 函数返回值
   */
  async readContract(options: ContractReadOptions): Promise<unknown> {
    const client = this.getPublicClient();
    const contractAddress = options.address || this.config.address;
    if (!contractAddress) {
      throw new Error(
        "合约地址未提供，请在 options 中提供 address 或在配置中设置 address",
      );
    }

    try {
      let parsedAbi: Abi;

      // 优先使用 options.abi，如果没有则使用配置中的 abi
      const abiSource = options.abi || this.config.abi;

      // 如果提供了完整 ABI，直接使用
      if (abiSource && Array.isArray(abiSource) && abiSource.length > 0) {
        if (typeof abiSource[0] === "string") {
          // 字符串数组格式的 ABI
          parsedAbi = parseAbi(abiSource as string[]);
        } else {
          // JSON 对象数组格式的 ABI
          parsedAbi = abiSource as unknown as Abi;
        }
      } else {
        throw new Error("请提供合约 ABI");
      }

      // 使用 viem 的 readContract
      const result = await client.readContract({
        address: contractAddress as Address,
        abi: parsedAbi,
        functionName: options.functionName,
        args: options.args as any,
      });

      return result;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error
        ? error.message
        : String(error);
      throw new Error(`读取合约失败: ${errorMessage}`);
    }
  }

  /**
   * 调用合约方法（写入操作）
   * @param options 合约调用选项
   * @param waitForConfirmation 是否等待交易确认（默认 true）
   * @returns 如果 waitForConfirmation 为 true，返回交易收据；否则返回交易哈希
   */
  async callContract(
    options: ContractCallOptions,
    waitForConfirmation: boolean = true,
  ): Promise<unknown> {
    const walletClient = this.getWalletClient();
    const accounts = await walletClient.getAddresses();
    if (accounts.length === 0) {
      throw new Error("未找到可用账户，请先连接钱包");
    }

    try {
      // 从配置或选项中获取合约地址
      const contractAddress = options.address || this.config.address;
      if (!contractAddress) {
        throw new Error(
          "合约地址未提供，请在 options 中提供 address 或在配置中设置 address",
        );
      }

      let parsedAbi: Abi;

      // 优先使用 options.abi，如果没有则使用配置中的 abi
      const abiSource = options.abi || this.config.abi;

      // 如果提供了完整 ABI，直接使用
      if (abiSource && Array.isArray(abiSource) && abiSource.length > 0) {
        if (typeof abiSource[0] === "string") {
          // 字符串数组格式的 ABI
          parsedAbi = parseAbi(abiSource as string[]);
        } else {
          // JSON 对象数组格式的 ABI
          parsedAbi = abiSource as unknown as Abi;
        }
      } else {
        throw new Error("请提供合约 ABI");
      }

      // 获取 chain
      let chain: Chain | undefined = (walletClient as any).chain ||
        this.chain || undefined;

      // 如果还是没有 chain，尝试从 PublicClient 获取
      if (!chain) {
        const network = await this.getNetwork();
        chain = {
          id: Number(network.chainId.toString()),
          name: network.name,
        } as unknown as Chain;
      }

      if (!chain) {
        throw new Error("无法获取链信息，请确保钱包已连接");
      }

      // 发送交易
      const hash = await walletClient.writeContract({
        account: accounts[0],
        address: contractAddress as Address,
        abi: parsedAbi,
        functionName: options.functionName,
        args: options.args as any,
        value: options.value ? BigInt(options.value.toString()) : undefined,
        gas: options.gasLimit ? BigInt(options.gasLimit.toString()) : undefined,
        chain: chain,
      });

      // 如果不需要等待确认，直接返回交易哈希
      if (!waitForConfirmation) {
        return hash;
      }

      // 等待交易确认
      const client = this.getPublicClient();
      try {
        const receipt = await client.waitForTransactionReceipt({
          hash: hash as any,
          confirmations: 1,
        });
        return receipt;
      } catch (receiptError) {
        return {
          success: false,
          error: "交易确认失败",
          message: receiptError instanceof Error
            ? receiptError.message
            : String(receiptError),
        };
      }
    } catch (error) {
      const errorMessage = error instanceof Error
        ? error.message
        : String(error);
      if (
        errorMessage.includes("User rejected") ||
        errorMessage.includes("user rejected") ||
        errorMessage.includes("用户取消") ||
        errorMessage.includes("用户拒绝")
      ) {
        throw new Error("交易已取消");
      }
      throw new Error(`调用合约失败: ${errorMessage}`);
    }
  }

  /**
   * 监听合约事件
   * @param contractAddress 合约地址
   * @param eventName 事件名称（如 'Transfer'）
   * @param callback 回调函数，接收事件数据
   * @param abi 合约 ABI（可选）
   * @returns 取消监听的函数
   */
  onContractEvent(
    contractAddress: string,
    eventName: string,
    callback: ContractEventListener,
    abi?: string[] | Abi,
  ): () => void {
    const key = `${contractAddress}:${eventName}`;
    if (!this.contractEventListeners.has(key)) {
      this.contractEventListeners.set(key, new Set());
    }
    const listeners = this.contractEventListeners.get(key)!;
    listeners.add(callback);

    // 启动合约事件监听
    this.startContractEventListener(contractAddress, eventName, abi);

    // 返回取消监听的函数
    return () => {
      listeners.delete(callback);
      // 如果没有监听器了，停止监听
      if (listeners.size === 0) {
        this.stopContractEventListener(contractAddress, eventName);
        this.contractEventListeners.delete(key);
      }
    };
  }

  /**
   * 启动合约事件监听
   */
  private startContractEventListener(
    contractAddress: string,
    eventName: string,
    abi?: string[] | Abi,
  ): void {
    const key = `${contractAddress}:${eventName}`;

    // 如果已经有监听器在运行，不需要重新启动
    if (this.contractWatchUnsubscribes.has(key)) {
      return;
    }

    try {
      const client = this.getPublicClient();

      // 构建 ABI
      const eventAbi = abi
        ? (typeof abi[0] === "string"
          ? parseAbi(abi as string[])
          : (abi as unknown as Abi))
        : parseAbi([`event ${eventName}()`] as readonly string[]);

      // 使用 viem 的 watchContractEvent 监听合约事件
      const unsubscribe = client.watchContractEvent({
        address: contractAddress as Address,
        abi: eventAbi,
        eventName: eventName,
        onLogs: async (logs) => {
          const listeners = this.contractEventListeners.get(key);
          if (listeners) {
            for (const log of logs) {
              for (const listener of listeners) {
                try {
                  await Promise.resolve(listener(log));
                } catch (error) {
                  console.error("[Web3Client] 合约事件监听器错误:", error);
                }
              }
            }
          }
        },
        onError: (error) => {
          console.error("[Web3Client] 合约事件监听错误:", error);
        },
      });

      // 保存取消函数
      this.contractWatchUnsubscribes.set(key, unsubscribe);
    } catch (error) {
      console.error(
        `[Web3Client] 启动合约事件监听失败 (${contractAddress}:${eventName}):`,
        error,
      );
    }
  }

  /**
   * 停止合约事件监听
   */
  private stopContractEventListener(
    contractAddress: string,
    eventName: string,
  ): void {
    const key = `${contractAddress}:${eventName}`;

    try {
      // 取消 viem watch
      const unsubscribe = this.contractWatchUnsubscribes.get(key);
      if (unsubscribe) {
        unsubscribe();
        this.contractWatchUnsubscribes.delete(key);
      }
    } catch (error) {
      console.error(
        `[Web3Client] 停止合约事件监听失败 (${contractAddress}:${eventName}):`,
        error,
      );
    }
  }

  /**
   * 取消合约事件监听
   * @param contractAddress 合约地址
   * @param eventName 事件名称（可选，如果不提供则取消该合约的所有事件监听）
   */
  offContractEvent(contractAddress: string, eventName?: string): void {
    if (eventName) {
      const key = `${contractAddress}:${eventName}`;
      this.contractEventListeners.delete(key);
      this.stopContractEventListener(contractAddress, eventName);
    } else {
      // 取消该合约的所有事件监听
      for (const [key, listeners] of this.contractEventListeners.entries()) {
        if (key.startsWith(`${contractAddress}:`)) {
          const eventName = key.split(":")[1];
          this.stopContractEventListener(contractAddress, eventName);
          listeners.clear();
          this.contractEventListeners.delete(key);
        }
      }
    }
  }

  /**
   * 监听账户变化（钱包环境）
   * @param callback 回调函数，接收账户地址数组
   * @returns 取消监听的函数
   */
  onAccountsChanged(callback: AccountsChangedListener): () => void {
    this.accountsChangedListeners.add(callback);

    // 如果还没有启动监听，则启动
    if (!this.walletListenersStarted) {
      this.startWalletListeners();
    }

    // 返回取消监听的函数
    return () => {
      this.accountsChangedListeners.delete(callback);
      // 如果没有监听器了，停止监听
      if (
        this.accountsChangedListeners.size === 0 &&
        this.chainChangedListeners.size === 0
      ) {
        this.stopWalletListeners();
      }
    };
  }

  /**
   * 监听链切换（钱包环境）
   * @param callback 回调函数，接收链 ID（十六进制字符串）
   * @returns 取消监听的函数
   */
  onChainChanged(callback: ChainChangedListener): () => void {
    this.chainChangedListeners.add(callback);

    // 如果还没有启动监听，则启动
    if (!this.walletListenersStarted) {
      this.startWalletListeners();
    }

    // 返回取消监听的函数
    return () => {
      this.chainChangedListeners.delete(callback);
      // 如果没有监听器了，停止监听
      if (
        this.accountsChangedListeners.size === 0 &&
        this.chainChangedListeners.size === 0
      ) {
        this.stopWalletListeners();
      }
    };
  }

  /**
   * 启动钱包事件监听
   */
  private startWalletListeners(): void {
    if (this.walletListenersStarted) {
      return;
    }

    const win = globalThis.window as WindowWithEthereum;
    if (!win.ethereum || !win.ethereum.on) {
      return;
    }

    this.walletListenersStarted = true;

    // 创建包装函数用于账户变化监听
    this.walletAccountsChangedWrapper = (...args: unknown[]) => {
      const accounts = args[0] as string[];
      for (const listener of this.accountsChangedListeners) {
        try {
          Promise.resolve(listener(accounts)).catch((error) => {
            console.error("[Web3Client] 账户变化监听器错误:", error);
          });
        } catch (error) {
          console.error("[Web3Client] 账户变化监听器错误:", error);
        }
      }
    };

    // 创建包装函数用于链切换监听
    this.walletChainChangedWrapper = (...args: unknown[]) => {
      const chainId = args[0] as string;

      // 清除 publicClient 和 walletClient 缓存
      this.publicClient = null;
      this.walletClient = null;

      for (const listener of this.chainChangedListeners) {
        try {
          Promise.resolve(listener(chainId)).catch((error) => {
            console.error("[Web3Client] 链切换监听器错误:", error);
          });
        } catch (error) {
          console.error("[Web3Client] 链切换监听器错误:", error);
        }
      }
    };

    // 监听账户变化
    win.ethereum.on("accountsChanged", this.walletAccountsChangedWrapper);

    // 监听链切换
    win.ethereum.on("chainChanged", this.walletChainChangedWrapper);
  }

  /**
   * 停止钱包事件监听
   */
  private stopWalletListeners(): void {
    if (!this.walletListenersStarted) {
      return;
    }

    const win = globalThis.window as WindowWithEthereum;
    if (win.ethereum && win.ethereum.removeListener) {
      // 移除账户变化监听器
      if (this.walletAccountsChangedWrapper) {
        win.ethereum.removeListener(
          "accountsChanged",
          this.walletAccountsChangedWrapper,
        );
        this.walletAccountsChangedWrapper = undefined;
      }
      // 移除链切换监听器
      if (this.walletChainChangedWrapper) {
        win.ethereum.removeListener(
          "chainChanged",
          this.walletChainChangedWrapper,
        );
        this.walletChainChangedWrapper = undefined;
      }
    }

    this.walletListenersStarted = false;
  }

  /**
   * 取消所有账户变化监听
   */
  offAccountsChanged(): void {
    this.accountsChangedListeners.clear();
    if (this.chainChangedListeners.size === 0) {
      this.stopWalletListeners();
    }
  }

  /**
   * 取消所有链切换监听
   */
  offChainChanged(): void {
    this.chainChangedListeners.clear();
    if (this.accountsChangedListeners.size === 0) {
      this.stopWalletListeners();
    }
  }

  /**
   * 获取网络信息
   * @returns 网络信息（包含 chainId、name 等）
   */
  async getNetwork(): Promise<{ chainId: number; name: string }> {
    const client = this.getPublicClient();
    try {
      const chainId = await client.getChainId();

      let name = `chain-${chainId}`;
      if (this.chain) {
        name = this.chain.name;
      } else {
        try {
          const chain = (client as any).chain;
          if (chain && chain.name) {
            name = chain.name;
            this.chain = chain;
          }
        } catch {
          // 如果无法获取链名称，使用默认格式
        }
      }

      return {
        chainId: Number(chainId),
        name,
      };
    } catch (error) {
      const errorMessage = error instanceof Error
        ? error.message
        : String(error);
      throw new Error(`获取网络信息失败: ${errorMessage}`);
    }
  }

  /**
   * 获取链 ID
   * @returns 链 ID
   */
  async getChainId(): Promise<number> {
    const network = await this.getNetwork();
    return network.chainId;
  }

  /**
   * 签名消息
   * @param message 要签名的消息
   * @returns 签名结果
   */
  async signMessage(message: string): Promise<string> {
    const walletClient = this.getWalletClient();
    const accounts = await walletClient.getAddresses();
    if (accounts.length === 0) {
      throw new Error("未找到可用账户，请先连接钱包");
    }

    try {
      const signature = await walletClient.signMessage({
        account: accounts[0],
        message,
      });
      return signature;
    } catch (error) {
      throw new Error(
        `签名消息失败: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  /**
   * 验证消息签名
   * @param message 原始消息
   * @param signature 签名
   * @param address 签名者地址
   * @returns 是否验证通过
   */
  async verifyMessage(
    message: string,
    signature: string,
    address: string,
  ): Promise<boolean> {
    try {
      const isValid = await viemVerifyMessage({
        address: address as Address,
        message,
        signature: signature as Hex,
      });
      return isValid;
    } catch (error) {
      throw new Error(
        `验证签名失败: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }
}

/**
 * 创建 Web3 客户端实例（便捷函数）
 * @param config Web3 配置选项
 * @returns Web3 客户端实例
 */
export function createWeb3Client(config: Web3Config = {}): Web3Client {
  return new Web3Client(config);
}

// ==================== Web3 工具函数 ====================

/**
 * 以太坊单位枚举
 */
export enum Unit {
  wei = "wei",
  kwei = "kwei",
  mwei = "mwei",
  gwei = "gwei",
  szabo = "szabo",
  finney = "finney",
  ether = "ether",
}

/**
 * 单位转换表（相对于 wei 的倍数）
 */
const UNIT_MAP: Record<string, bigint> = {
  wei: BigInt(1),
  kwei: BigInt(1000),
  mwei: BigInt(1000000),
  gwei: BigInt(1000000000),
  szabo: BigInt(1000000000000),
  finney: BigInt(1000000000000000),
  ether: BigInt(1000000000000000000),
};

/**
 * 从 wei 转换为其他单位
 * @param value wei 值（字符串或 bigint）
 * @param unit 目标单位（默认 'ether'）
 * @returns 转换后的值（字符串）
 *
 * @example
 * fromWei('1000000000000000000', 'ether') // '1.0'
 * fromWei('1000000000', 'gwei') // '1.0'
 */
export function fromWei(
  value: string | bigint,
  unit: string = "ether",
): string {
  const weiValue = typeof value === "string" ? BigInt(value) : value;
  const unitMultiplier = UNIT_MAP[unit.toLowerCase()];

  if (!unitMultiplier) {
    throw new Error(`未知的单位: ${unit}`);
  }

  // 转换为目标单位（保留 18 位小数精度）
  const result = Number(weiValue) / Number(unitMultiplier);
  return result.toString();
}

/**
 * 转换为 wei
 * @param value 数值（字符串或数字）
 * @param unit 源单位（默认 'ether'）
 * @returns wei 值（字符串）
 *
 * @example
 * toWei('1', 'ether') // '1000000000000000000'
 * toWei('1', 'gwei') // '1000000000'
 */
export function toWei(value: string | number, unit: string = "ether"): string {
  const numValue = typeof value === "string" ? parseFloat(value) : value;
  const unitMultiplier = UNIT_MAP[unit.toLowerCase()];

  if (!unitMultiplier) {
    throw new Error(`未知的单位: ${unit}`);
  }

  // 转换为 wei
  const result = BigInt(Math.floor(numValue * Number(unitMultiplier)));
  return result.toString();
}

/**
 * 验证以太坊地址格式
 * @param address 地址字符串
 * @returns 是否为有效地址
 *
 * @example
 * isAddress('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb') // true
 */
export function isAddress(address: string): boolean {
  if (!address || typeof address !== "string") {
    return false;
  }

  // 使用 viem 的 isAddress
  try {
    return viemIsAddress(address);
  } catch {
    return false;
  }
}

/**
 * 转换为校验和地址（EIP-55）
 * @param address 地址字符串
 * @returns 校验和地址
 *
 * @example
 * toChecksumAddress('0x742d35cc6634c0532925a3b844bc9e7595f0beb')
 * // '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb'
 */
export function toChecksumAddress(address: string): string {
  // 使用 viem 的 isAddress 函数
  if (!viemIsAddress(address)) {
    throw new Error(`无效的地址: ${address}`);
  }

  // 移除 0x 前缀并转为小写
  const addr = address.startsWith("0x")
    ? address.slice(2).toLowerCase()
    : address.toLowerCase();

  // 使用 viem 的 getAddress 生成校验和地址
  try {
    return getAddress("0x" + addr);
  } catch {
    // 如果失败，返回小写地址
    return "0x" + addr;
  }
}

/**
 * 格式化地址（添加 0x 前缀，转换为校验和地址）
 * @param address 地址字符串
 * @returns 格式化后的地址（校验和格式）
 *
 * @example
 * formatAddress('742d35cc6634c0532925a3b844bc9e7595f0beb')
 * // '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb'
 */
export function formatAddress(address: string): string {
  // 使用 viem 的 isAddress 函数
  if (!viemIsAddress(address)) {
    throw new Error(`无效的地址: ${address}`);
  }

  // 确保有 0x 前缀
  const addrWithPrefix = address.startsWith("0x") ? address : "0x" + address;

  // 使用 toChecksumAddress 转换为校验和地址
  return toChecksumAddress(addrWithPrefix);
}
