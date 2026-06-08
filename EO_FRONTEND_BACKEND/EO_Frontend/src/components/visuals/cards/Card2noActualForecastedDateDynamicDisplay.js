import variables from 'config/scss/variables'
import moment from 'moment'
import { useState } from 'react'
import {
  convertFormulaToHtml,
  formatNumbers,
  getStateColor,
} from 'utills/utilities'
import LineChartMultiple from '../charts/line_chart/linechart_multiple/LineChartMultiple'
import CustomModal from '../common/modal/CustomModal'
import CauseTable from '../table/cause_table/CauseTable'
import CardActions from './CardActions'
import classes from './Cards.module.scss'
export default function Card2noActualForecastedDateDynamicDisplay({
  data,
  category,
  actualTime,
  caseId,
  odsData,
  showOdsButton = true,
  library_name,
}) {
  const [show, setShow] = useState(false)
  const [causeModal, setcauseModal] = useState(false)
  const isMatchingCategory =
    data?.category
      ?.toLowerCase()
      ?.includes(category?.toLowerCase()?.replace('_ods', '')) &&
    `position-relative ${classes.box}`
  return (
    <div
      className={` h-100 bg_primary_bg position-relative px-1 hoverAction ${isMatchingCategory} ${classes.dynamicDateBox}`}
      data-static-id='Card2noActualForecastedDateDynamicDisplay.js_div_65c294'
    >
      <div
        className={`d-flex justify-content-end align-items-center flex-column h-50 ${classes.dynamicDateBox_top} ${library_name}`}
        data-static-id='Card2noActualForecastedDateDynamicDisplay.js_div_e141b6'
      >
        <div
          className={`text-12-bold text-break ${classes.title}`}
          data-static-id='Card2noActualForecastedDateDynamicDisplay.js_div_cf9f4b'
        >
          {convertFormulaToHtml(data?.displayName?.toUpperCase())}
        </div>
        <div
          className={`text-12-bold ${classes.title}`}
          data-static-id='Card2noActualForecastedDateDynamicDisplay.js_div_73f43c'
        >
          {convertFormulaToHtml(data?.value4?.toUpperCase())}
        </div>
        <div
          className={'text-12-light'}
          data-static-id='Card2noActualForecastedDateDynamicDisplay.js_div_884344'
        >
          {convertFormulaToHtml(
            data.displayUom ? `(${data?.displayUom?.toUpperCase()})` : '(-)',
          )}
        </div>
      </div>

      <div
        className={`d-flex justify-content-between h-50 ${classes.dynamicDateBox_bottom}`}
        data-static-id='Card2noActualForecastedDateDynamicDisplay.js_div_68f73d'
      >
        <div
          className={`text-center ${classes.dynamicDateBox_bottom_left}`}
          data-static-id='Card2noActualForecastedDateDynamicDisplay.js_div_571307'
        >
          <p
            className={`text-10-light ${classes.customBottomMargin}`}
            data-static-id='Card2noActualForecastedDateDynamicDisplay.js_p_a82420'
          >
            ACTUAL
          </p>
          <p
            className={`text-14-bold mb-0  ${data.state === 1 ? 'text_primary_orange' : 'text_primary_blue'}`}
            data-static-id='Card2noActualForecastedDateDynamicDisplay.js_p_c82438'
          >
            {data.value1 != null ? formatNumbers(data.value1) : '--'}
          </p>
        </div>
        <div
          className={`text-center ${classes.dynamicDateBox_bottom_right}`}
          data-static-id='Card2noActualForecastedDateDynamicDisplay.js_div_736102'
        >
          <p
            className={`text-10-light ${classes.customBottomMargin}`}
            data-static-id='Card2noActualForecastedDateDynamicDisplay.js_p_76467d'
          >
            FORECASTED
          </p>
          <p
            className={`text-14-bold mb-0 ${getStateColor(data?.state2)}`}
            data-static-id='Card2noActualForecastedDateDynamicDisplay.js_p_8ebd47'
          >
            {data.value2 != null ? formatNumbers(data.value2) : '--'}
          </p>
          <p
            className='text_primary_gray_2 text-10-bold mb-0'
            data-static-id='Card2noActualForecastedDateDynamicDisplay.js_p_a6ae37'
          >
            {data.value3 != null
              ? `(${moment(parseInt(data.value3)).format('DD-MMM-YY')})`
              : ''}
          </p>
        </div>
      </div>

      <CardActions
        data={data}
        category={category}
        handleShowModal={setShow}
        showCauseModal={setcauseModal}
        showOdsButton={showOdsButton}
        infoId='kpis-details-icon'
        trendId='kpis-trends-icon'
        actionId='kpis-actions-button-icon'
      />
      <div
        className='Modal_container'
        style={{
          display: 'none',
        }}
        data-static-id='Card2noActualForecastedDateDynamicDisplay.js_div_f6a950'
      >
        <CustomModal
          subTitle={data?.kpiDescription}
          hideModal={() => setShow(false)}
          title={data.displayName}
          unit={data.displayUom}
          show={show}
          id='kpis-trend'
        >
          {data?.tagName2 ? (
            <LineChartMultiple
              data={{
                caseId: caseId,
                tagsList: [
                  {
                    tagName: `${data.tagName}`,
                    isOptimumEnabled: false,
                    isOnlyOneTrend: true,
                    isAutoYAxis: true,
                    show: true,
                    serisColor: variables.primary_blue,
                    serisColorOpt: variables.primary_gray_2,
                    valueDecimal: data.valueDecimal,
                  },
                  {
                    tagName: `${data.tagName2}`,
                    isOptimumEnabled: false,
                    isOnlyOneTrend: true,
                    isAutoYAxis: true,
                    show: true,
                    serisColor: variables.primary_gray_2,
                    serisColorOpt: variables.primary_gray_2,
                    valueDecimal: data.valueDecimal,
                  },
                ],
                endTime: actualTime,
                isLegendVisible: true,
              }}
              actualTime={actualTime}
              exportTitle={data.displayName}
            />
          ) : (
            <LineChartMultiple
              data={{
                caseId: caseId,
                tagsList: [
                  {
                    tagName: data.tagName,
                    isOptimumEnabled: true,
                    isAutoYAxis: true,
                    show: true,
                    serisColor: variables.primary_blue,
                    serisColorOpt: variables.primary_gray_2,
                    valueDecimal: data.valueDecimal,
                  },
                ],
                endTime: actualTime,
              }}
              actualTime={actualTime}
              exportTitle={data.displayName}
            />
          )}
        </CustomModal>

        <CustomModal
          hideModal={() => setcauseModal(false)}
          title={data.displayName}
          subTitle={data?.kpiDescription}
          show={causeModal}
          bodyHeight='auto'
          modalHeight='auto'
          customSpacingClass={classes.causeTableClass}
          id='kpis-actions'
        >
          <CauseTable
            category={category}
            time={actualTime}
            caseId={caseId}
            odsData={odsData}
            kpiData={data}
          />
        </CustomModal>
      </div>
    </div>
  )
}
