import { AppAtom } from 'atoms/AppAtom'
import { TokenAtom } from 'atoms/RootAtom'
import Loader from 'components/ui/loader/Loader'
import CustomModal from 'components/visuals/common/modal/CustomModal'
import { getUserDomainID } from 'components/visuals/common/modal/ODSAlertModal'
import { TRACKEVENTOBJ } from 'config/ActivityTrackerConfig'
import { env } from 'config/env'
import { useAtomValue } from 'jotai'
import moment from 'moment'
import { useEffect, useMemo, useState } from 'react'
import { OverlayTrigger } from 'react-bootstrap'
import Tooltip from 'react-bootstrap/Tooltip'
import { useLocation, useParams } from 'react-router-dom'
import {
  getWorkflowPmDelegationInfo,
  updateWorkflowPmDelegationInfo,
} from 'services/WorkflowServices'
import {
  getKSAMomentWithTimeAsZero,
  getPlantAndAffiliateNameByPlantId,
  showToast,
} from 'utills/utilities'
import infoIcon from '../../assets/sabic_icons/common/timeinfo_blue.svg'
import { formatDate, isDelegationDateGreater } from './AutoDelegation.function'
import styles from './AutoDelegation.module.scss'
import Row from './AutoDelegationRow'
import AutoDelegationSubmitModal from './AutoDelegationSubmitModal'
const COLUMNS_DEF = [
  {
    title: 'Auto Delegate To',
    width: '18%',
  },
  {
    title: 'Immediately Auto Delegate Till',
    width: '23%',
    infoText:
      'This will immediately Assign all new alerts to the selected Process Engineer till the date chosen by the user for the selected affiliate . This can be used for when user is unavailable for few days and wants to autodelegate the alerts immediately.',
  },
  {
    title: 'Turn On/Off',
    width: '11%',
    infoText:
      'This will turn on/off the autodelegation of alerts for the selected affiliate.',
  },
]
const TableComp = ({ delegateData, setDelegateData }) => {
  if (!delegateData?.length) {
    return (
      <tr data-static-id='AutoDelegation.js_tr_30bba2'>
        <td
          colSpan={COLUMNS_DEF.length}
          className={`${styles.loaderContainer} text-center`}
          data-static-id='AutoDelegation.js_td_325539'
        >
          No data found{' '}
        </td>
      </tr>
    )
  }
  return delegateData.map((x, index) => (
    <Row
      key={`${x.title}-${x.infoText}`}
      index={index}
      data={x}
      setDelegateData={setDelegateData}
      delegateData={delegateData}
    />
  ))
}
const AutoDelegation = () => {
  const isAutoDelegateEnabled = env.EO_ENABLE_AUTO_DELEGATE
  const [showModal, setShowModal] = useState(false)
  const [showSubmitModal, setShowSubmitModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [delegateData, setDelegateData] = useState([])
  const ctxData = useAtomValue(AppAtom)
  const location = useLocation()
  const params = useParams() || {}
  const caseData = ctxData?.caseData || []
  const token = useAtomValue(TokenAtom)
  const innerTooltip = (props, index, x) => (
    <Tooltip
      id={`tooltip-${index}`}
      {...props}
      className={`${styles.tooltipContainer}`}
      data-static-id='AutoDelegation.js_Tooltip_d4d1bb'
    >
      <p
        className='text-14-regular text-start text-uppercase p-2 d-flex text-white'
        data-static-id='AutoDelegation.js_p_ba604b'
      >
        {x.infoText}
      </p>
    </Tooltip>
  )
  const fetchPmDelegateInfo = async () => {
    setIsLoading(true)
    const res = await getWorkflowPmDelegationInfo(token?.userId)
    if (res?.data) {
      const x = res?.data
      const isGreater = isDelegationDateGreater(x.notAvailableUptoEpoch)
      const loadedData = {
        ...x,
        ...getPlantAndAffiliateNameByPlantId(x.plantID, ctxData?.caseData),
        formattedDate: formatDate(
          getKSAMomentWithTimeAsZero(x.notAvailableUptoEpoch),
        ),
        notAvailableUpto: isGreater ? x.notAvailableUpto : null,
        notAvailableUptoEpoch: isGreater ? x.notAvailableUptoEpoch : null,
      }
      setDelegateData([loadedData])
    }
    setIsLoading(false)
  }
  useEffect(() => {
    if (showModal) {
      fetchPmDelegateInfo()
    }
  }, [showModal])
  const handleClick = () => {
    setShowModal(!showModal)
    setDelegateData([])
  }
  const handleClose = () => {
    setShowModal(false)
    setDelegateData([])
  }
  const handleSubmit = async () => {
    const employeeId = await getUserDomainID(token)
    setIsSubmitting(true)
    const payload = delegateData.map((x) => {
      const isActiveEnabled = x.active
      return {
        assignedTo: x?.assignedTo,
        delegatedAfterDays: x.delegatedAfterDays,
        immediateAutoDelegateTill: x.notAvailableUpto,
        isActive: isActiveEnabled ? 1 : 0,
        actionBy: employeeId,
      }
    })
    const res = await updateWorkflowPmDelegationInfo(payload)
    if (res?.statuscode === 200) {
      fetchPmDelegateInfo()
      setShowSubmitModal(false)
      showToast('Auto delegation config updated successfully...', 'success')
      setShowModal(false)
      TRACKEVENTOBJ.autoDelegation.onSubmit({
        params,
        pathname: location.pathname,
        caseData,
      })
    } else {
      showToast('Error while updating auto delegation config...', 'error')
    }
    setIsSubmitting(false)
  }
  const handleSubmitOuter = () => {
    setShowSubmitModal(true)
  }
  const isDisabled = useMemo(() => {
    return delegateData.some((x) => {
      const isAutoForwardTill = moment(
        parseInt(x.notAvailableUptoEpoch),
      ).isAfter(moment(), 'D')
      return (
        x.active &&
        (!x.assignedTo || !(x.notAvailableUpto && isAutoForwardTill))
      )
    })
  }, [delegateData])
  if (isAutoDelegateEnabled === 'true' || isAutoDelegateEnabled == '1') {
    return (
      <div className='h-100' data-static-id='AutoDelegation.js_div_e8d0a6'>
        <button
          data-testid='autoAssign-btn'
          className={`${styles.autoDelegateBtn} text-14-regular text-white`}
          onClick={handleClick}
          data-static-id='AutoDelegation.js_button_0b6bf5'
        >
          Auto Delegate
        </button>
        <CustomModal
          title='Auto Delegate'
          show={showModal}
          hideModal={handleClose}
          modalHeight='45vmin'
          size={'lg'}
          contentFitWidth={styles.autoDelegationModalContainer}
        >
          <div
            className={`${styles.autoDelegationContainer} h-100`}
            data-static-id='AutoDelegation.js_div_c5a8b9'
          >
            <span
              className={`${styles.autoDelegationContainerSpan} text-12-regular text_primary_gray_2 text-uppercase`}
              data-static-id='AutoDelegation.js_span_cb9cd4'
            >
              Auto delegation feature allows a user to delegate alerts to chosen
              assignee after certain number of days or instantly forward alerts
            </span>

            <div
              className={`${styles.autoDelegateBtnTableContainer}`}
              data-static-id='AutoDelegation.js_div_71ef38'
            >
              <div
                className={`${styles.autodelegationTable}`}
                data-static-id='AutoDelegation.js_div_02ddaf'
              >
                <table
                  className={`${styles.table}`}
                  data-static-id='AutoDelegation.js_table_83744e'
                >
                  <thead data-static-id='AutoDelegation.js_thead_6c88a7'>
                    <tr data-static-id='AutoDelegation.js_tr_118fd6'>
                      {COLUMNS_DEF.map((x, index) => (
                        <th
                          key={`${x.title}-${x.infoText}`}
                          style={{
                            width: x.width,
                          }}
                          data-static-id='AutoDelegation.js_th_cb6a52'
                        >
                          {x.title}
                          {x.infoText && (
                            <OverlayTrigger
                              placement='bottom-end'
                              overlay={(props) => innerTooltip(props, index, x)}
                            >
                              <img
                                src={infoIcon}
                                className={`me-2 cursor-pointer ${styles.infoIcon}`}
                                alt='Info Icon'
                                data-static-id='AutoDelegation.js_img_a72854'
                              />
                            </OverlayTrigger>
                          )}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody data-static-id='AutoDelegation.js_tbody_382fde'>
                    {isLoading ? (
                      <tr data-static-id='AutoDelegation.js_tr_a883dc'>
                        <td
                          colSpan={COLUMNS_DEF.length}
                          className={`${styles.loaderContainer}`}
                          data-static-id='AutoDelegation.js_td_eb779a'
                        >
                          <Loader />
                        </td>
                      </tr>
                    ) : (
                      <TableComp
                        delegateData={delegateData}
                        setDelegateData={setDelegateData}
                      />
                    )}
                  </tbody>
                </table>
              </div>
              <div
                className={`${styles.autoDelegationBtnContainer} d-flex justify-content-end`}
                data-static-id='AutoDelegation.js_div_a54220'
              >
                <button
                  className={`text-14-regular ${styles.cancelBtn}`}
                  disabled={isSubmitting}
                  onClick={handleClose}
                  data-static-id='AutoDelegation.js_button_1d2e1e'
                >
                  Cancel
                </button>
                <button
                  className={`text-14-regular ${styles.submitBtn}`}
                  disabled={isSubmitting || isDisabled}
                  onClick={handleSubmitOuter}
                  data-static-id='AutoDelegation.js_button_121429'
                >
                  Submit
                </button>
              </div>
            </div>
          </div>
        </CustomModal>

        <AutoDelegationSubmitModal
          showSubmitModal={showSubmitModal}
          isSubmitting={isSubmitting}
          setShowSubmitModal={setShowSubmitModal}
          handleSubmit={handleSubmit}
          delegateData={delegateData}
        />
      </div>
    )
  }
  return <></>
}
export default AutoDelegation
