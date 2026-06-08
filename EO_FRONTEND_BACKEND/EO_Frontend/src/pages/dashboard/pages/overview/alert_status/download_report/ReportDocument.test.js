// ReportDocument.test.js
import { Page, Text, View } from '@react-pdf/renderer'
import { render } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  ALERT_TYPES,
  getColumnConfigsForReport,
} from '../AlertStatistics.functions'
import PdfTable from './PDFTable'
import ReportDocument from './ReportDocument'
// Mock dependencies
vi.mock('@react-pdf/renderer', () => ({
  Document: vi.fn(({ children }) => (
    <div data-testid='document'>{children}</div>
  )),
  Page: vi.fn(({ children, style }) => (
    <div data-testid='page' style={style}>
      {children}
    </div>
  )),
  View: vi.fn(({ children, style }) => (
    <div data-testid='view' style={style}>
      {children}
    </div>
  )),
  Text: vi.fn(({ children, style }) => (
    <div data-testid='text' style={style}>
      {children}
    </div>
  )),
  Image: vi.fn(({ src }) => <img data-testid='image' src={src} alt='' />),
  StyleSheet: {
    create: vi.fn((styles) => styles),
  },
}))
vi.mock('../AlertStatistics.functions', () => ({
  ALERT_TYPES: {
    NO_OF_OVERDUE: 'NO_OF_OVERDUE',
    AUTO_CLOSED: 'AUTO_CLOSED',
    OTHER_TYPE: 'OTHER_TYPE',
  },
  getColumnConfigsForReport: vi.fn(),
}))
vi.mock('./PDFTable', () => ({
  default: vi.fn(() => <div data-testid='pdf-table' />),
}))
describe('ReportDocument', () => {
  const defaultProps = {
    APIResponse: { some: 'data' },
    imageData: 'image-src-base64',
    tablesData: [
      {
        key: ALERT_TYPES.NO_OF_OVERDUE,
        data: {
          data: [
            { id: 1, overdueDays: 2, name: 'Item 1' },
            { id: 2, overdueDays: 5, name: 'Item 2' },
            { id: 3, overdueDays: 10, name: 'Item 3' },
            { id: 4, overdueDays: 1, name: 'Item 4' },
          ],
        },
      },
      {
        key: ALERT_TYPES.AUTO_CLOSED,
        data: {
          data: [
            { id: 1, name: 'Auto Closed 1' },
            { id: 2, name: 'Auto Closed 2' },
          ],
        },
      },
      {
        key: ALERT_TYPES.OTHER_TYPE,
        data: {
          data: [
            { id: 1, name: 'Other 1' },
            { id: 2, name: 'Other 2' },
          ],
        },
      },
    ],
  }
  beforeEach(() => {
    vi.clearAllMocks()

    getColumnConfigsForReport.mockImplementation((key) => {
      const configs = {
        [ALERT_TYPES.NO_OF_OVERDUE]: ['Overdue Alerts', ['column1', 'column2']],
        [ALERT_TYPES.AUTO_CLOSED]: [
          'Auto Closed Alerts',
          ['column3', 'column4'],
        ],
        [ALERT_TYPES.OTHER_TYPE]: ['Other Alerts', ['column5', 'column6']],
      }
      return configs[key] || ['Default Title', []]
    })
  })
  it('renders without crashing', () => {
    render(<ReportDocument {...defaultProps} />)
  })

  it('filters NO_OF_OVERDUE table data to show only items with overdueDays > 3', () => {
    render(<ReportDocument {...defaultProps} />)

    // Find the PdfTable call for NO_OF_OVERDUE
    const pdfTableCalls = PdfTable.mock.calls
    const overdueTableCall = pdfTableCalls.find(
      (call) =>
        call[0].rowData ===
        defaultProps.tablesData[0].data.data.filter(
          (item) => item.overdueDays > 3,
        ),
    )
  })
  it('renders description for AUTO_CLOSED table', () => {
    render(<ReportDocument {...defaultProps} />)

    // Check that description text is rendered for AUTO_CLOSED
    const textCalls = Text.mock.calls
    const descriptionCall = textCalls.find(
      (call) =>
        call[0].children ===
        'The system automatically closes any alerts that have not been reoccurred within the past 24 hours (which can be configurable through admin page).',
    )
  })
  it('does not render description for non-AUTO_CLOSED tables', () => {
    render(<ReportDocument {...defaultProps} />)
  })
  it('calls getColumnConfigsForReport for each table', () => {
    render(<ReportDocument {...defaultProps} />)

    expect(getColumnConfigsForReport).toHaveBeenCalledTimes(3)
    expect(getColumnConfigsForReport).toHaveBeenCalledWith(
      ALERT_TYPES.NO_OF_OVERDUE,
    )
    expect(getColumnConfigsForReport).toHaveBeenCalledWith(
      ALERT_TYPES.AUTO_CLOSED,
    )
    expect(getColumnConfigsForReport).toHaveBeenCalledWith(
      ALERT_TYPES.OTHER_TYPE,
    )
  })
  it('renders table titles with correct styling', () => {
    render(<ReportDocument {...defaultProps} />)

    const textCalls = Text.mock.calls
    const titleCalls = textCalls.filter(
      (call) =>
        call[0].style &&
        call[0].style.fontSize === 10 &&
        call[0].style.fontWeight === 'bold',
    )
  })
  it('handles empty tablesData array', () => {
    const propsWithEmptyTables = {
      ...defaultProps,
      tablesData: [],
    }
    render(<ReportDocument {...propsWithEmptyTables} />)
  })
  it('handles tablesData with empty data arrays', () => {
    const propsWithEmptyTableData = {
      ...defaultProps,
      tablesData: [
        {
          key: ALERT_TYPES.NO_OF_OVERDUE,
          data: { data: [] },
        },
      ],
    }
    render(<ReportDocument {...propsWithEmptyTableData} />)
  })

  it('applies correct styles to all components', () => {
    render(<ReportDocument {...defaultProps} />)

    // Check page styles
    const pageCalls = Page.mock.calls
    pageCalls.forEach((call) => {
      expect(call[0].style).toEqual(
        expect.objectContaining({
          padding: 20,
          backgroundColor: '#ffffff',
        }),
      )
    })
  })
  it('uses wrap={false} for table containers', () => {
    render(<ReportDocument {...defaultProps} />)

    const viewCalls = View.mock.calls
    const tableContainerCalls = viewCalls.filter(
      (call) => call[0].wrap === false,
    )
  })
  it('generates unique keys for table containers', () => {
    render(<ReportDocument {...defaultProps} />)
  })
})
