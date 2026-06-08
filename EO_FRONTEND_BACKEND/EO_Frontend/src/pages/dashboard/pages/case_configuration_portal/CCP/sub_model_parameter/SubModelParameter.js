import editIcon from 'assets/sabic_icons/header/edit_default_icon.svg'
import Loader from 'components/ui/loader/Loader'
import CustomModal from 'components/visuals/common/modal/CustomModal'
import SimpleTable from 'components/visuals/table/SimpleTable'
import { auditLogConfig } from 'config/Config'
import { useEffect, useState } from 'react'
import {
  addAuditLog,
  getSubModelParameter,
  updateSubModelParameter,
} from 'services/CCPServices'
import { getViewDataDictionaryByTablename } from 'services/ConfigServices'
import {
  detectModification,
  safeBtoa,
  UNSAVED_CHANGES_WARNING,
  userConfirmationMessage,
} from 'utills/utilities'
import ConfigurationDownload from '../../Configurationdownload/ConfigurationDownload'
import styles from '../CCP.module.scss'
import EditSubModelParameter from './EditSubModelParameter'
export const SubModel_HEADER = [
  'SUB MODEL NAME',
  'SUB MODEL VERSION',
  'PARAMETER',
  'VALUE',
  'ACTION',
]
const headersForXls = ['subModelName', 'subModelVersion', 'parameter', 'value']
export default function SubModelParameter({ caseID = null, canEdit = false }) {
  const [tableData, setTableData] = useState([])
  const [editData, setEditData] = useState(null)
  const [originalData, setOriginalData] = useState(null)
  const [apiData, setApiData] = useState(null)
  const [refetch, setRefetch] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [tooltips, setTooltips] = useState({})
  const getEditClass = (canEdit) => {
    if (canEdit) {
      return `cursor-pointer blueOnHover`
    }
  }
  const generateTableData = (data) => {
    setTableData(
      data?.map((obj) => {
        return [
          obj?.subModelName,
          obj?.subModelVersion,
          obj?.parameter,
          obj?.value,
          <button
            data-testid='edit-btn'
            key={`${obj?.subModelParameterID}-${obj?.subModelName}`}
            id='editicon-price-input'
            className={`${styles.editBtnImage} ${getEditClass(canEdit)}`}
            disabled={!canEdit}
            onClick={() => setEditData(obj)}
            data-static-id='SubModelParameter.js_button_4d0763'
          >
            <img
              src={editIcon}
              alt='edit icon'
              data-static-id='SubModelParameter.js_img_a334f9'
            />
          </button>,
        ]
      }),
    )
  }
  const getTooltipsData = async () => {
    const tooltipResp = await getViewDataDictionaryByTablename(
      'sub_model_parameter',
    )
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
      const resp = await getSubModelParameter(caseID)
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
    if (editData?.subModelParameterID) {
      setOriginalData(editData)
      setShowEditModal(true)
    } else {
      setOriginalData(null)
    }
  }, [editData?.subModelParameterID])
  const addAudit = async () => {
    const filteredOriginalData = Object.keys(originalData)
      ?.filter((key) => editData.hasOwnProperty(key))
      ?.reduce((acc, key) => {
        acc[key] = originalData[key]
        return acc
      }, {})
    const auditPayload = {
      activityName: auditLogConfig?.activityName?.update,
      activityCategory: auditLogConfig?.activityCategory?.subModelParameter,
      activitydescription:
        auditLogConfig?.activitydescription?.updateSubModelParameter,
      target: auditLogConfig?.target?.subModelParameterID,
      targetValue: String(editData?.subModelParameterID),
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
      subModelParameterId: editData?.subModelParameterID,
      value: editData?.value,
    }
    const resp = await updateSubModelParameter(payload)
    if (resp?.statuscode === 200) {
      addAudit()
      alert('Record Updated successfully.')
    } else {
      alert('Unable to update data, please try again.')
    }
    setShowEditModal(false)
    setOriginalData(null)
    setEditData(null)
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
          data-static-id='SubModelParameter.js_div_d7b36c'
        >
          <Loader />
        </div>
      ) : (
        <div
          className={`${styles.subModelWrapperContainer} h-100 position-relative`}
          data-static-id='SubModelParameter.js_div_9f49b9'
        >
          <SimpleTable
            data={tableData}
            headers={SubModel_HEADER}
            customColumnWidths={[20, 15, 10, 45, 10]}
          />
          {apiData?.length > 0 && (
            <ConfigurationDownload
              extraStyle={{
                bottom: 'unset',
                top: '-5vmin',
                right: '1vmin',
                left: 'unset',
              }}
              headers={SubModel_HEADER.slice(0, -1)}
              data={apiData}
              headersForXls={headersForXls}
              title={'SubModelParameter'}
            />
          )}
          <CustomModal
            show={showEditModal}
            title={`Edit Sub Model Parameter ID ${editData?.subModelParameterID}`}
            hideModal={onCancel}
            modalHeight={'auto'}
            size={'lg'}
          >
            <EditSubModelParameter
              editData={editData}
              setEditData={setEditData}
              onSave={onSave}
              onCancel={onCancel}
              originalData={originalData}
              tooltips={tooltips}
            />
          </CustomModal>
        </div>
      )}
    </>
  )
}
