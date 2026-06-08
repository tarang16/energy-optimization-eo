import editIcon from 'assets/sabic_icons/header/edit_default_icon.svg'
import Loader from 'components/ui/loader/Loader'
import CustomModal from 'components/visuals/common/modal/CustomModal'
import SimpleTable from 'components/visuals/table/SimpleTable'
import { auditLogConfig } from 'config/Config'
import { useEffect, useState } from 'react'
import { addAuditLog, getSubModel, updateSubModel } from 'services/CCPServices'
import { getViewDataDictionaryByTablename } from 'services/ConfigServices'
import {
  detectModification,
  safeBtoa,
  UNSAVED_CHANGES_WARNING,
  userConfirmationMessage,
} from 'utills/utilities'
import ConfigurationDownload from '../../Configurationdownload/ConfigurationDownload'
import styles from '../CCP.module.scss'
import EditSubModel from './EditSubModel'
export const SubModel_HEADER = [
  'TAG NAME',
  'SUB MODEL TYPE',
  'ORDER',
  'SUB MODEL EXPRESSION',
  'ACTION',
]
const headersForXls = ['tagName', 'subModelName', 'order', 'subModelExpression']
export default function SubModel({ caseID = null, canEdit = false }) {
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
    } else {
      return `disabledImg`
    }
  }
  const generateTableData = (data) => {
    setTableData(
      data?.map((obj) => {
        return [
          obj?.tagName,
          obj?.subModelType,
          obj?.order,
          obj?.subModelExpression,
          <button
            data-testid='edit-btn'
            key={`${obj?.tagName}-${obj?.order}`}
            id='editicon-price-input'
            className={`${styles.editBtnImage} ${getEditClass(canEdit)}`}
            disabled={!canEdit}
            onClick={() => setEditData(obj)}
            data-static-id='SubModel.js_button_79377a'
          >
            <img
              src={editIcon}
              alt='edit icon'
              data-static-id='SubModel.js_img_cf73b7'
            />
          </button>,
        ]
      }),
    )
  }
  const getTooltipsData = async () => {
    const tooltipResp = await getViewDataDictionaryByTablename('sub_model')
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
      const resp = await getSubModel(caseID)
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
    if (editData?.subModelID) {
      setOriginalData(editData)
      setShowEditModal(true)
    } else {
      setOriginalData(null)
    }
  }, [editData?.subModelID])
  const addAudit = async () => {
    const filteredOriginalData = Object.keys(originalData)
      ?.filter((key) => editData.hasOwnProperty(key))
      ?.reduce((acc, key) => {
        acc[key] = originalData[key]
        return acc
      }, {})
    const auditPayload = {
      activityName: auditLogConfig?.activityName?.update,
      activityCategory: auditLogConfig?.activityCategory?.subModel,
      activitydescription: auditLogConfig?.activitydescription?.updateSubModel,
      target: auditLogConfig?.target?.subModel,
      targetValue: String(editData?.subModelID),
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
      caseID: Number(caseID),
      subModelID: editData?.subModelID,
      subModelName: editData?.subModelName,
      subModelType: editData?.subModelType,
      order: editData?.order,
      responseOutput: editData?.responseOutput,
      subModelExpression: editData?.subModelExpression,
    }
    const resp = await updateSubModel(payload)
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
          data-static-id='SubModel.js_div_fc578c'
        >
          <Loader />
        </div>
      ) : (
        <div
          className={`${styles.subModelWrapperContainer} h-100 position-relative`}
          data-static-id='SubModel.js_div_067f86'
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
              title={'SubModel'}
            />
          )}
          <CustomModal
            show={showEditModal}
            title={`Edit Sub Model of sub Model ID ${editData?.subModelID}`}
            hideModal={onCancel}
            modalHeight={'auto'}
            size={'lg'}
          >
            <EditSubModel
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
