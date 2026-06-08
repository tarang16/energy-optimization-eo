import infoIcon from 'assets/sabic_icons/common/timeInfo.svg'
import { AppAtom } from 'atoms/AppAtom'
import { TokenAtom } from 'atoms/RootAtom'
import Switch from 'components/ui/switch/Switch'
import CustomModal from 'components/visuals/common/modal/CustomModal'
import SimpleTable from 'components/visuals/table/SimpleTable'
import { WORKFLOW_ROLE } from 'config/Config'
import { useAtomValue } from 'jotai'
import moment from 'moment'
import { useEffect, useMemo, useState } from 'react'
import { Tab, Tabs } from 'react-bootstrap'
import {
  getAlertStatisticsMutedAlerts,
  updateMuteAlertsLogByCauseIdList,
} from 'services/AlertStaticsSerives'
import { getWorkflowUsersByRole } from 'services/WorkflowServices'
import {
  convertFormulaToHtml,
  getAffiliateCodeByCaseID,
  getValsBaseOnCondition,
  showToast,
} from 'utills/utilities'
import styles from './AlertStatus.module.scss'
export const handleConfirmSubmit = async (
  setIsSubmitting,
  updatedAlerts,
  setShow,
  setRefetchAlert,
) => {
  try {
    setIsSubmitting(true)
    const resp = await updateMuteAlertsLogByCauseIdList(updatedAlerts.join(','))
    if (resp.statuscode === 200) {
      setShow(false)
      setIsSubmitting(false)
      setRefetchAlert((prev) => !prev)
    } else {
      setIsSubmitting(false)
    }
  } catch (error) {
    setIsSubmitting(false)
    showToast('error while update muted alerts Data', error)
  }
}
const MutedAlerts = ({ caseId }) => {
  const token = useAtomValue(TokenAtom)
  let ctxData = useAtomValue(AppAtom)
  const caseData = ctxData?.caseData || []
  const [showAlertsModal, setShowAlertsModal] = useState(false)
  const [selectedTab, setSelectedTab] = useState('current_mute_alerts')
  const [updatedAlerts, setUpdatedAlerts] = useState([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [show, setShow] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [refetchAlert, setRefetchAlert] = useState(false)
  const [tooltipModal, setTooltipModal] = useState(false)
  const [isAccessMute, setIsAccessMute] = useState(false)
  const [alertsApiData, setAlertsApiData] = useState([])
  const affiliateId = getAffiliateCodeByCaseID(caseId, caseData)
  const tabsData = [
    {
      eventKey: 'current_mute_alerts',
      title: 'CURRENT MUTED ALERTS',
    },
    {
      eventKey: 'past_mute_alerts',
      title: 'PAST MUTED ALERTS',
    },
  ]
  const MUTED_ALERTS_TABLE_HEADER = [
    'CAUSE',
    'MUTED ON',
    'MUTED TILL',
    'MUTED BY',
    'REASON',
    'COMMENT',
    'TURN OFF',
  ]
  const PAST_MUTED_ALERTS_TABLE_HEADER = [
    'CAUSE',
    'MUTED ON',
    'MUTED TILL',
    'MUTED BY',
    'UNMUTED BY',
    'UNMUTED ON',
    'REASON',
    'COMMENT',
  ]
  const fetchData = async () => {
    try {
      const resp = await getWorkflowUsersByRole('', affiliateId)
      let filteredData = []
      if (resp?.statuscode === 200) {
        filteredData = resp?.data?.filter(
          (item) => item?.employeeId === token?.userId,
        )
      }
      const isCheck = filteredData.some(
        (item) =>
          [
            WORKFLOW_ROLE.PROCESS_MANAGER,
            WORKFLOW_ROLE.PROCESS_ENGINEER,
          ].includes(item?.roleId?.toString()) && token?.isPowerUser,
      )
      setIsAccessMute(isCheck)
    } catch (error) {
      showToast('error while fetching workflow user role', error)
    }
  }
  useEffect(() => {
    fetchData()
  }, [affiliateId])
  const handleChange = (id, checked) => {
    if (checked) {
      setUpdatedAlerts((prev) => {
        return prev.filter((item) => item !== id)
      })
    } else {
      setUpdatedAlerts((prev) => {
        return [...prev, id]
      })
    }
  }
  const handleModalToggle = () => {
    setShowAlertsModal(!showAlertsModal)
  }
  const handleSubmit = () => {
    setShow(true)
  }
  const modelTooltip = {
    Formula: 'formula',
    Suggestion: 'Suggestion',
  }
  const checkCurrentAlert = () => {
    return selectedTab === 'current_mute_alerts' && isAccessMute
  }
  const getCurrentHeader = () => {
    return isAccessMute
      ? MUTED_ALERTS_TABLE_HEADER
      : MUTED_ALERTS_TABLE_HEADER.slice(0, 6)
  }
  const getCurrentAlerts = (item, isAccessMute) => {
    return isAccessMute
      ? [
          <span
            key={`${item?.createdBy}-${item?.causename}`}
            data-static-id='MutedAlerts.js_span_2cc6fc'
          >
            {item?.causename ?? '-'}{' '}
            <img
              src={infoIcon}
              className={`cursor-pointer ms-1 mb-0 ${styles.infoIcon}`}
              onClick={() => setTooltipModal(item)}
              data-static-id='MutedAlerts.js_img_cf9f24'
            />
          </span>,
          item?.mutedOn ? moment(item?.mutedOn)?.format('DD-MMM-YY') : '-',
          item?.muteTill ? moment(item?.muteTill)?.format('DD-MMM-YY') : '-',
          item?.createdBy ?? '-',
          item?.reason ?? '-',
          item?.comment ?? '-',
          <Switch
            key={`${item?.causeId}-${item?.isActive}`}
            type='checkbox'
            defaultChecked={item?.isActive}
            onChange={(e) => handleChange(item?.causeId, e.target.checked)}
            customToggleStyle={styles.customBlueSwitch}
          />,
        ]
      : [
          <span
            key={`${item?.causename}-${item?.mutedOn}`}
            data-static-id='MutedAlerts.js_span_877db2'
          >
            {item?.causename ?? '-'}{' '}
            <img
              src={infoIcon}
              className={`cursor-pointer ms-1 mb-0 ${styles.infoIcon}`}
              onClick={() => setTooltipModal(item)}
              data-static-id='MutedAlerts.js_img_cffec1'
            />
          </span>,
          item?.mutedOn ? moment(item?.mutedOn)?.format('DD-MMM-YY') : '-',
          item?.muteTill ? moment(item?.muteTill)?.format('DD-MMM-YY') : '-',
          item?.createdBy ?? '-',
          item?.reason ?? '-',
          item?.comment ?? '-',
        ]
  }
  const alertsData = useMemo(() => {
    return alertsApiData?.map((item) =>
      selectedTab === 'current_mute_alerts'
        ? getCurrentAlerts(item, isAccessMute)
        : [
            <span
              key={`${item?.updatedBy}-${item?.muteTill}`}
              data-static-id='MutedAlerts.js_span_5b4c49'
            >
              {item?.causeName ?? '-'}{' '}
              <img
                src={infoIcon}
                className={`cursor-pointer ms-1 mb-0 ${styles.infoIcon}`}
                onClick={() => setTooltipModal(item)}
                data-static-id='MutedAlerts.js_img_88c068'
              />
            </span>,
            item?.mutedOn ? moment(item?.mutedOn)?.format('DD-MMM-YY') : '-',
            item?.muteTill ? moment(item?.muteTill)?.format('DD-MMM-YY') : '-',
            item?.createdBy ?? '-',
            item?.updatedBy ?? '-',
            item?.updatedOn ? moment(item?.updatedOn).format('DD-MMM-YY') : '-',
            item?.reason ?? '-',
            item?.comment ?? '-',
          ],
    )
  }, [alertsApiData, isAccessMute])
  const getMutedAlerts = async () => {
    try {
      setIsLoading(true)
      const res = await getAlertStatisticsMutedAlerts({
        affiliateId,
        active: selectedTab === 'current_mute_alerts',
      })
      if (res?.statuscode === 200) {
        setAlertsApiData(res?.data ?? [])
        setIsLoading(false)
      } else {
        setIsLoading(false)
        setAlertsApiData([])
      }
    } catch (error) {
      setIsLoading(false)
      setAlertsApiData([])
      showToast('error while fetch muted alert Data', error)
    }
  }
  useEffect(() => {
    if (showAlertsModal) {
      getMutedAlerts()
    }
  }, [showAlertsModal, selectedTab, refetchAlert, affiliateId])
  return (
    <>
      <button
        onClick={handleModalToggle}
        className={`text-14-regular  ${styles.submitButton}`}
        data-static-id='MutedAlerts.js_button_ff4c7b'
      >
        <span
          className='mt_03 text_primary_white text-uppercase d-inline-block'
          data-static-id='MutedAlerts.js_span_ff33fd'
        >
          Mute Alerts Info
        </span>
      </button>
      <CustomModal
        hideModal={() => setTooltipModal(false)}
        title={tooltipModal?.causeName ?? '-'}
        show={tooltipModal}
        size={'lg'}
        bodyHeight='auto'
        modalHeight='auto'
        y={-50}
        x={-90}
        customSpacingClass={styles.customSpacingClass}
        id='automated-testing-kpis-details'
      >
        <div data-static-id='MutedAlerts.js_div_2fc4bc'>
          <table className='mt-.5' data-static-id='MutedAlerts.js_table_ec972b'>
            <tbody data-static-id='MutedAlerts.js_tbody_79e334'>
              {Object.entries(modelTooltip).map((item) => {
                const [key, value] = item
                return (
                  <tr key={`${key}`} data-static-id='MutedAlerts.js_tr_85b9b4'>
                    <td
                      className='py-1'
                      style={{
                        verticalAlign: 'baseline',
                      }}
                      data-static-id='MutedAlerts.js_td_d5f08e'
                    >
                      <div
                        className={`text-12-bold d-flex justify-content-between text-uppercase ${styles.equalWidthLabel}`}
                        data-static-id='MutedAlerts.js_div_acff1f'
                      >
                        <span data-static-id='MutedAlerts.js_span_7b400e'>
                          {key}
                        </span>

                        <span data-static-id='MutedAlerts.js_span_1298d0'>
                          :
                        </span>
                      </div>
                    </td>
                    <td data-static-id='MutedAlerts.js_td_54b446'>
                      <div
                        className='text-12-regular px-2 overflow-wrap'
                        style={{
                          lineHeight: '1.9vmin',
                        }}
                        data-static-id='MutedAlerts.js_div_7bcd80'
                      >
                        {convertFormulaToHtml(tooltipModal?.[value])}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </CustomModal>
      <CustomModal
        show={showAlertsModal}
        title='MUTE ALERTS INFO'
        hideModal={handleModalToggle}
        size={'lg'}
        contentFitWidth={styles.mutedAlertTabModal}
      >
        <div
          className={`${styles.mutedAlertModalContainer} h-100`}
          data-static-id='MutedAlerts.js_div_65f004'
        >
          <div
            className={`${styles.topTabContainer} ${checkCurrentAlert() && alertsData?.length ? ' ' : styles.topTabContainerFullHeight}`}
            data-static-id='MutedAlerts.js_div_bb3944'
          >
            <Tabs
              defaultActiveKey={selectedTab}
              onSelect={(e) => {
                setSelectedTab(e)
              }}
              data-static-id='MutedAlerts.js_Tabs_1b56b2'
            >
              {tabsData?.map((tab) => (
                <Tab
                  key={`${tab?.title}-${tab?.eventKey}`}
                  eventKey={tab?.eventKey}
                  title={tab?.title}
                  id={tab?.eventKey}
                  data-static-id='MutedAlerts.js_Tab_36e9ec'
                >
                  <div
                    className={`${styles.tableContainer} h-100`}
                    data-static-id='MutedAlerts.js_div_268581'
                  >
                    <SimpleTable
                      data={alertsData}
                      headers={getValsBaseOnCondition(
                        selectedTab === 'current_mute_alerts',
                        getCurrentHeader(),
                        PAST_MUTED_ALERTS_TABLE_HEADER,
                      )}
                      showLoader={isLoading}
                      customColumnWidths={getValsBaseOnCondition(
                        selectedTab === 'current_mute_alerts',
                        [30, 10, 10, 15, 25, 25, 10],
                        [21, 10, 10, 12, 12, 10, 15, 10],
                      )}
                      leftAlignColumns={getValsBaseOnCondition(
                        selectedTab === 'current_mute_alerts',
                        [0, 4],
                        [0, 6],
                      )}
                    />
                  </div>
                </Tab>
              ))}
            </Tabs>
          </div>
          {isAccessMute && alertsData?.length ? (
            <div
              className={`${styles.mutedAlertBtnContainer}`}
              data-static-id='MutedAlerts.js_div_3f479c'
            >
              <button
                className={`text-14-regular ${styles.cancelBtn}`}
                onClick={() => setShowAlertsModal(false)}
                data-static-id='MutedAlerts.js_button_2b043a'
              >
                <span
                  className='mt_03 d-inline-block text_primary_blue'
                  data-static-id='MutedAlerts.js_span_82535d'
                >
                  cancel
                </span>
              </button>
              <button
                className={`text-14-regular ${styles.submitBtn}  ${selectedTab === 'past_mute_alerts' ? styles.disabledBtn : ''}`}
                onClick={handleSubmit}
                disabled={selectedTab === 'past_mute_alerts'}
                data-static-id='MutedAlerts.js_button_8da5f6'
              >
                <span
                  className={`mt_03 d-inline-block text_primary_white`}
                  data-static-id='MutedAlerts.js_span_32fee3'
                >
                  submit
                </span>
              </button>
            </div>
          ) : (
            <></>
          )}

          <CustomModal
            hideModal={() => {
              if (!isSubmitting) {
                setShow(false)
              }
            }}
            title={`User Confirmation`}
            show={show}
            size={' '}
            modalHeight={'auto'}
            contentFitWidth='customNestedBackgroundBlue'
          >
            <div className={`w-100`} data-static-id='MutedAlerts.js_div_e7e950'>
              <h2
                className='text-16-bold text-center text-uppercase mb-2 mt-1'
                data-static-id='MutedAlerts.js_h2_42d30d'
              >
                Are you sure you want to submit the request ?
              </h2>

              <div
                className={`mb-0 d-flex justify-content-center align-items-center ${styles.confirmModalBtnContainer}`}
                data-static-id='MutedAlerts.js_div_359173'
              >
                <button
                  className={`me-3 pb-0 text-14-regular ${styles.cancelBtn} ${isSubmitting ? styles.disabledBtn : ''}`}
                  disabled={isSubmitting}
                  onClick={() => {
                    setShow(false)
                  }}
                  data-static-id='MutedAlerts.js_button_3ff3d3'
                >
                  No
                </button>
                <button
                  className={`me-2 pb-0 text-14-regular ${styles.submitBtn} ${isSubmitting ? styles.disabledBtn : ''}`}
                  disabled={isSubmitting}
                  onClick={() => {
                    handleConfirmSubmit(
                      setIsSubmitting,
                      updatedAlerts,
                      setShow,
                      setRefetchAlert,
                    )
                  }}
                  data-static-id='MutedAlerts.js_button_23d829'
                >
                  {isSubmitting ? 'Submitting...' : 'Yes'}
                </button>
              </div>
            </div>
          </CustomModal>
        </div>
      </CustomModal>
    </>
  )
}
export default MutedAlerts
