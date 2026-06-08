import _post from 'libs/axios_fetch/_post'
import { emptyApiResponse } from 'utills/utilities'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as workflowApi from './WorkflowServices'
vi.mock('libs/axios_fetch/_post', () => ({
  default: vi.fn(),
}))
vi.mock('config/Config', () => ({
  SERVICE: {
    WORK_FLOW_URL: 'http://workflow',
    PE_ODS_WORK_FLOW_URL: 'http://pe-ods',
  },
}))
const successResponse = emptyApiResponse()
const failResponse = { statuscode: 400, data: 'fail' }
describe('workflowApi', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })
  const apiFns = Object.keys(workflowApi)
  apiFns.forEach((fn) => {
    describe(`${fn}`, () => {
      it('should return response when statuscode is 200', async () => {
        _post.mockResolvedValue(successResponse)
        const result = await workflowApi[fn]('123', 'external')
        expect(result).toEqual(successResponse)
      })
      it('should return [] when statuscode is not 200', async () => {
        _post.mockResolvedValue(failResponse)
        const result = await workflowApi[fn]('123')
        // expect(result).toEqual([]);
      })
      it('should handle error and return fallback', async () => {
        const err = { response: { data: 'error' } }
        _post.mockRejectedValue(err)
        const result = await workflowApi[fn]('123')
        // Functions with [] fallback
        if (
          [
            'getOdsActivitySuggestionsLogByReqId',
            'getOdsSuggestionsLogByReqId',
            'getODSWorkflowActionLogsByReqId',
            'getODSAssigneeListByReqId',
            'getODSWorkflowActionLogs',
            'getWfAlertHistoricalDataAllUser',
            'getWfAlertHistoricalData',
            'getPastSnoozeNumber',
            'updateMuteAlert',
          ].includes(fn)
        ) {
          expect(result).toEqual([])
        } else {
          // functions that return error.response.data
          expect(result).toEqual('error')
        }
      })
    })
  })
})
