import '@testing-library/jest-dom'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import moment from 'moment'
import * as svc from 'services/AlertStaticsSerives'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock(
  'assets/sabic_icons/alert_status_icon/view_arrow_icon_2color.svg',
  () => ({
    default: 'viewModalIcon',
  }),
)
vi.mock('assets/sabic_icons/common/ods_arrows.svg', () => ({
  default: 'checkCircleIcon',
}))
vi.mock('./AlertStatistics.module.scss', () => ({
  default: {},
}))

vi.mock('components/visuals/common/modal/CustomModal', () => ({
  default: ({ show, hideModal, children }) =>
    show ? (
      <div data-testid='custom-modal'>
        <button data-testid='close-modal' onClick={hideModal}>
          Close
        </button>
        {children}
      </div>
    ) : null,
}))

vi.mock('components/visuals/common/modal/ODSAlertModal', () => ({
  default: () => <div data-testid='ods-alert-modal' />,
}))

vi.mock('components/visuals/table/SimpleTable', () => ({
  default: (props) => (
    <div
      data-testid='simple-table'
      data-headers={JSON.stringify(props.headers)}
    >
      {JSON.stringify(props.data)}
    </div>
  ),
}))

vi.mock('services/AlertStaticsSerives', () => ({
  __esModule: true,
  getAlertStatisticsForPendingAlerts: vi.fn(),
  getAlertStatisticsForInProgressAlerts: vi.fn(),
  getAlertStatisticsForOverdueAlerts: vi.fn(),
  getAlertStatisticsTargetModifiedAlerts: vi.fn(),
  getAlertStatisticsByCaseIDsAndState: vi.fn(),
}))

vi.mock('./AlertStatistics.functions', () => ({
  __esModule: true,
  active_alert_card_template: {
    top: [{ key: 'topKey', title: 'Top Title', icon: 'topIcon' }],
    bottom: [{ key: 'pending', title: 'pending', icon: 'botIcon' }],
    footer: [
      {
        key: 'footerKey',
        title: 'Footer Title',
        subtitle: 'Footer Sub',
        icon: 'fooIcon',
      },
    ],
  },
  closed_alert_card_template: { top: [], bottom: [], footer: [] },
  handleAlertManageModal: vi.fn(),

  pending_alerts_table_header: ['colA'],
  pending_alerts_table_order: ['fieldA'],

  work_in_progress_alerts_table_header: [],
  work_in_progress_alerts_table_order: [],

  overdue_alerts_table_header: [],
  overdue_alerts_table_order: [],

  targetdaterevision_alerts_table_header: [],
  targetdaterevision_alerts_table_order: [],

  implemented_alerts_table_header: [],
  implemented_alerts_table_order: [],
}))

import AlertStatistics, {
  formatDateWithTime,
  formatDateWithoutTime,
  getCellValue,
  getFetchDataAndTableOrder,
  getValOrEmptyStr,
} from './AlertStatistics'

describe('AlertStatistics — helpers', () => {
  it('getFetchDataAndTableOrder: covers every branch + default', () => {
    const keys = [
      'pending',
      'workinprogress',
      'overdue',
      'no.ofoverduealerts',
      'targetdaterevision',
      'implemented',
      'rejected',
      'autoclosed',
      'mysteryCase',
    ]
    keys.forEach((k) => {
      const out = getFetchDataAndTableOrder(k)
      if (k === 'mysteryCase') {
        expect(out.fetchData).toBeNull()
        expect(out.header).toEqual([])
        expect(out.tableOrder).toEqual([])
      } else {
        expect(typeof out.fetchData).toBe('function')
        expect(Array.isArray(out.header)).toBe(true)
        expect(Array.isArray(out.tableOrder)).toBe(true)
      }
    })
  })

  it('formatDateWithTime & formatDateWithoutTime', () => {
    const ts = 1620000000000
    expect(formatDateWithTime(ts)).toBe(moment(ts).format('DD-MMM-YY hh:mm A'))
    expect(formatDateWithTime(null)).toBe('')
    expect(formatDateWithoutTime(ts)).toBe(moment(ts).format('DD-MMM-YY'))
    expect(formatDateWithoutTime()).toBe('')
  })

  it('getValOrEmptyStr returns correct fallback', () => {
    expect(getValOrEmptyStr(0)).toBe(0)
    expect(getValOrEmptyStr('abc')).toBe('abc')
    expect(getValOrEmptyStr(null)).toBe('')
    expect(getValOrEmptyStr()).toBe('')
  })

  it('getCellValue picks the right formatter', () => {
    const ts = 1620000000000
    expect(getCellValue('dueDateEpoch', ts)).toBe(formatDateWithoutTime(ts))
    expect(getCellValue('inProgressSinceEpoch', ts)).toBe(
      formatDateWithTime(ts),
    )
    expect(getCellValue('pendingSinceEpoch', ts)).toBe(formatDateWithTime(ts))
    expect(getCellValue('whatever', 'x')).toBe('x')
    expect(getCellValue('whatever', null)).toBe('')
  })
})

