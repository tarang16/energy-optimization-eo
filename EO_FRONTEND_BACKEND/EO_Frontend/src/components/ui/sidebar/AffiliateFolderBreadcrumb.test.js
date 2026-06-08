import '@testing-library/jest-dom'
import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import AffiliateFolderBreadcrumb from './AffiliateFolderBreadcrumb'

const mockUseParams = vi.fn().mockReturnValue({
  region: 'middle+east',
  affiliate: 'arrazi',
  plant: 'arrazi-4',
  system: 'reformer+performance+management',
})

vi.mock(import('react-router-dom'), async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    useLocation: () => ({
      pathname:
        'localhost:3000/#/middle+east/yansab/ethylene+glycol/eg+reactor/overview',
    }),
    useParams: () => mockUseParams(),
  }
})

const mockSetAffiliateFolderData = vi.fn()
const mockSetFiles = vi.fn()
const mockSetDynamicFolderHierarchy = vi.fn()
const mockGetFilesByCaseId = vi.fn()
const mockHandleDynamicFolderClick = vi.fn()

describe('AffiliateFolderBreadcrumb', () => {
  const affiliateFolderData = {
    level: 4,
    selectedAffiliate: { affiliateName: 'Affiliate A' },
    selectedPlant: { plantName: 'Plant B' },
    selectedSystem: { systemName: 'System C' },
  }

  const dynamicFolderHierarchy = [
    { id: 1, label: 'Dynamic Folder 1' },
    { id: 2, label: 'Dynamic Folder 2' },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('renders breadcrumb correctly based on affiliateFolderData', () => {
    render(
      <AffiliateFolderBreadcrumb
        affiliateFolderData={affiliateFolderData}
        setAffiliateFolderData={mockSetAffiliateFolderData}
        dynamicFolderHierarchy={dynamicFolderHierarchy}
        setFiles={mockSetFiles}
        setDynamicFolderHierarchy={mockSetDynamicFolderHierarchy}
        getFilesByCaseId={mockGetFilesByCaseId}
        handleDynamicFolderClick={mockHandleDynamicFolderClick}
      />,
    )

    expect(screen.getByText('Home')).toBeInTheDocument()
    expect(screen.getByText('Affiliate A')).toBeInTheDocument()
    expect(screen.getByText('Plant B')).toBeInTheDocument()
    expect(screen.getByText('System C')).toBeInTheDocument()
    expect(screen.getByTestId('dynamic-1')).toBeInTheDocument()
    expect(screen.getByTestId('dynamic-2')).toBeInTheDocument()
  })

  test('calls handleItemClick with correct level on click', () => {
    const { getByText } = render(
      <AffiliateFolderBreadcrumb
        affiliateFolderData={affiliateFolderData}
        setAffiliateFolderData={mockSetAffiliateFolderData}
        dynamicFolderHierarchy={dynamicFolderHierarchy}
        setFiles={mockSetFiles}
        setDynamicFolderHierarchy={mockSetDynamicFolderHierarchy}
        getFilesByCaseId={mockGetFilesByCaseId}
        handleDynamicFolderClick={mockHandleDynamicFolderClick}
      />,
    )

    // Click on Home
    fireEvent.click(getByText('Home'))
    expect(mockSetAffiliateFolderData).toHaveBeenCalledWith({
      level: 1,
      type: 'affiliate',
      selectedRegion: '',
      selectedAffiliate: '',
      selectedPlant: '',
      selectedSystem: '',
    })
    expect(mockSetFiles).toHaveBeenCalled()
    expect(mockSetDynamicFolderHierarchy).toHaveBeenCalled()

    fireEvent.click(screen.getByText('Affiliate A'))
    expect(mockSetAffiliateFolderData).toHaveBeenCalledWith({
      level: 1,
      type: 'affiliate',
      selectedRegion: '',
      selectedAffiliate: '',
      selectedPlant: '',
      selectedSystem: '',
    })
    expect(mockSetFiles).toHaveBeenCalled()
    expect(mockSetDynamicFolderHierarchy).toHaveBeenCalled()

    fireEvent.click(screen.getByText('Plant B'))
    expect(mockSetAffiliateFolderData).toHaveBeenCalledWith({
      level: 1,
      type: 'affiliate',
      selectedSystem: '',
      selectedRegion: '',
      selectedAffiliate: '',
      selectedPlant: '',
    })
    expect(mockSetFiles).toHaveBeenCalled()
    expect(mockSetDynamicFolderHierarchy).toHaveBeenCalled()

    fireEvent.click(screen.getByText('System C'))
    expect(mockGetFilesByCaseId).toHaveBeenCalledWith(
      affiliateFolderData.selectedSystem,
    )
  })

  test('calls handleDynamicFolderClick on dynamic folder click', () => {
    const { getByTestId } = render(
      <AffiliateFolderBreadcrumb
        affiliateFolderData={affiliateFolderData}
        setAffiliateFolderData={mockSetAffiliateFolderData}
        dynamicFolderHierarchy={dynamicFolderHierarchy}
        setFiles={mockSetFiles}
        setDynamicFolderHierarchy={mockSetDynamicFolderHierarchy}
        getFilesByCaseId={mockGetFilesByCaseId}
        handleDynamicFolderClick={mockHandleDynamicFolderClick}
      />,
    )

    fireEvent.click(getByTestId('dynamic-1'))
    expect(mockHandleDynamicFolderClick).toHaveBeenCalledWith(
      1,
      'Dynamic Folder 1',
    )

    fireEvent.click(getByTestId('dynamic-2'))
    expect(mockHandleDynamicFolderClick).toHaveBeenCalledWith(
      2,
      'Dynamic Folder 2',
    )
  })
})
