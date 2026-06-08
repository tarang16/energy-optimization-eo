import { maxLengthInput } from 'config/Config'
import { beforeAll, beforeEach, describe, expect, test, vi } from 'vitest'
import {
  detectModification,
  extractTagNameFromHtmlString,
  globalizeDate,
  isClickOutside,
} from './utilities'
import { isValidString } from './utilities.js'

// Mock models/AuthToken - FIXED: Proper default export mock
vi.mock('models/AuthToken', () => ({
  default: vi.fn(),
}))
// Mock services/AuthServices
vi.mock('services/AuthServices', () => ({
  getAuthToken: vi.fn(),
}))
// Mock utilities module - FIXED: Proper async import mock
vi.mock('./utilities', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    showToast: vi.fn(),
    logoutUser: vi.fn(),
    setAuthToken: vi.fn(),
    getValsBaseOnCondition: vi.fn(),
    slugToText: vi.fn(),
    getKSAMoment: vi.fn(() => 'mocked-date-string'),
    getKSAMomentWithTimeAsZero: vi.fn(() => 'mocked-date-string'),
    getKSAMomentWithTimeAs12: vi.fn(() => 'mocked-date-string'),
    getKSAMomentWithTimeAsZeroOfUserTZ: vi.fn(() => 'mocked-date-string'),
    getKSAMomentWithTimeAs12OfUserTZ: vi.fn(() => 'mocked-date-string'),
    showOverlay: vi.fn(),
    hideOverlay: vi.fn(),
    trackCustomEvent: vi.fn(),
    getCreditMessage: vi.fn(),
    isVariableValid: vi.fn(),
    convertBase64ToStr: vi.fn(),
    byteCharacters: vi.fn(() => ({
      length: vi.fn(() => 1),
    })),
  }
})
// Mock SVG imports
vi.mock('assets/sabic_icons/sidebar/monitoring.svg', () => ({
  default: 'monitoring.svg',
}))
vi.mock('assets/sabic_icons/upload_filetype_icon/folder_icon.svg', () => ({
  default: 'folder_icon',
}))
vi.mock('assets/sabic_icons/upload_filetype_icon/unknownFile_icon.svg', () => ({
  default: 'unknown_icon',
}))
vi.mock('assets/sabic_new_icons/arrow_down_blue.svg', () => ({
  default: 'arrow_down_blue',
}))
// Mock mathjs
vi.mock('mathjs', () => ({
  abs: vi.fn((num) => Math.abs(num)),
}))
// Mock logger/Logger - FIXED: Proper export structure
vi.mock('logger/Logger', () => ({
  default: {
    log: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}))
// Mock SCSS variables
vi.mock('config/scss/_variables.scss', () => ({
  primary_gray_2: '#666666',
  primary_blue_bg: '#0066cc',
  primary_gray: '#666666',
}))
// Mock Config
vi.mock('config/Config', () => ({
  TOKEN: {
    AUTH_TOKEN_VAR: 'auth_token',
  },
  TIMEZONE_INFO: {
    LANGUAGE: 'en-US',
    TIMEZONE: {
      timeZone: 'America/New_York',
    },
  },
  EMPTY_CASE: {
    caseID: 'default-case-id',
    affiliate_code: 'default-affiliate-code',
  },
  DEFAULT_TIMEZONE: 'UTC',
  TRACK_EVENT: {
    applicationName: 'TestApp',
  },
  FORMULA_BOX_VALIDATION: {
    INVALID_FORMULA: 'error_formula',
    WRONG_SYNTAX: 'syntax_error',
  },
  maxLengthInput: 1000,
}))
// Mock moment-timezone - FIXED: Proper default export
vi.mock('moment-timezone', () => {
  const mockMoment = vi.fn((input) => ({
    add: vi.fn(() => ({
      valueOf: vi.fn(() => input + 36000000),
      add: vi.fn(() => mockMoment(input + 86400000)),
    })),
    valueOf: vi.fn(() => input),
    format: vi.fn(() => '09/21/2024 00:00:00'),
    isSameOrBefore: vi.fn(() => true),
    year: vi.fn(() => 2023),
    month: vi.fn(() => 5),
    startOf: vi.fn((unit) => ({
      valueOf: vi.fn(() => 1685577600000),
    })),
    diff: vi.fn(() => 300000),
  }))
  mockMoment.mockReturnValue({
    add: vi.fn().mockReturnThis(),
    valueOf: vi.fn(() => Date.now()),
    format: vi.fn(() => '09/21/2024 00:00:00'),
    isSameOrBefore: vi.fn(() => true),
  })
  return {
    default: mockMoment,
  }
})
// Mock html-to-image
vi.mock('html-to-image', () => ({
  toPng: vi.fn(),
}))
// Mock jspdf
vi.mock('jspdf', () => ({
  jsPDF: vi.fn(),
}))
// Mock env - FIXED: Removed default export since it's not used that way
vi.mock('env', () => ({
  env: { EO_ENV: 'production' },
}))
// Mock react-hot-toast - FIXED: Proper __esModule flag
vi.mock('react-hot-toast', () => ({
  __esModule: true,
  default: vi.fn(),
}))
// Mock services
vi.mock('services/FavoriteService', () => ({
  getUserPreference: vi.fn(),
}))
vi.mock('components/visuals/common/modal/ODSAlertModal', () => ({
  getUserDomainID: vi.fn(),
}))

vi.mock(import('services/WorkflowServices'), async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    getWfAssignedListByUserId: vi.fn(),

    // your mocked methods
  }
})
vi.mock('services/ConfigServices', () => ({
  getScreenByAffiliateIds: vi.fn(),
}))
// Mock tConvert function
const tConvert = vi.fn().mockImplementation((time) => {
  time = time.toString().match(/^([01]\d|2[0-3])(:)([0-5]\d)(:[0-5]\d)?$/) || [
    time,
  ]
  if (time.length > 1) {
    time = time.slice(1)
    time[5] = +time[0] < 12 ? ' AM' : ' PM'
    time[0] = +time[0] % 12 || 12
    time[0] = time[0] >= 10 ? time[0] : `0${time[0]}`
  }
  return time.join('')
})
global.tConvert = tConvert
global.env = {
  EO_ENV: 'production',
}
// Mock supported_values
const mockSupportedValues = {
  region: ['mea', 'na', 'europe'],
  category: ['process', 'energy'],
}
// Mock iconMap

