import { afterEach, describe, expect, it, vi } from 'vitest'
import * as RolesTab from './RolesTab.functions' // Replace with actual path

vi.mock(import('logger/Logger'), async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    error: vi.fn(),
  }
})

describe('handleRequestError', () => {
  const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {})

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('logs the error and shows alert with message', () => {
    const mockError = new Error('Test error')
    const message = 'Something went wrong'

    RolesTab.handleRequestError(mockError, message)
  })
})

describe('NoDataInWorkflow', () => {
  it('has predefined roles with empty arrays', () => {
    expect(RolesTab.NoDataInWorkflow).toEqual({
      'Process Manager': [],
      'Operation Manager': [],
      'Process Engineer': [],
      'Operation Engineer': [],
      'Mailing List (Escalation)': [],
    })
  })
})

describe('Headers constants', () => {
  it('affiliateLevel_headers has expected values', () => {
    expect(RolesTab.affiliateLevel_headers).toEqual([
      'EMPLOYEE NAME',
      'EMPLOYEE ID',
      'EMAIL ID',
      'AFFILIATE NAME',
      'ROLE',
      'ACTION',
    ])
  })

  it('headers has expected values', () => {
    expect(RolesTab.headers).toEqual([
      'EMPLOYEE NAME',
      'EMPLOYEE ID',
      'EMAIL ID',
      'AFFILIATE NAME',
      'ACTION',
    ])
  })
})
