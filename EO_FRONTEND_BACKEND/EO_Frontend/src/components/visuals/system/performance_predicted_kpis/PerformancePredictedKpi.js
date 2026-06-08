import Loader from 'components/ui/loader/Loader'
import CustomModal from 'components/visuals/common/modal/CustomModal'
import SingleTitleCard from 'components/visuals/common/single_title_card/SingleTitleCard'
import { useEffect, useState } from 'react'
import { getKpiOrderByKey } from 'services/FavoriteService'
import SortingModalIcon from '../../../../assets/sabic_icons/system_pages_top_kpi/Sorting.svg'
import PerformancePredictedKpisCard from '../performance_predicted_kpis_card/PerformancePredictedKpisCard'
import style from './PerformancePredictedKpi.module.scss'
import CardContainer from './SortingModal'
import { getValsBaseOnCondition } from 'utills/utilities'
export default function PerformancePredictedKpi({
  performanceKpis = [],
  predictedKpis,
  isLoading,
  caseId,
  actualTime,
}) {
  const [showModal, setShowModal] = useState(false)
  const [type, setType] = useState('')
  const [overwrittenPerformanceKpiOrder, setOverwrittenPerformanceKpiOrder] =
    useState([])
  const [overwrittenPredictedKpiOrder, setOverwrittenPredictedKpiOrder] =
    useState([])
  const [refetch, setRefetch] = useState(false)
  let widthStyle
  let widthStylePredictedBoxes
  const performanceCount = performanceKpis?.length || 0
  const predictedCount = predictedKpis?.length || 0
  if (!performanceCount && !predictedCount) {
    widthStyle = {
      width: '50%',
    }
  } else if (!performanceCount) {
    widthStyle = {
      width: '0%',
    }
    widthStylePredictedBoxes = 5
  } else if (!predictedCount) {
    widthStyle = {
      width: '100%',
    }
    widthStylePredictedBoxes = 5
  } else {
    let settings
    if (performanceCount > 2) {
      settings = ['60%', '40%', 2]
    } else if (performanceCount === 2) {
      settings = ['40%', '60%', 3]
    } else {
      settings = ['20%', '80%', 4]
    }
    widthStyle = {
      width: settings[0],
    }
    widthStylePredictedBoxes = settings[2]
  }
  const getKpiSortingOrderData = async () => {
    const res = await getKpiOrderByKey(caseId)
    if (res?.data?.length) {
      const performanceKpiObj = res?.data?.find(
        (x) => x.preferences.parameter === 'performance_kpi',
      )
      const predictedKpiObj = res?.data?.find(
        (x) => x.preferences.parameter === 'predicted_kpi',
      )
      if (performanceKpiObj?.preferences?.data?.length) {
        let zippedData = {}
        performanceKpiObj.preferences?.data.forEach((kpi) => {
          zippedData = {
            ...zippedData,
            [`${kpi.kpi}`]: kpi,
          }
        })
        setOverwrittenPerformanceKpiOrder(zippedData)
      }
      if (predictedKpiObj?.preferences?.data?.length) {
        let zippedData = {}
        predictedKpiObj.preferences?.data.forEach((kpi) => {
          zippedData = {
            ...zippedData,
            [`${kpi.kpi}`]: kpi,
          }
        })
        setOverwrittenPredictedKpiOrder(zippedData)
      }
      setRefetch(false)
    }
  }
  useEffect(() => {
    getKpiSortingOrderData()
  }, [caseId])
  useEffect(() => {
    if (refetch) {
      getKpiSortingOrderData()
    }
  }, [refetch])
  const overWrittenObject = getValsBaseOnCondition(
    type === 'predicted',
    overwrittenPredictedKpiOrder,
    overwrittenPerformanceKpiOrder,
  )
  return (
    <>
      <CustomModal
        show={showModal}
        title={`SORTING CONFIGURATION - ${type.toUpperCase()} KPI`}
        hideModal={() => {
          setType('')
          setShowModal(false)
        }}
        contentFitWidth={getValsBaseOnCondition(
          type === 'predicted',
          style.predictedKpiWidth,
          style.performanceKpiWidth,
        )}
      >
        <CardContainer
          caseId={caseId}
          actualTime={actualTime}
          data={(type === 'predicted' ? predictedKpis : performanceKpis)
            .map((x, index) => ({
              ...x,
              id: index + 1,
              kpiSortID: overWrittenObject[x.tagName]?.order ?? x.kpiSortID,
            }))
            .sort((a, b) => a.kpiSortID - b.kpiSortID)}
          originalData={(type === 'predicted' ? predictedKpis : performanceKpis)
            .map((x, index) => ({
              ...x,
              id: index + 1,
            }))
            .sort((a, b) => a.kpiSortID - b.kpiSortID)}
          isPerformance={type === 'performance'}
          setShowModal={setShowModal}
          setType={setType}
          type={type}
          setRefetch={setRefetch}
        />
      </CustomModal>
      <div
        className={style.performance_predicted_card}
        data-static-id='PerformancePredictedKpi.js_div_749d68'
      >
        <div
          className='h-100 d-flex'
          data-static-id='PerformancePredictedKpi.js_div_d3f921'
        >
          <div
            id='performance-kpis'
            className={' h-100'}
            style={widthStyle}
            data-static-id='PerformancePredictedKpi.js_div_957238'
          >
            <SingleTitleCard
              title={'PERFORMANCE KPIs'}
              shadow={false}
              extraClasses={`m-0 h-100 overflow-hidden ${style.visibelSortModal_Performancebtn}`}
              RightHtml={
                <button
                  className={`${style.SortingModal_btn}`}
                  data-testid='sortingModalPerformance_btn'
                  onClick={() => {
                    setType('performance')
                    setShowModal(true)
                  }}
                  data-static-id='PerformancePredictedKpi.js_button_2d4af5'
                >
                  <img
                    alt=''
                    src={SortingModalIcon}
                    data-static-id='PerformancePredictedKpi.js_img_02cac5'
                  />
                </button>
              }
            >
              {isLoading ? (
                <Loader />
              ) : (
                <PerformancePredictedKpisCard
                  caseId={caseId}
                  actualTime={actualTime}
                  data={performanceKpis.map((x) => ({
                    ...x,
                    kpiSortID:
                      overwrittenPerformanceKpiOrder[x.tagName]?.order ??
                      x.kpiSortID,
                  }))}
                  isPerformance
                  maxBoxesInRow={widthStylePredictedBoxes ?? 1}
                />
              )}
            </SingleTitleCard>
          </div>
        </div>
      </div>
    </>
  )
}
