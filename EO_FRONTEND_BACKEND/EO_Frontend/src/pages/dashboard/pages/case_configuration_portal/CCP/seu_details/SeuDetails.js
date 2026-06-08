import infoIcon from 'assets/sabic_icons/common/timeInfo.svg'
import editIcon from 'assets/sabic_icons/header/edit_default_icon.svg'
import Loader from 'components/ui/loader/Loader'
import CustomModal from 'components/visuals/common/modal/CustomModal'
import SimpleTable from 'components/visuals/table/SimpleTable'
import { auditLogConfig } from 'config/Config'
import { useEffect, useState } from 'react'
import {
  addAuditLog,
  getSeuDetails,
  updateSeuDetails,
} from 'services/CCPServices'
import { getViewDataDictionaryByTablename } from 'services/ConfigServices'
import {
  detectModification,
  getValsBaseOnCondition,
  safeBtoa,
  UNSAVED_CHANGES_WARNING,
  userConfirmationMessage,
} from 'utills/utilities'
import ConfigurationDownload from '../../Configurationdownload/ConfigurationDownload'
import styles from '../CCP.module.scss'
import SeuDetailsModal from './SeuDetailsModal'
export const SEU_HEADER = [
  'PLANT NAME',
  'EQUIPMENT NAME',
  'DISPLAY NAME',
  'CATEGORY',
  'ENERGY SOURCE',
  'BASELINE EXPRESSION',
  'ACTUAL EXPRESSION',
  'OPTIMUM EXPRESSION',
  'ACTION',
]
const headersForXls = [
  'plantName',
  'seuName',
  'seuDisplayName',
  'seuCategory',
  'energySource',
  'baselineDutyExpression',
  'actualDutyExpression',
  'targetDutyExpression',
  'actualDutyExpressionGjph',
  'baselineDutyExpressionGjph',
  'targetDutyExpressionGjph',
]
const indexToRemove = [2, 4]
indexToRemove.forEach((index) => SEU_HEADER.splice(index, 1))
indexToRemove.forEach((index) => headersForXls.splice(index, 1))
export default function SeuDetails({ caseID = null, canEdit = false }) {
  const [tableData, setTableData] = useState([])
  const [editData, setEditData] = useState(null)
  const [originalData, setOriginalData] = useState(null)
  const [apiData, setApiData] = useState(null)
  const [refetch, setRefetch] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [tooltips, setTooltips] = useState({})
  const [readOnly, setReadOnly] = useState(true)
  const getEditClass = (canEdit) => {
    if (canEdit) {
      return `cursor-pointer blueOnHover`
    } else {
      return `disabledImg`
    }
  }
  const generateTableData = (data) => {
    setTableData(
      data?.map((obj) => {
        return [
          obj?.plantName,
          obj?.seuName,
          obj?.seuCategory,
          obj?.baselineDutyExpression,
          obj?.actualDutyExpression,
          obj?.targetDutyExpression,
          <div
            key={`${obj?.plantName}-${obj?.seuName}`}
            className='d-flex align-items-center justify-content-center gap-2'
            data-static-id='SeuDetails.js_div_8404f2'
          >
            <button
              id='info-icon-constraints'
              className={`${styles.editBtnImage} mx-0`}
              onClick={() => {
                setReadOnly(true)
                setEditData(obj)
              }}
              data-static-id='SeuDetails.js_button_dff4fd'
            >
              <img
                src={infoIcon}
                alt='info icon'
                data-static-id='SeuDetails.js_img_e28d67'
              />
            </button>
            <button
              id='editicon-price-input'
              className={`${styles.editBtnImage} mx-0 ${getEditClass(canEdit)}`}
              disabled={!canEdit}
              onClick={() => {
                setReadOnly(false)
                setEditData(obj)
              }}
              data-static-id='SeuDetails.js_button_744708'
            >
              <img
                src={editIcon}
                alt='edit icon'
                data-static-id='SeuDetails.js_img_841c93'
              />
            </button>
          </div>,
        ]
      }),
    )
  }
  const getTooltipsData = async () => {
    const tooltipResp = await getViewDataDictionaryByTablename('seu_details')
    if (tooltipResp?.data) {
      const tooltipData = tooltipResp?.data.reduce((acc, obj) => {
        acc[obj?.columnName] = obj
        return acc
      }, {})
      setTooltips(tooltipData)
    }
  }
  useEffect(() => {
    ;(async () => {
      setIsLoading(true)
      const resp = await getSeuDetails(caseID)
      if (resp?.data?.length > 0) {
        setIsLoading(true)
        setApiData(resp?.data)
        generateTableData(resp?.data)
      }
      setIsLoading(false)
    })()
  }, [refetch])
  useEffect(() => {
    getTooltipsData()
  }, [])
  useEffect(() => {
    if (editData?.seuID) {
      setOriginalData(editData)
      setShowEditModal(true)
    } else {
      setOriginalData(null)
    }
  }, [editData?.seuID])
  const addAudit = async () => {
    const filteredOriginalData = Object.keys(originalData)
      ?.filter((key) => editData.hasOwnProperty(key))
      ?.reduce((acc, key) => {
        acc[key] = originalData[key]
        return acc
      }, {})
    const auditPayload = {
      activityName: auditLogConfig?.activityName?.update,
      activityCategory: auditLogConfig?.activityCategory?.seuDetails,
      activitydescription:
        auditLogConfig?.activitydescription?.updateSeuDetails,
      target: auditLogConfig?.target?.seuDetails,
      targetValue: String(editData?.seuID),
      remarks: '',
      initial: safeBtoa(JSON.stringify(filteredOriginalData)),
      changes: safeBtoa(JSON.stringify(editData)),
    }
    await addAuditLog(auditPayload)
  }
  async function onSave(errors) {
    if (Object.keys(errors)?.length) {
      if (!window.confirm(userConfirmationMessage)) {
        return
      }
    }
    const payload = {
      caseID: caseID,
      seuID: editData?.seuID,
      seuName: editData?.seuName,
      baselineDutyExpression: editData?.baselineDutyExpression,
      actualDutyExpression: editData?.actualDutyExpression,
      targetDutyExpression: editData?.targetDutyExpression,
      seuCategory: editData?.seuCategory,
      seuDisplayName: editData?.seuDisplayName,
      baselineDutyExpressionGjph: editData?.baselineDutyExpressionGjph,
      actualDutyExpressionGjph: editData?.actualDutyExpressionGjph,
      targetDutyExpressionGjph: editData?.targetDutyExpressionGjph,
    }
    const resp = await updateSeuDetails(payload)
    if (resp?.statuscode === 200) {
      addAudit()
      alert('Record Updated successfully.')
    } else {
      alert('Unable to update data, please try again.')
    }
    setShowEditModal(false)
    setEditData(null)
    setOriginalData(null)
    setRefetch((p) => !p)
  }
  function onCancel() {
    if (
      detectModification(originalData, editData) &&
      !window.confirm(UNSAVED_CHANGES_WARNING)
    ) {
      return
    } else {
      setShowEditModal(false)
      setEditData(null)
      setOriginalData(null)
    }
  }
  return (
    <>
      {isLoading ? (
        <div
          className={`${styles.loader} ${styles.load} flexCenterContainer h-100`}
          data-static-id='SeuDetails.js_div_3e4d5a'
        >
          <Loader />
        </div>
      ) : (
        <div
          className={`${styles.seuDetailsWrapperContainer} h-100 position-relative`}
          data-static-id='SeuDetails.js_div_c84afe'
        >
          {apiData?.length > 0 && (
            <ConfigurationDownload
              extraStyle={{
                bottom: 'unset',
                top: '-5vmin',
                right: '1vmin',
                left: 'unset',
              }}
              headers={SEU_HEADER.slice(0, -1)}
              data={apiData}
              headersForXls={headersForXls}
              title={'SeuDetails'}
            />
          )}
          <SimpleTable
            data={tableData}
            headers={SEU_HEADER}
            customColumnWidths={[8, 8, 8, 9, 25, 25, 7]}
          />

          <CustomModal
            show={showEditModal}
            title={`${getValsBaseOnCondition(!readOnly, 'Edit', '')} Seu Details of seu ID ${editData?.seuID}`}
            hideModal={onCancel}
            modalHeight={'auto'}
            size={'lg'}
          >
            <SeuDetailsModal
              editData={editData}
              setEditData={setEditData}
              onSave={onSave}
              onCancel={onCancel}
              originalData={originalData}
              tooltips={tooltips}
              readOnly={readOnly}
            />
          </CustomModal>
        </div>
      )}
    </>
  )
}
