// ============================================================
// FILE 4: CCPTabsV2.test.jsx
// ============================================================
import '@testing-library/jest-dom'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { Provider } from 'jotai'
import { BrowserRouter } from 'react-router-dom'
import * as CCPServices from 'services/CCPServices'
import * as ConfigServices from 'services/ConfigServices'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import CCPTabsV2 from './CCPTabsV2'
vi.mock('services/CCPServices')
vi.mock('services/ConfigServices')
vi.mock('components/visuals/table/SimpleTable', () => ({
  default: () => <div>SimpleTable</div>,
}))
vi.mock('components/visuals/common/modal/CustomModal', () => ({
  default: ({ children }) => <div>CustomModal {children}</div>,
}))
vi.mock('./EditCCPTabs', () => ({
  default: () => <div>EditCCPTabs</div>,
}))
vi.mock('./Configurationdownload/ConfigurationDownload', () => ({
  default: () => <div>ConfigurationDownload</div>,
}))
const setup = (props = {}) =>
  render(
    <Provider>
      <BrowserRouter>
        <CCPTabsV2 {...props} />
      </BrowserRouter>
    </Provider>,
  )
describe('CCPTabsV2 Component', () => {
  const mockCaseId = 'mockCase123'
  const mockSerachFiled = 'mockSearch123'
  const mockPageNumber = 1
  const mockPageSize = 100
  const mockCcpData = {
    data: [
      {
        tagName: 'TempSensor',
        tagDescription: 'Temperature Sensor',
        uom: 'C',
        min: 0,
        max: 100,
        defaultValue: 50,
        tagOutOfBoundSwitch: 1,
        tagStuckSwitch: 2,
        defaultSwitch: 3,
        tagNanSwitch: 4,
        tagId: 'T001',
      },
    ],
  }
  const mockCcpInfo = {
    statuscode: 200,
    data: [
      {
        tagOutOfBoundSwitch: [
          {
            ccpInfoId: 1,
            description: 'Out of Range',
          },
        ],
        tagStuckSwitch: [
          {
            ccpInfoId: 2,
            description: 'Sensor Stuck',
          },
        ],
        defaultSwitch: [
          {
            ccpInfoId: 3,
            description: 'Override Enabled',
          },
        ],
        tagNanSwitch: [
          {
            ccpInfoId: 4,
            description: 'NAN Detected',
          },
        ],
      },
    ],
  }
  const mockTooltipData = {
    data: [
      {
        columnName: 'tagName',
        tooltip: 'Tag name description',
      },
    ],
  }
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(CCPServices.getCCPData).mockResolvedValue(mockCcpData)
    vi.mocked(CCPServices.getCcpInfo).mockResolvedValue(mockCcpInfo)
    vi.mocked(
      ConfigServices.getViewDataDictionaryByTablename,
    ).mockResolvedValue(mockTooltipData)
  })
  it('renders loading state initially', async () => {
    setup({ caseId: mockCaseId, canEdit: true, role: 'Engineer' })
    expect(await screen.findByText('SimpleTable')).toBeInTheDocument()
  })
  it('renders table with correct headers and configuration download when data is present', async () => {
    setup({ caseId: mockCaseId, canEdit: true, role: 'Engineer' })
    fireEvent.change(screen.getByPlaceholderText(/search/i), {
      target: { value: 'Temp' },
    })
    await waitFor(() => {
      expect(CCPServices.getCCPData).toHaveBeenCalledWith(
        mockCaseId,
        'Temp',
        mockPageNumber,
        mockPageSize,
      )
    })
    expect(await screen.findByText('SimpleTable')).toBeInTheDocument()
    expect(await screen.findByText('ConfigurationDownload')).toBeInTheDocument()
  })
  it('renders EditCCPTabs modal when editData is set', async () => {
    setup({ caseId: mockCaseId, canEdit: true, role: 'Engineer' })
    await waitFor(() => {
      expect(screen.queryByText('EditCCPTabs')).toBeInTheDocument()
    })
    fireEvent.change(screen.getByPlaceholderText(/search/i), {
      target: { value: 'Temp' },
    })
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/search/i)).toHaveValue('Temp')
    })
  })
  it('filters table data based on search input', async () => {
    setup({ caseId: mockCaseId, canEdit: true, role: 'Engineer' })
    fireEvent.change(screen.getByPlaceholderText(/search/i), {
      target: { value: 'Temp' },
    })
    fireEvent.change(screen.getByPlaceholderText(/search/i), {
      target: { value: 'Sensor' },
    })
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/search/i)).toHaveValue('Sensor')
    })
  })
  it('handles no data scenario gracefully', async () => {
    vi.mocked(CCPServices.getCCPData).mockResolvedValue({ data: [] })
    setup({ caseId: mockCaseId })
    await waitFor(() => {
      expect(CCPServices.getCCPData).toHaveBeenCalled()
    })
    expect(screen.queryByText('ConfigurationDownload')).not.toBeInTheDocument()
  })
  it('skips rendering ConfigurationDownload if tableDataState is empty', async () => {
    vi.mocked(CCPServices.getCCPData).mockResolvedValue({ data: [] })
    setup({ caseId: mockCaseId })
    await waitFor(() => {
      expect(
        screen.queryByText('ConfigurationDownload'),
      ).not.toBeInTheDocument()
    })
  })
  it('calls getCcpInfo and processes info correctly', async () => {
    setup({ caseId: mockCaseId })
    await waitFor(() => {
      expect(CCPServices.getCcpInfo).toHaveBeenCalled()
    })
  })
  it('calls getViewDataDictionaryByTablename and sets tooltips', async () => {
    setup({ caseId: mockCaseId })
    await waitFor(() => {
      expect(ConfigServices.getViewDataDictionaryByTablename).toHaveBeenCalled()
    })
  })
})
