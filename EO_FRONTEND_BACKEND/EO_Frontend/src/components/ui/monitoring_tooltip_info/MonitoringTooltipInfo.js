import { convertFormulaToHtml } from 'utills/utilities'
import classes from './MonitoringTooltipInfo.module.scss'
export default function MonitoringTooltipInfo({ data }) {
  let tooltipPerformanceData = []
  let tooltipMatchData = []
  if (Array.isArray(data)) {
    tooltipPerformanceData = data.filter(
      (obj) => obj.category?.toLowerCase() == 'performance',
    )
    tooltipMatchData = data.filter(
      (obj) => obj.category?.toLowerCase() == 'match',
    )
  }
  return (
    <div
      className={`${classes.monitoringhTooltipContainer} pe-1`}
      data-static-id='MonitoringTooltipInfo.js_div_26a254'
    >
      <div
        className='pb-2'
        data-static-id='MonitoringTooltipInfo.js_div_f5905f'
      >
        <h1
          className='text-14-bold text-center my-1'
          data-static-id='MonitoringTooltipInfo.js_h1_7e9811'
        >
          OPTIMIZATION OBJECTIVE
        </h1>
        <h1
          className='text-12-regular  pb-1'
          data-static-id='MonitoringTooltipInfo.js_h1_5b68b4'
        >
          Following is the performance tag which is the objective function of
          the model.
        </h1>
        <div
          className='d-flex flex-column justify-content-between'
          data-static-id='MonitoringTooltipInfo.js_div_2c8ca3'
        >
          {tooltipPerformanceData.map((obj) => (
            <div
              key={obj.tagName + obj?.parameter}
              className='d-flex justify-content-between align-items-center bg_primary_gray_7 py-1 px-2 mb-1'
              data-static-id='MonitoringTooltipInfo.js_div_c1e28b'
            >
              <div
                className='d-flex flex-column'
                data-static-id='MonitoringTooltipInfo.js_div_4d5e06'
              >
                <div
                  className='text-12-bold pb-1 pt-1 me-1 customFontsBold '
                  data-static-id='MonitoringTooltipInfo.js_div_b1d06f'
                >
                  {convertFormulaToHtml(obj?.parameter?.toUpperCase())}
                </div>
                <div
                  className='text-12-light text-start customFontsBold'
                  data-static-id='MonitoringTooltipInfo.js_div_5b906d'
                >
                  {' '}
                  {obj?.uom?.toUpperCase()
                    ? convertFormulaToHtml(`(${obj?.uom?.toUpperCase()})`)
                    : ''}
                </div>
              </div>
              <div
                className='d-flex justify-content-between align-items-start'
                data-static-id='MonitoringTooltipInfo.js_div_ab1299'
              >
                <div
                  className='text_primary_blue text-14-bold'
                  data-static-id='MonitoringTooltipInfo.js_div_2b7988'
                >
                  {obj.actual == null || obj.actual == undefined
                    ? ''
                    : obj.actual}
                </div>
                {obj.optimum != null || obj.optimum != undefined ? (
                  <div
                    className='text-12-light mx-2 text-14-bold'
                    data-static-id='MonitoringTooltipInfo.js_div_50af70'
                  >
                    |
                  </div>
                ) : (
                  ''
                )}
                <div
                  className='text_primary_gray_2 text-14-bold'
                  data-static-id='MonitoringTooltipInfo.js_div_14eddb'
                >
                  {obj.optimum == null || obj.optimum == undefined
                    ? ''
                    : obj.optimum}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div data-static-id='MonitoringTooltipInfo.js_div_25f60d'>
        <h1
          className='text-14-bold text-center'
          data-static-id='MonitoringTooltipInfo.js_h1_72b771'
        >
          OPTIMIZATION CONDITION
        </h1>
        <h1
          className='text-12-regular pb-1'
          data-static-id='MonitoringTooltipInfo.js_h1_a46356'
        >
          Following operating parameters are matched with historical data to
          determine the optimum results
        </h1>
        <div
          className='d-flex flex-column justify-content-between'
          data-static-id='MonitoringTooltipInfo.js_div_5f5426'
        >
          {tooltipMatchData.map((obj) => (
            <div
              key={obj.tagName + obj?.parameter}
              className='d-flex justify-content-between align-items-center bg_primary_gray_7 py-2 px-2 mb-1'
              data-static-id='MonitoringTooltipInfo.js_div_6294ca'
            >
              <div
                className='d-flex flex-column'
                data-static-id='MonitoringTooltipInfo.js_div_9fd882'
              >
                <div
                  className='text-12-bold pb-1 pt-1 me-1 customFontsBold'
                  data-static-id='MonitoringTooltipInfo.js_div_03f1d8'
                >
                  {convertFormulaToHtml(obj?.parameter?.toUpperCase())}
                </div>
                <div
                  className='text-12-light text-start customFontsBold'
                  data-static-id='MonitoringTooltipInfo.js_div_e3f40c'
                >
                  {' '}
                  {obj?.uom?.toUpperCase()
                    ? convertFormulaToHtml(`(${obj?.uom?.toUpperCase()})`)
                    : ''}
                </div>
              </div>
              <div
                className='d-flex justify-content-between align-items-start'
                data-static-id='MonitoringTooltipInfo.js_div_ce7d09'
              >
                <div
                  className='text_primary_blue text-14-bold'
                  data-static-id='MonitoringTooltipInfo.js_div_90d5a3'
                >
                  {obj.actual == null || obj.actual == undefined
                    ? ''
                    : obj.actual}
                </div>
                {obj.optimum != null || obj.optimum != undefined ? (
                  <div
                    className='text-12-light mx-2 text-14-bold'
                    data-static-id='MonitoringTooltipInfo.js_div_dbf2e2'
                  >
                    |
                  </div>
                ) : (
                  ''
                )}
                <div
                  className='text_primary_gray_2 text-14-bold'
                  data-static-id='MonitoringTooltipInfo.js_div_dc438e'
                >
                  {obj.optimum == null || obj.optimum == undefined
                    ? ''
                    : obj.optimum}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
