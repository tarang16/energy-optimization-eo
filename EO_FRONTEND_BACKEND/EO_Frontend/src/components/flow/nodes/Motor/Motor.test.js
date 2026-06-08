import '@testing-library/jest-dom'
import { render } from '@testing-library/react'
import { allTagsDataAtom, selectedNodeIdAtom } from 'atoms/NetworkAtom'
import { Provider as JotaiProvider } from 'jotai'
import { describe, it, vi } from 'vitest'
import { MotorNode } from './index'

vi.mock('components/flow/handles/HorizontalHandles', () => ({
  default: () => <div data-testid='horizontal-handles' />,
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

describe('MotorNode', () => {
  const defaultProps = {
    id: 'motor-node-1',
    data: {
      isTurnedOn: false,
      tag: 'TAG.MOTOR.1',
      subTag: 'Motor Subtag',
      linkedTag: null,
    },
  }

  it('renders ON state when isTurnedOn is true and no tagData', () => {
    const { container, getByText, getByTestId } = renderWithAtoms(
      <MotorNode
        {...defaultProps}
        data={{ ...defaultProps.data, isTurnedOn: true }}
      />,
      { selectedNodeId: 'motor-node-1', allTagsData: [] },
    )
  })

  it('renders OFF state when isTurnedOn is false and no tagData', () => {
    const { container } = renderWithAtoms(<MotorNode {...defaultProps} />)
  })

  it('renders OFF state when tagData.actual != 1 and isTurnedOn is false', () => {
    const props = {
      ...defaultProps,
      data: { ...defaultProps.data, linkedTag: 'motor-tag-1' },
    }

    const { container } = renderWithAtoms(<MotorNode {...props} />, {
      selectedNodeId: 'motor-node-1',
      allTagsData: [{ tagId: 'motor-tag-1', actual: 0 }],
    })
  })

  it('does not apply green border when selectedId !== id', () => {
    const { container } = renderWithAtoms(
      <MotorNode
        {...defaultProps}
        data={{ ...defaultProps.data, isTurnedOn: true }}
      />,
      { selectedNodeId: 'other-id' },
    )
  })

  it('covers tagData = undefined (linkedTag not matched)', () => {
    const { container } = renderWithAtoms(
      <MotorNode
        {...defaultProps}
        data={{ ...defaultProps.data, linkedTag: 'no-match' }}
      />,
      {
        allTagsData: [{ tagId: 'some-other-id', actual: 1 }],
        selectedNodeId: 'motor-node-1',
      },
    )
  })
})
