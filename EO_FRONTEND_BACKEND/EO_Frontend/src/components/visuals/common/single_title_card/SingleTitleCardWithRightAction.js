import { convertFormulaToHtml } from 'utills/utilities'
import classes from './SingleTitleCard.module.scss'
export default function SingleTitleCard({
  title,
  children,
  shadow = true,
  extraClasses = '',
}) {
  return (
    <div
      className='w-100 h-100'
      data-static-id='SingleTitleCardWithRightAction.js_div_0c8fbb'
    >
      <div
        className={`${classes.card_container} ${!shadow && classes.shadow_none} ${extraClasses}`}
        data-static-id='SingleTitleCardWithRightAction.js_div_9c9545'
      >
        {title && (
          <div
            className={`${classes.card_header}`}
            data-static-id='SingleTitleCardWithRightAction.js_div_451a8d'
          >
            <h1
              className={`m-0 text-12-regular primary_gray  ${classes.card_header__title}`}
              data-static-id='SingleTitleCardWithRightAction.js_h1_7c2fcc'
            >
              {convertFormulaToHtml(title)}
            </h1>
          </div>
        )}
        <div
          className={`py-2 px-1 mt-1 ${classes.card_body} card_body`}
          data-static-id='SingleTitleCardWithRightAction.js_div_df54c2'
        >
          {children}
        </div>
      </div>
    </div>
  )
}
