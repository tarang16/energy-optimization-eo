import { convertFormulaToHtml } from 'utills/utilities'
import classes from './SingleTitleCard.module.scss'
export default function SingleTitleCardExtraComponent({
  title,
  children,
  shadow = true,
  extraClasses = '',
  rightHtml,
  tabs = [],
}) {
  return (
    <div
      className='w-100 h-100'
      data-static-id='SingleTitleCardWithExtraComponent.js_div_fb2a7a'
    >
      <div
        className={`${classes.card_container} ${!shadow && classes.shadow_none} ${extraClasses} card-container`}
        data-static-id='SingleTitleCardWithExtraComponent.js_div_c1ef25'
      >
        <div
          className={`${classes.card_header} d-flex justify-content-between`}
          data-static-id='SingleTitleCardWithExtraComponent.js_div_862279'
        >
          {title && (
            <h1
              className={`m-0 text-14-bold primary_gray  ${classes.card_header__title}`}
              data-static-id='SingleTitleCardWithExtraComponent.js_h1_7c7ae9'
            >
              {convertFormulaToHtml(title)}
            </h1>
          )}
          <div data-static-id='SingleTitleCardWithExtraComponent.js_div_383c97'>
            {rightHtml}
            {tabs}
          </div>
        </div>
        <div
          className={`pt-1  ${classes.card_body}`}
          data-static-id='SingleTitleCardWithExtraComponent.js_div_35a4c2'
        >
          {children}
        </div>
      </div>
    </div>
  )
}
