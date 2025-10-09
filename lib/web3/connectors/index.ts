/**
 * Dynamic connector factory with centralized management
 *
 * Provides a unified interface for managing dynamic wallet connectors with:
 * - Centralized loading state tracking
 * - Error handling and retry logic
 * - Telemetry collection for performance monitoring
 * - Prefetching support for improved UX
 * - Type-safe connector access
 *
 * This factory coordinates the loading of all wallet connectors (MetaMask,
 * WalletConnect, Coinbase) and provides observability into the loading process.
 */

import type {CreateConnectorFn} from '@wagmi/core'
import type {
  CoinbaseWalletParameters,
  ConnectorLoadTelemetry,
  DynamicConnector,
  DynamicConnectorFactoryConfig,
  InjectedParameters,
  WalletConnectParameters,
} from './types'

import {dynamicCoinbaseWallet} from './dynamic-coinbase'
import {dynamicMetaMask} from './dynamic-metamask'
import {dynamicWalletConnect} from './dynamic-walletconnect'

/**
 * Wallet connector identifiers
 */
export type WalletConnectorId = 'coinbase' | 'metamask' | 'walletconnect'

/**
 * Map of connector IDs to parameter types
 */
export interface ConnectorParameters {
  coinbase: CoinbaseWalletParameters
  metamask: InjectedParameters
  walletconnect: WalletConnectParameters
}

/**
 * Centralized connector factory for managing all dynamic connectors
 */
export class DynamicConnectorFactory {
  private readonly connectors: Map<WalletConnectorId, DynamicConnector>
  private telemetry: ConnectorLoadTelemetry[]
  private readonly config: Required<DynamicConnectorFactoryConfig>

  constructor(config: DynamicConnectorFactoryConfig = {}) {
    this.connectors = new Map()
    this.telemetry = []
    this.config = {
      enableTelemetry: config.enableTelemetry ?? false,
      onTelemetry: config.onTelemetry ?? (() => {}),
      maxRetries: config.maxRetries ?? 3,
      retryDelay: config.retryDelay ?? 1000,
    }
  }

  /**
   * Initialize connector instances with their configurations
   *
   * @param parameters - Configuration parameters for each connector
   * @param parameters.coinbase - Optional Coinbase Wallet configuration
   * @param parameters.metamask - Optional MetaMask configuration
   * @param parameters.walletconnect - Required WalletConnect configuration (projectId required)
   */
  initialize(parameters: {
    coinbase?: CoinbaseWalletParameters
    metamask?: InjectedParameters
    walletconnect: WalletConnectParameters // Required for WalletConnect
  }): void {
    // Initialize Coinbase connector
    this.connectors.set(
      'coinbase',
      dynamicCoinbaseWallet(parameters.coinbase) as DynamicConnector<Record<string, unknown>>,
    )

    // Initialize MetaMask connector
    this.connectors.set('metamask', dynamicMetaMask(parameters.metamask) as DynamicConnector<Record<string, unknown>>)

    // Initialize WalletConnect connector (projectId required)
    this.connectors.set(
      'walletconnect',
      dynamicWalletConnect(parameters.walletconnect) as DynamicConnector<Record<string, unknown>>,
    )
  }

  /**
   * Get a dynamic connector by ID
   *
   * @param id - Connector identifier
   * @returns Dynamic connector instance
   * @throws Error if connector not found or not initialized
   */
  getConnector<T extends WalletConnectorId>(id: T): DynamicConnector<ConnectorParameters[T]> {
    const connector = this.connectors.get(id)
    if (!connector) {
      throw new Error(
        `Connector '${id}' not found. Did you forget to call initialize()? Available connectors: ${Array.from(this.connectors.keys()).join(', ')}`,
      )
    }
    return connector as DynamicConnector<ConnectorParameters[T]>
  }

