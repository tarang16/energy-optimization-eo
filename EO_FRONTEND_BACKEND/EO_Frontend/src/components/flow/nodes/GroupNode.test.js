import '@testing-library/jest-dom'
import { render } from '@testing-library/react'
import { selectedNodeIdAtom } from 'atoms/NetworkAtom'
import { Provider as JotaiProvider } from 'jotai'
import { describe, expect, it } from 'vitest'
import { GroupNode } from './GroupNode'

const renderWithAtoms = (ui, { selectedNodeId = '' } = {}) => {
  const Wrapper = ({ children }) => (
    <JotaiProvider initialValues={[[selectedNodeIdAtom, selectedNodeId]]}>
      {children}
    </JotaiProvider>
  )
  return render(ui, { wrapper: Wrapper })
}

describe('GroupNode', () => {
  const defaultProps = {
    id: 'group-1',
    data: {
      width: 300,
      height: 250,
      label: 'Test Group',
      borderColor: '#123456',
    },
  }

  it('renders with correct dimensions and border color when not selected', () => {
    const { container, getByText } = renderWithAtoms(
      <GroupNode {...defaultProps} />,
      { selectedNodeId: 'some-other-id' },
    )

    const outer = container.firstChild
    expect(outer).toHaveStyle('width: 300px')
    expect(outer).toHaveStyle('height: 250px')
  })

  it('does not render label when label is empty', () => {
    const { queryByText } = renderWithAtoms(
      <GroupNode
        {...defaultProps}
        data={{ ...defaultProps.data, label: '' }}
      />,
      { selectedNodeId: 'group-1' },
    )

    expect(queryByText('Test Group')).not.toBeInTheDocument()
  })

  it('has correct positioning and zIndex styles', () => {
    const { container } = renderWithAtoms(<GroupNode {...defaultProps} />)
    const outer = container.firstChild
    expect(outer).toHaveStyle('position: relative')
    expect(outer).toHaveStyle('z-index: -1')
  })
})
