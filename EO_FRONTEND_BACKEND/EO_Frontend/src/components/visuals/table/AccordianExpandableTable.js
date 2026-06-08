import minusIcon from 'assets/sabic_icons/table/table_minus_icon.svg'
import plusIcon from 'assets/sabic_icons/table/table_plus_icon.svg'
import React, { useEffect, useState } from 'react'
import classes from './AccordianExpandableTable.module.scss'
export default function AccordianExpandableTable({
  headers = [],
  customColumnWidths = [],
  expandedRowsKey = {},
  data,
}) {
  const [expandedCategories, setExpandedCategories] = useState({})
  useEffect(() => {
    if (Object.keys(expandedCategories).length === 0) {
      setExpandedCategories(expandedRowsKey)
    }
    if (customColumnWidths.length <= 0) {
      headers.forEach(() => customColumnWidths.push(100 / headers.length))
    }
  }, [expandedRowsKey])
  const getColumnStyles = (columnIndex) => {
    if (headers.length === 2) {
      if (columnIndex === 0 || columnIndex === 1) {
        return {
          width: '40%',
        }
      } else if (columnIndex === 2) {
        return {
          width: '20%',
        }
      }
    } else if (headers.length === 3) {
      if (columnIndex === 0) {
        return {
          width: '20%',
        }
      } else if (columnIndex === 1) {
        return {
          width: '30%',
        }
      } else if (columnIndex === 2) {
        return {
          width: '10%',
        }
      } else if (columnIndex === 3) {
        return {
          width: '40%',
        }
      }
    }
    return {}
  }
  const toggleCategory = (categoryIndex) => {
    setExpandedCategories((prevState) => ({
      ...prevState,
      [`${categoryIndex}`]: !prevState[`${categoryIndex}`],
    }))
  }
  return (
    <div
      className={`${classes.tableContainer}`}
      data-static-id='AccordianExpandableTable.js_div_9bf96d'
    >
      <table
        className={`${classes.overflowHidden} ${classes.bottom} h-100`}
        data-static-id='AccordianExpandableTable.js_table_09c4da'
      >
        <thead data-static-id='AccordianExpandableTable.js_thead_e86653'>
          <tr data-static-id='AccordianExpandableTable.js_tr_e1da0a'>
            {headers.map((header, i) => (
              <th
                colSpan={header.colSpan}
                key={header.key}
                className='mt-1 text-14-regular text-bold text-uppercase'
                style={{
                  width: `${customColumnWidths[i]}%`,
                }}
                data-static-id='AccordianExpandableTable.js_th_fe4c3f'
              >
                {header.label}
              </th>
            ))}
          </tr>
        </thead>

        <tbody data-static-id='AccordianExpandableTable.js_tbody_91a5da'>
          {data.map((item, categoryIndex) => {
            const itemKey = item.data?.[0] || JSON.stringify(item.data)
            return (
              <React.Fragment key={`category-${item.data[0]}`}>
                <tr
                  onClick={() => toggleCategory(categoryIndex)}
                  className=''
                  data-static-id='AccordianExpandableTable.js_tr_968a6d'
                >
                  {item.data.map((cell, i) => {
                    return (
                      <td
                        colSpan={headers[i]?.colSpan}
                        key={`${itemKey}-${cell}`}
                        style={
                          i === 0
                            ? {
                                height: '4.5vmin',
                              }
                            : {
                                ...getColumnStyles(i),
                              }
                        } // Apply dynamic style here too
                        data-static-id='AccordianExpandableTable.js_td_e18bf6'
                      >
                        <div
                          className='w-100 d-flex align-items-center whatIfTextCenter'
                          data-static-id='AccordianExpandableTable.js_div_0ce22b'
                        >
                          {i === 0 && item?.children?.length ? (
                            <button
                              className={`${classes.disabledBorder} ${classes.WidthAdjust} p-0`}
                              aria-expanded={
                                expandedCategories[`${categoryIndex}`]
                              }
                              data-static-id='AccordianExpandableTable.js_button_6f68b0'
                            >
                              <div
                                id='accordionExample'
                                className={`accordion ${classes.disabledBorder}`}
                                data-static-id='AccordianExpandableTable.js_div_4c061f'
                              >
                                <div data-static-id='AccordianExpandableTable.js_div_cc4602'>
                                  <h2
                                    className={`${classes.disabledBorder} accordion-header text-14-regular`}
                                    data-static-id='AccordianExpandableTable.js_h2_6d392d'
                                  >
                                    <img
                                      src={
                                        expandedCategories[`${categoryIndex}`]
                                          ? minusIcon
                                          : plusIcon
                                      }
                                      alt={
                                        expandedCategories[`${categoryIndex}`]
                                          ? 'Collapse'
                                          : 'Expand'
                                      }
                                      style={{
                                        width: '2vmin',
                                        height: '2vmin',
                                      }}
                                      data-static-id='AccordianExpandableTable.js_img_c9adf8'
                                    />
                                  </h2>
                                </div>
                              </div>
                            </button>
                          ) : null}
                          <span data-static-id='AccordianExpandableTable.js_span_5f5945'>
                            {cell}
                          </span>
                        </div>
                      </td>
                    )
                  })}
                </tr>
                {expandedCategories[`${categoryIndex}`] &&
                  item.children.map((row, rIndex) => (
                    <tr
                      key={`expandedCategories-${row[0]}`}
                      id='collapseOne'
                      className='accordion-collapse collapse show'
                      data-bs-parent='#accordionExample'
                      data-static-id='AccordianExpandableTable.js_tr_ac6be2'
                    >
                      {row.map((cell, cellIndex) => (
                        <td
                          key={`${itemKey}-${cell}`}
                          colSpan={headers[cellIndex]?.colSpan}
                          style={{
                            ...getColumnStyles(cellIndex),
                          }}
                          className={`text-14-regular ${classes.ExpandableTableContainerTbody} bg-white`}
                          data-static-id='AccordianExpandableTable.js_td_c59ceb'
                        >
                          <div
                            id='collapseOne'
                            className='accordion-collapse collapse show'
                            data-bs-parent='#accordionExample'
                            data-static-id='AccordianExpandableTable.js_div_cd1a03'
                          >
                            <div
                              className={`${classes.AccordianBody} accordion-body justify-content-start align-items-center d-flex gap-2 w-100`}
                              data-static-id='AccordianExpandableTable.js_div_37b9dc'
                            >
                              {cell}
                            </div>
                          </div>
                        </td>
                      ))}
                    </tr>
                  ))}
              </React.Fragment>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