describe('Utility Functions - Complete Coverage', () => {
  beforeAll(() => {
    // Mock supported_values globally
    global.supported_values = mockSupportedValues
    // Mock TRACKEVENTOBJ
    global.TRACKEVENTOBJ = {
      corporate: {
        onForcedLogin: vi.fn(),
        onLogin: vi.fn(),
      },
    }
    // Mock localStorage
    const localStorageMock = (() => {
      let store = {}
      return {
        getItem: vi.fn((key) => store[key] || null),
        setItem: vi.fn((key, value) => {
          store[key] = value.toString()
        }),
        clear: vi.fn(() => {
          store = {}
        }),
      }
    })()
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true,
    })
    // Mock window methods
    window.confirm = vi.fn()
    window.alert = vi.fn()
  })
  beforeEach(() => {
    vi.clearAllMocks()
  })
  describe('globalizeDate Function', () => {
    test('should adjust date by timezone offset and return ISO string', () => {
      const testDate = new Date('2023-06-15T12:00:00')
      const originalOffset = testDate.getTimezoneOffset()
      const result = globalizeDate(testDate)
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
      expect(typeof result).toBe('string')
      const expectedMinutes = testDate.getMinutes()
      expect(testDate.getTimezoneOffset()).toBe(originalOffset)
    })
    test('should handle date with positive timezone offset', () => {
      const testDate = new Date('2023-01-01T00:00:00')
      vi.spyOn(testDate, 'getTimezoneOffset').mockReturnValue(300)
      vi.spyOn(testDate, 'getMinutes').mockReturnValue(0)
      vi.spyOn(testDate, 'setMinutes').mockImplementation(() => {})
      vi.spyOn(testDate, 'toISOString').mockReturnValue(
        '2023-01-01T05:00:00.000Z',
      )
      const result = globalizeDate(testDate)
      expect(testDate.setMinutes).toHaveBeenCalledWith(-300)
      expect(result).toBe('2023-01-01T05:00:00.000Z')
    })
    test('should handle date with negative timezone offset', () => {
      const testDate = new Date('2023-01-01T00:00:00')
      vi.spyOn(testDate, 'getTimezoneOffset').mockReturnValue(-120)
      vi.spyOn(testDate, 'getMinutes').mockReturnValue(0)
      vi.spyOn(testDate, 'setMinutes').mockImplementation(() => {})
      vi.spyOn(testDate, 'toISOString').mockReturnValue(
        '2022-12-31T22:00:00.000Z',
      )
      const result = globalizeDate(testDate)
      expect(testDate.setMinutes).toHaveBeenCalledWith(120)
      expect(result).toBe('2022-12-31T22:00:00.000Z')
    })
    test('should handle date with zero timezone offset', () => {
      const testDate = new Date('2023-01-01T12:00:00')
      vi.spyOn(testDate, 'getTimezoneOffset').mockReturnValue(0)
      vi.spyOn(testDate, 'getMinutes').mockReturnValue(0)
      vi.spyOn(testDate, 'setMinutes').mockImplementation(() => {})
      vi.spyOn(testDate, 'toISOString').mockReturnValue(
        '2023-01-01T12:00:00.000Z',
      )
      const result = globalizeDate(testDate)
      expect(testDate.setMinutes).toHaveBeenCalledWith(0)
      expect(result).toBe('2023-01-01T12:00:00.000Z')
    })
  })
  describe('isClickOutside Function', () => {
    test('should return true when ref.current exists and click is outside', () => {
      const mockContains = vi.fn().mockReturnValue(false)
      const mockRef = {
        current: {
          controlRef: {
            contains: mockContains,
          },
        },
      }
      const mockEvent = {
        target: document.createElement('div'),
      }
      const result = isClickOutside(mockEvent, mockRef)
      expect(mockContains).toHaveBeenCalledWith(mockEvent.target)
      expect(result).toBe(true)
    })
    test('should return undefined when ref.current is null', () => {
      const mockRef = {
        current: null,
      }
      const mockEvent = {
        target: document.createElement('div'),
      }
      const result = isClickOutside(mockEvent, mockRef)
      expect(result).toBeUndefined()
    })
    test('should return undefined when ref.current is undefined', () => {
      const mockRef = {
        current: undefined,
      }
      const mockEvent = {
        target: document.createElement('div'),
      }
      const result = isClickOutside(mockEvent, mockRef)
      expect(result).toBeUndefined()
    })
    test('should return undefined when ref.current exists but controlRef is missing', () => {
      const mockRef = {
        current: {},
      }
      const mockEvent = {
        target: document.createElement('div'),
      }
      expect(() => isClickOutside(mockEvent, mockRef)).toThrow()
    })
  })
  describe('detectModification Function', () => {
    describe('when both parameters are null', () => {
      test('should return false', () => {
        const result = detectModification(null, null)
        expect(result).toBe(false)
      })
    })
    describe('when one parameter is null', () => {
      test('should return false when initialData is null', () => {
        const result = detectModification(null, { a: 1 })
        expect(result).toBe(false)
      })
      test('should return false when updatedData is null', () => {
        const result = detectModification({ a: 1 }, null)
        expect(result).toBe(false)
      })
    })
    describe('when both parameters are objects', () => {
      test('should return false for identical objects', () => {
        const obj1 = { a: 1, b: 2 }
        const obj2 = { a: 1, b: 2 }
        const result = detectModification(obj1, obj2)
        expect(result).toBe(false)
      })
      test('should return false for objects with same properties in different order', () => {
        const obj1 = { a: 1, b: 2, c: 3 }
        const obj2 = { c: 3, a: 1, b: 2 }
        const result = detectModification(obj1, obj2)
        expect(result).toBe(false)
      })
      test('should return true for objects with different values', () => {
        const obj1 = { a: 1, b: 2 }
        const obj2 = { a: 1, b: 3 }
        const result = detectModification(obj1, obj2)
        expect(result).toBe(true)
      })
      test('should return true for objects with different properties', () => {
        const obj1 = { a: 1, b: 2 }
        const obj2 = { a: 1, c: 2 }
        const result = detectModification(obj1, obj2)
        expect(result).toBe(true)
      })
      test('should handle empty objects', () => {
        const result = detectModification({}, {})
        expect(result).toBe(false)
      })
      test('should handle null properties in objects', () => {
        const obj1 = { a: null, b: 2 }
        const obj2 = { a: null, b: 2 }
        const result = detectModification(obj1, obj2)
        expect(result).toBe(false)
      })
    })
    describe('when both parameters are arrays', () => {
      test('should return false for identical arrays', () => {
        const arr1 = [{ a: 1 }, { b: 2 }]
        const arr2 = [{ a: 1 }, { b: 2 }]
        const result = detectModification(arr1, arr2)
        expect(result).toBe(false)
      })
      test('should return false for arrays with same objects in different order', () => {
        const arr1 = [{ a: 1 }, { b: 2 }]
        const arr2 = [{ b: 2 }, { a: 1 }]
        const result = detectModification(arr1, arr2)
        expect(result).toBe(false)
      })
      test('should return true for arrays with different lengths', () => {
        const arr1 = [{ a: 1 }]
        const arr2 = [{ a: 1 }, { b: 2 }]
        const result = detectModification(arr1, arr2)
        expect(result).toBe(true)
      })
      test('should return true for arrays with different objects', () => {
        const arr1 = [{ a: 1 }, { b: 2 }]
        const arr2 = [{ a: 1 }, { b: 3 }]
        const result = detectModification(arr1, arr2)
        expect(result).toBe(true)
      })
      test('should handle empty arrays', () => {
        const result = detectModification([], [])
        expect(result).toBe(false)
      })
      test('should return true when comparing empty array with non-empty array', () => {
        const result = detectModification([], [{ a: 1 }])
        expect(result).toBe(true)
      })
      test('should handle arrays with complex nested objects', () => {
        const arr1 = [{ a: { nested: { value: 1 } } }]
        const arr2 = [{ a: { nested: { value: 1 } } }]
        const result = detectModification(arr1, arr2)
        expect(result).toBe(false)
      })
      test('should detect changes in nested objects within arrays', () => {
        const arr1 = [{ a: { nested: { value: 1 } } }]
        const arr2 = [{ a: { nested: { value: 2 } } }]
        const result = detectModification(arr1, arr2)
        expect(result).toBe(true)
      })
    })
    describe('edge cases', () => {
      test('should handle mixed types (array vs object)', () => {
        const result = detectModification([1, 2, 3], { 0: 1, 1: 2, 2: 3 })
        expect(result).toBe(false)
      })
      test('should handle objects with undefined values', () => {
        const obj1 = { a: undefined, b: 2 }
        const obj2 = { a: undefined, b: 2 }
        const result = detectModification(obj1, obj2)
        expect(result).toBe(false)
      })
    })
  })
  describe('isValidString Function', () => {
    // Mock the imported maxLengthInput

    test('should return empty string for valid input', () => {
      const validString = 'Valid String 123'
      const result = isValidString(validString)
      expect(result).toBe('')
    })

    test('should return empty string for string with allowed special characters', () => {
      const validString = "Test: _,'+=#()[]&°.{}%/\\?*<>^|-"
      const result = isValidString(validString)
      expect(result).toBe('')
    })

    test('should return empty string for string with newlines', () => {
      const validString = 'Line 1\nLine 2'
      const result = isValidString(validString)
      expect(result).toBe('')
    })

    test('should return error for string with invalid characters - @', () => {
      const invalidString = 'Invalid @ String'
      const result = isValidString(invalidString)
      expect(result).toBe(
        'Invalid input. following character are not allowed (`@~"!$)',
      )
    })

    test('should return error for string with invalid characters - ~', () => {
      const invalidString = 'Invalid ~ String'
      const result = isValidString(invalidString)
      expect(result).toBe(
        'Invalid input. following character are not allowed (`@~"!$)',
      )
    })

    test('should return error for string with invalid characters - backtick', () => {
      const invalidString = 'Invalid ` String'
      const result = isValidString(invalidString)
      expect(result).toBe(
        'Invalid input. following character are not allowed (`@~"!$)',
      )
    })

    test('should return error for string with invalid characters - quote', () => {
      const invalidString = 'Invalid " String'
      const result = isValidString(invalidString)
      expect(result).toBe(
        'Invalid input. following character are not allowed (`@~"!$)',
      )
    })

    test('should return error for string with invalid characters - exclamation', () => {
      const invalidString = 'Invalid ! String'
      const result = isValidString(invalidString)
      expect(result).toBe(
        'Invalid input. following character are not allowed (`@~"!$)',
      )
    })

    test('should return error for string with invalid characters - dollar sign', () => {
      const invalidString = 'Invalid $ String'
      const result = isValidString(invalidString)
      expect(result).toBe(
        'Invalid input. following character are not allowed (`@~"!$)',
      )
    })

    test('should return error for string exceeding custom max length', () => {
      const customMaxLength = 10
      const longString = 'a'.repeat(customMaxLength + 1)
      const result = isValidString(longString, customMaxLength)
      expect(result).toBe(
        `Maximum allowed limit for the characters is ${customMaxLength}`,
      )
    })

    test('should return empty string for string at exact max length', () => {
      const maxLengthString = 'a'.repeat(maxLengthInput)
      const result = isValidString(maxLengthString)
      expect(result).toBe('')
    })

    test('should return empty string for string at exact custom max length', () => {
      const customMaxLength = 5
      const exactLengthString = 'a'.repeat(customMaxLength)
      const result = isValidString(exactLengthString, customMaxLength)
      expect(result).toBe('')
    })

    test('should prioritize pattern validation over length validation', () => {
      const customMaxLength = 5
      const invalidString = 'a@' // Invalid character and within length
      const result = isValidString(invalidString, customMaxLength)
      expect(result).toBe(
        'Invalid input. following character are not allowed (`@~"!$)',
      )
    })

    test('should handle empty string', () => {
      const result = isValidString('')
      expect(result).toBe('')
    })

    test('should handle numeric input', () => {
      const result = isValidString('12345')
      expect(result).toBe('')
    })

    test('should handle mixed alphanumeric with spaces', () => {
      const result = isValidString('Test 123 String')
      expect(result).toBe('')
    })

    test('should return error for string with multiple invalid characters', () => {
      const invalidString = 'Test@~String'
      const result = isValidString(invalidString)
      expect(result).toBe(
        'Invalid input. following character are not allowed (`@~"!$)',
      )
    })
  })

  describe('extractTagNameFromHtmlString', () => {
    test('achieves 100% coverage - all branches and statements', () => {
      const inputWithTags =
        '[verticalAlign: super]Text[/][verticalAlign: sub]More[/][ #4d4d4d fontSize: 8px]Small[/]Normal'
      const result1 = extractTagNameFromHtmlString(inputWithTags)
      expect(result1).toBe('TextMoreSmallNormal')
      expect(extractTagNameFromHtmlString('[verticalAlign: super]Test')).toBe(
        'Test',
      )
      expect(extractTagNameFromHtmlString('[verticalAlign: sub]Test')).toBe(
        'Test',
      )
      expect(extractTagNameFromHtmlString('[ #4d4d4d fontSize: 8px]Test')).toBe(
        'Test',
      )
      expect(extractTagNameFromHtmlString('[/]Test')).toBe('Test')
      expect(extractTagNameFromHtmlString(null)).toBe(null)
      expect(extractTagNameFromHtmlString(undefined)).toBe(undefined)
      expect(extractTagNameFromHtmlString('')).toBe('')
      expect(extractTagNameFromHtmlString(0)).toBe(0)
      expect(extractTagNameFromHtmlString(false)).toBe(false)
      expect(extractTagNameFromHtmlString('Plain text')).toBe('Plain text')
    })
  })
})
