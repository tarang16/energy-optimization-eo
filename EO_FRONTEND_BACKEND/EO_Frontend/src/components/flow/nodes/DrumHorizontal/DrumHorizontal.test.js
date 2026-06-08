import '@testing-library/jest-dom'
import { render } from '@testing-library/react'
import { allTagsDataAtom, selectedNodeIdAtom } from 'atoms/NetworkAtom'
import { Provider as JotaiProvider } from 'jotai'
import { describe, it, vi } from 'vitest'
import { HorizontalDrumNode } from './index'

vi.mock(import('./drumHorizontal.module.scss'), async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    horizontalDrumCompo: 'horizontalDrumCompo',
    horizontalDrumCompoOff: 'horizontalDrumCompoOff',
    s: 's',
    key: 'key',
  }
})

vi.mock('components/flow/handles/StaticFourHandles', () => ({
  default: () => <div data-testid='static-handles' />,
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

describe('HorizontalDrumNode', () => {
  const baseProps = {
    id: 'node-1',
    data: {
      isTurnedOn: false,
      tag: 'UN.UO.71FI1101.PV',
      subTag: 'Horizontal Drum',
      linkedTag: null,
    },
  }

  it('handles tag object with falsy tagId (x.tagId is null)', () => {
    const { container } = renderWithAtoms(
      <HorizontalDrumNode
        {...baseProps}
        data={{ ...baseProps.data, linkedTag: 'some-tag-id' }}
      />,
      {
        allTagsData: [{ tagId: null, actual: 1 }],
      },
    )
  })

  it('renders OFF state when isTurnedOn = false and no tagData', () => {
    const { container, getByText, getByTestId } = renderWithAtoms(
      <HorizontalDrumNode {...baseProps} />,
    )
  })

  it('renders ON state when isTurnedOn = true and no tagData', () => {
    const { container } = renderWithAtoms(
      <HorizontalDrumNode
        {...baseProps}
        data={{ ...baseProps.data, isTurnedOn: true }}
      />,
    )
  })

  it('renders OFF state when tagData.actual != 1 and isTurnedOn = false', () => {
    const { container } = renderWithAtoms(
      <HorizontalDrumNode
        {...baseProps}
        data={{ ...baseProps.data, linkedTag: 'some-tag-id' }}
      />,
      {
        allTagsData: [{ tagId: 'some-tag-id', actual: 0 }],
      },
    )
  })

  it('does not apply border when not selected', () => {
    const { container } = renderWithAtoms(
      <HorizontalDrumNode {...baseProps} />,
      {
        selectedNodeId: 'other-id',
      },
    )
  })
})
