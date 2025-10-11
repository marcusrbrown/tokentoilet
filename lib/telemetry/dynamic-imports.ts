/**
 * Telemetry utilities for tracking dynamic import performance and errors
 */

export interface DynamicImportMetrics {
  componentName: string
  loadTimeMs: number
  success: boolean
  error?: string
  timestamp: number
  retryCount?: number
}

interface TelemetryConfig {
  enabled: boolean
  debug: boolean
  sendToAnalytics: boolean
}

const defaultConfig: TelemetryConfig = {
  enabled: typeof window !== 'undefined' && process.env.NODE_ENV === 'production',
  debug: process.env.NODE_ENV === 'development',
  sendToAnalytics: typeof window !== 'undefined' && 'gtag' in window,
}

let config = {...defaultConfig}

export function configureTelemetry(options: Partial<TelemetryConfig>) {
  config = {...config, ...options}
}

export function resetTelemetryConfig() {
  config = {...defaultConfig}
}

const metrics: DynamicImportMetrics[] = []

export function trackDynamicImport(metric: DynamicImportMetrics): void {
  if (!config.enabled) {
    return
  }

  metrics.push(metric)

  if (config.debug) {
    console.error('[Telemetry] Dynamic import:', {
      component: metric.componentName,
      loadTime: `${metric.loadTimeMs}ms`,
      success: metric.success,
      error: metric.error,
      retryCount: metric.retryCount,
    })
  }

  if (config.sendToAnalytics && typeof window !== 'undefined' && 'gtag' in window) {
    const gtag = (window as {gtag?: (...args: unknown[]) => void}).gtag

    if (metric.success) {
      gtag?.('event', 'dynamic_import_success', {
        event_category: 'performance',
        event_label: metric.componentName,
        value: Math.round(metric.loadTimeMs),
        retry_count: metric.retryCount ?? 0,
      })
    } else {
      gtag?.('event', 'dynamic_import_error', {
        event_category: 'error',
        event_label: metric.componentName,
        error_message: metric.error,
        retry_count: metric.retryCount ?? 0,
      })
    }
  }
}

export function getDynamicImportMetrics(): readonly DynamicImportMetrics[] {
  return [...metrics]
}

export function clearDynamicImportMetrics(): void {
  metrics.length = 0
}

export function getAverageLoadTime(componentName?: string): number {
  const relevantMetrics =
    componentName !== undefined && componentName !== ''
      ? metrics.filter(m => m.componentName === componentName && m.success)
      : metrics.filter(m => m.success)

  if (relevantMetrics.length === 0) {
    return 0
  }

  const totalTime = relevantMetrics.reduce((sum, m) => sum + m.loadTimeMs, 0)
  return totalTime / relevantMetrics.length
}

export function getErrorRate(componentName?: string): number {
  const relevantMetrics =
    componentName !== undefined && componentName !== ''
      ? metrics.filter(m => m.componentName === componentName)
      : metrics

  if (relevantMetrics.length === 0) {
    return 0
  }

  const errorCount = relevantMetrics.filter(m => !m.success).length
  return errorCount / relevantMetrics.length
}

/**
 * Higher-order component wrapper for tracking dynamic import performance
 */
export function withDynamicImportTracking<P extends object>(
  componentName: string,
  importFn: () => Promise<{default: React.ComponentType<P>}>,
): () => Promise<{default: React.ComponentType<P>}> {
  return async () => {
    const startTime = performance.now()
    const retryCount = 0

    try {
      const loadedModule = await importFn()
      const loadTimeMs = performance.now() - startTime

      trackDynamicImport({
        componentName,
        loadTimeMs,
        success: true,
        timestamp: Date.now(),
        retryCount,
      })

      return loadedModule
    } catch (error) {
      const loadTimeMs = performance.now() - startTime

      trackDynamicImport({
        componentName,
        loadTimeMs,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: Date.now(),
        retryCount,
      })

      throw error
    }
  }
}

/**
 * Telemetry tracker for tracking component mount/unmount in relation to dynamic imports
 */
export function createDynamicImportTelemetry(componentName: string) {
  const mountTime = Date.now()

  return {
    trackError: (error: Error, retryCount = 0) => {
      trackDynamicImport({
        componentName,
        loadTimeMs: Date.now() - mountTime,
        success: false,
        error: error.message,
        timestamp: Date.now(),
        retryCount,
      })
    },
    trackSuccess: (retryCount = 0) => {
      trackDynamicImport({
        componentName,
        loadTimeMs: Date.now() - mountTime,
        success: true,
        timestamp: Date.now(),
        retryCount,
      })
    },
  }
}
