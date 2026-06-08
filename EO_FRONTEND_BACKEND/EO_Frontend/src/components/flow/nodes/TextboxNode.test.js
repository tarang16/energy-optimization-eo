import '@testing-library/jest-dom'
import { render } from '@testing-library/react'
import { allTagsDataAtom, selectedNodeIdAtom } from 'atoms/NetworkAtom'
import { useAtomValue } from 'jotai'

import { ReactFlowProvider } from '@xyflow/react'
import { beforeEach, describe, it, vi } from 'vitest'
import { TextboxNode } from './TextboxNode'

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
    tagId: 154,
    tagName: 'cw_to_lao',
    uiDisplayName: 'CW TO LAO',
    uom: 'L/s',
    modelId: 1,
    actual: 400,
    optimum: 420,
    design: null,
    state: null,
  },
]

describe('TextboxNode (React Flow node)', () => {
  const baseProps = {
    id: 'text-box-node-46319499',
    data: {
      width: 100,
      height: 100,
      numSourceHandlesRight: 1,
      numTargetHandlesTop: 1,
      numSourceHandlesBottom: 1,
      numTargetHandlesLeft: 1,
      label: '',
      color: '#000000',
      linkedTag: 154,
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

  it('initial render', () => {
    render(
      <ReactFlowProvider>
        <TextboxNode {...baseProps} />
      </ReactFlowProvider>,
    )
  })

  it('falls back to default props if tag is not found', () => {
    useAtomValue.mockImplementation((atom) => {
      if (atom === selectedNodeIdAtom) return baseProps.id
      if (atom === allTagsDataAtom) return [] // no tag matched
      return null
    })

    render(
      <ReactFlowProvider>
        <TextboxNode {...baseProps} />
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
        label: 'header',
      },
    }

    render(
      <ReactFlowProvider>
        <TextboxNode {...props} />
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
        <TextboxNode {...props} />
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
            actual: null,
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
        <TextboxNode {...props} />
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
        <TextboxNode {...props} />
      </ReactFlowProvider>,
    )
  })
  it('show tagname when uiDisplayName is null ', () => {
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
        <TextboxNode {...props} />
      </ReactFlowProvider>,
    )
  })
})
