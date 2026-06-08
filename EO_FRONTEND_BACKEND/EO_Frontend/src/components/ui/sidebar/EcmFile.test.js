import { act, fireEvent, render, waitFor } from '@testing-library/react'
import * as services from 'services/EcmServices'
import { beforeEach, describe, expect, it, vi } from 'vitest' // Adjust import for mocked services
import EcmFile from './EcmFile' // Adjust the import path as necessary

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

vi.mock('services/EcmServices', () => ({
  downloadFromEcm: vi.fn(),
  get_ecm_files: vi.fn(),
}))

const mockSetDownloadingFileIds = vi.fn()
const mockSetFiles = vi.fn()
const mockSetDynamicFolderHierarchy = vi.fn()
const mockSetLoading = vi.fn()

const defaultProps = {
  file_name: 'Test File',
  file_type: 'pdf',
  setDownloadingFileIds: mockSetDownloadingFileIds,
  downloadingFileIds: [],
  id: '123',
  file_size: '1 MB',
  setFiles: mockSetFiles,
  setDynamicFolderHierarchy: mockSetDynamicFolderHierarchy,
  dynamicFolderHierarchy: [],
  setLoading: mockSetLoading,
  selectedSystem: { systemName: 'Test System', caseID: 'case123' },
}

describe('EcmFile Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders correctly', () => {
    const { getByText } = render(<EcmFile {...defaultProps} />)

    expect(getByText('Test File')).toBeInTheDocument()
    expect(getByText('1 MB')).toBeInTheDocument()
  })

  it('handles download button click', async () => {
    const { getByText } = render(<EcmFile {...defaultProps} />)
    services.downloadFromEcm.mockResolvedValue({
      data: {
        fileStream: 'SGVsbG8gd29ybGQ',
        fileName: 'file.txt',
      },
    })

    global.URL.createObjectURL = vi.fn(() => 'mockObjectURL')
    const mockAppendChild = vi
      .spyOn(document.body, 'appendChild')
      .mockImplementation(() => {})
    const mockRemoveChild = vi
      .spyOn(document.body, 'removeChild')
      .mockImplementation(() => {})
    const downloadButton = getByText('Download')
    await act(async () => {
      fireEvent.click(downloadButton)
    })
    expect(global.URL.createObjectURL).toHaveBeenCalled()
    expect(mockAppendChild).toHaveBeenCalled()
    expect(mockRemoveChild).toHaveBeenCalled()
    mockAppendChild.mockRestore()
    mockRemoveChild.mockRestore()
    global.URL.createObjectURL.mockRestore()
  })

  it('handles internal folder click', async () => {
    services.get_ecm_files.mockResolvedValue([
      { file_name: 'Sub File', file_type: 'txt', file_size: '20 MB' },
    ])
    const newProps = {
      ...defaultProps,
      file_size: 'items',
      file_type: '',
    }
    const { getByText } = render(<EcmFile {...newProps} />)
    const viewButton = getByText('view folder')

    fireEvent.click(viewButton)

    await waitFor(() => {
      expect(mockSetLoading).toHaveBeenCalledWith(true)
      expect(mockSetDynamicFolderHierarchy).toHaveBeenCalledWith([
        { label: 'Test File', id: '123' },
      ])
      expect(mockSetFiles).toHaveBeenCalledWith([
        { file_name: 'Sub File', file_type: 'txt', file_size: '20 MB' },
      ])
      expect(mockSetLoading).toHaveBeenCalledWith(false)
    })
  })
})
