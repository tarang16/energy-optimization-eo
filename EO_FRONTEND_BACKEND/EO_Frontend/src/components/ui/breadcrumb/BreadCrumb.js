import { AppAtom } from 'atoms/AppAtom'
import { TRACKEVENTOBJ } from 'config/ActivityTrackerConfig'
import { useAtomValue } from 'jotai'
import React from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { slugToText } from 'utills/utilities'
import separatorImage from '../../../assets/sabic_icons/common/breadcrumb_separator.svg'
import classes from './Breadcrumb.module.scss'
const BreadCrumb = () => {
  const location = useLocation()
  const params = useParams()
  const ctxData = useAtomValue(AppAtom)
  const caseData = ctxData?.caseData || []
  let modifiedParams = params
  if (location.pathname.includes('analysis')) {
    modifiedParams = {
      ...params,
      analysis: 'Value Creation Analysis',
    }
  }
  if (location.pathname.includes('/virtual-engineering')) {
    modifiedParams = {
      ...params,
      ve: 'Virtual Engineering',
    }
  }
  function generate_url(key, params) {
    if (key == 'affiliate') {
      return `/${params.region}/${params.affiliate}`
    }
    if (key == 'plant') {
      return `/${params.region}/${params.affiliate}/${params.plant}?tabKey=overview`
    }
    if (key == 'system') {
      return `/${params.region}/${params.affiliate}/${params.plant}/${params.system}/overview`
    }
  }
  const getLink = () => {
    if (location.pathname.includes('user-management-roles')) {
      return (
        <Link
          to={'#'}
          className={`${classes.box} text-12-bold`}
          key='corporate'
          data-static-id='BreadCrumb.js_Link_86686b'
        >
          DASHBOARD
        </Link>
      )
    }
    if (location.pathname.includes('user-management-workflow')) {
      return (
        <Link
          to={'#'}
          className={`${classes.box} text-12-bold`}
          key='corporate'
          data-static-id='BreadCrumb.js_Link_67710b'
        >
          WORKFLOW
        </Link>
      )
    }
    if (location.pathname.includes('user-management-configuration')) {
      return (
        <Link
          to={'#'}
          className={`${classes.box} text-12-bold`}
          key='corporate'
          data-static-id='BreadCrumb.js_Link_bc1fbe'
        >
          CONFIGURATIONS
        </Link>
      )
    }
    if (location.pathname.includes('error-logging')) {
      return (
        <Link
          to={'#'}
          className={`${classes.box} text-12-bold`}
          key='corporate'
          data-static-id='BreadCrumb.js_Link_45db01'
        >
          ERROR LOGGING
        </Link>
      )
    }
    if (location.pathname.includes('activity-tracker')) {
      return (
        <Link
          to={'#'}
          className={`${classes.box} text-12-bold`}
          key='corporate'
          data-static-id='BreadCrumb.js_Link_3f0321'
        >
          ACTIVITY TRACKER
        </Link>
      )
    }
    if (location.pathname.includes('performance-tracker')) {
      return (
        <Link
          to={'#'}
          className={`${classes.box} text-12-bold`}
          key='corporate'
          data-static-id='BreadCrumb.js_Link_c355f8'
        >
          PERFORMANCE TRACKER
        </Link>
      )
    }
    if (location.pathname.includes('inbox_workflow')) {
      return (
        <Link
          to={'#'}
          className={`${classes.box} text-12-bold`}
          key='corporate'
          data-static-id='BreadCrumb.js_Link_d01ce4'
        >
          WORKFLOW
        </Link>
      )
    }
    if (location.pathname.includes('user-management-vc')) {
      return (
        <Link
          to={'#'}
          className={`${classes.box} text-12-bold`}
          key='corporate'
          data-static-id='BreadCrumb.js_Link_8d0b05'
        >
          VALUE CREATION
        </Link>
      )
    }
    if (location.pathname.includes('admin/features')) {
      return (
        <Link
          to={'#'}
          className={`${classes.box} text-12-bold`}
          key='features'
          data-static-id='BreadCrumb.js_Link_87d31d'
        >
          FEATURES
        </Link>
      )
    }
    return (
      <Link
        to={'/'}
        className={`${classes.box} text-12-bold`}
        key='corporate'
        data-static-id='BreadCrumb.js_Link_6dacb0'
      >
        SABIC
      </Link>
    )
  }
  return (
    <>
      <nav
        className={'h-100 d-flex align-items-center justify-content-center'}
        data-static-id='BreadCrumb.js_nav_79fee2'
      >
        {/* corporate */}
        {Object.keys(params).length <= 0 && getLink()}
        {/* corporate */}
        {Object.keys(params).length < 2 &&
          (location.pathname.includes('affiliates') || params?.region) && (
            <>
              <Link
                to={'#'}
                className={`${classes.box} text-12-bold`}
                key='region'
                data-static-id='BreadCrumb.js_Link_f57429'
              >
                {slugToText(params.region)?.toUpperCase()}
              </Link>
              <span
                className={`text-12-bold  ${classes.separator}`}
                key='separator1'
                data-static-id='BreadCrumb.js_span_317f65'
              >
                <img
                  alt=''
                  src={separatorImage}
                  data-static-id='BreadCrumb.js_img_5dad36'
                />
              </span>
              <Link
                to={'#'}
                className={`${classes.box} text-12-bold`}
                key='subregion'
                data-static-id='BreadCrumb.js_Link_453cd1'
              >
                AFFILIATES
              </Link>
            </>
          )}

        {['region', 'affiliate'].every((key) =>
          Object.keys(params).includes(key),
        ) && (
          <>
            {(() => {
              const seenValues = new Set()
              const breadcrumbElements = Object.entries(modifiedParams).flatMap(
                (obj) => {
                  const [key, val] = obj
                  if (seenValues.has(val) || ['region'].includes(key)) {
                    return []
                  }
                  seenValues.add(val)
                  const urlSegments = location.pathname.split('/').slice(1)
                  const startIndex = urlSegments.indexOf(val)
                  const additionalSegments =
                    startIndex !== -1 ? urlSegments.slice(startIndex + 1) : []
                  const mainLink = (
                    <React.Fragment key={`${key}-${val}`}>
                      <Link
                        to={generate_url(key, modifiedParams)}
                        className={`${classes.box} text-12-bold`}
                        data-testid='handle-Affiliate-Plant-click'
                        onClick={() => {
                          TRACKEVENTOBJ.breadcrumb.linkOnClick(key, val, {
                            params,
                            caseData,
                            pathname: location.pathname,
                          })
                        }}
                        data-static-id='BreadCrumb.js_Link_60d6d3'
                      >
                        {slugToText(val)?.replace(/_/g, ' ')?.toUpperCase()}
                      </Link>
                    </React.Fragment>
                  )
                  const additionalLinks = additionalSegments.map(
                    (segment, idx) => {
                      if (seenValues.has(segment)) return null
                      seenValues.add(segment)
                      return (
                        <React.Fragment key={`segment-${segment}`}>
                          <Link
                            to={`/${urlSegments.slice(0, startIndex + idx + 2).join('/')}`}
                            className={`${classes.box} text-12-bold`}
                            onClick={() => {
                              TRACKEVENTOBJ.breadcrumb.linkOnClick(
                                'segment',
                                segment,
                                {
                                  params,
                                  caseData,
                                  pathname: location.pathname,
                                },
                              )
                            }}
                            data-static-id='BreadCrumb.js_Link_c25ec6'
                          >
                            {slugToText(segment)
                              ?.replace(/_/g, ' ')
                              ?.replace(/-/g, ' ')
                              ?.toUpperCase()}
                          </Link>
                        </React.Fragment>
                      )
                    },
                  )
                  return [mainLink, ...additionalLinks]
                },
              )
              return breadcrumbElements.flatMap((element, idx) => [
                element,
                idx < breadcrumbElements.length - 1 && (
                  <span
                    className={`text-12-bold ${classes.separator}`}
                    key={`separator-${idx}`}
                    data-static-id='BreadCrumb.js_span_8d84c3'
                  >
                    <img
                      alt='>'
                      src={separatorImage}
                      data-static-id='BreadCrumb.js_img_4a559a'
                    />
                  </span>
                ),
              ])
            })()}
          </>
        )}
      </nav>
    </>
  )
}
export default BreadCrumb
