import infoIcon from 'assets/sabic_icons/common/timeInfo.svg'
import editIcon from 'assets/sabic_icons/header/edit_default_icon.svg'
import Loader from 'components/ui/loader/Loader'
import SingleSelect from 'components/visuals/dropdown/single_select/SingleSelect'
import { useMemo } from 'react'
import { ScrollArrow } from 'utills/utilities'
import styles from '../TableWithSearch.module.scss'
const DataTable = ({
  data = [],
  headers = [],
  tagTypes = [],
  handleTagChange = () => {},
  onInfoClick,
  onEditClick,
  onDeleteClick,
  canEdit = false,
  leftAlignColumns = [],
  customColumnWidths = [],
  leftAlignHeaders = [],
  isLoading = false,
  isLoadingMore = false,
  loaderRef,
}) => {
  const getCellTextAlignmentStyle = (cellIndex) =>
    Array.isArray(leftAlignColumns) && leftAlignColumns.includes(cellIndex)
      ? 'text-start ps-2'
      : 'text-center'
  const memoizedColumnWidths = useMemo(() => {
    return customColumnWidths.length > 0
      ? customColumnWidths
      : headers.map(() => 100 / headers.length)
  }, [customColumnWidths, headers])
  const getActionFields = (tableRow, rowIndex, field, index) => {
    return (
      <td
        key={`${rowIndex}-${field}`}
        className='text-center'
        style={{
          width: `${memoizedColumnWidths[index]}%`,
        }}
        data-static-id='Table.js_td_9b8790'
      >
        <div
          className={`d-flex justify-content-center px-1 gap-2`}
          data-static-id='Table.js_div_a6429b'
        >
          <button
            id='infoIcon-button'
            className={`${styles.editBtnImage}`}
            onClick={() => onInfoClick(tableRow)}
            data-static-id='Table.js_button_ce02b9'
          >
            <img
              alt='infoIcon'
              src={infoIcon}
              data-static-id='Table.js_img_7c8bd0'
            />
          </button>
          <button
            id='editIcon-button'
            className={
              `${styles.editBtnImage} ` +
              (canEdit ? 'cursor-pointer blueOnHover' : 'disabledImg')
            }
            onClick={() => canEdit && onEditClick(tableRow)}
            data-static-id='Table.js_button_6b00d5'
          >
            <img
              src={editIcon}
              alt='edit icon'
              data-static-id='Table.js_img_5ca99c'
            />
          </button>

          {/* <button className={`${canEdit ? `${styles.editBtnImage} cursor-pointer blueOnHover` : `${styles.editBtnImage} disabledImg`
                    }`}
                    onClick={() => canEdit && onDeleteClick(tableRow)}>
                    <img
                        alt="deleteIcon"
                        src={deleteIcon}
                      />
                </button> */}
        </div>
      </td>
    )
  }
  const getTableRow = (tableRow, rowIndex) => {
    return headers.map(({ field }, index) => {
      let cellContent
      if (field === 'action') {
        cellContent = getActionFields(tableRow, rowIndex, field, index)
      } else if (field === 'piName') {
        cellContent = (
          <td
            key={`${rowIndex}-${field}`}
            className={getCellTextAlignmentStyle(index)}
            style={{
              width: `${memoizedColumnWidths[index]}%`,
            }}
            data-static-id='Table.js_td_d38b81'
          >
            {tableRow?.tagType === 'inferred'
              ? tableRow['inferredExpression']
              : tableRow[field]}
          </td>
        )
      } else {
        cellContent = (
          <td
            key={`${rowIndex}-${field}`}
            className={getCellTextAlignmentStyle(index)}
            style={{
              width: `${memoizedColumnWidths[index]}%`,
            }}
            data-static-id='Table.js_td_413a6b'
          >
            {tableRow[field]}
          </td>
        )
      }
      return cellContent
    })
  }
  const getTableHeader = () => {
    return (
      <tr data-static-id='Table.js_tr_546e99'>
        {headers.map(({ title, showFilter }, index) => (
          <th
            key={title}
            className={`text-11-regular ${leftAlignHeaders.includes(index) ? 'text-start' : 'text-center'}`}
            style={{
              width: `${memoizedColumnWidths[index]}%`,
            }}
            data-static-id='Table.js_th_f4ad05'
          >
            <div
              className={`d-flex align-items-center justify-content-center gap-2 h-100`}
              data-static-id='Table.js_div_b2b316'
            >
              <div data-static-id='Table.js_div_95a774'>
                {title.toUpperCase()}
              </div>
              {showFilter && (
                <div
                  id='tagtype-filter'
                  className={`${styles.dropdowncontainer}`}
                  data-static-id='Table.js_div_1f041d'
                >
                  <SingleSelect
                    data={tagTypes}
                    onSelectChange={handleTagChange}
                  />
                </div>
              )}
            </div>
          </th>
        ))}
      </tr>
    )
  }
  const getTableBody = () => {
    if (isLoading) {
      return [
        <tr key='loading' data-static-id='Table.js_tr_23496d'>
          <td
            colSpan={headers?.length}
            className='text-center'
            data-static-id='Table.js_td_37568d'
          >
            <Loader />
          </td>
        </tr>,
      ]
    }
    if (!data || data.length === 0) {
      return [
        <tr key='no-data' data-static-id='Table.js_tr_b4c2d1'>
          <td
            colSpan={headers?.length}
            className='text-center'
            data-static-id='Table.js_td_a80406'
          >
            No Data to show
          </td>
        </tr>,
      ]
    }
    return data.map((tableRow, rowIndex) => (
      <tr key={tableRow.id ?? rowIndex} data-static-id='Table.js_tr_e6e6e7'>
        {getTableRow(tableRow, rowIndex)}
      </tr>
    ))
  }
  return (
    <div
      className={`${styles.DataTableContainer} w-100`}
      data-static-id='Table.js_div_af1e6d'
    >
      <div
        className={`table-responsive ${styles.table_block} customScrollBarMargin w-100 p-0 m-0 bg_primary_white`}
        data-static-id='Table.js_div_f44c00'
      >
        <table
          className={`${styles.table} bg_primary_white`}
          id='simple-table'
          data-static-id='Table.js_table_305a73'
        >
          <thead
            className={styles.sticky_table}
            data-static-id='Table.js_thead_566898'
          >
            {getTableHeader()}
          </thead>
          <tbody
            className={`bg_primary_white ${styles.align_table_cell} ${styles.table_body}`}
            data-static-id='Table.js_tbody_f35103'
          >
            {getTableBody()}
            {isLoadingMore && (
              <tr data-static-id='Table.js_tr_062b0f'>
                <td
                  colSpan={7}
                  className='text-center py-3'
                  data-static-id='Table.js_td_841a90'
                >
                  {' '}
                  <div
                    ref={loaderRef}
                    className={`d-flex justify-content-center align-items-center ${styles.loaderContainer}`}
                    data-static-id='Table.js_div_2996ca'
                  >
                    <ScrollArrow />
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
export default DataTable
