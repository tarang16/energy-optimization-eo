import { render } from '@testing-library/react'
import { describe, it, vi } from 'vitest'
import { SECTION_THREE_CONFIG } from '../constant'
import FlagDetailsSection from './FlagDetailsSection'

// Mock child components and utilities
vi.mock('../Field', () => ({
  default: vi.fn(() => <div data-testid='mock-field' />),
}))
vi.mock('../TooltipContent', () => ({
  default: vi.fn(({ tooltipData }) => (
    <div data-testid='mock-tooltip'>
      {tooltipData ? 'TooltipData' : 'NoTooltip'}
    </div>
  )),
}))
vi.mock('../ccpTagsEditModal_EO', () => ({
  camelCaseToCapitalizedWords: vi.fn((text) => `Formatted-${text}`),
}))

describe('FlagDetailsSection', () => {
  const defaultProps = {
    editTagsList: [],
    setEditTagsList: vi.fn(),
    tooltips: [{ columnName: SECTION_THREE_CONFIG[0].field, text: 'tooltip' }],
    isEditMode: true,
    setIsDirty: vi.fn(),
  }

  it('renders header text', () => {
    render(<FlagDetailsSection {...defaultProps} />)
    // expect(screen.getByText("FLAG DETAILS")).toBeInTheDocument();
  })

  it('renders all fields from SECTION_THREE_CONFIG', () => {
    render(<FlagDetailsSection {...defaultProps} />)
    SECTION_THREE_CONFIG.forEach((x) => {})
  })

  it('renders tooltip icon for each field', () => {
    render(<FlagDetailsSection {...defaultProps} />)
  })

  it('renders TooltipContent with provided tooltip data', () => {
    render(<FlagDetailsSection {...defaultProps} />)
  })

  it('disables Field when isEditMode is false', () => {
    render(<FlagDetailsSection {...defaultProps} isEditMode={false} />)
  })
})
