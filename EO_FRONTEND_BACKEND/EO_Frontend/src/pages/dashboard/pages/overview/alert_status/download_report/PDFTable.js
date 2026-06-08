import { StyleSheet, Text, View } from '@react-pdf/renderer'
import {
  formatDateWithoutTime,
  formatDateWithTime,
  getValOrEmptyStr,
} from '../AlertStatistics'
// Create styles

export function getCellValue(key, val) {
  if (key === 'dueDateEpoch') {
    return formatDateWithoutTime(val)
  } else if (key === 'inProgressSinceEpoch' || key === 'pendingSinceEpoch')
    return formatDateWithTime(val)
  else {
    return getValOrEmptyStr(val)
  }
}
const PdfTable = ({
  columnConfig,
  rowData,
  tableStyle = {},
  headerStyle = {},
  rowStyle = {},
  cellStyle = {},
}) => {
  const styleConditon = (textAlign) => {
    switch (textAlign) {
      case textAlign === 'center':
        return 'center'
      case textAlign === 'right':
        return 'flex-end'
      default:
        return 'flex-start'
    }
  }
  return (
    <View style={[styles.table, tableStyle]}>
      {/* Table Header */}
      <View style={[styles.tableHeader, headerStyle]}>
        {Array.isArray(columnConfig) &&
          columnConfig.map((column, index) => {
            const isLastColumn = index === columnConfig.length - 1
            const flex = column.flex || 1
            const textAlign = column.columnAlign || 'center'
            return (
              <View
                key={column.field}
                style={[
                  isLastColumn ? styles.tableCellLast : styles.tableCell,
                  {
                    flex: flex,
                    justifyContent: styleConditon(textAlign),
                  },
                  cellStyle,
                ]}
              >
                <Text
                  style={[
                    styles.headerCell,
                    {
                      textAlign,
                    },
                  ]}
                >
                  {column.displayName || column.field}
                </Text>
              </View>
            )
          })}
      </View>
      {/* Table Rows */}
      {Array.isArray(rowData) && rowData.length === 0 ? (
        <Text style={styles.noDataText}>No data available</Text>
      ) : (
        rowData?.map((row, rowIndex) => (
          <View
            key={row}
            style={[
              styles.tableRow,
              rowIndex % 2 === 0
                ? {
                    backgroundColor: '#ffffff',
                  }
                : {
                    backgroundColor: '#fafafa',
                  },
              rowStyle,
            ]}
          >
            {columnConfig.map((column, colIndex) => {
              const isLastColumn = colIndex === columnConfig.length - 1
              const flex = column.flex || 1
              const textAlign = column.contentAlign || 'center'
              const cellValue =
                row[column.field] !== undefined ? row[column.field] : ''
              return (
                <View
                  key={`${column.field}`}
                  style={[
                    isLastColumn ? styles.tableCellLast : styles.tableCell,
                    {
                      flex: flex,
                      justifyContent: styleConditon(textAlign),
                    },
                    cellStyle,
                  ]}
                >
                  <Text
                    style={{
                      textAlign,
                      fontSize: 6,
                    }}
                  >
                    {String(getCellValue(column.field, cellValue))}
                  </Text>
                </View>
              )
            })}
          </View>
        ))
      )}
    </View>
  )
}
const styles = StyleSheet?.create({
  table: {
    width: '100%',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#bfbfbf',
    marginVertical: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#eaf9ff',
    borderBottomWidth: 1,
    borderBottomColor: '#bfbfbf',
    borderBottomStyle: 'solid',
    alignItems: 'center',
    minHeight: 30,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#efefef',
    borderBottomStyle: 'solid',
    alignItems: 'center',
    minHeight: 25,
  },
  tableCell: {
    padding: 5,
    fontSize: 7,
    borderRightWidth: 1,
    borderRightColor: '#efefef',
    borderRightStyle: 'solid',
  },
  tableCellLast: {
    padding: 5,
    fontSize: 7,
  },
  headerCell: {
    fontWeight: 'bold',
    fontSize: 7,
  },
  noDataText: {
    fontSize: 8,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
  },
})
export default PdfTable
