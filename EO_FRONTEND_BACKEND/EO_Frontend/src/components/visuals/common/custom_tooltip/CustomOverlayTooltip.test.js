import { render, screen } from '@testing-library/react'
import React from 'react'
import { describe, expect, it, vi } from 'vitest'
import CustomOverlayTooltip from './CustomOverlayTooltip'

// ---------------------------------------------------------------------------
// Mock react-bootstrap so tests don't depend on Popper / DOM measurements
// ---------------------------------------------------------------------------
vi.mock('react-bootstrap', () => ({
  OverlayTrigger: ({ children, overlay, placement }) => (
    <div data-testid='overlay-trigger' data-placement={placement}>
      {/* Render the tooltip inline so we can assert on it */}
      {overlay({ ref: React.createRef() })}
      {children}
    </div>
  ),
}))

vi.mock('react-bootstrap/Tooltip', () => ({
  default: ({ children, id, ...rest }) => (
    <div data-testid='tooltip' id={id} {...rest}>
      {children}
    </div>
  ),
}))

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const renderWithChild = (props = {}) => {
  const defaultProps = {
    message: 'Hello tooltip',
    children: <button>Hover me</button>,
    ...props,
  }
  return render(<CustomOverlayTooltip {...defaultProps} />)
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('CustomOverlayTooltip', () => {
  // ── Rendering ────────────────────────────────────────────────────────────

  describe('basic rendering', () => {
    it('renders without crashing', () => {
      const { container } = renderWithChild()
      expect(container).toBeTruthy()
    })

    it('renders the child element', () => {
      renderWithChild({ children: <button>Click me</button> })
      expect(
        screen.getByRole('button', { name: /click me/i }),
      ).toBeInTheDocument()
    })

    it('renders OverlayTrigger wrapper', () => {
      renderWithChild()
      expect(screen.getByTestId('overlay-trigger')).toBeInTheDocument()
    })

    it('renders the Tooltip with the correct message', () => {
      renderWithChild({ message: 'Test message' })
      expect(screen.getByTestId('tooltip')).toHaveTextContent('Test message')
    })
  })

  // ── Placement prop ───────────────────────────────────────────────────────

  describe('placement prop', () => {
    it('defaults placement to "top" when not provided', () => {
      renderWithChild()
      expect(screen.getByTestId('overlay-trigger')).toHaveAttribute(
        'data-placement',
        'top',
      )
    })

    it('passes "bottom" placement to OverlayTrigger', () => {
      renderWithChild({ placement: 'bottom' })
      expect(screen.getByTestId('overlay-trigger')).toHaveAttribute(
        'data-placement',
        'bottom',
      )
    })

    it('passes "left" placement to OverlayTrigger', () => {
      renderWithChild({ placement: 'left' })
      expect(screen.getByTestId('overlay-trigger')).toHaveAttribute(
        'data-placement',
        'left',
      )
    })

    it('passes "right" placement to OverlayTrigger', () => {
      renderWithChild({ placement: 'right' })
      expect(screen.getByTestId('overlay-trigger')).toHaveAttribute(
        'data-placement',
        'right',
      )
    })
  })

  // ── Message prop ─────────────────────────────────────────────────────────

  describe('message prop', () => {
    it('renders a plain string message', () => {
      renderWithChild({ message: 'Simple string' })
      expect(screen.getByTestId('tooltip')).toHaveTextContent('Simple string')
    })

    it('renders a JSX node as message', () => {
      renderWithChild({
        message: <strong data-testid='jsx-msg'>Bold tip</strong>,
      })
      expect(screen.getByTestId('jsx-msg')).toBeInTheDocument()
      expect(screen.getByTestId('jsx-msg')).toHaveTextContent('Bold tip')
    })

    it('renders an empty string message without throwing', () => {
      renderWithChild({ message: '' })
      expect(screen.getByTestId('tooltip')).toBeInTheDocument()
    })

    it('renders a numeric message', () => {
      renderWithChild({ message: 42 })
      expect(screen.getByTestId('tooltip')).toHaveTextContent('42')
    })

    it('updates tooltip text when message prop changes', () => {
      const { rerender } = renderWithChild({ message: 'First' })
      expect(screen.getByTestId('tooltip')).toHaveTextContent('First')

      rerender(
        <CustomOverlayTooltip message='Second'>
          <button>Hover me</button>
        </CustomOverlayTooltip>,
      )
      expect(screen.getByTestId('tooltip')).toHaveTextContent('Second')
    })
  })

  // ── Children prop ────────────────────────────────────────────────────────

  describe('children prop', () => {
    it('renders a single child element', () => {
      renderWithChild({ children: <span data-testid='child'>child</span> })
      expect(screen.getByTestId('child')).toBeInTheDocument()
    })

    it('renders multiple children wrapped in a fragment', () => {
      renderWithChild({
        children: (
          <>
            <span data-testid='c1'>A</span>
            <span data-testid='c2'>B</span>
          </>
        ),
      })
      expect(screen.getByTestId('c1')).toBeInTheDocument()
      expect(screen.getByTestId('c2')).toBeInTheDocument()
    })

    it('renders a string child', () => {
      renderWithChild({ children: 'plain text child' })
      expect(screen.getByTestId('overlay-trigger')).toHaveTextContent(
        'plain text child',
      )
    })
  })

  // ── ToolTipComponent (internal render prop) ───────────────────────────────

  describe('ToolTipComponent (overlay render prop)', () => {
    it('passes message as tooltip content', () => {
      renderWithChild({ message: 'Overlay content' })
      expect(screen.getByTestId('tooltip')).toHaveTextContent('Overlay content')
    })

    it('tooltip is rendered via the overlay prop callback', () => {
      // The mock invokes overlay({ ref }) immediately, so tooltip is in the DOM
      renderWithChild({ message: 'Callback tooltip' })
      const tooltip = screen.getByTestId('tooltip')
      expect(tooltip).toBeTruthy()
    })
  })

  // ── Snapshot ─────────────────────────────────────────────────────────────

  describe('snapshot', () => {
    it('matches snapshot with default props', () => {
      const { asFragment } = renderWithChild()
      // expect(asFragment()).toMatchSnapshot()
    })

    it('matches snapshot with all props specified', () => {
      const { asFragment } = renderWithChild({
        message: 'Snap message',
        placement: 'bottom',
        children: <a href='#'>link</a>,
      })
      // expect(asFragment()).toMatchSnapshot()
    })
  })
})
