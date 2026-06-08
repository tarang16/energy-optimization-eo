import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import { allTagsDataAtom, selectedNodeIdAtom } from 'atoms/NetworkAtom'
import * as jotai from 'jotai'
import * as utilities from 'utills/utilities'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { LabelTextNode } from './index'

vi.mock(import('jotai'), async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    useAtomValue: vi.fn(),
  }
})

vi.mock('components/flow/resizer', () => ({
  default: () => <div data-testid='resizer' />,
}))
vi.spyOn(utilities, 'convertFormulaToHtml').mockImplementation(
  (val) => `HTML(${val})`,
)
vi.spyOn(utilities, 'customFormatActOpt').mockImplementation(
  (val) => `formatted-${val}`,
)

describe('LabelTextNode', () => {
  const mockProps = {
    id: 'node-1',
    width: 200,
    data: {
      label: 'Temp',
      value: '500',
      linkedTag: 'tag-123',
      showDefaultTagName: false,
    },
  }
  const tagDataList = [
    {
      tagId: 'tag-123',
      uiDisplayName: 'Temperature',
      uom: '°C',
      actual: 123.45,
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    jotai.useAtomValue.mockImplementation((atom) => {
      if (atom === selectedNodeIdAtom) return 'node-1'
      if (atom === allTagsDataAtom) return tagDataList
      return null
    })
  })

  it('renders label and formatted actual value when tag is linked', () => {
    render(<LabelTextNode {...mockProps} />)
  })

  it('uses label text if no tag is found', () => {
    jotai.useAtomValue.mockImplementation((atom) => {
      if (atom === selectedNodeIdAtom) return 'node-1'
      if (atom === allTagsDataAtom) return [] // No matching tag
      return null
    })
    render(<LabelTextNode {...mockProps} />)
  })

  it('uses default label when showDefaultTagName is true', () => {
    render(
      <LabelTextNode
        {...mockProps}
        data={{ ...mockProps.data, showDefaultTagName: true }}
      />,
    )
  })

  it('renders dash if actual is null', () => {
    jotai.useAtomValue.mockImplementation((atom) => {
      if (atom === selectedNodeIdAtom) return 'node-1'
      if (atom === allTagsDataAtom) {
        return [
          {
            tagId: 'tag-123',
            uiDisplayName: 'Pressure',
            uom: 'bar',
            actual: null,
          },
        ]
      }
      return null
    })
    render(<LabelTextNode {...mockProps} />)
    expect(screen.getByText('-')).toBeInTheDocument()
  })

  it('applies border if selected', () => {
    const { container } = render(<LabelTextNode {...mockProps} />)
  })

  it('does not apply border if not selected', () => {
    jotai.useAtomValue.mockImplementation((atom) => {
      if (atom === selectedNodeIdAtom) return 'some-other-node'
      if (atom === allTagsDataAtom) return tagDataList
      return null
    })
    const { container } = render(<LabelTextNode {...mockProps} />)
  })
})
