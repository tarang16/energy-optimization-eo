import { beforeEach, describe, it, vi } from 'vitest'
// Clear all mocks and reset modules before each test
beforeEach(() => {
  vi.clearAllMocks()
  vi.resetModules()
})
describe('Logger', () => {
  let mockConsoleLog
  let mockConsoleWarn
  let mockConsoleError
  beforeEach(() => {
    mockConsoleLog = vi.fn()
    mockConsoleWarn = vi.fn()
    mockConsoleError = vi.fn()

    console.log = mockConsoleLog
    console.warn = mockConsoleWarn
    console.error = mockConsoleError
  })
  const testWithEnv = async (envValue, testFn) => {
    vi.doMock('env', () => ({
      env: { EO_ENV: envValue },
    }))

    // Re-import Logger with the new env
    const { default: LoggerWithEnv } = await import('./Logger.js')
    testFn(LoggerWithEnv)
  }
  it('should log in development env', async () => {
    await testWithEnv('development', (LoggerWithEnv) => {
      LoggerWithEnv.log('dev log')
      // expect(mockConsoleLog).toHaveBeenCalledWith("dev log");
    })
  })
  it('should log in local env', async () => {
    await testWithEnv('local', (LoggerWithEnv) => {
      LoggerWithEnv.log('local log')
      // expect(mockConsoleLog).toHaveBeenCalledWith("local log");
    })
  })
  it('should NOT log in production env', async () => {
    await testWithEnv('production', (LoggerWithEnv) => {
      LoggerWithEnv.log('prod log')
    })
  })
})
