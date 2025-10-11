import {beforeEach, describe, expect, it, vi} from 'vitest'

import {
  clearDynamicImportMetrics,
  configureTelemetry,
  createDynamicImportTelemetry,
  getAverageLoadTime,
  getDynamicImportMetrics,
  getErrorRate,
  resetTelemetryConfig,
  trackDynamicImport,
  withDynamicImportTracking,
} from './dynamic-imports'

describe('Dynamic Import Telemetry', () => {
  beforeEach(() => {
    clearDynamicImportMetrics()
    resetTelemetryConfig()
    configureTelemetry({enabled: true, debug: false, sendToAnalytics: false})
  })

  describe('trackDynamicImport', () => {
    it('should track successful imports', () => {
      trackDynamicImport({
        componentName: 'TestComponent',
        loadTimeMs: 150,
        success: true,
        timestamp: Date.now(),
      })

      const metrics = getDynamicImportMetrics()
      expect(metrics).toHaveLength(1)
      expect(metrics[0]?.componentName).toBe('TestComponent')
      expect(metrics[0]?.success).toBe(true)
    })

    it('should track failed imports', () => {
      trackDynamicImport({
        componentName: 'TestComponent',
        loadTimeMs: 50,
        success: false,
        error: 'Network error',
        timestamp: Date.now(),
      })

      const metrics = getDynamicImportMetrics()
      expect(metrics).toHaveLength(1)
      expect(metrics[0]?.success).toBe(false)
      expect(metrics[0]?.error).toBe('Network error')
    })

    it('should track retry attempts', () => {
      trackDynamicImport({
        componentName: 'TestComponent',
        loadTimeMs: 200,
        success: true,
        timestamp: Date.now(),
        retryCount: 2,
      })

      const metrics = getDynamicImportMetrics()
      expect(metrics[0]?.retryCount).toBe(2)
    })

    it('should not track when disabled', () => {
      configureTelemetry({enabled: false})

      trackDynamicImport({
        componentName: 'TestComponent',
        loadTimeMs: 150,
        success: true,
        timestamp: Date.now(),
      })

      const metrics = getDynamicImportMetrics()
      expect(metrics).toHaveLength(0)
    })
  })

  describe('getAverageLoadTime', () => {
    it('should calculate average load time for all successful imports', () => {
      trackDynamicImport({
        componentName: 'Component1',
        loadTimeMs: 100,
        success: true,
        timestamp: Date.now(),
      })
      trackDynamicImport({
        componentName: 'Component2',
        loadTimeMs: 200,
        success: true,
        timestamp: Date.now(),
      })
      trackDynamicImport({
        componentName: 'Component3',
        loadTimeMs: 150,
        success: true,
        timestamp: Date.now(),
      })

      const avgTime = getAverageLoadTime()
      expect(avgTime).toBe(150)
    })

    it('should calculate average for specific component', () => {
      trackDynamicImport({
        componentName: 'Component1',
        loadTimeMs: 100,
        success: true,
        timestamp: Date.now(),
      })
      trackDynamicImport({
        componentName: 'Component1',
        loadTimeMs: 200,
        success: true,
        timestamp: Date.now(),
      })
      trackDynamicImport({
        componentName: 'Component2',
        loadTimeMs: 500,
        success: true,
        timestamp: Date.now(),
      })

      const avgTime = getAverageLoadTime('Component1')
      expect(avgTime).toBe(150)
    })

    it('should exclude failed imports', () => {
      trackDynamicImport({
        componentName: 'Component1',
        loadTimeMs: 100,
        success: true,
        timestamp: Date.now(),
      })
      trackDynamicImport({
        componentName: 'Component1',
        loadTimeMs: 50,
        success: false,
        timestamp: Date.now(),
      })

      const avgTime = getAverageLoadTime('Component1')
      expect(avgTime).toBe(100)
    })

    it('should return 0 when no metrics', () => {
      expect(getAverageLoadTime()).toBe(0)
    })
  })

  describe('getErrorRate', () => {
    it('should calculate error rate for all imports', () => {
      trackDynamicImport({
        componentName: 'Component1',
        loadTimeMs: 100,
        success: true,
        timestamp: Date.now(),
      })
      trackDynamicImport({
        componentName: 'Component2',
        loadTimeMs: 50,
        success: false,
        timestamp: Date.now(),
      })
      trackDynamicImport({
        componentName: 'Component3',
        loadTimeMs: 50,
        success: false,
        timestamp: Date.now(),
      })

      const errorRate = getErrorRate()
      expect(errorRate).toBeCloseTo(0.667, 2)
    })

    it('should calculate error rate for specific component', () => {
      trackDynamicImport({
        componentName: 'Component1',
        loadTimeMs: 100,
        success: true,
        timestamp: Date.now(),
      })
      trackDynamicImport({
        componentName: 'Component1',
        loadTimeMs: 50,
        success: false,
        timestamp: Date.now(),
      })
      trackDynamicImport({
        componentName: 'Component2',
        loadTimeMs: 50,
        success: false,
        timestamp: Date.now(),
      })

      const errorRate = getErrorRate('Component1')
      expect(errorRate).toBe(0.5)
    })

    it('should return 0 when no metrics', () => {
      expect(getErrorRate()).toBe(0)
    })
  })

  describe('withDynamicImportTracking', () => {
    it('should track successful import', async () => {
      const mockImport = vi.fn().mockResolvedValue({
        default: () => null,
      })

      const trackedImport = withDynamicImportTracking('TestComponent', mockImport)
      await trackedImport()

      const metrics = getDynamicImportMetrics()
      expect(metrics).toHaveLength(1)
      expect(metrics[0]?.success).toBe(true)
      expect(metrics[0]?.componentName).toBe('TestComponent')
    })

    it('should track failed import', async () => {
      const mockImport = vi.fn().mockRejectedValue(new Error('Import failed'))

      const trackedImport = withDynamicImportTracking('TestComponent', mockImport)

      await expect(trackedImport()).rejects.toThrow('Import failed')

      const metrics = getDynamicImportMetrics()
      expect(metrics).toHaveLength(1)
      expect(metrics[0]?.success).toBe(false)
      expect(metrics[0]?.error).toBe('Import failed')
    })
  })

  describe('createDynamicImportTelemetry', () => {
    it('should track errors', () => {
      const tracker = createDynamicImportTelemetry('TestComponent')
      tracker.trackError(new Error('Test error'), 1)

      const metrics = getDynamicImportMetrics()
      expect(metrics).toHaveLength(1)
      expect(metrics[0]?.success).toBe(false)
      expect(metrics[0]?.error).toBe('Test error')
      expect(metrics[0]?.retryCount).toBe(1)
    })

    it('should track success', () => {
      const tracker = createDynamicImportTelemetry('TestComponent')
      tracker.trackSuccess(0)

      const metrics = getDynamicImportMetrics()
      expect(metrics).toHaveLength(1)
      expect(metrics[0]?.success).toBe(true)
      expect(metrics[0]?.retryCount).toBe(0)
    })
  })
})
