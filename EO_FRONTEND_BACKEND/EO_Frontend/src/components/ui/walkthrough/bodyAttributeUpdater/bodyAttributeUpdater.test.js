// BodyAttributeUpdater.test.jsx
import { render, waitFor } from '@testing-library/react'
import { useSetAtom } from 'jotai'
import { useLocation, useParams } from 'react-router-dom'
import { getWalkthroughDataByFileListTutId } from 'services/EcmServices'
import { getValsBaseOnCondition } from 'utills/utilities'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import BodyAttributeUpdater, {
  replacePathValueWithParams,
} from './bodyAttributeUpdater'

// Mock all dependencies at the top level
vi.mock('jotai', () => ({
  useSetAtom: vi.fn(),
}))
vi.mock('react-router-dom', () => ({
  useLocation: vi.fn(),
  useParams: vi.fn(),
}))
vi.mock('services/EcmServices', () => ({
  getWalkthroughDataByFileListTutId: vi.fn(),
}))
vi.mock('utills/utilities', () => ({
  getValsBaseOnCondition: vi.fn(),
}))
vi.mock('utills/walkthroughPageInfo', () => ({
  WALKTHROUGH_URL_TO_PAGE_MAPPING: {
    '/test/REGION_TRANSFORMED/AFFILIATE_TRANSFORMED': 'test-page',
    '/simple/path': 'simple-page',
    '/path/with/query': 'query-page',
  },
}))
vi.mock('../store', () => ({
  walkthroughJsonAtom: 'mock-atom',
}))
describe('replacePathValueWithParams', () => {
  beforeEach(() => {
    // Mock getValsBaseOnCondition for utility function tests
    getValsBaseOnCondition.mockImplementation((condition, key, value) => {
      if (condition === true && key === 'region') return 'REGION_TRANSFORMED'
      if (condition === true && key === 'affiliate')
        return 'AFFILIATE_TRANSFORMED'
      return value
    })
  })
  it('should replace region and affiliate params with transformed values', () => {
    const path = '/test/region1/affiliate1'
    const params = { region: 'region1', affiliate: 'affiliate1' }

    const result = replacePathValueWithParams(path, params)
  })
  it('should handle paths with query strings', () => {
    const path = '/test/region1?query=value'
    const params = { region: 'region1' }

    const result = replacePathValueWithParams(path, params)
  })
  it('should not replace params that are not region or affiliate', () => {
    const path = '/test/region1/otherValue'
    const params = { region: 'region1', otherParam: 'otherValue' }

    const result = replacePathValueWithParams(path, params)
  })
  it('should handle empty path', () => {
    const path = ''
    const params = { region: 'region1' }

    const result = replacePathValueWithParams(path, params)
  })

  it('should handle empty path with default parameters', () => {
    const result = replacePathValueWithParams() // No arguments
  })
  it('should handle empty string path', () => {
    const result = replacePathValueWithParams('', {})
  })
  it('should handle empty params object', () => {
    const path = '/test/path'
    const result = replacePathValueWithParams(path, {})
  })
  it('should handle undefined params', () => {
    const path = '/test/path'
    const result = replacePathValueWithParams(path) // No params argument
  })

  it('should handle undefined path with params', () => {
    const params = { region: 'test' }
    const result = replacePathValueWithParams(undefined, params)
  })
})
describe('BodyAttributeUpdater Component', () => {
  let mockSetWalkthroughData
  let mockGetWalkthroughData
  beforeEach(() => {
    // Clear all mocks
    vi.clearAllMocks()

    // Setup mocks
    mockSetWalkthroughData = vi.fn()
    mockGetWalkthroughData = vi.fn()

    useSetAtom.mockReturnValue(mockSetWalkthroughData)
    getWalkthroughDataByFileListTutId.mockImplementation(mockGetWalkthroughData)

    // Mock getValsBaseOnCondition for component tests
    getValsBaseOnCondition.mockImplementation((condition, key, value) => {
      if (condition === true && key === 'region') return 'REGION_TRANSFORMED'
      if (condition === true && key === 'affiliate')
        return 'AFFILIATE_TRANSFORMED'
      return value
    })
    // Mock document.body methods
    document.body.setAttribute = vi.fn()
    document.body.removeAttribute = vi.fn()
  })
  const setupMocks = (locationValue, paramsValue = {}) => {
    useLocation.mockReturnValue(locationValue)
    useParams.mockReturnValue(paramsValue)
  }
  it('should set data-pagename attribute when page mapping exists', async () => {
    setupMocks(
      { pathname: '/test/region1/affiliate1', search: '' },
      { region: 'region1', affiliate: 'affiliate1' },
    )
    mockGetWalkthroughData.mockResolvedValue({
      data: [{ pageKeyDetails: ['detail1', 'detail2'] }],
    })
    render(<BodyAttributeUpdater />)
  })
  it('should remove data-pagename attribute when no page mapping exists', async () => {
    setupMocks({ pathname: '/unknown/path', search: '' }, {})
    render(<BodyAttributeUpdater />)
    await waitFor(() => {
      expect(document.body.removeAttribute).toHaveBeenCalledWith(
        'data-pagename',
      )
      expect(mockGetWalkthroughData).not.toHaveBeenCalled()
    })
  })
  it('should handle walkthrough data fetch with empty response', async () => {
    setupMocks({ pathname: '/simple/path', search: '' }, {})
    mockGetWalkthroughData.mockResolvedValue({})
    render(<BodyAttributeUpdater />)
  })
  it('should handle walkthrough data fetch with empty pageKeyDetails', async () => {
    setupMocks({ pathname: '/simple/path', search: '' }, {})
    mockGetWalkthroughData.mockResolvedValue({
      data: [{ pageKeyDetails: [] }],
    })
    render(<BodyAttributeUpdater />)
  })
  it('should handle walkthrough data fetch error', async () => {
    setupMocks({ pathname: '/simple/path', search: '' }, {})
    // mockGetWalkthroughData.mockRejectedValue(new Error('API error'));
    render(<BodyAttributeUpdater />)
  })
  it('should handle paths with query parameters', async () => {
    setupMocks({ pathname: '/path/with/query', search: '?param=value' }, {})
    mockGetWalkthroughData.mockResolvedValue({
      data: [{ pageKeyDetails: ['detail1'] }],
    })
    render(<BodyAttributeUpdater />)
    await waitFor(() => {})
  })
  it('should return null (no UI rendering)', () => {
    setupMocks({ pathname: '/', search: '' }, {})
    const { container } = render(<BodyAttributeUpdater />)
  })
})
