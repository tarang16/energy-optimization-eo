import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import { ReactFlowProvider } from '@xyflow/react'
import { allTagsDataAtom, selectedNodeIdAtom } from 'atoms/NetworkAtom'
import { useAtomValue } from 'jotai'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getDisplayValue, LabelTagParameterNode } from '.'

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

describe('LabelTagParameterNode (React Flow node)', () => {
  const baseProps = {
    id: 'label-tag-parameter-node-25557143',
    data: {
      label: 'Flow',
      tag: 'Tag Name',
      actual: '371',
      optimum: '372',
      uom: 'm³/h',
      linkedTag: 154,
      showDefaultTagName: false,
    },
    width: 264,
    height: 76,
  }

  beforeEach(() => {
    useAtomValue.mockReset()
    useAtomValue.mockImplementation((atom) => {
      if (atom === selectedNodeIdAtom) return baseProps.id
      if (atom === allTagsDataAtom) return mockTagData
      return null
    })
  })

  it('renders the node with label, tag, values, and unit', () => {
    render(
      <ReactFlowProvider>
        <LabelTagParameterNode {...baseProps} />
      </ReactFlowProvider>,
    )

    expect(screen.getByText('Flow')).toBeInTheDocument()
    expect(screen.getByText(/CW TO LAO/i)).toBeInTheDocument
    expect(screen.getByText('400')).toBeInTheDocument()
    expect(screen.getByText('420')).toBeInTheDocument()
    expect(screen.getByText('L/s')).toBeInTheDocument()
  })

  it('falls back to default props if tag is not found', () => {
    useAtomValue.mockImplementation((atom) => {
      if (atom === selectedNodeIdAtom) return baseProps.id
      if (atom === allTagsDataAtom) return [] // no tag matched
      return null
    })

    render(
      <ReactFlowProvider>
        <LabelTagParameterNode {...baseProps} />
      </ReactFlowProvider>,
    )

    expect(screen.getByText('Flow')).toBeInTheDocument()
    expect(screen.getByText('Tag Name')).toBeInTheDocument()
    expect(screen.getByText('371')).toBeInTheDocument()
    expect(screen.getByText('372')).toBeInTheDocument()
    expect(screen.getByText('m³/h')).toBeInTheDocument()
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
        showDefaultTagName: true,
      },
    }

    render(
      <ReactFlowProvider>
        <LabelTagParameterNode {...props} />
      </ReactFlowProvider>,
    )
    expect(screen.getByText('Tag Name')).toBeInTheDocument()
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
        showDefaultTagName: true,
      },
    }

    render(
      <ReactFlowProvider>
        <LabelTagParameterNode {...props} />
      </ReactFlowProvider>,
    )
    expect(screen.getByText('Tag Name')).toBeInTheDocument()
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
        showDefaultTagName: true,
      },
    }

    render(
      <ReactFlowProvider>
        <LabelTagParameterNode {...props} />
      </ReactFlowProvider>,
    )

    const result = getDisplayValue({ actual: 42 }, 'actual', 'fallback')
    expect(result).toBe(42)
    expect(screen.getByText('Tag Name')).toBeInTheDocument()
  })

  it('show tagname when tag is null ', () => {
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
        tag: null,
        showDefaultTagName: true,
      },
    }

    render(
      <ReactFlowProvider>
        <LabelTagParameterNode {...props} />
      </ReactFlowProvider>,
    )

    const result = getDisplayValue({ actual: 42 }, 'actual', 'fallback')
    expect(result).toBe(42)
  })
  it('show tagname when uiDisplayName is null ', () => {
    useAtomValue.mockImplementation((atom) => {
      if (atom === selectedNodeIdAtom) return null
      if (atom === allTagsDataAtom) {
        return [
          {
            ...mockTagData[0],
            uiDisplayName: null,
          },
        ]
      }
      return null
    })

    const props = {
      ...baseProps,
      data: {
        ...baseProps.data,
        tag: null,
        showDefaultTagName: false,
      },
      width: null,
    }

    render(
      <ReactFlowProvider>
        <LabelTagParameterNode {...props} />
      </ReactFlowProvider>,
    )

    const result = getDisplayValue({ actual: 42 }, 'actual', 'fallback')
    expect(result).toBe(42)
  })
})
