import checkImg from 'assets/sabic_icons/common/check.svg'
import { useEffect, useRef, useState } from 'react'
import Select, { components } from 'react-select'
import { isClickOutside } from 'utills/utilities'
import styles from './MultiSelectV2.module.scss'
// Custom Option Component

const CustomOption = ({ data, isSelected, innerRef, innerProps }) => {
  const [isHovered, setIsHovered] = useState(false)
  let backgroundColor = ''
  if (isHovered) {
    backgroundColor = styles.primary_gray_5
  } else if (isSelected) {
    backgroundColor = styles.primary_white
  }
  return (
    <div
      ref={innerRef}
      {...innerProps}
      style={{
        backgroundColor,
      }}
      className={`
        ${styles.multiSelectDropdown_custom} 
   `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      data-static-id='CustomMultiSelect.js_div_90127a'
    >
      <span data-static-id='CustomMultiSelect.js_span_56583e'>{data.name}</span>
      {isSelected && (
        <img
          className={`${styles.selectImageIcon}`}
          src={checkImg}
          alt='Selected'
          data-static-id='CustomMultiSelect.js_img_dda811'
        />
      )}
    </div>
  )
}
const CustomValueContainer = ({ children, ...props }) => {
  const getLabel = () => {
    const selectedValues = props.getValue()
    const isAllSelected =
      selectedValues.length === props.options.length ||
      selectedValues.some((opt) => opt?.id === 'all')
    if (isAllSelected) {
      return 'ALL'
    }
    if (selectedValues.length === 1) {
      return selectedValues[0]?.name ?? 'PLEASE SELECT A VALUE...'
    }
    if (selectedValues.length > 1) {
      return 'MULTIPLE SELECTED'
    }
    if (selectedValues.length < 1) {
      return 'PLEASE SELECT A VALUE...'
    }
    return 'SELECT...'
  }
  return (
    <components.ValueContainer
      {...props}
      className={`${styles.flexCenterContainer}`}
    >
      <span
        className={`text-14-regular text_primary_gray text-uppercase ${styles.getLabelValueText}`}
        data-static-id='CustomMultiSelect.js_span_84d11d'
      >
        {getLabel()}
      </span>

      <div
        style={{
          position: 'absolute',
          width: '1px',
          height: '1px',
          opacity: 0,
          overflow: 'hidden',
          pointerEvents: 'none',
        }}
        data-static-id='CustomMultiSelect.js_div_efd63a'
      >
        {children}
      </div>
    </components.ValueContainer>
  )
}
// Custom Multi-Select Component
const CustomMultiSelect = ({
  options = [],
  externalSelectedvalues = [],
  extraWidthClass = ' ',
  setFunction = () => {},
}) => {
  const [selectedOptions, setSelectedOptions] = useState([])
  const [menuIsOpen, setMenuIsOpen] = useState(false)
  const selectRef = useRef(null)
  useEffect(() => {
    document.addEventListener('mousedown', (event) => {
      if (isClickOutside(event, selectRef)) {
        setMenuIsOpen(false)
      }
    })
    return () => {
      document.removeEventListener('mousedown', isClickOutside)
    }
  }, [])
  const onAllClick = (actionMeta) => {
    if (actionMeta.action === 'select-option') {
      setSelectedOptions(options)
    } else {
      setSelectedOptions([])
    }
    setMenuIsOpen(false) // Close dropdown after selecting all
  }
  const onOptionClick = (selected, actionMeta) => {
    let updatedSelected = selected?.filter(({ id }) => id !== 'all')
    if (selectedOptions.length === options.length) {
      // If all options were selected and one is clicked, select only that one
      updatedSelected = [actionMeta.option]
    } else if (updatedSelected.length === options.length - 1) {
      // If all but one are selected, select all
      updatedSelected = [...options]
    }
    setSelectedOptions(updatedSelected)
  }
  const handleChange = (selected, actionMeta) => {
    if (actionMeta.option?.id === 'all') {
      onAllClick(actionMeta)
    } else {
      onOptionClick(selected, actionMeta)
    }
  }
  useEffect(() => {
    setFunction(selectedOptions?.filter(({ id }) => id !== 'all'))
  }, [JSON.stringify(selectedOptions)])
  useEffect(() => {
    if (options?.length) {
      setSelectedOptions(options)
    }
  }, [JSON.stringify(options)])

  // Custom styles
  const customStyles = {
    dropdownIndicator: (provided) => ({
      ...provided,
      transform: menuIsOpen ? 'rotateX(180deg)' : 'rotate(0deg)',
      transition: 'transform 0.3s ease',
    }),
  }
  return (
    <Select
      ref={selectRef}
      className='text-14-regular customSelectBoxField w-100 customSelect_dropdown text-uppercase'
      classNamePrefix={`${extraWidthClass} react-select-modifyDetails`}
      options={options}
      value={
        externalSelectedvalues?.length > 0
          ? externalSelectedvalues
          : selectedOptions
      }
      onChange={handleChange}
      isMulti
      closeMenuOnSelect={false} // Allow multiple selections
      hideSelectedOptions={false}
      isClearable={false}
      menuIsOpen={menuIsOpen}
      onMenuOpen={() => setMenuIsOpen(true)} // Handle dropdown open
      onMenuClose={() => setMenuIsOpen(false)} // Handle dropdown close
      getOptionLabel={(option) => option.name}
      getOptionValue={(option) => option.id}
      styles={customStyles}
      menuPortalTarget={document.body}
      components={{
        ValueContainer: CustomValueContainer,
        Option: CustomOption,
        IndicatorSeparator: () => null, // Dropdown Seperator
      }}
      data-static-id='CustomMultiSelect.js_Select_b27db3'
    />
  )
}
export default CustomMultiSelect
