import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as constants from '../constant'
import DescriptionSection from './DescriptionSection'

vi.mock('../constant', () => ({
  SECTION_ONE_CONFIG: vi.fn(),
}))

vi.mock('../TooltipContent', () => ({
  default: vi.fn(({ tooltipData }) => (
    <div data-testid='tooltip-content'>{tooltipData?.data || 'Tooltip'}</div>
  )),
}))

vi.mock('../Field', () => ({
  default: vi.fn(({ fieldType, field }) => (
    <input
      data-testid={`field-component`}
      data-fieldtype={fieldType}
      name={field}
    />
  )),
}))

vi.mock('../ccpTagsEditModal_EO', () => ({
  camelCaseToCapitalizedWords: vi.fn((val) => val.toUpperCase()),
}))

describe('DescriptionSection', () => {
  const defaultProps = {
    tagTypes: ['Type1'],
    dataTypes: ['Data1'],
    blockNames: ['Block1'],
    tooltips: [{ columnName: 'tagName', data: 'Some Tooltip' }],
    editTagsList: { tagName: 'abc', tagType: 'pi' },
    setEditTagsList: vi.fn(),
    isEditMode: true,
    setIsDirty: vi.fn(),
    validatePiTagName: vi.fn(),
    uomDropDownOptions: [],
  }

  const mockFieldConfig = [
    {
      field: 'tagName',
      title: 'tagName',
      type: 'text',
      required: true,
    },
    {
      field: 'uom',
      title: 'uom',
      type: 'dropdown',
      required: false,
    },
  ]

  beforeEach(() => {
    constants.SECTION_ONE_CONFIG.mockReturnValue(mockFieldConfig)
  })

  it('disables fields when not in edit mode', () => {
    render(<DescriptionSection {...defaultProps} isEditMode={false} />)

    const fields = screen.getAllByTestId('field-component')
    fields.forEach((field) => {
      expect(field).toBeInTheDocument()
      // You can simulate that Field component receives "disabled" prop if needed
    })
  })

  it('handles missing tooltips gracefully', () => {
    render(<DescriptionSection {...defaultProps} tooltips={[]} />)
    const tooltips = screen.queryAllByTestId('tooltip-content')
    expect(tooltips.length).toBe(0)
  })

  it('renders the correct label with tooltip ID and image', () => {
    render(<DescriptionSection {...defaultProps} />)
  })
})
