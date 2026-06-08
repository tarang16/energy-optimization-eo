import { AppAtom } from 'atoms/AppAtom'
import {
  activeFavoriteTrendsAtom,
  getFavoriteTrendsByUserIdAtom,
} from 'atoms/SidebarAtom'
import { TRACKEVENTOBJ } from 'config/ActivityTrackerConfig'
import { useAtom, useAtomValue, useSetAtom } from 'jotai'
import { useEffect } from 'react'
import { NavLink, useLocation, useParams } from 'react-router-dom'
export default function FavoriteTrends() {
  const params = useParams()
  const ctxData = useAtom(AppAtom)
  const caseData = ctxData?.caseData || []
  const favoriteTrendsAtomData = useAtomValue(getFavoriteTrendsByUserIdAtom)
  const [activeFavoriteTrend, setActiveFavoriteTrend] = useAtom(
    activeFavoriteTrendsAtom,
  )
  const resetActiveFavTrend = useSetAtom(activeFavoriteTrendsAtom)
  const location = useLocation()
  const favoriteTrends = favoriteTrendsAtomData.data || []
  /* istanbul ignore next */
  useEffect(() => {
    if (!location.pathname.includes('monitoring') && activeFavoriteTrend) {
      resetActiveFavTrend(null)
    }
  }, [location, activeFavoriteTrend])

  /* istanbul ignore next */
  const handleNavClick = (e, id) => {
    setActiveFavoriteTrend(id)
  }
  if (!favoriteTrends?.length) {
    return (
      <li className='text-center' data-static-id='FavoriteTrends.js_li_04ca5f'>
        <span
          className='text-14-regular'
          data-static-id='FavoriteTrends.js_span_b7127c'
        >
          NO FAVORITE TRENDS ADDED.
        </span>
      </li>
    )
  } else {
    /* istanbul ignore next */
    return (
      <>
        {favoriteTrends.map((item) => {
          return (
            <li
              key={`favorite-${item.id}`}
              data-static-id='FavoriteTrends.js_li_3a2b3d'
            >
              <NavLink
                data-testid='fav-link-item'
                onClick={(e) => {
                  TRACKEVENTOBJ.favoriteTrends.favTrendOnClick(item, {
                    params,
                    caseData,
                    location,
                  })
                  handleNavClick(e, item.id)
                }}
                to={item.url}
                className={`text-12-regular ${activeFavoriteTrend === item?.id ? 'active' : 'inactive'}`}
                data-static-id='FavoriteTrends.js_NavLink_7ee722'
              >
                {`${item?.subTitle} - ${item?.title}`}
              </NavLink>
            </li>
          )
        })}
      </>
    )
  }
}
