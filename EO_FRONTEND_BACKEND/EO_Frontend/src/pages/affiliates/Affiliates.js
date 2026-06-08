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
import co2IconTrn from 'assets/sabic_icons/collapsible/co2_trn.svg'
import energyIconTrn from 'assets/sabic_icons/collapsible/energy_efficient_lightbulb_trn.svg'
import goodElectricalIconTrn from 'assets/sabic_icons/collapsible/good_electrical_performance_trn.svg'
import affiliateIcon from 'assets/sabic_icons/lading_pages_top_kpis/affiliates.svg'
import co2Icon from 'assets/sabic_icons/lading_pages_top_kpis/co2.svg'
import energyIcon from 'assets/sabic_icons/lading_pages_top_kpis/energy_efficient_lightbulb.svg'
import goodElectricalIcon from 'assets/sabic_icons/lading_pages_top_kpis/good_electrical_performance.svg'
import affiliateIconWithoutBg from 'assets/sabic_new_icons/affiliates_color_icon.svg'
import { AppAtom } from 'atoms/AppAtom'
import PerformanceLog from 'components/elements/performance_log/PerformanceLog'
import Loader from 'components/ui/loader/Loader'
import LandingPagesTopKpi from 'components/visuals/common/landing_pages_top_kpi/LandingPagesTopKpi'
import MultiSelectV2 from 'components/visuals/dropdown/multi_select/MultiSelectV2'
import SustainabilityScorecard from 'components/visuals/sustainability_scorecard/SustainabilityScorecard'
import CollapsibleTable from 'components/visuals/table/collapsible_table/CollapsibleTable'
import { TRACKEVENTOBJ } from 'config/ActivityTrackerConfig'
import { useAtomValue } from 'jotai'
import Logger from 'logger/Logger'
import {
  getValidAffiliateData,
  redirectToAffiliate,
} from 'pages/corporate/Corporate'
import { useEffect, useState } from 'react'
import { Tab, Tabs } from 'react-bootstrap'
import { useLocation, useParams } from 'react-router'
import { useNavigate, useRouteLoaderData } from 'react-router-dom'
import { slugToText, textToSlug } from 'utills/utilities'
import styles from './Affiliates.module.scss'
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
    title:
      "<span class='d-block mt-2'>PREDICTED OPPORTUNITIES</span><span class='text-11-regular text_primary_gray_2'>(BASED ON LATEST MODEL RUN TIME)</span>",
    icon: '',
    children: [
      {
        title: 'ENERGY BILLS',
        key: 'opportunityEnergyBills',
        icon: goodElectricalIconTrn,
        children: [],
        sortable: true,
        uom: '$/ HR',
        columnIndex: 1,
      },
      {
        title: 'POTENTIAL ENERGY CONTRIBUTION TO SEEC',
        key: 'seecGain',
        icon: energyIconTrn,
        children: [],
        sortable: true,
        uom: 'GJ/ HR',
        columnIndex: 2,
      },
      {
        title: 'REDUCTION IN CO<sub>2</sub> EMISSIONS',
        key: 'opportunityCo2',
        icon: co2IconTrn,
        children: [],
        sortable: true,
        uom: 'MT/ HR',
        columnIndex: 3,
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
    columnIndex: 4,
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
const iconsArr = [
  {
    image: affiliateIcon,
    line1: 'AFFILIATES',
    line2: '',
    key: 'count_affiliates',
    unit: '',
  },
  {
    image: goodElectricalIcon,
    line1: 'OPPORTUNITY IN ENERGY',
    line2: 'BILLS',
    key: 'opportunityEnergyBills',
    unit: ' $/ HR',
  },
  {
    image: energyIcon,
    line1: 'POTENTIAL ENERGY',
    line2: 'CONTRIBUTION TO SEEC',
    key: 'seecGain',
    unit: ' GJ/ HR',
  },
  {
    image: co2Icon,
    line1: 'REDUCTION OPPORTUNITY',
    line2: 'IN CO<sub>2</sub> EMISSIONS',
    key: 'opportunityCo2',
    unit: ' MT/ HR',
  },
]
const tabs = [
  {
    eventKey: 'overview',
    title: 'OVERVIEW',
    path: '',
  },
  {
    eventKey: 'alert_statistics',
    title: 'ALERT STATISTICS',
    path: 'alert-statistics',
  },
  // {
  //   eventKey: 'value_creation',
  //   title: 'Value Creation',
  //   path: 'value_creation',
  // },
]
export function populateData(
  setAffiliateList,
  setAffiliateDataList,
  setFilteredAffiliateDataList,
  setTopKpiData,
  setIsLoading,
  tempFinalData,
) {
  setAffiliateList([
    {
      display_name: 'All',
      tag_name: 'all',
    },
  ])
  setAffiliateDataList([])
  setFilteredAffiliateDataList([])
  setTopKpiData(tempFinalData)
  setIsLoading(false)
}
export default function Affiliates() {
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
  const [isDefaultSelected, setDefaultSelected] = useState(false)
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
  const [selectedTab, setSelectedTab] = useState('')
  const location = useLocation()

  // initial useEffect
  useEffect(() => {
    if (!pageFinalData || pageFinalData.length <= 0) {
      getValidAffiliateData()
        .then((obj) => {
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
            Object.keys(params).length === 0
              ? regionList
              : [slugToText(params.region)?.toLowerCase()]
          const finalData = obj.map((item) => ({
            ...item,
            count_affiliate: item.affiliateCount,
          }))
          setPageFinalData(finalData)
          setRegionName(tempRegionName)
        })
        .catch((error) => {
          console.error(error)
          setPageFinalData([])
          setRegionFilterValues([])
        })
    } else {
      if (region_name.length > 0) {
        onRegionUpdation()
      }
    }
  }, [JSON.stringify(pageFinalData), region_name])
  useEffect(() => {
    if (finalTableRows?.length && !isDefaultSelected) {
      const row = finalTableRows[0]
      const { data } = row
      setIsPlant(false)
      setSustainabilityScorecardData(data)
      setDefaultSelected(true)
    }
  }, [finalTableRows, isDefaultSelected])
  function onRegionUpdation() {
    try {
      if (Array.isArray(region_name) && region_name.length) {
        const tempRegionData = pageFinalData.filter((obj) =>
          region_name.includes(obj.regionName?.toLowerCase()),
        )
        const allAffList = []
        tempRegionData.forEach((obj) => allAffList.push(...obj.affiliates))
        if (allAffList.length > 0) {
          const tempAffList = allAffList
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
        const tempTopDataNew = tempRegionData.reduce(
          (a, c) => ({
            count_affiliates: a.count_affiliates + c.count_affiliate,
            opportunityEnergyBills:
              a.opportunityEnergyBills + c.opportunityEnergyBills,
            seecGain: a.seecGain + c.seecGain,
            opportunityCo2: a.opportunityCo2 + c.opportunityCo2,
          }),
          {
            count_affiliates: 0,
            opportunityEnergyBills: 0,
            seecGain: 0,
            opportunityCo2: 0,
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
        populateData(
          setAffiliateList,
          setAffiliateDataList,
          setFilteredAffiliateDataList,
          setTopKpiData,
          setIsLoading,
          tempFinalData,
        )
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
    const isAll = value.filter((obj) => obj.tag_name == 'all').length >= 1
    if (isAll) {
      const tempTopData = affiliateDataList.reduce(
        (obj, item) => {
          return {
            count_affiliates: obj.count_affiliates + 1,
            opportunityEnergyBills: parseFloat(
              parseFloat(obj.opportunityEnergyBills) +
                parseFloat(item.opportunityEnergyBills || 0),
            ),
            seecGain: parseFloat(
              parseFloat(obj.seecGain) + parseFloat(item.seecGain || 0),
            ),
            opportunityCo2: parseFloat(
              parseFloat(obj.opportunityCo2) +
                parseFloat(item.opportunityCo2 || 0),
            ),
          }
        },
        {
          count_affiliates: 0,
          opportunityEnergyBills: 0,
          seecGain: 0,
          opportunityCo2: 0,
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
        const tempTopData = finalListedVals.reduce(
          (obj, item) => {
            return {
              count_affiliates: obj.count_affiliates + 1,
              opportunityEnergyBills: parseFloat(
                parseFloat(obj.opportunityEnergyBills) +
                  parseFloat(item.opportunityEnergyBills || 0),
              ),
              seecGain: parseFloat(
                parseFloat(obj.seecGain) + parseFloat(item.seecGain || 0),
              ),
              opportunityCo2: parseFloat(
                parseFloat(obj.opportunityCo2) +
                  parseFloat(item.opportunityCo2 || 0),
              ),
            }
          },
          {
            count_affiliates: 0,
            opportunityEnergyBills: 0,
            seecGain: 0,
            opportunityCo2: 0,
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
    const { data } = row
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
      const url = `/${textToSlug(obj.regionName)}/${textToSlug(obj.affiliateName?.toLowerCase())}/overview`
      const img = affiliateIcons[obj.affiliateCode] || obj.urlAffiliateImage
      tempFinalRows.push({
        data: {
          ...obj,
          customLink: url,
        },
        vals: [
          img || '',
          parseFloat(obj.opportunityEnergyBills),
          parseFloat(obj.seecGain),
          parseFloat(obj.opportunityCo2),
          url,
        ],
        children: {},
      })
    })
    setFinalTableRows(() => tempFinalRows)
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
  const getTabFromPath = () => {
    const segments = location.pathname.split('/')
    const last = segments[segments.length - 1]
    if (last === 'alert-statistics') return 'alert_statistics'
    if (last === 'value_creation') return 'value_creation'
    return 'overview'
  }
  const handleTabChange = (key) => {
    let redPath = ''
    if (params?.region) {
      redPath = `/${params.region}`
    } else {
      redPath = '/affiliates'
    }
    if (key === 'alert_statistics') {
      redPath += '/alert-statistics'
    } else if (key === 'value_creation') {
      redPath += '/value_creation'
    }
    setSelectedTab(key)
    navigate(redPath)
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
            data-static-id='Affiliates.js_div_7c8d2f'
          >
            <div
              className={`${styles.topKpi} p-0`}
              data-static-id='Affiliates.js_div_dcdde1'
            >
              <div
                className={`${styles.filterContainer} w-100 d-flex align-items-center justify-content-end`}
                data-static-id='Affiliates.js_div_692daf'
              >
                <div
                  id='region-filter'
                  data-testid='region-filter'
                  className={`d-flex align-items-center  ${styles.affiliatesCustomDropdown}`}
                  data-static-id='Affiliates.js_div_0d58eb'
                >
                  <span
                    className={`text-14-regular text_primary_gray  d-inline-block ${styles.labelText}`}
                    data-static-id='Affiliates.js_span_a4f01c'
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
                  id='affiliate-filter'
                  data-testid='affiliate-filter'
                  className={`d-flex align-items-center ${styles.affiliatesCustomDropdown}`}
                  data-static-id='Affiliates.js_div_d70554'
                >
                  <span
                    className={`text-14-regular text_primary_gray  d-inline-block ${styles.labelText}`}
                    data-static-id='Affiliates.js_span_74d2e4'
                  >
                    AFFILIATE
                  </span>
                  <MultiSelectV2
                    id='changing-aff-dropdown-filter'
                    data={affiliateList}
                    onChange={onAffiliateChange}
                  />
                </div>
              </div>
              <div
                id='affiliate-top-tiles'
                data-testid='affiliate-top-tiles'
                className={`${styles.topKpi}`}
                data-static-id='Affiliates.js_div_6af1b8'
              >
                <LandingPagesTopKpi data={topKpiData} source='affiliate' />
              </div>
            </div>
            <div
              className={`${styles.content} ${styles.affliateTabsContainer} commonTriangleTabs`}
              data-static-id='Affiliates.js_div_5bd081'
            >
              <Tabs
                activeKey={getTabFromPath()}
                onSelect={handleTabChange}
                data-tut={`reactour__affiliate_${selectedTab}_tab`}
                data-static-id='Affiliates.js_Tabs_a03ebd'
              >
                {tabs.map((tab) => (
                  <Tab
                    key={tab.eventKey}
                    eventKey={tab.eventKey}
                    title={tab.title}
                    data-static-id='Affiliates.js_Tab_c46c63'
                  >
                    {tab.eventKey === 'overview' && (
                      <div
                        className={`d-flex h-100 ${styles.affliateParentContainer}`}
                        data-static-id='Affiliates.js_div_7444ca'
                      >
                        <div
                          className={`${styles.contentContainerLeft}`}
                          data-static-id='Affiliates.js_div_9cb74b'
                        >
                          <div
                            className={`${styles.bottom} h-100`}
                            data-static-id='Affiliates.js_div_82c8ec'
                          >
                            {filteredAffiliateDataList.length <= 0 ? (
                              <div
                                className='d-flex align-items-center h-100 w-100 justify-content-center'
                                data-static-id='Affiliates.js_div_35b89e'
                              >
                                <h1
                                  className='text-18-bold text-center text_primary_gray'
                                  data-static-id='Affiliates.js_h1_a8a72c'
                                >
                                  Please Select Region/Affiliate from the list.
                                </h1>
                              </div>
                            ) : (
                              <div
                                id='affiliates-predicted-opportunity'
                                data-testid='affiliates-predicted-opportunity'
                                className={`${styles.removeWhiteSpaceWithPosition} h-100`}
                                data-static-id='Affiliates.js_div_adfc29'
                              >
                                <CollapsibleTable
                                  rows={finalTableRows}
                                  headers={tableHeaders}
                                  isDefaultSelected={isDefaultSelected}
                                  config={{
                                    l1: {
                                      url_position: [4],
                                      callback: handleTableRowClick,
                                      columnWidths: [15, 75, 10],
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
                          id='scorecard-data'
                          data-testid='scorecard-data'
                          className={`${styles.contentContainerRight}`}
                          data-tut='reactour__affiliate_sus_scorecard'
                          data-static-id='Affiliates.js_div_a16f51'
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
                    )}
                    {tab.eventKey === 'alert_statistics' && (
                      <div
                        className='d-flex h-100 justify-content-center align-items-center'
                        data-static-id='Affiliates.js_div_93b9a1'
                      >
                        <h1
                          className='text-black text-20-regular'
                          data-static-id='Affiliates.js_h1_1e39a7'
                        >
                          Coming soon
                        </h1>
                      </div>
                    )}
                    {tab.eventKey === 'value_creation' && (
                      <div
                        className={`${styles.alertStatsContainerMain} w-100 h-100 position-relative`}
                        data-static-id='Affiliates.js_div_d12487'
                      >
                        <div
                          className={`${styles.alertStatisticsUnderProgressContainer} d-flex h-100 justify-content-center align-items-center `}
                          data-static-id='Affiliates.js_div_9be3d9'
                        >
                          <h1 data-static-id='Affiliates.js_h1_65089c'>
                            <span
                              className={`text-uppercase ${styles.alertUnderProgressContainer}`}
                              data-static-id='Affiliates.js_span_4136e7'
                            >
                              {' '}
                              Coming soon
                            </span>
                          </h1>
                        </div>
                        <div
                          className={`w-100 h-100 ${styles.alertStaticsModelContainer}`}
                          data-static-id='Affiliates.js_div_278297'
                        >
                          {/* temprary commented also comment test case 101 to 104 */}
                          {/*  <ValueCapture /> */}
                        </div>
                      </div>
                    )}
                  </Tab>
                ))}
              </Tabs>
            </div>
          </div>
        </PerformanceLog>
      )}
    </>
  )
}
