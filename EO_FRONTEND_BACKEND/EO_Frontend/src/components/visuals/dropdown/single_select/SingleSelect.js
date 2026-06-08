import variables from 'config/scss/variables'
import { useEffect, useMemo, useRef, useState } from 'react'
import { convertFormulaToHtml } from 'utills/utilities'
import checkImg from '../../../../assets/sabic_icons/common/check.svg'
import styles from './SingleSelect.module.scss'
function SingleSelect({
  data,
  onSelectChange,
  position,
  activeI,
  classes,
  labelKey = 'display_name',
  disabled = false,
  placeholder,
}) {
  const [selectActiveI, setSelectActiveI] = useState(activeI)
  const [activeValue, setActiveValue] = useState(
    data[selectActiveI]?.[labelKey],
  )
  const singleSelectMenu = useRef(null)
  const containerRef = useRef(null)
  useEffect(() => {
    setSelectActiveI((p) => activeI)
    setActiveValue((p) => data[activeI]?.[labelKey])
  }, [activeI, data])
  const [isDropDownActive, setIsDropDownActive] = useState(false)
  document.addEventListener('mousedown', (e) => {
    if (
      isDropDownActive &&
      singleSelectMenu.current &&
      !singleSelectMenu.current.contains(e.target) &&
      !containerRef.current.contains(e.target)
    ) {
      setIsDropDownActive((p) => false)
    }
  })
  return (
    <div
      className={`blue_dropdown_container h-100 ${styles.dropdown} ${classes.container} ${disabled ? styles.disabled : ''}`}
      data-static-id='SingleSelect.js_div_0a93de'
    >
      <div
        className={`blue_dropdownSelect drop-down-select h-100 ${styles.dropdownSelect} ${classes.dropdownSelect} ${data.length === 0 || disabled ? styles.disabled : ''} ${isDropDownActive ? 'focusColor' : ''}`}
        id='single-select-click'
        data-testid='single-select-click'
        ref={containerRef}
        onClick={(e) => {
          if (!disabled) {
            if (
              isDropDownActive &&
              containerRef.current &&
              containerRef.current.contains(e.target)
            ) {
              setIsDropDownActive((p) => false)
            } else {
              setIsDropDownActive((p) => true)
            }
          }
        }}
        data-static-id='SingleSelect.js_div_37eeb1'
      >
        <span
          className={`text-start text-12-regular text_primary_gray text-uppercase active-value ${styles.activeVal}`}
          data-static-id='SingleSelect.js_span_e1263c'
        >
          {activeValue ? convertFormulaToHtml(activeValue) : placeholder}
        </span>
        <div
          className={`${styles.dropdown_icon} ${isDropDownActive ? styles.rotateDropdownIcon : ' '}`}
          data-static-id='SingleSelect.js_div_96c4d8'
        ></div>
      </div>
      <ul
        ref={singleSelectMenu}
        className={`blue_dropdownList ${styles.dropdownList} ${classes.dropdownList} ${isDropDownActive ? styles.dropDownActive : ''}`}
        data-static-id='SingleSelect.js_ul_6feb1d'
      >
        {data.map((val, i) => {
          return (
            <li
              className={`blue_dropdownOption ${styles.dropdownOption} text-uppercase`}
              style={{
                backgroundColor:
                  i == selectActiveI ? variables.primary_gray_4 : '',
                color: i == selectActiveI ? variables.primary_gray : '',
              }}
              key={val?.[labelKey]}
              data-value={val?.tag_name}
              id='single-select-icon-click'
              onClick={() => {
                if (!disabled) {
                  setSelectActiveI((p) => i)
                  setActiveValue((prv) => val?.[labelKey])
                  setIsDropDownActive((prv) => !isDropDownActive)
                  onSelectChange(val, i)
                }
              }}
              data-static-id='SingleSelect.js_li_4abfd5'
            >
              <div
                className='d-flex justify-content-between align-items-center'
                data-static-id='SingleSelect.js_div_5cbb08'
              >
                <span
                  className='text-12-regular custom_font'
                  data-static-id='SingleSelect.js_span_85fb42'
                >
                  {convertFormulaToHtml(val?.[labelKey])}
                </span>
                {(i == selectActiveI || activeValue === 'ALL') && (
                  <img
                    alt=''
                    className={`checkIconImg ${styles.checkIconImg}`}
                    src={checkImg}
                    data-static-id='SingleSelect.js_img_6d0768'
                  />
                )}
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
const MemoizedComponent = ({
  data = [],
  onSelectChange = () => {},
  position = 0,
  activeI = 0,
  classes = '',
  labelKey = 'display_name',
  disabled = false,
  placeholder = 'Select',
}) => {
  return useMemo(
    () => (
      <SingleSelect
        data={data}
        onSelectChange={onSelectChange}
        position={position}
        activeI={activeI}
        classes={classes}
        labelKey={labelKey}
        disabled={disabled}
        placeholder={placeholder}
      />
    ),
    [JSON.stringify(data), activeI, onSelectChange, disabled],
  )
}
export default MemoizedComponent
