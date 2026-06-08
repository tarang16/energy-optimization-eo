import { useSetAtom } from 'jotai'
import { useEffect } from 'react'
import { useLocation, useParams } from 'react-router-dom'
import { getWalkthroughDataByFileListTutId } from 'services/EcmServices'
import { getValsBaseOnCondition } from 'utills/utilities'
import { WALKTHROUGH_URL_TO_PAGE_MAPPING } from 'utills/walkthroughPageInfo'
import { walkthroughJsonAtom } from '../store'
export const replacePathValueWithParams = (path = '', params = {}) => {
  const [pathOnly, queryString] = path.split('?')
  const segments = pathOnly.split('/')
  const paramsEntries = Object.entries(params)
  const updated = segments.map((segment) => {
    const match = paramsEntries.find(([key, value]) => value === segment)
    if (!match || !['region', 'affiliate'].includes(match[0])) {
      return segment // return as-is if no match or key not in allowed list
    }
    return getValsBaseOnCondition(true, match[0], segment)
  })
  const updatedPath = updated.join('/')
  return `${updatedPath}${getValsBaseOnCondition(queryString, '?' + queryString, '')}`
}
const BodyAttributeUpdater = () => {
  const location = useLocation()
  const params = useParams()
  const setWalkthroughData = useSetAtom(walkthroughJsonAtom)
  const getWalkthroughData = async (pagekey) => {
    const res = await getWalkthroughDataByFileListTutId(pagekey)
    if (res?.data?.length) {
      const [{ pageKeyDetails }] = res.data
      if (pageKeyDetails?.length) {
        setWalkthroughData({
          loading: false,
          data: pageKeyDetails,
        })
      } else {
        setWalkthroughData({
          loading: false,
          data: [],
        })
      }
    } else {
      setWalkthroughData({
        loading: false,
        data: [],
      })
    }
  }
  useEffect(() => {
    // Add your own logic for attribute value
    const path = location.pathname + location.search
    const transformedPath = replacePathValueWithParams(path, params)
    const pageName = WALKTHROUGH_URL_TO_PAGE_MAPPING[transformedPath]
    if (pageName) {
      document.body.setAttribute('data-pagename', pageName)
    } else {
      document.body.removeAttribute('data-pagename')
    }
    if (pageName) {
      getWalkthroughData(pageName)
    }
  }, [location, params]) // Reacts to both path and param changes

  return null
}
export default BodyAttributeUpdater
