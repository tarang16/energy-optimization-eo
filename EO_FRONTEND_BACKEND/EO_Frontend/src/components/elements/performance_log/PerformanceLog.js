import Logger from 'logger/Logger'
import moment from 'moment'
import { useEffect, useRef } from 'react'
import { addPerformanceLog } from 'services/LoggingService'
function PerformanceLog({
  children,
  api_url = [],
  componentName,
  actionName,
  screenName,
  isActive,
}) {
  const hasRunRef = useRef(false)
  useEffect(() => {
    const handleLoad = () => {
      try {
        const startTime = moment.now()
        /* istanbul ignore next */
        const checkAPIStatus = () => {
          try {
            const resources = performance.getEntriesByType('resource')
            const xhrResources = resources.filter(
              (resource) => resource.initiatorType === 'xmlhttprequest',
            )
            const completedAPIList = xhrResources.filter((resource) =>
              api_url.some((api) => resource.name.includes(api)),
            )
            let allAPILoaded = true
            api_url.forEach((api) => {
              const componentRequestedAPI = completedAPIList.filter(
                (resource) => resource.name.includes(api),
              )
              // If the API is not completed yet
              if (componentRequestedAPI.length === 0) {
                allAPILoaded = false
              }
            })
            if (allAPILoaded) {
              clearInterval(APICheckingInterval)
              addPerformanceLog(
                componentName,
                actionName,
                screenName,
                startTime,
                moment.now(),
                isActive,
              )
            }
          } catch (error) {
            Logger.error('Error processing resources in PerformanceLog:', error)
          }
        }
        const APICheckingInterval = setInterval(checkAPIStatus, 500)
      } catch (error) {
        Logger.error('Error in PerformanceLog handleLoad:', error)
      }
    }
    if (!hasRunRef.current) {
      handleLoad()
      hasRunRef.current = true
    }
  }, [api_url, componentName, actionName, screenName, isActive, hasRunRef])
  return children
}
export default PerformanceLog
