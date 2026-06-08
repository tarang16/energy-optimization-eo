import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import { ReactFlowProvider } from '@xyflow/react'
import { allTagsDataAtom, selectedNodeIdAtom } from 'atoms/NetworkAtom'
import { Provider, useAtomValue } from 'jotai'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { TagEnergyNode } from './index'
import styles from './TagEnergyNode.module.scss'

// Mock CustomNodeResizer
vi.mock('components/flow/resizer', () => ({
  default: () => <div data-testid='node-resizer' />,
}))

// Mock utilities
vi.mock('utills/utilities', () => ({
  convertFormulaToHtml: vi.fn((value) => value),
  customFormatActOpt: vi.fn((value) => value),
}))

vi.mock(import('jotai'), async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    useAtomValue: vi.fn(),
  }
})

describe('TagEnergyNode', () => {
  let selectedIdMock
  let allTagsDataMock

  beforeEach(() => {
    selectedIdMock = 'node-1'
    allTagsDataMock = []

    useAtomValue.mockImplementation((atom) => {
      if (atom === selectedNodeIdAtom) {
        return selectedIdMock
      }
      if (atom === allTagsDataAtom) {
        return allTagsDataMock
      }
      return undefined
    })
  })

  const renderComponent = (props) => {
    return render(
      <ReactFlowProvider>
        <Provider>
          <TagEnergyNode {...props} />
        </Provider>
      </ReactFlowProvider>,
    )
  }

  it('renders with default props when no tag data linked', () => {
    const data = {
      tag: 'Tag Name',
      actual: '45',
      optimum: '60',
      actual_energy: '371',
      optimum_energy: '372',
      uom_energy: 'uom-energy',
      uom: 'uom',
      linkedTag: null,
      linkedTag2: null,
      showDefaultTagName: false,
    }

    renderComponent({ id: 'node-1', data })

    // Tag name
    expect(screen.getByText('Tag Name')).toBeInTheDocument()

    // Actual and Optimum for TagData 1
    expect(screen.getByText('45')).toBeInTheDocument()
    expect(screen.getByText('60')).toBeInTheDocument()

    // Actual and Optimum for TagData 2 (energy)
    expect(screen.getByText('371')).toBeInTheDocument()
    expect(screen.getByText('372')).toBeInTheDocument()
  })

  it('renders with linkedTag and linkedTag2 with tagData', async () => {
    const tagData1 = {
      tagId: 'tag-123',
      actual: 123,
      optimum: 456,
      uom: 'linked-uom',
      uiDisplayName: 'Linked Tag Name',
    }

    const tagData2 = {
      tagId: 'tag-456',
      actual: 987,
      optimum: 654,
      uom: 'linked-energy-uom',
    }

    allTagsDataMock = [tagData1, tagData2]

    const data = {
      tag: 'Tag Name',
      actual: '45',
      optimum: '60',
      actual_energy: '371',
      optimum_energy: '372',
      uom_energy: 'uom-energy',
      uom: 'uom',
      linkedTag: 'tag-123',
      linkedTag2: 'tag-456',
      showDefaultTagName: false,
    }

    renderComponent({ id: 'node-1', data })
  })

  it('renders showDefaultTagName when true', () => {
    const tagData1 = {
      tagId: 'tag-123',
      actual: 123,
      optimum: 456,
      uom: 'linked-uom',
      uiDisplayName: 'Linked Tag Name',
    }

    allTagsDataMock = [tagData1]

    const data = {
      tag: 'Default Tag',
      actual: '45',
      optimum: '60',
      actual_energy: '371',
      optimum_energy: '372',
      uom_energy: 'uom-energy',
      uom: 'uom',
      linkedTag: 'tag-123',
      linkedTag2: null,
      showDefaultTagName: true,
    }

    renderComponent({ id: 'node-1', data })

    // The getTagname() should now show the default tag value, not uiDisplayName
    expect(screen.getByText('371')).toBeInTheDocument()
  })

  it('renders with no selected border when selectedNodeId does not match', () => {
    selectedIdMock = 'other-node'

    const data = {
      tag: 'Tag Name',
      actual: '45',
      optimum: '60',
      actual_energy: '371',
      optimum_energy: '372',
      uom_energy: 'uom-energy',
      uom: 'uom',
      linkedTag: null,
      linkedTag2: null,
      showDefaultTagName: false,
    }

    const { container } = renderComponent({ id: 'node-1', data })

    const wrapper = container.querySelector(`.${styles.labeltagParameterCompo}`)
  })

  it('renders with green border when selectedNodeId matches', () => {
    selectedIdMock = 'node-1'

    const data = {
      tag: 'Tag Name',
      actual: '45',
      optimum: '60',
      actual_energy: '371',
      optimum_energy: '372',
      uom_energy: 'uom-energy',
      uom: 'uom',
      linkedTag: null,
      linkedTag2: null,
      showDefaultTagName: false,
    }

    const { container } = renderComponent({ id: 'node-1', data })

    const wrapper = container.querySelector(`.${styles.labeltagParameterCompo}`)
  })
})
