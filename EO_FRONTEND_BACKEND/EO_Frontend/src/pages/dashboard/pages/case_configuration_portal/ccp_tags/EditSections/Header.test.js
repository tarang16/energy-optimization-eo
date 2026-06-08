import { render } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { camelCaseToCapitalizedWords } from '../ccpTagsEditModal_EO'
import Header from './Header'

// Mock dependencies
vi.mock('../ccpTagsEditModal_EO', () => ({
  camelCaseToCapitalizedWords: vi.fn((str) => `CC_${str}`), // prefix for clarity
}))
vi.mock('../TooltipContent', () => ({
  default: () => {
    return function MockTooltipContent({ tooltipData }) {
      return (
        <div data-testid='tooltip-content'>
          {tooltipData?.info || 'No Tooltip'}
        </div>
      )
    }
  },
}))
vi.mock(
  import('../../CaseConfigurationPortal.module.scss'),
  async (importOriginal) => {
    const actual = await importOriginal()
    return {
      ...actual,
      yelllowContainer: 'yellow-container',
      ModalContainer: 'modal-container',
      horizontalAlignment: 'horizontal-align',
      labelText: 'label-text',
      infoIcon: 'info-icon',
      ccpTagsTooltip: 'tooltip-class',
    }
  },
)

vi.mock('../../../../../../assets/sabic_icons/common/timeInfo.svg', () => ({
  default: 'info-icon.svg',
}))
describe('Header component', () => {
  const tooltipsMock = [
    { columnName: 'model_name', info: 'Model Name Tooltip' },
    { columnName: 'model_description', info: 'Description Tooltip' },
  ]
  const editTagsMock = {
    modelName: 'demoModel',
    description: 'demoDescription',
  }
  beforeEach(() => {
    vi.clearAllMocks()
  })
  it('renders model name and description labels with tooltips', () => {
    render(<Header editTagsList={editTagsMock} tooltips={tooltipsMock} />)
  })
  it('renders fallback when editTagsList is missing', () => {
    render(<Header tooltips={tooltipsMock} />)
  })
  it('renders fallback tooltip when tooltips are missing', () => {
    render(<Header editTagsList={editTagsMock} />)
  })
  it('calls camelCaseToCapitalizedWords for labels and values', () => {
    render(<Header editTagsList={editTagsMock} tooltips={tooltipsMock} />)
    expect(camelCaseToCapitalizedWords).toHaveBeenCalledWith('Model Name')
    expect(camelCaseToCapitalizedWords).toHaveBeenCalledWith('description')
    expect(camelCaseToCapitalizedWords).toHaveBeenCalledWith('demoModel')
    expect(camelCaseToCapitalizedWords).toHaveBeenCalledWith('demoDescription')
  })
})
