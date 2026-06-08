import { useEffect, useRef, useState } from 'react'
import checkImg from '../../../../assets/sabic_icons/common/check.svg'
import styles from './MultiSelectV2.module.scss'
export default function MultiSelectV2({
  data = [],
  onChange,
  activeI = 0,
  initialValues,
  id,
  shouldUpdateSelected = true,
}) {
  const [isActive, setIsActive] = useState(false)
  const [currentActiveTags, setCurrentActiveTags] = useState([
    data[activeI < data?.length && activeI >= 0 ? activeI : 0],
  ])
  const [isAllSelected, setIsAllSelected] = useState(
    initialValues?.length
      ? false
      : currentActiveTags.findIndex(
          (obj) => obj?.display_name?.toLowerCase() == 'all',
        ) >= 0,
  )

  // UseEffect to Reset the value once data is changed
  useEffect(() => {
    if (shouldUpdateSelected) {
      data = data?.map((obj, i) => ({
        ...obj,
        isSelected: i == 0 ? true : false,
      }))
      const resetActiveTags = [
        data[activeI < data?.length && activeI >= 0 ? activeI : 0],
      ]
      setCurrentActiveTags(resetActiveTags)
      setIsAllSelected(
        resetActiveTags.findIndex(
          (obj) => obj?.display_name?.toLowerCase() == 'all',
        ) >= 0,
      )
    }
  }, [data])
  useEffect(() => {
    if (initialValues?.length) {
      setCurrentActiveTags(initialValues)
      const hasAllValue = initialValues.some(
        (obj) => obj?.display_name?.toLowerCase() == 'all',
      )
      if (!hasAllValue) {
        setIsAllSelected(false)
      }
    }
  }, [initialValues])
  const dropdownRef = useRef(null)
  const containerRef = useRef(null)
  document.addEventListener('mousedown', (e) => {
    if (
      !isActive &&
      dropdownRef.current &&
      !dropdownRef.current.contains(e.target) &&
      !containerRef.current.contains(e.target)
    ) {
      setIsActive((p) => false)
    }
  })
  function onSelectChange(ev, onChange) {
    let temp_tags = JSON.parse(JSON.stringify(currentActiveTags))
    const allIndex = temp_tags.findIndex(
      (obj) => obj?.display_name?.toLowerCase() == 'all',
    )

    // Remove "All" from the active tags if it's selected
    if (allIndex >= 0) {
      temp_tags.splice(allIndex, 1)
    }

    // Check if the clicked value already exists in the active tags
    const existsIndex = currentActiveTags.findIndex(
      (obj) =>
        obj?.display_name?.toLowerCase() == ev.display_name?.toLowerCase(),
    )

    // If the value exists, remove it; otherwise, add it
    if (existsIndex >= 0) {
      temp_tags = temp_tags.filter((item) => item.tag_name !== ev.tag_name)
    } else {
      temp_tags = [...temp_tags, ev]
    }

    // If "All" is clicked, deselect everything
    if (ev.display_name?.toLowerCase() === 'all') {
      if (isAllSelected) {
        setIsAllSelected(false)
        temp_tags = []
      } else {
        setIsAllSelected(true)
        temp_tags = [ev] // Only "All" should be selected
      }
    } else {
      // If "All" is already selected, and we're selecting something else, clear "All"
      if (isAllSelected) {
        setIsAllSelected(false)
        temp_tags = [ev] // Deselect "All" and select the current item
      } else {
        // If not "All", just update the active tags
        setIsAllSelected(
          temp_tags.findIndex(
            (obj) => obj?.display_name?.toLowerCase() == 'all',
          ) >= 0,
        )
      }
    }
    setCurrentActiveTags(temp_tags)
    onChange(temp_tags, ev)
  }
  function getActiveText(currentActiveTags, data) {
    if (currentActiveTags.length == 0) {
      return 'Please Select A Value'
    } else if (
      currentActiveTags.length == 1 &&
      currentActiveTags[0]?.display_name?.toLowerCase() != 'all'
    ) {
      return currentActiveTags[0]?.display_name
    } else if (
      currentActiveTags.length > 1 &&
      currentActiveTags.length < data?.length &&
      !currentActiveTags.some(
        (obj) => obj?.display_name?.toLowerCase() === 'all',
      )
    ) {
      return 'Multiple Selected'
    } else if (
      data?.length > 1 &&
      currentActiveTags.some((obj) => obj?.display_name?.toLowerCase() == 'all')
    ) {
      return 'All'
    } else if (
      currentActiveTags.length == 1 &&
      data?.length == 1 &&
      currentActiveTags[0].display_name?.toLowerCase() == 'all'
    ) {
      return '-'
    } else if (
      data?.length == currentActiveTags.length ||
      currentActiveTags.some((obj) =>
        obj?.tag_name?.toLowerCase().includes('all'),
      )
    ) {
      return 'All'
    } else {
      return '-'
    }
  }
  return (
    <div
      id={id}
      ref={containerRef}
      className={`h-100 customWidthheckboxDropdown ${styles.checkboxDropdown} ${isActive ? styles.isActive : ''} `}
      onClick={(e) => {
        if (
          isActive &&
          containerRef.current &&
          containerRef.current.contains(e.target)
        ) {
          setIsActive((p) => false)
        } else {
          setIsActive((p) => true)
        }
      }}
      data-static-id='MultiSelectV2.js_div_860e06'
    >
      <div
        className={'w-100 h-100'}
        data-static-id='MultiSelectV2.js_div_2eba4c'
      >
        <div
          className='d-flex w-100 h-100 align-items-center justify-content-between'
          data-static-id='MultiSelectV2.js_div_eff580'
        >
          <p
            className={`text-14-regular text_primary_gray text-uppercase  ${styles.dropPara}`}
            id='multi-select-click'
            data-static-id='MultiSelectV2.js_p_ced87c'
          >
            {data?.length > 0 ? getActiveText(currentActiveTags, data) : '-'}
          </p>
          {data?.length > 0 ? (
            <p
              className={`ms-1 fa fa-chevron-down ${styles.rotate_icon}`}
              data-static-id='MultiSelectV2.js_p_db3c73'
            ></p>
          ) : (
            ''
          )}
        </div>
        {data?.length > 0 ? (
          <ul
            ref={dropdownRef}
            className={`${styles.checkboxDropdownList} globalcheckboxDropdownList ${isActive ? 'd-block' : 'd-none'}`}
            style={{
              height: 'auto',
              maxHeight: '14vmin',
              overflow: 'auto',
            }}
            data-static-id='MultiSelectV2.js_ul_38a405'
          >
            {data?.map((val, i) => {
              return (
                <li
                  key={val.tag_name}
                  className={'text-uppercase'}
                  data-static-id='MultiSelectV2.js_li_f8aec7'
                >
                  <label
                    className='munti_select_label'
                    data-static-id='MultiSelectV2.js_label_77f059'
                  >
                    {
                      <>
                        <input
                          type='checkbox'
                          className='me-2 border border-danger d-none'
                          id={`multi-select-v2-${val.tag_name}`}
                          data-testid={`multi-select-v2-${val.tag_name}`}
                          value={val.tag_name}
                          name={val.tag_name}
                          onChange={(ev) => {
                            onSelectChange(val, onChange)
                          }}
                          checked={
                            isAllSelected
                              ? true
                              : val?.display_name &&
                                currentActiveTags.findIndex(
                                  (obj) =>
                                    obj?.display_name?.toLowerCase() ==
                                    val.display_name?.toLowerCase(),
                                ) >= 0
                          }
                          data-static-id='MultiSelectV2.js_input_b8a00d'
                        />

                        <div
                          className='d-flex justify-content-between w-100'
                          data-static-id='MultiSelectV2.js_div_418015'
                        >
                          <span
                            className={`${styles.dropDownTextMaxWidth}`}
                            data-static-id='MultiSelectV2.js_span_3e62a6'
                          >
                            {val.display_name}
                          </span>
                          {((val?.display_name &&
                            currentActiveTags.findIndex(
                              (obj) =>
                                obj?.display_name?.toLowerCase() ==
                                val.display_name?.toLowerCase(),
                            ) >= 0) ||
                            isAllSelected) && (
                            <img
                              alt=''
                              className={styles.checkIconImg}
                              src={checkImg}
                              data-static-id='MultiSelectV2.js_img_5138ce'
                            />
                          )}
                        </div>
                      </>
                    }
                  </label>
                </li>
              )
            })}
          </ul>
        ) : (
          ''
        )}
      </div>
    </div>
  )
}
