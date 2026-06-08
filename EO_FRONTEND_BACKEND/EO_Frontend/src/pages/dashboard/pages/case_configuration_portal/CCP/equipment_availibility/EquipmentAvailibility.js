import infoIcon from 'assets/sabic_icons/common/timeInfo.svg'
import editIcon from 'assets/sabic_icons/header/edit_default_icon.svg'
import Loader from 'components/ui/loader/Loader'
import CustomModal from 'components/visuals/common/modal/CustomModal'
import SimpleTable from 'components/visuals/table/SimpleTable'
import { auditLogConfig } from 'config/Config'
import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { addAuditLog, updateEquipementAvailability } from 'services/CCPServices'
import { getConfigEquipmentAvailability } from 'services/OptimizationService'
import {
  detectModification,
  getValsBaseOnCondition,
  groupBy,
  safeBtoa,
  UNSAVED_CHANGES_WARNING,
} from 'utills/utilities'
import AuditLogs from '../../AuditLogs'
import ConfigurationDownload from '../../Configurationdownload/ConfigurationDownload'
import styles from '../CCP.module.scss'
export const TABLE_HEADER = ['Asset', 'Available', 'Action']
export const EQP_TABLE_HEADER = ['Asset', 'Availibility', 'Must Run']
function getEquipmentAvailabilityValues(
  assetData,
  canEdit,
  setEditData,
  setReadOnly,
) {
  const finalDict = []
  Object.entries(groupBy(assetData, (x) => x.equipmentCategory)).forEach(
    ([key, vals]) => {
      finalDict.push({
        assetName: key,
        available: vals?.reduce((acc, curr) => {
          if (curr?.availability) {
            acc += 1
          }
          return acc
        }, 0),
        categoryData: vals,
      })
    },
  )
  return finalDict?.map((obj) => {
    return [
      obj?.assetName,
      obj?.available,
      <div
        key={`${obj?.assetName}-${obj?.available}`}
        className='d-flex align-items-center justify-content-center gap-2'
        data-static-id='EquipmentAvailibility.js_div_88b79d'
      >
        <button
          id='info-icon-constraints'
          className={`${styles.editBtnImage} mx-0`}
          onClick={() => {
            setReadOnly(true)
            setEditData(obj?.categoryData)
          }}
          data-static-id='EquipmentAvailibility.js_button_a1bcc0'
        >
          <img
            src={infoIcon}
            alt='info icon'
            data-static-id='EquipmentAvailibility.js_img_e335ce'
          />
        </button>
        <button
          id='editicon-equipment-availiability'
          className={`${styles.editBtnImage} mx-0 ${getValsBaseOnCondition(canEdit, 'cursor-pointer blueOnHover', 'disabledImg')}`}
          disabled={!canEdit}
          onClick={() => {
            setReadOnly(false)
            setEditData(obj?.categoryData)
          }}
          data-static-id='EquipmentAvailibility.js_button_13f6eb'
        >
          <img
            alt='edit icon'
            src={editIcon}
            data-static-id='EquipmentAvailibility.js_img_0b29aa'
          />
        </button>
      </div>,
    ]
  })
}
const headersForXls = ['equipmentCategory', 'equipmentAvailabilityId']
export default function EquipmentAvailibility({
  caseId = null,
  canEdit = false,
}) {
  const [EqpData, setEqpData] = useState([])
  const [editData, setEditData] = useState([])
  const [originalData, setOriginalData] = useState([])
  const [refetch, setRefetch] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [readOnly, setReadOnly] = useState(true)
  const location = useLocation()
  const selectedEquipment = location?.state?.selectedEquipment
  useEffect(() => {
    ;(async () => {
      setIsLoading(true)
      const resp = await getConfigEquipmentAvailability(caseId)
      setEqpData(resp?.data ?? [])
      setIsLoading(false)
    })()
  }, [refetch])
  useEffect(() => {
    if (editData?.length > 0) {
      setOriginalData(editData)
      setShowEditModal(true)
    } else {
      setOriginalData(null)
    }
  }, [editData?.length])
  useEffect(() => {
    if (canEdit && selectedEquipment && selectedEquipment?.length > 0) {
      setEditData(selectedEquipment)
      setReadOnly(false)
    }
  }, [selectedEquipment])
  const addAudit = async () => {
    const filteredOriginalData = originalData?.map(
      ({ equipmentAvailabilityId, ...data }) => data,
    )
    const filteredEditData = editData?.map(
      ({ equipmentAvailabilityId, ...data }) => data,
    )
    const auditPayload = {
      activityName: auditLogConfig?.activityName?.update,
      activityCategory: auditLogConfig?.activityCategory?.equipmentAvailability,
      activitydescription:
        auditLogConfig?.activitydescription?.updateEquipmentAvailability,
      target: editData[0]?.equipmentCategory,
      targetValue: String(caseId),
      remarks: '',
      initial: safeBtoa(JSON.stringify(filteredOriginalData)),
      changes: safeBtoa(JSON.stringify(filteredEditData)),
    }
    await addAuditLog(auditPayload)
  }
  async function onSave() {
    if (editData?.length > 0) {
      const payload = []
      let isDirty = false
      editData?.forEach((obj, idx) => {
        if (detectModification(obj, originalData[idx])) {
          payload.push({
            equipmentId: obj.equipmentId,
            availability: obj.availability,
            mustRun: obj.mustRun,
          })
        }
      })
      const resp = await updateEquipementAvailability({
        equipmentData: payload,
      })
      if (resp?.statuscode === 200) {
        addAudit()
        alert('Record Updated successfully.')
      } else {
        isDirty = true
        alert('Unable to update data, please try again.')
      }
      onCancel(true, isDirty)
    } else {
      alert('Please fill valid values.')
    }
  }
  function onCancel(fromSaveFn = false, saveDirty = false) {
    if (fromSaveFn) {
      if (!saveDirty) {
        setRefetch((p) => !p)
        setShowEditModal(false)
        setEditData([])
      }
    } else {
      if (
        detectModification(originalData, editData) &&
        !window.confirm(UNSAVED_CHANGES_WARNING)
      ) {
        return
      }
      setShowEditModal(false)
      setEditData([])
    }
  }
  const getSetEditData = (p, ev, obj, type) => {
    if (type === 'availability') {
      return p?.map((prv) => {
        if (prv?.equipmentName === obj?.equipmentName) {
          return {
            ...obj,
            availability: !obj?.availability,
            mustRun: getValsBaseOnCondition(
              ev.target.checked,
              obj?.mustRun,
              false,
            ),
          }
        } else {
          return prv
        }
      })
    } else {
      return p?.map((prv) => {
        if (prv?.equipmentName === obj?.equipmentName) {
          return {
            ...obj,
            mustRun: getValsBaseOnCondition(
              obj?.availability,
              !obj?.mustRun,
              false,
            ),
          }
        } else {
          return prv
        }
      })
    }
  }
  return (
    <>
      {isLoading ? (
        <div
          className={`${styles.loader} ${styles.load} d-flex justify-content-center align-items-center h-100`}
          data-static-id='EquipmentAvailibility.js_div_2a849b'
        >
          <Loader />
        </div>
      ) : (
        <>
          {EqpData?.length > 0 && (
            <ConfigurationDownload
              extraStyle={{
                bottom: 'unset',
                top: '0.1vmin',
                right: '1vmin',
                left: 'unset',
              }}
              headers={TABLE_HEADER.slice(0, -1)}
              data={EqpData}
              headersForXls={headersForXls}
              title={'Equipment Availibility'}
            />
          )}
          <SimpleTable
            data={getEquipmentAvailabilityValues(
              EqpData,
              canEdit,
              (categoryData) => {
                setEditData(categoryData)
              },
              setReadOnly,
            )}
            headers={TABLE_HEADER}
            customColumnWidths={[50, 30, 20]}
          />

          <CustomModal
            show={showEditModal}
            title={`${getValsBaseOnCondition(!readOnly, 'EDIT', '')} EQUIPMENT AVAILABILITY - ${editData[0]?.equipmentCategory}`}
            hideModal={() => {
              onCancel()
            }}
            modalHeight={'40vmin'}
            size={'lg'}
          >
            <div
              className={`h-100 d-flex flex-column justify-content-between`}
              data-static-id='EquipmentAvailibility.js_div_b916f9'
            >
              <div
                className={`${styles.equipementTableContainer} table-responsive`}
                data-static-id='EquipmentAvailibility.js_div_06e2e6'
              >
                <table
                  className={`${styles.table}`}
                  data-static-id='EquipmentAvailibility.js_table_6f7145'
                >
                  <thead data-static-id='EquipmentAvailibility.js_thead_aa9094'>
                    <tr data-static-id='EquipmentAvailibility.js_tr_d3a5a6'>
                      {EQP_TABLE_HEADER.map((header) => (
                        <th
                          className='text-14-regular text-uppercase'
                          key={header}
                          data-static-id='EquipmentAvailibility.js_th_b7b963'
                        >
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody data-static-id='EquipmentAvailibility.js_tbody_b1afc2'>
                    {editData?.map((obj) => {
                      return (
                        <tr
                          key={`${obj?.equipmentCategory}-${obj?.equipmentAvailabilityId}-${obj?.equipmentType}-${obj?.equipmentName}`}
                          data-static-id='EquipmentAvailibility.js_tr_1c3610'
                        >
                          <td
                            className='text-14-regular'
                            data-static-id='EquipmentAvailibility.js_td_303f33'
                          >
                            {obj?.equipmentName}
                          </td>
                          <td
                            className='text-14-regular text-center'
                            data-static-id='EquipmentAvailibility.js_td_de2c95'
                          >
                            <input
                              type='checkbox'
                              className='form-check-input'
                              checked={obj?.availability}
                              disabled={readOnly}
                              onChange={(ev) => {
                                setEditData((p) =>
                                  getSetEditData(p, ev, obj, 'availability'),
                                )
                              }}
                              data-static-id='EquipmentAvailibility.js_input_9596a2'
                            />
                          </td>
                          <td
                            className='text-14-regular text-center'
                            data-static-id='EquipmentAvailibility.js_td_26c89b'
                          >
                            <input
                              type='checkbox'
                              className='form-check-input'
                              checked={obj?.availability && obj?.mustRun}
                              disabled={!obj?.availability || readOnly}
                              onChange={(ev) => {
                                setEditData((p) =>
                                  getSetEditData(
                                    p,
                                    ev,
                                    obj,
                                    'availability_mustRun',
                                  ),
                                )
                              }}
                              data-static-id='EquipmentAvailibility.js_input_94b4f1'
                            />
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              <div
                className={`w-100 d-flex justify-content-between`}
                data-static-id='EquipmentAvailibility.js_div_fcaa90'
              >
                <AuditLogs
                  tag={editData[0]?.equipmentCategory}
                  tagId={caseId}
                  resetFunction={(defaultData) => setEditData(defaultData)}
                  tabName='equipmentCategory'
                  showReset={!readOnly}
                />
                {!readOnly && (
                  <div
                    className={`${styles.boundFieldBtnContainer}`}
                    data-static-id='EquipmentAvailibility.js_div_c2f8ae'
                  >
                    <button
                      id='save-btn'
                      className={`text-12-regular text-uppercase ${styles.saveBtn} pt-1 text-uppercase`}
                      disabled={!detectModification(originalData, editData)}
                      onClick={() => onSave()}
                      data-static-id='EquipmentAvailibility.js_button_661e10'
                    >
                      Submit
                    </button>
                    <button
                      id='cancel-btn'
                      className={`text-12-regular text-uppercase ${styles.cancelBtn} pt-1 text-uppercase`}
                      onClick={() => onCancel()}
                      data-static-id='EquipmentAvailibility.js_button_bd62dd'
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>
          </CustomModal>
        </>
      )}
    </>
  )
}
