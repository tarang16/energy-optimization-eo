import { convertFormulaToHtml } from 'utills/utilities'
import classes from './SingleTitleCard.module.scss'
export default function SingleTitleCard({
  title,
  children,
  shadow = true,
  extraClasses = '',
  RightHtml,
  tabs = [],
}) {
  return (
    <div className='w-100 h-100' data-static-id='SingleTitleCard.js_div_42f665'>
      <div
        className={`${classes.card_container} ${!shadow && classes.shadow_none} ${extraClasses} card-container`}
        data-static-id='SingleTitleCard.js_div_fda5ad'
      >
        <div
          className={`${classes.card_header} d-flex justify-content-between card_header`}
          data-static-id='SingleTitleCard.js_div_99cf6b'
        >
          {title && (
            <h1
              className={`m-0 text-14-bold primary_gray  ${classes.card_header__title} `}
              data-static-id='SingleTitleCard.js_h1_07f436'
            >
              {convertFormulaToHtml(title)}
            </h1>
          )}
          <div data-static-id='SingleTitleCard.js_div_12a4ef'>
            {RightHtml}
            {tabs}
          </div>
        </div>
        <div
          className={`pt-1  ${classes.card_body}`}
          data-static-id='SingleTitleCard.js_div_bebe1c'
        >
          {children}
        </div>
      </div>
    </div>
  )
}
