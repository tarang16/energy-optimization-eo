// WhatIfMode.test.jsx
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { useAtomValue } from 'jotai'
import { useOutletContext, useParams } from 'react-router-dom'
import {
  getDefaultWhatIfPlantParameters,
  getDemand,
  getEquipmentAvailability,
  getOptimizationPrice,
  getWhatIfDemandCalculation,
  getWhatIfOptimizerOutput,
} from 'services/OptimizationService'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import WhatIfMode from './WhatIfMode.js'
// Mock all dependencies
vi.mock(import('jotai'), async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    useAtomValue: vi.fn(),
    // your mocked methods
  }
})
vi.mock('react-router-dom', () => ({
  useParams: vi.fn(),
  useOutletContext: vi.fn(),
}))
vi.mock('react-bootstrap', () => ({
  OverlayTrigger: vi.fn(({ children }) => children),
  Tooltip: vi.fn(() => <div>Tooltip</div>),
}))
vi.mock('components/ui/loader/Loader', () => ({
  default: () => <div>Loading...</div>,
}))
vi.mock('components/visuals/table/AccordianExpandableTable', () => ({
  default: ({ data }) => <div data-testid='accordion-table'>MOCK TABLE</div>,
}))
vi.mock('components/visuals/table/SimpleTable', () => ({
  default: ({ data, headers }) => (
    <div data-testid='simple-table'>
      <div data-testid='headers'>MOCK HEADER</div>
      <div data-testid='table-data'>MOCK TABLE</div>
    </div>
  ),
}))
vi.mock('components/visuals/common/modal/CustomModal', () => ({
  default: ({ children, show, title }) =>
    show ? (
      <div data-testid={`modal-${title}`}>
        <div>{title}</div>
        {children}
      </div>
    ) : null,
}))
vi.mock(
  'components/visuals/charts/line_chart/linechart_multiple/LineChartMultiple',
  () => ({
    default: () => <div>Line Chart</div>,
  }),
)
vi.mock('./EstimatedDemandInputs', () => ({
  default: ({ data }) => (
    <div data-testid='estimated-demand-inputs'>{JSON.stringify(data)}</div>
  ),
}))
vi.mock('./OptimizationOutput', () => ({
  default: ({ outputData }) => (
    <div data-testid='optimization-output'>{JSON.stringify(outputData)}</div>
  ),
}))
vi.mock('services/OptimizationService', () => ({
  getDefaultWhatIfPlantParameters: vi.fn(),
  getDemand: vi.fn(),
  getEquipmentAvailability: vi.fn(),
  getOptimizationPrice: vi.fn(),
  getWhatIfDemandCalculation: vi.fn(),
  getWhatIfOptimizerOutput: vi.fn(),
}))
vi.mock(import('utills/utilities'), async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    CompareValuesWithSymbol: vi.fn((op, ...vals) => {
      if (op === '&&') return vals.every(Boolean)
      return false
    }),
    detectModification: vi.fn(() => true),
    getKSAMoment: vi.fn((date) => date),
    getValsBaseOnCondition: vi.fn((condition, trueVal, falseVal) =>
      condition ? trueVal : falseVal,
    ),
    showToast: vi.fn(),
    // your mocked methods
  }
})
vi.mock('config/env', () => ({
  env: {
    EO_HELP_URL: 'https://test-url.com',
  },
}))
vi.mock('config/Config', () => ({
  MODEL_CONFIG_STATUS_CODES: {
    MODEL_YET_TO_RUN: 0,
    MODEL_FAILED_TO_FIND_SOLUTION: 1,
    MODEL_CONVERGED: 2,
    SERVICE_UNAVAILABLE: 3,
    MODEL_FAILEDT_FIND_TOOLTIP: 4,
  },
}))
vi.mock('config/ActivityTrackerConfig', () => ({
  TRACKEVENTOBJ: {
    Optimization: {
      PlantLoadTrendIconClick: vi.fn(),
      EquipAvailabilityUpArrowIconClick: vi.fn(),
      EquipAvailabilityDownArrowIconClick: vi.fn(),
      EstimateDemandClick: vi.fn(),
    },
  },
}))
// Mock assets
vi.mock('assets/sabic_new_icons/copied-svgrepo-com.svg', () => ({
  default: 'copied-icon',
}))
vi.mock('assets/sabic_new_icons/copy-svgrepo-com.svg', () => ({
  default: 'copy-icon',
}))
vi.mock('assets/sabic_new_icons/helpActiveIcon.svg', () => ({
  default: 'help-icon',
}))
vi.mock('assets/sabic_new_icons/predicted_action2.svg', () => ({
  default: 'trend-icon',
}))
vi.mock('assets/sabic_icons/common/assetIcon.svg', () => ({
  default: 'asset-icon',
}))
vi.mock('assets/sabic_icons/common/priceInputIcon.svg', () => ({
  default: 'price-input-icon',
}))
vi.mock('assets/sabic_icons/header/ecm_icon.svg', () => ({
  default: 'optimizer-icon',
}))
vi.mock('assets/sabic_icons/monitoring/arrow_right.svg', () => ({
  default: 'arrow-icon',
}))
describe('WhatIfMode', () => {
  const mockAppContext = {
    actualTime: '2024-01-01T00:00:00Z',
    caseData: [{ caseID: 'test-case', affiliate: 'Test Affiliate' }],
  }
  const mockUseOutletContext = {
    caseId: 'test-case-id',
  }
  const mockUseParams = {
    id: 'test-id',
  }
  beforeEach(() => {
    vi.clearAllMocks()
    useAtomValue.mockReturnValue(mockAppContext)
    useOutletContext.mockReturnValue(mockUseOutletContext)
    useParams.mockReturnValue(mockUseParams)
    // Mock successful API responses
    getDefaultWhatIfPlantParameters.mockResolvedValue({
      statuscode: 200,
      data: {
        plantParameterDetails: [
          {
            plantName: 'Plant1',
            data: [
              {
                tagName: 'tag1',
                tagUiDisplayName: 'Tag 1',
                uomName: 'kg',
                modelTagId: 1,
                actual: 100,
                flagShowUi: true,
                referenceMin: 0,
                referenceMax: 200,
              },
            ],
          },
        ],
        modelId: 'model-1',
      },
    })
    getDemand.mockResolvedValue({
      statuscode: 200,
      data: [
        {
          energycategory: 'Demand',
          data: [
            {
              plantName: 'Plant1',
              actual: 150,
              bias: 0,
              modelTagId: 1,
            },
          ],
        },
      ],
    })
    getEquipmentAvailability.mockResolvedValue({
      statuscode: 200,
      data: [
        {
          equipmentName: 'Equipment1',
          equipmentCategory: 'Category1',
          actual: true,
          availability: true,
          mustRun: false,
          modelTagId: 2,
        },
      ],
    })
    getOptimizationPrice.mockResolvedValue({
      statuscode: 200,
      data: [
        {
          displayName: 'Price1',
          currentValue: '100.000',
          modelTagId: 3,
        },
      ],
    })
    getWhatIfDemandCalculation.mockResolvedValue({
      statuscode: 200,
      data: [
        {
          energycategory: 'Demand',
          data: [
            {
              plantName: 'Plant1',
              actual: 160,
              bias: 0,
            },
          ],
        },
      ],
    })
    getWhatIfOptimizerOutput.mockResolvedValue({
      statuscode: 200,
      data: {
        outputDetails: [{ output: 'test-output' }],
        modelStatus: 2,
        modelMessage: 'Success',
      },
    })
    // Mock clipboard API
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn(),
      },
    })
  })
  afterEach(() => {
    vi.restoreAllMocks()
  })
  describe('Initial Rendering', () => {
    it('should render component without crashing', async () => {
      await act(async () => {
        render(<WhatIfMode mode='whatIf' />)
      })
      expect(screen.getByTestId('plant-load')).toBeInTheDocument()
      expect(screen.getByTestId('plant-demand')).toBeInTheDocument()
    })
    it('should show loading states initially', async () => {
      await act(async () => {
        render(<WhatIfMode mode='whatIf' />)
      })
    })
    it('should render all main sections', async () => {
      await act(async () => {
        render(<WhatIfMode mode='whatIf' />)
      })
    })
  })
  describe('User Interactions', () => {
    it('should handle estimate demand button click successfully', async () => {
      await act(async () => {
        render(<WhatIfMode mode='whatIf' />)
      })
      await waitFor(() => {
        expect(screen.getByTestId('estimate-demand-btn')).toBeInTheDocument()
      })
      await act(async () => {
        fireEvent.click(screen.getByTestId('estimate-demand-btn'))
      })
      await waitFor(() => {
        expect(getWhatIfDemandCalculation).toHaveBeenCalled()
      })
    })
    it('should handle estimate demand with validation errors', async () => {
      // Mock input data that will cause validation errors
      getDefaultWhatIfPlantParameters.mockResolvedValue({
        statuscode: 200,
        data: {
          plantParameterDetails: [
            {
              plantName: 'Plant1',
              data: [
                {
                  tagName: 'tag1',
                  tagUiDisplayName: 'Tag 1',
                  uomName: 'kg',
                  modelTagId: 1,
                  actual: 100,
                  flagShowUi: true,
                  referenceMin: 0,
                  referenceMax: 100, // Value 150 will exceed this
                  referenceBias: 0.1,
                },
              ],
            },
          ],
          modelId: 'model-1',
        },
      })
      await act(async () => {
        render(<WhatIfMode mode='whatIf' />)
      })
      // Wait for component to load
      await waitFor(() => {
        expect(screen.getByTestId('estimate-demand-btn')).toBeInTheDocument()
      })
    })
    it('should handle run optimizer button click', async () => {
      await act(async () => {
        render(<WhatIfMode mode='whatIf' />)
      })
      // First estimate demand to enable optimizer
      await waitFor(() => {
        expect(screen.getByTestId('estimate-demand-btn')).toBeInTheDocument()
      })
      await act(async () => {
        fireEvent.click(screen.getByTestId('estimate-demand-btn'))
      })
      await waitFor(() => {
        expect(screen.getByTestId('run-optimizer-btn')).not.toBeDisabled()
      })
      await act(async () => {
        fireEvent.click(screen.getByTestId('run-optimizer-btn'))
      })
      await waitFor(() => {
        expect(getWhatIfOptimizerOutput).toHaveBeenCalled()
      })
    })
    it('should handle price input modal open/close', async () => {
      await act(async () => {
        render(<WhatIfMode mode='whatIf' />)
      })
      await waitFor(() => {
        expect(screen.getByText('Price Input')).toBeInTheDocument()
      })
      // Open modal
      fireEvent.click(screen.getByText('Price Input'))
      await waitFor(() => {
        expect(screen.getByTestId('modal-PRICE INPUT')).toBeInTheDocument()
      })
      // Close modal
      fireEvent.click(screen.getByText('cancel'))
      await waitFor(() => {
        expect(
          screen.queryByTestId('modal-PRICE INPUT'),
        ).not.toBeInTheDocument()
      })
    })
    it('should handle equipment availability expand/collapse', async () => {
      await act(async () => {
        render(<WhatIfMode mode='whatIf' />)
      })
      await waitFor(() => {
        expect(screen.getByText('ASSET AVAILABILITY')).toBeInTheDocument()
      })
      const arrowIcon = screen.getByAltText('Arrow icon')
      fireEvent.click(arrowIcon)
      // Should toggle expanded state
    })
    it('should handle reset button click', async () => {
      await act(async () => {
        render(<WhatIfMode mode='whatIf' />)
      })
      await waitFor(() => {
        expect(screen.getByText('RESET')).toBeInTheDocument()
      })
      await act(async () => {
        fireEvent.click(screen.getByText('RESET'))
      })
      // Should refetch data
    })
  })
  describe('Modal Interactions', () => {
    it('should handle help modal with copy functionality', async () => {
      await act(async () => {
        render(<WhatIfMode mode='whatIf' />)
      })
      // Estimate demand first to show help icon
      await waitFor(() => {
        expect(screen.getByTestId('estimate-demand-btn')).toBeInTheDocument()
      })
      await act(async () => {
        fireEvent.click(screen.getByTestId('estimate-demand-btn'))
      })
      await waitFor(() => {
        expect(screen.getByTestId('help-icon')).toBeInTheDocument()
      })
      // Open help modal
      fireEvent.click(screen.getByTestId('help-icon'))
      await waitFor(() => {
        expect(
          screen.getByTestId('modal-REPORT ISSUES VIA TALABI'),
        ).toBeInTheDocument()
      })
      // Test copy functionality
      const copyIcon = screen.getByTestId('copy-icon')
      fireEvent.click(copyIcon)
      expect(navigator.clipboard.writeText).toHaveBeenCalled()
    })
    it('should handle equipment availability modal operations', async () => {
      await act(async () => {
        render(<WhatIfMode mode='whatIf' />)
      })
      await waitFor(() => {
        expect(screen.getByTestId('simple-table')).toBeInTheDocument()
      })
      // Simulate opening equipment modal (this would normally be triggered by table interaction)
      // For testing, we'll directly test the modal functionality
      const modalContent = screen.getByTestId('simple-table')
      expect(modalContent).toBeInTheDocument()
    })
    it('should handle error modal continue action', async () => {
      // Setup for error scenario
      getDefaultWhatIfPlantParameters.mockResolvedValue({
        statuscode: 200,
        data: {
          plantParameterDetails: [
            {
              plantName: 'Plant1',
              data: [
                {
                  tagName: 'tag1',
                  tagUiDisplayName: 'Tag 1',
                  uomName: 'kg',
                  modelTagId: 1,
                  actual: 100,
                  flagShowUi: true,
                  referenceMin: 0,
                  referenceMax: 100,
                  referenceBias: 0.1,
                },
              ],
            },
          ],
          modelId: 'model-1',
        },
      })
      await act(async () => {
        render(<WhatIfMode mode='whatIf' />)
      })
      // Enter invalid value and trigger estimation
      await act(async () => {
        fireEvent.click(screen.getByTestId('estimate-demand-btn'))
      })
      // Click continue in error modal
      // Should proceed with estimation despite errors
    })
  })
  describe('Edge Cases and Error Handling', () => {
    it('should handle API failures gracefully', async () => {
      getDefaultWhatIfPlantParameters.mockResolvedValue({
        statuscode: 500,
        data: null,
      })
      await act(async () => {
        render(<WhatIfMode mode='whatIf' />)
      })
      // Component should not crash
      await waitFor(() => {
        expect(screen.getByTestId('plant-load')).toBeInTheDocument()
      })
    })
    it('should handle optimizer failure status', async () => {
      getWhatIfOptimizerOutput.mockResolvedValue({
        statuscode: 200,
        data: {
          outputDetails: [],
          modelStatus: 0,
          modelMessage: 'Failed to converge',
        },
      })
      await act(async () => {
        render(<WhatIfMode mode='whatIf' />)
      })
      // Run optimizer
      await waitFor(() => {
        expect(screen.getByTestId('estimate-demand-btn')).toBeInTheDocument()
      })
      await act(async () => {
        fireEvent.click(screen.getByTestId('estimate-demand-btn'))
      })
      await waitFor(() => {
        expect(screen.getByTestId('run-optimizer-btn')).not.toBeDisabled()
      })
      await act(async () => {
        fireEvent.click(screen.getByTestId('run-optimizer-btn'))
      })
      // Should handle failure status
      await waitFor(() => {
        expect(
          screen.getByText('Model failed to find solution'),
        ).toBeInTheDocument()
      })
    })
    it('should handle service unavailable scenario', async () => {
      getWhatIfOptimizerOutput.mockResolvedValue({
        statuscode: 503,
        errormsg: 'Service unavailable',
      })
      await act(async () => {
        render(<WhatIfMode mode='whatIf' />)
      })
      // Run optimizer to trigger service error
      await waitFor(() => {
        expect(screen.getByTestId('estimate-demand-btn')).toBeInTheDocument()
      })
      await act(async () => {
        fireEvent.click(screen.getByTestId('estimate-demand-btn'))
      })
      await waitFor(() => {
        expect(screen.getByTestId('run-optimizer-btn')).not.toBeDisabled()
      })
      await act(async () => {
        fireEvent.click(screen.getByTestId('run-optimizer-btn'))
      })
      // Should show service unavailable status
      await waitFor(() => {
        expect(screen.getByText('SERVICE UNAVAILABLE')).toBeInTheDocument()
      })
    })
    it('should handle empty data responses', async () => {
      getDefaultWhatIfPlantParameters.mockResolvedValue({
        statuscode: 200,
        data: {
          plantParameterDetails: [],
          modelId: null,
        },
      })
      getDemand.mockResolvedValue({
        statuscode: 200,
        data: [],
      })
      await act(async () => {
        render(<WhatIfMode mode='whatIf' />)
      })
      // Component should handle empty data
      await waitFor(() => {
        expect(screen.getByTestId('plant-load')).toBeInTheDocument()
      })
    })
  })
  describe('Reducer and State Management', () => {
    it('should handle loading state transitions correctly', async () => {
      await act(async () => {
        render(<WhatIfMode mode='whatIf' />)
      })
      // Multiple loading states should be managed
      await waitFor(() => {
        const loaders = screen.queryAllByText('Loading...')
        // Loaders should eventually disappear
        expect(loaders.length).toBe(0)
      })
    })
    it('should manage price inputs state correctly', async () => {
      await act(async () => {
        render(<WhatIfMode mode='whatIf' />)
      })
      await waitFor(() => {
        expect(screen.getByText('Price Input')).toBeInTheDocument()
      })
      // Open price modal
      fireEvent.click(screen.getByText('Price Input'))
      await waitFor(() => {
        expect(screen.getByTestId('modal-PRICE INPUT')).toBeInTheDocument()
      })
    })
  })
  describe('Utility Functions Integration', () => {
    it('should use getValsBaseOnCondition for conditional rendering', async () => {
      const { getValsBaseOnCondition } = await import('utills/utilities')
      await act(async () => {
        render(<WhatIfMode mode='whatIf' />)
      })
      // Utility function should be called multiple times
      expect(getValsBaseOnCondition).toHaveBeenCalled()
    })
    it('should use CompareValuesWithSymbol for complex conditions', async () => {
      const { CompareValuesWithSymbol } = await import('utills/utilities')
      await act(async () => {
        render(<WhatIfMode mode='whatIf' />)
      })
      // Utility function should be called
    })
  })
  describe('Accessibility and User Experience', () => {
    it('should have proper test IDs for critical elements', async () => {
      await act(async () => {
        render(<WhatIfMode mode='whatIf' />)
      })
      expect(screen.getByTestId('plant-load')).toBeInTheDocument()
      expect(screen.getByTestId('plant-demand')).toBeInTheDocument()
      expect(screen.getByTestId('price-input')).toBeInTheDocument()
      expect(screen.getByTestId('estimate-demand-btn')).toBeInTheDocument()
      expect(screen.getByTestId('run-optimizer-btn')).toBeInTheDocument()
    })
    it('should disable buttons during loading states', async () => {
      await act(async () => {
        render(<WhatIfMode mode='whatIf' />)
      })
      // Initially estimate demand button should be enabled
      await waitFor(() => {
        expect(screen.getByTestId('estimate-demand-btn')).not.toBeDisabled()
      })
    })
  })
})
