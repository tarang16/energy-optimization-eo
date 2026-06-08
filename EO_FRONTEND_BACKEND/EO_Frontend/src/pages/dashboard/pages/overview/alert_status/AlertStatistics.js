import viewModalIcon from 'assets/sabic_icons/alert_status_icon/view_arrow_icon_2color.svg'
import checkCircleIcon from 'assets/sabic_icons/common/ods_arrows.svg'
import Loader from 'components/ui/loader/Loader'
import WaterfallChart from 'components/visuals/charts/waterfall_chart/WaterfallChart'
import CustomModal from 'components/visuals/common/modal/CustomModal'
import ODSAlertModal from 'components/visuals/common/modal/ODSAlertModal'
import SimpleTable from 'components/visuals/table/SimpleTable'
import moment from 'moment'
import { getWfCUmulativeData } from 'pages/Inbox_workflow/Inbox_workflow.functions'
import { useEffect, useState } from 'react'
import { OverlayTrigger } from 'react-bootstrap'
import Tooltip from 'react-bootstrap/Tooltip'
import {
  getAlertStatisticsByCaseIDsAndState,
  getAlertStatisticsForInProgressAlerts,
  getAlertStatisticsForOverdueAlerts,
  getAlertStatisticsForPendingAlerts,
  getAlertStatisticsTargetModifiedAlerts,
} from 'services/AlertStaticsSerives'
import { getKSAMoment } from 'utills/utilities'
import trendIcon from '../../../../../assets/sabic_new_icons/predicted_action2.svg'
import {
  active_alert_card_template,
  closed_alert_card_template,
  handleAlertManageModal,
  implemented_alerts_table_header,
  implemented_alerts_table_order,
  overdue_alerts_table_header,
  overdue_alerts_table_order,
  pending_alerts_table_header,
  pending_alerts_table_order,
  targetdaterevision_alerts_table_header,
  targetdaterevision_alerts_table_order,
  work_in_progress_alerts_table_header,
  work_in_progress_alerts_table_order,
} from './AlertStatistics.functions'
import styles from './AlertStatistics.module.scss'
export const getFetchDataAndTableOrder = (normalizedTitle) => {
  switch (normalizedTitle) {
    case 'pending':
      return {
        fetchData: getAlertStatisticsForPendingAlerts,
        tableOrder: pending_alerts_table_order,
        header: pending_alerts_table_header,
        columnWidths: [],
      }
    case 'workinprogress':
      return {
        fetchData: getAlertStatisticsForInProgressAlerts,
        tableOrder: work_in_progress_alerts_table_order,
        header: work_in_progress_alerts_table_header,
        columnWidths: [],
      }
    case 'overdue':
    case 'no.ofoverduealerts':
      return {
        fetchData: getAlertStatisticsForOverdueAlerts,
        tableOrder: overdue_alerts_table_order,
        header: overdue_alerts_table_header,
        columnWidths: [],
      }
    case 'targetdaterevision':
      return {
        fetchData: getAlertStatisticsTargetModifiedAlerts,
        tableOrder: targetdaterevision_alerts_table_order,
        header: targetdaterevision_alerts_table_header,
        columnWidths: [20, 20, 20, 20, 20],
      }
    case 'implemented':
      return {
        fetchData: getAlertStatisticsByCaseIDsAndState,
        tableOrder: implemented_alerts_table_order,
        header: implemented_alerts_table_header,
        columnWidths: [],
        status: 'Closed (Implemented)',
      }
    case 'rejected':
      return {
        fetchData: getAlertStatisticsByCaseIDsAndState,
        tableOrder: implemented_alerts_table_order,
        header: implemented_alerts_table_header,
        columnWidths: [],
        status: 'Closed (Rejected)',
      }
    case 'autoclosed':
      return {
        fetchData: getAlertStatisticsByCaseIDsAndState,
        tableOrder: implemented_alerts_table_order,
        header: implemented_alerts_table_header,
        columnWidths: [],
        status: 'Closed (System)',
      }
    default:
      return {
        fetchData: null,
        tableOrder: [],
        header: [],
        columnWidths: [],
      }
  }
}
export function formatDateWithTime(val) {
  return val ? moment(val).format('DD-MMM-YY hh:mm A') : ''
}
export function formatDateWithoutTime(val) {
  return val ? moment(val).format('DD-MMM-YY') : ''
}
export function getValOrEmptyStr(val) {
  return val ?? ''
}
export function getCellValue(key, val, requestID, setShowTrendModalData) {
  if (key === 'dueDateEpoch') {
    return formatDateWithoutTime(val)
  } else if (key === 'inProgressSinceEpoch' || key === 'pendingSinceEpoch')
    return formatDateWithTime(val)
  else if (key === 'cumulativeLostOpportunity') {
    return (
      <div
        className={`d-flex justify-content-center px-1 ${styles.actionBtnGrp}`}
        data-static-id='AlertStatistics.js_div_445fc1'
      >
        <span
          className={`${styles.cumulativeContent} `}
          data-static-id='AlertStatistics.js_span_d23725'
        >
          <span
            className={`${styles.cumulativeText}`}
            data-static-id='AlertStatistics.js_span_33e5a5'
          >
            {getValOrEmptyStr(val) ?? '-'}
          </span>
          <span
            className={`${styles.iconWrapper}`}
            data-static-id='AlertStatistics.js_span_39ef16'
          >
            <img
              src={trendIcon}
              className='blueOnHover cursor-pointer'
              alt='trendIcon'
              onClick={() =>
                setShowTrendModalData({
                  requestID,
                  showModal: true,
                })
              }
              data-static-id='AlertStatistics.js_img_bf2261'
            />
          </span>
        </span>
      </div>
    )
  } else {
    return getValOrEmptyStr(val)
  }
}
export default function AlertStatistics({
  APIResponse,
  template,
  showModal = false,
  caseIdList,
  setRefresh = () => {},
  tabName,
  startDate,
}) {
  const [config, setConfig] = useState(
    template === 'active_alert_card_template'
      ? active_alert_card_template
      : closed_alert_card_template,
  )
  const [showAlertModal, setShowAlertModal] = useState(false)
  const [modalTitle, setModalTitle] = useState('')
  const [tableHeader, setTableHeader] = useState([])
  const [tableData, setTableData] = useState([])
  const [refetch, setRefetch] = useState(null)
  const [actionId, setActionID] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [customColumnWidths, setCustomColumnWidths] = useState([])
  const [trendData, setTrendData] = useState([])
  const [modalLoading, setModalLoading] = useState(false)
  const [showTrendModalData, setShowTrendModalData] = useState({
    showModal: false,
    requestID: '',
  })
  useEffect(() => {
    setConfig(
      template === 'active_alert_card_template'
        ? active_alert_card_template
        : closed_alert_card_template,
    )
  }, [template])
  useEffect(() => {
    if (showTrendModalData?.requestID) {
      getWfCUmulativeData(
        showTrendModalData?.requestID,
        setModalLoading,
        setTrendData,
      )
    }
  }, [showTrendModalData?.requestID])

  //  logic for the refetch
  useEffect(() => {
    if (modalTitle) {
      const currentTitle = modalTitle.replace(' ALERTS', '')
      fetchAndShowModal(currentTitle)
    }
  }, [refetch])
  const hideAlertModal = () => {
    setShowAlertModal(false)
    setTableData([])
  }
  async function fetchAndSaveData({
    fetchData,
    caseIdList,
    tableOrder,
    normalizedTitle,
    setActionID,
    title,
    setTableData,
    status,
  }) {
    setIsLoading(true)
    const sTime = startDate ? getKSAMoment(startDate) : ''
    const response = await fetchData(caseIdList, sTime, status)
    if (response?.data) {
      let orderedData
      if (Array.isArray(response.data)) {
        orderedData = response.data.map((item) =>
          tableOrder.map((key) =>
            getCellValue(key, item[key], item.alertId, setShowTrendModalData),
          ),
        )
        if (normalizedTitle === 'no.ofoverduealerts') {
          orderedData = orderedData.filter((item) => item[3] > 3)
        }
      } else {
        orderedData = [
          tableOrder.map((key) =>
            getCellValue(
              key,
              response.data[key],
              response.data.alertId,
              setShowTrendModalData,
            ),
          ),
        ]
      }
      const alertButton = (requestID) => (
        <button
          className={`${styles.modalTableBtn}`}
          data-static-id='AlertStatistics.js_button_edda6b'
        >
          <img
            src={checkCircleIcon}
            alt='checkIconWithCircle'
            className='blueOnHover'
            onClick={() => {
              handleAlertManageModal(requestID, setActionID)
            }}
            data-static-id='AlertStatistics.js_img_904f8e'
          />
        </button>
      )
      orderedData.forEach((rowData) => rowData.push(alertButton(rowData[0])))
      setTableData(orderedData)
      setIsLoading(false)
    } else {
      setTableData([])
      setIsLoading(false)
    }
  }
  const fetchAndShowModal = async (title) => {
    const normalizedTitle = title.replace(/\s+/g, '').toLowerCase()
    const {
      fetchData,
      tableOrder,
      header,
      columnWidths = [],
      status,
    } = getFetchDataAndTableOrder(normalizedTitle)
    setCustomColumnWidths(columnWidths)
    setModalTitle(`${title} ALERTS`)
    setTableHeader(header)
    if (fetchData) {
      fetchAndSaveData({
        fetchData,
        caseIdList,
        tableOrder,
        normalizedTitle,
        setActionID,
        title,
        setTableData,
        status,
      })
    }
    setShowAlertModal(true)
  }
  const renderTooltip = (props) => (
    <Tooltip {...props} data-static-id='AlertStatistics.js_Tooltip_a155f7'>
      <div
        className='text-14-regular text-uppercase text-white p-1'
        data-static-id='AlertStatistics.js_div_c85096'
      >
        The system automatically closes any alerts that have not been reoccurred
        within the past 24 hours.
      </div>
    </Tooltip>
  )
  return (
    <div className='w-100 h-100' data-static-id='AlertStatistics.js_div_582e34'>
      <div
        className={`d-flex flex-column w-100 h-100`}
        data-static-id='AlertStatistics.js_div_9c3a7e'
      >
        <div
          className={`${styles.StatisticsContainer} d-flex flex-column w-100 h-100`}
          data-static-id='AlertStatistics.js_div_3c168a'
        >
          <div
            className={`${styles.StatisticsContainer__wrapper}`}
            data-static-id='AlertStatistics.js_div_f08d01'
          >
            <div
              className={`${styles.StatisticsContainer__wrapper__topBlock} w-100`}
              data-static-id='AlertStatistics.js_div_2da231'
            >
              {config?.top?.map((topBlock) => {
                return (
                  <div
                    key={topBlock.key}
                    className={`${styles.StatisticsContainer__wrapper__topBlock__item} d-flex  align-items-center`}
                    data-static-id='AlertStatistics.js_div_16c710'
                  >
                    <img
                      className={styles.imgIcon}
                      src={topBlock.icon}
                      alt={topBlock.title}
                      data-static-id='AlertStatistics.js_img_ae8fa7'
                    />
                    <div data-static-id='AlertStatistics.js_div_e586ac'>
                      <p
                        className='text_primary_blue mb-0 text-24-bold'
                        data-static-id='AlertStatistics.js_p_4933e8'
                      >
                        {APIResponse[topBlock.key]}
                      </p>
                      <p
                        className='text-12-regular letter_spacing05 mb-0 text-uppercase'
                        data-static-id='AlertStatistics.js_p_352010'
                      >
                        {topBlock.title}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
            <CustomModal
              show={!!actionId}
              title={'WORKFLOW'}
              hideModal={() => handleAlertManageModal('', setActionID)}
              modalHeight={'92vh'}
              contentFitWidth={'workFlowModalWidth'}
            >
              <ODSAlertModal
                alertModalId={actionId}
                handleAlertManageModal={(requestID) =>
                  handleAlertManageModal(requestID, setActionID)
                }
                handleRefreshData={() => {
                  setRefetch((p) => !p)
                  setRefresh((p) => !p)
                }}
                calledFrom={tabName}
                screenName={tabName}
              />
            </CustomModal>
            <CustomModal
              show={showTrendModalData?.showModal}
              title={'Cumulative Lost Opportunity'}
              hideModal={(requestID, data) => {
                setShowTrendModalData((pre) => ({
                  ...pre,
                  showModal: false,
                }))
              }}
              modalHeight={'92vh'}
              contentFitWidth={'workFlowModalWidth'}
            >
              {modalLoading ? (
                <div
                  style={{
                    height: '15vmin',
                  }}
                  data-static-id='AlertStatistics.js_div_cf8ec1'
                >
                  <Loader />
                </div>
              ) : (
                <WaterfallChart
                  title={'(Hour)'}
                  valueKey={'lastOpportunity'}
                  furnaceData={trendData}
                  chartYdata={'$'}
                  categoryKey={'timeEpoch'}
                />
              )}
            </CustomModal>
            <div
              className={`d-flex w-100 ${styles.StatisticsContainer__wrapper__middleBlock}`}
              data-static-id='AlertStatistics.js_div_84e2dd'
            >
              {config?.bottom?.map((bottomBlock) => (
                <div
                  key={bottomBlock.key}
                  className={`${styles.StatisticsContainer__wrapper__middleBlock__item}`}
                  data-static-id='AlertStatistics.js_div_b1545d'
                >
                  <div
                    className={`${styles.topBlock}`}
                    data-static-id='AlertStatistics.js_div_001c8f'
                  >
                    <div
                      className={`${styles.iconContainer}`}
                      data-static-id='AlertStatistics.js_div_61c72f'
                    >
                      <img
                        src={bottomBlock.icon}
                        className={styles.imgIcon}
                        alt={bottomBlock.title}
                        data-static-id='AlertStatistics.js_img_0f772a'
                      />
                    </div>
                    <div
                      className={`${styles.valueCOntainer} text-center`}
                      data-static-id='AlertStatistics.js_div_14856d'
                    >
                      {bottomBlock?.key === 'closedSystem' ? (
                        <OverlayTrigger placement='top' overlay={renderTooltip}>
                          <p
                            className='text-14-regular letter_spacing05 mt_03 text-break text-uppercase mb-0 cursor-pointer'
                            data-static-id='AlertStatistics.js_p_8c847e'
                          >
                            {bottomBlock.title}
                          </p>
                        </OverlayTrigger>
                      ) : (
                        <p
                          className='text-14-regular letter_spacing05 mt_03 text-break text-uppercase mb-0'
                          data-static-id='AlertStatistics.js_p_d1663f'
                        >
                          {bottomBlock.title}
                        </p>
                      )}
                      <p
                        className='text_primary_blue mt_03  mb-0 me-2 text-24-bold'
                        data-static-id='AlertStatistics.js_p_91e318'
                      >
                        {APIResponse[bottomBlock.key]}
                      </p>
                    </div>
                  </div>
                  {showModal && (
                    <div
                      className={`${styles.modalButtonsContainer}`}
                      data-static-id='AlertStatistics.js_div_f5209d'
                    >
                      <button
                        data-testid={`alert-statistics-view-modal-${bottomBlock.key}`}
                        className='blueOnHover'
                        onClick={() => {
                          fetchAndShowModal(bottomBlock.title)
                        }}
                        data-static-id='AlertStatistics.js_button_57e608'
                      >
                        <img
                          src={viewModalIcon}
                          data-static-id='AlertStatistics.js_img_3b2013'
                        />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
          <div
            className={`${styles.StatisticsContainer__bottomBlock} w-100`}
            data-static-id='AlertStatistics.js_div_1f0899'
          >
            {config?.footer?.map((footerBlock) => (
              <div
                key={footerBlock.key}
                className={`${styles.cardItem} h-100 w-100`}
                data-static-id='AlertStatistics.js_div_3ebf3d'
              >
                <div
                  className={`${styles.cardItem__left}`}
                  data-static-id='AlertStatistics.js_div_8c103e'
                >
                  <img
                    className={styles.imgIcon}
                    src={footerBlock.icon}
                    alt={footerBlock.title}
                    data-static-id='AlertStatistics.js_img_4edbf7'
                  />
                  <div
                    className={`${styles.middleContent}`}
                    data-static-id='AlertStatistics.js_div_60b4ad'
                  >
                    <div data-static-id='AlertStatistics.js_div_fb969a'>
                      <p
                        className={`text-12-bold mb-0 text-uppercase text_primary_gray mt_03 line_height_12_per letter_spacing05`}
                        data-static-id='AlertStatistics.js_p_991a19'
                      >
                        {footerBlock.title}
                      </p>
                      <p
                        className={`text-12-regular mb-0 text-uppercase text_primary_gray_2 mt_03 line_height_12_per letter_spacing05`}
                        data-static-id='AlertStatistics.js_p_03d2bb'
                      >
                        {footerBlock.subtitle}
                      </p>
                    </div>
                    <p
                      className={` me-2 text_primary_blue mb-0 text-24-bold text-uppercase mt_07 line_height_12_per letter_spacing05`}
                      data-static-id='AlertStatistics.js_p_fccfae'
                    >
                      {APIResponse[footerBlock.key]}
                    </p>
                  </div>
                </div>

                <div
                  className={`${styles.cardItem__right}`}
                  data-static-id='AlertStatistics.js_div_6f848e'
                >
                  <div
                    className={`${styles.modalButtonsContainer}`}
                    data-static-id='AlertStatistics.js_div_f6a046'
                  >
                    <button
                      data-testid={`alert-statistics-view-modal-${footerBlock.title}`}
                      onClick={() => {
                        fetchAndShowModal(footerBlock.title)
                      }}
                      data-static-id='AlertStatistics.js_button_592e4d'
                    >
                      <img
                        src={viewModalIcon}
                        className='blueOnHover'
                        data-static-id='AlertStatistics.js_img_fa1dc9'
                      />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <CustomModal
        hideModal={hideAlertModal}
        title={modalTitle}
        show={showAlertModal}
      >
        {modalTitle?.toLowerCase().includes('auto closed alerts') && (
          <p
            className='text-12-regular text-uppercase mb-2 text_primary_gray_2'
            data-tut='reactour__dashboard_admin__b0d0d1d2d1d1d0d0d0d0d0d0d1d0d0p0'
            data-static-id='AlertStatistics.js_p_4d974b'
          >
            The system automatically closes any alerts that have not been
            reoccurred within the past 24 hours (which can be configurable
            through admin page).
          </p>
        )}
        <SimpleTable
          data={tableData}
          headers={tableHeader}
          showLoader={isLoading}
          customColumnWidths={customColumnWidths}
        />
      </CustomModal>
    </div>
  )
}
