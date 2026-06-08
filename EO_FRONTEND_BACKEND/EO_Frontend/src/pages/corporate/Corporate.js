import co2IconTooltip from 'assets/sabic_icons/home_tooltip/co2_tooltip.svg'
import energyIconTooltip from 'assets/sabic_icons/home_tooltip/energy_efficient_lightbulb_tooltip.svg'
import goodElectricalIconTooltip from 'assets/sabic_icons/home_tooltip/good_electrical_performance_tooltip.svg'
import affiliateIconTooltip from 'assets/sabic_icons/home_tooltip/tool_tip_affiliates.svg'
import affiliateIcon from 'assets/sabic_icons/lading_pages_top_kpis/affiliates.svg'
import co2Icon from 'assets/sabic_icons/lading_pages_top_kpis/co2.svg'
import energyIcon from 'assets/sabic_icons/lading_pages_top_kpis/energy_efficient_lightbulb.svg'
import goodElectricalIcon from 'assets/sabic_icons/lading_pages_top_kpis/good_electrical_performance.svg'
import america_map from 'assets/sabic_icons/maps/america_region_map.svg'
import eu_map from 'assets/sabic_icons/maps/eu_region_map.svg'
import mea_map from 'assets/sabic_icons/maps/mea_region_map.png'
import home1 from 'assets/sabic_icons/maps/world_map_svg.svg'
import { AppAtom } from 'atoms/AppAtom'
import PerformanceLog from 'components/elements/performance_log/PerformanceLog'
import Loader from 'components/ui/loader/Loader'
import NumberedCircle from 'components/ui/numbered_circle/NumberedCircle'
import LandingPagesTopKpi from 'components/visuals/common/landing_pages_top_kpi/LandingPagesTopKpi'
import { TRACKEVENTOBJ } from 'config/ActivityTrackerConfig'
import { APP_CONFIG } from 'config/Config'
import { useAtomValue } from 'jotai'
import Logger from 'logger/Logger'
import { useEffect, useState } from 'react'
import {
  NavLink,
  useNavigate,
  useParams,
  useRouteLoaderData,
} from 'react-router-dom'
import { Tooltip } from 'react-tooltip'
import { get_landing_corporate } from 'services/ConfigServices'
import { logoutUser } from 'utills/interceptor'
import { digitDecimal, formatNumbers, textToSlug } from 'utills/utilities'
import { v4 as uuid4 } from 'uuid'
import map_icon_subregion from '../../assets/sabic_new_icons/map.svg'
import styles from './Corporate.module.scss'
const iconsArr = [
  {
    image: affiliateIcon,
    line1: 'AFFILIATES',
    line2: '',
    key: 'count_affiliate',
    key_alternate: 'count_affiliate',
    unit: '',
    url: '/affiliates',
  },
  {
    image: goodElectricalIcon,
    line1: 'OPPORTUNITY IN ENERGY',
    line2: 'BILLS',
    key: 'opportunityEnergyBills',
    key_alternate: 'opportunityEnergyBills',
    unit: ' $/ HR',
    url: '#',
  },
  {
    image: energyIcon,
    line1: 'POTENTIAL ENERGY',
    line2: 'CONTRIBUTION TO SEEC',
    key: 'seecGain',
    key_alternate: 'seecGain',
    unit: ' GJ/ HR',
    url: '#',
  },
  {
    image: co2Icon,
    line1: 'REDUCTION OPPORTUNITY',
    line2: 'IN CO<sub>2</sub> EMISSIONS',
    key: 'opportunityCo2',
    key_alternate: 'opportunityCo2',
    unit: ' MT/ HR',
    url: '#',
  },
]
export async function fetchAndSaveAffiliateData() {
  const landing_data = await get_landing_corporate()
  if (!landing_data?.data) {
    Logger.log('Invalid home data: =>>>>>>>>>>', landing_data)
    return []
  }
  const data = landing_data?.data
  if (data?.length > 0) {
    const affArr = data.map((obj) => ({
      ...obj,
      count_affiliate: obj.affiliateCount,
      affiliates: obj?.affiliates?.map((affiliate) => ({
        ...affiliate,
        regionName: obj.regionName,
      })),
    }))
    const finalData = {
      time: new Date().getTime(),
      data: affArr,
    }

    // Set data for affiliate page in localStorage
    if (affArr?.length) {
      localStorage.setItem(
        APP_CONFIG.AFFILIATE_DATA_VAR,
        JSON.stringify(finalData),
      )
    }
    return finalData.data
  } else {
    return []
  }
}
export async function getValidAffiliateData() {
  const storedData = localStorage.getItem(APP_CONFIG.AFFILIATE_DATA_VAR)
  if (storedData) {
    const jsonData = JSON.parse(storedData)
    if (Array.isArray(jsonData) || !Object.keys(jsonData).includes('time')) {
      const resp = await fetchAndSaveAffiliateData()
      return resp
    } else {
      // stored data does not contains key "time"
      if (!Object.keys(jsonData).includes('time')) {
        const resp = await fetchAndSaveAffiliateData()
        return resp
      } else {
        const storedTime = jsonData.time
        const currentTime = new Date().getTime()
        if (currentTime - storedTime < APP_CONFIG.CACHE_TIME_LIMIT) {
          return jsonData.data
        } else {
          const resp = await fetchAndSaveAffiliateData()
          return resp
        }
      }
    }
  } else {
    const resp = await fetchAndSaveAffiliateData()
    return resp
  }
}
export function handleAffiliateUserNavigation(
  caseData,
  affiliate_code,
  navigate,
) {
  let matched_data = caseData.find(
    (obj) => obj.affiliate_code == affiliate_code,
  )
  if (matched_data?.regionName && matched_data?.affiliate) {
    const final_route = `/${textToSlug(matched_data.region)}/${textToSlug(matched_data.affiliate)}`
    if (!window.location.hash.includes(final_route)) {
      return navigate(final_route)
    }
  } else {
    // No matching affiliate found, redirect to invalid page
    alert('NOT AUTHORIZED TO VIEW THE RESOURCE, LOGGING OUT.')
    logoutUser()
  }
}
export function redirectToAffiliate(loaderData, appContext, navigate) {
  if (loaderData) {
    const affiliate_code = loaderData?.decodedToken?.affiliate_code
    if (!loaderData?.isCorporate) {
      if (loaderData?.isAffiliateUser) {
        handleAffiliateUserNavigation(
          appContext.caseData,
          affiliate_code,
          navigate,
        )
      } else {
        // user is no user, please redirect to invalid page.
        alert('NOT AUTHORIZED TO VIEW THE RESOURCE, LOGGING OUT.')
        logoutUser()
      }
    }
  }
}
const MAP_COORDS = {
  'middle east': ['41%', '57%', '1% 1.5%'],
  americas: ['21%', '25%', '1% 1.5%'],
  europe: ['21%', '49%', '0% 1.0%'],
}
export function getMapVals(regionName) {
  let resp = {
    top: '21%',
    left: '49%',
    padding: '0% 1.0%',
  }
  if (
    regionName &&
    Object.keys(MAP_COORDS).includes(regionName?.toLowerCase())
  ) {
    const data = MAP_COORDS[regionName?.toLowerCase()]
    resp = {
      top: data[0],
      left: data[1],
      padding: data[2],
    }
  }
  return resp
}
export default function Corporate() {
  // redirect to plant page if user is not corporate user
  const appContext = useAtomValue(AppAtom)
  const caseData = appContext?.caseData || []
  const loaderData = useRouteLoaderData('root')
  const navigate = useNavigate()
  useEffect(() => {
    redirectToAffiliate(loaderData, appContext, navigate)
  }, [])
  const [pageData, setPageData] = useState(null)
  const [pageApiData, setPageApiData] = useState(null)
  const [mapData, setMapData] = useState([])
  const [subMapImg, setSubMapImg] = useState('')
  const params = useParams()
  const [activeRegion, setActiveRegion] = useState(
    Object.keys(params).includes('region') ? params.region : null,
  )
  const [isFromUrl, setisFromUrl] = useState(
    Object.keys(params).includes('region') ? true : false,
  )
  const [subMapCounts, setSubMapCounts] = useState([])
  const [isRegionClicked, setIsRegionClicked] = useState(false)
  function onWorldMapClick(region, count = 0) {
    setisFromUrl((p) => false)
    const regionMap = {
      'middle east asia': mea_map,
      americas: america_map,
      'middle east': mea_map,
      europe: eu_map,
    }
    const final_map_data = mapData
    if (final_map_data && region) {
      const tempActiveRegionData = final_map_data.filter(
        (obj) => obj.regionName?.toLowerCase() == region?.toLowerCase(),
      )[0]
      count = count ? count : tempActiveRegionData?.count_affiliate
      setPageApiData((p) => tempActiveRegionData)
      setActiveRegion((p) => region?.toUpperCase())
      setSubMapImg((p) => regionMap[region?.toLowerCase()] || '')
      setIsRegionClicked((p) => true)
      let tempAffiliates = tempActiveRegionData.affiliates
      if (tempAffiliates.length >= 0) {
        tempAffiliates = [
          {
            top: '48%',
            left: tempActiveRegionData?.regionName
              ?.toLowerCase()
              ?.includes('americas')
              ? '69%'
              : '41%',
            value: count,
            to: '/affiliates',
            id: uuid4(),
            name: region,
            height: '5vmin',
            width: '5vmin',
            class: 'text-24-bold pt-1',
            data: tempActiveRegionData,
          },
        ]
      }
      setSubMapCounts((p) => tempAffiliates)
    }
  }
  useEffect(() => {
    const fetchData = async () => {
      try {
        const finalData = await getValidAffiliateData()
        const tempData = calculateTempData(finalData)
        const tempFinalData = calculateTempFinalData(tempData)
        const tempMapData = calculateTempMapData(finalData)
        // Update state with processed data
        setPageData(tempFinalData)
        setMapData((p) => tempMapData)
      } catch (error) {
        Logger.error('Error fetching or processing data:', error)
      }
    }
    fetchData()
  }, [])
  const calculateTempData = (finalData) => {
    return finalData.reduce(
      (acc, curr) => ({
        count_affiliate: acc.count_affiliate + curr.count_affiliate,
        opportunityEnergyBills:
          acc.opportunityEnergyBills + curr.opportunityEnergyBills,
        opportunityCo2: acc.opportunityCo2 + curr.opportunityCo2,
        seecGain: acc.seecGain + curr.seecGain,
      }),
      {
        count_affiliate: 0,
        opportunityEnergyBills: 0,
        opportunityCo2: 0,
        seecGain: 0,
      },
    )
  }
  const calculateTempFinalData = (tempData) => {
    return iconsArr.map((obj) => ({
      ...obj,
      value: tempData[obj.key],
    }))
  }
  const calculateTempMapData = (finalData) => {
    return finalData.map((obj) => {
      const map_cords = getMapVals(obj.regionName?.toLowerCase())
      return {
        ...obj,
        top: map_cords.top,
        left: map_cords.left,
        padding: map_cords.padding,
      }
    })
  }
  useEffect(() => {
    if (mapData) {
      const index = mapData.findIndex((obj) =>
        obj.regionName?.toLowerCase().includes('middle east'),
      )
      if (index >= 0) {
        onWorldMapClick(
          mapData[index]?.regionName,
          mapData[index]?.count_affiliate,
        )
      } else {
        onWorldMapClick(mapData[1]?.regionName, mapData[1]?.count_affiliate)
      }
    }
  }, [mapData])
  useEffect(() => {
    if (
      isFromUrl &&
      activeRegion &&
      pageApiData &&
      Object.keys(pageApiData).length > 0
    ) {
      const tempActiveRegionData = mapData.filter(
        (obj) => obj.regionName?.toLowerCase() == activeRegion?.toLowerCase(),
      )[0]
      onWorldMapClick(params.region, tempActiveRegionData.count_affiliate)
    }
  }, [activeRegion, JSON.stringify(pageApiData)])
  return (
    <>
      {pageData == null ? (
        <Loader />
      ) : (
        <PerformanceLog
          api_url={['get_landing_corporate']}
          componentName='Corporate'
          actionName='onLoad'
          screenName='Corporate'
          isActive={1}
        >
          <div
            className={`${styles.parent}`}
            data-testid='world-map-middle-east-click'
            data-static-id='Corporate.js_div_0ffdf2'
          >
            <div
              id='sabic-top-tiles'
              data-testid='sabic-top-tiles'
              className={`${styles.topKpi}`}
              data-static-id='Corporate.js_div_54d853'
            >
              <LandingPagesTopKpi
                data={pageData}
                activeBoxes={[0]}
                source='sabic'
              />
            </div>
            <div
              className={`${styles.content} d-flex`}
              data-static-id='Corporate.js_div_cd5bbb'
            >
              <div
                id='global-preview'
                data-testid='global-preview'
                className={`${styles.bigMap}`}
                data-static-id='Corporate.js_div_ee50b5'
              >
                <div
                  className={styles.header}
                  data-static-id='Corporate.js_div_c877f2'
                >
                  <p
                    className={'text-16-bold text_primary_gray mb-1'}
                    data-static-id='Corporate.js_p_a45649'
                  >
                    GLOBAL PREVIEW
                  </p>
                </div>
                <div
                  className={styles.imageContainer}
                  data-static-id='Corporate.js_div_d4cbd0'
                >
                  <img
                    src={home1}
                    className={styles.imgStyle}
                    data-static-id='Corporate.js_img_31cd45'
                  />
                  {mapData?.length > 0
                    ? mapData.map((obj) => {
                        return (
                          <NumberedCircle
                            id={`${textToSlug(obj.regionName)}-region-preview`}
                            data-testid={`world-map-${textToSlug(obj.regionName)}-click`}
                            key={`${obj.regionName}${obj.count_affiliate}`}
                            elKey={`${obj.regionName}_${obj.count_affiliate}`}
                            handleClick={() => {
                              TRACKEVENTOBJ.corporate.numberCircle(
                                {
                                  params,
                                  caseData,
                                },
                                obj,
                              )
                              onWorldMapClick(
                                obj.regionName,
                                obj.count_affiliate,
                              )
                            }}
                            data={obj}
                            isRegionClicked={isRegionClicked}
                            pageApiData={pageApiData}
                          />
                        )
                      })
                    : ''}
                </div>
              </div>
              <div
                id='active-region-preview'
                data-testid='active-region-preview'
                className={`${styles.smallMap}`}
                data-static-id='Corporate.js_div_2440f2'
              >
                <div
                  className={`${!activeRegion ? 'h-100' : ''} ${styles.header}`}
                  data-static-id='Corporate.js_div_1f9ac8'
                >
                  <div
                    className={
                      !activeRegion
                        ? 'align-content-center align-items-center d-flex flex-column h-100 justify-content-center text-center'
                        : ''
                    }
                    data-static-id='Corporate.js_div_851d2f'
                  >
                    {!activeRegion && (
                      <img
                        alt=''
                        src={map_icon_subregion}
                        className='mb-2'
                        width={36}
                        data-static-id='Corporate.js_img_1e8d2d'
                      />
                    )}
                    <p
                      className={'text-16-bold text_primary_gray  mb-1'}
                      style={{
                        textTransform: 'uppercase',
                      }}
                      data-static-id='Corporate.js_p_25e24a'
                    >
                      {activeRegion
                        ? `${activeRegion} REGION PREVIEW`
                        : 'Select region to view'}
                    </p>
                  </div>
                </div>
                <div
                  id='map-div'
                  className={styles.imageContainer}
                  data-static-id='Corporate.js_div_f604ca'
                >
                  <img
                    src={subMapImg}
                    className={styles.imgStyle}
                    data-static-id='Corporate.js_img_abc009'
                  />
                  {subMapCounts != []
                    ? subMapCounts.map((obj) => {
                        return (
                          <div
                            key={obj.id}
                            className={`${styles.regionLinksBelow} bg_primary_white`}
                            style={{
                              left: obj.left,
                              top: obj.top,
                            }}
                            data-static-id='Corporate.js_div_974f8a'
                          >
                            <NavLink
                              to={obj?.to?.toLowerCase()}
                              className={'text-18-regular text_primary_blue'}
                              data-static-id='Corporate.js_NavLink_463a28'
                            >
                              <NumberedCircle
                                id={`handle-Click-Region-${textToSlug(activeRegion)}`}
                                data-testid={`handle-Click-Region-${textToSlug(activeRegion)}`}
                                dataTooltipIid={obj.id}
                                elKey={obj.id}
                                handleClick={() => {
                                  TRACKEVENTOBJ.corporate.handleClickRegion(
                                    {
                                      params,
                                      caseData,
                                    },
                                    activeRegion,
                                  )
                                }}
                                data={obj}
                                isRegionClicked={false}
                                pageApiData={pageApiData}
                              />
                            </NavLink>
                            <Tooltip
                              id={obj.id}
                              data-static-id='Corporate.js_Tooltip_ca851e'
                            >
                              <div
                                className={`${styles.tooltipContainer} primary_white`}
                                data-static-id='Corporate.js_div_c70884'
                              >
                                <div
                                  className={`m-0 ${styles.top} pb-2 mx-2`}
                                  data-static-id='Corporate.js_div_f8fd88'
                                >
                                  <p
                                    className='text-14-regular text-center m-0 p-0'
                                    data-static-id='Corporate.js_p_197b70'
                                  >
                                    OVERALL {obj?.name?.toUpperCase()}
                                  </p>
                                </div>
                                <div
                                  className={`${styles.bottom} m-2 `}
                                  data-static-id='Corporate.js_div_690c4c'
                                >
                                  <div
                                    className={`mt-3 ${styles.box} row gx-1 align-item-start`}
                                    data-static-id='Corporate.js_div_06ed8c'
                                  >
                                    <div
                                      className={` ${styles.box_item} col-5 `}
                                      data-static-id='Corporate.js_div_5c9c93'
                                    >
                                      {' '}
                                    </div>
                                    <div
                                      className={` ${styles.box_item} col-7`}
                                      data-static-id='Corporate.js_div_6c2807'
                                    >
                                      <div
                                        className={`${styles.left}`}
                                        data-static-id='Corporate.js_div_40400e'
                                      >
                                        <img
                                          alt=''
                                          src={goodElectricalIconTooltip}
                                          data-static-id='Corporate.js_img_682212'
                                        />
                                      </div>
                                      <div
                                        className={`${styles.right} h-100 d-flex flex-column justify-content-start`}
                                        data-static-id='Corporate.js_div_9e948d'
                                      >
                                        <p
                                          className='text-12-regular'
                                          data-static-id='Corporate.js_p_bde227'
                                        >
                                          {digitDecimal(
                                            obj.data.opportunityEnergyBills,
                                          )}{' '}
                                          $/ HR
                                        </p>
                                        <p
                                          className='text-12-regular'
                                          style={{
                                            paddingTop: '1px',
                                          }}
                                          data-static-id='Corporate.js_p_f5522c'
                                        >
                                          OPPORTUNITY IN ENERGY
                                        </p>
                                        <p
                                          className='text-12-regular'
                                          style={{
                                            paddingTop: '1px',
                                          }}
                                          data-static-id='Corporate.js_p_afe681'
                                        >
                                          BILLS
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                  <div
                                    className={`${styles.box} row gx-1`}
                                    data-static-id='Corporate.js_div_eb88ab'
                                  >
                                    <div
                                      className={` ${styles.box_item} col-5 `}
                                      data-static-id='Corporate.js_div_4fd777'
                                    >
                                      <div
                                        className={`${styles.left} `}
                                        data-static-id='Corporate.js_div_185b59'
                                      >
                                        <img
                                          alt=''
                                          src={affiliateIconTooltip}
                                          data-static-id='Corporate.js_img_ebd17d'
                                        />
                                      </div>
                                      <div
                                        className={`${styles.right} h-100 d-flex flex-column justify-content-start`}
                                        data-static-id='Corporate.js_div_813109'
                                      >
                                        <p
                                          className='text-12-regular'
                                          data-static-id='Corporate.js_p_bdbe06'
                                        >
                                          {formatNumbers(
                                            parseFloat(obj.data.affiliateCount),
                                          )}
                                        </p>
                                        <p
                                          className='text-12-regular'
                                          style={{
                                            paddingTop: '1px',
                                          }}
                                          data-static-id='Corporate.js_p_917c78'
                                        >
                                          AFFILIATES
                                        </p>
                                      </div>
                                    </div>
                                    <div
                                      className={` ${styles.box_item} col-7`}
                                      data-static-id='Corporate.js_div_4b39be'
                                    >
                                      {' '}
                                      <div
                                        className={`${styles.left}`}
                                        data-static-id='Corporate.js_div_f21836'
                                      >
                                        <img
                                          alt=''
                                          src={energyIconTooltip}
                                          data-static-id='Corporate.js_img_fa4392'
                                        />
                                      </div>
                                      <div
                                        className={`${styles.right} h-100 d-flex flex-column justify-content-start`}
                                        data-static-id='Corporate.js_div_90e8c8'
                                      >
                                        <p
                                          className='text-12-regular'
                                          data-static-id='Corporate.js_p_8d49fc'
                                        >
                                          {digitDecimal(obj.data.seecGain)} GJ/
                                          HR
                                        </p>
                                        <p
                                          className='text-12-regular'
                                          style={{
                                            paddingTop: '1px',
                                          }}
                                          data-static-id='Corporate.js_p_dc8d32'
                                        >
                                          POTENTIAL ENERGY CONTRIBUTION TO SEEC
                                        </p>
                                      </div>
                                    </div>
                                  </div>

                                  <div
                                    className={`${styles.box} row gx-1`}
                                    data-static-id='Corporate.js_div_129a09'
                                  >
                                    <div
                                      className={` ${styles.box_item} col-5`}
                                      data-static-id='Corporate.js_div_b1af09'
                                    >
                                      <div
                                        className={`${styles.left}`}
                                        data-static-id='Corporate.js_div_49995e'
                                      >
                                        {' '}
                                      </div>
                                    </div>
                                    <div
                                      className={` ${styles.box_item} col-7`}
                                      data-static-id='Corporate.js_div_9a2d59'
                                    >
                                      {' '}
                                      <div
                                        className={`${styles.left}`}
                                        data-static-id='Corporate.js_div_827b57'
                                      >
                                        <img
                                          alt=''
                                          src={co2IconTooltip}
                                          data-static-id='Corporate.js_img_96edd9'
                                        />
                                      </div>
                                      <div
                                        className={`${styles.right} h-100 d-flex flex-column justify-content-start`}
                                        data-static-id='Corporate.js_div_ca01d9'
                                      >
                                        <p
                                          className='text-12-regular '
                                          data-static-id='Corporate.js_p_aa7997'
                                        >
                                          {digitDecimal(
                                            obj.data.opportunityCo2,
                                          )}{' '}
                                          MT/ HR
                                        </p>
                                        <p
                                          className='text-12-regular'
                                          style={{
                                            paddingTop: '1px',
                                          }}
                                          data-static-id='Corporate.js_p_709ccb'
                                        >
                                          REDUCTION OPPORTUNITY
                                        </p>
                                        <p
                                          className='text-12-regular'
                                          style={{
                                            paddingTop: '1px',
                                          }}
                                          data-static-id='Corporate.js_p_a4e4bf'
                                        >
                                          IN CO
                                          <sub
                                            className={`${styles.subText}`}
                                            data-static-id='Corporate.js_sub_6cb52b'
                                          >
                                            2
                                          </sub>{' '}
                                          EMISSIONS
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </Tooltip>
                          </div>
                        )
                      })
                    : ''}
                </div>
              </div>
            </div>
          </div>
        </PerformanceLog>
      )}
    </>
  )
}
