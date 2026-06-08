import '@testing-library/jest-dom'
import { render } from '@testing-library/react'
import { plantListAtom, selectedNodeIdAtom } from 'atoms/NetworkAtom'
import { useAtomValue } from 'jotai'

import { ReactFlowProvider } from '@xyflow/react'
import { beforeEach, describe, it, vi } from 'vitest'
import { PlantNode } from '.'

vi.mock(import('jotai'), async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    useAtomValue: vi.fn(),
  }
})

const mockTagData = [
  {
    caseId: 1,
    pageId: 9,
    pageName: 'UTILITIES PLANT',
    affiliateId: 10,
    createdBy: 30752531,
    createdOn: '2024-12-06T10:21:57',
    modifiedBy: null,
    modifiedOn: null,
  },
]

describe('Plat Node (React Flow node)', () => {
  const baseProps = {
    id: 'plant-node-99529911',
    data: {
      page: 11,
    },
  }

  beforeEach(() => {
    useAtomValue.mockReset()
    useAtomValue.mockImplementation((atom) => {
      if (atom === selectedNodeIdAtom) return baseProps.id
      if (atom === plantListAtom) return mockTagData
      return null
    })
  })

  it('initial render with page number', () => {
    render(
      <ReactFlowProvider>
        <PlantNode {...baseProps} />
      </ReactFlowProvider>,
    )
  })

  it('initial render without page number', () => {
    const props = {
      ...baseProps,
      data: {
        ...baseProps.data,
        page: null,
      },
    }
    render(
      <ReactFlowProvider>
        <PlantNode {...props} />
      </ReactFlowProvider>,
    )
  })

  it('render node without selected id', () => {
    useAtomValue.mockImplementation((atom) => {
      if (atom === selectedNodeIdAtom) return null
      if (atom === plantListAtom) return []
      return null
    })

    const props = {
      ...baseProps,
      data: {
        ...baseProps.data,
        page: null,
      },
    }

    render(
      <ReactFlowProvider>
        <PlantNode {...props} />
      </ReactFlowProvider>,
    )
  })

  it('shows default tag name when showDefaultTagName is true', () => {
    useAtomValue.mockImplementation((atom) => {
      if (atom === selectedNodeIdAtom) return baseProps.id
      if (atom === plantListAtom) return [] // no tag matched
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
        <PlantNode {...props} />
      </ReactFlowProvider>,
    )
  })

  it('shows default tag name when showDefaultTagName is true and tagData available', () => {
    useAtomValue.mockImplementation((atom) => {
      if (atom === selectedNodeIdAtom) return baseProps.id
      if (atom === plantListAtom) return mockTagData // no tag matched
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
        <PlantNode {...props} />
      </ReactFlowProvider>,
    )
  })

  it('shows displayValue when actual is null ', () => {
    useAtomValue.mockImplementation((atom) => {
      if (atom === selectedNodeIdAtom) return baseProps.id
      if (atom === plantListAtom) {
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
        <PlantNode {...props} />
      </ReactFlowProvider>,
    )
  })

  it('show tagname when tag is null ', () => {
    useAtomValue.mockImplementation((atom) => {
      if (atom === selectedNodeIdAtom) return baseProps.id
      if (atom === plantListAtom) {
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
        <PlantNode {...props} />
      </ReactFlowProvider>,
    )
  })
  it('show tagname when uiDisplayName is null ', () => {
    useAtomValue.mockImplementation((atom) => {
      if (atom === selectedNodeIdAtom) return null
      if (atom === plantListAtom) {
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
        <PlantNode {...props} />
      </ReactFlowProvider>,
    )
  })
})
