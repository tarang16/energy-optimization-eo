import variables from 'config/scss/variables'
import { useState } from 'react'
import {
  getDisplayNamesFromLibraryName,
  getModalTitleFromObject,
} from 'utills/utilities'
import LineChartMultiple from '../charts/line_chart/linechart_multiple/LineChartMultiple'
import CustomModal from '../common/modal/CustomModal'
import CauseTable from '../table/cause_table/CauseTable'
import CardActions from './CardActions'
import classes from './Cards.module.scss'
const CardTrends = ({
  data,
  caseId,
  actualTime,
  category,
  showOdsButton,
  odsData,
  tagName,
  isLegendVisible,
  baseIntervalDuration,
}) => {
  const [show, setShow] = useState(false)
  const [causeModal, setcauseModal] = useState(false)
  const [displayName, displayName2] = getDisplayNamesFromLibraryName(data)
  const modalTitle = getModalTitleFromObject(data)
  return (
    <>
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
        data-static-id='CardTrends.js_div_18278a'
      >
        <CustomModal
          showLegend={true}
          hideModal={() => setShow(false)}
          title={modalTitle}
          unit={data.displayUom}
          show={show}
          id='kpis-trend'
        >
          {data?.trendLibrary === 'timeseries_multiple' && data?.tagName2 ? (
            <LineChartMultiple
              data={{
                caseId: caseId,
                tagsList: [
                  {
                    tagName: `${data.tagName}`,
                    displayName: `${displayName}`,
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
                    displayName: `${displayName2}`,
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
                isSingleYAxis: true,
              }}
              actualTime={actualTime}
              exportTitle={data.displayName}
              showCustomRange={true}
            />
          ) : (
            <LineChartMultiple
              data={{
                caseId: caseId,
                tagsList: [
                  {
                    tagName: tagName,
                    displayName: `${data.displayName}`,
                    isOptimumEnabled: true,
                    isAutoYAxis: true,
                    show: true,
                    serisColor: variables.primary_blue,
                    serisColorOpt: variables.primary_gray_2,
                    valueDecimal: data.valueDecimal,
                  },
                ],
                endTime: actualTime,
                isLegendVisible: isLegendVisible,
              }}
              baseIntervalDuration={baseIntervalDuration}
              actualTime={actualTime}
              exportTitle={data.displayName}
              showCustomRange={true}
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
    </>
  )
}
export default CardTrends
