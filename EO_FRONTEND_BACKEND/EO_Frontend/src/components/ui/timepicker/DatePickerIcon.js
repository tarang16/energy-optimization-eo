import { forwardRef, memo } from 'react'
import calenderImg from '../../../assets/sabic_new_icons/calendar_icon.svg'
import styles from './DateTimePicker.module.scss'
const DatePickerIcon = forwardRef(({ value, onClick }, ref) => (
  <button
    className={`${styles.cal_display_icon}`}
    onClick={onClick}
    data-static-id='DatePickerIcon.js_button_4f5b69'
  >
    <input
      type='hidden'
      ref={ref}
      value={value}
      readOnly
      data-static-id='DatePickerIcon.js_input_f8c938'
    />
    <img
      alt=''
      src={calenderImg}
      data-static-id='DatePickerIcon.js_img_248fd6'
    />
  </button>
))
export default memo(DatePickerIcon)
