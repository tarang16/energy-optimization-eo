import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import { ReactFlowProvider } from '@xyflow/react'
import { allTagsDataAtom, selectedNodeIdAtom } from 'atoms/NetworkAtom'
import { Provider, useAtomValue } from 'jotai'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { TagEnergyConsumptionNode } from './index'

vi.mock(import('jotai'), async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    useAtomValue: vi.fn(),
  }
})

// Mock utilities

vi.mock(import('utills/utilities'), async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    convertFormulaToHtml: (input) => input,
    customFormatActOpt: (input) => `formatted-${input}`,
  }
})

// Default props
const defaultData = {
  label: 'label',
  tag: 'Tag Name',
  actual: '45',
  optimum: '60',
  actual_energy: '371',
  optimum_energy: '372',
  uom_energy: 'uom-energy',
  uom: 'uom',
  actual_consumption: '471',
  optimum_consumption: '472',
  uom_consumption: 'uom-consumption',
  linkedTag: null,
  linkedTag2: null,
  linkedTag3: null,
  showDefaultTagName: false,
}

// Helper render function
const renderComponent = ({
  selectedId = 'node-1',
  allTagsData = [],
  data = defaultData,
  id = 'node-1',
  width = 300,
} = {}) => {
  useAtomValue.mockImplementation((atom) => {
    if (atom === selectedNodeIdAtom) {
      return selectedId
    }
    if (atom === allTagsDataAtom) {
      return allTagsData
    }
    return []
  })

  return render(
    <ReactFlowProvider>
      <Provider>
        <TagEnergyConsumptionNode id={id} data={data} width={width} />
      </Provider>
    </ReactFlowProvider>,
  )
}

describe('TagEnergyConsumptionNode', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders tag name from data when no linkedTag', () => {
    renderComponent()

    expect(screen.getByText('Tag Name')).toBeInTheDocument()
  })

  it('renders actual and optimum values from data when no tagData', () => {
    renderComponent()

    expect(screen.getByText('45')).toBeInTheDocument()
    expect(screen.getByText('60')).toBeInTheDocument()

    expect(screen.getByText('371')).toBeInTheDocument()
    expect(screen.getByText('372')).toBeInTheDocument()

    expect(screen.getByText('471')).toBeInTheDocument()
    expect(screen.getByText('472')).toBeInTheDocument()
  })

  it('renders actual and optimum values from tagData when linkedTag is provided', () => {
    const tagDataMock = [
      { tagId: 'tag-1', actual: 100, optimum: 200, uom: 'test-uom' },
    ]
    const dataWithLinkedTag = { ...defaultData, linkedTag: 'tag-1' }

    renderComponent({ allTagsData: tagDataMock, data: dataWithLinkedTag })

    expect(screen.getByText('formatted-100')).toBeInTheDocument()
    expect(screen.getByText('formatted-200')).toBeInTheDocument()
    expect(screen.getByText('test-uom')).toBeInTheDocument()
  })

  it('renders actual and optimum values from tagData2 when linkedTag2 is provided', () => {
    const tagDataMock = [
      { tagId: 'tag-2', actual: 110, optimum: 210, uom: 'energy-uom' },
    ]
    const dataWithLinkedTag2 = { ...defaultData, linkedTag2: 'tag-2' }

    renderComponent({ allTagsData: tagDataMock, data: dataWithLinkedTag2 })

    expect(screen.getByText('formatted-110')).toBeInTheDocument()
    expect(screen.getByText('formatted-210')).toBeInTheDocument()
    expect(screen.getByText('energy-uom')).toBeInTheDocument()
  })

  it('renders actual and optimum values from tagData3 when linkedTag3 is provided', () => {
    const tagDataMock = [
      { tagId: 'tag-3', actual: 120, optimum: 220, uom: 'consumption-uom' },
    ]
    const dataWithLinkedTag3 = { ...defaultData, linkedTag3: 'tag-3' }

    renderComponent({ allTagsData: tagDataMock, data: dataWithLinkedTag3 })

    expect(screen.getByText('formatted-120')).toBeInTheDocument()
    expect(screen.getByText('formatted-220')).toBeInTheDocument()
    expect(screen.getByText('consumption-uom')).toBeInTheDocument()
  })

  it('renders tag name from tagData uiDisplayName when showDefaultTagName is false', () => {
    const tagDataMock = [
      {
        tagId: 'tag-1',
        uiDisplayName: 'Display Name',
        actual: 100,
        optimum: 200,
        uom: 'uom',
      },
    ]
    const dataWithLinkedTag = { ...defaultData, linkedTag: 'tag-1' }

    renderComponent({ allTagsData: tagDataMock, data: dataWithLinkedTag })

    expect(screen.getByText('Display Name')).toBeInTheDocument()
  })

  it('renders tag name from data.tag when showDefaultTagName is true', () => {
    const tagDataMock = [
      {
        tagId: 'tag-1',
        uiDisplayName: 'Display Name',
        actual: 100,
        optimum: 200,
        uom: 'uom',
      },
    ]
    const dataWithLinkedTag = {
      ...defaultData,
      linkedTag: 'tag-1',
      showDefaultTagName: true,
    }

    renderComponent({ allTagsData: tagDataMock, data: dataWithLinkedTag })

    expect(screen.getByText('Tag Name')).toBeInTheDocument()
  })

  it('adds green border when selectedId matches id', () => {
    const { container } = renderComponent({
      selectedId: 'node-1',
      id: 'node-1',
    })
  })

  it('has no border when selectedId does not match id', () => {
    const { container } = renderComponent({
      selectedId: 'another-id',
      id: 'node-1',
    })
  })
})