describe('AlertStatistics — component', () => {
  const APIResponse = { topKey: 1, pending: 2, footerKey: 3 }
  const caseIds = [42]

  beforeEach(() => {
    vi.clearAllMocks()
    // default: array‐branch
    svc.getAlertStatisticsForPendingAlerts.mockResolvedValue({
      data: [{ fieldA: 'ARRAY_VAL', requestID: 'R1' }],
    })
  })

  it('renders active cards (top, bottom, footer) and no modal', () => {
    const { rerender } = render(
      <AlertStatistics
        APIResponse={APIResponse}
        template='active_alert_card_template'
        showModal={true}
        caseIdList={caseIds}
        tabName='anyTab'
      />,
    )
    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText('Top Title')).toBeInTheDocument()
    expect(screen.getByText('pending')).toBeInTheDocument()
    expect(
      screen.getByTestId('alert-statistics-view-modal-pending'),
    ).toBeInTheDocument()
    expect(screen.getByText('Footer Title')).toBeInTheDocument()
    expect(screen.getByText('Footer Sub')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
    expect(screen.queryByTestId('custom-modal')).toBeNull()
    rerender(
      <AlertStatistics
        APIResponse={APIResponse}
        template='closed_alert_card_template'
        showModal={true}
        caseIdList={caseIds}
        tabName='anyTab'
      />,
    )
    expect(
      screen.queryByTestId('alert-statistics-view-modal-pending'),
    ).toBeNull()
    expect(screen.queryByText('Footer Title')).toBeNull()
  })

  it('opens modal & shows table for array branch', async () => {
    render(
      <AlertStatistics
        APIResponse={APIResponse}
        template='active_alert_card_template'
        showModal={true}
        caseIdList={caseIds}
        tabName='anyTab'
      />,
    )
    fireEvent.click(screen.getByTestId('alert-statistics-view-modal-pending'))

    await waitFor(() =>
      expect(screen.getByTestId('custom-modal')).toBeInTheDocument(),
    )
  })

  it('opens modal & shows table for non-array branch', async () => {
    svc.getAlertStatisticsForPendingAlerts.mockResolvedValue({
      data: { fieldA: 'SINGLE_VAL', requestID: 'R2' },
    })
    render(
      <AlertStatistics
        APIResponse={APIResponse}
        template='active_alert_card_template'
        showModal={true}
        caseIdList={caseIds}
        tabName='anyTab'
      />,
    )
    fireEvent.click(screen.getByTestId('alert-statistics-view-modal-pending'))

    await waitFor(() =>
      expect(screen.getByTestId('simple-table')).toHaveTextContent(
        'SINGLE_VAL',
      ),
    )
  })

  it('opens modal & shows empty table for null data', async () => {
    svc.getAlertStatisticsForPendingAlerts.mockResolvedValue({ data: null })
    render(
      <AlertStatistics
        APIResponse={APIResponse}
        template='active_alert_card_template'
        showModal={true}
        caseIdList={caseIds}
        tabName='anyTab'
      />,
    )
    fireEvent.click(screen.getByTestId('alert-statistics-view-modal-pending'))
    await waitFor(() =>
      expect(screen.getByTestId('simple-table')).toHaveTextContent('[]'),
    )
  })
})

describe('AlertStatistics — component (extra coverage)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // default for pending branch
    svc.getAlertStatisticsForPendingAlerts.mockResolvedValue({
      data: [{ fieldA: 'X', requestID: 'ID-1' }],
    })
  })

  it('calls hideAlertModal when the close button is clicked', async () => {
    render(
      <AlertStatistics
        APIResponse={{ topKey: 1, pending: 2, footerKey: 3 }}
        template='active_alert_card_template'
        showModal={true}
        caseIdList={[42]}
        tabName='any'
      />,
    )

    // open the modal
    fireEvent.click(screen.getByTestId('alert-statistics-view-modal-pending'))
    await waitFor(() =>
      expect(screen.getByTestId('custom-modal')).toBeInTheDocument(),
    )
    fireEvent.click(screen.getByTestId('close-modal'))
    expect(screen.queryByTestId('custom-modal')).toBeNull()
  })

  // it("invokes handleAlertManageModal when the table's check-icon is clicked", async () => {
  //   render(
  //     <AlertStatistics
  //       APIResponse={{ topKey: 1, pending: 2, footerKey: 3 }}
  //       template="active_alert_card_template"
  //       showModal={true}
  //       caseIdList={[42]}
  //       tabName="any"
  //     />
  //   );

  //   // open modal
  //   fireEvent.click(
  //     screen.getByTestId("alert-statistics-view-modal-pending")
  //   );
  //   await waitFor(() =>
  //     expect(screen.getByTestId("custom-modal")).toBeInTheDocument()
  //   );

  //   // click the <img alt="checkIconWithCircle">
  //   fireEvent.click(screen.getByAltText("checkIconWithCircle"));

  //   // expect handleAlertManageModal(requestID, setterFn)
  //   expect(handleAlertManageModal).toHaveBeenCalledWith(
  //     "ID-1",
  //     expect.any(Function)
  //   );
  // });
})
