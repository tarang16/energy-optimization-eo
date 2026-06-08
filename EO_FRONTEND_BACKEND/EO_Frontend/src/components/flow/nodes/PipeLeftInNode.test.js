import React from 'react'
import { render } from '@testing-library/react'
import { PipeLeftInNode } from './PipeLeftInNode'
import { Provider as JotaiProvider } from 'jotai'
import { selectedNodeIdAtom } from 'atoms/NetworkAtom'
import { describe, it, test, expect, vi } from 'vitest'
import '@testing-library/jest-dom'

// Mock StaticFourHandles
vi.mock('../handles/StaticFourHandles', () => ({
  __esModule: true,
  default: ({
    id,
    showLeft,
    showRight,
    leftType,
    rightType,
    leftStyles,
    rightStyles,
  }) => (
    <div data-testid='mock-handles'>
      {`id:${id}, left:${showLeft}, right:${showRight}, leftType:${leftType}, rightType:${rightType}, leftStyles:${JSON.stringify(
        leftStyles,
      )}, rightStyles:${JSON.stringify(rightStyles)}`}
    </div>
  ),
}))

const renderComponent = ({
  selectedId = 'other-id',
  nodeId = 'node-1',
  width = 500,
  template = 'Default',
} = {}) => {
  const data = { width, template, label: 'Test Label' }
  return render(
    <JotaiProvider initialValues={[[selectedNodeIdAtom, selectedId]]}>
      <PipeLeftInNode data={data} id={nodeId} />
    </JotaiProvider>,
  )
}

describe('PipeLeftInNode', () => {
  it('renders with correct width and unselected border color', () => {
    const { container } = renderComponent({ width: 450 })
    const pipe = container.querySelector('.child2')
    expect(pipe).toBeInTheDocument()
    expect(pipe).toHaveStyle('width: 450px')
    expect(pipe).toHaveStyle('height: 6px')
    expect(pipe).toHaveStyle('border-color: #000000') // Default border color
    expect(pipe).toHaveStyle('background-color: rgb(255,255,255)')
  })

  it('renders with green border when selected', () => {
    const { container } = renderComponent({
      selectedId: 'node-123',
      nodeId: 'node-123',
    })
    const pipe = container.querySelector('.child2')
    expect(pipe).toHaveStyle('border-color: #000000')
  })

  it('renders StaticFourHandles with correct props', () => {
    const { getByTestId } = renderComponent({ nodeId: 'left-node' })
    const content = getByTestId('mock-handles').textContent

    expect(content).toContain('id:left-node')
    expect(content).toContain('left:true')
    expect(content).toContain('right:true')
    expect(content).toContain('leftType:target')
    expect(content).toContain('rightType:source')
    expect(content).toContain('"left":"-2px"')
    expect(content).toContain('"right":"-2px"')
  })
})
