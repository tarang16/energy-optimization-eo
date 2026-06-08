import * as ValueService from './ValueCreationService'
import _post from 'libs/axios_fetch/_post'
import {
  getKSAMoment,
  getKSAMomentWithTimeAs12OfUserTZ,
  getKSAMomentWithTimeAsZeroOfUserTZ,
  invalidApiResponse,
} from 'utills/utilities'
import moment from 'moment-timezone'
import { getFormattedDate } from 'components/ui/timepicker/DateTimePicker.function'
import { describe, it, expect, afterEach, vi } from 'vitest'

vi.mock('libs/axios_fetch/_post')
vi.mock('utills/utilities', () => ({
  getKSAMoment: vi.fn(),
  getKSAMomentWithTimeAs12OfUserTZ: vi.fn(),
  getKSAMomentWithTimeAsZeroOfUserTZ: vi.fn(),
  invalidApiResponse: vi.fn(() => 'invalid'),
}))
vi.mock('moment-timezone')
vi.mock('components/ui/timepicker/DateTimePicker.function', () => ({
  getFormattedDate: vi.fn(),
}))

describe('ValueServiceCapture', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('getAllVcActionByCaseId', () => {
    it('returns data when status code is 200', async () => {
      _post.mockResolvedValue({ statuscode: 200, data: ['abc'] })
      const res = await ValueService.getAllVcActionByCaseId(123)
      expect(res).toEqual({ statuscode: 200, data: ['abc'] })
    })

    it('returns empty array when status code is not 200', async () => {
      _post.mockResolvedValue({ statuscode: 400 })
      const res = await ValueService.getAllVcActionByCaseId(123)
      expect(res).toEqual([])
    })

    it('returns error response on failure', async () => {
      _post.mockRejectedValue({ response: { data: 'error' } })
      const res = await ValueService.getAllVcActionByCaseId(123)
      expect(res).toEqual('error')
    })
  })

  describe('getVcSpanByCaseId', () => {
    it('returns empty array if sTime or eTime is null', async () => {
      const res = await ValueService.getVcSpanByCaseId(1, null, null)
      expect(res).toEqual([])
    })

    it('returns data when API succeeds', async () => {
      _post.mockResolvedValue({ statuscode: 200, data: [1] })
      getKSAMomentWithTimeAsZeroOfUserTZ.mockReturnValue('s')
      getKSAMomentWithTimeAs12OfUserTZ.mockReturnValue('e')
      const res = await ValueService.getVcSpanByCaseId(
        1,
        '2020-01-01',
        '2020-02-01',
      )
      expect(res).toEqual({ statuscode: 200, data: [1] })
    })

    it('returns empty array when API fails', async () => {
      _post.mockResolvedValue({ statuscode: 400 })
      getKSAMomentWithTimeAsZeroOfUserTZ.mockReturnValue('s')
      getKSAMomentWithTimeAs12OfUserTZ.mockReturnValue('e')
      const res = await ValueService.getVcSpanByCaseId(
        1,
        '2020-01-01',
        '2020-02-01',
      )
      expect(res).toEqual([])
    })

    it('handles exception', async () => {
      _post.mockRejectedValue({ response: { data: 'err' } })
      getKSAMomentWithTimeAsZeroOfUserTZ.mockReturnValue('s')
      getKSAMomentWithTimeAs12OfUserTZ.mockReturnValue('e')
      const res = await ValueService.getVcSpanByCaseId(
        1,
        '2020-01-01',
        '2020-02-01',
      )
      expect(res).toEqual('err')
    })
  })

  describe('addVcSpan', () => {
    it('posts correctly formatted span data', async () => {
      getFormattedDate.mockReturnValue('2020-01-01')
      moment.mockReturnValue('momentDate')
      getKSAMoment.mockReturnValue('ksaDate')
      _post.mockResolvedValue('success')
      const res = await ValueService.addVcSpan({ sTime: 'x', eTime: 'y' })
      expect(res).toEqual('success')
    })

    it('returns error on failure', async () => {
      _post.mockRejectedValue({ response: { data: 'error' } })
      getFormattedDate.mockReturnValue('2020-01-01')
      moment.mockReturnValue('momentDate')
      getKSAMoment.mockReturnValue('ksaDate')
      const res = await ValueService.addVcSpan({ sTime: 'x', eTime: 'y' })
      expect(res).toEqual('error')
    })
  })

  describe('deleteVcSpanById', () => {
    it('calls delete endpoint successfully', async () => {
      _post.mockResolvedValue('deleted')
      const res = await ValueService.deleteVcSpanById(100)
      expect(res).toEqual('deleted')
    })

    it('returns error on failure', async () => {
      _post.mockRejectedValue({ response: { data: 'err' } })
      const res = await ValueService.deleteVcSpanById(100)
      expect(res).toEqual('err')
    })
  })

  describe('getLogVcBySpanId', () => {
    it('calls log fetch endpoint successfully', async () => {
      _post.mockResolvedValue('logs')
      const res = await ValueService.getLogVcBySpanId(1)
      expect(res).toEqual('logs')
    })

    it('handles failure', async () => {
      _post.mockRejectedValue({ response: { data: 'err' } })
      const res = await ValueService.getLogVcBySpanId(1)
      expect(res).toEqual('err')
    })
  })

  describe('get_value_mst_vc_case_info_by_case_id', () => {
    it('returns result on success', async () => {
      _post.mockResolvedValue('info')
      const res = await ValueService.get_value_mst_vc_case_info_by_case_id(1)
      expect(res).toEqual('info')
    })

    it('returns error on failure', async () => {
      _post.mockRejectedValue({ response: { data: 'err' } })
      const res = await ValueService.get_value_mst_vc_case_info_by_case_id(1)
      expect(res).toEqual('err')
    })
  })

  describe('getVCCalcTimeSeries', () => {
    it('returns empty if category is falsy', async () => {
      const res = await ValueService.getVCCalcTimeSeries(1, 's', 'e', null)
      expect(res).toEqual([])
    })

    it('returns data on success', async () => {
      _post.mockResolvedValue('series')
      getKSAMomentWithTimeAsZeroOfUserTZ.mockReturnValue('s')
      getKSAMomentWithTimeAs12OfUserTZ.mockReturnValue('e')
      const res = await ValueService.getVCCalcTimeSeries(
        1,
        's',
        'e',
        'production',
      )
      expect(res).toEqual('series')
    })

    it('handles error', async () => {
      _post.mockRejectedValue({ response: { data: 'err' } })
      getKSAMomentWithTimeAsZeroOfUserTZ.mockReturnValue('s')
      getKSAMomentWithTimeAs12OfUserTZ.mockReturnValue('e')
      const res = await ValueService.getVCCalcTimeSeries(
        1,
        's',
        'e',
        'production',
      )
      expect(res).toEqual('err')
    })
  })

  describe('getVCByCaseIDList', () => {
    // it('returns invalid response on invalid inputs', async () => {
    //     const res = await ValueService.getVCByCaseIDList([], null, null);
    //     expect(res).toEqual('invalid');
    // });

    it('returns data on valid input', async () => {
      _post.mockResolvedValue('result')
      getKSAMomentWithTimeAsZeroOfUserTZ.mockReturnValue('s')
      getKSAMomentWithTimeAs12OfUserTZ.mockReturnValue('e')
      const res = await ValueService.getVCByCaseIDList([1], 's', 'e')
      expect(res).toEqual('result')
    })

    it('handles error', async () => {
      _post.mockRejectedValue({ response: { data: 'err' } })
      getKSAMomentWithTimeAsZeroOfUserTZ.mockReturnValue('s')
      getKSAMomentWithTimeAs12OfUserTZ.mockReturnValue('e')
      const res = await ValueService.getVCByCaseIDList([1], 's', 'e')
      expect(res).toEqual('err')
    })
  })

  describe('getVCBySpanAlerts', () => {
    // it('returns invalid response on invalid input', async () => {
    //     const res = await ValueService.getVCBySpanAlerts([], null, null);
    //     expect(res).toEqual('invalid');
    // });

    it('returns data on success', async () => {
      _post.mockResolvedValue('alerts')
      getKSAMoment.mockReturnValue('s')
      const res = await ValueService.getVCBySpanAlerts([1], 's', 'e')
      expect(res).toEqual('alerts')
    })

    it('returns error on failure', async () => {
      _post.mockRejectedValue({ response: { data: 'err' } })
      getKSAMoment.mockReturnValue('s')
      const res = await ValueService.getVCBySpanAlerts([1], 's', 'e')
      expect(res).toEqual('err')
    })
  })
})
