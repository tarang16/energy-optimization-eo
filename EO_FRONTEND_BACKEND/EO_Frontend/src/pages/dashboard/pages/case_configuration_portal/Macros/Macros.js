import editIcon from 'assets/sabic_icons/header/edit_default_icon.svg'
import TooltipOverlay from 'components/visuals/common/custom_tooltip/CustomOverlayTooltip'
import CustomModal from 'components/visuals/common/modal/CustomModal'
import SimpleTable from 'components/visuals/table/SimpleTable'
import { TRACKEVENTOBJ } from 'config/ActivityTrackerConfig'
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getMacros } from 'services/CCPServices'
import { filterTableData, showToast } from 'utills/utilities'
import styles from '../CaseConfigurationPortal.module.scss'
import ConfigurationDownload from '../Configurationdownload/ConfigurationDownload'
import EditMacrosTabs from './EditMacrosTabs'
const headersForXls = [
  'element',
  'attribute',
  'tag_id',
  'tagname',
  'uom',
  'value',
]
export default function Macros({ role, canEdit = false, caseId }) {
  const params = useParams()
  const [editData, setEditData] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [tableDataState, setTableDataState] = useState([])
  const [filteredData, setFilteredData] = useState([])
  const tooltips = {}
  const [apiData, setApiData] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const HEADERS = [
    'PIPELINE MACRO ID',
    'CATEGORY',
    'VALUE',
    'MACRO NAME',
    'DEFAULT VALUE',
    'DESCRIPTION',
    'ACTION',
  ]
  const genTableData = (data = []) => {
    return data?.map((obj) => [
      obj.pipelineMacroId ?? '-',
      obj.category ?? '- ',
      obj?.value ?? '-',
      obj?.macroName ?? '-',
      obj?.defaultValue ?? '-',
      obj.description ?? '-',
      <span
        key={`${obj.pipelineMacroId}-edit`}
        className={styles.img}
        data-static-id='Macros.js_span_60ccc0'
      >
        {!canEdit ? (
          <TooltipOverlay
            placement='left'
            message='You need developer access to edit this data'
          >
            <img
              id='tag_out_of_bound_img'
              src={editIcon}
              className={`disabledImg ${styles.editIcon}`}
              onClick={() => {}}
              data-static-id='Macros.js_img_669b19'
            />
          </TooltipOverlay>
        ) : (
          <TooltipOverlay placement='left' message='Edit'>
            <img
              id='tag_out_of_bound_img'
              src={editIcon}
              className={`cursor-pointer blueOnHover  ${styles.editIcon}`}
              onClick={() => {
                TRACKEVENTOBJ.CCPTabs.onBtnClick({
                  btnName: 'Edit',
                  tabName: role,
                  tagName: obj.macroName,
                  params: params,
                })
                setEditData(obj)
              }}
              data-static-id='Macros.js_img_59f074'
            />
          </TooltipOverlay>
        )}
      </span>,
    ])
  }
  const fetchData = async () => {
    try {
      setIsLoading(true)
      const resp = await getMacros(caseId)
      if (resp?.statuscode === 200) {
        setApiData(resp?.data ?? [])
        const tableData = genTableData(resp.data)
        setTableDataState(tableData)
        setIsLoading(false)
        if (searchTerm) {
          const filteredData = filterTableData(
            resp?.data ?? apiData,
            searchTerm,
            ['description', 'category', 'macroName'],
          )
          setFilteredData(filteredData)
          const tableData = genTableData(filteredData)
          setTableDataState(tableData)
        }
      } else {
        setTableDataState([])
        setIsLoading(false)
      }
    } catch (error) {
      showToast('Error while fetching PI AF constants data', error)
      setTableDataState([])
      setIsLoading(false)
    }
  }
  useEffect(() => {
    fetchData()
  }, [caseId])
  useEffect(() => {
    const filteredData = filterTableData(apiData, searchTerm, [
      'description',
      'category',
      'macroName',
    ])
    setFilteredData(filteredData)
    const tableData = genTableData(filteredData)
    setTableDataState(tableData)
  }, [searchTerm])
  return (
    <div
      className={`${styles.tbl_ccpTabsContainer} h-100`}
      data-static-id='Macros.js_div_ee4308'
    >
      <CustomModal
        hideModal={() => {
          setEditData(null)
        }}
        title={'PIPELINE MACROS'}
        show={!!editData}
        customSpacingClass={styles.customSpacingClass}
        size={'lg'}
        modalHeight='auto'
      >
        {/* edit */}

        <EditMacrosTabs
          editData={editData}
          setEditData={setEditData}
          fetchData={fetchData}
          tooltips={tooltips}
        />
      </CustomModal>

      <div
        className={`${styles.searchContainer} p-0 d-flex align-items-center justify-content-between`}
        data-static-id='Macros.js_div_e0e845'
      >
        <input
          type='search'
          placeholder='Search...'
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          aria-label='Search'
          className={`text-14-regular  w-100 h-100 ${styles.searchInput}`}
          data-static-id='Macros.js_input_0c1c77'
        />
      </div>
      <div
        className={`${styles.bottomContainer} position-relative`}
        data-static-id='Macros.js_div_9aa636'
      >
        {filteredData?.length > 0 && (
          <ConfigurationDownload
            extraStyle={{
              bottom: 'unset',
              top: '-5vmin',
              right: '1vmin',
              left: 'unset',
            }}
            headers={HEADERS}
            data={filteredData}
            headersForXls={headersForXls}
            title={'constants'}
          />
        )}
        <SimpleTable
          headers={HEADERS}
          data={tableDataState}
          showLoader={isLoading}
          customColumnWidths={[25, 20, 10, 15, 10, 10, 10]}
        />
      </div>
    </div>
  )
}
