import { useEffect, useState } from 'react'
import styles from './ValueCapture.module.scss'
import moment from 'moment-timezone'
import DateRangeContainer from 'components/visuals/date_range_container/DateRangeContainer'
import Loader from 'components/ui/loader/Loader'
import { useParams } from 'react-router'
import { getPlantIdByName, showToast, slugToText } from 'utills/utilities'
import CustomModal from 'components/visuals/common/modal/CustomModal'
import BarChartVC from 'components/visuals/charts/bar_chart/bar_chart_vc'
import { Tooltip } from 'react-tooltip'
import systemIcon from '../../../assets/sabic_new_icons/system_color_icon.svg'
import energyIcon from '../../../assets/sabic_new_icons/energyProduction_color_icon.svg'
import { renderTable } from './ValueCapture.function'
export function canAccessVC(params, token) {
  const plantId = getPlantIdByName(
    slugToText(params?.plant),
    slugToText(params?.affiliate),
  )
  if (plantId) {
    return token?.canAccessVc(plantId?.plant_id)
  } else {
    return false
  }
}
export function calculateSumOfVals(val1, val2) {
  if (val1 && val2) {
    val1 = parseFloat(val1)
    val2 = parseFloat(val2)
    if (isNaN(val1) || isNaN(val2)) {
      return val1 || val2 || null
    } else {
      return parseFloat(val1 + val2)
    }
  } else {
    return null
  }
}
export default function ValueCapture({ tabName = '' }) {
  const [dateRange, setDateRange] = useState([
    moment().subtract('3', 'months'),
    moment(),
  ])
  const [isLoading, setIsLoading] = useState(true)
  const [isTrendLoading, setIsTrendLoading] = useState(true)
  const [isInitial, setIsInitial] = useState(true)
  const params = useParams()
  const [timeSeriesData, setTimeSeriesData] = useState({
    energy: [],
  })
  const [respData, setRespData] = useState([])
  const [showTrendModal, setShowTrendModal] = useState(false)
  const [caseMstData, setCaseMstData] = useState([])
  const [isEditable, setIsEditable] = useState(false)
  useEffect(() => {
    if (!isInitial) fetchData()
  }, [dateRange])
  useEffect(() => {
    setIsEditable(true)
    fetchData()
    setIsInitial(false)
  }, [])
  async function fetchData() {
    setIsLoading(true)
    try {
      const dummyResp = {
        data: [
          {
            caseid: 'C001',
            caseName: 'United',
          },
        ],
      }
      if (dummyResp?.data?.length > 0) {
        setRespData(dummyResp.data)
      } else {
        setRespData([])
      }
    } catch (e) {
      showToast('Error in dummy fetch:', e)
      setRespData([])
    } finally {
      setIsLoading(false)
    }
    setCaseMstData([
      {
        caseId: 'C001',
        category: 'energy',
      },
      {
        caseId: 'C002',
        category: 'energy',
      },
    ])
  }
  async function handleTrendIconClick() {
    setShowTrendModal(true)
    setIsTrendLoading(true)
    const dummySeries = [
      {
        timestamp: '2024-01',
        value: 100,
      },
      {
        timestamp: '2024-02',
        value: 150,
      },
      {
        timestamp: '2024-03',
        value: 130,
      },
    ]
    setTimeSeriesData({
      energy: dummySeries,
    })
    setIsTrendLoading(false)
  }
  function renderModalContent() {
    if (isTrendLoading) return <Loader />
    return (
      <div
        className={`${styles.modalBox} w-100 h-100 d-flex flex-column align-items-center justify-content-start`}
        data-static-id='ValueCapture.js_div_213ed9'
      >
        <h1
          className='text-uppercase text-13-bold'
          data-static-id='ValueCapture.js_h1_1ceb21'
        >
          Energy
        </h1>
        <div
          className={`h-100 w-100`}
          data-static-id='ValueCapture.js_div_4541bf'
        >
          <BarChartVC
            data={timeSeriesData?.energy || []}
            type='energy'
            id='vcEnergy'
            exportTitle='BUSINESS IMPACT : ENERGY'
            startDate={dateRange[0]}
            endDate={dateRange[1]}
          />
        </div>
      </div>
    )
  }
  return (
    <div
      className={`${styles.container} d-flex flex-column align-between justify-start`}
      data-static-id='ValueCapture.js_div_6ab45f'
    >
      <div
        className={`${styles.datePickerContainer} d-flex align-items-center justify-content-between`}
        data-static-id='ValueCapture.js_div_7849eb'
      >
        <DateRangeContainer
          screenName={tabName}
          functionalityName='Analysis Home Page'
          sTime={dateRange[0]}
          eTime={dateRange[1]}
          handleDateChange={setDateRange}
        />
      </div>

      <div
        className={`${styles.tableParentContainer}`}
        data-static-id='ValueCapture.js_div_745d16'
      >
        <div
          className={`${styles.tableContainer} w-100`}
          data-static-id='ValueCapture.js_div_7dfbe1'
        >
          <table
            className='w-100'
            data-static-id='ValueCapture.js_table_e248e5'
          >
            <thead data-static-id='ValueCapture.js_thead_123c44'>
              <tr className='h-50' data-static-id='ValueCapture.js_tr_4b63c7'>
                <th
                  rowSpan={2}
                  width='28%'
                  data-static-id='ValueCapture.js_th_922100'
                >
                  <div
                    className='h-100 w-100 d-flex flex-column justify-content-center align-items-center'
                    data-static-id='ValueCapture.js_div_2bc224'
                  >
                    <img
                      src={systemIcon}
                      className={`${styles.rowSpanImg}`}
                      data-static-id='ValueCapture.js_img_bba9a7'
                    />
                    <p
                      className={`text-14-regular mb-0 ${styles.marginTop}`}
                      data-static-id='ValueCapture.js_p_47f010'
                    >
                      Affiliate
                    </p>
                  </div>
                </th>
                <th
                  colSpan={3}
                  className='text-14-regular'
                  width='72%'
                  data-static-id='ValueCapture.js_th_2e5b93'
                >
                  <div
                    className={`d-flex justify-content-center align-items-center w-100 h-100 ${styles.borderBottom}`}
                    data-static-id='ValueCapture.js_div_3164c4'
                  >
                    <img
                      src={energyIcon}
                      className={`${styles.colSpanImg}`}
                      data-static-id='ValueCapture.js_img_06afde'
                    />
                    <p
                      className='mb-0'
                      data-static-id='ValueCapture.js_p_577f67'
                    >
                      Energy (MMBTU)
                    </p>
                  </div>
                </th>
                <th
                  rowSpan={0}
                  className='text-14-regular'
                  width='4%'
                  data-static-id='ValueCapture.js_th_180dea'
                ></th>
                <th
                  rowSpan={0}
                  className='text-14-regular'
                  width='4%'
                  data-static-id='ValueCapture.js_th_403fe8'
                ></th>
              </tr>
              <tr className='h-50' data-static-id='ValueCapture.js_tr_018819'>
                <th
                  className='text-12-regular text-center'
                  data-static-id='ValueCapture.js_th_e98132'
                >
                  VALUE REALIZED
                </th>
                <th
                  className='text-12-regular text-center'
                  data-static-id='ValueCapture.js_th_585c5a'
                >
                  VALUE LOST
                </th>
                <th
                  className='text-12-regular text-center'
                  data-static-id='ValueCapture.js_th_aad79e'
                >
                  TOTAL BUSINESS IMPACT
                </th>
              </tr>
            </thead>
            <tbody data-static-id='ValueCapture.js_tbody_51e4aa'>
              {' '}
              {renderTable({
                respData,
                isLoading,
                handleTrendIconClick,
                params,
                caseMstData,
                isEditable,
              })}
            </tbody>
          </table>

          <CustomModal
            hideModal={() => setShowTrendModal(false)}
            title='BUSINESS IMPACT'
            show={showTrendModal}
          >
            <div
              className='w-100 h-100'
              data-static-id='ValueCapture.js_div_883a89'
            >
              {renderModalContent()}
            </div>
          </CustomModal>

          <Tooltip
            id='view-trend-tooltip'
            className='tooltip_container'
            role='tooltip'
            place='bottom'
            type='light'
            data-static-id='ValueCapture.js_Tooltip_67eb72'
          >
            <span
              className='text-12-regular d-block text-center text-white mt_03'
              data-static-id='ValueCapture.js_span_d1e5db'
            >
              View Trend
            </span>
          </Tooltip>

          <Tooltip
            id='view-case-tooltip'
            className='tooltip_container'
            role='tooltip'
            place='bottom'
            type='light'
            data-static-id='ValueCapture.js_Tooltip_9d80b7'
          >
            <span
              className='text-12-regular d-block text-center text-white mt_03'
              data-static-id='ValueCapture.js_span_0f69c1'
            >
              Analysis
            </span>
          </Tooltip>
        </div>
      </div>
    </div>
  )
}
