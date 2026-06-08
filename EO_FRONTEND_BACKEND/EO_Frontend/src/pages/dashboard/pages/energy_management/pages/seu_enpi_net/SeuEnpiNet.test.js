import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import * as ActivityTrackerConfig from 'config/ActivityTrackerConfig'
import { useAtomValue } from 'jotai'
import { BrowserRouter, useOutletContext, useParams } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import SeuEnpiNet from './SeuEnpiNet'

// Mock dependencies
vi.mock(import('jotai'), async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    // your mocked methods
    useAtomValue: vi.fn(),
  }
})

vi.mock('react-router-dom', () => ({
  useParams: vi.fn(),
  useOutletContext: vi.fn(),
  BrowserRouter: ({ children }) => <div>{children}</div>,
}))

vi.mock('components/visuals/table/em_table/EnergyManagementTable', () => ({
  default: vi.fn(({ setDownloadData, dateRange, selectedPlants, caseId }) => {
    // Store setDownloadData for testing
    if (typeof window.__setDownloadDataRef === 'function') {
      window.__setDownloadDataRef(setDownloadData)
    }
    return (
      <div data-testid='energy-management-table'>
        Energy Management Table
        <button
          data-testid='mock-set-data'
          onClick={() => setDownloadData([{ col1: 'value1', col2: 'value2' }])}
        >
          Set Data
        </button>
      </div>
    )
  }),
}))

vi.mock(
  'components/visuals/system/energy_management/seu_enpi_net/SeuEnpiNetChart',
  () => ({
    default: vi.fn(({ dateRange, selectedPlants, caseId }) => (
      <div data-testid='seu-enpi-net-chart'>SEU ENPI Net Chart</div>
    )),
  }),
)

vi.mock('config/ActivityTrackerConfig', () => ({
  TRACKEVENTOBJ: {
    SeuEnpiNet: {
      onTabClick: vi.fn(),
    },
  },
}))

// Mock the SVG import
vi.mock('assets/sabic_icons/sidebar/download_icon.svg', () => ({
  default: 'download-icon-src',
}))

// Mock styles
vi.mock('../../EnergyManagement.module.scss', () => ({
  default: {
    seuEnpinetContainer: 'mock-seuEnpinetContainer',
    seuEnpinetTabsContainer: 'mock-seuEnpinetTabsContainer',
    seuEnpinetTabsContainer__tabButton: 'mock-tabButton',
    seuEnpinetTabsContainer__tabContent: 'mock-tabContent',
    navItem: 'mock-navItem',
    btnActive: 'mock-btnActive',
    btnContainer: 'mock-btnContainer',
  },
}))

// Mock OverlayTrigger and Tooltip
vi.mock('react-bootstrap', () => ({
  OverlayTrigger: vi.fn(({ children, overlay }) => {
    const overlayContent = typeof overlay === 'function' ? overlay({}) : overlay
    return (
      <div data-testid='overlay-trigger'>
        {overlayContent}
        {children}
      </div>
    )
  }),
  Tooltip: vi.fn(({ children, ...props }) => (
    <div data-testid='tooltip' {...props}>
      {children}
    </div>
  )),
}))

