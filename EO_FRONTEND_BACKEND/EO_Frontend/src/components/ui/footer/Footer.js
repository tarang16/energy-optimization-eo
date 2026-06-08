import { AppAtom } from 'atoms/AppAtom'
import { TokenAtom } from 'atoms/RootAtom'
import { TimeZoneAtom } from 'atoms/TimeZoneAtom'
import CustomModal from 'components/visuals/common/modal/CustomModal'
import { TRACKEVENTOBJ } from 'config/ActivityTrackerConfig'
import { DEFAULT_TIMEZONE } from 'config/Config'
import { useAtomValue, useSetAtom } from 'jotai'
import moment from 'moment-timezone'
import { useEffect, useState } from 'react'
import { useLocation, useParams } from 'react-router-dom'
import Select from 'react-select'
import { addUserPreference } from 'services/FavoriteService'
import { getUserTimeZone, showToast } from 'utills/utilities'
const Footer = ({ setIsLoading = () => {} }) => {
  const params = useParams()
  const location = useLocation()
  const appContext = useAtomValue(AppAtom)
  const caseData = appContext?.caseData || []
  const setDefaultTimezone = useSetAtom(TimeZoneAtom)
  const [currentTimezone, setCurrentTimezone] = useState('Asia/Riyadh')
  const [timezoneOptions, setTimezoneOptions] = useState([])
  const [showTimeZone, setShowTimeZone] = useState(false)
  const [selectedTimeZone, setSelectedTimeZone] = useState('Asia/Riyadh')
  const token = useAtomValue(TokenAtom)
  const handleTimeZone = async () => {
    const isConfirmed = window.confirm(
      'You are requesting a timezone update. This may alter the presentation of timestamps across the application for your account. Do you wish to continue with this update?',
    )
    if (!isConfirmed) {
      return
    }
    setIsLoading(true)
    TRACKEVENTOBJ.footer.handleTimeZone({
      params,
      caseData,
      location,
      selectedTimeZone,
    })
    const response = await addUserPreference(selectedTimeZone)
    if (response.statuscode === 200) {
      setDefaultTimezone(selectedTimeZone)
      moment?.tz?.setDefault(selectedTimeZone)
      setShowTimeZone(false)
      setCurrentTimezone(selectedTimeZone)
      showToast('Timezone Updated successfully...', 'success')
    } else {
      showToast('Error while updating Timezone...', 'error')
    }
    setIsLoading(false)
  }
  const handleDropDownSelect = (tmz) => {
    setSelectedTimeZone(tmz?.label)
  }
  useEffect(() => {
    const fetchAndSetData = async () => {
      const tmz = (await getUserTimeZone(token)) ?? DEFAULT_TIMEZONE
      setCurrentTimezone(tmz)
      setSelectedTimeZone(tmz)
      const allTimezones = moment.tz.names()
      // moving current timezone at the top
      const indexOfCurrentTimeZone = allTimezones?.indexOf(tmz)
      if (indexOfCurrentTimeZone !== -1) {
        allTimezones?.splice(indexOfCurrentTimeZone, 1)
        allTimezones?.unshift(tmz)
      }
      // dropdown data
      const dropDownData = allTimezones?.map((timezone) => ({
        value: timezone,
        label: timezone,
      }))
      setTimezoneOptions(dropDownData)
    }
    fetchAndSetData()
  }, [])
  return (
    <>
      <footer
        className='h-100 w-100 d-flex align-items-center text-14-regular text_primary_gray_2 justify-content-between'
        style={{
          padding: '0 1vmin',
        }}
        data-static-id='Footer.js_footer_9c2374'
      >
        <span
          className='align-items-center text-14-regular text_primary_gray_3'
          style={{
            lineHeight: '1.4vmin',
          }}
          data-static-id='Footer.js_span_16bc21'
        >
          &copy; {moment().format('YYYY')} Saudi Basic Industries Corporation
          (SABIC), All Rights Reserved
        </span>

        <div
          className={'d-flex align-items-center footerDrodownContainer'}
          data-static-id='Footer.js_div_ccb45b'
        >
          <div
            className='text-14-regular text_primary_gray'
            data-static-id='Footer.js_div_df3910'
          >
            Timezone
            <span className='ms-1 me-2' data-static-id='Footer.js_span_efe127'>
              :
            </span>
            <span
              className='ms-1 me-2 text-14-regular text_primary_gray'
              style={{
                textDecoration: 'underline',
                cursor: 'pointer',
              }}
              onClick={() => {
                setShowTimeZone(true)
              }}
              data-static-id='Footer.js_span_86dee4'
            >
              {currentTimezone}
            </span>
          </div>
          <CustomModal
            show={showTimeZone}
            title='SET TIMEZONE'
            hideModal={() => {
              setShowTimeZone(false)
            }}
            modalHeight={'40vmin'}
            size={'md'}
            contentFitWidth={'timeZoneModalContent'}
          >
            <div
              className='timeZoneModalContent'
              data-static-id='Footer.js_div_4dea8a'
            >
              <div data-static-id='Footer.js_div_873572'>
                <div data-static-id='Footer.js_div_8db46d'>
                  <Select
                    value={{
                      value: selectedTimeZone,
                      label: selectedTimeZone,
                    }}
                    className={'text-14-regular customSelectBoxFooterTimezone'}
                    onChange={handleDropDownSelect}
                    options={timezoneOptions}
                    placeholder='Select Timeezone'
                    classNamePrefix='react-selectTimezone'
                    data-static-id='Footer.js_Select_761ec2'
                  />
                </div>
              </div>
              <div
                className='d-flex justify-content-center'
                data-static-id='Footer.js_div_86f373'
              >
                <button
                  onClick={handleTimeZone}
                  className='text-14-bold  submitButton'
                  data-static-id='Footer.js_button_e3d045'
                >
                  Submit
                </button>
              </div>
            </div>
          </CustomModal>
        </div>
      </footer>
    </>
  )
}
export default Footer
