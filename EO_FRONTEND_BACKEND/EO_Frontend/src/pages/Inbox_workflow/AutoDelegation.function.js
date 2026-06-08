export const isDelegationDateGreater = (immediateAutoDelegateTillEpoch) => {
  if (!immediateAutoDelegateTillEpoch) {
    return false
  }
  const epochTime = parseInt(immediateAutoDelegateTillEpoch)
  const targetDate = new Date(epochTime)
  const targetDateStr = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}-${String(targetDate.getDate()).padStart(2, '0')}`
  const currentDate = new Date()
  const currentDateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`
  return targetDateStr > currentDateStr
}
export const formatDate = (dateString) => {
  const date = new Date(dateString)
  const day = String(date.getDate()).padStart(2, '0')
  const month = date.toLocaleString('default', {
    month: 'short',
  })
  const year = String(date.getFullYear()).slice(-2)
  return `${day}-${month}-${year}`
}
