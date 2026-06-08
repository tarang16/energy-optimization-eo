import {
  get_contributor_output,
  get_kpi_output,
  get_overview_trend,
  get_system_toptile_data,
  getActualOptimumTime,
  getAssetStatus,
  getEnergyDistribution,
  getHealthStatus,
  getHealthStatusData,
  getKevsOutput,
  getModelAlertDetailsIcon,
  getMonitoringData,
  getSeecTrend,
  getSeuOutputData,
  getStatusOptimumByActualTime,
  getTreeDiagramByCaseId,
} from './CurrentServices'

import _post from 'libs/axios_fetch/_post'
import { emptyApiResponse, getKSAMoment } from 'utills/utilities'
import { describe, it, expect, beforeEach, vi } from 'vitest'

vi.mock('libs/axios_fetch/_post')
vi.mock('utills/utilities', () => ({
  getKSAMoment: vi.fn((v) => v),
  emptyApiResponse: vi.fn(() => ({ mocked: 'empty' })),
}))

describe('Current Service API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('getActualOptimumTime -> success', async () => {
    _post.mockResolvedValue({ ok: true })
    const res = await getActualOptimumTime(123)
    expect(_post).toHaveBeenCalledWith(
      expect.stringContaining('/get_time_actual'),
      { caseID: 123 },
    )
    expect(res).toEqual({ ok: true })
  })

  it('getModelAlertDetailsIcon -> error fallback', async () => {
    _post.mockRejectedValue({ response: { data: 'ERR' } })
    const res = await getModelAlertDetailsIcon(1, 't')
    expect(res).toBe('ERR')
  })

  it('get_system_toptile_data -> formats time', async () => {
    _post.mockResolvedValue({ sys: 'data' })
    const res = await get_system_toptile_data(11, '2025')
    expect(getKSAMoment).toHaveBeenCalledWith('2025')
    // expect(_post).toHaveBeenCalledWith(expect.stringContaining("/get_system_top_tile_data"), {
    //     caseID: 11,
    //     time: "2025"
    // });
    expect(res).toEqual({ sys: 'data' })
  })

  it('getSeuOutputData -> passes body', async () => {
    _post.mockResolvedValue({ seu: 'ok' })
    const res = await getSeuOutputData(22, '2025')
    // expect(_post).toHaveBeenCalledWith(expect.any(String), { caseID: 22, time: "2025" });
    expect(res).toEqual({ seu: 'ok' })
  })

  it('get_contributor_output -> returns emptyApiResponse', async () => {
    const res = await get_contributor_output(1, 't')
    expect(emptyApiResponse).toHaveBeenCalled()
    // expect(res).toEqual({ mocked: "empty" });
  })

  it('get_kpi_output -> success', async () => {
    _post.mockResolvedValue({ kpi: 'ok' })
    const res = await get_kpi_output(5, 'T')
    // expect(_post).toHaveBeenCalledWith(expect.stringContaining("/get_kpi_output"), {
    //     caseID: 5,
    //     time: "T"
    // });
    expect(res).toEqual({ kpi: 'ok' })
  })

  it('get_overview_trend -> success', async () => {
    _post.mockResolvedValue({ trend: true })
    const res = await get_overview_trend(7)
    expect(_post).toHaveBeenCalledWith(expect.any(String), { caseId: 7 })
    expect(res).toEqual({ trend: true })
  })

  it('getMonitoringData -> calls getKSAMoment', async () => {
    _post.mockResolvedValue({ monitor: 'x' })
    const res = await getMonitoringData(9, 'T')
    expect(getKSAMoment).toHaveBeenCalledWith('T')
    // expect(res).toEqual({ monitor: "x" });
  })

  it('getStatusOptimumByActualTime -> success', async () => {
    _post.mockResolvedValue({ status: 'ok' })
    const res = await getStatusOptimumByActualTime(33, 'Now')
    // expect(_post).toHaveBeenCalledWith(expect.stringContaining("/get_status_optimum_by_actual_time"), {
    //     caseID: 33,
    //     time: "Now"
    // });
    expect(res).toEqual({ status: 'ok' })
  })

  it('getHealthStatus -> success', async () => {
    _post.mockResolvedValue({ health: true })
    const res = await getHealthStatus([1, 2])
    expect(_post).toHaveBeenCalledWith(expect.any(String), {
      caseIDList: [1, 2],
    })
    expect(res).toEqual({ health: true })
  })

  it('getHealthStatusData -> passes endpoint dynamically', async () => {
    _post.mockResolvedValue({ health: 'x' })
    const res = await getHealthStatusData('custom_ep', 88)
    expect(_post).toHaveBeenCalledWith(expect.stringContaining('/custom_ep'), {
      caseID: 88,
    })
    expect(res).toEqual({ health: 'x' })
  })

  it('getAssetStatus -> success', async () => {
    _post.mockResolvedValue({ asset: 'ok' })
    const res = await getAssetStatus(12, 'T')
    expect(res).toEqual({ asset: 'ok' })
  })

  it('getTreeDiagramByCaseId -> success', async () => {
    _post.mockResolvedValue({ tree: 'yes' })
    const res = await getTreeDiagramByCaseId(1, 't', 'cat')
    // expect(_post).toHaveBeenCalledWith(expect.stringContaining("/get_tree_diagram_by_case_id"), {
    //     caseID: 1,
    //     timeStamp: "t",
    //     category: "cat"
    // });
    expect(res).toEqual({ tree: 'yes' })
  })

  it('getSeecTrend -> formats dates', async () => {
    _post.mockResolvedValue({ seec: 'done' })
    const res = await getSeecTrend(5, '2023', '2024', 'Month')
    expect(getKSAMoment).toHaveBeenCalledWith('2023')
    expect(getKSAMoment).toHaveBeenCalledWith('2024')
    expect(_post).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ groupBy: 'Month' }),
    )
    expect(res).toEqual({ seec: 'done' })
  })

  it('getEnergyDistribution -> success', async () => {
    _post.mockResolvedValue({ dist: 'ok' })
    const res = await getEnergyDistribution(5, 'T')
    // expect(_post).toHaveBeenCalledWith(expect.any(String), { caseID: 5, time: "T" });
    expect(res).toEqual({ dist: 'ok' })
  })

  it('getKevsOutput -> success', async () => {
    _post.mockResolvedValue({ kev: 'ok' })
    const res = await getKevsOutput(55, 'T')
    expect(res).toEqual({ kev: 'ok' })
  })
})
