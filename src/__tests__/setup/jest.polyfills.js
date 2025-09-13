// Polyfills for Jest testing environment

// TextEncoder/TextDecoder polyfill for Node.js environment
import { TextEncoder, TextDecoder } from 'util'

global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder

// ResizeObserver polyfill
global.ResizeObserver = class ResizeObserver {
  constructor(cb) {
    this.cb = cb
  }
  observe() {
    this.cb([{ borderBoxSize: { inlineSize: 0, blockSize: 0 } }], this)
  }
  unobserve() {}
  disconnect() {}
}

// IntersectionObserver polyfill
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
}

// matchMedia polyfill
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

// scrollTo polyfill
global.scrollTo = jest.fn()

// HTMLElement.prototype.scrollIntoView polyfill
global.HTMLElement.prototype.scrollIntoView = jest.fn()

// HTMLDialogElement polyfill for dialog element
global.HTMLDialogElement = global.HTMLDialogElement || function() {}
global.HTMLDialogElement.prototype.show = jest.fn()
global.HTMLDialogElement.prototype.showModal = jest.fn()
global.HTMLDialogElement.prototype.close = jest.fn()

// Element.prototype.scroll polyfill
global.Element.prototype.scroll = jest.fn()
global.Element.prototype.scrollTo = jest.fn()

// requestAnimationFrame polyfill
global.requestAnimationFrame = callback => setTimeout(callback, 0)
global.cancelAnimationFrame = id => clearTimeout(id)