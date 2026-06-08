import infoIcon from 'assets/sabic_icons/common/timeInfo.svg'
import editIcon from 'assets/sabic_icons/header/edit_default_icon.svg'
import Switch from 'components/ui/switch/Switch'
import TooltipOverlay from 'components/visuals/common/custom_tooltip/CustomOverlayTooltip'
import CustomModal from 'components/visuals/common/modal/CustomModal'
import FormulaBox from 'components/visuals/formula_box/FormulaBox'
import Table from 'components/visuals/table/Table'
import {
  auditLogConfig,
  maxLengthInput,
  submitConfirmationMessage,
  userConfirmationMessage,
  userWarningMessage,
} from 'config/Config'
import { useEffect, useMemo, useState } from 'react'
import { Button, OverlayTrigger, Tooltip } from 'react-bootstrap'
import {
  addAuditLog,
  addTrnODSSuggestion,
  getTagsDataForValidation,
  getTrnOdsSuggestionByCaseId,
} from 'services/CCPServices'
import { getViewDataDictionaryByTablename } from 'services/ConfigServices'
import {
  getValsBaseOnCondition,
  isValidString,
  safeBtoa,
  showToast,
} from 'utills/utilities'
import AuditLogs from '../AuditLogs'
import TooltipContent from '../ccp_tags/TooltipContent'
import ConfigurationDownload from '../Configurationdownload/ConfigurationDownload'
import styles from './Suggestion.module.scss'
const defaultError = {
  cause: '',
  suggestions: '',
  causeFormula: '',
  isValidFormula: true,
}
const generateToolTip = (defaultTooltips, columnName, tableName) => {
  return (
    <span className='ms-1' data-static-id='Suggestion.js_span_cd0bce'>
      <OverlayTrigger
        placement='right'
        overlay={(props) => (
          <Tooltip {...props} data-static-id='Suggestion.js_Tooltip_6d8f72'>
            <div
              className={`text-14-bold text_primary_white text-uppercase p-1 text-start`}
              data-static-id='Suggestion.js_div_1cdd92'
            >
              <TooltipContent
                tooltipData={defaultTooltips?.find(
                  (t) =>
                    t.columnName === columnName && t.tableName === tableName,
                )}
              />
            </div>
          </Tooltip>
        )}
      >
        <img
          src={infoIcon}
          alt='infoIcon'
          className={`${'cursor-pointer blueOnHover'} ${styles.editIcon}`}
          data-static-id='Suggestion.js_img_59b950'
        />
      </OverlayTrigger>
    </span>
  )
}
const TooltipComp = (props) => (
  <Tooltip {...props} data-static-id='Suggestion.js_Tooltip_3d0dd5'>
    <span
      className='text-12-regular d-flex text-white text-uppercase'
      data-static-id='Suggestion.js_span_a78923'
    >
      please modify values or submit all required values
    </span>
  </Tooltip>
)
const Suggestion = ({ caseId = '', canEdit = false, tooltips = {} }) => {
  const HEADERS = ['CAUSE', 'SUGGESTION', 'EDIT']
  const [isLoading, setIsLoading] = useState(true)
  const [insights, setInsights] = useState([])
  const [filteredData, setFilteredData] = useState([])
  const [selectedItem, setSelectedItem] = useState(null)
  const [originalSelectedItem, setOriginalSelectedItem] = useState(null)
  const [show, setShow] = useState(false)
  const [infoShow, setInfoShow] = useState(false)
  const [resetToDefault, setResetToDefault] = useState(false)
  const [tempSelectedItem, setTempSelectedItem] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [error, setError] = useState(defaultError)
  const [validationData, setValidationData] = useState([])
  const [originalData, setOriginalData] = useState([])
  const [defaultTooltips, setDefaultTooltips] = useState([])
  useEffect(() => {
    getTooltipsData()
  }, [])
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value)
  }
  useEffect(() => {
    filterAndProcessData(originalData)
  }, [searchTerm])
  const handleResetSwitch = (isChecked) => {
    setResetToDefault(isChecked.target.checked)
    if (selectedItem) {
      if (isChecked.target.checked) {
        setTempSelectedItem({
          ...selectedItem,
          causeFormula: selectedItem.causeFormula ?? '',
          causeMessage: selectedItem.causeMessage ?? '',
          causeSuggestion: selectedItem.causeSuggestion ?? '',
        })
        setSelectedItem({
          ...selectedItem,
          causeFormula: getValsBaseOnCondition(
            selectedItem.causeFormulaDefault,
            selectedItem.causeFormulaDefault,
            '',
          ),
          causeMessage: getValsBaseOnCondition(
            selectedItem.causeMessageDefault,
            selectedItem.causeMessageDefault,
            '',
          ),
          causeSuggestion: getValsBaseOnCondition(
            selectedItem.causeSuggestionDefault,
            selectedItem.causeSuggestionDefault,
            '',
          ),
        })
      } else {
        if (tempSelectedItem) {
          setSelectedItem(tempSelectedItem)
        } else {
          setSelectedItem({
            ...selectedItem,
            causeFormula: getValsBaseOnCondition(
              selectedItem.causeFormula,
              selectedItem.causeFormula,
              '',
            ),
            causeMessage: getValsBaseOnCondition(
              selectedItem.causeMessage,
              selectedItem.causeMessage,
              '',
            ),
            causeSuggestion: getValsBaseOnCondition(
              selectedItem.causeSuggestion,
              selectedItem.causeSuggestion,
              '',
            ),
          })
        }
      }
    }
  }
  const processTableData = (filteredTableData) => {
    const filteredInsights = filteredTableData?.map((item, i) => {
      return [
        item?.causeMessage,
        item?.causeSuggestion,
        <>
          <span
            className={`me-3 ${styles.img}`}
            data-static-id='Suggestion.js_span_af69f4'
          >
            <img
              id={`info-${item.causeTagID}`}
              data-testid={`info-${item.causeTagID}`}
              src={infoIcon}
              alt='infoIcon'
              className={`${'cursor-pointer blueOnHover'} ${styles.editIcon}`}
              onClick={() => {
                handleInfoClick(item)
              }}
              data-static-id='Suggestion.js_img_b4781c'
            />
          </span>
          <span
            key={item.causeTagID}
            className={styles.img}
            data-static-id='Suggestion.js_span_e91eb4'
          >
            {!canEdit ? (
              <TooltipOverlay
                placement='left'
                message='You need developer access to edit this data'
              >
                <img
                  src={editIcon}
                  className={`disabledImg ${styles.editIcon}`}
                  onClick={() => {}}
                  data-static-id='Suggestion.js_img_900f21'
                />
              </TooltipOverlay>
            ) : (
              <TooltipOverlay placement='left' message='Edit'>
                <img
                  id={`edit-${item.causeTagID}`}
                  data-testid={`edit-${item.causeTagID}`}
                  src={editIcon}
                  className={`cursor-pointer blueOnHover ${styles.editIcon}`}
                  onClick={() => {
                    handleEditClick(item)
                  }}
                  data-static-id='Suggestion.js_img_6d0fd1'
                />
              </TooltipOverlay>
            )}
          </span>
        </>,
      ]
    })
    setInsights(filteredInsights)
  }
  const filterAndProcessData = (data) => {
    setOriginalData(data)
    const filteredTableData = data?.filter(
      ({ causeMessage, causeSuggestion }) =>
        causeMessage?.toLowerCase().includes(searchTerm?.toLowerCase()) ||
        causeSuggestion?.toLowerCase().includes(searchTerm?.toLowerCase()),
    )
    processTableData(filteredTableData)
    setFilteredData(filteredTableData)
  }
  const fetchData = async () => {
    setIsLoading(true)
    try {
      const resp = await getTrnOdsSuggestionByCaseId(caseId)
      if (resp?.data) filterAndProcessData(resp?.data)
    } catch (error) {
      showToast('Error fetching CCP Insights data:', 'error')
    } finally {
      setIsLoading(false)
    }
  }
  useEffect(() => {
    if (caseId) {
      fetchAndSaveValidationData(caseId)
      fetchData()
    }
  }, [caseId])
  const handleEditClick = (item) => {
    setSelectedItem(item)
    setOriginalSelectedItem(item)
    setShow(true)
    setError(defaultError)
  }
  const handleModalHide = () => {
    setSelectedItem(null)
    setResetToDefault(false)
    setTempSelectedItem(null)
    setOriginalSelectedItem(null)
    setShow(false)
    setInfoShow(false)
    setError(defaultError)
  }
  const handleInfoClick = (item) => {
    setSelectedItem(item)
    setOriginalSelectedItem(item)
    setInfoShow(true)
    setError(defaultError)
  }
  const isUsingDefaultValues = () => {
    return (
      selectedItem.causeMessage === selectedItem.causeMessageDefault &&
      selectedItem.causeSuggestion === selectedItem.causeSuggestionDefault &&
      selectedItem.causeFormula === selectedItem.causeFormulaDefault
    )
  }
  const handleSaveInsight = async () => {
    if (!window.confirm(submitConfirmationMessage)) return
    const causeError = isValidString(selectedItem.causeMessage)
    const suggestionsError = isValidString(selectedItem.causeSuggestion)
    const formulaError = isValidString(selectedItem.causeFormula)
    if (causeError || suggestionsError || formulaError) {
      setError((pre) => ({
        ...pre,
        cause: causeError,
        suggestions: suggestionsError,
        causeFormula: formulaError,
      }))
      return
    }
    if (!error?.isValidFormula && !isUsingDefaultValues()) {
      if (!window.confirm(userConfirmationMessage)) return
    }
    const isactive = resetToDefault
    const payload = {
      causeTagID: selectedItem.causeTagID,
      description: safeBtoa(selectedItem.causeMessage),
      suggestion: safeBtoa(selectedItem.causeSuggestion),
      formula: safeBtoa(selectedItem.causeFormula),
      odsID: selectedItem.odsID,
      isactive: +isactive,
    }
    const updatedData = {
      causeTagID: selectedItem.causeTagID,
      description: selectedItem.causeMessage,
      suggestion: selectedItem.causeSuggestion,
      formula: selectedItem.causeFormula,
      odsID: selectedItem.odsID,
      isactive: +isactive,
    }
    const initialData = {
      causeTagID: originalSelectedItem.causeTagID,
      description: originalSelectedItem.causeMessage,
      suggestion: originalSelectedItem.causeSuggestion,
      formula: originalSelectedItem.causeFormula,
      odsID: selectedItem.odsID,
      isactive: +isactive,
    }
    const auditPayload = {
      activityCategory: auditLogConfig?.activityCategory?.suggestion,
      activityName: auditLogConfig?.activityName?.update,
      activitydescription:
        auditLogConfig?.activitydescription?.updateSuggestion,
      target: auditLogConfig?.target?.suggestions,
      targetValue: String(selectedItem?.causeTagID),
      remarks: '',
      initial: safeBtoa(JSON.stringify(initialData)),
      changes: safeBtoa(JSON.stringify(updatedData)),
    }
    try {
      const resp = await addTrnODSSuggestion(payload)
      if (resp?.statuscode == 200) {
        showToast('Changes Updated Successfully', 'success')
        addAuditLog(auditPayload)
      }
      if (resp?.status > 200 || resp?.statuscode > 200) {
        alert(
          'Unable to save, please check values: ' +
            (resp?.title || resp?.errormsg),
        )
      }
      handleModalHide()
      fetchData()
    } catch (e) {
      alert('Unable to save, please check values.')
    }
  }
  async function fetchAndSaveValidationData(caseId) {
    const validationResp = await getTagsDataForValidation(caseId)
    if (validationResp?.data?.length > 0) {
      const valData = {}
      validationResp?.data?.forEach((obj) => {
        const key = obj?.tagName
        const value = obj?.value
        if (value != null) {
          valData[key] = parseFloat(value)
        }
      })
      setValidationData(valData)
    } else {
      setValidationData([])
    }
  }
  const isSubmitDisabled = useMemo(() => {
    return (
      selectedItem?.causeFormula === originalSelectedItem?.causeFormula &&
      selectedItem?.causeMessage === originalSelectedItem?.causeMessage &&
      selectedItem?.causeSuggestion === originalSelectedItem?.causeSuggestion
    )
  }, [selectedItem, originalSelectedItem])
  function onFormulaValidation(data) {
    setError((pre) => ({
      ...pre,
      isValidFormula: data?.isValid,
    }))
    setTimeout(() => {
      setSelectedItem({
        ...selectedItem,
        causeFormula: document.getElementById('input-trigger').value,
      })
    }, 300)
  }
  async function getTooltipsData() {
    const tooltip_resp = await getViewDataDictionaryByTablename(
      'tag,trn_ods_suggestion',
    )
    setDefaultTooltips(tooltip_resp?.data)
  }
  return (
    <div
      className={`${styles.ccpInsigntContainer} h-100`}
      data-static-id='Suggestion.js_div_135950'
    >
      <div
        className={`${styles.topContainer} d-flex align-items-center justify-content-between position-relative`}
        data-static-id='Suggestion.js_div_13f08c'
      >
        <div
          className={`${styles.localSearchBar}  d-flex h-100 align-items-center `}
          data-tut='reactour__con_suggestion_Search'
          data-static-id='Suggestion.js_div_ce8855'
        >
          <input
            type='search'
            placeholder='Search...'
            data-testid='search_input_field'
            className='text-14-regular h-100'
            value={searchTerm}
            aria-label='Search'
            onChange={handleSearchChange}
            data-static-id='Suggestion.js_input_edd60e'
          />
        </div>
        {filteredData.length ? (
          <ConfigurationDownload
            extraStyle={{
              bottom: 'unset',
              right: '1vmin',
              left: 'unset',
            }}
            headers={HEADERS}
            data={filteredData}
            headersForXls={['causeMessage', 'causeSuggestion']}
            title={'suggestions'}
          />
        ) : null}
      </div>
      <div
        className={`${styles.bottomContainer}`}
        data-tut='reactour__con_suggestion_table'
        data-static-id='Suggestion.js_div_1237d9'
      >
        <Table
          headers={HEADERS}
          data={insights}
          showLoader={isLoading}
          leftAlignColumns={[0, 1]}
          data-static-id='Suggestion.js_Table_82d958'
        />
      </div>
      <CustomModal
        hideModal={() => {
          if (!isSubmitDisabled && !window.confirm(userWarningMessage)) return
          handleModalHide()
        }}
        title={`${show ? 'EDIT' : ''} CONFIGURATIONS OF CAUSE - ${selectedItem?.causeMessage}`}
        show={show || infoShow}
        size={'lg'}
        modalHeight='auto'
        customSpacingClass={styles.customSpacingClass}
      >
        {selectedItem && (
          <>
            <div
              className={`${styles.rowStyle} ${styles.suggestionTabsEditModalContainer} d-flex flex-column justify-content-between`}
              data-static-id='Suggestion.js_div_a3d11c'
            >
              <div
                className={`w-100 ${styles.wrapperContainer}`}
                data-static-id='Suggestion.js_div_c52bc9'
              >
                <div
                  className={`${styles.rowItem}  ${styles.rowItemErrorMessage}`}
                  data-static-id='Suggestion.js_div_3eb070'
                >
                  <h2
                    className='text-14-bold mb-1'
                    data-static-id='Suggestion.js_h2_059721'
                  >
                    TRIGGER
                    {generateToolTip(defaultTooltips, 'formula', 'Tag')}
                  </h2>
                  <div
                    className={`text-14-regular ${resetToDefault || infoShow ? styles.input_disabled : ''} ${styles.userInputSection} w-100`}
                    data-static-id='Suggestion.js_div_d692ac'
                  >
                    {resetToDefault || infoShow ? (
                      <div
                        className={`${styles.triggerBlock}`}
                        data-static-id='Suggestion.js_div_669adc'
                      >
                        <p
                          className={`text-14-regular`}
                          data-static-id='Suggestion.js_p_2ea662'
                        >
                          {selectedItem.causeFormula}
                        </p>
                      </div>
                    ) : (
                      <>
                        <div
                          className={`${styles.formulaBoxContainer} ${styles.formulaBoxMinHeight}`}
                          data-static-id='Suggestion.js_div_27b52f'
                        >
                          <FormulaBox
                            values_obj={validationData}
                            inValue={selectedItem.causeFormula}
                            id={`input-trigger`}
                            disabled={resetToDefault}
                            classes={`text-14-regular ${styles.ccpInputBox}`}
                            onFormulaValidation={(data) =>
                              onFormulaValidation(data)
                            }
                            maxLength={
                              tooltips?.minTolerance?.causeFormula ||
                              maxLengthInput
                            }
                          />
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {error?.causeFormula && (
                  <div
                    className={`row gx-0  ${styles.rowItem}`}
                    data-static-id='Suggestion.js_div_2831a3'
                  >
                    <div
                      className={`error-message col-10 text-start ${styles.errorMsgSection}`}
                      data-static-id='Suggestion.js_div_fc72a0'
                    >
                      {error?.causeFormula}
                    </div>
                  </div>
                )}

                <div
                  className={`${styles.rowItem}`}
                  data-static-id='Suggestion.js_div_fedb06'
                >
                  <h2
                    className='text-14-bold mb-1'
                    data-static-id='Suggestion.js_h2_8b6385'
                  >
                    CAUSE
                    {generateToolTip(
                      defaultTooltips,
                      'Description',
                      'TRN_ODS_Suggestion',
                    )}
                  </h2>
                  <div
                    className={`${styles.userInputSection} w-100`}
                    data-static-id='Suggestion.js_div_eb101b'
                  >
                    <input
                      type='text'
                      id={`input-cause-message`}
                      data-testid='cause_input'
                      value={selectedItem.causeMessage}
                      onChange={(e) => {
                        const inputValue = e.target.value.slice(
                          0,
                          tooltips?.causeMessage?.maxLength || maxLengthInput,
                        )
                        setSelectedItem({
                          ...selectedItem,
                          causeMessage: inputValue,
                        })
                      }}
                      className={`text-14-regular ${styles.ccpInputBox} ${resetToDefault || infoShow ? styles.input_disabled : null}`}
                      readOnly={resetToDefault || infoShow}
                      data-static-id='Suggestion.js_input_2dbf97'
                    />
                  </div>
                </div>
                {error?.cause && (
                  <div
                    className={`error-message col-10 ps-3 text-start ${styles.errorMsgSection}`}
                    data-static-id='Suggestion.js_div_d668b8'
                  >
                    {error?.cause}
                  </div>
                )}
                <div
                  className={`${styles.rowItem}`}
                  data-static-id='Suggestion.js_div_d8071b'
                >
                  <h2
                    className='text-14-bold mb-1'
                    data-static-id='Suggestion.js_h2_3a7af8'
                  >
                    SUGGESTION
                    {generateToolTip(
                      defaultTooltips,
                      'Suggestion',
                      'TRN_ODS_Suggestion',
                    )}
                  </h2>
                  <div
                    className={`${styles.userInputSection} w-100`}
                    data-static-id='Suggestion.js_div_69ed3a'
                  >
                    <textarea
                      style={{
                        minHeight: '10vmin',
                      }}
                      type='text'
                      id={`input-cause-suggestion`}
                      data-testid='cause_suggestion_input'
                      value={selectedItem.causeSuggestion}
                      onChange={(e) => {
                        const inputValue = e.target.value.slice(
                          0,
                          tooltips?.causeSuggestion?.maxLength ||
                            maxLengthInput,
                        )
                        setSelectedItem({
                          ...selectedItem,
                          causeSuggestion: inputValue,
                        })
                      }}
                      className={`text-14-regular ${styles.ccpInputBox} ${resetToDefault || infoShow ? styles.input_disabled : null}`}
                      readOnly={resetToDefault || infoShow}
                      data-static-id='Suggestion.js_textarea_f34ff3'
                    />
                  </div>
                </div>
                {error?.suggestions && (
                  <div
                    className={`error-message  text-start ${styles.errorMsgSection}`}
                    data-static-id='Suggestion.js_div_164dca'
                  >
                    {error?.suggestions}
                  </div>
                )}
                <div
                  className={`${styles.rowItem} d-flex align-items-center gap-2`}
                  data-static-id='Suggestion.js_div_7d4a62'
                >
                  <h2
                    className='text-14-bold mt_03'
                    data-static-id='Suggestion.js_h2_c9e11d'
                  >
                    USE DEFAULT :
                  </h2>
                  <Switch
                    data-testid={`switch-${selectedItem.causeTagID}`}
                    id={`switch-${selectedItem.causeTagID}`}
                    defaultChecked={false}
                    disabled={infoShow}
                    className={`${infoShow ? styles.input_disabled : null}`}
                    onChange={(isChecked) => {
                      handleResetSwitch(isChecked)
                    }}
                  />
                </div>
              </div>
              <div
                className={`w-100 d-flex justify-content-between `}
                data-static-id='Suggestion.js_div_98dc8d'
              >
                <AuditLogs
                  tag={auditLogConfig?.target?.suggestions}
                  tagId={selectedItem?.causeTagID}
                  resetFunction={setSelectedItem}
                  showReset={false}
                />
                {!infoShow && (
                  <div
                    className={`d-flex justify-content-end w-100 ${styles.btnContainer}`}
                    style={{
                      marginTop: '2vmin',
                    }}
                    data-static-id='Suggestion.js_div_9164aa'
                  >
                    <OverlayTrigger
                      placement='top'
                      overlay={TooltipComp}
                      show={isSubmitDisabled}
                    >
                      <Button
                        data-testid='save-btn'
                        id='insight_submit'
                        className={`me-2 ${isSubmitDisabled && styles.saveBtn_disabled} ${styles.saveBtn}`}
                        onClick={() => {
                          handleSaveInsight()
                        }}
                        disabled={isSubmitDisabled}
                        data-static-id='Suggestion.js_Button_634195'
                      >
                        Submit
                      </Button>
                    </OverlayTrigger>

                    <Button
                      data-testid='cancel-btn'
                      className={`me-2  ${styles.cancelBtn}`}
                      onClick={() => {
                        if (
                          !isSubmitDisabled &&
                          !window.confirm(userWarningMessage)
                        )
                          return
                        handleModalHide()
                      }}
                      data-static-id='Suggestion.js_Button_2585fc'
                    >
                      Cancel
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </CustomModal>
    </div>
  )
}
export default Suggestion
