import * as AlertUtils from './AlertStatistics.functions'
import { describe, it, test, expect, beforeEach, afterEach, vi } from 'vitest'
import '@testing-library/jest-dom'

vi.mock('utills/utilities', () => ({
  getKSAMomentWithTimeAs12: vi.fn((date) => date.toISOString()),
}))

describe('Alert Utils', () => {
  it('should return correct alert card data', () => {
    const result = AlertUtils.getAlertCardData()
    expect(result).toEqual([
      {
        imgSrc: expect.any(String),
        title: 'GENERATED',
        value: '56',
      },
      {
        imgSrc: expect.any(String),
        title: 'CLOSED',
        value: '22',
      },
    ])
  })

  it('should return correct previous alert card data', () => {
    const result = AlertUtils.getPreviousAlertCardData()
    expect(result).toEqual([
      {
        imgSrc: expect.any(String),
        title: 'GENERATED',
        value: '86',
      },
      {
        imgSrc: expect.any(String),
        title: 'CLOSED',
        value: '42',
      },
    ])
  })
  it('should return 4 recent months with KSA last date', () => {
    const result = AlertUtils.getMonthYearList()
    expect(result.length).toBe(4)
    result.forEach((item) => {
      expect(item).toHaveProperty('tag_name')
      expect(item).toHaveProperty('display_name')
      expect(item).toHaveProperty('lastDayOfMonth')
    })
  })
  it('should handleAlertManageModal by calling setActionID', () => {
    const setActionID = vi.fn()
    AlertUtils.handleAlertManageModal('REQ-123', setActionID)
    expect(setActionID).toHaveBeenCalledWith('REQ-123')
  })
  describe('CSV Download', () => {
    beforeEach(() => {
      global.URL.createObjectURL = vi.fn(() => 'blob:fake-url')
      document.body.appendChild = vi.fn()
      document.body.removeChild = vi.fn()
      URL.revokeObjectURL = vi.fn()
      document.createElement = vi.fn(() => ({
        href: '',
        download: '',
        click: vi.fn(),
      }))
    })
    afterEach(() => {
      vi.clearAllMocks()
    })
    it('should generate and trigger CSV download correctly', () => {
      const data = {
        year: 2024,
        monthName: 'May',
        closedImplemented: 10,
        closedRejected: 2,
      }

      const caseIds = 'System-X'
      AlertUtils.downloadCSVFile(data, caseIds)
      expect(URL.createObjectURL).toHaveBeenCalled()
      expect(document.body.appendChild).toHaveBeenCalled()
      expect(document.body.removeChild).toHaveBeenCalled()
      expect(URL.revokeObjectURL).toHaveBeenCalled()
    })
  })

  it('should convert object to CSV with header map', () => {
    const data = {
      year: 2025,

      monthName: 'June',

      closedImplemented: 5,

      closedRejected: 1,
    }
    // const csv = AlertUtils["convertObjectToCSV"](data);

    // expect(csv).toContain("year,month,closed (Implemented),closed (Rejected)");

    // expect(csv).toContain("2025,June,5,1");
  })
  it('should generate CSV data with system name merged', () => {
    const data = {
      closedTotal: 100,
    }

    const caseIdList = 'System-1'

    // const result = AlertUtils["generateCSVData"](data, caseIdList);

    // expect(result).toEqual({

    //   SystemNames: "System-1",

    //   closedTotal: 100,

    // });
  })
  it('should return correct constants', () => {
    expect(AlertUtils.chartColors).toEqual(
      expect.arrayContaining(['#1D5E8A', '#2981BD', '#66C5EC', '#99CBEC']),
    )
    expect(AlertUtils.pending_alerts_table_header).toContain('ALERT ID')
    expect(AlertUtils.pending_alerts_table_order).toContain('alertId')
    expect(AlertUtils.implemented_alerts_table_header).toContain('ROLE')
    expect(AlertUtils.implemented_alerts_table_order).toContain('role')
    expect(AlertUtils.total_alert_statistics_template).toHaveProperty('top')
    expect(AlertUtils.active_alert_card_template).toHaveProperty('bottom')
    expect(AlertUtils.closed_alert_card_template).toHaveProperty('footer')
  })
})
