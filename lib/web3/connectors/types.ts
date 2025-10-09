/**
 * TypeScript types for dynamic connector loading system
 *
 * Provides type definitions for lazy-loaded wallet connectors with loading states,
 * error handling, and factory patterns. Supports dynamic imports for bundle optimization.
 */

import type {CreateConnectorFn} from '@wagmi/core'

/**
 * Loading state for dynamic connector imports
 */
export type ConnectorLoadingState = 'idle' | 'loading' | 'loaded' | 'error'

/**
 * Error information for failed connector loading
 */
export interface ConnectorLoadError {
  code: 'IMPORT_FAILED' | 'INITIALIZATION_FAILED' | 'UNSUPPORTED_ENVIRONMENT'
  message: string
  originalError?: Error
  timestamp: number
}

/**
 * Dynamic connector with loading state tracking
 */
export interface DynamicConnector<TParameters = Record<string, unknown>> {
  /**
   * Unique identifier for the connector
   */
  id: string

  /**
   * Display name for the connector
   */
  name: string

  /**
   * Current loading state
   */
  state: ConnectorLoadingState

  /**
   * Error information if loading failed
   */
  error?: ConnectorLoadError

  /**
   * Load the connector dynamically
   * @param parameters - Connector-specific configuration parameters
   * @returns Promise resolving to the connector factory function
   */
  load: (parameters?: TParameters) => Promise<CreateConnectorFn>

  /**
   * Prefetch the connector module without initializing
   * Used for hover/interaction prefetching to reduce perceived latency
   */
  prefetch: () => Promise<void>
}

/**
 * Factory function for creating dynamic connectors
 */
export type DynamicConnectorFactory<TParameters = Record<string, unknown>> = (
  parameters?: TParameters,
) => DynamicConnector<TParameters>

/**
 * Telemetry data for connector loading performance
 */
export interface ConnectorLoadTelemetry {
  connectorId: string
  startTime: number
  endTime?: number
  duration?: number
  success: boolean
  error?: ConnectorLoadError
  prefetched: boolean
}

/**
 * Configuration for dynamic connector factory
 */
export interface DynamicConnectorFactoryConfig {
  /**
   * Enable telemetry collection for performance monitoring
   * @default false
   */
  enableTelemetry?: boolean

  /**
   * Callback for telemetry events
   */
  onTelemetry?: (telemetry: ConnectorLoadTelemetry) => void

  /**
   * Maximum retries for failed dynamic imports
   * @default 3
   */
  maxRetries?: number

  /**
   * Delay between retries in milliseconds
   * @default 1000
   */
  retryDelay?: number
}

/**
 * Re-export Wagmi connector parameter types for convenience
 */
export type {CoinbaseWalletParameters} from 'wagmi/connectors'
export type {WalletConnectParameters} from 'wagmi/connectors'
export type {InjectedParameters} from 'wagmi/connectors'
