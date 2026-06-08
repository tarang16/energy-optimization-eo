import styles from './DateTimePicker.module.scss'
export function getFormattedDate(dt = new Date()) {
  return `${dt.getFullYear()}-${('0' + (dt.getMonth() + 1)).slice(-2)}-${('0' + dt.getDate()).slice(-2)}T${('0' + dt.getHours()).slice(-2)}:${('0' + dt.getMinutes()).slice(-2)}:${('0' + dt.getSeconds()).slice(-2)}`
}
export const colorCoding = {
  0: `${styles.cal_yellow}`,
  1: `${styles.cal_blue}`,
  2: `${styles.cal_red}`,
}
function getPreviousDate(date, dataDict) {
  const dateArray = Object.keys(dataDict).reverse()
  const index = dateArray.indexOf(date)
  if (index === -1) {
    return null
  } else {
    return dateArray[index - 1] || null
  }
}
export function findLastStatus(dateInput, dataDict) {
  const [inputDate] = dateInput.split('T')
  let currentDate = inputDate
  while (currentDate) {
    const rows = dataDict[currentDate]?.rows
    if (!rows) break
    const times = Object.keys(rows).sort((a, b) => b.localeCompare(a))
    let notFound = false
    for (let time of times) {
      const { status } = rows[time]
      const fullTime = `${currentDate}T${time}`
      if (fullTime <= dateInput) {
        if (status === 1 || status === 2) {
          return fullTime
        }
        notFound = true
      }
    }
    if (notFound) {
      currentDate = getPreviousDate(currentDate, dataDict)
    }
  }
  return dateInput
}
export const getLatestDateAndTimeFromDict = (datesDict) => {
  const dateKeys = Object.keys(datesDict)
  if (!dateKeys.length) return null
  const latestDate = dateKeys[0]
  const timeKeys = Object.keys(datesDict[latestDate]?.rows || {})
  if (!timeKeys.length) return null
  const latestTime = timeKeys[0]
  if (latestDate && latestTime) {
    return `${latestDate}T${latestTime}`
  }
  return null
}
