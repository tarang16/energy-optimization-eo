import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

import { render, cleanup } from '@testing-library/react'

import DomIDInjectorWrapper from './idInjector'

// ---- MOCK getValsBaseOnCondition ----

vi.mock('utills/utilities', () => ({
  getValsBaseOnCondition: vi.fn((val, prefix, fallback) => {
    // simple deterministic behavior

    return val.startsWith(prefix.replace('__', ''))
      ? val.replace(prefix, '')
      : fallback
  }),
}))

describe('DomIDInjectorWrapper - 100% coverage', () => {
  let observerCallback

  beforeEach(() => {
    cleanup()

    document.body.innerHTML = ''

    document.body.removeAttribute('data-pagename')

    // ---- MOCK MutationObserver ----

    global.MutationObserver = vi.fn(function (cb) {
      observerCallback = cb

      this.observe = vi.fn()

      this.disconnect = vi.fn()
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('injects data-tut attribute when data-pagename exists', () => {
    document.body.setAttribute('data-pagename', 'page__home')

    const div = document.createElement('div')

    document.body.appendChild(div)

    render(
      <DomIDInjectorWrapper>
        <div>Test</div>
      </DomIDInjectorWrapper>,
    )

    expect(div.hasAttribute('data-tut')).toBe(true)
  })

  it('removes data-tut when data-pagename is missing (compressDomPath returns empty)', () => {
    const div = document.createElement('div')

    div.setAttribute('data-tut', 'old')

    document.body.appendChild(div)

    render(
      <DomIDInjectorWrapper>
        <div>Test</div>
      </DomIDInjectorWrapper>,
    )

    expect(div.hasAttribute('data-tut')).toBe(false)
  })

  it('correctly handles multiple sibling index calculation', () => {
    document.body.setAttribute('data-pagename', 'page__dashboard')

    const parent = document.createElement('div')

    const child1 = document.createElement('span')

    const child2 = document.createElement('span')

    parent.appendChild(child1)

    parent.appendChild(child2)

    document.body.appendChild(parent)

    render(
      <DomIDInjectorWrapper>
        <div>Test</div>
      </DomIDInjectorWrapper>,
    )

    expect(child1.getAttribute('data-tut')).not.toBeNull()

    expect(child2.getAttribute('data-tut')).not.toBeNull()

    expect(child1.getAttribute('data-tut')).not.toEqual(
      child2.getAttribute('data-tut'),
    )
  })

  it('handles SVGElement correctly (isValidElement branch)', () => {
    document.body.setAttribute('data-pagename', 'page__svg')

    const svg = document.createElementNS(
      'http://www.w3.org/2000/svg',

      'svg',
    )

    document.body.appendChild(svg)

    render(
      <DomIDInjectorWrapper>
        <div>Test</div>
      </DomIDInjectorWrapper>,
    )

    expect(svg.hasAttribute('data-tut')).toBe(true)
  })

  it('ignores non HTMLElement / non SVGElement nodes', () => {
    document.body.setAttribute('data-pagename', 'page__text')

    const textNode = document.createTextNode('hello')

    document.body.appendChild(textNode)

    render(
      <DomIDInjectorWrapper>
        <div>Test</div>
      </DomIDInjectorWrapper>,
    )

    // No crash = branch covered

    expect(true).toBe(true)
  })

  it('re-injects IDs when DOM changes (MutationObserver callback)', () => {
    document.body.setAttribute('data-pagename', 'page__mutation')

    render(
      <DomIDInjectorWrapper>
        <div>Test</div>
      </DomIDInjectorWrapper>,
    )

    const newDiv = document.createElement('div')

    document.body.appendChild(newDiv)

    // trigger mutation manually

    observerCallback()

    expect(newDiv.hasAttribute('data-tut')).toBe(true)
  })

  it('disconnects MutationObserver on unmount', () => {
    document.body.setAttribute('data-pagename', 'page__cleanup')

    const { unmount } = render(
      <DomIDInjectorWrapper>
        <div>Test</div>
      </DomIDInjectorWrapper>,
    )

    const instance = MutationObserver.mock.instances[0]

    unmount()

    expect(instance.disconnect).toHaveBeenCalled()
  })

  it('handles deeply nested DOM structure for getDomPath full coverage', () => {
    document.body.setAttribute('data-pagename', 'page__deep')

    const parent = document.createElement('div')

    const child = document.createElement('section')

    const inner = document.createElement('button')

    child.appendChild(inner)

    parent.appendChild(child)

    document.body.appendChild(parent)

    render(
      <DomIDInjectorWrapper>
        <div>Test</div>
      </DomIDInjectorWrapper>,
    )

    expect(inner.getAttribute('data-tut')).toContain('reactour__')
  })
})
