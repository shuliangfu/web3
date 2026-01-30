/**
 * 合约代理模块（内部使用，不通过 deno.json exports 暴露）
 * 提供 ContractProxy、buildContractsProxy，供服务端 mod 与客户端 client 共用
 */

import type { Abi } from "viem";

/**
 * Web3 客户端最小接口，供 ContractProxy 使用
 * 仅依赖 readContract、callContract，使服务端/客户端 Web3Client 均可复用
 */
export interface IWeb3ClientForProxy {
  readContract(opts: {
    address: string;
    functionName: string;
    args?: unknown[];
    abi: string[] | Array<Record<string, unknown>> | Abi;
  }): Promise<unknown>;
  callContract(
    opts: {
      address: string;
      functionName: string;
      args?: unknown[];
      abi: string[] | Array<Record<string, unknown>> | Abi;
    },
    waitForConfirmation?: boolean,
  ): Promise<unknown>;
}

/**
 * 合约配置的最小形状，用于 buildContractsProxy
 * 与 mod/client 的 ContractConfig 兼容
 */
export interface ContractConfigForProxy {
  name: string;
  address: string;
  abi: Abi | Array<Record<string, unknown>>;
}

/**
 * 合约代理类
 * 提供通过合约名称访问合约的代理功能，仅依赖 IWeb3ClientForProxy
 */
export class ContractProxy {
  private web3Client: IWeb3ClientForProxy;
  private contractConfig: ContractConfigForProxy;

  constructor(
    web3Client: IWeb3ClientForProxy,
    contractConfig: ContractConfigForProxy,
  ) {
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
   * 读取合约的公有属性（便捷方法）
   * Solidity 的公有状态变量会自动生成 getter 函数，此方法用于调用这些 getter
   * @param propertyName 属性名（对应 Solidity 中的公有状态变量名）
   * @returns 属性值
   *
   * @example
   * // 假设合约有：uint256 public totalSupply;
   * const totalSupply = await contract.readProperty('totalSupply');
   */
  async readProperty(propertyName: string): Promise<unknown> {
    // 公有属性的 getter 函数名就是属性名本身，无参数
    return await this.readContract(propertyName);
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

  /** 获取合约地址 */
  get address(): string {
    return this.contractConfig.address;
  }

  /** 获取合约 ABI */
  get abi(): Abi | Array<Record<string, unknown>> {
    return this.contractConfig.abi;
  }

  /** 获取合约名称 */
  get name(): string {
    return this.contractConfig.name;
  }
}

/**
 * 合约代理对象类型
 */
export type ContractsProxy = {
  [contractName: string]: ContractProxy;
};

/**
 * 根据合约配置构建 contracts 代理对象
 * @param client 满足 IWeb3ClientForProxy 的 Web3 客户端（如 Web3Client）
 * @param contracts 单个合约配置、合约配置数组，或 undefined
 * @returns ContractsProxy，无合约时返回空对象
 */
export function buildContractsProxy(
  client: IWeb3ClientForProxy,
  contracts:
    | ContractConfigForProxy
    | ContractConfigForProxy[]
    | undefined,
): ContractsProxy {
  const contractsProxy: ContractsProxy = {};
  if (!contracts) {
    return contractsProxy;
  }
  const list = Array.isArray(contracts) ? contracts : [contracts];
  for (const contract of list) {
    if (!contract.name) {
      throw new Error("合约配置必须包含 name 字段");
    }
    if (!contract.address) {
      throw new Error(`合约 ${contract.name} 必须包含 address 字段`);
    }
    if (!contract.abi) {
      throw new Error(`合约 ${contract.name} 必须包含 abi 字段`);
    }
    contractsProxy[contract.name] = new ContractProxy(client, contract);
  }
  return contractsProxy;
}
