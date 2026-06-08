import { SERVICE } from 'config/Config'
import _post from 'libs/axios_fetch/_post'
import { describe, it, test, expect, beforeEach, vi } from 'vitest'
import {
  getAlertStatisticsByCaseIdList,
  getAlertStatisticsByCaseIDsAndState,
  getAlertStatisticsForInProgressAlerts,
  getAlertStatisticsForOverdueAlerts,
  getAlertStatisticsForPendingAlerts,
  getAlertStatisticsForRole,
  getAlertStatisticsMutedAlerts,
  getAlertStatisticsTargetModifiedAlerts,
  getOdsAlertStatisticsUtilizationReport,
  updateMuteAlertsLogByCauseIdList,
} from './AlertStaticsSerives'
vi.mock('libs/axios_fetch/_post')
describe('ODS Alerts API functions', () => {
  const mockCaseIdList = ['case1', 'case2']
  const mockError = { response: { data: 'error-data' } }
  beforeEach(() => {
    vi.clearAllMocks()
  })
  it('getAlertStatisticsByCaseIdList success & error', async () => {
    _post.mockResolvedValueOnce('success')
    const result = await getAlertStatisticsByCaseIdList(mockCaseIdList)
    expect(_post).toHaveBeenCalledWith(
      `${SERVICE.ODS_URL}/get_ods_alert_statistics_by_case_id_list`,
      { caseIDList: mockCaseIdList },
    )
    expect(result).toBe('success')
    _post.mockImplementationOnce(() => {
      throw mockError
    })
    const errResult = await getAlertStatisticsByCaseIdList(mockCaseIdList)
    expect(errResult).toBe('error-data')
  })
  it('getAlertStatisticsForRole success & error', async () => {
    _post.mockResolvedValueOnce('role-success')
    const result = await getAlertStatisticsForRole(mockCaseIdList)
    expect(_post).toHaveBeenCalledWith(
      `${SERVICE.ODS_URL}/get_ods_alert_statistics_for_role`,
      { caseIDList: mockCaseIdList },
    )
    expect(result).toBe('role-success')
    _post.mockImplementationOnce(() => {
      throw new Error('role-error')
    })
    const errResult = await getAlertStatisticsForRole(mockCaseIdList)
    expect(errResult).toEqual({ error: new Error('role-error') })
  })
  it('getAlertStatisticsForPendingAlerts', async () => {
    _post.mockResolvedValueOnce('pending-success')
    const result = await getAlertStatisticsForPendingAlerts(mockCaseIdList)
    expect(_post).toHaveBeenCalledWith(
      `${SERVICE.ODS_URL}/get_ods_alert_statistics_pending_alerts`,
      { caseIDList: mockCaseIdList },
    )
    expect(result).toBe('pending-success')
  })
  it('getAlertStatisticsForInProgressAlerts', async () => {
    _post.mockResolvedValueOnce('inprogress-success')
    const result = await getAlertStatisticsForInProgressAlerts(mockCaseIdList)
    expect(_post).toHaveBeenCalledWith(
      `${SERVICE.ODS_URL}/get_ods_alert_statistics_inprogress_alerts`,
      { caseIDList: mockCaseIdList },
    )
    expect(result).toBe('inprogress-success')
  })
  it('getAlertStatisticsForOverdueAlerts', async () => {
    _post.mockResolvedValueOnce('overdue-success')
    const result = await getAlertStatisticsForOverdueAlerts(mockCaseIdList)
    expect(_post).toHaveBeenCalledWith(
      `${SERVICE.ODS_URL}/get_ods_alert_statistics_overdue_alerts`,
      { caseIDList: mockCaseIdList },
    )
    expect(result).toBe('overdue-success')
  })
  it('getAlertStatisticsByCaseIDsAndState', async () => {
    _post.mockResolvedValueOnce('byState-success')
    const result = await getAlertStatisticsByCaseIDsAndState(
      mockCaseIdList,
      'active',
    )
  })
  it('getOdsAlertStatisticsUtilizationReport success & error', async () => {
    _post.mockResolvedValueOnce('utilization-success')
    const result = await getOdsAlertStatisticsUtilizationReport(
      '2025-09-16',
      mockCaseIdList,
    )
    expect(_post).toHaveBeenCalledWith(
      `${SERVICE.ODS_URL}/get_ods_alert_statistics_utilization_report`,
      { dateTime: '2025-09-16', caseIDList: mockCaseIdList },
    )
    expect(result).toBe('utilization-success')
    _post.mockImplementationOnce(() => {
      throw new Error('utilization-error')
    })
    const errResult = await getOdsAlertStatisticsUtilizationReport(
      '2025-09-16',
      mockCaseIdList,
    )
    expect(errResult).toEqual({ error: new Error('utilization-error') })
  })
  it('getAlertStatisticsTargetModifiedAlerts', async () => {
    _post.mockResolvedValueOnce('target-success')
    const result = await getAlertStatisticsTargetModifiedAlerts(mockCaseIdList)
    expect(_post).toHaveBeenCalledWith(
      `${SERVICE.ODS_URL}/get_ods_alert_statistics_target_modified_alerts`,
      { caseIDList: mockCaseIdList },
    )
    expect(result).toBe('target-success')
  })
  it('updateMuteAlertsLogByCauseIdList', async () => {
    _post.mockResolvedValueOnce('mute-success')
    const result = await updateMuteAlertsLogByCauseIdList(['cause1'])
    expect(_post).toHaveBeenCalledWith(
      `${SERVICE.ODS_URL}/update_mute_alerts_log_by_cause_id_list`,
      { causeIdList: ['cause1'] },
    )
    expect(result).toBe('mute-success')
  })
  it('getAlertStatisticsMutedAlerts', async () => {
    _post.mockResolvedValueOnce('muted-success')
    const result = await getAlertStatisticsMutedAlerts({ filter: 'test' })
    expect(_post).toHaveBeenCalledWith(
      `${SERVICE.ODS_URL}/get_mute_alerts_log`,
      { filter: 'test' },
    )
    expect(result).toBe('muted-success')
  })
})
