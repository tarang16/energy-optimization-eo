import '@testing-library/jest-dom'
import { fireEvent, render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { describe, expect, test, vi } from 'vitest'
import {
  getAnalysisUrl,
  getTotal,
  isVerifyNumber,
  renderDataRow,
  renderLoadingIndicator,
  renderNoDataMessage,
  renderTable,
  renderTotalRow,
} from './ValueCapture.function'

vi.mock('components/ui/loader/Loader', () => ({
  __esModule: true,
  default: function MockLoader({ id }) {
    return <div data-testid={id}>Loading...</div>
  },
}))

vi.mock('utills/utilities', () => ({
  formatNumbers: vi.fn((num) => num?.toLocaleString() || num),
  uuid4: vi.fn(() => 'mock-uuid-123'),
}))

// Mock SVG imports

vi.mock('assets/sabic_new_icons/predicted_action2.svg', () => ({
  default: () => 'mock-trend-icon.svg',
}))
vi.mock('assets/sabic_icons/header/edit_default_icon.svg', () => ({
  default: () => 'mock-edit-icon.svg',
}))

// Test wrapper for components that use React Router

const TestWrapper = ({ children }) => (
  <BrowserRouter>
    <table>
      <tbody>{children}</tbody>
    </table>
  </BrowserRouter>
)

describe('ValueCapture Component Functions', () => {
  test('should render loading indicator with correct structure', () => {
    const result = renderLoadingIndicator()
    render(<TestWrapper>{result}</TestWrapper>)
    expect(screen.getByTestId('loader-test-id')).toBeInTheDocument()
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  test('should handle number verification correctly', () => {
    expect(isVerifyNumber(10, 5)).toBe(15)
    expect(isVerifyNumber(10, '5')).toBe(10)
    expect(isVerifyNumber(0, null)).toBe(0)
    expect(isVerifyNumber(5, undefined)).toBe(NaN)
  })

  test('should calculate totals correctly from response data', () => {
    const mockData = [
      { realizedvalueEnergy: 100, lostvalueEnergy: 50 },
      { realizedvalueEnergy: 200, lostvalueEnergy: '75' },
      { realizedvalueEnergy: 150, lostvalueEnergy: 25 },
    ]
    expect(getTotal(mockData, 'realizedvalueEnergy')).toBe(450)
    expect(getTotal(mockData, 'lostvalueEnergy')).toBe(75)
    expect(getTotal([], 'realizedvalueEnergy')).toBe(0)
  })

  test('should return correct analysis URL for energy category', () => {
    const energyCaseData = [
      { category: 'Energy', caseId: 123 },
      { category: 'other', caseId: 456 },
    ]

    const nonEnergyCaseData = [{ category: 'Manufacturing', caseId: 123 }]

    expect(getAnalysisUrl(energyCaseData, 123)).toBe('/analysis-energy')
    expect(getAnalysisUrl(nonEnergyCaseData, 123)).toBeUndefined()
    expect(getAnalysisUrl(null, 123)).toBeUndefined()
    expect(getAnalysisUrl([], 123)).toBeUndefined()
  })

  test('should render data row with editable link when permissions allow', () => {
    const mockObj = {
      caseid: 123,
      caseName: 'Test Case',
      realizedvalueEnergy: 1000,
      lostvalueEnergy: 500,
      total_business_impact_energy: 1500,
    }

    const mockCaseMstData = [{ category: 'Energy', caseId: 123 }]
    const mockHandleTrendClick = vi.fn()

    const result = renderDataRow(
      mockObj,
      mockHandleTrendClick,
      mockCaseMstData,
      true,
    )

    render(<TestWrapper>{result}</TestWrapper>)

    expect(screen.getByText('Test Case')).toBeInTheDocument()
    const trendIcon = screen.getByTestId('bar-trend-icon')
    fireEvent.click(trendIcon)
    expect(mockHandleTrendClick).toHaveBeenCalledWith(123)
  })

  // Test 6: renderDataRow with non-editable permissions and missing data

  test('should render data row with disabled link and handle missing data', () => {
    const mockObj = {
      caseid: 456,
      caseName: 'Test Case 2',
      realizedvalueEnergy: null,
      lostvalueEnergy: undefined,
      total_business_impact_energy: 0,
    }

    const mockCaseMstData = []

    const mockHandleTrendClick = vi.fn()

    const result = renderDataRow(
      mockObj,
      mockHandleTrendClick,
      mockCaseMstData,
      false,
    )

    render(<TestWrapper>{result}</TestWrapper>)

    expect(screen.getByText('Test Case 2')).toBeInTheDocument()

    expect(screen.getAllByText('-')).toHaveLength(3)
  })
  test('should render total row with calculated sums', () => {
    const mockRespData = [
      {
        realizedvalueEnergy: 100,
        lostvalueEnergy: 50,
        total_business_impact_energy: 150,
      },
      {
        realizedvalueEnergy: 200,
        lostvalueEnergy: 75,
        total_business_impact_energy: 275,
      },
    ]

    const result = renderTotalRow(mockRespData)

    render(<TestWrapper>{result}</TestWrapper>)

    expect(screen.getByText('TOTAL')).toBeInTheDocument()
  })

  test('should render no data message', () => {
    const result = renderNoDataMessage()
    render(<TestWrapper>{result}</TestWrapper>)
    expect(screen.getByText('No Data Found for the plant.')).toBeInTheDocument()
  })
  test('should render table correctly for different states', () => {
    const mockParams = {}
    const mockRespData = [
      {
        caseid: 1,
        caseName: 'Case 1',
        realizedvalueEnergy: 100,
        lostvalueEnergy: 50,
        total_business_impact_energy: 150,
      },
    ]
    const mockCaseMstData = [{ category: 'Energy', caseId: 1 }]
    const mockHandleTrendClick = vi.fn()
    const loadingResult = renderTable({
      respData: [],
      isLoading: true,
      handleTrendIconClick: mockHandleTrendClick,
      params: mockParams,
      caseMstData: mockCaseMstData,
      isEditable: true,
    })

    render(<TestWrapper>{loadingResult}</TestWrapper>)

    expect(screen.getByTestId('loader-test-id')).toBeInTheDocument()
  })

  test('should render table with data and handle empty data scenario', () => {
    const mockParams = {}
    const mockRespData = [
      {
        caseid: 1,
        caseName: 'Case 1',
        realizedvalueEnergy: 100,
        lostvalueEnergy: 50,
        total_business_impact_energy: 150,
      },
    ]
    const mockCaseMstData = [{ category: 'Energy', caseId: 1 }]
    const mockHandleTrendClick = vi.fn()
    // Test with data

    const { rerender } = render(
      <TestWrapper>
        {renderTable({
          respData: mockRespData,

          isLoading: false,

          handleTrendIconClick: mockHandleTrendClick,

          params: mockParams,

          caseMstData: mockCaseMstData,

          isEditable: true,
        })}
      </TestWrapper>,
    )

    expect(screen.getByText('Case 1')).toBeInTheDocument()
    expect(screen.getByText('TOTAL')).toBeInTheDocument()

    rerender(
      <TestWrapper>
        {renderTable({
          respData: [],

          isLoading: false,

          handleTrendIconClick: mockHandleTrendClick,

          params: mockParams,

          caseMstData: mockCaseMstData,

          isEditable: true,
        })}
      </TestWrapper>,
    )

    expect(screen.getByText('No Data Found for the plant.')).toBeInTheDocument()
    rerender(
      <TestWrapper>
        {renderTable({
          respData: null,

          isLoading: false,

          handleTrendIconClick: mockHandleTrendClick,

          params: mockParams,

          caseMstData: mockCaseMstData,

          isEditable: true,
        })}
      </TestWrapper>,
    )
    expect(screen.getByText('No Data Found for the plant.')).toBeInTheDocument()
  })
})
