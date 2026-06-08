import { convertFormulaToHtml } from 'utills/utilities'
import classes from './SingleTitleCard.module.scss'
export default function SingleTitleCardWithButton({
  title,
  children,
  shadow = true,
  extraClasses = '',
  handleButtonClick,
  isVirtualEngg,
  ButtonText = 'ADD',
  extraBtnClasses = '',
  BtnIcon,
}) {
  return (
    <div
      className='w-100 h-100'
      data-static-id='SingleTitleCardWithButton.js_div_c2b05c'
    >
      <div
        className={`${classes.card_container} ${!shadow && classes.shadow_none} ${extraClasses}`}
        data-static-id='SingleTitleCardWithButton.js_div_497827'
      >
        <div
          className={`${classes.card_header} d-flex justify-content-between`}
          data-static-id='SingleTitleCardWithButton.js_div_1fdf84'
        >
          {title && (
            <div data-static-id='SingleTitleCardWithButton.js_div_6fdb96'>
              <h1
                className={`m-0 text-14-bold primary_gray  ${classes.card_header__title}`}
                data-static-id='SingleTitleCardWithButton.js_h1_411b6f'
              >
                {convertFormulaToHtml(title)}
              </h1>
            </div>
          )}
          {handleButtonClick && (
            <button
              id='add_button'
              data-testid='add-button-roles-tab'
              onClick={handleButtonClick}
              className={`text-14-regular text-uppercase d-flex align-items-center justify-content-center ${classes.btn} ${extraBtnClasses}`}
              data-static-id='SingleTitleCardWithButton.js_button_ea58f3'
            >
              {BtnIcon ? BtnIcon : <></>} {ButtonText}
            </button>
          )}
          {isVirtualEngg && (
            <button
              className={`text-14-regular text-uppercase ${isVirtualEngg?.convergeStatus === 'true' ? classes.completeBtn : classes.pendingBtn}`}
              data-static-id='SingleTitleCardWithButton.js_button_3522f0'
            >
              <i
                className={`me-2  
                  ${isVirtualEngg?.convergeStatus === 'true' ? 'fa fa-check text_primary_green' : 'fa fa-warning text_primary_orange'}`}
                data-static-id='SingleTitleCardWithButton.js_i_6e17e6'
              ></i>

              <span
                className={`${classes.btnText} ${isVirtualEngg?.convergeStatus === 'true' ? 'text_primary_green' : 'text_primary_orange'}`}
                data-static-id='SingleTitleCardWithButton.js_span_d93529'
              >
                {isVirtualEngg?.convergeStatus === 'true'
                  ? 'Model is Converged'
                  : 'Model is not Converged                    '}
              </span>
            </button>
          )}
        </div>
        <div
          className={`py-2 px-1 mt-1 ${classes.card_body}`}
          data-static-id='SingleTitleCardWithButton.js_div_aa59b4'
        >
          {children}
        </div>
      </div>
    </div>
  )
}
