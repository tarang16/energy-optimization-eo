import variables from '@/config/scss/variables'
import style from './Message.module.scss'
const MessageModal = ({ show, type = 'success', message, onOk }) => {
  if (!show) return null
  const isSuccess = type === 'success'
  return (
    <div className={style.overlay} data-static-id='MessageModal.js_div_cc2e48'>
      <div
        className={`${style.messageBox} shadow-lg`}
        data-static-id='MessageModal.js_div_bfb982'
      >
        {/* Icon */}
        <div
          className={`${style.icon} ${isSuccess ? style.successIcon : style.errorIcon}`}
          data-static-id='MessageModal.js_div_0278ee'
        >
          <span
            className='mt-1 text-22-bold text_primary_white'
            data-static-id='MessageModal.js_span_6d4848'
          >
            {isSuccess ? '✓' : '✕'}
          </span>
        </div>
        {/* Title */}
        <h4
          className='mt-3 text_primary_black'
          data-static-id='MessageModal.js_h4_1b7136'
        >
          {isSuccess ? 'Success' : 'Error'}
        </h4>
        {/* Message */}
        <p
          className='text-muted mt-2 text-20-regular text_primary_gray'
          data-static-id='MessageModal.js_p_9dc582'
        >
          {message}
        </p>
        {/* Buttons */}
        <div
          className='d-flex justify-content-center gap-3 mt-4'
          data-static-id='MessageModal.js_div_9e1338'
        >
          <button
            className={`btn ${isSuccess ? 'btn-success' : 'btn-danger'} px-5`}
            style={{
              backgroundColor: variables.primary_orange,
            }}
            onClick={onOk}
            data-static-id='MessageModal.js_button_1ae3a3'
          >
            <span
              className='text-20-bold text_primary_white'
              data-static-id='MessageModal.js_span_ad0e23'
            >
              Ok
            </span>
          </button>
        </div>
      </div>
    </div>
  )
}
export default MessageModal
