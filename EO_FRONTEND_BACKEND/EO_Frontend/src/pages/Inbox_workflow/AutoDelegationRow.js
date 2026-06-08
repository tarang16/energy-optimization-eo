import SearchBar from 'components/ui/search_bar/SearchBar'
import Switch from 'components/ui/switch/Switch'
import moment from 'moment'
import { memo } from 'react'
import DatePicker from 'react-datepicker'
import { getKSAMomentWithTimeAsZero } from 'utills/utilities'
import { formatDate } from './AutoDelegation.function'
import styles from './AutoDelegation.module.scss'
const Row = memo(({ data, index, setDelegateData, delegateData }) => {
  const { assigneToName, active, notAvailableUptoEpoch, affiliateId } = data
  let newData = {
    ...data,
  }
  const handleChange = (type, value) => {
    if (type === 'rc') {
      newData = {
        ...newData,
        assignedTo: value.employeeId.toString(),
        assignedToEmployeeName: value.label,
      }
    }
    if (type === 'days') {
      if (value && value < 1) {
        return
      }
      newData = {
        ...newData,
        delegatedAfterDays: value || null,
      }
    }
    if (type === 'active') {
      newData = {
        ...newData,
        active: value,
      }
    }
    if (type === 'date') {
      const newDate = getKSAMomentWithTimeAsZero(value)
      newData = {
        ...newData,
        notAvailableUpto: newDate,
        notAvailableUptoEpoch: moment(value).valueOf(),
        formattedDate: formatDate(newDate),
      }
    }
    const newArray = [
      ...delegateData.slice(0, index),
      newData,
      ...delegateData.slice(index + 1),
    ]
    setDelegateData(newArray)
  }
  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(today.getDate() + 1)
  return (
    <tr key={affiliateId} data-static-id='AutoDelegationRow.js_tr_130d9d'>
      <td data-static-id='AutoDelegationRow.js_td_19cb94'>
        {!active ? (
          <input
            disabled={!active}
            value={assigneToName}
            className='text-14-regular'
            style={{
              width: '100%',
              height: '100%',
            }}
            placeholder='Search..'
            data-static-id='AutoDelegationRow.js_input_59d6b0'
          />
        ) : (
          <SearchBar
            onSearch={(val) => handleChange('rc', val)}
            isDisabled={!active}
            defaultValue={assigneToName}
            hideValue={false}
          />
        )}
      </td>
      <td data-static-id='AutoDelegationRow.js_td_17bd46'>
        <div
          className={`${styles.DatePickerContainer}`}
          data-static-id='AutoDelegationRow.js_div_681f0e'
        >
          <DatePicker
            className={`form-control text-14-regular text-uppercase w-100 ${styles.InputContainer} text-primary-gray pe-2 ps-2`}
            dateFormat='dd-MMM-yyyy'
            selected={notAvailableUptoEpoch}
            onChange={(val) => handleChange('date', val)}
            popperPlacement='bottom-end'
            portalId='root-portal'
            minDate={tomorrow}
            popperProps={{
              positionFixed: true,
            }}
            disabled={!active}
            placeholderText='Select a date'
          />
        </div>
      </td>
      <td data-static-id='AutoDelegationRow.js_td_f7dd1a'>
        <div
          className='flexCenterContainer'
          data-static-id='AutoDelegationRow.js_div_751ff3'
        >
          <Switch
            type='checkbox'
            checked={active}
            onChange={(e) => handleChange('active', e.target.checked)}
          />
        </div>
      </td>
    </tr>
  )
})
export default Row
export const customStyles = {
  control: (provided) => ({
    ...provided,
    height: '4.5vmin',
    margin: '0',
    minHeight: '4.5vmin',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: 'none',
    '&:hover': {
      borderColor: '#C6C8CA',
    },
  }),
  input: (provided) => ({
    ...provided,
    margin: '0',
  }),
  menu: (provided) => ({
    ...provided,
    marginTop: '0',
  }),
  valueContainer: (provided) => ({
    ...provided,
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '1vmin',
  }),
  option: (provided, state) => ({
    ...provided,
    padding: '1vmin',
    margin: 0,
    backgroundColor:
      state.isFocused || state.isSelected ? '$primary_gray' : '$primary_gray_2',
    color: '$primary_white',
    cursor: 'pointer',
    fontSize: '1.4vmin',
    '&:hover': {
      backgroundColor: '#E6E7E8',
    },
  }),
  indicatorsContainer: (provided) => ({
    ...provided,
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  }),
  menuPortal: (provided) => ({
    ...provided,
    zIndex: 9999, // Ensure it appears above the modal
  }),
}
