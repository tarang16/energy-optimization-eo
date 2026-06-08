import { pdf } from '@react-pdf/renderer'
import calenderImg from 'assets/sabic_new_icons/calendar_icon.svg'
import { AppAtom } from 'atoms/AppAtom'
import Loader from 'components/ui/loader/Loader'
import { toPng } from 'html-to-image'
import { useAtomValue } from 'jotai'
import moment from 'moment'
import { forwardRef, memo, useEffect, useRef, useState } from 'react'
import DatePicker from 'react-datepicker'
import { useOutletContext, useParams } from 'react-router-dom'
import { getAlertStatisticsByCaseIdList } from 'services/AlertStaticsSerives'
import { getKSAMoment, showToast } from 'utills/utilities'
import AlertCards from './AlertCards'
import AlertStatistics, { getFetchDataAndTableOrder } from './AlertStatistics'
import { alertTypes } from './AlertStatistics.functions'
import styles from './AlertStatus.module.scss'
import AlertStatus_Chart from './AlertStatus_Chart'
import ReportDocument from './download_report/ReportDocument'
import MutedAlerts from './MutedAlerts'
import TotalAlertStatistics from './TotalAlertStatistics'
const CustomInput = memo(
  forwardRef(({ onClick, selectedDate }, ref) => {
    return (
      <button
        onClick={onClick}
        ref={ref}
        className={`${styles.datepickerStyle} text-14-regular`}
        // style={{ borderWidth: "1px", borderColor: "red" }}
        data-static-id='AlertStatisticsModal.js_button_ebc6c7'
      >
        <span data-static-id='AlertStatisticsModal.js_span_46411c'>
          {' '}
          {moment(selectedDate)?.local()?.format('DD-MMM-YYYY')?.toUpperCase()}
        </span>
        <img
          src={calenderImg}
          alt='calendar'
          data-static-id='AlertStatisticsModal.js_img_1593fe'
        />
      </button>
    )
  }),
)
export default function AlertStatisticsModal({ tabName = '' }) {
  const params = useParams()
  const { caseId } = useOutletContext() ?? {}
  const [APIResponse, setAPIResponse] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [refresh, setRefresh] = useState(false)
  const ctxData = useAtomValue(AppAtom)
  const [startDate, setStartDate] = useState(moment().startOf('year').toDate())
  const caseData = ctxData?.caseData || []
  const maxDate = moment().toDate()
  const [downloadLoading, setDownloadLoading] = useState(false)
  const alertStatsRef = useRef(null)
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        const formatedStartDate = getKSAMoment(
          moment(startDate).format('YYYY-MM-DD 00:00:00'),
        )
        const resp = await getAlertStatisticsByCaseIdList(
          caseId,
          formatedStartDate,
        )
        if (resp?.statuscode === 200) {
          setAPIResponse(resp?.data ?? [])
        } else {
          setAPIResponse([])
        }
        setIsLoading(false)
      } catch (error) {
        showToast('error while fetching alert statistics data', error)
        setAPIResponse([])
      }
    }
    if (caseId) {
      fetchData()
    }
  }, [caseId, refresh, startDate])
  const handleChange = (date) => {
    setStartDate(date)
  }
  const handleReportDownload = async () => {
    try {
      setDownloadLoading(true)
      const dataUrl = await toPng(alertStatsRef.current, {
        quality: 1,
        pixelRatio: 2,
        backgroundColor: '#fff',
        style: {
          transform: 'none',
          opacity: '1',
        },
      })
      const sTime = startDate
        ? getKSAMoment(moment(startDate).format('YYYY-MM-DD 00:00:00'))
        : ''
      const allAlertTypesAPIResp = await Promise.all(
        alertTypes.map((alertType) => {
          const { fetchData, status } = getFetchDataAndTableOrder(alertType)
          return fetchData(caseId, sTime, status)
        }),
      )
      const tablesData = allAlertTypesAPIResp.map((data, index) => ({
        key: alertTypes[index],
        data: data,
      }))
      const blob = await pdf(
        <ReportDocument imageData={dataUrl} tablesData={tablesData} />,
      ).toBlob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'AlertStatisticsReport.pdf'
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
    } catch (error) {
      window.alert('Failed to download')
      console.log(error)
    } finally {
      setDownloadLoading(false)
    }
  }
  return (
    <div
      className={`w-100 h-100 ${styles.alertStatusContainer}`}
      ref={alertStatsRef}
      data-static-id='AlertStatisticsModal.js_div_af6b99'
    >
      <div
        className={`${styles.alertStatusTopContainer}`}
        data-static-id='AlertStatisticsModal.js_div_cf7132'
      >
        <div
          className={`h-100 ${styles.topContainer}`}
          data-static-id='AlertStatisticsModal.js_div_d3421f'
        >
          <div
            className={`${styles.leftDateContainer} d-flex align-items-stretch justify-content-center`}
            data-static-id='AlertStatisticsModal.js_div_3df258'
          >
            <div
              className={`${styles.formDateWrapper} h-auto d-flex align-items-center`}
              data-static-id='AlertStatisticsModal.js_div_6fa569'
            >
              <span
                className={`text-14-bold text-uppercase mt_03 me-1`}
                data-static-id='AlertStatisticsModal.js_span_147a22'
              >
                From :
              </span>
              <DatePicker
                selected={startDate}
                onChange={handleChange}
                customInput={<CustomInput selectedDate={startDate} />}
                maxDate={maxDate}
              />
            </div>
            <div
              className='h-auto d-flex align-items-center'
              data-static-id='AlertStatisticsModal.js_div_4040f0'
            >
              <span
                className={`text-14-bold text-uppercase mt_03 me-1`}
                data-static-id='AlertStatisticsModal.js_span_b64285'
              >
                To :{' '}
              </span>
              <button
                className={`h-100 text-uppercase ${styles.presentbutton}  text-14-regular`}
                disabled
                data-static-id='AlertStatisticsModal.js_button_43239b'
              >
                present
              </button>
            </div>
          </div>

          <div
            className='d-flex align-items-center justify-content-end h-100'
            data-static-id='AlertStatisticsModal.js_div_7ebdbb'
          >
            <div
              className={`${styles.muteAlertContainer} h-100 d-flex`}
              data-static-id='AlertStatisticsModal.js_div_a5811e'
            >
              <button
                onClick={handleReportDownload}
                className={`text-14-regular  ${styles.submitButton} ${styles.downloadYellowBtn}`}
                disabled={downloadLoading}
                data-static-id='AlertStatisticsModal.js_button_869564'
              >
                <span
                  className='mt_03 text_primary_black text-uppercase  d-inline-block'
                  data-static-id='AlertStatisticsModal.js_span_04890d'
                >
                  {downloadLoading ? 'Downloading...' : 'Download Report'}
                </span>
              </button>
              <MutedAlerts caseId={caseId} />
            </div>
          </div>
        </div>
      </div>
      <div
        className={`${styles.alertStatusButtomContainer}`}
        data-static-id='AlertStatisticsModal.js_div_96381f'
      >
        <div
          className={`${styles.alertStatusButtomContainer__left} h-100 w-50`}
          data-static-id='AlertStatisticsModal.js_div_6b06c3'
        >
          {isLoading ? (
            <Loader />
          ) : (
            <>
              <div
                className={`${styles.alertStatusButtomContainer__left__top} w-100 `}
                data-static-id='AlertStatisticsModal.js_div_184a83'
              >
                <TotalAlertStatistics
                  APIResponse={APIResponse}
                  caseData={caseData}
                  params={params}
                  caseIdList={caseId}
                  startDate={startDate}
                />
              </div>
              <div
                className={`${styles.alertStatusButtomContainer__left__middle}  w-100 `}
                data-static-id='AlertStatisticsModal.js_div_8a2c2b'
              >
                <div
                  className={`d-flex h-100 ${styles.cardContainer}`}
                  data-static-id='AlertStatisticsModal.js_div_5914f3'
                >
                  <div
                    className={`${styles.cardContainer__left}`}
                    data-static-id='AlertStatisticsModal.js_div_be6b40'
                  >
                    <AlertStatistics
                      APIResponse={APIResponse}
                      template={'active_alert_card_template'}
                      showModal={true}
                      caseIdList={caseId}
                      setRefresh={setRefresh}
                      tabName={tabName}
                      startDate={moment(startDate).format(
                        'YYYY-MM-DD 00:00:00',
                      )}
                    />
                  </div>
                  <div
                    className={`${styles.cardContainer__right}`}
                    data-static-id='AlertStatisticsModal.js_div_871536'
                  >
                    <AlertStatistics
                      APIResponse={APIResponse}
                      template={'closed_alert_card_template'}
                      showModal={true}
                      caseIdList={caseId}
                      setRefresh={setRefresh}
                      tabName={tabName}
                      startDate={moment(startDate).format(
                        'YYYY-MM-DD 00:00:00',
                      )}
                    />
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
        <div
          className={`${styles.divider} h-100`}
          data-static-id='AlertStatisticsModal.js_div_365026'
        ></div>
        <div
          className={`${styles.alertStatusButtomContainer__right} h-100 w-50`}
          data-static-id='AlertStatisticsModal.js_div_216088'
        >
          {isLoading ? (
            <Loader />
          ) : (
            <>
              <div
                className={`${styles.alertStatusButtomContainer__right__top}  w-100`}
                data-static-id='AlertStatisticsModal.js_div_2e2819'
              >
                <AlertStatus_Chart
                  caseIdList={caseId}
                  refresh={refresh}
                  startDate={getKSAMoment(
                    moment(startDate).format('YYYY-MM-DD 00:00:00'),
                  )}
                />
              </div>
              <div
                className={`${styles.alertStatusButtomContainer__right__bottom} w-100`}
                data-static-id='AlertStatisticsModal.js_div_b0888a'
              >
                <AlertCards
                  caseIdList={caseId}
                  refresh={refresh}
                  params={params}
                  caseData={caseData}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
