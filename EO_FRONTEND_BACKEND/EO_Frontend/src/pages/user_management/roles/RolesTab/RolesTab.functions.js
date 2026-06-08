import Logger from 'logger/Logger'
export function handleRequestError(error, message) {
  Logger?.error(message, error)
  window.alert(message)
}
export const NoDataInWorkflow = {
  'Process Manager': [],
  'Operation Manager': [],
  'Process Engineer': [],
  'Operation Engineer': [],
  'Mailing List (Escalation)': [],
}
export const affiliateLevel_headers = [
  'EMPLOYEE NAME',
  'EMPLOYEE ID',
  'EMAIL ID',
  'AFFILIATE NAME',
  'ROLE',
  'ACTION',
]
export const headers = [
  'EMPLOYEE NAME',
  'EMPLOYEE ID',
  'EMAIL ID',
  'AFFILIATE NAME',
  'ACTION',
]
