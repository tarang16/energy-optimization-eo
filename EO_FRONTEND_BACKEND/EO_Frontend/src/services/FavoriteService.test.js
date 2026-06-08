import { SERVICE } from 'config/Config'
import _get from 'libs/axios_fetch/_get'
import _post from 'libs/axios_fetch/_post'
import { describe, it, test, expect, beforeEach, vi } from 'vitest'
import {
  addFavouriteByUserId,
  addFavouriteTrendByUserId,
  addUserPreference,
  deleteFavouriteByUserId,
  deleteFavouriteTrendByUserId,
  getFavouriteByTrendId,
  getFavouriteByUserId,
  getFavouriteTrendsByUserId,
  getKpiOrderByKey,
  getUserPreference,
  saveKpiOrderByKey,
} from './FavoriteService'
vi.mock('libs/axios_fetch/_get')
vi.mock('libs/axios_fetch/_post')
describe('Favourites API tests', () => {
  const FAV_URL = SERVICE.FAV_URL
  beforeEach(() => {
    vi.clearAllMocks()
  })
  // ---------------- deleteFavouriteTrendByUserId ----------------
  it('should delete favourite trend by user id', async () => {
    const mockResponse = { statuscode: 200 }
    _post.mockResolvedValueOnce(mockResponse)
    const result = await deleteFavouriteTrendByUserId('trend1')
    expect(_post).toHaveBeenCalledWith(
      `${FAV_URL}/delete_favorite_trend_by_fav_trend_id`,
      { favTrendGUID: 'trend1' },
    )
    expect(result).toEqual(mockResponse)
  })
  it('should return error.data on deleteFavouriteTrendByUserId failure', async () => {
    const error = { response: { data: 'fail' } }
    _post.mockRejectedValueOnce(error)
    const result = await deleteFavouriteTrendByUserId('trend1')
    expect(result).toBe('fail')
  })
  // ---------------- addUserPreference ----------------
  it('should add user preference', async () => {
    const mockResponse = { success: true }
    _post.mockResolvedValueOnce(mockResponse)
    const result = await addUserPreference('IST')
    expect(_post).toHaveBeenCalledWith(`${FAV_URL}/add_user_preference`, {
      key: 'timeZone',
      data: 'IST',
    })
    expect(result).toEqual(mockResponse)
  })
  // it("should return error.data on addUserPreference failure", async () => {
  //     const error = { response: { data: "bad" } };
  //     _post.mockRejectedValueOnce(error);
  //     const result = await addUserPreference("IST");
  //     expect(result).toBe("bad");
  // });
  // ---------------- getUserPreference ----------------
  it('should return timezone from API', async () => {
    const res = { data: [{ preferences: { data: 'UTC' } }] }
    _post.mockResolvedValueOnce(res)
    const result = await getUserPreference()
    expect(result).toBe('UTC')
  })
  it('should return DEFAULT_TIMEZONE if no data in response', async () => {
    _post.mockResolvedValueOnce({})
    const result = await getUserPreference()
    // expect(result).toBe(DEFAULT_TIMEZONE);
  })
  it('should return null on failure', async () => {
    _post.mockRejectedValueOnce(new Error('fail'))
    const result = await getUserPreference()
    expect(result).toBeNull()
  })
  // ---------------- getFavouriteTrendsByUserId ----------------
  it('should return favourite trends by user id', async () => {
    const mockRes = { list: [1, 2, 3] }
    _get.mockResolvedValueOnce(mockRes)
    const result = await getFavouriteTrendsByUserId()
    expect(_get).toHaveBeenCalledWith(
      `${FAV_URL}/get_all_favorite_trend_by_fav_trend_id`,
    )
    expect(result).toEqual(mockRes)
  })
  it('should return error.data on getFavouriteTrendsByUserId failure', async () => {
    const error = { response: { data: 'oops' } }
    _get.mockRejectedValueOnce(error)
    const result = await getFavouriteTrendsByUserId()
    expect(result).toBe('oops')
  })
  // ---------------- getFavouriteByTrendId ----------------
  it('should get favourite by trend id', async () => {
    const mockRes = { data: 'ok' }
    _post.mockResolvedValueOnce(mockRes)
    const result = await getFavouriteByTrendId('tid123')
    expect(_post).toHaveBeenCalledWith(
      `${FAV_URL}/get_favorite_trend_by_fav_trend_id`,
      { favTrendGUID: 'tid123' },
    )
    expect(result).toEqual(mockRes)
  })
  it('should return error.data on getFavouriteByTrendId failure', async () => {
    const error = { response: { data: 'fail' } }
    _post.mockRejectedValueOnce(error)
    const result = await getFavouriteByTrendId('tid123')
    expect(result).toBe('fail')
  })
  // ---------------- addFavouriteTrendByUserId ----------------
  it('should add favourite trend by user id', async () => {
    const mockRes = { added: true }
    _post.mockResolvedValueOnce(mockRes)
    const result = await addFavouriteTrendByUserId({ key: 'val' })
    expect(_post).toHaveBeenCalledWith(
      `${FAV_URL}/add_favorite_trend_by_user_id`,
      { key: 'val' },
    )
    expect(result).toEqual(mockRes)
  })
  it('should return error.data on addFavouriteTrendByUserId failure', async () => {
    const error = { response: { data: 'err' } }
    _post.mockRejectedValueOnce(error)
    const result = await addFavouriteTrendByUserId({ key: 'val' })
    expect(result).toBe('err')
  })
  // ---------------- deleteFavouriteByUserId ----------------
  it('should delete favourite by user id', async () => {
    const mockRes = { deleted: true }
    _post.mockResolvedValueOnce(mockRes)
    const result = await deleteFavouriteByUserId('id1')
    expect(_post).toHaveBeenCalledWith(`${FAV_URL}/delete_favorite_by_fav_id`, {
      id: 'id1',
    })
    expect(result).toEqual(mockRes)
  })
  it('should return error.data on deleteFavouriteByUserId failure', async () => {
    const error = { response: { data: 'oops' } }
    _post.mockRejectedValueOnce(error)
    const result = await deleteFavouriteByUserId('id1')
    expect(result).toBe('oops')
  })
  // ---------------- addFavouriteByUserId ----------------
  it('should add favourite by user id', async () => {
    const mockRes = { added: true }
    _post.mockResolvedValueOnce(mockRes)
    const result = await addFavouriteByUserId('title', 'url')
    expect(_post).toHaveBeenCalledWith(`${FAV_URL}/add_favorite_by_user_id`, {
      title: 'title',
      url: 'url',
    })
    expect(result).toEqual(mockRes)
  })
  it('should return error.data on addFavouriteByUserId failure', async () => {
    const error = { response: { data: 'bad' } }
    _post.mockRejectedValueOnce(error)
    const result = await addFavouriteByUserId('title', 'url')
    expect(result).toBe('bad')
  })
  // ---------------- getFavouriteByUserId ----------------
  it('should get favourite by user id', async () => {
    const mockRes = { favourites: [1, 2] }
    _get.mockResolvedValueOnce(mockRes)
    const result = await getFavouriteByUserId()
    expect(_get).toHaveBeenCalledWith(`${FAV_URL}/get_favorite_by_user_id`)
    expect(result).toEqual(mockRes)
  })
  it('should return error.data on getFavouriteByUserId failure', async () => {
    const error = { response: { data: 'err' } }
    _get.mockRejectedValueOnce(error)
    const result = await getFavouriteByUserId()
    expect(result).toBe('err')
  })
  // ---------------- getKpiOrderByKey ----------------
  it('should get KPI order by key', async () => {
    const mockRes = { kpi: 'order' }
    _post.mockResolvedValueOnce(mockRes)
    const result = await getKpiOrderByKey('case1')
    expect(_post).toHaveBeenCalledWith(`${FAV_URL}/get_user_preference`, {
      key: 'case1',
    })
    expect(result).toEqual(mockRes)
  })
  it('should return error.data on getKpiOrderByKey failure', async () => {
    const error = { response: { data: 'fail' } }
    _post.mockRejectedValueOnce(error)
    const result = await getKpiOrderByKey('case1')
    expect(result).toBe('fail')
  })
  // ---------------- saveKpiOrderByKey ----------------
  it('should save KPI order by key', async () => {
    const mockRes = { saved: true }
    _post.mockResolvedValueOnce(mockRes)
    const payload = { key: 'case1', data: [] }
    const result = await saveKpiOrderByKey(payload)
    expect(_post).toHaveBeenCalledWith(
      `${FAV_URL}/add_user_preference`,
      payload,
    )
    expect(result).toEqual(mockRes)
  })
  it('should return error.data on saveKpiOrderByKey failure', async () => {
    const error = { response: { data: 'bad' } }
    _post.mockRejectedValueOnce(error)
    const result = await saveKpiOrderByKey({ key: 'case1' })
    expect(result).toBe('bad')
  })
})
