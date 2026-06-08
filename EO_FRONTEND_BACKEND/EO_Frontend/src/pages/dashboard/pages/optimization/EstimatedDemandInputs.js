import { AppAtom } from 'atoms/AppAtom'
import LineChartMultiple from 'components/visuals/charts/line_chart/linechart_multiple/LineChartMultiple'
import CustomModal from 'components/visuals/common/modal/CustomModal'
import AccordianExpandableTable from 'components/visuals/table/AccordianExpandableTable'
import { TRACKEVENTOBJ } from 'config/ActivityTrackerConfig'
import variables from 'config/scss/variables'
import { useAtomValue } from 'jotai'
import { useOutletContext, useParams } from 'react-router-dom'
import TrendIcon from '../../../../assets/sabic_new_icons/predicted_action2.svg'
import styles from './EstimatedDemandInputs.module.scss'
import { DEMAND_REDUCER_ACTIONS } from './Optimization.functions'
export default function OptimimzationDemandInput({
  data,
  mode,
  demandInputDispatch,
}) {
  const params = useParams()
  const appContext = useAtomValue(AppAtom)
  const { caseId } = useOutletContext()
  const headers =
    mode === 'actual'
      ? [
          {
            key: 'parameter',
            label: 'Parameter',
            colSpan: 2,
          },
          {
            key: 'demand',
            label: 'Demand',
          },
        ]
      : [
          {
            key: 'parameter',
            label: 'Parameter',
            colSpan: 3,
          },
          {
            key: 'demand',
            label: 'Estimated Demand',
            colSpan: 2,
          },
          {
            key: 'bias',
            label: 'Bias',
            colSpan: 2,
          },
        ]
  const tableData = data.demandData
    .filter((item) => item.energycategory !== 'Other')
    .map((item) => {
      const totalActual = item?.data?.reduce(
        (acc, obj) => acc + (parseFloat(obj?.actual) || 0),
        0,
      )
      const formattedTotalActual =
        totalActual === 0 ? '-' : totalActual.toFixed(2)
      const totalBias = item?.data?.reduce(
        (acc, obj) => acc + (parseFloat(obj?.bias) || 0),
        0,
      )
      const formattedTotalBias = totalBias === 0 ? '-' : totalBias.toFixed(2)
      return {
        data: [
          `${item.energycategory}`,
          formattedTotalActual,
          formattedTotalBias,
        ],
        children: item?.data?.map((row) => {
          const currentValue = parseFloat(row.bias ?? 0)
          return [
            <div
              key={`${row.tagName}-${row.plantName}`}
              className='w-100 d-flex flex-row-reverse'
              data-static-id='EstimatedDemandInputs.js_div_b1eb47'
            >
              {/* <div className={styles.w_20}></div> */}
              <div
                className={styles.w_60}
                data-static-id='EstimatedDemandInputs.js_div_e6379e'
              >
                {row.plantName}
              </div>
              <div
                className={`${styles.w_40} flexCenterContainer`}
                data-static-id='EstimatedDemandInputs.js_div_e7c98e'
              >
                <img
                  alt=''
                  src={TrendIcon}
                  data-testid='trend-icon'
                  className={`cursor-pointer blueOnHover ${styles.img}`}
                  onClick={() => {
                    TRACKEVENTOBJ.Optimization.EstimateDemandTrendIconClick(
                      {
                        params,
                        caseData: appContext.caseData,
                      },
                      row,
                    )
                    demandInputDispatch({
                      type: DEMAND_REDUCER_ACTIONS.TREND_MODAL_OPEN,
                      obj: row,
                    })
                  }}
                  data-static-id='EstimatedDemandInputs.js_img_5226e8'
                />
              </div>
            </div>,
            row.actual != null && row.actual !== undefined
              ? parseFloat(row.actual).toFixed(2)
              : '-',
            <div
              key={`${row.tagName}+`}
              className='d-flex align-items-center'
              data-static-id='EstimatedDemandInputs.js_div_8e64e4'
            >
              {row.isInitialLoad ? (
                '-'
              ) : (
                <>
                  <button
                    className={`text-16-bold px-1 text_primary_gray_2 ${styles.button}`}
                    onClick={() => {
                      const newValue = (parseFloat(currentValue) - 1).toFixed(2) // Decrease by 1
                      demandInputDispatch({
                        type: DEMAND_REDUCER_ACTIONS.EDIT_INPUT,
                        payload: {
                          energycategory: item.energycategory,
                          plantName: row.plantName,
                          bias: newValue,
                        },
                      })
                    }}
                    data-testid='decrease-btn'
                    data-static-id='EstimatedDemandInputs.js_button_12c4c0'
                  >
                    -
                  </button>
                  <input
                    data-testid='bias-input'
                    type='number'
                    className={`text-12-regular ${styles.inputStyle}`}
                    value={currentValue}
                    onChange={(e) => {
                      const newValue = parseFloat(e.target.value).toFixed(2)
                      demandInputDispatch({
                        type: DEMAND_REDUCER_ACTIONS.EDIT_INPUT,
                        payload: {
                          energycategory: item.energycategory,
                          plantName: row.plantName,
                          bias: newValue,
                        },
                      })
                    }}
                    data-static-id='EstimatedDemandInputs.js_input_0f8a28'
                  />
                  <button
                    className={`text-16-bold px-1 text_primary_gray_2 ${styles.button}`}
                    onClick={() => {
                      const newValue = (parseFloat(currentValue) + 1).toFixed(2) // Increase by 1
                      demandInputDispatch({
                        type: DEMAND_REDUCER_ACTIONS.EDIT_INPUT,
                        payload: {
                          energycategory: item.energycategory,
                          plantName: row.plantName,
                          bias: newValue,
                        },
                      })
                    }}
                    data-testid='increase-btn'
                    data-static-id='EstimatedDemandInputs.js_button_3d84ff'
                  >
                    +
                  </button>
                </>
              )}
            </div>,
          ]
        }),
      }
    })
  return (
    <>
      {data.modal && (
        <CustomModal
          hideModal={() =>
            demandInputDispatch({
              type: DEMAND_REDUCER_ACTIONS.TREND_MODAL_CLOSE,
            })
          }
          title={data.modal?.plantName}
          show={data.modal}
          id='kpis-trend'
          data-testid='custom-modal'
          showLegend={true}
        >
          <LineChartMultiple
            data={{
              caseId: caseId,
              tagsList: [
                {
                  tagName: data?.modal?.tagName,
                  displayName: `${'data.displayName'}`,
                  isOptimumEnabled: true,
                  isAutoYAxis: true,
                  min: 2500,
                  max: 3000,
                  show: true,
                  serisColor: variables.primary_blue,
                  serisColorOpt: variables.primary_gray_2,
                },
              ],
              endTime: appContext?.actualTime,
            }}
            actualTime={appContext?.actualTime}
          />
        </CustomModal>
      )}
      <AccordianExpandableTable
        headers={headers}
        data={tableData}
        expandedRowsKey={{
          500: true,
        }}
        customColumnWidths={[48, 26, 26]}
      ></AccordianExpandableTable>
    </>
  )
}
