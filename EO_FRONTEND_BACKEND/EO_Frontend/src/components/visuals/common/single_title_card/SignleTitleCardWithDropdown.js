import MultiSelectV2 from 'components/visuals/dropdown/multi_select/MultiSelectV2'
import { useEffect, useRef, useState } from 'react'
import { convertFormulaToHtml } from 'utills/utilities'
import cancelIcon from '../../../../assets/sabic_icons/common/gray_cross.svg'
import searchIcon from '../../../../assets/sabic_icons/header/search_icon.svg'
import classes from './SignleTitleCardWithDropdown.module.scss'
export default function SignleTitleCardWithDropdown({
  children,
  title,
  shadow = true,
  extraClasses = '',
  dropDownItems,
  onSelectChange,
  initialValues,
  handleSearchChange,
  onBlur,
  searchQuery = '',
  dropdownTitle,
}) {
  const initialCat = 0
  const [isSearchVisible, setIsSearchVisible] = useState(false)
  const searchRef = useRef(null)
  const toggleSearchVisibility = () => {
    setIsSearchVisible(!isSearchVisible)
    handleSearchChange('')
  }
  const handleClickOutside = (event) => {
    if (
      searchRef.current &&
      !searchRef.current.contains(event.target) &&
      searchQuery === ''
    ) {
      setIsSearchVisible(false)
    }
  }
  useEffect(() => {
    if (isSearchVisible) {
      document.addEventListener('mousedown', handleClickOutside)
    } else {
      document.removeEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isSearchVisible, searchQuery])
  return (
    <div
      className='w-100 h-100'
      data-static-id='SignleTitleCardWithDropdown.js_div_d9f4ed'
    >
      <div
        className={`${classes.card_container} ${!shadow && classes.shadow_none} ${extraClasses}`}
        data-static-id='SignleTitleCardWithDropdown.js_div_87af3b'
      >
        <div
          className={`${classes.card_header} d-flex justify-content-between`}
          data-static-id='SignleTitleCardWithDropdown.js_div_0be0d5'
        >
          {title && (
            <div
              className={`${classes.leftContainer}`}
              data-static-id='SignleTitleCardWithDropdown.js_div_b12932'
            >
              <h1
                className={`m-0 text-14-bold primary_gray  ${classes.card_header__title}`}
                data-static-id='SignleTitleCardWithDropdown.js_h1_ebc4f3'
              >
                {convertFormulaToHtml(title)}
              </h1>
            </div>
          )}
          <div
            className={`${classes.rightContainer}`}
            data-static-id='SignleTitleCardWithDropdown.js_div_6fcfa5'
          >
            <div
              className={`${classes.searchWrapper}`}
              data-static-id='SignleTitleCardWithDropdown.js_div_966506'
            >
              {handleSearchChange && (
                <div
                  ref={searchRef}
                  className={`d-flex align-items-center justify-content-end ${classes.innerSearchWrapper}`}
                  data-static-id='SignleTitleCardWithDropdown.js_div_541b62'
                >
                  <div
                    className={`${classes.searcbarContainer} ${isSearchVisible ? classes.visible : classes.hidden}`}
                    data-static-id='SignleTitleCardWithDropdown.js_div_2bcdc6'
                  >
                    <input
                      type='search'
                      id='monitoring-search-input'
                      placeholder='Search...'
                      data-testid='search_input_field'
                      className={`text-12-regular h-100 ${classes.search_input}`}
                      value={searchQuery}
                      aria-label='Search'
                      onBlur={(e) => onBlur(e.target.value)}
                      onChange={(e) => {
                        handleSearchChange(e.target.value)
                      }}
                      data-static-id='SignleTitleCardWithDropdown.js_input_0d40b0'
                    />
                  </div>
                  <div
                    className={`${classes.searchIconContainer}`}
                    data-static-id='SignleTitleCardWithDropdown.js_div_c5fbb4'
                  >
                    <button
                      className={classes.searchIconButton}
                      onClick={toggleSearchVisibility}
                      aria-label='Toggle search'
                      data-static-id='SignleTitleCardWithDropdown.js_button_c4a8bd'
                    >
                      {isSearchVisible ? (
                        <img
                          alt=''
                          src={cancelIcon}
                          className={`${classes.toggleIcon}`}
                          id='monitoring-cancel-search'
                          data-static-id='SignleTitleCardWithDropdown.js_img_2ba24a'
                        />
                      ) : (
                        <img
                          alt=''
                          src={searchIcon}
                          className={`${classes.toggleIcon}`}
                          id='monitoring-search-icon'
                          data-static-id='SignleTitleCardWithDropdown.js_img_00a649'
                        />
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div
              className={`${classes.multiSelectContainer}`}
              data-static-id='SignleTitleCardWithDropdown.js_div_bff03f'
            >
              {dropdownTitle && (
                <span
                  className='me-2 text-14-bold mt_03'
                  data-static-id='SignleTitleCardWithDropdown.js_span_b7a21c'
                >
                  {dropdownTitle}:
                </span>
              )}
              <MultiSelectV2
                data={dropDownItems}
                classes={{
                  container: classes.chartdropdown,
                  caretContainer: classes.caretContainer,
                  optionContainer: classes.optionContainer,
                  option: classes.option,
                }}
                onChange={onSelectChange}
                position='1'
                activeI={initialCat >= 0 ? initialCat : 0}
                initialValues={initialValues || []}
              />
            </div>
          </div>
        </div>
        <div
          className={`${classes.card_body} w-100 p-0 m-0 table-container`}
          id='table-container'
          data-static-id='SignleTitleCardWithDropdown.js_div_0326d9'
        >
          {children}
        </div>
      </div>
    </div>
  )
}
