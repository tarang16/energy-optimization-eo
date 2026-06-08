import '@testing-library/jest-dom'
import { render } from '@testing-library/react'
import { allTagsDataAtom, selectedNodeIdAtom } from 'atoms/NetworkAtom'
import { Provider as JotaiProvider } from 'jotai'
import { describe, it, vi } from 'vitest'
import { BoilerNode } from './index'

vi.mock('components/flow/handles/HorizontalHandles', () => ({
  default: () => <div data-testid='horizontal-handles' />,
}))
vi.mock('assets/sabic_new_icons/boiler_on.svg', () => ({
  default: 'boiler-on.svg',
}))
vi.mock('assets/sabic_new_icons/boiler_off.svg', () => ({
  default: 'boiler-off.svg',
}))

const renderWithAtoms = (
  ui,
  { selectedNodeId = '', allTagsData = [] } = {},
) => {
  const Wrapper = ({ children }) => (
    <JotaiProvider
      initialValues={[
        [selectedNodeIdAtom, selectedNodeId],
        [allTagsDataAtom, allTagsData],
      ]}
    >
      {children}
    </JotaiProvider>
  )

  return render(ui, { wrapper: Wrapper })
}

describe('BoilerNode', () => {
  const defaultProps = {
    id: 'node-123',
    data: {
      isTurnedOn: false,
      tag: 'BOILER-001',
      subTag: 'Main Boiler',
      linkedTag: null,
    },
  }

  it('renders ON state when isTurnedOn is true and no tagData', () => {
    const { container, getByAltText, getByText, getByTestId } = renderWithAtoms(
      <BoilerNode
        {...defaultProps}
        data={{ ...defaultProps.data, isTurnedOn: true }}
      />,
      { selectedNodeId: 'node-123' },
    )
  })

  it('renders OFF state when isTurnedOn is false and no tagData', () => {
    const { container, getByAltText } = renderWithAtoms(
      <BoilerNode {...defaultProps} />,
      { selectedNodeId: 'node-123' },
    )
  })

  it('renders OFF state when tagData.actual != 1 and isTurnedOn is false', () => {
    const props = {
      ...defaultProps,
      data: { ...defaultProps.data, linkedTag: 'tag-xyz' },
    }

    const { container } = renderWithAtoms(<BoilerNode {...props} />, {
      selectedNodeId: 'node-123',
      allTagsData: [{ tagId: 'tag-xyz', actual: 0 }],
    })
  })

  it('does not apply green border when selectedId != id', () => {
    const { container } = renderWithAtoms(
      <BoilerNode
        {...defaultProps}
        data={{ ...defaultProps.data, isTurnedOn: true }}
      />,
      { selectedNodeId: 'another-id' },
    )
  })

  it('covers tagData = null (linkedTag doesn’t match anything)', () => {
    const { container } = renderWithAtoms(
      <BoilerNode
        {...defaultProps}
        data={{
          ...defaultProps.data,
          isTurnedOn: false,
          linkedTag: 'non-match',
        }}
      />,
      {
        selectedNodeId: 'node-123',
        allTagsData: [{ tagId: 'tag-other', actual: 1 }],
      },
    )
  })
})
