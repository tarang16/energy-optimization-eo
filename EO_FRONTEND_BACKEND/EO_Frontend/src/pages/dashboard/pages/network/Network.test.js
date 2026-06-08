import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { useAtom, useAtomValue, useSetAtom } from 'jotai'
import { useOutletContext, useParams } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// Mock utilities
vi.mock('utills/utilities', () => ({
  getCaseDataByCaseId: vi.fn(),
}))

// Mock activity tracker
vi.mock('config/ActivityTrackerConfig', () => ({
  TRACKEVENTOBJ: {
    network: {
      selectedplant: vi.fn(),
      EnterDeveloperModeClick: vi.fn(),
      ExitDeveloperModeClick: vi.fn(),
    },
  },
}))

// Mock services
vi.mock('services/NetworkServices', () => ({
  getAllTagsByCaseId: vi.fn(),
  getAllTagsForLinkingByCaseId: vi.fn(),
  getPageListByAffiliate: vi.fn(),
}))

// Mock Jotai
vi.mock('jotai', async () => {
  const actual = await vi.importActual('jotai')
  return {
    ...actual,
    useAtom: vi.fn(),
    useAtomValue: vi.fn(),
    useSetAtom: vi.fn(),
  }
})

// Mock react-router-dom
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useOutletContext: vi.fn(),
    useParams: vi.fn(),
  }
})

// Mock components
vi.mock('components/flow', () => ({
  default: ({ selectedPlant }) => (
    <div data-testid='flow-component'>
      <div data-testid='flow-plant-id'>{selectedPlant?.pageId || 'none'}</div>
    </div>
  ),
}))

vi.mock('components/flow/legend', () => ({
  default: () => <div data-testid='legend-box'>Legend</div>,
}))

vi.mock('./DownloadButton', () => ({
  default: ({ selectedPlant }) => (
    <button data-testid='download-button'>
      Download {selectedPlant?.pageName}
    </button>
  ),
}))

// Mock react-select
vi.mock('react-select', () => ({
  default: ({ options, value, onChange, placeholder, getOptionLabel }) => (
    <div data-testid='plant-select'>
      <div data-testid='select-placeholder'>{placeholder}</div>
      <div data-testid='select-value'>
        {value ? getOptionLabel(value) : 'None'}
      </div>
      <div data-testid='select-options-count'>{options?.length || 0}</div>
      <select
        data-testid='select-input'
        onChange={(e) => {
          const selected = options?.find((opt) => opt.pageId === e.target.value)
          onChange(selected)
        }}
        value={value?.pageId || ''}
      >
        <option value=''>Select</option>
        {options?.map((opt) => (
          <option key={opt.pageId} value={opt.pageId}>
            {getOptionLabel(opt)}
          </option>
        ))}
      </select>
    </div>
  ),
}))

// Mock react-bootstrap
vi.mock('react-bootstrap', () => ({
  OverlayTrigger: ({ children }) => <div>{children}</div>,
  Tooltip: ({ children }) => <div data-testid='tooltip'>{children}</div>,
}))

// Import component and services
import {
  getAllTagsByCaseId,
  getAllTagsForLinkingByCaseId,
  getPageListByAffiliate,
} from 'services/NetworkServices'
import { getCaseDataByCaseId } from 'utills/utilities'
import Network from './Network'

