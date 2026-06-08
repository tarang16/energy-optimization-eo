import { AppAtom } from 'atoms/AppAtom'
import LineChartMultiple from 'components/visuals/charts/line_chart/linechart_multiple/LineChartMultiple'
import CustomModal from 'components/visuals/common/modal/CustomModal'
import AccordianExpandableTable from 'components/visuals/table/AccordianExpandableTable'
import { TRACKEVENTOBJ } from 'config/ActivityTrackerConfig'
import variables from 'config/scss/variables'
import { useAtomValue } from 'jotai'
import { useOutletContext, useParams } from 'react-router-dom'
import TrendIcon from '../../../../assets/sabic_new_icons/predicted_action2.svg'
import styles from './OptimimzationDemandInput.module.scss'
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
            key: 'actual',
            label: 'Actual',
          },
        ]
      : [
          {
            key: 'parameter',
            label: 'Parameter',
            colSpan: 2,
          },
          {
            key: 'demand',
            label: 'Demand',
          },
          {
            key: 'bias',
            label: 'Bias',
          },
        ]
  function getSum(item) {
    const isEveryNull = item?.data?.every((obj) => obj?.actual == null)
    if (isEveryNull) {
      return '-'
    } else {
      return parseFloat(
        item?.data?.reduce((acc, obj) => acc + (obj?.actual ?? 0), 0),
      ).toFixed(2)
    }
  }
  const tableData = data.demandData.map((item) => {
    return {
      data:
        mode === 'actual'
          ? [`${item.energycategory}`, getSum(item)]
          : [
              `${item.energycategory}`,
              parseFloat(
                item?.data?.reduce((acc, obj) => acc + (obj?.actual ?? 0), 0),
              ).toFixed(2),
              '',
            ],
      children: item?.data?.map((row) => {
        return mode === 'actual'
          ? [
              <div
                key={`${row.plantName}-${row.tagName}`}
                className='w-100 d-flex flex-row-reverse align-items-center'
                data-static-id='OptimimzationDemandInput.js_div_1aa228'
              >
                {/* <div className={`${styles.w_20}`}></div> */}
                <div
                  className={styles.w_60}
                  data-static-id='OptimimzationDemandInput.js_div_106eb6'
                >
                  {row.plantName}
                </div>
                <div
                  className={`${styles.w_40} flexCenterContainer`}
                  data-static-id='OptimimzationDemandInput.js_div_1b8715'
                >
                  <img
                    alt=''
                    src={TrendIcon}
                    className={`cursor-pointer blueOnHover ${styles.img}`}
                    onClick={() => {
                      TRACKEVENTOBJ.Optimization.PlantDemandTrendIconClick(
                        {
                          params,
                          caseData: appContext.caseData,
                        },
                        item,
                        row,
                      )
                      demandInputDispatch({
                        type: DEMAND_REDUCER_ACTIONS.TREND_MODAL_OPEN,
                        obj: row,
                      })
                    }}
                    data-static-id='OptimimzationDemandInput.js_img_d763e8'
                  />
                </div>
              </div>,
              row.actual !== null ? parseFloat(row.actual).toFixed(2) : '-',
            ]
          : [
              <div
                key={`${row.plantName}`}
                className='w-100 d-flex'
                data-static-id='OptimimzationDemandInput.js_div_468ab2'
              >
                <div
                  className={`${styles.w_20}`}
                  data-static-id='OptimimzationDemandInput.js_div_b51a71'
                ></div>
                <div
                  className={styles.w_60}
                  data-static-id='OptimimzationDemandInput.js_div_be6743'
                >
                  {row.plantName}
                </div>
                <div
                  className={`me-2 ${styles.w_40}`}
                  data-static-id='OptimimzationDemandInput.js_div_6b0501'
                >
                  <img
                    alt=''
                    src={TrendIcon}
                    className={`cursor-pointer blueOnHover ${styles.img}`}
                    onClick={() => {
                      TRACKEVENTOBJ.Optimization.PlantDemandTrendIconClick(
                        {
                          params,
                          caseData: appContext.caseData,
                        },
                        item,
                        row,
                      )
                      demandInputDispatch({
                        type: DEMAND_REDUCER_ACTIONS.TREND_MODAL_OPEN,
                        obj: item,
                      })
                    }}
                    data-static-id='OptimimzationDemandInput.js_img_8ea4cc'
                  />
                </div>
              </div>,
              parseFloat(row.actual).toFixed(2),
              <input
                key={`${row.plantName}-Input`}
                type='text'
                className={`me-2 text-14-regular ${styles.inputStyle}`}
                placeholder=''
                value={row.bias}
                onChange={(e) => {
                  TRACKEVENTOBJ.Optimization.PlantDemandInputBox(
                    {
                      params,
                      caseData: appContext.caseData,
                    },
                    item,
                    row,
                  )
                  demandInputDispatch({
                    type: DEMAND_REDUCER_ACTIONS.EDIT_INPUT,
                    bias: e.target.value,
                    parameter: item.parameter,
                    row,
                  })
                }}
                data-static-id='OptimimzationDemandInput.js_input_9c1673'
              />,
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
                  // valueDecimal: data.valueDecimal,
                },
              ],
              endTime: appContext?.actualTime,
            }}
            actualTime={appContext?.actualTime}
            // exportTitle={data.displayName}
          />
        </CustomModal>
      )}
      <AccordianExpandableTable
        headers={headers}
        data={tableData}
        expandedRowsKey={{
          500: true,
        }}
      ></AccordianExpandableTable>
    </>
  )
}
