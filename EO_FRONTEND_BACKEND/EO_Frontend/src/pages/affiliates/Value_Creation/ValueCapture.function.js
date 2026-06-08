import Loader from 'components/ui/loader/Loader'
import { formatNumbers, uuid4 } from 'utills/utilities'
import IconTrend from 'assets/sabic_new_icons/predicted_action2.svg'
import styles from './ValueCapture.module.scss'
import { Link } from 'react-router-dom'
import editIcon from 'assets/sabic_icons/header/edit_default_icon.svg'
export function renderLoadingIndicator() {
  return (
    <tr data-static-id='ValueCapture.function.js_tr_bb1137'>
      <td colSpan={11} data-static-id='ValueCapture.function.js_td_ea1ae3'>
        <Loader id='loader-test-id' />
      </td>
    </tr>
  )
}
export const isVerifyNumber = (p, c) => {
  return typeof c !== 'string' ? p + c : p
}
export const getTotal = (respData, key) => {
  return respData.reduce((p, c) => isVerifyNumber(p, c[key]), 0)
}
export const getAnalysisUrl = (caseMstData, caseid) => {
  const isEnergy = caseMstData?.some(
    ({ category, caseId }) =>
      category?.toLowerCase() == 'energy' && caseId == caseid,
  )
  if (isEnergy) {
    return '/analysis-energy'
  }
}
export function renderDataRow(
  obj,
  handleTrendIconClick,
  caseMstData,
  isEditable,
) {
  return (
    <tr key={uuid4()} data-static-id='ValueCapture.function.js_tr_c18c5a'>
      <td
        className='text-13-regular ps-2'
        data-static-id='ValueCapture.function.js_td_479616'
      >
        {obj.caseName}
      </td>

      <td
        className='text-13-regular text-center'
        data-static-id='ValueCapture.function.js_td_41d5f7'
      >
        {obj?.realizedvalueEnergy
          ? formatNumbers(obj?.realizedvalueEnergy)
          : '-'}
      </td>
      <td
        className='text-13-regular text-center'
        data-static-id='ValueCapture.function.js_td_833423'
      >
        {obj?.lostvalueEnergy ? formatNumbers(obj?.lostvalueEnergy) : '-'}
      </td>
      <td
        className='text-13-regular text-center'
        data-static-id='ValueCapture.function.js_td_a4525b'
      >
        {obj?.total_business_impact_energy
          ? formatNumbers(obj?.total_business_impact_energy)
          : '-'}
      </td>
      <td
        className={`text-center ${styles.IconTrend} `}
        data-tut='reactour__valuecreation_trendicon'
        data-static-id='ValueCapture.function.js_td_9a900a'
      >
        <img
          data-tooltip-id='view-trend-tooltip'
          className={`cursor-pointer`}
          data-testid='bar-trend-icon'
          src={IconTrend}
          onClick={(e) => {
            e.stopPropagation()
            handleTrendIconClick(obj.caseid)
          }}
          data-static-id='ValueCapture.function.js_img_4d8514'
        />
      </td>
      <td
        className={`${styles.editLink}`}
        data-tut='reactour__valuecreation_productionanalysis_nav'
        data-static-id='ValueCapture.function.js_td_f943f8'
      >
        {isEditable ? (
          <Link
            data-tooltip-id='view-case-tooltip'
            className={`${getAnalysisUrl(caseMstData, obj.caseid) ? '' : styles.disabledLink}`}
            onClick={(e) => {
              e.stopPropagation()
            }}
            data-static-id='ValueCapture.function.js_Link_53ce94'
          >
            <img
              src={editIcon}
              className='blueOnHover blueFilter'
              data-static-id='ValueCapture.function.js_img_5d3336'
            />
          </Link>
        ) : (
          <img
            className={` ${styles.notAllowed} ${styles.editLink}`}
            src={editIcon}
            data-static-id='ValueCapture.function.js_img_76dbd0'
          />
        )}
      </td>
    </tr>
  )
}
export function renderTotalRow(respData) {
  return (
    <tr
      key={uuid4()}
      className={`${styles.lastRow}`}
      data-static-id='ValueCapture.function.js_tr_9424d2'
    >
      <td
        className='text-13-bold text-center text_primary_blue'
        data-static-id='ValueCapture.function.js_td_4e2b4b'
      >
        TOTAL
      </td>

      <td
        className='text-13-regular text-center text_primary_blue'
        data-static-id='ValueCapture.function.js_td_2236af'
      >
        {getTotal(respData, 'realizedvalueEnergy')
          ? formatNumbers(getTotal(respData, 'realizedvalueEnergy'))
          : '-'}
      </td>
      <td
        className='text-13-regular text-center text_primary_blue'
        data-static-id='ValueCapture.function.js_td_665161'
      >
        {getTotal(respData, 'lostvalueEnergy')
          ? formatNumbers(getTotal(respData, 'lostvalueEnergy'))
          : '-'}
      </td>
      <td
        className='text-13-regular text-center text_primary_blue'
        data-static-id='ValueCapture.function.js_td_1ca85b'
      >
        {getTotal(respData, 'total_business_impact_energy')
          ? formatNumbers(getTotal(respData, 'total_business_impact_energy'))
          : '-'}
      </td>
      <td data-static-id='ValueCapture.function.js_td_60c8da'></td>
      <td data-static-id='ValueCapture.function.js_td_04934d'></td>
    </tr>
  )
}
export function renderNoDataMessage() {
  return (
    <tr data-static-id='ValueCapture.function.js_tr_68c5a6'>
      <td colSpan={11} data-static-id='ValueCapture.function.js_td_b79652'>
        <p
          className='text-14-regular text-uppercase text-center p-0 m-0'
          data-static-id='ValueCapture.function.js_p_540072'
        >
          No Data Found for the plant.
        </p>
      </td>
    </tr>
  )
}
export const renderTable = ({
  respData,
  isLoading,
  handleTrendIconClick,
  params,
  caseMstData,
  isEditable,
}) => {
  if (isLoading) {
    return renderLoadingIndicator()
  }
  if (Array.isArray(respData) && respData.length > 0) {
    const data = respData.map((obj) =>
      renderDataRow(obj, handleTrendIconClick, caseMstData, isEditable),
    )
    const totalRow = renderTotalRow(respData)
    return (
      <>
        {data}
        {totalRow}
      </>
    )
  } else return renderNoDataMessage()
}
