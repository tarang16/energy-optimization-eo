import SingleSelect from 'components/visuals/dropdown/single_select/SingleSelect'
import { useEffect, useState } from 'react'
import { getSopGradeChange } from 'services/ConfigServices'
import { debounce, uuid4 } from 'utills/utilities'
import Table from '../Table'
import classes from '../table.module.scss'
import styles from './GradeTransitionTable.module.scss'
export default function GradeTransitionTable({ caseId, sopGrades }) {
  const header = ['Time', 'Action Type', 'Instruction']
  const [tableData, setTableData] = useState([])
  const [slectedGrade, setSlectedGrade] = useState(
    sopGrades?.length > 0 ? sopGrades[0] : {},
  )
  const [isLoading, setIsLoading] = useState(true)
  const [storedData, setStoredData] = useState([])
  const [categoryObj, setCategoryObj] = useState({})
  function setCategoryObjData(filteredData) {
    let category_obj = {}
    for (let categoryI of filteredData) {
      const category = categoryI[0]
      if (category in category_obj) {
        category_obj[category][0] += 1
      } else {
        category_obj[category] = [1, 0]
      }
    }
    setCategoryObj(category_obj)
  }
  useEffect(() => {
    const fetchData = async () => {
      const tempTableData = []
      const result = await getSopGradeChange(caseId, slectedGrade.tag_name)
      setIsLoading(true)
      if (result.statuscode === 200) {
        result?.data?.forEach((item) => {
          if (item) {
            const row = [
              item.timeData,
              item.actionType,
              <span
                key={uuid4()}
                data-static-id='GradeTransitionTable.js_span_6d32eb'
              >
                {item.instructions.toUpperCase()}
              </span>,
              false,
            ]
            tempTableData.push(row)
          }
        })
        setTableData(tempTableData)
        setCategoryObjData(tempTableData)
        setStoredData(result?.data || [])
        setIsLoading(false)
      } else {
        setTableData(tempTableData)
        setIsLoading(false)
      }
    }
    if (slectedGrade?.tag_name) {
      fetchData()
    }
  }, [slectedGrade])
  const onSelectChange = (val) => {
    setSlectedGrade(val)
  }
  function handleSearchChange(event) {
    const tempData = []
    storedData.forEach((item) => {
      if (item) {
        const row = [
          item.timeData,
          item.actionType,
          <span
            key={uuid4()}
            data-static-id='GradeTransitionTable.js_span_ce98cb'
          >
            {item.instructions.toUpperCase()}
          </span>,
          event.target.value?.length &&
            item.instructions
              .toLowerCase()
              .includes(event.target.value.toLowerCase()),
        ]
        tempData.push(row)
      }
    })
    setTableData(tempData)
    setCategoryObjData(tempData)
  }
  return (
    <div
      className={`py-0 ${styles.VcAlertTableContainer} ${classes.sopGradeContainer} h-100`}
      data-static-id='GradeTransitionTable.js_div_0e406b'
    >
      <div
        className={`${styles.headerContainer} d-flex justify-content-between align-items-center`}
        data-static-id='GradeTransitionTable.js_div_e1a000'
      >
        <div
          className={'h-100 d-flex justify-content-between w-100'}
          data-static-id='GradeTransitionTable.js_div_1ff49e'
        >
          <div
            className='d-flex align-items-center'
            data-static-id='GradeTransitionTable.js_div_5441ed'
          >
            <h2
              className='me-2 mb-0 text-14-bold text-uppercase'
              data-static-id='GradeTransitionTable.js_h2_774d34'
            >
              Select Grade Transition{' '}
              <span
                className='mx-1'
                data-static-id='GradeTransitionTable.js_span_28f368'
              >
                :
              </span>
            </h2>
            <div
              className={`${styles.signleSelectContainer} h-100`}
              data-static-id='GradeTransitionTable.js_div_90d41f'
            >
              <SingleSelect
                activeI={0}
                data={sopGrades}
                onSelectChange={onSelectChange}
                classes={{
                  container: styles.dropdownContainer,
                }}
              />
            </div>
          </div>
          <div
            className={`${styles.localSearchBar} form-outline`}
            data-static-id='GradeTransitionTable.js_div_d6bc5b'
          >
            <input
              type='search'
              id='form1'
              className='text-14-regular ms-2'
              placeholder='Search'
              aria-label='Search'
              data-testid='search-input-grade-transition'
              // value={searchQuery}
              onChange={debounce(handleSearchChange)}
              data-static-id='GradeTransitionTable.js_input_f83ca5'
            />
          </div>
        </div>
      </div>
      <div
        className={`${styles.bottomContainer} pe-0 ${classes.SopGradeTable} `}
        data-static-id='GradeTransitionTable.js_div_6afe9a'
      >
        <Table
          headers={header}
          data={tableData}
          customColumnWidths={[15, 15, 70]}
          leftAlignColumns={[2]}
          highlighRowCol={3}
          highlightCell={2}
          stateColumn={[3]}
          showLoader={isLoading}
          rowspanDict={categoryObj}
          borderColumnLength={2}
          data-static-id='GradeTransitionTable.js_Table_61e674'
        />
      </div>
    </div>
  )
}
