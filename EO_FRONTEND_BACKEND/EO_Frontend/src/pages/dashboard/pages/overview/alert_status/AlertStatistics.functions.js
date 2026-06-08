import ActiveIcon from 'assets/sabic_icons/alert_status_icon/active.svg'
import AutoClosedIcon from 'assets/sabic_icons/alert_status_icon/autoclosed.svg'
import closedIcon from 'assets/sabic_icons/alert_status_icon/closed.svg'
import GeneratedAlertIcon from 'assets/sabic_icons/alert_status_icon/generatedAlert.svg'
import ImplementedIcon from 'assets/sabic_icons/alert_status_icon/implemented.svg'
import OverdueIcon from 'assets/sabic_icons/alert_status_icon/overdue.svg'
import PendingIcon from 'assets/sabic_icons/alert_status_icon/pending.svg'
import progressAlertIcon from 'assets/sabic_icons/alert_status_icon/progressalert.svg'
import RejectedIcon from 'assets/sabic_icons/alert_status_icon/rejected.svg'
import WorkInProgressIcon from 'assets/sabic_icons/alert_status_icon/work_in_progress.svg'
import { getKSAMomentWithTimeAs12 } from 'utills/utilities'
export const chartColors = ['#1D5E8A', '#2981BD', '#66C5EC', '#99CBEC']
export const total_alert_statistics_template = {
  top: [
    {
      title: 'TOTAL GENERATED ALERTS',
      key: 'total',
      icon: GeneratedAlertIcon,
      status: 'TOTAL GENERATED ALERTS',
    },
  ],
}
export const active_alert_card_template = {
  top: [
    {
      title: 'Total Active',
      key: 'totalActive',
      icon: ActiveIcon,
      status: 'Total Active',
    },
  ],
  bottom: [
    {
      title: 'Pending',
      key: 'pending',
      icon: PendingIcon,
      status: 'Pending',
    },
    {
      title: 'Work in progress',
      key: 'inProgress',
      icon: WorkInProgressIcon,
      status: 'Work in Progress',
    },
    {
      title: 'Overdue',
      key: 'overdue',
      icon: OverdueIcon,
      status: 'Overdue',
    },
  ],
  footer: [
    {
      title: 'NO. OF OVERDUE ALERTS',
      subtitle: 'MORE THAN 3 DAYS',
      key: 'overdueSince',
      icon: OverdueIcon,
      status: 'NO. OF OVERDUE ALERTS',
    },
  ],
}
export const closed_alert_card_template = {
  top: [
    {
      title: 'Total Closed',
      key: 'closedTotal',
      icon: closedIcon,
      status: 'Total Closed',
    },
  ],
  bottom: [
    {
      title: 'Implemented',
      key: 'closedImplemented',
      icon: ImplementedIcon,
      status: 'Implemented',
    },
    {
      title: 'Rejected',
      key: 'closedRejected',
      icon: RejectedIcon,
      status: 'Rejected',
    },
    {
      title: 'Auto Closed',
      key: 'closedSystem',
      icon: AutoClosedIcon,
      status: 'System',
    },
  ],
  footer: [
    {
      title: 'TARGET DATE REVISION',
      subtitle: 'ACTIVE ALERTS',
      key: 'targetDateModified',
      icon: progressAlertIcon,
      status: 'TARGET DATE REVISION',
    },
  ],
}
export const getAlertCardData = () => {
  const alertCardData = [
    {
      imgSrc: WorkInProgressIcon,
      title: 'GENERATED',
      value: '56',
    },
    {
      imgSrc: OverdueIcon,
      title: 'CLOSED',
      value: '22',
    },
  ]
  return alertCardData
}
export const getPreviousAlertCardData = () => {
  const alertCardData = [
    {
      imgSrc: WorkInProgressIcon,
      title: 'GENERATED',
      value: '86',
    },
    {
      imgSrc: OverdueIcon,
      title: 'CLOSED',
      value: '42',
    },
  ]
  return alertCardData
}
export const pending_alerts_table_header = [
  'ALERT ID',
  'NAME',
  'ROLE',
  'PENDING SINCE',
  'CUMULATIVE LOST<br/>OPPORTUNITY ($)',
  'ACTION',
]
export const pending_alerts_table_order = [
  'alertId',
  'name',
  'role',
  'pendingSinceEpoch',
  'cumulativeLostOpportunity',
]
export const work_in_progress_alerts_table_header = [
  'ALERT ID',
  'NAME',
  'ROLE',
  'PENDING SINCE',
  'DUE DATE',
  'CUMULATIVE LOST<br/>OPPORTUNITY ($)',
  'ACTION',
]
export const work_in_progress_alerts_table_order = [
  'alertId',
  'name',
  'role',
  'inProgressSinceEpoch',
  'dueDateEpoch',
  'cumulativeLostOpportunity',
]
export const overdue_alerts_table_header = [
  'ALERT ID',
  'NAME',
  'ROLE',
  'OVERDUE SINCE (DAYS)',
  'CUMULATIVE LOST<br/>OPPORTUNITY ($)',
  'ACTION',
]
export const overdue_alerts_table_order = [
  'alertId',
  'name',
  'role',
  'overdueDays',
  'cumulativeLostOpportunity',
]
export const targetdaterevision_alerts_table_header = [
  'ALERT ID',
  'DUE DATE',
  'TIMES TARGET DATE REVISED',
  'CUMULATIVE LOST<br/>OPPORTUNITY ($)',
  'ACTION',
]
export const targetdaterevision_alerts_table_order = [
  'alertId',
  'dueDateEpoch',
  'targetModifiedCount',
  'cumulativeLostOpportunity',
]
export const implemented_alerts_table_header = [
  'ALERT ID',
  'NAME',
  'ROLE',
  'CUMULATIVE LOST<br/>OPPORTUNITY ($)',
  'ACTION',
]
export const implemented_alerts_table_order = [
  'alertId',
  'name',
  'role',
  'cumulativeLostOpportunity',
]
export const handleAlertManageModal = (requestID, setActionID) => {
  setActionID(requestID)
}
const getMonthName = (monthIndex) => {
  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ]
  return monthNames[monthIndex]
}
export const getMonthYearList = () => {
  const date = new Date()
  const months = []
  for (let i = 0; i <= 3; i++) {
    const monthDate = new Date(date.getFullYear(), date.getMonth() - i, 1)
    const monthName = getMonthName(monthDate.getMonth())
    const year = monthDate.getFullYear()
    const lastDate = new Date(year, monthDate.getMonth() + 1, 0)
    const KSALastDate = getKSAMomentWithTimeAs12(lastDate)
    const monthYear = `${monthName} ${year}`
    months.push({
      tag_name: monthYear,
      display_name: monthYear,
      lastDayOfMonth: KSALastDate,
    })
  }
  return months
}
const headerMap = {
  SystemNames: 'System',
  year: 'year',
  monthName: 'month',
  closedImplemented: 'closed (Implemented)',
  closedRejected: 'closed (Rejected)',
  closedSystem: 'Auto Closed',
  closedTotal: 'closed (Total)',
  totalGenerated: 'Total Generated Alerts',
  utilizationRate: 'Utilization Rate',
  cumulativeLostOpportunity: 'Cumulative Lost Opportunity',
  pending: 'Pending',
  inProgress: 'In Progress',
  overdue: 'Overdue',
}