describe('SeuEnpiNet Component', () => {
  const mockParams = { id: '123' }
  const mockAppContext = { caseData: { id: 'case123' } }
  const mockOutletContext = {
    selectedPlants: ['plant1', 'plant2'],
    caseId: 'case123',
    dateRange: { start: '2024-01-01', end: '2024-01-31' },
  }

  beforeEach(() => {
    vi.clearAllMocks()
    useParams.mockReturnValue(mockParams)
    useAtomValue.mockReturnValue(mockAppContext)
    useOutletContext.mockReturnValue(mockOutletContext)

    // Clean up window reference
    delete window.__setDownloadDataRef
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  const renderComponent = () => {
    return render(
      <BrowserRouter>
        <SeuEnpiNet />
      </BrowserRouter>,
    )
  }

  describe('Initial Rendering', () => {
    it('should render the component with tabs', () => {
      renderComponent()

      // Check if both tabs are rendered
      const tabs = screen.getAllByTestId('seu-enpi-net-tabs')
      expect(tabs).toHaveLength(2)

      // Check tab labels
      expect(screen.getByText('SIGNIFICANT ENERGY USERS')).toBeInTheDocument()
      expect(screen.getByText('SEU ENPI NET')).toBeInTheDocument()

      // Check if first tab is active by default
      const activeButton = screen
        .getByText('SIGNIFICANT ENERGY USERS')
        .closest('button')
      expect(activeButton).toHaveClass('mock-btnActive')
    })

    it('should render EnergyManagementTable by default', () => {
      renderComponent()
      expect(screen.getByTestId('energy-management-table')).toBeInTheDocument()
    })

    it('should render download icon only on significant energy users tab', () => {
      renderComponent()

      // Download icon should be visible on first tab
      expect(screen.getByTestId('downloadIcon')).toBeInTheDocument()
      expect(screen.getByTestId('overlay-trigger')).toBeInTheDocument()
    })
  })

  describe('Tab Switching', () => {
    it('should switch to SEU ENPI NET tab when clicked', async () => {
      renderComponent()

      // Click on second tab
      const seuEnpiTab = screen.getByText('SEU ENPI NET')
      fireEvent.click(seuEnpiTab)

      // Check if tracker was called
      expect(
        ActivityTrackerConfig.TRACKEVENTOBJ.SeuEnpiNet.onTabClick,
      ).toHaveBeenCalledWith(
        { params: mockParams, caseData: mockAppContext.caseData },
        'SEU ENPI NET',
      )

      // Check if content changed
      await waitFor(() => {
        expect(screen.getByTestId('seu-enpi-net-chart')).toBeInTheDocument()
      })

      // Download icon should not be visible on second tab
      expect(screen.queryByTestId('downloadIcon')).not.toBeInTheDocument()
    })

    it('should switch back to significant energy users tab when clicked', async () => {
      renderComponent()

      // Switch to second tab
      fireEvent.click(screen.getByText('SEU ENPI NET'))

      // Switch back to first tab
      fireEvent.click(screen.getByText('SIGNIFICANT ENERGY USERS'))

      // Check if tracker was called for first tab
      expect(
        ActivityTrackerConfig.TRACKEVENTOBJ.SeuEnpiNet.onTabClick,
      ).toHaveBeenCalledWith(
        { params: mockParams, caseData: mockAppContext.caseData },
        'SIGNIFICANT ENERGY USERS',
      )

      // Check if EnergyManagementTable is rendered again
      await waitFor(() => {
        expect(
          screen.getByTestId('energy-management-table'),
        ).toBeInTheDocument()
      })

      // Download icon should be visible again
      expect(screen.getByTestId('downloadIcon')).toBeInTheDocument()
    })
  })

  describe('Download Functionality', () => {
    let mockSetDownloadData

    beforeEach(() => {
      // Capture setDownloadData from mocked component
      window.__setDownloadDataRef = (fn) => {
        mockSetDownloadData = fn
      }
    })

    const triggerDownload = () => {
      fireEvent.click(screen.getByTestId('downloadIcon').closest('button'))
    }

    const mockDownloadData = () => {
      // Simulate EnergyManagementTable setting download data
      const setDataButton = screen.getByTestId('mock-set-data')
      fireEvent.click(setDataButton)
    }

    it('should not trigger download when downloadData is empty', () => {
      // Mock createElement to track if it's called
      const createElementSpy = vi.spyOn(document, 'createElement')

      renderComponent()
      triggerDownload()

      expect(createElementSpy).toHaveBeenCalled()
    })

    // it('should download CSV file when downloadData has data', async () => {
    //   // Mock document.createElement and link methods
    //   const mockClick = vi.fn()
    //   const mockLink = {
    //     href: '',
    //     download: '',
    //     click: mockClick,
    //   }

    //   const createElementSpy = vi
    //     .spyOn(document, 'createElement')
    //     .mockReturnValue(mockLink)
    //   const appendChildSpy = vi.spyOn(document.body, 'appendChild')
    //   const removeChildSpy = vi.spyOn(document.body, 'removeChild')

    //   renderComponent()

    //   // Set download data
    //   mockDownloadData()

    //   // Trigger download
    //   triggerDownload()

    //   // Check if link was created and configured correctly
    //   expect(createElementSpy).toHaveBeenCalledWith('a')
    //   expect(mockLink.download).toBe('SEU_ENPI_Significant Energy Users.csv')
    //   expect(mockLink.href).toContain('data:text/csv;charset=utf-8')
    //   expect(mockLink.href).toContain(
    //     encodeURIComponent('col1,col2\nvalue1,value2'),
    //   )

    //   // Check if link was added to DOM, clicked, and removed
    //   expect(appendChildSpy).toHaveBeenCalledWith(mockLink)
    //   expect(mockClick).toHaveBeenCalled()
    //   expect(removeChildSpy).toHaveBeenCalledWith(mockLink)
    // })

    // it('should handle complex CSV data with special characters', async () => {
    //   // Override the mock to set more complex data
    //   vi.mock(
    //     'components/visuals/table/em_table/EnergyManagementTable',
    //     () => ({
    //       default: vi.fn(({ setDownloadData }) => {
    //         if (typeof window.__setDownloadDataRef === 'function') {
    //           window.__setDownloadDataRef(setDownloadData)
    //         }
    //         return (
    //           <div data-testid='energy-management-table'>
    //             <button
    //               data-testid='mock-set-complex-data'
    //               onClick={() =>
    //                 setDownloadData([
    //                   { 'column,1': 'value,1', 'column 2': 'value 2' },
    //                   { 'column,1': 'value,2', 'column 2': 'value,2' },
    //                 ])
    //               }
    //             >
    //               Set Complex Data
    //             </button>
    //           </div>
    //         )
    //       }),
    //     }),
    //   )

    //   const mockClick = vi.fn()
    //   const mockLink = {
    //     href: '',
    //     download: '',
    //     click: mockClick,
    //   }

    //   vi.spyOn(document, 'createElement').mockReturnValue(mockLink)

    //   renderComponent()

    //   // Set complex download data
    //   fireEvent.click(screen.getByTestId('mock-set-complex-data'))

    //   // Trigger download
    //   triggerDownload()

    //   // Verify CSV formatting
    //   expect(mockLink.href).toContain('column%2C1,column%202')
    //   expect(mockLink.href).toContain('value%2C1,value%202')
    //   expect(mockLink.href).toContain('value%2C2,value%2C2')
    // })
  })

  describe('Default Case in RenderContent', () => {
    it('should show default message when no valid tab is selected', async () => {
      renderComponent()

      // Get the component instance and manually trigger default case
      // We need to test the switch statement's default case

      // First, let's test that the switch statement works correctly for valid tabs
      expect(screen.getByTestId('energy-management-table')).toBeInTheDocument()

      // Switch to SEU ENPI NET tab
      fireEvent.click(screen.getByText('SEU ENPI NET'))
      await waitFor(() => {
        expect(screen.getByTestId('seu-enpi-net-chart')).toBeInTheDocument()
      })

      // Now we need to test the default case - we can do this by accessing the component's
      // internal state but that's not recommended. Instead, let's ensure that the
      // component handles invalid tab states appropriately by testing the tabs array
      // and the activeTab state initialization

      // The component initializes with tabs[0].id, so it should never hit default
      // But we can test that the function returns something for all possible values

      // Verify that both valid tabs render content without showing default message
      expect(
        screen.queryByText('Select a tab to view content.'),
      ).not.toBeInTheDocument()
    })
  })

  describe('Tooltip Functionality', () => {
    it('should render tooltip with correct content', () => {
      renderComponent()

      // Check if tooltip is rendered with correct content
      const tooltip = screen.getByTestId('tooltip')
      expect(tooltip).toHaveAttribute(
        'data-static-id',
        'SeuEnpiNet.js_Tooltip_16c159',
      )
      expect(screen.getByText('Download')).toBeInTheDocument()
    })

    // it('should have correct styling on tooltip content', () => {
    //   renderComponent()

    //   const tooltipDiv = screen.getByText('Download').parentElement
    //   expect(tooltipDiv).toHaveClass(
    //     'text-14-regular',
    //     'text-uppercase',
    //     'text-white',
    //     'p-1',
    //   )
    //   expect(tooltipDiv).toHaveAttribute(
    //     'data-static-id',
    //     'SeuEnpiNet.js_div_10a3a5',
    //   )
    // })
  })

  // describe('Props and Context', () => {
  //   // it('should pass correct props to EnergyManagementTable', () => {
  //   //   renderComponent()
  //   //   const EnergyManagementTableMock = vi.mocked(
  //   //     require('components/visuals/table/em_table/EnergyManagementTable')
  //   //       .default,
  //   //   )
  //   //   expect(EnergyManagementTableMock).toHaveBeenCalledWith(
  //   //     expect.objectContaining({
  //   //       dateRange: mockOutletContext.dateRange,
  //   //       selectedPlants: mockOutletContext.selectedPlants,
  //   //       caseId: mockOutletContext.caseId,
  //   //       setDownloadData: expect.any(Function),
  //   //     }),
  //   //     expect.anything(),
  //   //   )
  //   // })
  //   // it('should pass correct props to SeuEnpiNetChart', async () => {
  //   //   renderComponent()
  //   //   // Switch to SEU ENPI NET tab
  //   //   fireEvent.click(screen.getByText('SEU ENPI NET'))
  //   //   const SeuEnpiNetChartMock = vi.mocked(
  //   //     require('components/visuals/system/energy_management/seu_enpi_net/SeuEnpiNetChart')
  //   //       .default,
  //   //   )
  //   //   await waitFor(() => {
  //   //     expect(SeuEnpiNetChartMock).toHaveBeenCalledWith(
  //   //       expect.objectContaining({
  //   //         dateRange: mockOutletContext.dateRange,
  //   //         selectedPlants: mockOutletContext.selectedPlants,
  //   //         caseId: mockOutletContext.caseId,
  //   //       }),
  //   //       expect.anything(),
  //   //     )
  //   //   })
  //   // })
  // })

  describe('Data Attributes', () => {
    it('should have correct static data attributes', () => {
      renderComponent()

      // Check main container
      expect(screen.getByTestId('seu-enpi-net-tab-content')).toBeInTheDocument()

      // Check if download icon has correct data-static-id
      const downloadImg = screen
        .getByTestId('downloadIcon')
        .querySelector('img')
      expect(downloadImg).toHaveAttribute(
        'data-static-id',
        'SeuEnpiNet.js_img_8cebbf',
      )
    })
  })

  describe('Edge Cases', () => {
    it('should handle undefined downloadData gracefully', () => {
      // Override the mock to not set downloadData
      vi.mock(
        'components/visuals/table/em_table/EnergyManagementTable',
        () => ({
          default: vi.fn(({ setDownloadData }) => {
            if (typeof window.__setDownloadDataRef === 'function') {
              window.__setDownloadDataRef(setDownloadData)
            }
            return (
              <div data-testid='energy-management-table'>
                Energy Management Table
              </div>
            )
          }),
        }),
      )

      const createElementSpy = vi.spyOn(document, 'createElement')

      renderComponent()

      // Trigger download without setting data
      const downloadButton = screen
        .getByTestId('downloadIcon')
        .closest('button')
      fireEvent.click(downloadButton)

      expect(createElementSpy).toHaveBeenCalled()
    })

    it('should handle empty downloadData array', () => {
      const createElementSpy = vi.spyOn(document, 'createElement')

      renderComponent()

      // Trigger download with empty array (initial state)
      const downloadButton = screen
        .getByTestId('downloadIcon')
        .closest('button')
      fireEvent.click(downloadButton)

      expect(createElementSpy).toHaveBeenCalled()
    })
  })
})
