import { AppAtom } from 'atoms/AppAtom'
import { CCPTagsValidationData } from 'atoms/CCPAtom'
import { TRACKEVENTOBJ } from 'config/ActivityTrackerConfig'
import { useAtomValue } from 'jotai'
import { useEffect, useState } from 'react'
import { useOutletContext, useParams } from 'react-router-dom'
import {
  deleteTag,
  getBlockDetails,
  getModelNamesByCaseID,
} from 'services/CCPServices'
import {
  getValidUoms,
  getViewDataDictionaryByTablename,
} from 'services/ConfigServices'
import { showToast } from 'utills/utilities'
import styles from '../CaseConfigurationPortal.module.scss'
import CCPTagsEditModal_EO from './ccpTagsEditModal_EO'
import TagsTable from './tags_table/tagsTable'
export default function TagDetails({ canEdit = false }) {
  const ctxData = useAtomValue(AppAtom)
  const caseData = ctxData?.caseData || []
  const params = useParams()
  // @ts-ignore
  const { caseId } = useOutletContext()
  const [editedData, setEditedData] = useState({
    data: {},
    showModal: false,
    isEditMode: false,
  })
  const validationData = useAtomValue(CCPTagsValidationData)
  const [tooltips, setTooltips] = useState([])
  const [tagTypes, setTagTypes] = useState([])
  const [dataTypes, setDataTypes] = useState([])
  const [blockNames, setBlockNames] = useState([])
  const [modelNames, setModelNames] = useState([])
  const [uomData, setUomData] = useState([])
  const [refetch, setRefetch] = useState(false)
  const fetchAndSaveBlockNameData = async () => {
    const resp = await getBlockDetails()
    setBlockNames(
      resp?.data?.map((block) => ({
        ...block,
        label: block?.blockname,
        value: block?.blockname,
      })),
    )
  }
  const fetchAndSaveModelNameData = async () => {
    const resp = await getModelNamesByCaseID(caseId)
    setModelNames(
      resp?.data?.map((model) => ({
        ...model,
        label: model?.ModelName,
        value: model?.ModelName,
      })),
    )
  }
  const fetchAndSaveUomData = async () => {
    const resp = await getValidUoms()
    setUomData(
      resp?.data?.map((UomObj) => ({
        ...UomObj,
        label: UomObj?.uomName,
        value: UomObj?.uomName,
      })),
    )
  }
  useEffect(() => {
    if (caseId) {
      getTooltipsData()
      fetchAndSaveModelNameData()
      fetchAndSaveBlockNameData()
      fetchAndSaveUomData()
    }
  }, [caseId])
  const mapColumnValue = {
    tag_id: 'tagID',
    tag_name: 'tagName',
    tag_type: 'tagType',
    pi_name: 'piName',
    data_type: 'dataType',
    ui_display_name: 'uiDisplayName',
    description: 'description',
    uom_name: 'uom',
    flag_output_run_always: 'flagOutputRunAlways',
    flag_ma: 'flagMA',
    flag_data_available_check: 'flagDataAvailableCheck',
    flag_output: 'flagOutput',
    design_expression: 'designExpression',
    polarity_expression: 'polarityExpression',
    inferred_detail_id: 'inferredExpression',
    model_name: 'model_name',
    model_description: 'model_description',
  }
  const modifyToolTipColumnValue = (tooltipData) => {
    return tooltipData?.map((obj) => ({
      ...obj,
      columnName: mapColumnValue[obj?.columnName],
    }))
  }
  async function getTooltipsData() {
    const tooltip_resp = await getViewDataDictionaryByTablename(
      'Tag,tag_details,unit_of_measurement,model,model_tag,inferred_details',
    )
    setTooltips(modifyToolTipColumnValue(tooltip_resp?.data))
  }
  function closeModalCancel(isEditMode = true) {
    TRACKEVENTOBJ.CCPTags.onBtnClick({
      btnName: 'CLOSE',
      params: params,
      caseData: caseData,
    })
    setEditedData({
      data: {},
      showModal: false,
      isEditMode: false,
    })
  }
  function onEditClick(obj) {
    TRACKEVENTOBJ.CCPTags.onEditTag({
      btnName: 'EDIT',
      value: obj?.tagID,
      params: params,
      caseData: caseData,
    })
    setEditedData({
      data: obj,
      showModal: true,
      isEditMode: true,
    })
  }
  function onInfoClick(obj) {
    TRACKEVENTOBJ.CCPTags.onEditTag({
      btnName: 'INFO',
      value: obj?.tagID,
      params: params,
      caseData: caseData,
    })
    setEditedData({
      data: obj,
      showModal: true,
      isEditMode: false,
    })
  }
  const onDeleteClick = async (tableRow) => {
    const isConfirmed = window.confirm('Are you sure you want to delete?')
    if (!isConfirmed) {
      return
    }
    const resp = await deleteTag(tableRow?.tagID)
    if (resp?.statuscode === 200) {
      showToast('Tag Deleted successfully...', 'success')
      setRefetch((pre) => !pre)
    } else {
      showToast(resp?.error, 'error')
    }
  }
  const closeModalRefetch = () => {
    setRefetch((pre) => !pre)
    setEditedData({
      data: {},
      showModal: false,
      isEditMode: false,
    })
  }
  return (
    <div
      className={
        'h-100 w-100 d-flex align-itemsumn text-14-regular-center justify-content-center'
      }
      data-static-id='tagDetails.js_div_373888'
    >
      {!caseId ? (
        <h1
          className='text-20-regular'
          data-static-id='tagDetails.js_h1_510967'
        >
          Invalid Case, can't show data.
        </h1>
      ) : (
        <div
          className={`w-100 h-100 ${styles.ccpTagsContainer}`}
          data-static-id='tagDetails.js_div_8661b7'
        >
          <div
            className={`${styles.ccptagsContainer__bottom}`}
            data-static-id='tagDetails.js_div_e99730'
          >
            <TagsTable
              onInfoClick={onInfoClick}
              onEditClick={onEditClick}
              onDeleteClick={onDeleteClick}
              setTagTypes={setTagTypes}
              setDataTypes={setDataTypes}
              modelNamesDropDownOptions={modelNames}
              uomDropDownOptions={uomData}
              canEdit={canEdit}
              validationData={validationData}
              tooltips={tooltips}
              refetch={refetch}
              setRefetch={setRefetch}
            />
          </div>
          <CCPTagsEditModal_EO
            editedData={editedData}
            validationData={validationData}
            closeModalCancel={closeModalCancel}
            tooltips={tooltips}
            tagTypes={tagTypes}
            blockNames={blockNames}
            uomDropDownOptions={uomData}
            dataTypes={dataTypes.filter((x) => !!x)}
            setIsDirty={(p) => {}}
            closeModalRefetch={closeModalRefetch}
          />
        </div>
      )}
    </div>
  )
}
