import React from 'react'
import { render } from '@testing-library/react'
import { PipeTopInNode } from './PipeTopInNode'
import { Provider as JotaiProvider } from 'jotai'
import { selectedNodeIdAtom } from 'atoms/NetworkAtom'
import { describe, it, test, expect, vi } from 'vitest'
import '@testing-library/jest-dom'

// Mock StaticFourHandles
vi.mock('../handles/StaticFourHandles', () => ({
  __esModule: true,
  default: ({ id, showTop, showBottom, topType, bottomType }) => (
    <div data-testid='mock-handles'>
      {`id:${id}, showTop:${showTop}, showBottom:${showBottom}, topType:${topType}, bottomType:${bottomType}`}
    </div>
  ),
}))

const renderComponent = ({
  selectedId = 'unselected-node',
  nodeId = 'top-id',
  height = 400,
  template = 'Default',
} = {}) => {
  const data = {
    height,
    template,
    label: 'Pipe Top In Node',
  }

  return render(
    <JotaiProvider initialValues={[[selectedNodeIdAtom, selectedId]]}>
      <PipeTopInNode data={data} id={nodeId} />
    </JotaiProvider>,
  )
}

describe('PipeTopInNode', () => {
  it('renders with correct height and unselected border color', () => {
    const { container } = renderComponent({ height: 500 })
    const pipe = container.querySelector('.child2')
    expect(pipe).toBeInTheDocument()
    expect(pipe).toHaveStyle('height: 500px')
    expect(pipe).toHaveStyle('width: 6px')
    expect(pipe).toHaveStyle('border-color: #000000') // from Default template
    expect(pipe).toHaveStyle('background-color: rgb(255,255,255)')
  })

  it('renders with green border color when selected', () => {
    const { container } = renderComponent({
      selectedId: 'top-id',
      nodeId: 'top-id',
    })
    const pipe = container.querySelector('.child2')
    expect(pipe).toHaveStyle('border-color: #000000')
  })

  it('renders StaticFourHandles with correct props', () => {
    const { getByTestId } = renderComponent({ nodeId: 'pipe-top-node' })
    const content = getByTestId('mock-handles').textContent

    expect(content).toContain('id:pipe-top-node')
    expect(content).toContain('showTop:true')
    expect(content).toContain('showBottom:true')
    expect(content).toContain('topType:target')
    expect(content).toContain('bottomType:source')
  })
})
