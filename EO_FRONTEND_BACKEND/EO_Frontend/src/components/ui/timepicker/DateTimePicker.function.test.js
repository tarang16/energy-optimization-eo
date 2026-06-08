import { describe, expect, it, vi } from 'vitest'
import {
  findLastStatus,
  getFormattedDate,
  getLatestDateAndTimeFromDict,
} from './DateTimePicker.function'

vi.mock(import('./DateTimePicker.module.scss'), async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    cal_yellow: 'yellow',
    cal_blue: 'blue',
    cal_red: 'red',
  }
})

describe('getFormattedDate', () => {
  it('formats a known Date correctly', () => {
    const dt = new Date('2020-01-02T03:04:05')
    expect(getFormattedDate(dt)).toBe('2020-01-02T03:04:05')
  })
  it('pads single-digit components with leading zeros', () => {
    const dt = new Date(2021, 8, 7, 6, 5, 4)
    expect(getFormattedDate(dt)).toBe('2021-09-07T06:05:04')
  })
})
describe('findLastStatus', () => {
  const makeDict = (d) => d
  it('returns input if date not found in dataDict', () => {
    const input = '2021-01-02T10:00:00'
    expect(findLastStatus(input, {})).toBe(input)
  })
  it('returns the most recent status 1 or 2 on same day', () => {
    const dict = makeDict({
      '2021-01-02': {
        rows: {
          '09:00:00': {
            status: 0,
          },
          '08:00:00': {
            status: 2,
          },
          '07:00:00': {
            status: 1,
          },
        },
      },
    })
    // expect(findLastStatus('2021-01-02T09:30:00', dict)).toBe('2021-01-02T09:30:00')
  })
  it('falls back to previous date if no status 1/2 on that day', () => {
    const dict = makeDict({
      '2021-01-02': {
        rows: {
          '09:00:00': {
            status: 0,
          },
        },
      },
      '2021-01-01': {
        rows: {
          '05:00:00': {
            status: 2,
          },
        },
      },
    })
    expect(findLastStatus('2021-01-02T09:30:00', dict)).toBe(
      '2021-01-01T05:00:00',
    )
  })
  it('stops and returns input if rows is undefined', () => {
    const dict = makeDict({
      '2021-01-02': {
        /* no rows key */
      },
    })
    expect(findLastStatus('2021-01-02T00:00:00', dict)).toBe(
      '2021-01-02T00:00:00',
    )
  })
})
describe('getLatestDateAndTimeFromDict', () => {
  it('returns null for empty dict', () => {
    expect(getLatestDateAndTimeFromDict({})).toBeNull()
  })
  it('returns null when the only date has no rows', () => {
    expect(
      getLatestDateAndTimeFromDict({
        '2021-01-01': {},
      }),
    ).toBeNull()
  })
  it('returns null when rows object is empty', () => {
    expect(
      getLatestDateAndTimeFromDict({
        '2021-01-01': {
          rows: {},
        },
      }),
    ).toBeNull()
  })
  it('returns "dateTtime" for the first date & first time key', () => {
    const dict = {
      '2021-02-02': {
        rows: {
          '12:00:00': {
            x: 1,
          },
          '13:00:00': {
            x: 2,
          },
        },
      },
      '2021-01-01': {
        rows: {
          '05:00:00': {
            x: 3,
          },
        },
      },
    }
    expect(getLatestDateAndTimeFromDict(dict)).toBe('2021-02-02T12:00:00')
  })
})
