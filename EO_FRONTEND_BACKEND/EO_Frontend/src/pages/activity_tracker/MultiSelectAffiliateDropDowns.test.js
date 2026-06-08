import '@testing-library/jest-dom'
import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import MultiSelectAffiliateDropDowns from './MultiSelectAffiliateDropDowns'
vi.mock('jotai', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    useAtomValue: vi.fn(),
  }
})
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    useLocation: vi.fn(),
  }
})
// Mock MultiSelectV2 with test IDs and onChange passthrough
vi.mock('components/visuals/dropdown/multi_select/MultiSelectV2', () => ({
  default: ({ data = [], onChange }) => (
    <div>
      {data.map((item) => (
        <button
          key={item.tag_name}
          data-testid={`multi-select-v2-${item.tag_name}`}
          onClick={() => onChange([item], item)}
        >
          {item.display_name}
        </button>
      ))}
    </div>
  ),
}))
const mockCaseData = [
  {
    affiliate: 'ARRAZI',
    affiliate_code: '1400',
  },
  {
    affiliate: 'ARRAZI-2',
    affiliate_code: '241',
  },
  {
    affiliate: 'BOILER SYSTEM SUPPLY',
    affiliate_code: '104',
  },
]
const mockCaseDataShow = [
  {
    display_name: 'ARRAZI',
    tag_name: '1400',
  },
  {
    display_name: 'ARRAZI-2',
    tag_name: '241',
  },
  {
    display_name: 'BOILER SYSTEM SUPPLY',
    tag_name: '104',
  },
]
describe('MultiSelectAffiliateDropDowns Component', () => {
  beforeEach(async () => {
    const jotai = await import('jotai')
    vi.mocked(jotai.useAtomValue).mockImplementation(() => ({
      caseData: mockCaseData,
    }))
  })
  it('renders MultiSelectAffiliateDropDowns component', async () => {
    render(<MultiSelectAffiliateDropDowns />)
    expect(screen.getByText(/Affiliate/i)).toBeInTheDocument()
    // Should have ALL, ARRAZI, ARRAZI-2, BOILER SYSTEM SUPPLY
    expect(screen.getByTestId('multi-select-v2-all')).toBeInTheDocument()
    expect(screen.getByTestId('multi-select-v2-1400')).toBeInTheDocument()
    expect(screen.getByTestId('multi-select-v2-241')).toBeInTheDocument()
    expect(screen.getByTestId('multi-select-v2-104')).toBeInTheDocument()
  })
  it('fires onChange handler correctly', async () => {
    const handleAffiliateChange = vi.fn()
    render(
      <MultiSelectAffiliateDropDowns
        handleAffiliateChange={handleAffiliateChange}
        showSubmitButton={true}
        isDropdownEvent={true}
      />,
    )
    // Simulate selecting ARRAZI
    fireEvent.click(screen.getByTestId('multi-select-v2-1400'))
    expect(handleAffiliateChange).toHaveBeenCalledWith(
      [mockCaseDataShow[0]],
      false,
    )
    // Simulate selecting ALL
    fireEvent.click(screen.getByTestId('multi-select-v2-all'))
    expect(handleAffiliateChange).toHaveBeenCalledWith(
      expect.arrayContaining(mockCaseDataShow),
      true,
    )
    // Simulate selecting ARRAZI-2
    fireEvent.click(screen.getByTestId('multi-select-v2-241'))
    expect(handleAffiliateChange).toHaveBeenCalledWith(
      [mockCaseDataShow[1]],
      false,
    )
  })
  it('shows the submit button when showSubmitButton=true', () => {
    render(<MultiSelectAffiliateDropDowns showSubmitButton={true} />)
    expect(screen.getByText(/Submit/i)).toBeInTheDocument()
  })
})
