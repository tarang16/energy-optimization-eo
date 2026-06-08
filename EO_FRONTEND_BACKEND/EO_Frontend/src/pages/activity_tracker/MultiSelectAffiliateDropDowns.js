import styles from '../AFFILIATES_DROPDOWNS/SingleSelect/SingleSelectAffiliateDropDowns.module.scss'
import { AppAtom } from 'atoms/AppAtom'
import MultiSelectV2 from 'components/visuals/dropdown/multi_select/MultiSelectV2'
import { TRACKEVENTOBJ } from 'config/ActivityTrackerConfig'
import { useAtomValue } from 'jotai'
import { useEffect, useState } from 'react'
import { useLocation, useParams } from 'react-router-dom'
import { groupBy } from 'utills/utilities'
const MultiSelectAffiliateDropDowns = ({
  handleAffiliateChange = () => {},
  isDropdownEvent = false,
  section,
  showSubmitButton = false,
  onSubmit = () => {},
  disabledSubmitButton = false,
}) => {
  const params = useParams()
  const location = useLocation()
  const ctxData = useAtomValue(AppAtom)
  const caseData = ctxData?.caseData
  const [selectedData, setSelectedData] = useState({
    affiliate: [],
    allAffiliates: [],
  })
  useEffect(() => {
    const allAffiliates = []
    const groupedAffiliates = groupBy(caseData, (x) => x.affiliate_code)
    Object.entries(groupedAffiliates).forEach(([key, plants]) => {
      const recordObj = plants[0]
      allAffiliates.push({
        display_name: recordObj.affiliate,
        tag_name: recordObj.affiliate_code,
      })
    })
    setSelectedData((prev) => ({
      affiliate: [
        {
          display_name: 'ALL',
          tag_name: 'all',
        },
        ...allAffiliates,
      ],
      allAffiliates,
    }))
  }, [ctxData?.caseData])
  function handleAffiliateChangeDropDown(selectedVals, value) {
    const isAllSelected = selectedVals.some(
      (val) => val.tag_name.toLowerCase() === 'all',
    )
    let affiliateVals = []
    if (isAllSelected) {
      affiliateVals = selectedData.allAffiliates
    } else {
      affiliateVals = [...affiliateVals, ...selectedVals]
    }
    if (isDropdownEvent) {
      TRACKEVENTOBJ.userStatistics.handleFilterChange(
        {
          params,
          caseData,
          section,
          location,
        },
        value,
        'Affiliate',
      )
    }
    handleAffiliateChange(affiliateVals, isAllSelected)
  }
  return (
    <div
      className={`${styles.parentContainerDropDown} w-100 h-100`}
      data-static-id='MultiSelectAffiliateDropDowns.js_div_68fed3'
    >
      <div
        className={`${styles.dropdownMainDiv} drop-down h-100 dynamicDropdown`}
        data-static-id='MultiSelectAffiliateDropDowns.js_div_57e2da'
      >
        <div
          className={`${styles.dropdownItem} customWidth`}
          data-static-id='MultiSelectAffiliateDropDowns.js_div_3f4916'
        >
          <span
            className='me-2 mt_03 text-14-bold text-uppercase text_primary_gray hideElement'
            data-static-id='MultiSelectAffiliateDropDowns.js_span_3f60dd'
          >
            Affiliate :
          </span>
          <MultiSelectV2
            data={selectedData.affiliate}
            // initialValues={selectedData.affiliate}
            activeI={0}
            onChange={handleAffiliateChangeDropDown}
          />
        </div>
      </div>
      {showSubmitButton && (
        <div
          className='pt-4'
          data-static-id='MultiSelectAffiliateDropDowns.js_div_6fc629'
        >
          <button
            type='button'
            className='btn btn-primary'
            onClick={onSubmit}
            disabled={disabledSubmitButton}
            data-static-id='MultiSelectAffiliateDropDowns.js_button_fb1634'
          >
            Submit
          </button>
        </div>
      )}
    </div>
  )
}
export default MultiSelectAffiliateDropDowns
