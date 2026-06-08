import '@testing-library/jest-dom'
import { render } from '@testing-library/react'
import { selectedNodeIdAtom } from 'atoms/NetworkAtom'
import { Provider as JotaiProvider } from 'jotai'
import { describe, expect, it, vi } from 'vitest'
import { PipeBottomInNode } from './PipeBottomInNode'

// Mock StaticFourHandles
vi.mock('../handles/StaticFourHandles', () => ({
  default: ({ id, showTop, showBottom, topType, bottomType }) => (
    <div data-testid='mock-handles'>
      {`id:${id}, top:${showTop}, bottom:${showBottom}, topType:${topType}, bottomType:${bottomType}`}
    </div>
  ),
}))

const renderComponent = (
  selectedId,
  nodeId,
  height = 600,
  template = 'Default',
) => {
  const data = { height, template, label: 'Test Label' }
  return render(
    <JotaiProvider initialValues={[[selectedNodeIdAtom, selectedId]]}>
      <PipeBottomInNode data={data} id={nodeId} />
    </JotaiProvider>,
  )
}

describe('PipeBottomInNode', () => {
  it('renders with correct height and unselected border color', () => {
    const { container } = renderComponent('some-other-id', 'node-1')

    const pipe = container.querySelector('.child2')
    expect(pipe).toBeInTheDocument()
    expect(pipe).toHaveStyle('height: 600px')
    expect(pipe).toHaveStyle('border-color: #000000') // Default template borderColor
    expect(pipe).toHaveStyle('background-color:rgb(255, 255, 255)')
  })

  it('renders with green border when selected', () => {
    const { container } = renderComponent('node-1', 'node-1')
    const pipe = container.querySelector('.child2')
    expect(pipe).toHaveStyle('border-color: #000000')
  })

  it('renders StaticFourHandles with correct props', () => {
    const { getByTestId } = renderComponent('some-id', 'my-node-id')
    expect(getByTestId('mock-handles').textContent).toContain('id:my-node-id')
    expect(getByTestId('mock-handles').textContent).toContain('top:true')
    expect(getByTestId('mock-handles').textContent).toContain('bottom:true')
    expect(getByTestId('mock-handles').textContent).toContain('topType:source')
    expect(getByTestId('mock-handles').textContent).toContain(
      'bottomType:target',
    )
  })
})
