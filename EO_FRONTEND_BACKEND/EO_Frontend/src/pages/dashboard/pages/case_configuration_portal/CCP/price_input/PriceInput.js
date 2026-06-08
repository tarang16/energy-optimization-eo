import editIcon from 'assets/sabic_icons/header/edit_default_icon.svg'
import Loader from 'components/ui/loader/Loader'
import CustomModal from 'components/visuals/common/modal/CustomModal'
import SimpleTable from 'components/visuals/table/SimpleTable'
import { auditLogConfig, maxLengthInput } from 'config/Config'
import { useEffect, useState } from 'react'
import { addAuditLog, updateOptimizationPriceInput } from 'services/CCPServices'
import { getOptimizationPrice } from 'services/OptimizationService'
import {
  detectModification,
  safeBtoa,
  UNSAVED_CHANGES_WARNING,
  valueFormatter,
} from 'utills/utilities'
import AuditLogs from '../../AuditLogs'
import ConfigurationDownload from '../../Configurationdownload/ConfigurationDownload'
import styles from '../CCP.module.scss'
export const PRICE_INPUT_HEADER = ['FEED STOCK', 'CURRENT VALUE', 'ACTION']
const headersForXls = ['displayName', 'currentValue']
export default function PriceInput({ caseId = null, canEdit = false }) {
  const [tableData, setTableData] = useState([])
  const [editData, setEditData] = useState(null)
  const [originalData, setOriginalData] = useState(null)
  const [apiData, setApiData] = useState(null)
  const [refetch, setRefetch] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [initialData, setInitialData] = useState(null)
  const getEditClass = (canEdit) => {
    if (canEdit) {
      return `cursor-pointer blueOnHover`
    } else {
      return `disabledImg`
    }
  }
  useEffect(() => {
    ;(async () => {
      setIsLoading(true)
      const resp = await getOptimizationPrice(caseId)
      if (resp?.data?.length > 0) {
        setIsLoading(true)
        setApiData(resp?.data)
        const tempTableData = resp?.data?.map((obj) => [
          `${obj?.displayName} ${obj?.uomName ? '(' + obj?.uomName + ')' : ''}`,
          valueFormatter(obj?.currentValue),
          <button
            key={`${obj?.displayName}-${obj?.uomName}`}
            id='editicon-price-input'
            className={`${styles.editBtnImage} ${getEditClass(canEdit)}`}
            disabled={!canEdit}
            onClick={() => setEditData(obj)}
            aria-label='edit icon'
            data-static-id='PriceInput.js_button_b50305'
          >
            <img
              src={editIcon}
              alt='edit icon'
              data-static-id='PriceInput.js_img_50af3e'
            />
          </button>,
        ])
        setTableData(tempTableData)
      }
      setIsLoading(false)
    })()
  }, [refetch])
  useEffect(() => {
    if (initialData == null && editData !== null) {
      setInitialData(editData)
    }
    if (editData?.modelTagId) {
      setOriginalData(editData)
      setShowEditModal(true)
    } else {
      setOriginalData(null)
    }
  }, [editData?.modelTagId])
  const addAudit = async () => {
    const filteredOriginalData = Object.keys(originalData)
      ?.filter((key) => editData.hasOwnProperty(key))
      ?.reduce((acc, key) => {
        acc[key] = originalData[key]
        return acc
      }, {})
    const auditPayload = {
      activityName: auditLogConfig?.activityName?.update,
      activityCategory: auditLogConfig?.activityCategory?.priceInput,
      activitydescription:
        auditLogConfig?.activitydescription?.updatePriceInput,
      target: auditLogConfig?.target?.priceInput,
      targetValue: String(editData?.modelTagId),
      remarks: '',
      initial: safeBtoa(JSON.stringify(filteredOriginalData)),
      changes: safeBtoa(JSON.stringify(editData)),
    }
    await addAuditLog(auditPayload)
  }
  async function onSave() {
    if (editData.modelTagId && editData.currentValue) {
      const payload = {
        caseId: caseId,
        modelTagId: editData.modelTagId,
        currentValue: editData.currentValue,
      }
      const resp = await updateOptimizationPriceInput(payload)
      if (resp?.statuscode === 200) {
        addAudit()
        alert('Record Updated successfully.')
        setInitialData(null)
      } else {
        alert('Unable to update data, please try again.')
      }
      setShowEditModal(false)
      setEditData(null)
      setRefetch((p) => !p)
    } else {
      alert('Please fill valid values.')
    }
  }
  function onCancel() {
    if (
      detectModification(initialData, editData) &&
      !window.confirm(UNSAVED_CHANGES_WARNING)
    ) {
      return
    } else {
      setShowEditModal(false)
      setEditData(null)
    }
  }
  const formatCurrentValue = (currentValue) => {
    if (!currentValue) return ''
    const valueStr = String(currentValue)
    if (valueStr.includes('.')) {
      const [integerPart, decimalPart] = valueStr.split('.')
      if (decimalPart.length > 2) {
        return `${parseFloat(valueStr).toFixed(2)}`
      }
      return `${integerPart}.${decimalPart.slice(0, 2)}`
    }
    return valueStr
  }
  return (
    <>
      {isLoading ? (
        <div
          className={`${styles.loader} ${styles.load} flexCenterContainer h-100`}
          data-static-id='PriceInput.js_div_3af760'
        >
          <Loader id='loading-spinner' />
        </div>
      ) : (
        <>
          {apiData?.length > 0 && (
            <ConfigurationDownload
              extraStyle={{
                bottom: 'unset',
                top: '0.1vmin',
                right: '1vmin',
                left: 'unset',
              }}
              headers={PRICE_INPUT_HEADER.slice(0, -1)}
              data={apiData}
              headersForXls={headersForXls}
              title={'priceInput'}
            />
          )}
          <SimpleTable data={tableData} headers={PRICE_INPUT_HEADER} />

          <CustomModal
            show={showEditModal}
            title={`Edit ${editData?.displayName}`}
            hideModal={() => {
              onCancel()
              setEditData(null)
            }}
            modalHeight={'auto'}
            size={'lg'}
            data-testid='modal'
          >
            <div
              className='w-100 h-100 d-flex flex-column justify-content-between'
              data-static-id='PriceInput.js_div_b3c17d'
            >
              <div data-static-id='PriceInput.js_div_260aa6'>
                <div
                  className={`${styles.boundField} mb-2`}
                  data-static-id='PriceInput.js_div_6a5d39'
                >
                  <label
                    className='text-12-bold text-uppercase'
                    data-static-id='PriceInput.js_label_935a6e'
                  >
                    Tag Name :{' '}
                  </label>
                  <input
                    id='Tag-name'
                    className='form-control text-12-regular text-uppercase h-100'
                    type='text'
                    value={editData?.tagName}
                    disabled
                    readOnly
                    data-static-id='PriceInput.js_input_bd63b9'
                  />
                </div>
                <div
                  className={`${styles.boundField} mb-2`}
                  data-static-id='PriceInput.js_div_d43c31'
                >
                  <label
                    htmlFor='currentValue'
                    className='text-12-bold text-uppercase'
                    data-static-id='PriceInput.js_label_fde34e'
                  >
                    Current Value :{' '}
                  </label>
                  <input
                    id='currentValue'
                    className='form-control text-12-regular text-uppercase h-100'
                    type='number'
                    value={formatCurrentValue(editData?.currentValue)}
                    onChange={(ev) => {
                      const inputValue = ev.target.value.slice(
                        0,
                        maxLengthInput,
                      )
                      setEditData((prev) => ({
                        ...prev,
                        currentValue: formatCurrentValue(inputValue),
                      }))
                    }}
                    data-static-id='PriceInput.js_input_2c9e0b'
                  />
                </div>
              </div>

              <div
                className={`w-100 d-flex justify-content-between`}
                data-static-id='PriceInput.js_div_247342'
              >
                <AuditLogs
                  tag={auditLogConfig?.target?.priceInput}
                  tagId={editData?.modelTagId}
                  resetFunction={(defaultData) => setEditData(defaultData)}
                />

                <div
                  className={`d-flex justify-content-center ${styles.boundFieldBtnContainer}`}
                  data-static-id='PriceInput.js_div_c63319'
                >
                  <button
                    disabled={!detectModification(initialData, editData)}
                    onClick={() => onSave()}
                    className={`text-12-regular ${styles.saveBtn} pt-1 text-uppercase ${!detectModification(initialData, editData) ? '' : 'disable'}`}
                    data-static-id='PriceInput.js_button_891a8d'
                  >
                    Submit
                  </button>
                  <button
                    className={`text-12-regular text-uppercase pt-1 ${styles.cancelBtn}`}
                    onClick={() => onCancel()}
                    data-static-id='PriceInput.js_button_f9efb1'
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </CustomModal>
        </>
      )}
    </>
  )
}
