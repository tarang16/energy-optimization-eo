import CustomModal from 'components/visuals/common/modal/CustomModal'
import SingleSelect from 'components/visuals/dropdown/single_select/SingleSelect'
import SimpleTable from 'components/visuals/table/SimpleTable'
import { STAGE_ACTION } from 'config/Config'
import moment from 'moment/moment'
import { useEffect, useState } from 'react'
import DatePicker from 'react-datepicker'
import { getWfAlertHistoricalData } from 'services/WorkflowServices'
import {
  commentValidString,
  createDateIgnoringTimezone,
  getValsBaseOnCondition,
  globalizeDate,
  isValidString,
} from 'utills/utilities'
import deleteIcon from '../../../../assets/sabic_icons/common/red_delete_icon.svg'
import plusIcon from '../../../../assets/sabic_icons/table/table_plus_icon.svg'
import Buttons from '../radio_button/Buttons'
import styles from '../workflow.module.scss'
export default function WorkflowStageTwo({
  odsAssigneeList,
  initialSys = 0,
  submitData,
  setIsReject,
  setIsAccept,
  setStageData,
  stageData,
  actionId,
  setActionId,
  isSuggestionData = false,
  alertModalId,
  ODSData = null,
}) {
  const [targetDate, setTargetDate] = useState(moment().add(1, 'd').toDate())
  const [showInputContainer, setShowInputContainer] = useState(false)
  const [showAddOther, setShowAddOther] = useState(false)
  const [dynamicContainers, setDynamicContainers] = useState([])
  const [showHistoric, setShowHistoric] = useState(false)
  const [alertHistoryData, setAlertHistoryData] = useState([])
  const [confirmImplementation, setConfirmImplementation] = useState(false)
  const [defaultActiveIndex, setDefaultActiveIndex] = useState(-1)
  useEffect(() => {
    const isValidTargetDate = ODSData?.targetDate
    if (!isValidTargetDate) {
      setTargetDate(moment().toDate())
      handleAcceptClick()
      setDefaultActiveIndex(0)
    } else {
      setTargetDate(moment(isValidTargetDate * 1000)?.toDate())
      handleMarkAsClick()
      setDefaultActiveIndex(1)
    }
  }, [ODSData?.targetDate])
  const handleDelete = (index) => {
    if (dynamicContainers.length > 1) {
      const updatedContainers = dynamicContainers.filter((_, i) => i !== index)
      setDynamicContainers(updatedContainers)

      // Remove the corresponding otherUser entry when deleting a dynamic field
      setStageData((prevData) => {
        const updatedOtherUsers = (prevData?.suggestions ?? []).filter(
          (_, i) => i !== index,
        )
        return {
          ...prevData,
          suggestions: updatedOtherUsers,
        }
      })
    } else {
      setDynamicContainers([])
      setStageData((prevData) => {
        return {
          ...prevData,
          addOther: false,
          suggestions: [],
        }
      })
    }
  }
  const handleAdd = () => {
    const updatedContainers = [...dynamicContainers, dynamicContainers.length]
    setDynamicContainers(updatedContainers)

    // Add a new entry for otherUser when adding a dynamic field
    setStageData((prevData) => ({
      ...prevData,
      suggestions: [...(prevData?.suggestions || []), {}],
    }))
  }
  const handleAcceptClick = () => {
    setActionId(STAGE_ACTION.ACCEPT)
    setShowInputContainer(true)
    setIsAccept(true)
    setIsReject(false)
  }
  const handleMarkAsClick = () => {
    setActionId(STAGE_ACTION.MARK_AS_UNDER_STUDY)
    setShowInputContainer(false)
    setIsAccept(false)
    setIsReject(false)
  }
  const handleDateChange = (date) => {
    const gloablizedDate = globalizeDate(date)
    setTargetDate(createDateIgnoringTimezone(gloablizedDate))
    setStageData((prevData) => ({
      ...prevData,
      targetDate: createDateIgnoringTimezone(gloablizedDate),
      confirmImplementation: 0,
    }))
    if (ODSData?.targetDate) {
      setActionId(STAGE_ACTION.CHANGED_TARGET_DATE)
    } else {
      setActionId(STAGE_ACTION.REVISE_TARGET_DATE)
    }
  }
  const handleConfirmImplementationChange = (e) => {
    setConfirmImplementation(e.target.checked)
    if (e.target.checked) {
      setTargetDate(null)
      setActionId(STAGE_ACTION.CONFIRM_IMPLEMENTATION)
      setStageData((prevData) => ({
        ...prevData,
        confirmImplementation: 1,
        targetDate: null,
      }))
    } else {
      setActionId(
        targetDate
          ? STAGE_ACTION.REVISE_TARGET_DATE
          : STAGE_ACTION.MARK_AS_UNDER_STUDY,
      )
      setStageData((prevData) => ({
        ...prevData,
        confirmImplementation: 0,
        targetDate: targetDate,
      }))
    }
  }
  const headers = ['Time', 'Name', 'Suggestions']
  function handleNameChange(val, pos) {
    setStageData((prevData) => ({
      ...prevData,
      assigneeID: val,
    }))
  }
  const handleAddOtherChange = (e) => {
    setDynamicContainers([0])
    setShowAddOther(e.target.checked)
    setStageData((prevData) => ({
      ...prevData,
      addOther: e.target.checked ? true : false,
      suggestions: [],
    }))
  }
  const handleConsiderSuggestionsChange = (e) => {
    setStageData((prevData) => ({
      ...prevData,
      considerSuggestion: e.target.checked ? 1 : 0,
      addOther: showAddOther,
    }))
  }
  const handleOtherUserChange = (e, index, field) => {
    let { value } = e.target
    const acop = ['actual', 'optimum'].includes(field)
    const errMsg = getValsBaseOnCondition(
      acop,
      isValidString(value, 20),
      commentValidString(value),
    )
    if (errMsg != '') {
      alert(errMsg)
      const stringWithValidCharcters = value.slice(0, -1)
      e.target.value = stringWithValidCharcters
      return ''
    }
    if (acop) {
      value = parseFloat(value)
    }
    setStageData((prevData) => {
      // Check if prevData.suggestions is undefined, null, or an empty array
      const suggestions =
        !prevData.suggestions || prevData.suggestions.length === 0
          ? [
              {
                suggestion: '',
                actual: null,
                optimum: null,
              },
            ]
          : prevData.suggestions
      const updatedOtherUsers = suggestions.map((user, i) => {
        if (i === index) {
          return {
            ...user,
            [field]: value,
          }
        }
        return user
      })
      return {
        ...prevData,
        suggestions: updatedOtherUsers,
      }
    })
  }
  const generateTableData = (historyData) => {
    return historyData?.map(({ timeEpoch, employeeName, suggestions }) => {
      const actualArray = []
      const optimumArray = []
      const suggestionArray = []
      const [name] = employeeName.split(' (')
      suggestions.forEach(({ actual, optimum, suggestion }) => {
        actualArray.push(actual)
        optimumArray.push(optimum)
        suggestionArray.push(suggestion)
      })
      return [
        moment(timeEpoch).format('DD-MMM-YY hh:mm A'),
        <div
          className='d-flex flex-column'
          key={`${name}-${timeEpoch}`}
          data-static-id='stage_one.js_div_ea95eb'
        >
          <span
            className='text-14-regular'
            data-static-id='stage_one.js_span_0f7e37'
          >
            {name}{' '}
          </span>
        </div>,
        <div
          key={`${employeeName}-${timeEpoch}`}
          className='d-flex'
          data-static-id='stage_one.js_div_dab33a'
        >
          <div
            className='d-flex flex-column  gap-2'
            data-static-id='stage_one.js_div_c7b132'
          >
            {suggestionArray.map((suggestionItem, index) => (
              <div
                key={suggestionItem}
                className='d-flex '
                data-static-id='stage_one.js_div_8d3070'
              >
                <span
                  className='text-13-regular'
                  data-static-id='stage_one.js_span_b59366'
                >
                  <b data-static-id='stage_one.js_b_3835d4'>
                    added suggestion {index + 1}
                    <span
                      className='mx-1'
                      data-static-id='stage_one.js_span_37a4c7'
                    >
                      :
                    </span>
                  </b>
                </span>{' '}
                <span
                  className='text-13-regular me-1'
                  data-static-id='stage_one.js_span_df2767'
                >
                  {suggestionItem}
                </span>
                <span
                  className='text_primary_gray_2'
                  data-static-id='stage_one.js_span_216ecc'
                >
                  (actual
                  <span
                    className='mx-1'
                    data-static-id='stage_one.js_span_b76058'
                  >
                    :
                  </span>
                  <span
                    className='text_primary_blue'
                    data-static-id='stage_one.js_span_5358a8'
                  >
                    {actualArray[index]}
                  </span>
                  <span
                    className='mx-1'
                    data-static-id='stage_one.js_span_0fdbc1'
                  >
                    |
                  </span>{' '}
                  optimum
                  <span
                    className='mx-1'
                    data-static-id='stage_one.js_span_7cc97b'
                  >
                    :
                  </span>
                  <span
                    className='text_primary_yellow'
                    data-static-id='stage_one.js_span_279542'
                  >
                    {optimumArray[index]}
                  </span>
                  )
                </span>
              </div>
            ))}
          </div>
        </div>,
      ]
    })
  }
  useEffect(() => {
    const fetchData = async () => {
      const resp = await getWfAlertHistoricalData(alertModalId)
      if (resp?.data) {
        let tempTableData = []
        resp?.data.forEach(({ history }) => {
          const modifiedTableData = generateTableData(history)
          tempTableData = tempTableData.concat(modifiedTableData)
        })
        setAlertHistoryData(tempTableData)
      }
    }
    fetchData()
  }, [])
  const handleRejectClick = () => {
    setActionId(STAGE_ACTION.CLOSE_REJECT)
    setShowInputContainer(false)
    setIsAccept(false)
    setIsReject(true)
  }
  const buttonsObj = [
    {
      name: 'Reassign',
      onButtonClick: handleAcceptClick,
    },
    {
      name: 'Reject',
      onButtonClick: handleRejectClick,
    },
  ]
  return (
    <div
      className={`${styles.stageTwoContainer} ${styles.workflowContainer}`}
      data-static-id='stage_one.js_div_c03cac'
    >
      {submitData ? (
        <div
          className={`d-flex align-items-center justify-content-left ${styles.messageBackground}`}
          data-static-id='stage_one.js_div_6e8636'
        >
          <span
            className={`${styles.placeholderName} `}
            data-static-id='stage_one.js_span_ebe4f6'
          >
            <span
              className=' ms-2 text-14-bold text_primary_gray'
              data-static-id='stage_one.js_span_286cb8'
            >
              Current Status:
            </span>
            <span
              className={`ms-2 text-14-regular text_primary_gray`}
              data-static-id='stage_one.js_span_3feba0'
            >
              Assigned to Operation Manager.
            </span>
          </span>
        </div>
      ) : (
        <>
          {ODSData?.processOperationRejection === 1 ? (
            <div
              className={`${styles.stage2btnContainer} mt-2`}
              data-static-id='stage_one.js_div_7bde78'
            >
              <Buttons
                buttonsObj={buttonsObj}
                defaultActiveIndex={defaultActiveIndex}
              />
            </div>
          ) : null}
          {(actionId === STAGE_ACTION.MARK_AS_UNDER_STUDY ||
            actionId === STAGE_ACTION.REVISE_TARGET_DATE ||
            actionId === STAGE_ACTION.CONFIRM_IMPLEMENTATION) && (
            <div
              className={`w-100 ${styles.Stage2Wrapper1} `}
              data-static-id='stage_one.js_div_a2c466'
            >
              <div
                className={`d-flex ${styles.dateTimePickerContainer} align-items-center `}
                data-static-id='stage_one.js_div_61a307'
              >
                <div
                  className='customDatePicker me-2 h-100'
                  data-static-id='stage_one.js_div_3a4888'
                >
                  <label
                    htmlFor=' Target Date'
                    className={`text-14-bold text_primary_gray`}
                    data-static-id='stage_one.js_label_7742f3'
                  >
                    Set Target Date
                  </label>
                  <DatePicker
                    className={`text-14-regular text_primary_gray`}
                    dateFormat='dd-MMM-yyyy'
                    popperPlacement='bottom-end'
                    popperProps={{
                      positionFixed: true,
                    }}
                    disabled={actionId === STAGE_ACTION.CLOSE}
                    selected={targetDate}
                    onChange={handleDateChange}
                    minDate={moment().add(1, 'd').toDate()}
                  />
                </div>
                <div
                  className='d-flex'
                  data-static-id='stage_one.js_div_8ce856'
                >
                  <span
                    className='text-16-bold me-2'
                    data-static-id='stage_one.js_span_a8b175'
                  >
                    OR
                  </span>
                  <div
                    className={`${styles.checkBox3Container} ms-2 d-flex align-items-center`}
                    data-static-id='stage_one.js_div_b8fd98'
                  >
                    <input
                      className={'form-check-input mt-0'}
                      type='checkbox'
                      onChange={handleConfirmImplementationChange}
                      checked={confirmImplementation}
                      data-static-id='stage_one.js_input_877e04'
                    />
                    <span
                      className={`text-14-bold text_primary_gray  ${styles.lebelTextMargin}`}
                      data-static-id='stage_one.js_span_a1a598'
                    >
                      Confirm Implementation
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
          {showInputContainer && (
            <div
              className={`${styles.stage2formContainer}`}
              data-static-id='stage_one.js_div_8b1917'
            >
              <div data-static-id='stage_one.js_div_bf66e3'>
                <div
                  className={`mt-1 d-flex align-items-center w-100 gap-4 ${styles.checkBoxContainer}`}
                  data-static-id='stage_one.js_div_2eca2a'
                >
                  <div
                    className={`d-flex align-items-center `}
                    data-static-id='stage_one.js_div_590e72'
                  >
                    <input
                      type='checkbox'
                      name='considerSuggestions'
                      checked={stageData.considerSuggestion}
                      onChange={handleConsiderSuggestionsChange}
                      data-static-id='stage_one.js_input_e847ed'
                    />
                    <label
                      className={`text-14-regular text_primary_gray ms-2 ${styles.labelText}`}
                      data-static-id='stage_one.js_label_1693e2'
                    >
                      Consider Suggestion
                    </label>
                  </div>
                  <div
                    className={`d-flex align-items-center`}
                    data-static-id='stage_one.js_div_0b6f61'
                  >
                    <input
                      type='checkbox'
                      name='addOther'
                      checked={stageData.addOther}
                      onChange={handleAddOtherChange}
                      data-static-id='stage_one.js_input_9c8ecf'
                    />
                    <label
                      className={`text-14-regular text_primary_gray ms-2 ${styles.labelText}`}
                      data-static-id='stage_one.js_label_c780df'
                    >
                      Add Other
                    </label>
                  </div>
                  <div
                    onClick={() => {
                      setShowHistoric(true)
                    }}
                    className={` ${styles.historicButton} text-16-bold`}
                    data-static-id='stage_one.js_div_cde820'
                  >
                    <span
                      className='mt_03 text_primary_blue'
                      data-static-id='stage_one.js_span_cdcb85'
                    >
                      Historic Suggestions
                    </span>
                  </div>
                </div>

                {showAddOther && (
                  <div
                    className={`w-100 ${styles.dynamic_container} mt-3`}
                    data-static-id='stage_one.js_div_2dad59'
                  >
                    {dynamicContainers.map((index) => (
                      <div
                        key={index}
                        className={`${styles.dynamic_row}`}
                        data-static-id='stage_one.js_div_d8fddd'
                      >
                        <div
                          className='d-flex w-100 align-items-end'
                          data-static-id='stage_one.js_div_d57121'
                        >
                          <div
                            className={`d-flex flex-column ${styles.input_container}`}
                            data-static-id='stage_one.js_div_01fe6c'
                          >
                            <label
                              htmlFor={`actionDetails_${index}`}
                              className={`text-14-regular text_primary_gray ${styles.labelText}`}
                              data-static-id='stage_one.js_label_7d136f'
                            >
                              Action Details:
                            </label>
                            <input
                              id={`actionDetails_${index}`}
                              type='text'
                              className='w-100 text-14-regular'
                              onChange={(e) =>
                                handleOtherUserChange(e, index, 'suggestion')
                              }
                              data-static-id='stage_one.js_input_3ecd87'
                            />
                          </div>

                          <div
                            className={`d-flex flex-column ${styles.input_container}`}
                            data-static-id='stage_one.js_div_39877e'
                          >
                            <label
                              htmlFor={`actualValue_${index}`}
                              className={`text-14-regular text_primary_gray ${styles.labelText}`}
                              data-static-id='stage_one.js_label_5ab43d'
                            >
                              Actual Value:
                            </label>
                            <input
                              id={`actualValue_${index}`}
                              type='number'
                              step='any'
                              className='w-100 text-14-regular'
                              onChange={(e) =>
                                handleOtherUserChange(e, index, 'actual')
                              }
                              data-static-id='stage_one.js_input_d9dd38'
                            />
                          </div>

                          <div
                            className={`d-flex flex-column ${styles.input_container}`}
                            data-static-id='stage_one.js_div_b259f1'
                          >
                            <label
                              htmlFor={`optimumValue_${index}`}
                              className={`text-14-regular text_primary_gray ${styles.labelText}`}
                              data-static-id='stage_one.js_label_871a87'
                            >
                              Optimum Value:
                            </label>
                            <input
                              id={`optimumValue_${index}`}
                              type='number'
                              step='any'
                              className='w-100 text-14-regular'
                              onChange={(e) =>
                                handleOtherUserChange(e, index, 'optimum')
                              }
                              data-static-id='stage_one.js_input_82d6d8'
                            />
                          </div>
                          <div
                            className={`${styles.stage2btnContainer} mt-0`}
                            data-static-id='stage_one.js_div_3e2b63'
                          >
                            <button
                              onClick={() => handleDelete(index)}
                              className={`m-0   ${dynamicContainers.length === 1 ? styles.disabled : ''}`}
                              data-static-id='stage_one.js_button_2a735f'
                            >
                              <img
                                src={deleteIcon}
                                data-static-id='stage_one.js_img_0bef1d'
                              />
                            </button>

                            <button
                              onClick={handleAdd}
                              className={`m-0  ${dynamicContainers.length === 1 ? styles.disabled : ''}`}
                              data-static-id='stage_one.js_button_97926e'
                            >
                              <img
                                src={plusIcon}
                                data-static-id='stage_one.js_img_e398af'
                              />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {actionId === STAGE_ACTION.ACCEPT && (
                  <div
                    className={`${styles.stage2dropdowncontainer} mt-2`}
                    data-static-id='stage_one.js_div_516b4b'
                  >
                    <span
                      htmlFor='Assign to'
                      className='text-14-bold text_primary_gray mb-1'
                      data-static-id='stage_one.js_span_943a9e'
                    >
                      Assign to:
                    </span>
                    <div
                      className={`${styles.dropdownHeight} ${getValsBaseOnCondition(isSuggestionData, styles.dropdownTop, styles.dropdownBottom)}`}
                      data-static-id='stage_one.js_div_f84bda'
                    >
                      <SingleSelect
                        classes={{
                          container: styles.dropdownContainer,
                        }}
                        activeI={getValsBaseOnCondition(
                          initialSys >= 0,
                          initialSys,
                          0,
                        )}
                        data={odsAssigneeList}
                        onSelectChange={handleNameChange}
                        labelKey='name'
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          <CustomModal
            hideModal={() => {
              setShowHistoric(false)
            }}
            title={'Historic Suggestions'}
            show={showHistoric}
            size={''}
            contentFitWidth={styles.historicSuggestionModal}
          >
            <SimpleTable
              data={alertHistoryData}
              headers={headers}
              showLoader={false}
              leftAlignColumns={[0, 1, 2]}
              customColumnWidths={[17, 24, 59]}
            />
          </CustomModal>
        </>
      )}
    </div>
  )
}
