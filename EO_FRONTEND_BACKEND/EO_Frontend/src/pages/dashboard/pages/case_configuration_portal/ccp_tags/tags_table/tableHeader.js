import CustomModal from 'components/visuals/common/modal/CustomModal'
import SingleSelect from 'components/visuals/dropdown/single_select/SingleSelect'
import { useState } from 'react'
import { debounce } from 'utills/utilities'
import ConfigurationDownload from '../../Configurationdownload/ConfigurationDownload'
import styles from '../TableWithSearch.module.scss'
import AddNewCustomData from './AddNewCustomData'
const XlsHeadersArray = [
  'TAG ID',
  'TAG NAME',
  'UI DISPLAY NAME',
  'UOM',
  'TAG TYPE',
  'PI NAME',
  'FORMULA',
]
const ValuesForXls = [
  'tagID',
  'tagName',
  'uiDisplayName',
  'uom',
  'tagType',
  'piName',
  'inferredExpression',
]
const TableHeader = ({
  validationData,
  tooltips,
  modelNamesDropDownOptions,
  uomDropDownOptions,
  onCellChange,
  modelTypes,
  handleModelChange,
  setRefetch,
  finalFilteredData,
}) => {
  const [isModalOpenAddNew, setIsModalOpenAddNew] = useState(false)
  const [modifiedData, setModifiedData] = useState({})
  return (
    <div
      className={` d-flex justify-content-between align-items-center`}
      data-static-id='tableHeader.js_div_0b729f'
    >
      <div
        className={`${styles.searchContainer} ${styles.searchContainerWrapper} d-flex align-items-center gap-4 w-100`}
        data-static-id='tableHeader.js_div_ea1c59'
      >
        <div
          id='input-search'
          className={`${styles.boxContainer} d-flex align-items-center h-100`}
          data-static-id='tableHeader.js_div_4babec'
        >
          <input
            type='search'
            placeholder='SEARCH...'
            data-testid='search_input_field'
            className='text-12-regular h-100'
            aria-label='Search'
            onChange={debounce((ev) => onCellChange(ev.target.value))}
            data-static-id='tableHeader.js_input_45379a'
          />
        </div>
        <div
          className={`${styles.dropDownContainer} d-flex justify-content-start align-items-center h-100`}
          data-static-id='tableHeader.js_div_8c0a0c'
        >
          <span
            className='text-12-bold me-2 text-uppercase mt_03'
            data-static-id='tableHeader.js_span_a90204'
          >
            Model Name :
          </span>
          <span
            id='model-name-dropdown'
            className='h-100'
            data-static-id='tableHeader.js_span_bb31ed'
          >
            <SingleSelect
              classes={'w-100'}
              data={modelTypes}
              activeI={0}
              onSelectChange={handleModelChange}
            />
          </span>
        </div>
      </div>
      {/* <div className={`${styles.addNewButton} d-flex justify-content-end align-items-center h-100`}>
                <button
                    onClick={() => setIsModalOpenAddNew(true)}
                    className={`${styles.addButton} d-flex justify-content-center align-items-center border-0 me-1 text-12-regular text-uppercase bg_primary_blue text_primary_white`}
                >
                    <span>
                        <img src={plusAddIcon} alt="plusAddIcon" className="PlusIconImg" />
                    </span>
                    <span className={`ps-1 text-12-regular mt_03 text-uppercase ${styles.AddNew}`}>
                        Add New
                    </span>
                  </button>
            </div> */}
      {finalFilteredData?.length > 0 && (
        <ConfigurationDownload
          extraStyle={{
            bottom: 'unset',
            right: '4vmin',
            left: 'unset',
          }}
          headers={XlsHeadersArray}
          data={finalFilteredData}
          headersForXls={ValuesForXls}
          title={'tagDetails'}
        />
      )}
      <CustomModal
        show={isModalOpenAddNew}
        hideModal={() => setIsModalOpenAddNew(false)}
        title='Add Configurations'
        modalHeight='50vmin'
        size='md'
        bodyHeight='calc(100% - 5vmin)'
      >
        <AddNewCustomData
          editTagsList={modifiedData}
          setEditTagsList={setModifiedData}
          modelNamesDropDownOptions={modelNamesDropDownOptions}
          uomDropDownOptions={uomDropDownOptions}
          tooltips={tooltips}
          validationData={validationData}
          setIsModalOpenAddNew={setIsModalOpenAddNew}
          handleSetError={() => {}}
          setRefetch={setRefetch}
        />
      </CustomModal>
    </div>
  )
}
export default TableHeader
