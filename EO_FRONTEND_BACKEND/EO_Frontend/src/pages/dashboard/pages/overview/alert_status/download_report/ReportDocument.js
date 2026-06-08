import {
  Document,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
} from '@react-pdf/renderer'
import {
  ALERT_TYPES,
  getColumnConfigsForReport,
} from '../AlertStatistics.functions'
import PdfTable from './PDFTable'
const ReportDocument = ({ imageData, tablesData }) => {
  return (
    <Document>
      <Page style={styles.page}>
        <View>
          <Text style={styles.pageTitle}>Overall Statistics</Text>
          <Image src={imageData} />
        </View>
      </Page>
      <Page style={styles.page}>
        <View style={styles.tables}>
          {tablesData.map((table) => {
            const [title, columns] = getColumnConfigsForReport(table.key)
            if (table.key === ALERT_TYPES.NO_OF_OVERDUE) {
              table.data.data = table?.data?.data.filter(
                (item) => item.overdueDays > 3,
              )
            }
            return (
              <View key={`${table.key}-${title}`} style={styles.container}>
                <Text style={styles.textValue}>{`${title}`}</Text>
                {table.key === ALERT_TYPES.AUTO_CLOSED && (
                  <Text style={styles.description}>
                    The system automatically closes any alerts that have not
                    been reoccurred within the past 24 hours (which can be
                    configurable through admin page).
                  </Text>
                )}
                <PdfTable columnConfig={columns} rowData={table?.data?.data} />
              </View>
            )
          })}
        </View>
      </Page>
    </Document>
  )
}
const styles = StyleSheet?.create({
  page: {
    padding: 20,
    backgroundColor: '#ffffff',
  },
  pageTitle: {
    textAlign: 'center',
    marginVertical: 24,
    fontWeight: 'bold',
    color: '#007bff',
    fontSize: 18,
    marginBottom: 48,
  },
  tables: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    width: '100%',
  },
  textValue: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#007bff',
  },
  description: {
    fontSize: 8,
    color: '#aaa',
    marginTop: 3,
    flexWrap: 'nowrap',
    lineHeight: 2,
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    width: '100%',
  },
  container: {
    marginTop: 2,
  },
})
export default ReportDocument
