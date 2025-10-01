import React from 'react'
import {expect, vi} from 'vitest'
import * as matchers from 'vitest-axe/matchers'

import '@testing-library/jest-dom'

// Extend expect with axe accessibility matchers
expect.extend(matchers)

// Make React available globally for tests
globalThis.React = React

// Mock window.matchMedia for tests
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock HTMLCanvasElement.getContext for axe-core accessibility testing
HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
  canvas: document.createElement('canvas'),
  fillRect: vi.fn(),
  clearRect: vi.fn(),
  getImageData: vi.fn(() => ({
    data: new Uint8ClampedArray(4),
  })),
  putImageData: vi.fn(),
  createImageData: vi.fn(() => ({data: new Uint8ClampedArray(4)})),
  setTransform: vi.fn(),
  drawImage: vi.fn(),
  save: vi.fn(),
  fillText: vi.fn(),
  restore: vi.fn(),
  beginPath: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  closePath: vi.fn(),
  stroke: vi.fn(),
  translate: vi.fn(),
  scale: vi.fn(),
  rotate: vi.fn(),
  arc: vi.fn(),
  fill: vi.fn(),
  measureText: vi.fn(() => ({width: 0})),
  transform: vi.fn(),
  rect: vi.fn(),
  clip: vi.fn(),
})) as unknown as typeof HTMLCanvasElement.prototype.getContext

// Mock window.getComputedStyle for axe-core color contrast checking
const originalGetComputedStyle = window.getComputedStyle
window.getComputedStyle = vi.fn((element: Element, pseudoElt?: string | null) => {
  // For pseudo-elements, return a basic mock
  if (pseudoElt != null && pseudoElt.trim().length > 0) {
    return {
      content: 'none',
      display: 'none',
      getPropertyValue: vi.fn(() => ''),
    } as unknown as CSSStyleDeclaration
  }
  // For regular elements, use jsdom's implementation
  return originalGetComputedStyle(element)
}) as typeof window.getComputedStyle
