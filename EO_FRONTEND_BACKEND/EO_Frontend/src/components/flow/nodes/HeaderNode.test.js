import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import { selectedNodeIdAtom } from 'atoms/NetworkAtom'
import { useAtomValue } from 'jotai'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { HeaderNode } from './HeaderNode'
// Mock the Handles component
vi.mock('../handles/Handles', () => ({
  default: () => <div data-testid='mock-handles' />,
}))
vi.mock(import('jotai'), async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    useAtomValue: vi.fn(),
  }
})
describe('HeaderNode', () => {
  const baseData = {
    width: 600,
    height: 20,
    template: 'Default',
    numSourceHandlesRight: 0,
    numTargetHandlesTop: 1,
    numSourceHandlesBottom: 1,
    numTargetHandlesLeft: 0,
    hideLeftStopper: false,
    hideRightStopper: false,
  }
  beforeEach(() => {
    useAtomValue.mockImplementation((atom) => {
      if (atom === selectedNodeIdAtom) return 'test-node'
    })
  })
  it('renders both left and right stoppers', () => {
    render(<HeaderNode data={{ ...baseData }} id='test-node' />)
    expect(screen.getByTestId('left-stopper')).toBeInTheDocument()
    expect(screen.getByTestId('right-stopper')).toBeInTheDocument()
    expect(screen.getByTestId('mock-handles')).toBeInTheDocument()
  })
  it('hides the left stopper when hideLeftStopper is true', () => {
    render(
      <HeaderNode
        data={{ ...baseData, hideLeftStopper: true }}
        id='test-node'
      />,
    )
    expect(screen.queryByTestId('left-stopper')).not.toBeInTheDocument()
    expect(screen.getByTestId('right-stopper')).toBeInTheDocument()
  })
  it('hides the right stopper when hideRightStopper is true', () => {
    render(
      <HeaderNode
        data={{ ...baseData, hideRightStopper: true }}
        id='test-node'
      />,
    )
    expect(screen.getByTestId('left-stopper')).toBeInTheDocument()
    expect(screen.queryByTestId('right-stopper')).not.toBeInTheDocument()
  })
  it('renders with green border when selected', () => {
    render(<HeaderNode data={{ ...baseData }} id='test-node' />)
  })
  it('renders with default border when not selected', () => {
    useAtomValue.mockImplementation((atom) => {
      if (atom === selectedNodeIdAtom) return 'another-node'
    })
    render(<HeaderNode data={{ ...baseData }} id='test-node' />)
  })
})
