import LoaderResponse from './LoaderResponse'
import { describe, it, test, expect } from 'vitest'
describe('LoaderResponse', () => {
  test('should initialize with default values when no config is passed', () => {
    const loader = new LoaderResponse()
    expect(loader.data).toBeNull()
    expect(loader.status).toBe(400)
    expect(loader.message).toBe('Success')
    expect(loader.isValid).toBe(false)
  })
  test('should assign values from config', () => {
    const config = {
      rdata: { foo: 'bar' },
      statuscode: 200,
      errormsg: 'Loaded',
    }
    const loader = new LoaderResponse(config)
    expect(loader.data).toEqual({ foo: 'bar' })
    expect(loader.status).toBe(200)
    expect(loader.message).toBe('Loaded')
    expect(loader.isValid).toBe(true)
  })
  test('should handle "data" key in config and rename to rdata', () => {
    const config = {
      data: { test: 123 },
      statuscode: 200,
      errormsg: 'All good',
    }
    const loader = new LoaderResponse(config)
    expect(loader.data).toEqual({ test: 123 })
    expect(loader.status).toBe(200)
    expect(loader.message).toBe('All good')
    expect(loader.isValid).toBe(true)
  })
  test('isValid should return true only for statuscode 200', () => {
    const loader1 = new LoaderResponse({ statuscode: 200 })
    const loader2 = new LoaderResponse({ statuscode: 404 })
    expect(loader1.isValid).toBe(true)
    expect(loader2.isValid).toBe(false)
  })
})
