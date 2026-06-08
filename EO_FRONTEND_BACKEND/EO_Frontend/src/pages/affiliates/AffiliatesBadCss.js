import affiliateIcon from 'assets/sabic_icons/lading_pages_top_kpis/affiliates.svg'
import co2ReductionIcon from 'assets/sabic_icons/lading_pages_top_kpis/co2_reduction.svg'
import energyProductionIcon from 'assets/sabic_icons/lading_pages_top_kpis/energy_red.svg'
import plantsIcon from 'assets/sabic_icons/lading_pages_top_kpis/plants.svg'
import productionGainIcon from 'assets/sabic_icons/lading_pages_top_kpis/production_opp.svg'
import { useEffect, useState } from 'react'
import { useParams } from 'react-router'
import { slugToText, textToSlug } from 'utills/utilities'
import styles from './AffiliatesBadCss.module.scss'
import affiliateIconWithoutBg from 'assets/sabic_new_icons/affiliates_color_icon.svg'
import co2ReductionIconWithoutBg from 'assets/sabic_new_icons/co2Reduction_color_icon.svg'
import energyProductionIconWithoutBg from 'assets/sabic_new_icons/energyProduction_color_icon.svg'
import plantsIconWithoutBg from 'assets/sabic_new_icons/plants_color_icon.svg'
import productionGainIconWithoutBg from 'assets/sabic_new_icons/productionGain_color_icon.svg'
import Loader from 'components/ui/loader/Loader'
import PerformanceLog from 'components/elements/performance_log/PerformanceLog'
import LandingPagesTopKpi from 'components/visuals/common/landing_pages_top_kpi/LandingPagesTopKpi'
import MultiSelectV2 from 'components/visuals/dropdown/multi_select/MultiSelectV2'
import SustainabilityScorecard from 'components/visuals/sustainability_scorecard/SustainabilityScorecard'
import CollapsibleTable from 'components/visuals/table/collapsible_table/CollapsibleTable'
import moment from 'moment'
import aff_1200 from 'assets/sabic_icons/affiliates_icons/1200.svg'
import aff_1300 from 'assets/sabic_icons/affiliates_icons/1300.svg'
import aff_1400 from 'assets/sabic_icons/affiliates_icons/1400.svg'
import aff_1500 from 'assets/sabic_icons/affiliates_icons/1500.svg'
import aff_1600 from 'assets/sabic_icons/affiliates_icons/1600.svg'
import aff_1800 from 'assets/sabic_icons/affiliates_icons/1800.svg'
import aff_1900 from 'assets/sabic_icons/affiliates_icons/1900.svg'
import aff_2000 from 'assets/sabic_icons/affiliates_icons/2000.svg'
import aff_2200 from 'assets/sabic_icons/affiliates_icons/2200.svg'
import aff_3300 from 'assets/sabic_icons/affiliates_icons/3300.svg'
import aff_4000 from 'assets/sabic_icons/affiliates_icons/4000.svg'
import { AppAtom } from 'atoms/AppAtom'
import { TRACKEVENTOBJ } from 'config/ActivityTrackerConfig'
import { useAtomValue } from 'jotai'
import Logger from 'logger/Logger'
import {
  getValidAffiliateData,
  redirectToAffiliate,
} from 'pages/corporate/Corporate'
import { useNavigate, useRouteLoaderData } from 'react-router-dom'
const tableHeaders = [
  {
    title: 'AFFILIATES',
    key: 'count_affiliates',
    icon: affiliateIconWithoutBg,
    children: [],
    sortable: false,
    uom: '',
    columnIndex: 0,
  },
  {
    title: 'PLANTS',
    key: 'count_plants',
    icon: plantsIconWithoutBg,
    children: [],
    sortable: false,
    uom: '',
    columnIndex: 1,
  },
  {
    title:
      "<span class='d-block mt-2'>PREDICTED OPPORTUNITIES</span><span class='text-11-regular text_primary_gray_2'>(BASED ON LATEST MODEL RUN TIME)</span>",
    icon: '',
    children: [
      {
        title: 'Production',
        key: 'count_pgo',
        icon: productionGainIconWithoutBg,
        children: [],
        sortable: true,
        uom: 'MT/ DAY',
        columnIndex: 2,
      },
      {
        title: 'Energy Reduction',
        key: 'count_ero',
        icon: energyProductionIconWithoutBg,
        children: [],
        sortable: true,
        uom: 'MMBTU/ DAY',
        columnIndex: 3,
      },
      {
        title: 'CO<sub>2</sub> Reduction',
        key: 'count_cro',
        icon: co2ReductionIconWithoutBg,
        children: [],
        sortable: true,
        uom: 'MT/ DAY',
        columnIndex: 4,
      },
    ],
    sortable: false,
    uom: '',
  },
  {
    title: '',
    icon: '',
    children: [],
    sortable: false,
    columnIndex: 5,
  },
]
const affiliateIcons = {
  1200: aff_1200,
  1300: aff_1300,
  1400: aff_1400,
  1500: aff_1500,
  1600: aff_1600,
  1800: aff_1800,
  1900: aff_1900,
  2000: aff_2000,
  2200: aff_2200,
  4000: aff_4000,
  3300: aff_3300,
}
const subTableHeaders = [
  {
    title: 'PLANT',
    icon: '',
    children: [],
    sortable: false,
    uom: '',
  },
  {
    title: 'PREDICTED',
    icon: '',
    children: [
      {
        title: 'Production Gain',
        icon: productionGainIcon,
        children: [],
        sortable: false,
        uom: 'MT/ DAY',
      },
      {
        title: 'Energy Reduction',
        icon: energyProductionIcon,
        children: [],
        sortable: false,
        uom: 'MMBTU/ DAY',
      },
      {
        title: 'CO<sub>2</sub> Reduction',
        icon: productionGainIcon,
        children: [],
        sortable: false,
        uom: 'MT/ DAY',
      },
    ],
    sortable: false,
    uom: '',
  },
  {
    title: 'STATUS',
    icon: '',
    children: [],
    sortable: false,
    uom: '',
  },
]
const iconsArr = [
  {
    image: affiliateIcon,
    line1: 'AFFILIATES',
    line2: '',
    key: 'count_affiliates',
    unit: '',
  },
  {
    image: plantsIcon,
    line1: 'PLANTS',
    line2: '',
    key: 'count_plants',
    unit: '',
  },
  {
    image: productionGainIcon,
    line1: 'PREDICTED PRODUCTION OPPORTUNITY',
    line2: '',
    key: 'count_pgo',
    unit: 'MT/ DAY',
  },
  {
    image: energyProductionIcon,
    line1: 'PREDICTED ENERGY REDUCTION OPPORTUNITY',
    line2: '',
    key: 'count_ero',
    unit: ' MMBTU/ DAY',
  },
  {
    image: co2ReductionIcon,
    line1:
      "PREDICTED CO<sub className='text-13-regular primary_gray'>2</sub> REDUCTION OPPORTUNITY",
    line2: '',
    key: 'count_cro',
    unit: ' MT/ DAY',
  },
]
export default function AffiliatesBadCss() {
  const appContext = useAtomValue(AppAtom)
  const caseData = appContext?.caseData || []
  const loaderData = useRouteLoaderData('root')
  const navigate = useNavigate()
  const params = useParams()
  const [isPlant, setIsPlant] = useState(false)
  // redirect to plant page if user is not corporate user

  useEffect(() => {
    redirectToAffiliate(loaderData, appContext, navigate)
  }, [])
  const [topKpiData, setTopKpiData] = useState(null)
  const [pageFinalData, setPageFinalData] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [affiliateDataList, setAffiliateDataList] = useState([])
  const [sustainabilityScorecardData, setSustainabilityScorecardData] =
    useState([])
  const [filteredAffiliateDataList, setFilteredAffiliateDataList] = useState([])
  const [finalTableRows, setFinalTableRows] = useState([])
  const [region_name, setRegionName] = useState([])
  const [affiliateList, setAffiliateList] = useState([
    {
      display_name: 'All',
      tag_name: 'all',
    },
  ])
  const [regionFilterValues, setRegionFilterValues] = useState([
    {
      display_name: 'All',
      tag_name: 'all',
    },
  ])

  // initial useEffect
  useEffect(() => {
    if (!pageFinalData || pageFinalData.length <= 0) {
      getValidAffiliateData().then((obj) => {
        const regionDataForRegionSelector = [
          {
            display_name: 'All',
            tag_name: 'all',
          },
          ...obj.map((obj) => ({
            display_name: obj.regionName,
            tag_name: obj.regionName,
          })),
        ]
        setRegionFilterValues(regionDataForRegionSelector)
        let regionList = []
        if (obj && Array.isArray(obj) && obj.length) {
          regionList = obj.map((region) => region.regionName?.toLowerCase())
        }
        const tempRegionName =
          Object.keys(params).length == 0
            ? regionList
            : [slugToText(params.region)?.toLowerCase()]
        const finalData = obj.map((item) => ({
          ...item,
          count_affiliate: item.affiliateCount,
          count_plant: item.plantsCount,
        }))
        setPageFinalData(finalData)
        setRegionName(tempRegionName)
      })
    } else {
      if (region_name.length > 0) {
        onRegionUpdation()
      }
    }
  }, [JSON.stringify(pageFinalData), region_name])
  function populateData(tempFinalData) {
    setAffiliateList((p) => [
      {
        display_name: 'All',
        tag_name: 'all',
      },
    ])
    setAffiliateDataList((p) => [])
    setFilteredAffiliateDataList((p) => [])
    setTopKpiData(tempFinalData)
    setIsLoading((p) => false)
  }
  function onRegionUpdation() {
    try {
      if (Array.isArray(region_name) && region_name.length) {
        const tempRegionData = pageFinalData.filter((obj) =>
          region_name.includes(obj.regionName?.toLowerCase()),
        )
        const allAffList = []
        tempRegionData.forEach((obj) => allAffList.push(...obj.affiliates))
        if (allAffList.length > 0) {
          let tempAffList = allAffList
          const tAffMap = [
            {
              display_name: 'All',
              tag_name: 'all',
            },
            ...tempAffList.map((obj) => ({
              display_name: obj.affiliateName,
              tag_name: obj.affiliateName,
            })),
          ]
          setAffiliateList((p) => tAffMap)
        } else {
          setAffiliateList((p) => [
            {
              display_name: 'All',
              tag_name: 'all',
            },
          ])
        }
        setAffiliateDataList((p) => allAffList)
        setFilteredAffiliateDataList((p) => allAffList)
        let tempTopDataNew = tempRegionData.reduce(
          (a, c) => ({
            count_affiliates: a.count_affiliates + c.count_affiliate,
            count_plants: a.count_plants + c.count_plant,
            count_pgo: a.count_pgo + c.prodOppSum,
            count_ero: a.count_ero + c.energyOppSum,
            count_cro: a.count_cro + c.envOppSum,
          }),
          {
            count_affiliates: 0,
            count_plants: 0,
            count_pgo: 0,
            count_ero: 0,
            count_cro: 0,
          },
        )
        const tempFinalData = iconsArr.map((obj) => ({
          ...obj,
          value: tempTopDataNew[obj.key],
        }))
        setTopKpiData(tempFinalData)
        setIsLoading((p) => false)
      } else {
        const tempFinalData = iconsArr.map((obj) => ({
          ...obj,
          value: '-',
        }))
        populateData(tempFinalData)
      }
    } catch (e) {
      setIsLoading((p) => true)
      Logger.log('API CALL FAILED ', e)
    }
  }
  function onRegionChange(value, clickedOption) {
    TRACKEVENTOBJ.affiliates.onRegionChange(
      {
        params,
        caseData,
      },
      clickedOption,
    )
    if (Array.isArray(value)) {
      const isAll = value.filter(
        (obj) => obj.display_name?.toLowerCase() == 'all',
      )
      if (Array.isArray(isAll) && isAll.length) {
        const temp_regions = pageFinalData.map((region) =>
          region.regionName?.toLowerCase(),
        )
        setRegionName((p) => temp_regions)
      } else {
        const temp_regions = value.map((obj) => obj.display_name?.toLowerCase())
        setRegionName((p) => temp_regions)
      }
    }
  }
  function onAffiliateChange(value, clickedOption) {
    TRACKEVENTOBJ.affiliates.onAffiliateChange(
      {
        params,
        caseData,
      },
      clickedOption,
    )
    const isAll =
      value.filter((obj) => obj.tag_name == 'all').length >= 1 ? true : false
    if (isAll) {
      let tempTopData = affiliateDataList.reduce(
        (obj, item) => {
          return {
            count_affiliates: obj.count_affiliates + 1,
            count_plants: parseFloat(
              parseFloat(obj.count_plants) + parseFloat(item.plantsCount || 0),
            ),
            count_pgo: parseFloat(
              parseFloat(obj.count_pgo) + parseFloat(item.prodOppSum || 0),
            ),
            count_ero: parseFloat(
              parseFloat(obj.count_ero) + parseFloat(item.energyOppSum || 0),
            ),
            count_cro: parseFloat(
              parseFloat(obj.count_cro) + parseFloat(item.envOppSum || 0),
            ),
          }
        },
        {
          count_affiliates: 0,
          count_plants: 0,
          count_pgo: 0,
          count_ero: 0,
          count_cro: 0,
        },
      )
      const tempFinalData = iconsArr.map((obj) => ({
        ...obj,
        value: tempTopData[obj.key],
      }))
      setTopKpiData((p) => tempFinalData)
      setFilteredAffiliateDataList((p) => affiliateDataList)
    } else {
      const filterVals = value
        .filter((obj) => obj.tag_name && obj.tag_name != 'all')
        .map((obj) => obj.tag_name?.toLowerCase())
      const finalListedVals = affiliateDataList.filter((obj) =>
        filterVals.includes(obj.affiliateName?.toLowerCase()),
      )
      if (finalListedVals.length > 0) {
        let tempTopData = finalListedVals.reduce(
          (obj, item) => {
            return {
              count_affiliates: obj.count_affiliates + 1,
              count_plants: parseFloat(
                parseFloat(obj.count_plants) +
                  parseFloat(item.plantsCount || 0),
              ),
              count_pgo: parseFloat(
                parseFloat(obj.count_pgo) + parseFloat(item.prodOppSum || 0),
              ),
              count_ero: parseFloat(
                parseFloat(obj.count_ero) + parseFloat(item.energyOppSum || 0),
              ),
              count_cro: parseFloat(
                parseFloat(obj.count_cro) + parseFloat(item.envOppSum || 0),
              ),
            }
          },
          {
            count_affiliates: 0,
            count_plants: 0,
            count_pgo: 0,
            count_ero: 0,
            count_cro: 0,
          },
        )
        const tempFinalData = iconsArr.map((obj) => ({
          ...obj,
          value: tempTopData[obj.key],
        }))
        setTopKpiData((p) => tempFinalData)
      }
      setFilteredAffiliateDataList((p) => finalListedVals)
    }
  }
  const handleTableRowClick = (row) => {
    const data = row.data
    setIsPlant(false)
    setSustainabilityScorecardData((p) => data)
  }
  function handleSubTableRowClick(row) {
    setIsPlant(true)
    setSustainabilityScorecardData((p) => row.data)
  }
  useEffect(() => {
    const tempFinalRows = []
    filteredAffiliateDataList.forEach((obj) => {
      const url = `/${textToSlug(obj.regionName)}/${textToSlug(obj.affiliateName?.toLowerCase())}`
      const img = affiliateIcons[obj.affiliateCode] || obj.urlAffiliateImage
      tempFinalRows.push({
        data: {
          ...obj,
          customLink: url,
        },
        vals: [
          img || '',
          obj.plantsCount,
          parseFloat(obj.prodOppSum),
          parseFloat(obj.energyOppSum),
          parseFloat(obj.envOppSum),
          url,
        ],
        children: {
          headers: subTableHeaders,
          rows: obj.plants.map((item) => {
            const plantUrl = `/${textToSlug(obj.regionName)}/${textToSlug(obj.affiliateName?.toLowerCase())}/${textToSlug(item.plantName)}`
            return {
              data: {
                ...item,
                affiliateName: obj.affiliateName,
                affiliateCode: obj.affiliateCode,
                customLink: plantUrl,
              },
              vals: [
                // ################## DO NOT CHANGE ANY HTML STRUTCURE TILL </span> #511 LINE #################
                `<span class='d-block link-span'>${item.plantName}</span> {${obj.plantName}} <span class='text-12-regular text_primary_gray_2 time-span 1'>(${
                  item?.systems.reduce((prev, curr) =>
                    prev.timeStampEpoch > curr.timeStampEpoch ? prev : curr,
                  ).timeStampEpoch
                    ? moment(
                        item?.systems.reduce((prev, curr) =>
                          prev.timeStampEpoch > curr.timeStampEpoch
                            ? prev
                            : curr,
                        ).timeStampEpoch,
                      )
                        ?.format('DD-MMM-YY hh:mm A')
                        ?.toUpperCase()
                    : '-'
                })</span>`,
                parseFloat(item.prodOppSum),
                parseFloat(item.energyOppSum),
                parseFloat(item.envOppSum),
                item.plantStatus,
              ],
              children: {},
            }
          }),
        },
      })
    })
    setFinalTableRows((p) => tempFinalRows)
  }, [JSON.stringify(filteredAffiliateDataList)])
  const calculateActiveIndex = (regionName, regionFilterValues) => {
    let activeIndex = 0
    if (Array.isArray(regionName) && regionName.length === 1) {
      if (regionFilterValues.length > 0) {
        const lowerCaseRegionName = regionName[0]?.toLowerCase()
        activeIndex = regionFilterValues.findIndex(
          (obj) => obj.display_name?.toLowerCase() === lowerCaseRegionName,
        )
      }
    }
    return activeIndex
  }
  return (
    <>
      {isLoading ? (
        <Loader />
      ) : (
        <PerformanceLog
          api_url={['get_landing_corporate']}
          componentName='Affiliates'
          actionName='onLoad'
          screenName='Affiliates'
          isActive={1}
        >
          <div
            className={`${styles.parent}`}
            data-static-id='AffiliatesBadCss.js_div_a32c30'
          >
            <div
              className={`${styles.topKpi} p-0`}
              data-static-id='AffiliatesBadCss.js_div_3d3bbc'
            >
              <div
                className={`${styles.filterContainer} w-100 d-flex align-items-center justify-content-end`}
                data-static-id='AffiliatesBadCss.js_div_3e34af'
              >
                <div
                  className={`d-flex align-items-center  ${styles.affiliatesCustomDropdown}`}
                  data-static-id='AffiliatesBadCss.js_div_2e88be'
                >
                  <span
                    className={`text-14-regular text_primary_gray  d-inline-block ${styles.labelText}`}
                    data-static-id='AffiliatesBadCss.js_span_238680'
                  >
                    REGION
                  </span>
                  <MultiSelectV2
                    activeI={calculateActiveIndex(
                      region_name,
                      regionFilterValues,
                    )}
                    data={regionFilterValues}
                    onChange={onRegionChange}
                  />
                </div>
                <div
                  className={`d-flex align-items-center ${styles.affiliatesCustomDropdown}`}
                  data-static-id='AffiliatesBadCss.js_div_3dd0ad'
                >
                  <span
                    className={`text-14-regular text_primary_gray  d-inline-block ${styles.labelText}`}
                    data-static-id='AffiliatesBadCss.js_span_1f7426'
                  >
                    AFFILIATE
                  </span>

                  <MultiSelectV2
                    data={affiliateList}
                    onChange={onAffiliateChange}
                  />
                </div>
              </div>
              <div
                id='affiliate-top-tiles'
                data-testid='affiliate-top-tiles'
                className={`${styles.topKpi}`}
                data-static-id='AffiliatesBadCss.js_div_8700c1'
              >
                <LandingPagesTopKpi data={topKpiData} source='affiliate' />
              </div>
            </div>
            <div
              className={`${styles.content} d-flex`}
              data-static-id='AffiliatesBadCss.js_div_f2bffa'
            >
              <div
                className={`${styles.contentContainerLeft}`}
                data-static-id='AffiliatesBadCss.js_div_71c3c3'
              >
                <div
                  className={`${styles.bottom} h-100`}
                  data-static-id='AffiliatesBadCss.js_div_011c79'
                >
                  {filteredAffiliateDataList.length <= 0 ? (
                    <div
                      className='d-flex align-items-center h-100 w-100 justify-content-center'
                      data-static-id='AffiliatesBadCss.js_div_f7d086'
                    >
                      <h1
                        className='text-18-bold text-center text_primary_gray'
                        data-static-id='AffiliatesBadCss.js_h1_b70eb1'
                      >
                        Please Select Region/Affiliate from the list.
                      </h1>
                    </div>
                  ) : (
                    <div
                      className={`${styles.removeWhiteSpaceWithPosition} h-100`}
                      data-static-id='AffiliatesBadCss.js_div_146bb0'
                    >
                      <CollapsibleTable
                        rows={finalTableRows}
                        headers={tableHeaders}
                        config={{
                          l1: {
                            url_position: [5],
                            callback: handleTableRowClick,
                            columnWidths: [10, 15, 50, 10],
                            imageColumns: [0],
                            statusColumns: [],
                            leftAlignedColumns: [],
                            defaultSortColumn: [2],
                            leftAlignColumns: [],
                          },
                          l2: {
                            url_position: [],
                            callback: handleSubTableRowClick,
                            columnWidths: [20, 20, 24, 24, 24],
                            leftAlignedColumns: [0],
                            imageColumns: [],
                            statusColumns: [4],
                            defaultSortColumn: [2],
                            leftAlignColumns: [0],
                            text_url_position: [0],
                          },
                        }}
                        collapseKey='affiliateName'
                        screen={'AFFILIATE'}
                      />
                    </div>
                  )}
                </div>
              </div>
              <div
                className={`${styles.contentContainerRight}`}
                data-static-id='AffiliatesBadCss.js_div_06ba12'
              >
                <SustainabilityScorecard
                  data={sustainabilityScorecardData}
                  setSustainabilityScorecardData={
                    setSustainabilityScorecardData
                  }
                  isPlant={isPlant}
                  screen={'AFFILIATE'}
                />
              </div>
            </div>
          </div>
        </PerformanceLog>
      )}
    </>
  )
}