// Function to convert the object to CSV format
function convertObjectToCSV(data) {
  const headers = Object.keys(data)
    .map((key) => headerMap[key])
    .join(',')
  const values = Object.values(data).join(',')
  return `${headers}\n${values}`
}
const generateCSVData = (data, caseIdList) => {
  const file_data = {
    SystemNames: caseIdList,
    ...data,
  }
  return file_data
}
export const downloadCSVFile = (data, caseIdList) => {
  const file_data = generateCSVData(data, caseIdList)
  const fileName = `utilization_Report_${file_data?.monthName}_${file_data?.year}`
  const csvString = convertObjectToCSV(file_data)
  const blob = new Blob([csvString], {
    type: 'text/csv',
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${fileName}.csv`
  document.body.appendChild(link)
  link.click()

  // Clean up
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
export const ALERT_TYPES = {
  PENDING: 'pending',
  WORK_IN_PROGRESS: 'workinprogress',
  OVERDUE: 'overdue',
  NO_OF_OVERDUE: 'no.ofoverduealerts',
  TARGET_DATE_REVISION: 'targetdaterevision',
  IMPLEMENTED: 'implemented',
  REJECTED: 'rejected',
  AUTO_CLOSED: 'autoclosed',
}
export const alertTypes = Object.values(ALERT_TYPES)
export const getColumnConfigsForReport = (key) => {
  switch (key) {
    case ALERT_TYPES.PENDING:
      return [
        'PENDING ALERTS',
        [
          {
            field: 'alertId',
            displayName: 'ALERT ID',
            flex: 0.5,
          },
          {
            field: 'name',
            displayName: 'NAME',
          },
          {
            field: 'role',
            displayName: 'ROLE',
          },
          {
            field: 'pendingSinceEpoch',
            displayName: 'PENDING SINCE',
          },
          {
            field: 'cumulativeLostOpportunity',
            displayName: `CUMULATIVE LOST \n OPPORTUNITY ($)`,
          },
        ],
      ]
    case ALERT_TYPES.WORK_IN_PROGRESS:
      return [
        'WORK IN PROGRESS ALERTS',
        [
          {
            field: 'alertId',
            displayName: 'ALERT ID',
            flex: 0.5,
          },
          {
            field: 'name',
            displayName: 'NAME',
          },
          {
            field: 'role',
            displayName: 'ROLE',
          },
          {
            field: 'inProgressSinceEpoch',
            displayName: 'PENDING SINCE',
          },
          {
            field: 'dueDateEpoch',
            displayName: 'DUE DATE',
          },
          {
            field: 'cumulativeLostOpportunity',
            displayName: `CUMULATIVE LOST \n OPPORTUNITY ($)`,
          },
        ],
      ]
    case ALERT_TYPES.OVERDUE:
      return [
        'OVERDUE ALERTS',
        [
          {
            field: 'alertId',
            displayName: 'ALERT ID',
            flex: 0.5,
          },
          {
            field: 'name',
            displayName: 'NAME',
          },
          {
            field: 'role',
            displayName: 'ROLE',
          },
          {
            field: 'overdueDays',
            displayName: 'OVERDUE SINCE (DAYS)',
          },
          {
            field: 'cumulativeLostOpportunity',
            displayName: `CUMULATIVE LOST \n OPPORTUNITY ($)`,
          },
        ],
      ]
    case ALERT_TYPES.NO_OF_OVERDUE:
      return [
        'NO. OF OVERDUE ALERTS',
        [
          {
            field: 'alertId',
            displayName: 'ALERT ID',
            flex: 0.5,
          },
          {
            field: 'name',
            displayName: 'NAME',
          },
          {
            field: 'role',
            displayName: 'ROLE',
          },
          {
            field: 'overdueDays',
            displayName: 'OVERDUE SINCE (DAYS)',
          },
          {
            field: 'cumulativeLostOpportunity',
            displayName: `CUMULATIVE LOST \n OPPORTUNITY ($)`,
          },
        ],
      ]
    case ALERT_TYPES.IMPLEMENTED:
      return [
        'IMPLEMENTED ALERTS',
        [
          {
            field: 'alertId',
            displayName: 'ALERT ID',
            flex: 0.5,
          },
          {
            field: 'name',
            displayName: 'NAME',
          },
          {
            field: 'role',
            displayName: 'ROLE',
          },
          {
            field: 'cumulativeLostOpportunity',
            displayName: `CUMULATIVE LOST \n OPPORTUNITY ($)`,
          },
        ],
      ]
    case ALERT_TYPES.REJECTED:
      return [
        'REJECTED ALERTS',
        [
          {
            field: 'alertId',
            displayName: 'ALERT ID',
            flex: 0.5,
          },
          {
            field: 'name',
            displayName: 'NAME',
          },
          {
            field: 'role',
            displayName: 'ROLE',
          },
          {
            field: 'cumulativeLostOpportunity',
            displayName: `CUMULATIVE LOST \n OPPORTUNITY ($)`,
          },
        ],
      ]
    case ALERT_TYPES.AUTO_CLOSED:
      return [
        'AUTO CLOSED ALERTS',
        [
          {
            field: 'alertId',
            displayName: 'ALERT ID',
            flex: 0.5,
          },
          {
            field: 'name',
            displayName: 'NAME',
          },
          {
            field: 'role',
            displayName: 'ROLE',
          },
          {
            field: 'cumulativeLostOpportunity',
            displayName: `CUMULATIVE LOST \n OPPORTUNITY ($)`,
          },
        ],
      ]
    case ALERT_TYPES.TARGET_DATE_REVISION:
      return [
        'TARGET DATE REVISION ALERTS',
        [
          {
            field: 'alertId',
            displayName: 'ALERT ID',
            flex: 0.5,
          },
          {
            field: 'dueDateEpoch',
            displayName: 'DUE DATE',
          },
          {
            field: 'targetModifiedCount',
            displayName: 'TIMES TARGET DATE REVISED',
          },
          {
            field: 'cumulativeLostOpportunity',
            displayName: `CUMULATIVE LOST \n OPPORTUNITY ($)`,
          },
        ],
      ]
    default:
      break
  }
}
