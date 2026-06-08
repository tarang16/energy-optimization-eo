import { AgGridReact } from 'ag-grid-react'
import { AppAtom } from 'atoms/AppAtom'
import Loader from 'components/ui/loader/Loader'
import { useAtomValue } from 'jotai'
import moment from 'moment'
import { useEffect, useMemo, useState } from 'react'
import { getEnergyDistribution } from 'services/CurrentServices'
import { showToast } from 'utills/utilities'
import styles from './SEUEnergyDistributionTable.module.scss'
const formatActualOptimum = (val) => {
  if (!val) {
    return '-'
  } else {
    return parseFloat(val).toFixed(3)
  }
}
const CategoryCellRenderer = (props) => (
  <div
    className={`${styles.categoryColumn}`}
    data-static-id='SEUEnergyDistributionTable.js_div_05b596'
  >
    <span data-static-id='SEUEnergyDistributionTable.js_span_392c79'>
      {props?.value || '-'}
    </span>
  </div>
)
const PlantNameCellRenderer = (props) => (
  <div
    className={`w-100`}
    data-static-id='SEUEnergyDistributionTable.js_div_17d542'
  >
    <span data-static-id='SEUEnergyDistributionTable.js_span_3c1489'>
      {props?.data?.plantName}
    </span>
  </div>
)
const NonSeuCellRenderer = (props) => (
  <div
    className={`${styles.categoryColumn} w-100`}
    data-static-id='SEUEnergyDistributionTable.js_div_11ed2a'
  >
    <span
      className='text_primary_blue w-50 text-end'
      data-static-id='SEUEnergyDistributionTable.js_span_145db7'
    >
      {formatActualOptimum(props?.data?.nonSeuActual)}
    </span>{' '}
    |{' '}
    <span
      className='text_primary_gray_2 w-50'
      data-static-id='SEUEnergyDistributionTable.js_span_5ee3cc'
    >
      {formatActualOptimum(props?.data?.nonSeuOptimum)}
    </span>
  </div>
)
const PerContributionEnergyRenderer = (props) => (
  <div
    className={`${styles.categoryColumn} w-100`}
    data-static-id='SEUEnergyDistributionTable.js_div_dc896c'
  >
    <span
      className='text_primary_blue w-50 text-end'
      data-static-id='SEUEnergyDistributionTable.js_span_085185'
    >
      {formatActualOptimum(props?.data?.perContributionEnergyTypeActual)}
    </span>{' '}
    |{' '}
    <span
      className='text_primary_gray_2 w-50'
      data-static-id='SEUEnergyDistributionTable.js_span_8ec445'
    >
      {formatActualOptimum(props?.data?.perContributionEnergyTypeActual)}
    </span>
  </div>
)
const PerContributionSeuRenderer = (props) => (
  <div
    className={`${styles.categoryColumn} w-100`}
    data-static-id='SEUEnergyDistributionTable.js_div_4c0cf9'
  >
    <span
      className='text_primary_blue w-50 text-end'
      data-static-id='SEUEnergyDistributionTable.js_span_f120c8'
    >
      {formatActualOptimum(props?.data?.perContributionSeuActual)}
    </span>{' '}
    {props?.data?.perContributionSeuOptimum && (
      <>
        |{' '}
        <span
          className='text_primary_gray_2 w-50'
          data-static-id='SEUEnergyDistributionTable.js_span_84807d'
        >
          {formatActualOptimum(props?.data?.perContributionSeuOptimum)}
        </span>
      </>
    )}
  </div>
)
const SeuEnergyRenderer = (props) => (
  <div
    className={`${styles.categoryColumn} w-100`}
    data-static-id='SEUEnergyDistributionTable.js_div_49eb0d'
  >
    <span
      className='text_primary_blue w-50 text-end'
      data-static-id='SEUEnergyDistributionTable.js_span_73a10f'
    >
      {formatActualOptimum(props?.data?.seuEnergyActual)}
    </span>{' '}
    |{' '}
    <span
      className='text_primary_gray_2 w-50'
      data-static-id='SEUEnergyDistributionTable.js_span_c528a4'
    >
      {formatActualOptimum(props?.data?.seuEnergyOptimum)}
    </span>
  </div>
)
const TotalEnergyRenderer = (props) => (
  <div
    className={`${styles.categoryColumn} w-100`}
    data-static-id='SEUEnergyDistributionTable.js_div_80a89f'
  >
    <span
      className='text_primary_blue w-50 text-end'
      data-static-id='SEUEnergyDistributionTable.js_span_4dc12e'
    >
      {formatActualOptimum(props?.data?.totalEnergyActual)}
    </span>{' '}
    |{' '}
    <span
      className='text_primary_gray_2 w-50'
      data-static-id='SEUEnergyDistributionTable.js_span_3c1729'
    >
      {formatActualOptimum(props?.data?.totalEnergyOptimum)}
    </span>
  </div>
)
const EnergyReductionRenderer = (props) => (
  <div
    className={`${styles.categoryColumn}`}
    data-static-id='SEUEnergyDistributionTable.js_div_91aaaf'
  >
    <span
      className='text_primary_blue'
      data-static-id='SEUEnergyDistributionTable.js_span_65f64a'
    >
      {formatActualOptimum(props?.data?.seuEnergyReductionActual)}
    </span>{' '}
    {props?.data?.seuEnergyReductionOptimum && (
      <>
        |{' '}
        <span
          className='text_primary_gray_2 w-50'
          data-static-id='SEUEnergyDistributionTable.js_span_67f665'
        >
          {formatActualOptimum(props?.data?.seuEnergyReductionOptimum)}
        </span>
      </>
    )}
  </div>
)
const PerEnergyReductionRenderer = (props) => (
  <div
    className={`${styles.categoryColumn} w-100`}
    data-static-id='SEUEnergyDistributionTable.js_div_e9b4ec'
  >
    <span
      className='text_primary_blue w-50 text-end'
      data-static-id='SEUEnergyDistributionTable.js_span_023319'
    >
      {formatActualOptimum(props?.data?.perEnergyReductionActual)}
    </span>{' '}
    {props?.data?.perEnergyReductionOptimum && (
      <>
        |{' '}
        <span
          className='text_primary_gray_2 w-50'
          data-static-id='SEUEnergyDistributionTable.js_span_7c9d0a'
        >
          {formatActualOptimum(props?.data?.perEnergyReductionOptimum)}
        </span>
      </>
    )}
  </div>
)
const TotalEnergyReductionRenderer = (props) => (
  <div
    className={`${styles.categoryColumn}`}
    data-static-id='SEUEnergyDistributionTable.js_div_181f09'
  >
    <span
      className='text_primary_blue'
      data-static-id='SEUEnergyDistributionTable.js_span_8ecac9'
    >
      {formatActualOptimum(props?.data?.totalEnergyReductionActual)}
    </span>{' '}
    {props?.data?.totalEnergyReductionOptimum && (
      <>
        |{' '}
        <span
          className='text_primary_gray_2 w-50'
          data-static-id='SEUEnergyDistributionTable.js_span_52fb9d'
        >
          {formatActualOptimum(props?.data?.totalEnergyReductionOptimum)}
        </span>
      </>
    )}
  </div>
)
export default function SEUEnergyDistributionTable({ caseId }) {
  const ctxData = useAtomValue(AppAtom)
  const [rowData, setRowData] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const defaultColDef = {
    resizable: false,
    wrapHeaderText: true,
    autoHeaderHeight: true,
  }
  const calculateVminWidth = (vmin) => {
    const viewportWidth = Math.min(window.innerWidth, window.innerHeight)
    return (vmin / 100) * viewportWidth
  }
  const newRowSpan = (params) => {
    // Check if we have the same value in the 'name' column and apply rowSpan accordingly
    let rowIndex = params.node.rowIndex
    let headerName = params.colDef.field
    let currentValue = params.data[headerName]
    let currentValueCategory = params.data.category
    let prevValue = params.api.getDisplayedRowAtIndex(rowIndex - 1)?.data[
      headerName
    ]
    let prevValueCategory = params.api.getDisplayedRowAtIndex(rowIndex - 1)
      ?.data.category

    // Check how many rows have the same value in the 'name' column below
    let count = 1
    if (
      rowIndex !== 0 &&
      currentValue == prevValue &&
      currentValueCategory == prevValueCategory
    )
      return 0
    for (let i = rowIndex + 1; i < params.api.getDisplayedRowCount(); i++) {
      let nextValue = params.api.getDisplayedRowAtIndex(i)?.data[headerName]
      let nextValueCategory =
        params.api.getDisplayedRowAtIndex(i)?.data.category
      if (
        nextValue === currentValue &&
        currentValueCategory == nextValueCategory
      ) {
        count++
      } else {
        break
      }
    }
    return count > 1 ? count : 1 // Apply rowspan if there are multiple same values
  }
  const columnDefs = useMemo(
    () => [
      {
        headerName: 'CATEGORY',
        field: 'category',
        width: calculateVminWidth(14),
        autoHeight: true,
        rowSpan: newRowSpan,
        cellRenderer: CategoryCellRenderer,
        cellClassRules: {
          'cell-style': 'true',
          addBorder: 'true',
        },
      },
      {
        headerName: 'Plant Name',
        flex: 1,
        cellRenderer: PlantNameCellRenderer,
      },
      {
        headerName: 'Non SEU',
        flex: 1,
        cellRenderer: NonSeuCellRenderer,
      },
      {
        headerName: 'Per Contribution Energy',
        flex: 1,
        cellRenderer: PerContributionEnergyRenderer,
      },
      {
        headerName: 'Per Contribution SEU',
        flex: 1,
        cellRenderer: PerContributionSeuRenderer,
      },
      {
        headerName: 'SEU Energy',
        flex: 1,
        cellRenderer: SeuEnergyRenderer,
      },
      {
        headerName: 'Total Energy',
        flex: 1,
        cellRenderer: TotalEnergyRenderer,
      },
      {
        headerName: 'Energy Reduction',
        flex: 1,
        cellRenderer: EnergyReductionRenderer,
      },
      {
        headerName: 'Per Energy Reduction',
        flex: 1,
        cellRenderer: PerEnergyReductionRenderer,
      },
      {
        headerName: 'SEU Energy Reduction',
        flex: 1,
        cellRenderer: EnergyReductionRenderer,
      },
      {
        headerName: 'Total Energy Reduction',
        flex: 1,
        cellRenderer: TotalEnergyReductionRenderer,
      },
    ],
    [],
  )
  useEffect(() => {
    const tempActualTime = moment(ctxData?.actualTime)
    const fetchData = async () => {
      try {
        setIsLoading(true)
        const resp = await getEnergyDistribution(caseId, tempActualTime)
        const sortedCategory = resp?.data.sort((a, b) =>
          a.category.localeCompare(b.category),
        )
        if (resp.statuscode === 200) {
          setRowData(sortedCategory || [])
          setIsLoading(false)
        } else {
          setIsLoading(false)
        }
      } catch (error) {
        showToast('error while fetch seu energy distribution data', error)
        setIsLoading(false)
        setRowData([])
      }
    }
    fetchData()
  }, [])
  return (
    <div
      className={`ag-theme-alpine grid_reducer_height h-100 ReducedWidthIcon CenterAlign ${styles.SEUEnergyDistributionTableContainer}`}
      data-static-id='SEUEnergyDistributionTable.js_div_ecdcc3'
    >
      {isLoading ? (
        <Loader />
      ) : (
        <AgGridReact
          rowData={rowData}
          columnDefs={columnDefs}
          suppressRowTransform={true}
          domLayout='normal'
          defaultColDef={defaultColDef}
          rowHeight={30}
          loading={isLoading}
        />
      )}
    </div>
  )
}