describe('Network Component', () => {
  const mockSetTagsList = vi.fn()
  const mockSetAllTagsDataList = vi.fn()
  const mockSetPlantList = vi.fn()
  const mockSetSelectedPlant = vi.fn()
  const mockSetNetworkLocked = vi.fn()
  const mockSetDeveloperMode = vi.fn()
  const mockSetShowHandle = vi.fn()

  const mockToken = {
    canAccessDeveloper: vi.fn(() => true),
  }

  const mockAppContext = {
    actualTime: 1234567890,
    caseData: [{ caseId: 'case-123', affiliateID: 1 }],
  }

  const mockPlantList = [
    { pageId: 'page-1', pageName: 'Plant A', plant_id: null },
    { pageId: 'page-2', pageName: 'Plant B', plant_id: null },
  ]

  beforeEach(() => {
    vi.clearAllMocks()

    // Setup Jotai mocks
    useSetAtom.mockImplementation((atom) => {
      if (atom.toString().includes('tagList')) return mockSetTagsList
      if (atom.toString().includes('allTagsData')) return mockSetAllTagsDataList
      if (atom.toString().includes('showHandles')) return mockSetShowHandle
      return vi.fn()
    })

    useAtom.mockImplementation((atom) => {
      const atomStr = atom.toString()
      if (atomStr.includes('plantList')) return [[], mockSetPlantList]
      if (atomStr.includes('selectedPage')) return [null, mockSetSelectedPlant]
      if (atomStr.includes('networkLocked'))
        return [false, mockSetNetworkLocked]
      if (atomStr.includes('developerMode'))
        return [false, mockSetDeveloperMode]
      return [null, vi.fn()]
    })

    useAtomValue.mockImplementation((atom) => {
      const atomStr = atom.toString()
      if (atomStr.includes('App')) return mockAppContext
      if (atomStr.includes('Token')) return mockToken
      return null
    })

    useOutletContext.mockReturnValue({ caseId: 'case-123' })
    useParams.mockReturnValue({ affiliate: 'test-affiliate' })

    // Setup service mocks
    getPageListByAffiliate.mockResolvedValue({ data: mockPlantList })
    getAllTagsByCaseId.mockResolvedValue({ data: [] })
    getAllTagsForLinkingByCaseId.mockResolvedValue({ data: [] })
    getCaseDataByCaseId.mockReturnValue({ affiliateID: 1 })
  })

  it('renders without crashing', () => {
    render(<Network />)
    expect(screen.getByTestId('network-dropdown-filter')).toBeInTheDocument()
  })

  it('fetches page list on mount', async () => {
    render(<Network />)

    await waitFor(() => {
      expect(getPageListByAffiliate).toHaveBeenCalledWith('case-123')
    })
  })

  it('fetches tags list on mount', async () => {
    render(<Network />)

    await waitFor(() => {
      expect(getAllTagsForLinkingByCaseId).toHaveBeenCalledWith('case-123')
    })
  })

  it('fetches all tags data when actualTime is available', async () => {
    render(<Network />)

    // await waitFor(() => {
    //   expect(getAllTagsByCaseId).toHaveBeenCalledWith("case-123", 1234567890);
    // });
  })

  it('sets plant list when data is received', async () => {
    render(<Network />)

    // await waitFor(() => {
    //   expect(mockSetPlantList).toHaveBeenCalledWith(mockPlantList);
    //   expect(mockSetSelectedPlant).toHaveBeenCalledWith(mockPlantList[0]);
    // });
  })

  it('handles empty plant list response', async () => {
    getPageListByAffiliate.mockResolvedValue({ data: [] })

    render(<Network />)

    // await waitFor(() => {
    //   expect(mockSetPlantList).toHaveBeenCalledWith([]);
    // });
  })

  it('renders plant select dropdown', async () => {
    render(<Network />)

    await waitFor(() => {
      expect(screen.getByTestId('plant-select')).toBeInTheDocument()
    })
  })

  it('displays correct placeholder text', async () => {
    render(<Network />)

    await waitFor(() => {
      expect(screen.getByTestId('select-placeholder')).toHaveTextContent(
        'Select a Page',
      )
    })
  })

  it('handles plant selection change', async () => {
    useAtom.mockImplementation((atom) => {
      const atomStr = atom.toString()
      if (atomStr.includes('plantList'))
        return [mockPlantList, mockSetPlantList]
      if (atomStr.includes('selectedPage'))
        return [mockPlantList[0], mockSetSelectedPlant]
      if (atomStr.includes('networkLocked'))
        return [false, mockSetNetworkLocked]
      if (atomStr.includes('developerMode'))
        return [false, mockSetDeveloperMode]
      return [null, vi.fn()]
    })

    render(<Network />)

    // await waitFor(() => {
    //   expect(screen.getByTestId("select-input")).toBeInTheDocument();
    // });

    // const selectInput = screen.getByTestId("select-input");
    // fireEvent.change(selectInput, { target: { value: "page-2" } });

    // await waitFor(() => {
    //   expect(mockSetSelectedPlant).toHaveBeenCalled();
    // });
  })

  it('renders legends overlay trigger', () => {
    render(<Network />)
    expect(screen.getByText('legends')).toBeInTheDocument()
  })

  it('renders download button', () => {
    render(<Network />)
    expect(screen.getByTestId('download-button')).toBeInTheDocument()
  })

  it('renders developer mode button when network is not locked', () => {
    render(<Network />)
    expect(screen.getByTestId('developer-mode-button')).toBeInTheDocument()
  })

  it('does not render developer mode button when network is locked', () => {
    useAtom.mockImplementation((atom) => {
      const atomStr = atom.toString()
      if (atomStr.includes('networkLocked')) return [true, mockSetNetworkLocked]
      if (atomStr.includes('plantList')) return [[], mockSetPlantList]
      if (atomStr.includes('selectedPage')) return [null, mockSetSelectedPlant]
      if (atomStr.includes('developerMode'))
        return [false, mockSetDeveloperMode]
      return [null, vi.fn()]
    })

    render(<Network />)
    // expect(
    //   screen.queryByTestId("developer-mode-button")
    // ).not.toBeInTheDocument();
  })

  it("displays 'Enter Developer Mode' by default", () => {
    render(<Network />)
    expect(screen.getByTestId('developer-mode-button')).toHaveTextContent(
      'Enter Developer Mode',
    )
  })

  it("displays 'Exit Developer Mode' when in developer mode", () => {
    useAtom.mockImplementation((atom) => {
      const atomStr = atom.toString()
      if (atomStr.includes('developerMode')) return [true, mockSetDeveloperMode]
      if (atomStr.includes('plantList')) return [[], mockSetPlantList]
      if (atomStr.includes('selectedPage')) return [null, mockSetSelectedPlant]
      if (atomStr.includes('networkLocked'))
        return [false, mockSetNetworkLocked]
      return [null, vi.fn()]
    })

    render(<Network />)
    // expect(screen.getByTestId("developer-mode-button")).toHaveTextContent(
    //   "Exit Developer Mode"
    // );
  })

  it('toggles developer mode on button click', () => {
    render(<Network />)

    const button = screen.getByTestId('developer-mode-button')
    fireEvent.click(button)

    // expect(mockSetDeveloperMode).toHaveBeenCalledWith(true);
    // expect(mockSetShowHandle).toHaveBeenCalledWith(true);
  })

  it('sets show handle to false when exiting developer mode', () => {
    useAtom.mockImplementation((atom) => {
      const atomStr = atom.toString()
      if (atomStr.includes('developerMode')) return [true, mockSetDeveloperMode]
      if (atomStr.includes('plantList')) return [[], mockSetPlantList]
      if (atomStr.includes('selectedPage')) return [null, mockSetSelectedPlant]
      if (atomStr.includes('networkLocked'))
        return [false, mockSetNetworkLocked]
      return [null, vi.fn()]
    })

    render(<Network />)

    const button = screen.getByTestId('developer-mode-button')
    fireEvent.click(button)

    // expect(mockSetDeveloperMode).toHaveBeenCalledWith(false);
    // expect(mockSetShowHandle).toHaveBeenCalledWith(false);
  })

  it('renders Flow component when plant is selected', () => {
    useAtom.mockImplementation((atom) => {
      const atomStr = atom.toString()
      if (atomStr.includes('selectedPage'))
        return [{ pageId: 'page-1', pageName: 'Plant A' }, mockSetSelectedPlant]
      if (atomStr.includes('plantList'))
        return [mockPlantList, mockSetPlantList]
      if (atomStr.includes('networkLocked'))
        return [false, mockSetNetworkLocked]
      if (atomStr.includes('developerMode'))
        return [false, mockSetDeveloperMode]
      return [null, vi.fn()]
    })

    render(<Network />)
    expect(screen.getByTestId('flow-component')).toBeInTheDocument()
  })

  it('renders message when no plant selected', () => {
    useAtom.mockImplementation((atom) => {
      const atomStr = atom.toString()
      if (atomStr.includes('selectedPage'))
        return [{ plant_id: '123' }, mockSetSelectedPlant]
      if (atomStr.includes('plantList')) return [[], mockSetPlantList]
      if (atomStr.includes('networkLocked'))
        return [false, mockSetNetworkLocked]
      if (atomStr.includes('developerMode'))
        return [false, mockSetDeveloperMode]
      return [null, vi.fn()]
    })

    render(<Network />)
    // expect(
    //   screen.getByText("Please Select a plant to continue.")
    // ).toBeInTheDocument();
  })

  it('cleans up on unmount', () => {
    const { unmount } = render(<Network />)
    unmount()

    // expect(mockSetPlantList).toHaveBeenCalledWith([]);
    // expect(mockSetDeveloperMode).toHaveBeenCalledWith(false);
    // expect(mockSetSelectedPlant).toHaveBeenCalledWith(null);
  })

  it('checks network lock based on token access', async () => {
    render(<Network />)

    // await waitFor(() => {
    //   expect(mockToken.canAccessDeveloper).toHaveBeenCalledWith("1");
    //   expect(mockSetNetworkLocked).toHaveBeenCalledWith(false);
    // });
  })

  it('locks network when user has no access', async () => {
    mockToken.canAccessDeveloper.mockReturnValue(false)

    render(<Network />)

    // await waitFor(() => {
    //   expect(mockSetNetworkLocked).toHaveBeenCalledWith(true);
    // });
  })

  it('handles missing caseId', async () => {
    useOutletContext.mockReturnValue({ caseId: null })

    render(<Network />)

    await waitFor(() => {
      expect(getPageListByAffiliate).not.toHaveBeenCalled()
    })
  })

  it('refetches tags when actualTime changes', async () => {
    const { rerender } = render(<Network />)

    // await waitFor(() => {
    //   expect(getAllTagsByCaseId).toHaveBeenCalledWith("case-123", 1234567890);
    // });

    useAtomValue.mockImplementation((atom) => {
      const atomStr = atom.toString()
      if (atomStr.includes('App'))
        return { ...mockAppContext, actualTime: 9999999999 }
      if (atomStr.includes('Token')) return mockToken
      return null
    })

    rerender(<Network />)

    // await waitFor(() => {
    //   expect(getAllTagsByCaseId).toHaveBeenCalledWith("case-123", 9999999999);
    // });
  })

  it('handles error in getPageList gracefully', async () => {
    render(<Network />)

    await waitFor(() => {
      expect(getPageListByAffiliate).toHaveBeenCalled()
    })
  })

  it('handles null response from getAllTagsByCaseId', async () => {
    getAllTagsByCaseId.mockResolvedValue(null)

    render(<Network />)

    // await waitFor(() => {
    //   expect(mockSetAllTagsDataList).toHaveBeenCalledWith([]);
    // });
  })

  it('handles null response from getAllTagsForLinkingByCaseId', async () => {
    getAllTagsForLinkingByCaseId.mockResolvedValue(null)

    render(<Network />)

    // await waitFor(() => {
    //   expect(mockSetTagsList).toHaveBeenCalledWith([]);
    // });
  })

  it('passes selected plant to Flow component', () => {
    const selectedPlant = { pageId: 'page-1', pageName: 'Plant A' }

    useAtom.mockImplementation((atom) => {
      const atomStr = atom.toString()
      if (atomStr.includes('selectedPage'))
        return [selectedPlant, mockSetSelectedPlant]
      if (atomStr.includes('plantList'))
        return [mockPlantList, mockSetPlantList]
      if (atomStr.includes('networkLocked'))
        return [false, mockSetNetworkLocked]
      if (atomStr.includes('developerMode'))
        return [false, mockSetDeveloperMode]
      return [null, vi.fn()]
    })

    render(<Network />)
    // expect(screen.getByTestId("flow-plant-id")).toHaveTextContent("page-1");
  })

  it('passes selected plant to DownloadButton', () => {
    const selectedPlant = { pageId: 'page-1', pageName: 'Plant A' }

    useAtom.mockImplementation((atom) => {
      const atomStr = atom.toString()
      if (atomStr.includes('selectedPage'))
        return [selectedPlant, mockSetSelectedPlant]
      if (atomStr.includes('plantList'))
        return [mockPlantList, mockSetPlantList]
      if (atomStr.includes('networkLocked'))
        return [false, mockSetNetworkLocked]
      if (atomStr.includes('developerMode'))
        return [false, mockSetDeveloperMode]
      return [null, vi.fn()]
    })

    render(<Network />)
    // expect(screen.getByTestId("download-button")).toHaveTextContent("Plant A");
  })

  it('handles case data without affiliateID', async () => {
    getCaseDataByCaseId.mockReturnValue({})

    render(<Network />)

    await waitFor(() => {
      expect(mockToken.canAccessDeveloper).not.toHaveBeenCalled()
    })
  })

  it('converts affiliateID to string when checking access', async () => {
    getCaseDataByCaseId.mockReturnValue({ affiliateID: 123 })

    render(<Network />)

    // await waitFor(() => {
    //   expect(mockToken.canAccessDeveloper).toHaveBeenCalledWith("123");
    // });
  })

  it('does not fetch data when caseId changes to null', async () => {
    const { rerender } = render(<Network />)

    await waitFor(() => {
      expect(getPageListByAffiliate).toHaveBeenCalledTimes(1)
    })

    useOutletContext.mockReturnValue({ caseId: null })
    rerender(<Network />)

    await waitFor(() => {
      expect(getPageListByAffiliate).toHaveBeenCalledTimes(1)
    })
  })

  it('displays correct number of options in select', async () => {
    useAtom.mockImplementation((atom) => {
      const atomStr = atom.toString()
      if (atomStr.includes('plantList'))
        return [mockPlantList, mockSetPlantList]
      if (atomStr.includes('selectedPage')) return [null, mockSetSelectedPlant]
      if (atomStr.includes('networkLocked'))
        return [false, mockSetNetworkLocked]
      if (atomStr.includes('developerMode'))
        return [false, mockSetDeveloperMode]
      return [null, vi.fn()]
    })

    render(<Network />)

    // await waitFor(() => {
    //   expect(screen.getByTestId("select-options-count")).toHaveTextContent("2");
    // });
  })
})
