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
  odsReAssigneeList = [],
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
  const [showInputContainer, setShowInputContainer] = useState(false)
  const [showAddOther, setShowAddOther] = useState(false)
  const [dynamicContainers, setDynamicContainers] = useState([])
  const [showHistoric, setShowHistoric] = useState(false)
  const [alertHistoryData, setAlertHistoryData] = useState([])
  const [defaultActiveIndex, setDefaultActiveIndex] = useState(-1)
  useEffect(() => {
    if (ODSData?.targetDate) {
      setStageData((prevData) => ({
        ...prevData,
        targetDate: moment(ODSData?.targetDate * 1000).toDate(),
      }))
      handleMarkAsClick()
      setDefaultActiveIndex(1)
    } else {
      setStageData((prevData) => ({
        ...prevData,
        targetDate: moment()?.toDate(),
      }))
      handleAcceptClick()
      setDefaultActiveIndex(0)
    }
  }, [ODSData?.targetDate])
  const handleForwardClick = () => {
    setActionId(STAGE_ACTION.DELEGATE)
    setActionId(STAGE_ACTION.DELEGATE)
    setShowInputContainer(true)
    setIsAccept(false)
    setIsReject(false)
    setDynamicContainers([])
  }
  const handleDelete = (index) => {
    if (dynamicContainers?.length > 1) {
      const updatedContainers = dynamicContainers.filter((_, i) => i !== index)
      setDynamicContainers(updatedContainers)
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
    const updatedContainers = [...dynamicContainers, dynamicContainers?.length]
    setDynamicContainers(updatedContainers)

    // Add a new entry for otherUser when adding a dynamic field
    setStageData((prevData) => ({
      ...prevData,
      suggestions: [...(prevData?.suggestions || []), {}],
    }))
  }
  const handleAcceptClick = () => {
    setActionId(STAGE_ACTION.CLOSE)
    setIsAccept(true)
    setIsReject(false)
    setShowInputContainer(false)
  }
  const handleRejectClick = () => {
    setActionId(STAGE_ACTION.REJECT)
    setIsAccept(false)
    setIsReject(true)
    setShowInputContainer(false)
  }
  const handleMarkAsClick = () => {
    setActionId(STAGE_ACTION.WILL_IMPLEMENT)
    setIsAccept(false)
    setIsReject(false)
    setShowInputContainer(false)
  }
  const handleReviseDateClick = () => {
    setActionId(STAGE_ACTION.REVISE_TARGET_DATE)
    setIsAccept(false)
    setIsReject(false)
    setShowAddOther(false)
    setShowInputContainer(false)
  }
  const handleDateChange = (date) => {
    const gloablizedDate = globalizeDate(date)
    setStageData((prevData) => ({
      ...prevData,
      targetDate: createDateIgnoringTimezone(gloablizedDate),
      confirmImplementation: 0,
    }))
    if (ODSData?.targetDate) {
      setActionId(STAGE_ACTION.CHANGED_TARGET_DATE)
    } else {
      setActionId(STAGE_ACTION.WILL_IMPLEMENT)
    }
  }
  const handleConfirmImplementationChange = (e) => {
    if (e.target.checked) {
      setActionId(STAGE_ACTION.CLOSE)
      setStageData((prevData) => ({
        ...prevData,
        confirmImplementation: 1,
        targetDate: null,
      }))
    } else {
      setActionId(STAGE_ACTION.CLOSE)
      setStageData((prevData) => ({
        ...prevData,
        confirmImplementation: 0,
        targetDate: null,
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
        !prevData.suggestions || prevData?.suggestions?.length === 0
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
  const buttonsObj = [
    {
      name: 'Accept',
      onButtonClick: handleAcceptClick,
    },
    ODSData?.targetDate
      ? {
          name: 'Change Target Date',
          onButtonClick: handleReviseDateClick,
        }
      : {
          name: 'Target Date',
          onButtonClick: handleMarkAsClick,
        },
    {
      name: 'Reject',
      onButtonClick: handleRejectClick,
    },
    {
      name: 'Forward to another Operation/Process Engineer',
      onButtonClick: handleForwardClick,
    },
  ]
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
          data-static-id='stage_two.js_div_955f68'
        >
          <span
            className='text-14-regular'
            data-static-id='stage_two.js_span_306c82'
          >
            {name}{' '}
          </span>
        </div>,
        <div
          key={`${employeeName}-${timeEpoch}`}
          className='d-flex'
          data-static-id='stage_two.js_div_876ee5'
        >
          <div
            className='d-flex flex-column  gap-2'
            data-static-id='stage_two.js_div_e7eb81'
          >
            {suggestionArray.map((suggestionItem, index) => (
              <div
                key={suggestionItem}
                className='d-flex '
                data-static-id='stage_two.js_div_3331f5'
              >
                <span
                  className='text-13-regular'
                  data-static-id='stage_two.js_span_673995'
                >
                  <b data-static-id='stage_two.js_b_af9100'>
                    added suggestion {index + 1}
                    <span
                      className='mx-1'
                      data-static-id='stage_two.js_span_a7137d'
                    >
                      :
                    </span>
                  </b>
                </span>{' '}
                <span
                  className='text-13-regular me-1'
                  data-static-id='stage_two.js_span_b6799d'
                >
                  {suggestionItem}
                </span>
                <span
                  className='text_primary_gray_2'
                  data-static-id='stage_two.js_span_5bd224'
                >
                  (actual
                  <span
                    className='mx-1'
                    data-static-id='stage_two.js_span_eea73c'
                  >
                    :
                  </span>
                  <span
                    className='text_primary_blue'
                    data-static-id='stage_two.js_span_07bae2'
                  >
                    {actualArray[index]}
                  </span>
                  <span
                    className='mx-1'
                    data-static-id='stage_two.js_span_1f2ee7'
                  >
                    |
                  </span>{' '}
                  optimum
                  <span
                    className='mx-1'
                    data-static-id='stage_two.js_span_205b59'
                  >
                    :
                  </span>
                  <span
                    className='text_primary_yellow'
                    data-static-id='stage_two.js_span_efa549'
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
  return (
    <div
      className={`${styles.stageTwoContainer} ${styles.workflowContainer}`}
      data-static-id='stage_two.js_div_793874'
    >
      {submitData ? (
        <div
          className={`d-flex align-items-center justify-content-left ${styles.messageBackground}`}
          data-static-id='stage_two.js_div_7ea548'
        >
          <span
            className={`${styles.placeholderName} `}
            data-static-id='stage_two.js_span_dc1ac3'
          >
            <span
              className=' ms-2 text-14-bold text_primary_gray'
              data-static-id='stage_two.js_span_e3571f'
            >
              Current Status:
            </span>
            <span
              className={`ms-2 text-14-regular text_primary_gray`}
              data-static-id='stage_two.js_span_6fc983'
            >
              Assigned to Operation Manager.
            </span>
          </span>
        </div>
      ) : (
        <>
          <div
            className={`${styles.stage2btnContainer} mt-3`}
            data-static-id='stage_two.js_div_5b3451'
          >
            <Buttons
              buttonsObj={buttonsObj}
              defaultActiveIndex={defaultActiveIndex}
            />
          </div>
          <div
            className={`w-100 ${styles.Stage2Wrapper1} `}
            data-static-id='stage_two.js_div_2aa2d6'
          >
            <div
              className={`d-flex ${styles.dateTimePickerContainer} align-items-center `}
              data-static-id='stage_two.js_div_ef85c5'
            >
              {(actionId === STAGE_ACTION.REVISE_TARGET_DATE ||
                actionId === STAGE_ACTION.WILL_IMPLEMENT) && (
                <div
                  className='customDatePicker me-2 h- mt-2'
                  data-static-id='stage_two.js_div_50bee4'
                >
                  <DatePicker
                    className={`text-14-regular text_primary_gray`}
                    dateFormat='dd-MMM-yyyy'
                    popperPlacement='bottom-end'
                    placeholderText='Select date'
                    popperProps={{
                      positionFixed: true,
                    }}
                    selected={stageData?.targetDate}
                    onChange={handleDateChange}
                    minDate={moment().add(1, 'd').toDate()}
                  />
                </div>
              )}
              {(actionId === STAGE_ACTION.ACCEPT ||
                actionId === STAGE_ACTION.CONFIRM_IMPLEMENTATION) && (
                <div
                  className={`${styles.checkBox3Container} d-flex align-items-center mt-2`}
                  data-static-id='stage_two.js_div_09178d'
                >
                  <input
                    className={'form-check-input mt-0'}
                    type='checkbox'
                    onChange={handleConfirmImplementationChange}
                    checked={stageData?.confirmImplementation}
                    data-static-id='stage_two.js_input_8b14af'
                  />
                  <span
                    className={`text-14-bold text_primary_gray  ${styles.lebelTextMargin}`}
                    data-static-id='stage_two.js_span_4fea6a'
                  >
                    Confirm Implementation
                  </span>
                </div>
              )}
            </div>
          </div>
          {showInputContainer && (
            <div
              className={`${styles.stage2formContainer}`}
              data-static-id='stage_two.js_div_075a5e'
            >
              <div data-static-id='stage_two.js_div_9362e0'>
                {actionId === STAGE_ACTION.REJECT ||
                stageData?.confirmImplementation ? null : (
                  <div
                    className={`mt-1 d-flex align-items-center w-100 gap-4 ${styles.checkBoxContainer}`}
                    data-static-id='stage_two.js_div_5ede9b'
                  >
                    <div
                      className={`d-flex align-items-center `}
                      data-static-id='stage_two.js_div_e85372'
                    >
                      <input
                        type='checkbox'
                        name='considerSuggestions'
                        checked={stageData.considerSuggestion}
                        onChange={handleConsiderSuggestionsChange}
                        data-static-id='stage_two.js_input_2d4b37'
                      />
                      <label
                        className={`text-14-regular text_primary_gray ms-2 ${styles.labelText}`}
                        data-static-id='stage_two.js_label_3785c3'
                      >
                        Consider Suggestion
                      </label>
                    </div>
                    <div
                      className={`d-flex align-items-center`}
                      data-static-id='stage_two.js_div_67327c'
                    >
                      <input
                        type='checkbox'
                        name='addOther'
                        checked={stageData.addOther}
                        onChange={handleAddOtherChange}
                        data-static-id='stage_two.js_input_344ab6'
                      />
                      <label
                        className={`text-14-regular text_primary_gray ms-2 ${styles.labelText}`}
                        data-static-id='stage_two.js_label_a7af49'
                      >
                        Add Other
                      </label>
                    </div>
                    <div
                      onClick={() => {
                        setShowHistoric(true)
                      }}
                      className={` ${styles.historicButton} text-16-bold`}
                      data-static-id='stage_two.js_div_eba881'
                    >
                      <span
                        className='mt_03 text_primary_blue'
                        data-static-id='stage_two.js_span_30a295'
                      >
                        Historic Suggestions
                      </span>
                    </div>
                  </div>
                )}

                {showAddOther && (
                  <div
                    className={`w-100 ${styles.dynamic_container} mt-3`}
                    data-static-id='stage_two.js_div_a8934b'
                  >
                    {dynamicContainers?.map((index) => (
                      <div
                        key={index}
                        className={`${styles.dynamic_row}`}
                        data-static-id='stage_two.js_div_6e3b0a'
                      >
                        <div
                          className='d-flex w-100 align-items-end'
                          data-static-id='stage_two.js_div_a2c7b9'
                        >
                          <div
                            className={`d-flex flex-column ${styles.input_container}`}
                            data-static-id='stage_two.js_div_74fe6e'
                          >
                            <label
                              htmlFor={`actionDetails_${index}`}
                              className={`text-14-regular text_primary_gray ${styles.labelText}`}
                              data-static-id='stage_two.js_label_3d779b'
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
                              data-static-id='stage_two.js_input_9719e6'
                            />
                          </div>

                          <div
                            className={`d-flex flex-column ${styles.input_container}`}
                            data-static-id='stage_two.js_div_4fb583'
                          >
                            <label
                              htmlFor={`actualValue_${index}`}
                              className={`text-14-regular text_primary_gray ${styles.labelText}`}
                              data-static-id='stage_two.js_label_225dad'
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
                              data-static-id='stage_two.js_input_1f83e4'
                            />
                          </div>

                          <div
                            className={`d-flex flex-column ${styles.input_container}`}
                            data-static-id='stage_two.js_div_56bd83'
                          >
                            <label
                              htmlFor={`optimumValue_${index}`}
                              className={`text-14-regular text_primary_gray ${styles.labelText}`}
                              data-static-id='stage_two.js_label_217b45'
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
                              data-static-id='stage_two.js_input_7f7101'
                            />
                          </div>
                          <div
                            className={`${styles.stage2btnContainer} mt-0`}
                            data-static-id='stage_two.js_div_7f7019'
                          >
                            <button
                              onClick={() => handleDelete(index)}
                              className={`m-0   ${dynamicContainers?.length === 1 ? styles.disabled : ''}`}
                              data-static-id='stage_two.js_button_6085f5'
                            >
                              <img
                                src={deleteIcon}
                                data-static-id='stage_two.js_img_6d1268'
                              />
                            </button>

                            <button
                              onClick={handleAdd}
                              className={`m-0  ${dynamicContainers?.length === 1 ? styles.disabled : ''}`}
                              data-static-id='stage_two.js_button_e561d7'
                            >
                              <img
                                src={plusIcon}
                                data-static-id='stage_two.js_img_116c46'
                              />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {(actionId === STAGE_ACTION.ACCEPT ||
                  actionId === STAGE_ACTION.DELEGATE) && (
                  <div
                    className={`${styles.stage2dropdowncontainer} mt-2`}
                    data-static-id='stage_two.js_div_0b82de'
                  >
                    <span
                      htmlFor='Assign to'
                      className='text-14-bold text_primary_gray mb-1'
                      data-static-id='stage_two.js_span_4a7d0a'
                    >
                      {getValsBaseOnCondition(
                        actionId === STAGE_ACTION.DELEGATE,
                        'Forward',
                        'Assign',
                      )}{' '}
                      to:
                    </span>
                    <div
                      className={`${styles.dropdownHeight} ${getValsBaseOnCondition(isSuggestionData, styles.dropdownTop, styles.dropdownBottom)}`}
                      data-static-id='stage_two.js_div_051d01'
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
                        data={getValsBaseOnCondition(
                          actionId === STAGE_ACTION.DELEGATE,
                          odsReAssigneeList,
                          odsAssigneeList,
                        )}
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
              data-testid='simple-table'
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
