import { atom, useAtom } from 'jotai'
import Logger from 'logger/Logger'
import { getFavouriteTrendsByUserId } from 'services/FavoriteService'

// Constants for async states
export const JOTAI_ASYNC_STATE = {
  LOADING: 'loading',
  HAS_VALUE: 'hasValue',
  HAS_ERROR: 'hasError',
}

// Atom for active favorite trends
export const activeFavoriteTrendsAtom = atom(null)

// Atom for refreshing the favorite trends (with a family-like behavior)
export const refreshFavoriteTrendsAtom = atom(0)

// Atom for fetching favorite trends by userId
export const getFavoriteTrendsByUserIdAtom = atom(async () => {
  try {
    // Fetch the favorite trends
    const data = await getFavouriteTrendsByUserId()
    return {
      state: JOTAI_ASYNC_STATE.HAS_VALUE,
      data: data.data,
    } // Success state with data
  } catch (error) {
    return {
      state: JOTAI_ASYNC_STATE.HAS_ERROR,
      error,
    } // Error state
  }
})

// Atom for the fetched data (handling the async state and data manipulation)
export const favoriteTrendsDataAtom = atom((get) => {
  const { state, data, error } = get(getFavoriteTrendsByUserIdAtom)
  if (state === JOTAI_ASYNC_STATE.HAS_VALUE) {
    return data?.length ? data : [] // Return the data if available
  }
  if (state === JOTAI_ASYNC_STATE.HAS_ERROR) {
    Logger?.error('Error fetching favorite trends:', error)
    return [] // Handle error by returning an empty array or any fallback data
  }
  return [] // Default return while loading
})

// Hook to trigger a refresh of the favorite trends
export const useRefreshFavoriteTrendsQuery = () => {
  const [, setRefreshId] = useAtom(refreshFavoriteTrendsAtom)
  return () => {
    setRefreshId((id) => id + 1) // Increment the refresh ID to trigger a refetch
  }
}
