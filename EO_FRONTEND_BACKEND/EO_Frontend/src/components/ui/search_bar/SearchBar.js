import { TRACKEVENTOBJ } from 'config/ActivityTrackerConfig'
import Logger from 'logger/Logger'
import { useState } from 'react'
import AsyncSelect from 'react-select/async'
import { getUsersByIdNameEmail } from 'services/ConfigServices'
import { debounce } from 'utills/utilities'
import styles from './SearchBar.module.scss'
export default function SearchBar({
  pageKey,
  title,

  onSearch,
  defaultValue = '',
  hideValue = true,
  isSearchEvent = false,
  isClearable = false,
  isDisabled = false,
}) {
  const [loadingMsg, setLoadingMsg] = useState(
    'Please Type Atleast 6 Characters',
  )
  const [isLoadingIndicator, setisLoadingIndicator] = useState(false)
  const handleSearch = (selectedData) => {
    if (isSearchEvent) {
      TRACKEVENTOBJ.searchBar.handleSearch(pageKey, title, selectedData)
    }
    onSearch(selectedData)
  }
  const loadOptions = async (inputValue, callback) => {
    if (inputValue.length >= 4) {
      setisLoadingIndicator(true)
      try {
        setLoadingMsg('Loading..')
        const response = await getUsersByIdNameEmail(inputValue)
        if (
          response &&
          Object.keys(response).includes('data') &&
          response.data
        ) {
          let data = Array.isArray(response.data)
            ? response.data
            : [response.data]
          const newOptions = data.map((item) => ({
            ...item,
            label: item.employeeName,
            value: item.employeeID,
          }))
          callback(newOptions)
          setisLoadingIndicator(false)
        } else {
          setLoadingMsg('No Data Found')
        }
      } catch (error) {
        Logger.error('Error fetching data:', error)
        setisLoadingIndicator(false)
        callback([])
      }
    } else {
      setLoadingMsg('Please type atleast 4 characters')
      setisLoadingIndicator(false)
    }
  }
  function renderComponent(isLoadingIndicator) {
    if (isLoadingIndicator) {
      return {
        DropdownIndicator: () => null,
        IndicatorSeparator: () => null,
        LoadingMessage: () => loadingMsg,
      }
    } else {
      return {
        DropdownIndicator: () => null,
        IndicatorSeparator: () => null,
        LoadingMessage: () => loadingMsg,
        LoadingIndicator: () => false,
      }
    }
  }
  return (
    <div
      data-testid='searchBarID'
      className='w-100 h-100'
      data-static-id='SearchBar.js_div_50f8f8'
    >
      <AsyncSelect
        cacheOptions
        loadOptions={debounce(loadOptions)}
        onChange={handleSearch}
        placeholder={'Search...'}
        components={renderComponent(isLoadingIndicator)}
        isLoading={false}
        defaultOptions
        isDisabled={isDisabled}
        defaultInputValue={defaultValue}
        isClearable={isClearable}
        value={hideValue ? '' : undefined}
        className={`react-select-container ${styles.searchBar} text-14-regular overflow-visible`}
        classNamePrefix='react-select'
      />
    </div>
  )
}
