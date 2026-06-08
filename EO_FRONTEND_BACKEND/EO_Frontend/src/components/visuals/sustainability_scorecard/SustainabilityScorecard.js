import { AppAtom } from 'atoms/AppAtom'
import { sustainabilityScoreCardAtom } from 'atoms/PlantDetailAtom'
import { Tab } from 'bootstrap'
import Loader from 'components/ui/loader/Loader'
import { TRACKEVENTOBJ } from 'config/ActivityTrackerConfig'
import { APP_CONFIG, SUSTAINABILITY_SCORECARD } from 'config/Config'
import { useAtom, useAtomValue } from 'jotai'
import moment from 'moment'
import { useEffect, useState } from 'react'
import { Tabs } from 'react-bootstrap'
import { useParams } from 'react-router-dom'
import {
  getLandingAffiliateScoreCard,
  getScorecardPlantData,
} from 'services/ConfigServices'
import ScoreBoardTable from './ScoreBoardTable'
import styles from './SustainabilityScorecard.module.scss'
const energyBillDetails = {
  title: 'ENERGY BILLS',
  uom: '$',
}
const seecGainDetails = {
  title: 'POTENTIAL ENERGY CONTRIBUTION TO SEEC',
  uom: 'GJ/ HR',
}
const reductionOpportunityDetails = {
  title: 'REDUCTION IN CO<sub>2</sub> EMISSIONS',
  uom: 'MT/ HR',
}
export function itemToData(item, data, isPlant) {
  if (isPlant) {
    let plant = item.plants.filter(
      (iPlant) =>
        iPlant?.plantName?.toLowerCase() == data?.plantName?.toLowerCase(),
    )
    if (plant && Array.isArray(plant) && plant.length > 0) {
      plant = plant[0]
      return [
        {
          title: energyBillDetails.title,
          uom: energyBillDetails.uom,
          actual: plant.energyOpp,
        },
        {
          title: seecGainDetails.title,
          uom: seecGainDetails.uom,
          actual: plant.seecGain,
        },
        {
          title: reductionOpportunityDetails.title,
          uom: reductionOpportunityDetails.uom,
          actual: plant.co2Opp,
        },
      ]
    } else {
      return [
        {
          title: energyBillDetails.title,
          uom: energyBillDetails.uom,
          actual: '*',
        },
        {
          title: seecGainDetails.title,
          uom: seecGainDetails.uom,
          actual: '*',
        },
        {
          title: reductionOpportunityDetails.title,
          uom: reductionOpportunityDetails.uom,
          actual: '*',
        },
      ]
    }
  } else {
    return [
      {
        title: energyBillDetails.title,
        uom: energyBillDetails.uom,
        actual: item.energyOpp,
      },
      {
        title: seecGainDetails.title,
        uom: seecGainDetails.uom,
        actual: item.seecGain,
      },
      {
        title: reductionOpportunityDetails.title,
        uom: reductionOpportunityDetails.uom,
        actual: item.co2Opp,
      },
    ]
  }
}
export function updateDataStore(affiliateCode, data, dataStore, setDataStore) {
  if (!Object.keys(dataStore).includes(affiliateCode)) {
    const tempDataStore = {
      [affiliateCode]: data,
    }
    setDataStore((prev) => ({
      ...prev,
      ...tempDataStore,
    }))
  }
}
export function plantDataToPredictedData(
  data = [],
  type = null,
  plantName = null,
  setIsPredictedLoading = () => {},
  setPredictedDataStore = () => {},
  setPredictedData = () => {},
) {
  const tempPredictedLoading = {}
  if (data?.length <= 0) {
    tempPredictedLoading[type] = 1
    setIsPredictedLoading((p) => ({
      ...p,
      ...tempPredictedLoading,
    }))
  } else {
    const modifiedData = data?.map((obj) => ({
      title: obj?.parameter,
      order: obj?.order,
      uom: obj?.uom,
      actual: obj?.value,
      optimum: obj?.plannedValue,
      timeStampEpoch: obj.timeStampEpoch,
      valueDecimal: obj?.valueDecimal || 1,
    }))
    const sortedData = [...modifiedData]?.sort((a, b) => a.order - b.order)
    setPredictedDataStore((p) => {
      if (!Object.keys(p).includes(plantName)) {
        p[plantName] = {}
      }
      p[plantName][type] = sortedData
      return p
    })
    const tempPredictedData = {}
    tempPredictedData[type] = sortedData
    setPredictedData((p) => ({
      ...p,
      ...tempPredictedData,
    }))
    tempPredictedLoading[type] = 1
    setIsPredictedLoading((p) => ({
      ...p,
      ...tempPredictedLoading,
    }))
  }
}
export default function SustainabilityScorecard({
  susData = {},
  data,
  config,
  affiliateCode = null,
  isPlant = false,
  plant,
  screen = 'AFFILIATE',
  source = 'affiliate',
  setSustainabilityScorecardData = () => {},
}) {
  const params = useParams()
  const appContext = useAtomValue(AppAtom)
  const caseData = appContext?.caseData || []
  const defaultData = {
    default: {
      yesterday: [
        {
          title: energyBillDetails.title,
          uom: energyBillDetails.uom,
          actual: '*',
        },
        {
          title: seecGainDetails.title,
          uom: seecGainDetails.uom,
          actual: '*',
        },
        {
          title: reductionOpportunityDetails.title,
          uom: reductionOpportunityDetails.uom,
          actual: '*',
        },
      ],
      today: [
        {
          title: energyBillDetails.title,
          uom: energyBillDetails.uom,
          actual: '*',
        },
        {
          title: seecGainDetails.title,
          uom: seecGainDetails.uom,
          actual: '*',
        },
        {
          title: reductionOpportunityDetails.title,
          uom: reductionOpportunityDetails.uom,
          actual: '*',
        },
      ],
      month: [
        {
          title: energyBillDetails.title,
          uom: energyBillDetails.uom,
          actual: '*',
        },
        {
          title: seecGainDetails.title,
          uom: seecGainDetails.uom,
          actual: '*',
        },
        {
          title: reductionOpportunityDetails.title,
          uom: reductionOpportunityDetails.uom,
          actual: '*',
        },
      ],
      year: [
        {
          title: energyBillDetails.title,
          uom: energyBillDetails.uom,
          actual: '*',
        },
        {
          title: seecGainDetails.title,
          uom: seecGainDetails.uom,
          actual: '*',
        },
        {
          title: reductionOpportunityDetails.title,
          uom: reductionOpportunityDetails.uom,
          actual: '*',
        },
      ],
    },
  }
  const [isLoading, setIsLoading] = useState(false)
  const [finalData, setFinalData] = useState(defaultData)
  const [dataStore, setDataStore] = useState(susData)
  const [predictedDataStore, setPredictedDataStore] = useState({})
  const [predictedData, setPredictedData] = useState([])
  const [scorecardAtomData, setScorcardAtomData] = useAtom(
    sustainabilityScoreCardAtom,
  )
  const [isPredictedLoading, setIsPredictedLoading] = useState({
    yesterday: -1,
    today: -1,
    month: -1,
    year: -1,
  })
  const [loadingPlantData, setLoadingPlantData] = useState(false)
  async function processCumulativeData() {
    if (isDataStoreAvailable(data)) {
      processAffiliateData(data.affiliateCode)
    } else {
      await fetchAffiliateScoreCard(data.affiliateID)
    }
  }
  function isDataStoreAvailable(data) {
    return dataStore && Object.keys(dataStore).includes(data.affiliateCode)
  }
  function processAffiliateData(affiliateCode) {
    const tempItem = getDefaultData()
    const affData = dataStore[affiliateCode]
    affData.forEach((obj) => {
      const { upto } = obj
      const item = obj?.landingSustainabiltyAffiliates[0] || null
      if (item) {
        tempItem[upto] = itemToData(item, data, isPlant)
      }
    })
    updateFinalData(tempItem)
    setIsLoading(false)
  }
  async function fetchAffiliateScoreCard(affiliateCode) {
    try {
      const resp = await getLandingAffiliateScoreCard(affiliateCode)
      if (resp?.data?.length) {
        const tempItem = getDefaultData()
        resp.data.forEach((obj) => {
          const { upto } = obj
          const item = obj?.landingSustainabiltyAffiliates[0] || null
          if (item) {
            tempItem[upto] = itemToData(item, data, isPlant)
          }
        })
        updateDataStore(affiliateCode, resp.data, dataStore, setDataStore)
        updateFinalData(tempItem)
      }
    } finally {
      setIsLoading(false)
    }
  }
  function getDefaultData() {
    return {
      ...defaultData,
    }
  }
  function updateFinalData(tempItem) {
    setFinalData((prev) => ({
      ...prev,
      [plant]: tempItem,
    }))
  }
  const refreshPredictedData = async () => {
    if (!Object.keys(predictedDataStore).includes(data.plantName)) {
      setIsPredictedLoading({
        yesterday: 0,
        today: 0,
        month: 0,
        year: 0,
      })
      setPredictedData([])
      const keyArr = ['today', 'yesterday', 'month', 'year']
      let tempScoreCardData = {}
      for (let element of keyArr) {
        const keyName = `${data.affiliateCode}|${data.plantName}|${element}`
        const obj = await getScorecardPlantData(
          data.affiliateCode,
          data.plantName,
          element,
        )
        tempScoreCardData = {
          ...tempScoreCardData,
          [keyName]: {
            data: obj?.data?.data,
          },
        }
        if (obj) {
          const data = obj?.data?.data ? obj?.data?.data : []
          plantDataToPredictedData(
            data,
            element,
            data.plantName,
            setIsPredictedLoading,
            setPredictedDataStore,
            setPredictedData,
          )
        }
      }
      setScorcardAtomData({
        ...scorecardAtomData,
        ...tempScoreCardData,
        [`${data.plantName}_expiry`]: Date.now() + APP_CONFIG.CACHE_TIME_LIMIT,
      })
    } else if (Object.keys(predictedDataStore).includes(data.plantName)) {
      setIsPredictedLoading({
        yesterday: 1,
        today: 1,
        month: 1,
        year: 1,
      })
      setPredictedData(predictedDataStore[data.plantName])
    }
  }
  const processScorecardData = async (
    affiliateCode,
    plantNameKey,
    element,
    timeToExpire,
    tempScoreCardData,
  ) => {
    const keyName = `${affiliateCode}|${plantNameKey}|${element}`
    let obj = scorecardAtomData[keyName]?.data || {}
    if (obj && timeToExpire > APP_CONFIG.CACHE_REFRESH_MIN_DURATION) {
      plantDataToPredictedData(
        obj,
        element,
        plantNameKey,
        setIsPredictedLoading,
        setPredictedDataStore,
        setPredictedData,
      )
    } else {
      await getAndProcessScorecardData(
        affiliateCode,
        plantNameKey,
        element,
        keyName,
        tempScoreCardData,
      )
    }
  }
  const getAndProcessScorecardData = async (
    affiliateCode,
    plantNameKey,
    element,
    keyName,
    tempScoreCardData,
  ) => {
    const obj = await getScorecardPlantData(
      affiliateCode,
      plantNameKey,
      element,
    )
    if (obj) {
      const newData = obj?.data?.data || []
      plantDataToPredictedData(
        newData,
        element,
        plantNameKey,
        setIsPredictedLoading,
        setPredictedDataStore,
        setPredictedData,
      )
      tempScoreCardData[keyName] = {
        data: obj?.data?.data || [],
      }
    }
    return obj
  }
  const processPredictedData = async () => {
    const plantNameKey = data.plantName
    if (!Object.keys(predictedDataStore).includes(plantNameKey)) {
      setIsPredictedLoading({
        yesterday: 0,
        today: 0,
        month: 0,
        year: 0,
      })
      setPredictedData([])
      const keyArr = ['today', 'yesterday', 'month', 'year']
      let tempScoreCardData = {}
      const expiryKeyName = `${plantNameKey}_expiry`
      const expiryData = scorecardAtomData[expiryKeyName]
      const timestamp = Date.now()
      const timeToExpire = parseInt(expiryData) - timestamp
      for (let element of keyArr) {
        await processScorecardData(
          data.affiliateCode,
          plantNameKey,
          element,
          timeToExpire,
          tempScoreCardData,
        )
      }
      setScorcardAtomData({
        ...scorecardAtomData,
        ...tempScoreCardData,
        [expiryKeyName]: timestamp + APP_CONFIG.CACHE_TIME_LIMIT,
      })
    } else {
      setIsPredictedLoading({
        yesterday: 1,
        today: 1,
        month: 1,
        year: 1,
      })
      setPredictedData(predictedDataStore[plantNameKey])
    }
  }
  useEffect(() => {
    const interval = setInterval(() => {
      const keyName = `${data.plantName}_expiry`
      const expiryData = scorecardAtomData[keyName]
      if (expiryData) {
        const timestamp = Date.now()
        const timeToExpire = parseInt(expiryData) - parseInt(timestamp)
        if (timeToExpire <= APP_CONFIG.CACHE_REFRESH_MIN_DURATION) {
          refreshPredictedData()
        }
      }
    }, SUSTAINABILITY_SCORECARD.REFRESH_DATA)
    return () => clearInterval(interval)
  }, [scorecardAtomData])
  useEffect(() => {
    if (
      data &&
      Object.keys(data).length > 0 &&
      affiliateCode &&
      !data.affiliateCode
    ) {
      setSustainabilityScorecardData({
        ...data,
        affiliateCode,
      })
    }
    if (data?.affiliateCode) {
      setIsLoading((p) => true)
      processCumulativeData()
      if (isPlant) {
        setLoadingPlantData(true)
      }
    }
  }, [JSON.stringify(data)])
  useEffect(() => {
    if (loadingPlantData) {
      processPredictedData()
      setLoadingPlantData(false)
    }
  }, [loadingPlantData, scorecardAtomData])
  const PredictedHeader = ['CUMULATIVE OPPORTUNITIES', 'ACTUAL']
  function renderCumulativeOpportunities(key = 'today', decimalNum = 1) {
    let scoreData = []
    if (finalData[plant] && Object.keys(finalData[plant]).includes(key)) {
      scoreData = finalData[plant][key]
    } else {
      scoreData = finalData.default[key]
    }
    let isTableVisible = false
    if (data?.affiliateName || data?.affiliateCode) {
      isTableVisible = true
    }
    return (
      <div
        id={source == 'plant' ? 'plant-cumulative-oppo' : 'aff-cumulative-oppo'}
        className=''
        style={{
          marginTop: '2%',
        }}
        data-static-id='SustainabilityScorecard.js_div_19b3c2'
      >
        {isTableVisible && (
          <ScoreBoardTable
            columns={PredictedHeader}
            data={scoreData}
            decimalNum={decimalNum}
          />
        )}
        {!isTableVisible && (
          <p
            className='text-14-regular text-center d-flex align-items-end mb-0 mt-2 h-100'
            data-static-id='SustainabilityScorecard.js_p_023a9d'
          >
            PLEASE SELECT A PLANT/AFFILIATE TO VIEW DETAILS..
          </p>
        )}
      </div>
    )
  }
  function renderPredictedOpportunities(key = 'today', decimalNum = 1) {
    let isVisible = true
    if (
      Object.keys(isPredictedLoading).includes(key) &&
      isPredictedLoading[key] == 0
    ) {
      isVisible = false
    }
    return (
      <>
        {!isVisible && <Loader />}
        {isVisible && isPlant && (
          <>
            <div
              id='plant-performance-kpis'
              style={{
                height: 'calc(100% - 44% - 2vmin)',
                marginTop: '1%',
              }}
              data-static-id='SustainabilityScorecard.js_div_9888da'
            >
              <ScoreBoardTable
                isPlan={true}
                columns={['PERFORMANCE KPIs', 'ACTUAL', 'PLAN']}
                data={predictedData[key] || []}
                decimalNum={decimalNum}
              />
            </div>
          </>
        )}
      </>
    )
  }
  return (
    <div
      className='w-100 h-100'
      data-static-id='SustainabilityScorecard.js_div_0dca32'
    >
      <div
        className={`hideGlobally headerVisible ${styles.paraDiv} w-100`}
        data-static-id='SustainabilityScorecard.js_div_83e63f'
      >
        <p
          className='text-14-bold mb-0'
          data-static-id='SustainabilityScorecard.js_p_322e90'
        >
          {data?.affiliateName?.toUpperCase()}{' '}
          {data?.plantName && data?.plantName?.toUpperCase()}
        </p>
      </div>
      <div
        id='plant-scorecard'
        className={`${styles.sustainabilityCardTabs} sutanibilityCardTabsHeight w-100 d-flex flex-column justify-content-around`}
        data-static-id='SustainabilityScorecard.js_div_6bec44'
      >
        {isLoading && <Loader />}
        {!isLoading && (
          <Tabs
            id='aff-cumulative-oppo-change-days'
            defaultActiveKey='yesterday'
            onSelect={(eventKey) =>
              TRACKEVENTOBJ.sustainabilityScorecard.onSelectTab(
                screen,
                eventKey,
                {
                  params,
                  caseData,
                },
              )
            }
            data-static-id='SustainabilityScorecard.js_Tabs_63edd1'
          >
            <Tab
              eventKey='yesterday'
              title='YESTERDAY'
              data-static-id='SustainabilityScorecard.js_Tab_dd860c'
            >
              <p
                className='text-11-regular text_primary_gray_2 mt-1 mb-0 text-uppercase'
                style={{
                  height: '3vmin',
                }}
                data-static-id='SustainabilityScorecard.js_p_415fa6'
              >
                DATA REPRESENTS AGGREGATED VALUE OF{' '}
                <span
                  className={`${styles.text_primary_blue}`}
                  data-static-id='SustainabilityScorecard.js_span_3d1287'
                >
                  YESTERDAY
                </span>{' '}
                ({moment().subtract(1, 'd').format('DD MMM')} 00:00 -{' '}
                {moment().format('DD MMM')} 00:00).
              </p>
              <div
                className={`${styles.ScoreBoard_table_spacing}`}
                data-static-id='SustainabilityScorecard.js_div_377217'
              >
                {renderCumulativeOpportunities('yesterday')}
                {renderPredictedOpportunities('yesterday')}
              </div>
            </Tab>
            <Tab
              eventKey='today'
              title='TODAY'
              data-static-id='SustainabilityScorecard.js_Tab_4cdadc'
            >
              <p
                className='text-11-regular text_primary_gray_2 mt-1 mb-0 text-uppercase'
                style={{
                  height: '3vmin',
                }}
                data-static-id='SustainabilityScorecard.js_p_c1c0dc'
              >
                data represents aggregated values of{' '}
                <span
                  className={`${styles.text_primary_blue}`}
                  data-static-id='SustainabilityScorecard.js_span_347957'
                >
                  today
                </span>{' '}
                ({moment().format('DD MMM')} 00:00 - {moment().format('hh')}:00{' '}
                {moment().format('A')})
              </p>
              <div
                className={`${styles.ScoreBoard_table_spacing}`}
                data-static-id='SustainabilityScorecard.js_div_269768'
              >
                {renderCumulativeOpportunities('today')}
                {renderPredictedOpportunities('today')}
              </div>
            </Tab>
            <Tab
              eventKey='month'
              title='MONTH'
              data-static-id='SustainabilityScorecard.js_Tab_ca2c42'
            >
              <p
                className='text-11-regular text_primary_gray_2 mt-1  mb-0 text-uppercase'
                style={{
                  height: '3vmin',
                }}
                data-static-id='SustainabilityScorecard.js_p_38e4e7'
              >
                DATA REPRESENTS AGGREGATED VALUES OF CURRENT{' '}
                <span
                  className={`${styles.text_primary_blue}`}
                  data-static-id='SustainabilityScorecard.js_span_f86055'
                >
                  MONTH TO DATE
                </span>{' '}
                (01 {moment().format('MMM')} 00:00 - {moment().format('DD MMM')}{' '}
                {moment().format('hh')}:00 {moment().format('A')})
              </p>
              <div
                className={`${styles.ScoreBoard_table_spacing}`}
                data-static-id='SustainabilityScorecard.js_div_c3defa'
              >
                {renderCumulativeOpportunities('month', 0)}
                {renderPredictedOpportunities('month', 0)}
              </div>
            </Tab>
            <Tab
              eventKey='year'
              title='YEAR'
              data-static-id='SustainabilityScorecard.js_Tab_3b4e2c'
            >
              <p
                className='text-11-regular text_primary_gray_2 mt-1  mb-0 text-uppercase'
                style={{
                  height: '3vmin',
                }}
                data-static-id='SustainabilityScorecard.js_p_f1159e'
              >
                DATA REPRESENTS AGGREGATED VALUES OF CURRENT{' '}
                <span
                  className={`${styles.text_primary_blue}`}
                  data-static-id='SustainabilityScorecard.js_span_d78932'
                >
                  YEAR TO DATE
                </span>{' '}
                (01 JAN {moment().format('YYYY')} -{' '}
                {moment().format('DD MMM YYYY')}).
              </p>
              <div
                className={`${styles.ScoreBoard_table_spacing}`}
                data-static-id='SustainabilityScorecard.js_div_99f6be'
              >
                {renderCumulativeOpportunities('year', 0)}
                {renderPredictedOpportunities('year', 0)}
              </div>
            </Tab>
          </Tabs>
        )}
        <span
          className='text-11-regular text_primary_gray_2 d-flex align-items-end'
          data-static-id='SustainabilityScorecard.js_span_4737fb'
        >
          * MODELS HAVE NOT RUN FOR THE SELECTED PERIOD.
        </span>
      </div>
    </div>
  )
}
