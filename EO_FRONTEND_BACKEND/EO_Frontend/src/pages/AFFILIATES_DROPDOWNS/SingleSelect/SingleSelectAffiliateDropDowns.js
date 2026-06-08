import { AppAtom } from 'atoms/AppAtom'
import { TokenAtom } from 'atoms/RootAtom'
import SingleSelect from 'components/visuals/dropdown/single_select/SingleSelect'
import { TRACKEVENTOBJ } from 'config/ActivityTrackerConfig'
import { useAtomValue } from 'jotai'
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import {
  handleAffiliateChangeDropDown,
  handlePlantChangeDropDown,
  handleSystemChangeDropDown,
  processAffiliateData,
} from './SingleSelectAffiliateDropDowns.function'
import styles from './SingleSelectAffiliateDropDowns.module.scss'
const SingleSelectAffiliateDropDowns = ({
  handleAffiliateChange = () => {},
  handlePlantChange = () => {},
  handleSystemChange = () => {},
  DropDownList = ['Affiliate', 'Plant', 'System'],
  showSubmitButton = false,
  onSubmit = () => {},
  disabledSubmitButton = false,
  pageKey = '',
  title = '',
  isDropdownEvent = false,
  section,
  showAllOption,
}) => {
  const params = useParams()
  const ctxData = useAtomValue(AppAtom)
  const caseData = ctxData?.caseData || []
  const [mapData, setMapData] = useState({})
  const [selectedData, setSelectedData] = useState({
    affiliate: [],
    plants: [],
    systems: [],
    caseId: '',
    selectedAffiliate: {},
    selectedPlant: {},
    selectedSystem: {},
  })
  const token = useAtomValue(TokenAtom)
  useEffect(() => {
    const { obj, affiliateDropDownArray } = processAffiliateData(ctxData, token)
    setMapData(obj)
    setSelectedData((prev) => ({
      ...prev,
      affiliate: [...affiliateDropDownArray],
    }))
  }, [])
  return (
    <div
      className={`${styles.parentContainerDropDown} w-100 h-100`}
      data-static-id='SingleSelectAffiliateDropDowns.js_div_29fd76'
    >
      <div
        className={`${styles.dropdownMainDiv} drop-down h-100 dynamicDropdown`}
        data-static-id='SingleSelectAffiliateDropDowns.js_div_305ac1'
      >
        {/* Affiliate Dropdown */}
        <div
          className={`${styles.dropdownItem} flexColumn`}
          data-static-id='SingleSelectAffiliateDropDowns.js_div_e46163'
        >
          <span
            className='me-2 mt_03 text-14-bold text-uppercase text_primary_gray hideElement'
            data-static-id='SingleSelectAffiliateDropDowns.js_span_4e0d2a'
          >
            Affiliate :
          </span>
          <SingleSelect
            classes={{
              container: styles.dropdownContainer,
            }}
            data={selectedData?.affiliate}
            onSelectChange={(selectedAffiliate) => {
              if (isDropdownEvent) {
                TRACKEVENTOBJ.SingleSelectAffiliateDropDowns.handleAffiliateChange(
                  {
                    params,
                    caseData,
                    section,
                  },
                  pageKey,
                  title,
                  selectedAffiliate,
                )
              }
              handleAffiliateChange(selectedAffiliate)
              handleAffiliateChangeDropDown(
                selectedAffiliate,
                mapData,
                setSelectedData,
                showAllOption,
              )
            }}
          />
        </div>

        {/* Plant Dropdown */}
        {DropDownList.includes('Plant') && (
          <div
            className={`${styles.dropdownItem} flexColumn`}
            data-static-id='SingleSelectAffiliateDropDowns.js_div_530d33'
          >
            <span
              className='me-2 mt_03 text-14-bold text-uppercase text_primary_gray hideElement'
              data-static-id='SingleSelectAffiliateDropDowns.js_span_00f286'
            >
              Plant :
            </span>
            <SingleSelect
              classes={{
                container: styles.dropdownContainer,
              }}
              data={selectedData.plants}
              onSelectChange={(selectedPlant) => {
                if (isDropdownEvent) {
                  TRACKEVENTOBJ.SingleSelectAffiliateDropDowns.handlePlantChange(
                    {
                      params,
                      caseData,
                      section,
                    },
                    pageKey,
                    title,
                    selectedPlant,
                  )
                }
                handlePlantChange(selectedPlant)
                handlePlantChangeDropDown(
                  selectedPlant,
                  mapData,
                  setSelectedData,
                  showAllOption,
                )
              }}
            />
          </div>
        )}

        {/* System Dropdown */}
        {DropDownList.includes('System') && (
          <div
            className={`${styles.dropdownItem} flexColumn`}
            data-static-id='SingleSelectAffiliateDropDowns.js_div_6da4d6'
          >
            <span
              className='me-2 mt_03 text-14-bold text-uppercase text_primary_gray hideElement'
              data-static-id='SingleSelectAffiliateDropDowns.js_span_a7e446'
            >
              System :
            </span>
            <SingleSelect
              classes={{
                container: styles.dropdownContainer,
              }}
              data={selectedData.systems}
              onSelectChange={(selectedSystem) => {
                if (isDropdownEvent) {
                  TRACKEVENTOBJ.SingleSelectAffiliateDropDowns.handleSystemChange(
                    {
                      params,
                      caseData,
                      section,
                    },
                    pageKey,
                    title,
                    selectedSystem,
                  )
                }
                handleSystemChange(selectedSystem)
                handleSystemChangeDropDown(selectedSystem, setSelectedData)
              }}
            />
          </div>
        )}

        {/* Submit Button */}
        {showSubmitButton && (
          <div
            className={styles.buttonContainer}
            data-static-id='SingleSelectAffiliateDropDowns.js_div_7bf818'
          >
            <button
              type='button'
              className={`text-14-bold ${disabledSubmitButton ? styles.disabled_button : styles.enable_button}`}
              onClick={() => {
                onSubmit(selectedData, setSelectedData)
              }}
              disabled={disabledSubmitButton}
              data-static-id='SingleSelectAffiliateDropDowns.js_button_81f9fa'
            >
              Submit
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
export default SingleSelectAffiliateDropDowns
