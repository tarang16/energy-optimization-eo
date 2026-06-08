import minusIcon from 'assets/sabic_icons/table/table_minus_icon.svg'
import plusIcon from 'assets/sabic_icons/table/table_plus_icon.svg'
import React, { useEffect, useState } from 'react'
import classes from './ExpandableTable.module.scss'
import { genRandomNumber } from 'utills/utilities'
export default function ExpandableTable({
  headers = [],
  customColumnWidths = [],
  expandedRowsKey = {},
  data,
}) {
  const [expandedCategories, setExpandedCategories] = useState(expandedRowsKey)
  useEffect(() => {
    if (customColumnWidths.length <= 0) {
      headers.forEach((obj, i) => customColumnWidths.push(100 / headers.length))
    }
    setExpandedCategories(expandedRowsKey)
  }, [JSON.stringify(expandedRowsKey)])
  const toggleCategory = (categoryIndex) => {
    setExpandedCategories((prevState) => ({
      ...prevState,
      [`${categoryIndex}`]: !prevState[`${categoryIndex}`],
    }))
  }
  return (
    <div
      className={`${classes.tableContainer} table-Container`}
      data-static-id='ExpandableTable.js_div_851304'
    >
      <table className='h-100' data-static-id='ExpandableTable.js_table_0caba5'>
        <thead data-static-id='ExpandableTable.js_thead_d2380d'>
          <tr data-static-id='ExpandableTable.js_tr_b04f41'>
            {headers.map((header, i) => (
              <th
                key={header.key}
                className='text-14-regular text-bold text-uppercase'
                style={{
                  width: `${customColumnWidths[i]}%`,
                }}
                data-static-id='ExpandableTable.js_th_bfe8d5'
              >
                {header.label}
                {header?.uom ? (
                  <p
                    className={`text-10-regular text_primary_gray_2 ${classes.expandTableUomText}`}
                    data-static-id='ExpandableTable.js_p_b8f4cb'
                  >
                    {header.uom}
                  </p>
                ) : (
                  ' '
                )}
              </th>
            ))}
          </tr>
        </thead>

        <tbody data-static-id='ExpandableTable.js_tbody_33f5b5'>
          {data?.map((item, categoryIndex) => {
            const itemKey = item.data?.[0] || JSON.stringify(item.data)
            return (
              <React.Fragment key={`key-${itemKey}-${item.children}`}>
                <tr
                  key={`${itemKey}-${item.children}`}
                  onClick={() => toggleCategory(categoryIndex)}
                  data-static-id='ExpandableTable.js_tr_181c42'
                >
                  {item?.data?.map((cell, i) => (
                    <td
                      key={`${itemKey}-${item.children}-${genRandomNumber}`}
                      data-static-id='ExpandableTable.js_td_b60e2b'
                    >
                      {i === 0 && item?.children?.length ? (
                        <button
                          className={`${classes.disabledBorder} ${classes.WidthAdjust} p-0 `}
                          aria-expanded={expandedCategories[`${categoryIndex}`]}
                          data-static-id='ExpandableTable.js_button_32dd38'
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
                            data-static-id='ExpandableTable.js_img_813492'
                          />
                        </button>
                      ) : null}
                      <span
                        className='text-12-regular'
                        data-static-id='ExpandableTable.js_span_676a35'
                      >
                        {cell}{' '}
                      </span>
                    </td>
                  ))}
                </tr>
                {expandedCategories[`${categoryIndex}`] &&
                  item?.children?.map((row) => (
                    <tr
                      key={row[0]}
                      data-static-id='ExpandableTable.js_tr_e7ff01'
                    >
                      {row.map((cell, i) => (
                        <td
                          style={
                            i === 0
                              ? {
                                  paddingLeft: '4vmin',
                                  paddingRight: '2vmin',
                                }
                              : {}
                          }
                          key={`${itemKey}-${cell}`}
                          className={`${classes.ExpandableTableContainerTbody} bg-white`}
                          data-static-id='ExpandableTable.js_td_f2456d'
                        >
                          {cell}
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
