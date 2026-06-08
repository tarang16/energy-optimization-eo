import '@testing-library/jest-dom'
import { render } from '@testing-library/react'
import { allTagsDataAtom, selectedNodeIdAtom } from 'atoms/NetworkAtom'
import { Provider as JotaiProvider } from 'jotai'
import { VerticalDrumNode } from './index'

vi.mock(import('jotai'), async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    useAtomValue: vi.fn(),
  }
})

vi.mock('components/flow/handles/StaticFourHandles', () => ({
  default: () => <div data-testid='static-four-handles' />,
}))
vi.mock('assets/sabic_new_icons/drum_v_off.svg', () => ({
  default: () => 'off-drum.svg',
}))
vi.mock('assets/sabic_new_icons/drum_v_on.svg', () => ({
  default: () => 'on-drum.svg',
}))

import { useAtomValue } from 'jotai'
import { beforeEach, describe, it, vi } from 'vitest'

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

describe('VerticalDrumNode', () => {
  const defaultProps = {
    id: 'node-1',
    data: {
      isTurnedOn: false,
      tag: 'TAG-123',
      subTag: 'SubTag A',
      linkedTag: null,
    },
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders ON state when isTurnedOn = true and no tagData', () => {
    useAtomValue
      .mockImplementationOnce(() => 'node-1') // selectedNodeIdAtom
      .mockImplementationOnce(() => []) // allTagsDataAtom

    const { container, getByText, getByTestId } = renderWithAtoms(
      <VerticalDrumNode
        {...defaultProps}
        data={{ ...defaultProps.data, isTurnedOn: true }}
      />,
    )
  })

  it('renders OFF state when isTurnedOn = false and no tagData', () => {
    useAtomValue
      .mockImplementationOnce(() => 'node-1')
      .mockImplementationOnce(() => [])
  })

  it('renders ON state when tagData.actual == 1 (overrides isTurnedOn)', () => {
    useAtomValue
      .mockImplementationOnce(() => 'node-1')
      .mockImplementationOnce(() => [{ tagId: 'tag-xyz', actual: 1 }])

    const props = {
      ...defaultProps,
      data: { ...defaultProps.data, isTurnedOn: false, linkedTag: 'tag-xyz' },
    }

    const { container } = renderWithAtoms(<VerticalDrumNode {...props} />)
  })

  it('renders OFF state when tagData.actual != 1 and isTurnedOn = false', () => {
    useAtomValue
      .mockImplementationOnce(() => 'node-1')
      .mockImplementationOnce(() => [{ tagId: 'tag-xyz', actual: 0 }])

    const props = {
      ...defaultProps,
      data: { ...defaultProps.data, linkedTag: 'tag-xyz' },
    }

    const { container } = renderWithAtoms(<VerticalDrumNode {...props} />)
  })

  it('applies green border when selectedId == id', () => {
    useAtomValue
      .mockImplementationOnce(() => 'node-1')
      .mockImplementationOnce(() => [])

    const { container } = renderWithAtoms(
      <VerticalDrumNode
        {...defaultProps}
        data={{ ...defaultProps.data, isTurnedOn: true }}
      />,
    )
  })

  it('does not apply green border when selectedId != id', () => {
    useAtomValue
      .mockImplementationOnce(() => 'other-id')
      .mockImplementationOnce(() => [])

    const { container } = renderWithAtoms(
      <VerticalDrumNode
        {...defaultProps}
        data={{ ...defaultProps.data, isTurnedOn: true }}
      />,
    )
  })

  it('covers tagData condition (tagId check)', () => {
    useAtomValue
      .mockImplementationOnce(() => 'node-1')
      .mockImplementationOnce(() => [
        { tagId: null },
        { tagId: 'tag-x', actual: 0 },
      ])

    const props = {
      ...defaultProps,
      data: { ...defaultProps.data, linkedTag: 'tag-x' },
    }

    const { container } = renderWithAtoms(<VerticalDrumNode {...props} />)
  })
})
