import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import { allTagsDataAtom, selectedNodeIdAtom } from 'atoms/NetworkAtom'
import * as jotai from 'jotai'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ValveNode } from './index'

vi.mock('components/flow/handles/VerticalHandles', () => ({
  default: (props) => (
    <div data-testid='vertical-handles'>
      {props.isReversed ? 'Reversed' : 'Normal'}
    </div>
  ),
}))

vi.mock(import('jotai'), async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    useAtomValue: vi.fn(),
  }
})

describe('ValveNode', () => {
  const defaultData = {
    isTurnedOn: false,
    tag: 'UN.UO.71FI1101.PV',
    width: 150,
    linkedTag: null,
    isReversed: false,
  }

  const mockUseAtomValue = (selectedId = '123', tags = []) => {
    vi.spyOn(jotai, 'useAtomValue').mockImplementation((atom) => {
      if (atom === selectedNodeIdAtom) return selectedId
      if (atom === allTagsDataAtom) return tags
      return null
    })
  }
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('adds green border when selected', () => {
    mockUseAtomValue('my-id', [])
    const { container } = render(<ValveNode data={defaultData} id='my-id' />)
  })

  it('does not add green border when not selected', () => {
    mockUseAtomValue('another-id', [])
    const { container } = render(<ValveNode data={defaultData} id='my-id' />)
  })

  it('renders valve ON when tagData.actual === 1', () => {
    const tagData = [{ tagId: 'tag-1', actual: 1 }]
    mockUseAtomValue('my-id', tagData)
    const data = { ...defaultData, linkedTag: 'tag-1' }
    render(<ValveNode data={data} id='my-id' />)
    expect(screen.getByTestId('vertical-handles')).toHaveTextContent('Normal')
    expect(screen.getByText('UN.UO.71FI1101.PV')).toBeInTheDocument()
  })

  it('renders valve ON when isTurnedOn is true and no tagData', () => {
    mockUseAtomValue('my-id', [])
    const data = { ...defaultData, isTurnedOn: true }
    render(<ValveNode data={data} id='my-id' />)
    expect(screen.getByTestId('vertical-handles')).toBeInTheDocument()
    expect(screen.getByText('UN.UO.71FI1101.PV')).toBeInTheDocument()
  })

  it('renders valve OFF when isTurnedOn is false and no tagData', () => {
    mockUseAtomValue('my-id', [])
    const data = { ...defaultData, isTurnedOn: false }
    render(<ValveNode data={data} id='my-id' />)
    expect(screen.getByTestId('vertical-handles')).toBeInTheDocument()
    expect(screen.getByText('UN.UO.71FI1101.PV')).toBeInTheDocument()
  })

  it('renders "Reversed" if isReversed is true', () => {
    mockUseAtomValue('my-id', [])
    const data = { ...defaultData, isReversed: true, isTurnedOn: true }
    render(<ValveNode data={data} id='my-id' />)
    expect(screen.getByTestId('vertical-handles')).toHaveTextContent('Reversed')
  })

  it('applies correct width from props', () => {
    mockUseAtomValue('my-id', [])
    const { container } = render(
      <ValveNode data={{ ...defaultData, isTurnedOn: true }} id='my-id' />,
    )
    expect(container.firstChild).toHaveStyle('width: 150px')
  })
})
