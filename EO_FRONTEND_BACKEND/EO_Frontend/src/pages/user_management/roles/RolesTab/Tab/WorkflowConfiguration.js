import { TokenAtom } from 'atoms/RootAtom'
import Loader from 'components/ui/loader/Loader'
import { getUserDomainID } from 'components/visuals/common/modal/ODSAlertModal'
import { TRACKEVENTOBJ } from 'config/ActivityTrackerConfig'
import { useAtomValue } from 'jotai'
import { useEffect, useState } from 'react'
import { Form } from 'react-bootstrap'
import {
  getWorkflowConfigurations,
  updateWorkflowConfigurationAffiliateId,
  updateWorkflowConfigurations,
} from 'services/WorkflowServices'
import { getValsBaseOnCondition, showToast } from 'utills/utilities'
import styles from './WorkflowConfiguration.module.scss'
import { ROLES_MAPPING } from './WorkflowTab'
export default function WorkflowConfiguration({
  setShowModalConfig = () => {},
  IsAffliiateConfig = false,
  selectedAffiliateId,
}) {
  const token = useAtomValue(TokenAtom)
  const [workflowData, setWorkflowData] = useState([])
  const [checkboxData, setCheckboxData] = useState({})
  const [isLoading, setisLoading] = useState(false)
  const [updatedValues, setUpdatedValues] = useState([])
  const [hrsValue, setHrsValue] = useState(null)
  const [hrsAcValue, setHrsAcValue] = useState(null)
  const checkboxTitles = {
    Send_Email: 'Send New Alert Notification Email',
    Send_Overdue_Email: 'Send Overdue Notification Email',
    Send_Email_AutoClosure: ' Send Alert Autoclosure Notification Email',
    Send_Email_Closure: 'Send Alert Closure Notification Email',
  }
  function groupByKeyExcludingSuffix(data) {
    const suffixes = ['_SFP', '_OE', '_IN']
    const sortOrder = ['SFP', 'OE', 'IN']
    const groupedData = data.reduce((acc, item) => {
      let key = item.configurationName

      // Check if the key ends with any of the specified suffixes
      if (suffixes.some((suffix) => key.endsWith(suffix))) {
        // If yes, slice the last 3 characters and remove the trailing underscore if present
        key = key.slice(0, -3).replace(/_$/, '')
      }
      if (
        item.configurationValue === 'True' ||
        item.configurationValue === 'true' ||
        item.configurationValue === 'False' ||
        item.configurationValue === 'false'
      ) {
        acc[key] = acc[key] || {}
        acc[key][item.configurationName] =
          item.configurationValue === 'True' ||
          item.configurationValue === 'true'
      }
      return acc
    }, {})
    Object.keys(groupedData).forEach((group) => {
      const sortedKeys = Object.keys(groupedData[group]).sort((a, b) => {
        const suffixA = a.slice(-2) // Get the last 2 characters of key 'a'
        const suffixB = b.slice(-2) // Get the last 2 characters of key 'b'

        const indexA = sortOrder.indexOf(suffixA) // Get the custom order index for key 'a'
        const indexB = sortOrder.indexOf(suffixB) // Get the custom order index for key 'b'

        // If both suffixes are in the sort order, compare based on their order
        if (indexA !== -1 && indexB !== -1) {
          return indexA - indexB
        }

        // Otherwise, keep the original order (if not in sortOrder)
        return 0
      })

      // Create a sorted object for the group
      const sortedGroup = {}
      sortedKeys.forEach((key) => {
        sortedGroup[key] = groupedData[group][key]
      })

      // Replace the group with the sorted version
      groupedData[group] = sortedGroup
    })
    return groupedData
  }
  useEffect(() => {
    const fetchData = async () => {
      setisLoading(true)
      const payload = getValsBaseOnCondition(
        IsAffliiateConfig && selectedAffiliateId,
        selectedAffiliateId,
        null,
      )
      const resp = await getWorkflowConfigurations(payload)
      if (resp.statuscode === 200) {
        const inputIndex = resp.data.findIndex(
          (item) => item.configurationName === 'Check_Overdue_AfterHrs',
        )
        if (inputIndex > 0) {
          setHrsValue(resp?.data[inputIndex]?.configurationValue)
        }
        const inputAcIndex = resp.data.findIndex(
          (item) => item.configurationName === 'AutoClosure_Timer_Hrs',
        )
        if (inputAcIndex >= 0) {
          setHrsAcValue(resp?.data[inputAcIndex]?.configurationValue)
        }
        const newData = groupByKeyExcludingSuffix(resp?.data)
        setCheckboxData(newData)
        setWorkflowData(resp?.data || [])
      } else {
        setWorkflowData([])
      }
      setisLoading(false)
    }
    fetchData()
  }, [])
  const Roles = {
    SFP: ROLES_MAPPING.SUSTAINABILITY_FOCAL_POINT,
    OE: ROLES_MAPPING.OPERATION_PROCESS_ENGINEER,
    IN: ROLES_MAPPING.INFO_GROUP,
  }
  const getCheckboxScreen = (title, key) => {
    return Roles[key.replace(`${title}_`, '')]
  }
  const handleUpdateValues = (value, key) => {
    setUpdatedValues((prev) => {
      const tempData = [...workflowData]
      const index = workflowData.findIndex(
        (item) => item.configurationName === key,
      )
      if (index === -1) {
        tempData.push({
          configurationName: key,
          configurationValue: value.toString(),
        })
      } else {
        tempData[index]['configurationValue'] = value.toString()
      }
      return tempData
    })
  }
  const handleSubmit = async () => {
    const AutoClosureKeys = [
      'Send_Email_AutoClosure_OE',
      'Send_Email_AutoClosure_SFP',
    ]
    const isAutoClosure = workflowData.some(
      (item) =>
        AutoClosureKeys.includes(item.configurationName) &&
        (item.configurationValue === 'True' ||
          item.configurationValue === 'true'),
    )
    const payloadData = workflowData
    const autoClosureIndex = workflowData.findIndex(
      (item) => item.configurationName === 'Send_Email_AutoClosure',
    )
    if (isAutoClosure) {
      payloadData[autoClosureIndex] = {
        configurationName: 'Send_Email_AutoClosure',
        configurationValue: 'true',
      }
    } else {
      payloadData[autoClosureIndex] = {
        configurationName: 'Send_Email_AutoClosure',
        configurationValue: 'false',
      }
    }
    let resp = {}
    if (selectedAffiliateId && IsAffliiateConfig) {
      const userId = await getUserDomainID(token)
      const payload = {
        workflowConfigurationType: payloadData,
        updatedBy: userId,
        affiliateId: selectedAffiliateId,
        createdBy: userId,
      }
      resp = await updateWorkflowConfigurationAffiliateId(payload)
    } else {
      resp = await updateWorkflowConfigurations(payloadData)
    }
    TRACKEVENTOBJ.workflowConfiguration.handleSubmit()
    if (resp.statuscode === 200) {
      showToast('Workflow Configuration Updated successfully...', 'success')
      setShowModalConfig(false)
    } else {
      showToast('Error While Updating Workflow Configuration', 'error')
    }
  }
  const handleUpdateInputHrs = (e) => {
    setHrsValue(e.target.value)
    handleUpdateValues(e.target.value || 0, 'Check_Overdue_AfterHrs')
  }
  const handleUpdateInputAcHrs = (e) => {
    setHrsAcValue(e.target.value)
    handleUpdateValues(e.target.value || 0, 'AutoClosure_Timer_Hrs')
  }
  return (
    <>
      {isLoading && <Loader />}
      {!isLoading && (
        <div
          className={`d-flex flex-column justify-content-between h-100 ${styles.worlflowConfigurationContainer}`}
          data-static-id='WorkflowConfiguration.js_div_e4539d'
        >
          <div
            className={`${styles.topContainer}`}
            data-static-id='WorkflowConfiguration.js_div_dccc79'
          >
            <div
              className={`${styles.checkboxContainer}`}
              data-static-id='WorkflowConfiguration.js_div_05ad3e'
            >
              {Object.entries(checkboxData).map((item) => {
                const [title, values] = item
                if (title === 'Retrigger_Null_Instance') return
                return (
                  <div
                    key={`${title}-${values?.Send_Overdue_Email_PE}`}
                    className={`${styles.checkboxWrapper}`}
                    data-static-id='WorkflowConfiguration.js_div_052fe7'
                  >
                    <h2
                      className={`text-14-bold text-uppercase ${styles.headerContainer}`}
                      data-static-id='WorkflowConfiguration.js_h2_d494ba'
                    >
                      {checkboxTitles[title]}{' '}
                      <span
                        className='mx-1'
                        data-static-id='WorkflowConfiguration.js_span_71e298'
                      >
                        :
                      </span>
                    </h2>
                    <div
                      className={`row ${styles.rowContainer}`}
                      data-static-id='WorkflowConfiguration.js_div_d43e25'
                    >
                      {Object.entries(values).map((item) => {
                        const [key, value] = item
                        return (
                          key !== 'Send_Email_AutoClosure' && (
                            <div
                              key={`${key}-${value}`}
                              className={'col-3'}
                              data-static-id='WorkflowConfiguration.js_div_c4c8e4'
                            >
                              <Form.Check
                                reverse
                                name='group1'
                                type={'checkbox'}
                                defaultChecked={value}
                                id={`workflow-checkbox-${key}`}
                                label={getCheckboxScreen(title, key)}
                                className='text-12-regular text-uppercase'
                                onChange={(e) =>
                                  handleUpdateValues(e.target.checked, key)
                                }
                              />
                            </div>
                          )
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
            <div
              className={`${styles.numberContainer}`}
              data-static-id='WorkflowConfiguration.js_div_b6b30f'
            >
              <h4
                className={`text-14-bold text-uppercase ${styles.labelContainer}`}
                data-static-id='WorkflowConfiguration.js_h4_33a455'
              >
                Change alerts status from pending to overdue After (hrs){' '}
                <span
                  className='mx-1'
                  data-static-id='WorkflowConfiguration.js_span_9562da'
                >
                  :
                </span>
              </h4>
              <input
                className={`form-control text-16-regular fw_600 ${styles.numberInput}`}
                value={hrsValue}
                type='number'
                onChange={(e) => handleUpdateInputHrs(e)}
                data-static-id='WorkflowConfiguration.js_input_b7b309'
              />
            </div>
            <div
              className={`${styles.numberContainer}`}
              data-static-id='WorkflowConfiguration.js_div_b2c77a'
            >
              <h4
                className={`text-14-bold text-uppercase ${styles.labelContainer}`}
                data-static-id='WorkflowConfiguration.js_h4_eb9f62'
              >
                Autoclose After (hrs){' '}
                <span
                  className='mx-1'
                  data-static-id='WorkflowConfiguration.js_span_74ed4f'
                >
                  :
                </span>
              </h4>
              <input
                className={`form-control text-16-regular  fw_600 ${styles.numberInput}`}
                value={hrsAcValue}
                type='number'
                min='0'
                onChange={(e) => handleUpdateInputAcHrs(e)}
                data-static-id='WorkflowConfiguration.js_input_e3ade0'
              />
            </div>
          </div>
          <div
            className={`d-flex justify-content-end ${styles.bottonContainer}`}
            data-static-id='WorkflowConfiguration.js_div_36c6cb'
          >
            <button
              onClick={handleSubmit}
              disabled={updatedValues.length === 0}
              variant='primary'
              id='workflowConfigButton'
              className={`text-14-regular text-uppercase ${styles.submitBtn}`}
              data-static-id='WorkflowConfiguration.js_button_403c5e'
            >
              Submit
            </button>
          </div>
        </div>
      )}
    </>
  )
}
