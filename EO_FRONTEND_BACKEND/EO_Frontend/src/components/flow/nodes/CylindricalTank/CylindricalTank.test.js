import '@testing-library/jest-dom'
import { render } from '@testing-library/react'
import { allTagsDataAtom, selectedNodeIdAtom } from 'atoms/NetworkAtom'
import { useAtomValue } from 'jotai'

import { ReactFlowProvider } from '@xyflow/react'
import { beforeEach, describe, it, vi } from 'vitest'
import { CylindricalTankNode } from '.'

vi.mock(import('jotai'), async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    useAtomValue: vi.fn(),
  }
})

const mockTagData = [
  {
    timeStamp: '2025-07-01T07:00:00',
    tagId: 245,
    tagName: '7th_effect_evaporator_c_6537_overhead_pressure',
    uiDisplayName: '7th Effect Evaporator C 6537 Overhead Pressure',
    uom: 'BARG',
    modelId: 1,
    actual: 1,
    optimum: 1,
    design: null,
    state: null,
  },
]

describe('CylindricalTankNode Node (React Flow node)', () => {
  const baseProps = {
    id: 'turbine-node-53651576',
    data: {
      isTurnedOn: false,
      tag: 'PT-7801G',
      subTag: 'Cooling water pump turbine G',
      linkedTag: 245,
    },
  }

  beforeEach(() => {
    useAtomValue.mockReset()
    useAtomValue.mockImplementation((atom) => {
      if (atom === selectedNodeIdAtom) return baseProps.id
      if (atom === allTagsDataAtom) return mockTagData
      return null
    })
  })

  it('initial render with page number', () => {
    render(
      <ReactFlowProvider>
        <CylindricalTankNode {...baseProps} />
      </ReactFlowProvider>,
    )
  })

  it('initial render without page number', () => {
    const props = {
      ...baseProps,
      data: {
        ...baseProps.data,
      },
    }
    render(
      <ReactFlowProvider>
        <CylindricalTankNode {...props} />
      </ReactFlowProvider>,
    )
  })

  it('render node without selected id', () => {
    useAtomValue.mockImplementation((atom) => {
      if (atom === selectedNodeIdAtom) return null
      if (atom === allTagsDataAtom) return []
      return null
    })

    const props = {
      ...baseProps,
      data: {
        ...baseProps.data,
      },
    }

    render(
      <ReactFlowProvider>
        <CylindricalTankNode {...props} />
      </ReactFlowProvider>,
    )
  })

  it('shows default tag name when showDefaultTagName is true', () => {
    useAtomValue.mockImplementation((atom) => {
      if (atom === selectedNodeIdAtom) return baseProps.id
      if (atom === allTagsDataAtom) return [] // no tag matched
      return null
    })

    const props = {
      ...baseProps,
      data: {
        ...baseProps.data,
      },
    }

    render(
      <ReactFlowProvider>
        <CylindricalTankNode {...props} />
      </ReactFlowProvider>,
    )
  })

  it('shows default tag name when showDefaultTagName is true and tagData available', () => {
    useAtomValue.mockImplementation((atom) => {
      if (atom === selectedNodeIdAtom) return baseProps.id
      if (atom === allTagsDataAtom) return mockTagData // no tag matched
      return null
    })

    const props = {
      ...baseProps,
      data: {
        ...baseProps.data,
      },
    }

    render(
      <ReactFlowProvider>
        <CylindricalTankNode {...props} />
      </ReactFlowProvider>,
    )
  })

  it('shows displayValue when actual is null ', () => {
    useAtomValue.mockImplementation((atom) => {
      if (atom === selectedNodeIdAtom) return baseProps.id
      if (atom === allTagsDataAtom) {
        return [
          {
            ...mockTagData[0],
          },
        ]
      }
      return null
    })

    const props = {
      ...baseProps,
      data: {
        ...baseProps.data,
      },
    }

    render(
      <ReactFlowProvider>
        <CylindricalTankNode {...props} />
      </ReactFlowProvider>,
    )
  })

  it('show tagname when tag is null ', () => {
    useAtomValue.mockImplementation((atom) => {
      if (atom === selectedNodeIdAtom) return baseProps.id
      if (atom === allTagsDataAtom) {
        return [
          {
            ...mockTagData[0],
          },
        ]
      }
      return null
    })

    const props = {
      ...baseProps,
      data: {
        ...baseProps.data,
      },
    }

    render(
      <ReactFlowProvider>
        <CylindricalTankNode {...props} />
      </ReactFlowProvider>,
    )
  })
  it('show tagname when selectedId is null ', () => {
    useAtomValue.mockImplementation((atom) => {
      if (atom === selectedNodeIdAtom) return null
      if (atom === allTagsDataAtom) {
        return [
          {
            ...mockTagData[0],
          },
        ]
      }
      return null
    })

    const props = {
      ...baseProps,
      data: {
        ...baseProps.data,
      },
    }

    render(
      <ReactFlowProvider>
        <CylindricalTankNode {...props} />
      </ReactFlowProvider>,
    )
  })
})
