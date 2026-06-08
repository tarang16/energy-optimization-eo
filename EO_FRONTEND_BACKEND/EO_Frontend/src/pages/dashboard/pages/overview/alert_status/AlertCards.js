import AutoClosedIcon from 'assets/sabic_icons/alert_status_icon/autoclosed.svg'
import generatedAlertIcon from 'assets/sabic_icons/alert_status_icon/generatedAlert.svg'
import ImplementedIcon from 'assets/sabic_icons/alert_status_icon/implemented.svg'
import overdueIcon from 'assets/sabic_icons/alert_status_icon/overdue.svg'
import PendingIcon from 'assets/sabic_icons/alert_status_icon/pending.svg'
import RejectedIcon from 'assets/sabic_icons/alert_status_icon/rejected.svg'
import workInProgressIcon from 'assets/sabic_icons/alert_status_icon/work_in_progress.svg'
import report_icon from 'assets/sabic_icons/header/ecm_icon.svg'
import downloadIcon from 'assets/sabic_icons/sidebar/download_icon.svg'
import Loader from 'components/ui/loader/Loader'
import { tooltipReducer } from 'components/visuals/dashboard_status_legend/DashboardStatusLegend'
import SingleSelect from 'components/visuals/dropdown/single_select/SingleSelect'
import { TRACKEVENTOBJ } from 'config/ActivityTrackerConfig'
import { useEffect, useReducer, useRef, useState } from 'react'
import { OverlayTrigger } from 'react-bootstrap'
import Tooltip from 'react-bootstrap/Tooltip'
import { getOdsAlertStatisticsUtilizationReport } from 'services/AlertStaticsSerives'
import {
  getKSAMoment,
  getKSAMomentWithTimeAs12,
  handleOutsideClick,
} from 'utills/utilities'
import styles from './AlertCards.module.scss'
import { downloadCSVFile, getMonthYearList } from './AlertStatistics.functions'
const getUtilizationRateToolTip = (props) => (
  <Tooltip
    className='resetWidthmonthlyReportTooltipContainer'
    {...props}
    data-static-id='AlertCards.js_Tooltip_da1bab'
  >
    <div
      className={styles.monthlyReportTooltipContainer}
      data-static-id='AlertCards.js_div_395dbb'
    >
      <p
        className='text-14-regular text_primary_white text-uppercase'
        data-static-id='AlertCards.js_p_e15960'
      >
        Monthly Utilization of alerts is the percentage of utilized alerts{' '}
        <span
          className='text-14-bold text_primary_white text-uppercase'
          data-static-id='AlertCards.js_span_8418a0'
        >
          ( Implemented, Rejected , In-progress)
        </span>{' '}
        over the total generated alerts (excluding Pending and Auto Closed) for
        the selected month.
      </p>
      <div
        className={`d-flex  ${styles.formulaContainer} mt-4`}
        data-static-id='AlertCards.js_div_6a4ae7'
      >
        <div
          className={styles.leftLabelContainer}
          data-static-id='AlertCards.js_div_940677'
        >
          <p
            className={`text_primary_white text-14-bold ${styles.labelText}`}
            data-static-id='AlertCards.js_p_d90d0b'
          >
            UTILIZATION RATE{' '}
            <span
              className='text_primary_white text-14-bold ms-1'
              data-static-id='AlertCards.js_span_b16751'
            >
              ( % )
            </span>
            <span
              className='text_primary_white text-14-bold ms-2'
              data-static-id='AlertCards.js_span_a40efb'
            >
              :
            </span>
          </p>
        </div>
        <div
          className={`${styles.rightFormulaContainer} d-flex align-items-center`}
          data-static-id='AlertCards.js_div_abaf65'
        >
          <div
            className={`${styles.wrapperContainer} h-100`}
            data-static-id='AlertCards.js_div_cc4fcf'
          >
            <div
              className={`${styles.ndContainer} h-100`}
              data-static-id='AlertCards.js_div_a1d5ab'
            >
              <p
                className={`text_primary_white text-14-regular text-uppercase d-flex align-items-end h-50 pb-2 ${styles.topText}`}
                data-static-id='AlertCards.js_p_eae4dd'
              >
                Total count of alerts that were Implemented + Rejected + In
                Progress ( Alerts generated during the selected month)
              </p>
              <div
                className={styles.divider}
                data-static-id='AlertCards.js_div_5e3eae'
              ></div>
              <p
                className={`text_primary_white text-14-regular text-uppercase h-50 pt-2 ${styles.buttomText}`}
                data-static-id='AlertCards.js_p_3ff7d7'
              >
                Total alerts generated during the selected month (excluding
                pending and auto-closed alerts)
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Tooltip>
)
const getDownloadToolTip = (props) => (
  <Tooltip {...props} data-static-id='AlertCards.js_Tooltip_2e3a7d'>
    <div
      className='text-14-regular text-uppercase text-white p-1'
      data-static-id='AlertCards.js_div_67090d'
    >
      Download
    </div>
  </Tooltip>
)
const AlertCards = ({ caseIdList, refresh, params, caseData }) => {
  const [utilizationReport, setUtilizationReport] = useState({})
  const [dropDownData, setDropDownData] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const ref = useRef(null)
  const [reportTooltipState, reportTooltipDispatch] = useReducer(
    tooltipReducer,
    {
      hover: false,
      click: false,
    },
  )

  /* istanbul ignore next */
  useEffect(() => {
    window.addEventListener('mousedown', (ev) =>
      handleOutsideClick(ev, ref, (isInside) => {
        reportTooltipDispatch({
          type: 'click',
          value: isInside,
        })
      }),
    )
    return () => {
      window.removeEventListener('mousedown', (ev) =>
        handleOutsideClick(ev, ref, (isInside) =>
          reportTooltipDispatch({
            type: 'click',
            value: isInside,
          }),
        ),
      )
    }
  }, [ref])
  useEffect(() => {
    let isMounted = true
    const fetchUtilizationReport = async () => {
      if (caseIdList) {
        setIsLoading(true)
        const today = new Date()
        const currentMonthLastDate = new Date(
          today.getFullYear(),
          today.getMonth() + 1,
          0,
        )
        const KSALastDate = getKSAMomentWithTimeAs12(currentMonthLastDate)
        const tempUtilizationReport =
          await getOdsAlertStatisticsUtilizationReport(KSALastDate, caseIdList)
        if (isMounted) {
          if (tempUtilizationReport?.error) {
            console.error('Error:', tempUtilizationReport.error)
          } else {
            setUtilizationReport(tempUtilizationReport?.data)
          }
          const tempDropDownData = getMonthYearList()
          setDropDownData(tempDropDownData)
          setIsLoading(false)
        }
      }
    }
    fetchUtilizationReport()
    return () => {
      isMounted = false
    }
  }, [caseIdList, refresh])
  const handleMonthChange = async (selectedMonth) => {
    TRACKEVENTOBJ.AlertStatistics.onMonthChange({
      tagName: selectedMonth?.tag_name,
      params: params,
      caseData: caseData,
    })
    setIsLoading(true)
    const date = selectedMonth?.lastDayOfMonth
    const tempUtilizationReport = await getOdsAlertStatisticsUtilizationReport(
      getKSAMoment(date),
      caseIdList,
    )
    if (tempUtilizationReport?.error) {
      console.error('Error:', tempUtilizationReport?.error)
    } else {
      setUtilizationReport(tempUtilizationReport?.data)
    }
    setIsLoading(false)
  }
  const renderClosedByTeam = () => (
    <div
      className={`${styles.bottomContainer__left} h-100`}
      data-static-id='AlertCards.js_div_124387'
    >
      <div
        className={styles.headerContainer}
        data-static-id='AlertCards.js_div_31b861'
      >
        <h4
          className={`${styles.headerText} mt_03 line_height_12_per mb-0 text-12-bold letter_spacing09`}
          data-static-id='AlertCards.js_h4_246eac'
        >
          CLOSED BY TEAM
        </h4>
      </div>
      <div
        className={`${styles.bodyContainer}`}
        data-static-id='AlertCards.js_div_25b4bb'
      >
        <div
          className={`${styles.topContainer} d-flex`}
          data-static-id='AlertCards.js_div_ef7817'
        >
          <div
            className={`${styles.leftContainer} w-50 h-100 d-flex align-items-center justify-content-start`}
            data-static-id='AlertCards.js_div_574849'
          >
            <img
              src={ImplementedIcon}
              className={styles.ImplementedIcon}
              data-static-id='AlertCards.js_img_73208e'
            />
            <div
              className={`${styles.rightLeftContainerContent}`}
              data-static-id='AlertCards.js_div_f2c8d1'
            >
              <p
                className={`text-14-regular mb-0  line_height_12_per`}
                data-static-id='AlertCards.js_p_185164'
              >
                IMPLEMENTED
              </p>
              <p
                className={`text-20-bold 
                text_primary_blue text-center mt_03 line_height_12_per`}
                data-static-id='AlertCards.js_p_919812'
              >
                {utilizationReport?.closedImplemented}
              </p>
            </div>
          </div>
          <div
            className={styles.divider}
            data-static-id='AlertCards.js_div_896ad5'
          ></div>
          <div
            className={`${styles.rightContainer} w-50 h-100 d-flex align-items-center`}
            data-static-id='AlertCards.js_div_d2cb29'
          >
            <img
              src={RejectedIcon}
              className={styles.ImplementedIcon}
              data-static-id='AlertCards.js_img_daf774'
            />
            <div
              className={`${styles.rightLeftContainerContent}`}
              data-static-id='AlertCards.js_div_ea0628'
            >
              <p
                className={`text-14-regular mb-0  line_height_12_per`}
                data-static-id='AlertCards.js_p_773103'
              >
                REJECTED
              </p>
              <p
                className={`text-20-bold mb-0 text_primary_blue text-center mt_03 line_height_12_per`}
                data-static-id='AlertCards.js_p_e65f09'
              >
                {utilizationReport?.closedRejected}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
  const renderUtilizationRate = () => (
    <div
      className={`${styles.utilizationRateContainer} d-flex align-items-center justify-content-evenly flex-nowrap`}
      data-static-id='AlertCards.js_div_20b964'
    >
      <div
        className={`d-flex flex-grow-1 flex-shrink-0 w-50 align-items-center justify-content-center`}
        data-static-id='AlertCards.js_div_5ca3e4'
      >
        <p
          className={`text-14-regular mb-0 mt_03 line_height_12_per letter_spacing09`}
          data-static-id='AlertCards.js_p_8fb0a8'
        >
          ALERT UTILIZATION RATE
        </p>
        <p
          className={`text-20-regular mb-0 text_primary_blue ms-2 mt_03 line_height_12_per`}
          data-static-id='AlertCards.js_p_c86c79'
        >
          {utilizationReport?.utilizationRate}%
        </p>
      </div>

      <div
        className={`${styles.textColor} fw-lighter`}
        data-static-id='AlertCards.js_div_6c2606'
      >
        |
      </div>

      <div
        className={`d-flex flex-grow-1 flex-shrink-0 w-50 align-items-center justify-content-center`}
        data-static-id='AlertCards.js_div_8da765'
      >
        <p
          className={`text-13-regular mb-0 mt_03 line_height_12_per letter_spacing09`}
          data-static-id='AlertCards.js_p_1cdcea'
        >
          CUMULATIVE LOST OPPORTUNITY ($)
        </p>
        <p
          className={`text-20-regular mb-0 text_primary_blue ms-2 mt_03 line_height_12_per`}
          data-static-id='AlertCards.js_p_58adc2'
        >
          {utilizationReport?.cumulativeLostOpportunity}
        </p>
      </div>
    </div>
  )
  const renderWorkInProgress = () => (
    <div
      className={`${styles.bottomContainer__right}`}
      data-static-id='AlertCards.js_div_d60db7'
    >
      <img
        src={workInProgressIcon}
        className={styles.autoClosedIcon}
        data-static-id='AlertCards.js_img_a5e39c'
      />
      <h4
        className={`${styles.headerText} mb-0 text-uppercase mt_03 line_height_12_per text-12-bold letter_spacing09`}
        data-static-id='AlertCards.js_h4_5a5a67'
      >
        WORK IN PROGRESS
      </h4>
      <p
        className={`text-20-bold  text_primary_blue line_height_12_per`}
        data-static-id='AlertCards.js_p_524fa6'
      >
        {utilizationReport?.inProgress}
      </p>
    </div>
  )
  const renderAutoClosed = () => (
    <div
      className={`${styles.bottomContainer__right}`}
      data-static-id='AlertCards.js_div_916fe3'
    >
      <img
        src={overdueIcon}
        className={styles.autoClosedIcon}
        data-static-id='AlertCards.js_img_6ce2bc'
      />
      <h4
        className={`${styles.headerText} mb-0 text-uppercase mt_03 line_height_12_per text-12-bold letter_spacing09`}
        data-static-id='AlertCards.js_h4_b6d782'
      >
        Overdue
      </h4>
      <p
        className={`text-20-bold  text_primary_blue  line_height_12_per`}
        data-static-id='AlertCards.js_p_11f2fc'
      >
        {utilizationReport?.overdue}
      </p>
    </div>
  )
  return (
    <div
      className={styles.alertCardsContainer}
      data-static-id='AlertCards.js_div_2f2567'
    >
      <div
        className={styles.headerContainer}
        data-static-id='AlertCards.js_div_ebf16c'
      >
        <div
          className={`${styles.headerContainer_left} flex-grow-1 h-100`}
          data-static-id='AlertCards.js_div_7b9e4a'
        >
          <div
            className='d-flex align-items-center'
            data-static-id='AlertCards.js_div_9711e9'
          >
            <p
              className='text-12-bold mb-0 me-2 mt_03 line_height_12_per letter_spacing09'
              data-static-id='AlertCards.js_p_5271e8'
            >
              MONTHLY UTILIZATION REPORT
            </p>
            <OverlayTrigger
              placement='top'
              delay={{
                show: 200,
                hide: 200,
              }}
              trigger={['click', 'hover']}
              show={reportTooltipState.hover || reportTooltipState.click}
              overlay={(props) => getUtilizationRateToolTip(props)}
            >
              <span
                className={`${styles.reportIcon}`}
                data-tooltip-id='utilization-report'
                data-static-id='AlertCards.js_span_f4ea78'
              >
                <img
                  src={report_icon}
                  ref={ref}
                  alt='report_icon_icon'
                  onMouseOver={() => {
                    reportTooltipDispatch({
                      type: 'hover',
                      value: true,
                    })
                  }}
                  onMouseLeave={() => {
                    reportTooltipDispatch({
                      type: 'hover',
                      value: false,
                    })
                  }}
                  data-static-id='AlertCards.js_img_76bd7a'
                />
              </span>
            </OverlayTrigger>
          </div>
          <div
            className={`h-100 ${styles.dropdownContainer}`}
            data-static-id='AlertCards.js_div_d7be32'
          >
            <SingleSelect
              data={dropDownData}
              classes={{
                container: styles.dropdownContainer,
              }}
              onSelectChange={handleMonthChange}
            />
          </div>
        </div>

        <div
          className={styles.btnContainer}
          data-static-id='AlertCards.js_div_707479'
        >
          <button
            data-testid='downloadIcon'
            onClick={() => {
              downloadCSVFile(utilizationReport, caseIdList)
            }}
            data-static-id='AlertCards.js_button_316d74'
          >
            <OverlayTrigger
              placement='top-end'
              overlay={(props) => getDownloadToolTip(props)}
            >
              <img
                src={downloadIcon}
                data-static-id='AlertCards.js_img_c50225'
              />
            </OverlayTrigger>
          </button>
        </div>
      </div>
      <div
        className={styles.bottomContainer}
        data-static-id='AlertCards.js_div_d7293b'
      >
        {isLoading ? (
          <Loader />
        ) : (
          <>
            <div
              className={`d-flex flex-column ${styles.wrapContainer}`}
              data-static-id='AlertCards.js_div_422736'
            >
              <div
                className='d-flex justify-content-between align-items-center'
                data-static-id='AlertCards.js_div_ad96e3'
              >
                <div
                  className={`d-flex align-items-center gap-1 ${styles.generatedAlertText}`}
                  data-static-id='AlertCards.js_div_4bedfd'
                >
                  <img
                    className={`${styles.alertIcon}`}
                    src={generatedAlertIcon}
                    data-static-id='AlertCards.js_img_c968d6'
                  />
                  <span
                    className='text-12-bold me-1 mt_03 line_height_12_per letter_spacing09'
                    data-static-id='AlertCards.js_span_910b8e'
                  >
                    GENERATED ALERTS :
                  </span>
                  <span
                    className='text-16-bold text_primary_blue mt_03 line_height_12_per'
                    data-static-id='AlertCards.js_span_9bfbd2'
                  >
                    {utilizationReport?.totalGenerated}
                  </span>
                </div>
                <div
                  className={`d-flex align-items-center gap-1 ${styles.generatedAlertText}`}
                  data-static-id='AlertCards.js_div_651913'
                >
                  <img
                    className={`${styles.alertIcon}`}
                    src={PendingIcon}
                    data-static-id='AlertCards.js_img_ef39df'
                  />
                  <span
                    className='text-12-bold me-1 mt_03 text-uppercase line_height_12_per letter_spacing09'
                    data-static-id='AlertCards.js_span_2ece42'
                  >
                    Pending :
                  </span>
                  <span
                    className='text-16-bold text_primary_blue mt_03 line_height_12_per'
                    data-static-id='AlertCards.js_span_14309b'
                  >
                    {utilizationReport?.pending}
                  </span>
                </div>
                <div
                  className={`d-flex align-items-center gap-1 ${styles.generatedAlertText}`}
                  data-static-id='AlertCards.js_div_f505cb'
                >
                  <img
                    className={`${styles.alertIcon}`}
                    src={AutoClosedIcon}
                    data-static-id='AlertCards.js_img_5856df'
                  />
                  <span
                    className='text-12-bold me-1 mt_03 line_height_12_per letter_spacing09'
                    data-static-id='AlertCards.js_span_a65c6e'
                  >
                    AUTO CLOSED :
                  </span>
                  <span
                    className='text-16-bold text_primary_blue mt_03 line_height_12_per'
                    data-static-id='AlertCards.js_span_009aee'
                  >
                    {utilizationReport?.closedSystem}
                  </span>
                </div>
              </div>
              <div
                className='d-flex gap-2 flex-grow-1'
                data-static-id='AlertCards.js_div_ab41a5'
              >
                {renderClosedByTeam()}
                {renderWorkInProgress()}
                {renderAutoClosed()}
              </div>
            </div>
            {renderUtilizationRate()}
          </>
        )}
      </div>
    </div>
  )
}
export default AlertCards