  /**
   * Load a connector with telemetry tracking
   *
   * @param id - Connector identifier
   * @param parameters - Optional connector-specific parameters
   * @returns Promise resolving to the connector factory function
   */
  async loadConnector<T extends WalletConnectorId>(
    id: T,
    parameters?: ConnectorParameters[T],
  ): Promise<CreateConnectorFn> {
    const connector = this.getConnector(id)
    const telemetryEntry: ConnectorLoadTelemetry = {
      connectorId: id,
      startTime: Date.now(),
      success: false,
      prefetched: connector.state === 'loaded',
    }

    try {
      const result = await this.loadWithRetry(connector, parameters)
      telemetryEntry.endTime = Date.now()
      telemetryEntry.duration = telemetryEntry.endTime - telemetryEntry.startTime
      telemetryEntry.success = true

      this.recordTelemetry(telemetryEntry)
      return result
    } catch (error) {
      telemetryEntry.endTime = Date.now()
      telemetryEntry.duration = telemetryEntry.endTime - telemetryEntry.startTime
      telemetryEntry.success = false
      telemetryEntry.error = connector.error

      this.recordTelemetry(telemetryEntry)
      throw error
    }
  }

  /**
   * Load connector with retry logic
   */
  private async loadWithRetry<TParams>(
    connector: DynamicConnector<TParams>,
    parameters?: TParams,
  ): Promise<CreateConnectorFn> {
    let lastError: Error | undefined

    for (let attempt = 0; attempt < this.config.maxRetries; attempt++) {
      try {
        return await connector.load(parameters)
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error))

        if (attempt < this.config.maxRetries - 1) {
          console.warn(`Connector load failed (attempt ${attempt + 1}/${this.config.maxRetries}), retrying...`)
          await this.delay(this.config.retryDelay)
        }
      }
    }

    throw lastError ?? new Error('Failed to load connector after maximum retries')
  }

  /**
   * Prefetch a connector module for faster loading
   *
   * @param id - Connector identifier
   */
  async prefetchConnector(id: WalletConnectorId): Promise<void> {
    const connector = this.getConnector(id)
    await connector.prefetch()
  }

  /**
   * Prefetch all connectors
   */
  async prefetchAll(): Promise<void> {
    await Promise.all(
      Array.from(this.connectors.values()).map(async connector => {
        await connector.prefetch()
      }),
    )
  }

  /**
   * Get all connector IDs
   */
  getConnectorIds(): WalletConnectorId[] {
    return Array.from(this.connectors.keys())
  }

  /**
   * Get telemetry data
   */
  getTelemetry(): ConnectorLoadTelemetry[] {
    return [...this.telemetry]
  }

  /**
   * Clear telemetry data
   */
  clearTelemetry(): void {
    this.telemetry = []
  }

  /**
   * Record telemetry entry
   */
  private recordTelemetry(entry: ConnectorLoadTelemetry): void {
    if (this.config.enableTelemetry) {
      this.telemetry.push(entry)
      this.config.onTelemetry(entry)
    }
  }

  /**
   * Delay helper for retry logic
   */
  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

/**
 * Create a dynamic connector factory instance
 *
 * @param config - Factory configuration
 * @returns DynamicConnectorFactory instance
 *
 * @example
 * ```typescript
 * import { createDynamicConnectorFactory } from './connectors'
 *
 * const factory = createDynamicConnectorFactory({
 *   enableTelemetry: true,
 *   onTelemetry: (data) => console.log('Connector loaded:', data)
 * })
 *
 * factory.initialize({
 *   coinbase: { appName: 'Token Toilet' },
 *   metamask: { shimDisconnect: true },
 *   walletconnect: { projectId: 'YOUR_PROJECT_ID' }
 * })
 *
 * // Prefetch on hover
 * await factory.prefetchConnector('coinbase')
 *
 * // Load on click
 * const connector = await factory.loadConnector('coinbase')
 * ```
 */
export function createDynamicConnectorFactory(config?: DynamicConnectorFactoryConfig): DynamicConnectorFactory {
  return new DynamicConnectorFactory(config)
}
