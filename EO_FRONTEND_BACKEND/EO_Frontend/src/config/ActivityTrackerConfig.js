import moment from 'moment'
import {
  getCaseIdByAffiliate,
  getTrackingObj,
  getValsBaseOnCondition,
  slugToText,
} from 'utills/utilities'
export const PAGE_KEYS = {
  Monitoring: 'Monitoring',
  performanceTracker: 'Performance Tracker',
  corporate: 'Sabic',
  UserManagement: 'User Management',
  footer: 'Footer',
  header: 'Header',
  sidebar: 'Sidebar',
  overview: 'Overview',
  sabic: 'SABIC',
  errorLogging: 'Error Logging',
  InboxWorkflow: 'Inbox Workflow',
  WorkflowTab: 'Workflow Tab',
  CCP: 'Configurations',
  Optimizer: 'Optimizer',
  affiliates: 'Affiliate',
  affiliate: 'Affiliate',
  Configurations: 'Configurations',
  AutoDelegation: 'Auto Delegation',
  network: 'Network',
  energyManagement: 'Energy Management',
  optimization: 'Optimization',
}
const getRequiredData = (vals = {}) => {
  const caseId = getCaseIdByAffiliate(
    slugToText(vals?.params?.affiliate),
    vals?.caseData,
  )
  return {
    caseId,
    ...vals.params,
  }
}
export const getScreenName = (pathname = '', params = {}) => {
  if (pathname === '/') return 'Sabic'
  const routeMap = [
    {
      key: 'affiliates',
      label: 'Affiliate',
    },
    {
      key: 'overview',
      label: 'Overview',
    },
    {
      key: 'monitoring',
      label: 'Monitoring',
    },
    {
      key: 'configurations',
      label: 'Configurations',
    },
    {
      key: 'user-management-roles',
      label: 'User Management Dashboard',
    },
    {
      key: 'features',
      label: 'User Management Features',
    },
    {
      key: 'error-logging',
      label: 'App Monitoring Error Logging',
    },
    {
      key: 'activity-tracker',
      label: 'App Monitoring Activity Tracker',
    },
    {
      key: 'performance-tracker',
      label: 'App Monitoring Performance Tracker',
    },
    {
      key: 'inbox_workflow',
      label: 'Inbox Workflow',
    },
    {
      key: 'energy-management',
      label: 'Energy Management',
    },
    {
      key: 'optimization',
      label: 'Optimization',
    },
    {
      key: 'workflow-instance-errors',
      label: 'App Monitoring Workflow Insatnce Errors',
    },
  ]
  const found = routeMap.find((route) => pathname.includes(route.key))
  if (found) return found.label
  if (params.affiliate) return 'Affiliate'
  return ''
}
export const TRACKEVENTOBJ = {
  Optimizer: {
    onTabChange: (vals) => {
      const requiredData = getRequiredData(vals)
      const { caseId } = requiredData
      return getTrackingObj(
        `${PAGE_KEYS.Optimizer}`,
        `${vals?.eventKey}`,
        `Clicked - Tab - ${vals?.eventKey}`,
        caseId,
        requiredData,
      )
    },
  },
  CCP: {
    onTabChange: (vals) => {
      const requiredData = getRequiredData(vals)
      const { caseId } = requiredData
      return getTrackingObj(
        `${PAGE_KEYS.CCP}`,
        `${vals?.eventKey}`,
        `Clicked - Tab  - ${vals?.eventKey}`,
        caseId,
        requiredData,
      )
    },
  },
  CCPTabs: {
    onBtnClick: (vals) => {
      const requiredData = getRequiredData(vals)
      const { caseId } = requiredData
      return getTrackingObj(
        `${PAGE_KEYS.CCP}`,
        `${vals?.tabName}`,
        `Clicked -  ${vals.btnName} Button - TagName: ${vals?.tagName}`,
        caseId,
        requiredData,
      )
    },
  },
  AlertStatusTable: {
    onAlertButtonClick: (vals) => {
      const requiredData = getRequiredData(vals)
      const { caseId } = requiredData
      return getTrackingObj(
        `${getScreenName(vals.pathname, vals.params)}`,
        'Workflow Alert',
        `Clicked - Alert Button - requestID ${vals?.requestID}`,
        caseId,
        requiredData,
      )
    },
  },
  AlertStatistics: {
    onMonthChange: (vals) => {
      const requiredData = getRequiredData(vals)
      const { caseId } = requiredData
      return getTrackingObj(
        PAGE_KEYS.overview,
        'Utilization Report Alert Statistics',
        `Filtered- Month DropDown - ${vals?.tagName}`,
        caseId,
        requiredData,
      )
    },
  },
  CCPTags: {
    onSearch: (vals) => {
      const requiredData = getRequiredData(vals)
      const { caseId } = requiredData
      return getTrackingObj(
        'Configurations',
        `${vals?.key} Search filter`,
        `Searched - Search input: ${vals?.value}`,
        caseId,
        requiredData,
      )
    },
    onDropDownChange: (vals) => {
      const requiredData = getRequiredData(vals)
      const { caseId } = requiredData
      return getTrackingObj(
        'Configurations',
        'Filter based on Tag Type',
        `Filtered - Tag Type - ${vals?.tagName}`,
        caseId,
        requiredData,
      )
    },
    modelNamDropDownChange: (vals) => {
      const requiredData = getRequiredData(vals)
      const { caseId } = requiredData
      return getTrackingObj(
        'Configurations',
        'Filter based on Model Name',
        `Filtered - Model name - ${vals?.modelName}`,
        caseId,
        requiredData,
      )
    },
    onBtnClick: (vals) => {
      const requiredData = getRequiredData(vals)
      const { caseId } = requiredData
      return getTrackingObj(
        'Configurations',
        `${vals?.btnName} TAGS`,
        `Clicked - ${vals?.btnName} Button`,
        caseId,
        requiredData,
      )
    },
    onEditTag: (vals) => {
      const requiredData = getRequiredData(vals)
      const { caseId } = requiredData
      return getTrackingObj(
        'Configurations',
        `${vals?.btnName} TAG`,
        `Clicked - ${vals?.btnName} Tag - ID - ${vals?.value}`,
        caseId,
        requiredData,
      )
    },
  },
  InboxWorkflow: {
    onDropDownChange: (vals) =>
      getTrackingObj(
        `${PAGE_KEYS.InboxWorkflow}`,
        'Category DropDown',
        `Filtered- Category - ${vals?.tagName}`,
      ),
    onBulkUpdateSubmit: (vals) => {
      let data = ''
      Object.entries(vals?.data || {}).forEach((item, i) => {
        const [key, value] = item
        if (value) {
          data += `${i === 0 ? '' : ','} ${key}: ${value}`
        }
      })
      return getTrackingObj(
        `${PAGE_KEYS.InboxWorkflow}`,
        'Bulk Update',
        `Clicked Submit button with ${data}`,
      )
    },
  },
  Monitoring: {
    handleSelected: (vals) => {
      const requiredData = getRequiredData(vals)
      const { caseId } = requiredData
      const axisVal = getValsBaseOnCondition(vals?.axis, `- ${vals.axis}`, '')
      return getTrackingObj(
        PAGE_KEYS.Monitoring,
        'Key Parameter',
        `Selected - ${vals?.data?.parameter} ${axisVal}`,
        caseId,
        requiredData,
      )
    },
    handleTrendSave: (vals) => {
      const requiredData = getRequiredData(vals)
      const { caseId } = requiredData
      return getTrackingObj(
        PAGE_KEYS.Monitoring,
        'Favorite trend',
        `Favorite - ${vals?.title}`,
        caseId,
        requiredData,
      )
    },
    onCheckboxClick: (vals) => {
      const requiredData = getRequiredData(vals)
      const { caseId } = requiredData
      return getTrackingObj(
        PAGE_KEYS.Monitoring,
        'Monitoring Trends Modification Functionality',
        `Clicked - Check Box - ${vals?.tagName} ${vals?.key}`,
        caseId,
        requiredData,
      )
    },
    onApplyClick: (vals) => {
      const requiredData = getRequiredData(vals)
      const { caseId } = requiredData
      return getTrackingObj(
        PAGE_KEYS.Monitoring,
        'Monitoring Trends Modification Functionality',
        `Clicked - Apply Button - ${vals?.tagName} min & Max value Update`,
        caseId,
        requiredData,
      )
    },
    onDeleteClick: (vals) => {
      const requiredData = getRequiredData(vals)
      const { caseId } = requiredData
      return getTrackingObj(
        PAGE_KEYS.Monitoring,
        'Monitoring Trends Modification Functionality',
        `Clicked - Delete Icon - ${vals?.tagName} row`,
        caseId,
        requiredData,
      )
    },
    onDropDownChange: (vals) => {
      const requiredData = getRequiredData(vals)
      const { caseId } = requiredData
      return getTrackingObj(
        PAGE_KEYS.Monitoring,
        'KEY PARAMETERS',
        `Filtered - Key Parameters ${vals?.key} - ${vals?.value}`,
        caseId,
        requiredData,
      )
    },
  },
  performanceTracker: {
    onTabChange: (vals, eventKey) => {
      const requiredData = getRequiredData(vals)
      const { caseId } = requiredData
      return getTrackingObj(
        'App Monitoring Performance Tracker',
        `${eventKey}`,
        `Clicked - Tab - ${eventKey} `,
        caseId,
        requiredData,
      )
    },
  },
  corporate: {
    numberCircle: (vals, obj) => {
      const requiredData = getRequiredData(vals)
      const { caseId } = requiredData
      return getTrackingObj(
        PAGE_KEYS.corporate,
        'Corporate',
        `Clicked - ${obj.regionName} Region`,
        caseId,
        requiredData,
      )
    },
    handleClickRegion: (vals, activeRegion) => {
      const requiredData = getRequiredData(vals)
      const { caseId } = requiredData
      return getTrackingObj(
        PAGE_KEYS.corporate,
        'Corporate',
        `Navigated to  Affiliate List of - ${activeRegion} Region via preview`,
        caseId,
        requiredData,
      )
    },
    onLogin: () => {
      return getTrackingObj(
        PAGE_KEYS.corporate,
        'Login',
        'Logged Into portal.',
        null,
        null,
        null,
      )
    },
    onForcedLogin: () => {
      return getTrackingObj(
        PAGE_KEYS.corporate,
        'Forced Login',
        'Logged Into portal.',
        null,
        null,
        null,
      )
    },
  },
  addUser: {
    onAddClick: (pageKey, title, selectedUsersNames) =>
      getTrackingObj(
        `${PAGE_KEYS.UserManagement} ${pageKey}`,
        'Add User',
        `Clicked - Add User - ${selectedUsersNames}`,
      ),
  },
  workflowConfiguration: {
    handleSubmit: () => {
      return getTrackingObj(
        'User Management Features',
        'Submit Workflow Configuration Workflow Tab',
        'Clicked - Submit Button - Workflow Configuration',
      )
    },
  },
  addUserWorkflow: {
    onAddClick: (selectedRoleForUser, selectedUsersNames, pageKey) =>
      getTrackingObj(
        `User Management ${pageKey}`,
        `Add Workflow User ${selectedRoleForUser?.toUpperCase()}`,
        `Clicked - Submit Button - ${selectedUsersNames}`,
      ),
    onBusinessUserBtnClick: () =>
      getTrackingObj(
        'User Management Features',
        'Add Business User Mailing List (Business Users) page',
        'Clicked - Add Business User Button',
      ),
    onReturnBackClick: () =>
      getTrackingObj(
        'User Management Features',
        'Add Workflow User Mailing List (Escalation) page',
        'Clicked - Return Back Button',
      ),
  },
  UserManagement: {
    onDropDownChange: (vals) =>
      getTrackingObj(
        `${PAGE_KEYS.UserManagement} ${vals?.pageKey}`,
        `${vals?.dropDownName} Dropdown`,
        `Filtered - ${vals?.dropDownName} - ${vals?.selectedValue}`,
      ),
    onTabChange: (vals) =>
      getTrackingObj(
        `${PAGE_KEYS.UserManagement} ${vals?.pageKey}`,
        `${vals?.tabName}`,
        `Clicked - Tab - ${vals?.tabName}`,
      ),
    onDeleteClick: (vals) => {
      return getTrackingObj(
        `${PAGE_KEYS.UserManagement} ${vals?.pageKey}`,
        `Delete User in ${vals?.userData.role}`,
        `Clicked - Delete Icon - User ${vals?.userData.employeeName} Deleted`,
      )
    },
    onUserDeleteAdminCorporate: (vals) =>
      getTrackingObj(
        `${PAGE_KEYS.UserManagement} ${vals?.pageKey}`,
        `Users Configurations - role - ${vals?.role?.toUpperCase()}`,
        `Clicked - Delete Icon - User - ${vals?.employeeName} - Deleted`,
      ),
    onUserDeleteFeature: (vals) =>
      getTrackingObj(
        `${PAGE_KEYS.UserManagement} ${vals?.pageKey}`,
        `Users Configurations - role - ${vals?.role?.toUpperCase()}`,
        `Clicked - Delete Icon - User - ${vals?.employeeName} - Deleted`,
      ),
    onUserDelete: (vals) =>
      getTrackingObj(
        `${PAGE_KEYS.UserManagement} ${vals?.pageKey}`,
        `Users Configurations - role - ${vals?.userData.role?.toUpperCase()}`,
        `Clicked - Delete Icon - User - ${vals?.userData.employeeName} - Deleted`,
      ),
    // onADDUsersClick: (vals) => {
    //   return getTrackingObj(
    //     `${PAGE_KEYS.UserManagement} ${vals?.pageKey}`,
    //     `Modify ${vals?.role}`,
    //     `Clicked - Add Users Button - Open Add User Modal `
    //   );
    // },
    // onEditIconClick: (vals) => {
    //   return getTrackingObj(
    //     `${PAGE_KEYS.UserManagement} ${vals?.pageKey}`,
    //     "Modify Process Manager",
    //     `Clicked - Edit Icon - Open Modify User Modal`
    //   );
    // },
  },
  breadcrumb: {
    linkOnClick: (key, val, vals) => {
      const requiredData = getRequiredData(vals)
      const { caseId } = requiredData
      return getTrackingObj(
        `${getScreenName(vals.pathname, vals.params)}`,
        'BreadCrumb Navigations',
        `Clicked - BreadCrumb - ${key}-${val}`,
        caseId,
        requiredData,
      )
    },
  },
  footer: {
    handleTimeZone: (vals) => {
      const requiredData = getRequiredData(vals)
      const { caseId } = requiredData
      return getTrackingObj(
        `${getScreenName(vals.location.href, vals.params)}`,
        'Timezone changed',
        `Clicked - Submit Button - Apply Timezone: ${vals?.selectedTimeZone || ''} `,
        caseId,
        requiredData,
      )
    },
  },
  header: {
    backOnClick: (vals) => {
      const requiredData = getRequiredData(vals)
      const { caseId } = requiredData
      return getTrackingObj(
        `${getScreenName(vals.pathname, vals.params)}`,
        'Header Navigations',
        'Clicked - inbox workflow Back Arrow icon',
        caseId,
        requiredData,
      )
    },
    inboxWorkflowOnClick: (vals) => {
      const requiredData = getRequiredData(vals)
      const { caseId } = requiredData
      return getTrackingObj(
        `${getScreenName(vals.pathname, vals.params)}`,
        'Header Navigations',
        'Clicked - inbox workflow icon',
        caseId,
        requiredData,
      )
    },
    helpOnClick: (vals) => {
      const requiredData = getRequiredData(vals)
      const { caseId } = requiredData
      return getTrackingObj(
        `${getScreenName(vals.pathname, vals.params)}`,
        'Header Navigations',
        'Clicked - Help icon',
        caseId,
        requiredData,
      )
    },
    adminOnClick: (vals) => {
      const requiredData = getRequiredData(vals)
      const { caseId } = requiredData
      return getTrackingObj(
        `${getScreenName(vals.pathname, vals.params)}`,
        'Header Navigations',
        'Clicked - Admin icon',
        caseId,
        requiredData,
      )
    },
    adminBackOnClick: (vals) => {
      const requiredData = getRequiredData(vals)
      const { caseId } = requiredData
      return getTrackingObj(
        `${getScreenName(vals.pathname, vals.params)}`,
        'Header Navigations',
        'Clicked - Admin Back Arrow icon',
        caseId,
        requiredData,
      )
    },
    logoutOnClick: (vals) => {
      const requiredData = getRequiredData(vals)
      const { caseId } = requiredData
      return getTrackingObj(
        `${getScreenName(vals.pathname, vals.params)}`,
        'Header Navigations',
        'Clicked- logout icon',
        caseId,
        requiredData,
      )
    },
  },
  searchBar: {
    handleSearch: (pageKey, title, selectedData) =>
      getTrackingObj(
        `User Management ${pageKey}`,
        'Searching Interface Users',
        `Clicked - Search Result List - ${selectedData.employeeID} ${selectedData.employeeName} `,
      ),
  },
  favoriteTrends: {
    favTrendOnClick: (item, vals) => {
      const requiredData = getRequiredData(vals)
      const { caseId } = requiredData
      return getTrackingObj(
        `${getScreenName(vals?.location.pathname)}`,
        'Sidebar Navigations',
        `Clicked - Sidebar - Favorite List- ${item?.subTitle} ${item.title}`,
        caseId,
        requiredData,
      )
    },
  },
  overview: {
    modelWarningClick: (vals) => {
      const requiredData = getRequiredData(vals)
      const { caseId } = requiredData
      return getTrackingObj(
        `${PAGE_KEYS.overview}`,
        'Model Warning Details',
        'Clicked on Model Warning Details',
        caseId,
        requiredData,
      )
    },
    sopForGridTransitionClick: (vals) => {
      const requiredData = getRequiredData(vals)
      const { caseId } = requiredData
      return getTrackingObj(
        `${PAGE_KEYS.overview}`,
        'Sop For Grid Transition',
        'Clicked on Sop For Grid Transition',
        caseId,
        requiredData,
      )
    },
    modelSkipDateClick: (vals) => {
      const requiredData = getRequiredData(vals)
      const { caseId } = requiredData
      return getTrackingObj(
        `${getScreenName(vals?.location.pathname)}`,
        'Model Offline Details',
        `Changed ${vals?.key} Date - ${vals?.date}`,
        caseId,
        requiredData,
      )
    },
    resetBtnOnClick: (vals) => {
      const requiredData = getRequiredData(vals)
      const { caseId } = requiredData
      return getTrackingObj(
        `${getScreenName(vals?.location.pathname)}`,
        'Reset Dashboard',
        'Clicked on Reset Icon to reset dashboard to latest runtime',
        caseId,
        requiredData,
      )
    },
    onTabChange: (vals) => {
      const requiredData = getRequiredData(vals)
      const { caseId } = requiredData
      return getTrackingObj(
        vals?.activeTab.toLowerCase() === 'overview'
          ? getScreenName(vals?.location.pathname, vals.params)
          : vals?.activeTab,
        `${vals?.label} Tab`,
        `Clicked - Tab - ${vals?.label}`,
        caseId,
        requiredData,
      )
    },
  },
  cardAction: {
    detailsModalOnClick: (data, vals) => {
      const requiredData = getRequiredData(vals)
      const { caseId } = requiredData
      return getTrackingObj(
        PAGE_KEYS.overview,
        vals.calledBy === 'CardTopTiles'
          ? 'System Top Tiles: Details'
          : 'KPI cards: Details',
        `Clicked - ${data.kpi1_line1 ?? data.kpi1_line2 ?? data.kpi2_line1 ?? data.kpi2_line2 ?? data.tagNameAlias ?? data.displayName ?? data.displayName2 ?? data.tagName ?? data.tagName2} - Detail Button `,
        caseId,
        requiredData,
      )
    },
    causeModalOnClick: (data, vals) => {
      const requiredData = getRequiredData(vals)
      const { caseId } = requiredData
      return getTrackingObj(
        PAGE_KEYS.overview,
        vals.calledBy === 'CardTopTiles'
          ? 'System Top Tiles: Actionables'
          : 'KPI cards: Actionables',
        `Clicked - ${data.kpi1_line1 ?? data.kpi1_line2 ?? data.kpi2_line1 ?? data.kpi2_line2 ?? data.tagNameAlias ?? data.displayName ?? data.displayName2 ?? data.tagName ?? data.tagName2} - ODS Action Button `,
        caseId,
        requiredData,
      )
    },
    trendModalOnClick: (data, vals) => {
      const requiredData = getRequiredData(vals)
      const { caseId } = requiredData
      return getTrackingObj(
        PAGE_KEYS.overview,
        vals.calledBy === 'CardTopTiles'
          ? 'System Top Tiles: Trends'
          : 'KPI cards: Trends',
        `Clicked - ${data.kpi1_line1 ?? data.kpi1_line2 ?? data.kpi2_line1 ?? data.kpi2_line2 ?? data.tagNameAlias ?? data.displayName ?? data.displayName2 ?? data.tagName ?? data.tagName2} - Trend Button `,
        caseId,
        requiredData,
      )
    },
  },
  cardTopTiles: {
    categoryOnClick: (data, vals) => {
      const requiredData = getRequiredData(vals)
      const { caseId } = requiredData
      return getTrackingObj(
        PAGE_KEYS.overview,
        'System Top Tiles',
        `Clicked - System Top Tiles Category - ${data.category} `,
        caseId,
        requiredData,
      )
    },
  },
  landingPagesTopKpi: {
    enrolledAffiliateClick: (vals) => {
      const requiredData = getRequiredData(vals)
      const { caseId } = requiredData
      return getTrackingObj(
        PAGE_KEYS.sabic,
        'Enrolled Affiliates Top Tile',
        'Clicked - Enrolled Affiliates Tiles to navigate to Affiliate Page',
        caseId,
        requiredData,
      )
    },
  },
  adminTableUpdateModal: {
    adminTableUpdatedOnClick: (vals) => {
      const requiredData = getRequiredData(vals)
      const { caseId } = requiredData
      return getTrackingObj(
        `${getScreenName(vals.location.href, vals.params)}`,
        'Admin Table Update Modal changed updated',
        'Clicked - Update Button - Admin Table Updated',
        caseId,
        requiredData,
      )
    },
  },
  ODSAlertModal: {
    yesConfirmationModal: (calledFrom, vals) => {
      const requiredData = getRequiredData(vals)
      const { caseId } = requiredData
      let data = ''
      let extraData = ''
      Object.entries(vals?.data || {}).forEach((item, i) => {
        const [key, value] = item
        if (key === 'suggestions' && value) {
          value.forEach((item, i) => {
            Object.entries(item).forEach((obj) => {
              const [key, value] = obj
              extraData += `${i === 0 ? '' : ','} ${key}: ${value}`
            })
          })
        }
        if (value && key !== 'suggestions') {
          data += `${i === 0 ? '' : ','} ${key}: ${value}`
        }
      })
      return getTrackingObj(
        `${calledFrom}`,
        'Workflow Alert',
        `Clicked Submit button with ${data} ${extraData}`,
        caseId,
        requiredData,
      )
    },
    WorkflowHistoricLogsModal: (vals) => {
      const requiredData = getRequiredData(vals)
      const { caseId } = requiredData
      return getTrackingObj(
        `${vals?.screenName ? vals.screenName : getScreenName(vals?.location.href, vals.params)}`,
        'Workflow Historic Logs',
        'Clicked - Historic Logs Button - Open Workflow Historic Logs Modal',
        caseId,
        requiredData,
      )
    },
  },
  dashboardStatusLegend: {
    onDateChange: (vals) => {
      const requiredData = getRequiredData(vals)
      const { caseId } = requiredData
      return getTrackingObj(
        `${getScreenName(vals?.location.hash)}`,
        'Dashboard Calendar Date and Time Change',
        `Changed Date - ${vals?.date}`,
        caseId,
        requiredData,
      )
    },
    alertIconOnClick: (vals) => {
      const requiredData = getRequiredData(vals)
      const { caseId } = requiredData
      return getTrackingObj(
        PAGE_KEYS.overview,
        'Infrastructure detail',
        'Clicked - flashing alert icon',
        caseId,
        requiredData,
      )
    },
    timeInfoIconOnClick: (vals) => {
      const requiredData = getRequiredData(vals)
      const { caseId } = requiredData
      return getTrackingObj(
        `${getScreenName(vals?.location.hash)}`,
        'Optimum Time Detail',
        'Clicked - Optimum Time Detail icon',
        caseId,
        requiredData,
      )
    },
    modelAlertOnClick: (vals) => {
      const requiredData = getRequiredData(vals)
      const { caseId } = requiredData
      return getTrackingObj(
        `${getScreenName(vals?.location.hash)}`,
        'Model Alert',
        'Clicked - Model Alert',
        caseId,
        requiredData,
      )
    },
    calenderIconOnClick: (vals) => {
      const requiredData = getRequiredData(vals)
      const { caseId } = requiredData
      return getTrackingObj(
        PAGE_KEYS.overview,
        'Dashboard Calendar Date and Time Change',
        'Clicked - Calender icon',
        caseId,
        requiredData,
      )
    },
    modelSkipOnClick: (vals) => {
      const requiredData = getRequiredData(vals)
      const { caseId } = requiredData
      return getTrackingObj(
        `${getScreenName(vals?.location.hash)}`,
        'Model Offline Details',
        'Clicked - Bell icon',
        caseId,
        requiredData,
      )
    },
  },
  DateRangeContainer: {
    handleStartDateChange: (
      screenName,
      functionalityName,
      date,
      isTrend,
      vals,
    ) => {
      const requiredData = getRequiredData(vals)
      const { caseId } = requiredData
      return getTrackingObj(
        screenName,
        functionalityName,
        `Clicked - change start date - ${moment(date)?.format('YYYY - MM - DD')} ${isTrend ? 'for trend' : ''}`,
        caseId,
        requiredData,
      )
    },
    handleEndDateChange: (
      screenName,
      functionalityName,
      date,
      isTrend,
      vals,
    ) => {
      const requiredData = getRequiredData(vals)
      const { caseId } = requiredData
      return getTrackingObj(
        screenName,
        functionalityName,
        `Clicked - change end date - ${moment(date)?.format('YYYY - MM - DD')} ${isTrend ? 'for trend' : ''}`,
        caseId,
        requiredData,
      )
    },
  },
  HealthCheck: {
    onTrendClick: (vals) =>
      getTrackingObj(
        `Data Science ${PAGE_KEYS.HealthCheck}`,
        'PI Status Check',
        `Clicked Trend Icon of ${vals?.affiliateName} - ${vals?.plantName} - ${vals?.systemName} - ${vals.piTag} `,
      ),
    onAffiliateChange: (vals) =>
      getTrackingObj(
        `Data Science ${PAGE_KEYS.HealthCheck}`,
        'Affliate Dropdown',
        `Filtered - Affiliate - ${vals?.displayName}`,
      ),
  },
  healthStatusInfo: {
    showTrend: () =>
      getTrackingObj(
        'Data Science Health Check',
        `AI hub Job agent  - Trend `,
        `Clicked Trend Icon of Ai Hub Job agent `,
      ),
    AIHubTrend: () =>
      getTrackingObj(
        'Data Science Health Check',
        `AIHUB SERVER STATUS  - Trend `,
        `Clicked Trend Icon of AIHUB SERVER STATUS `,
      ),
    PIConnectivityTrend: () =>
      getTrackingObj(
        'Data Science Health Check',
        `PI API CONNECTIVITY  - Trend `,
        `Clicked Trend Icon of PI API CONNECTIVITY `,
      ),
  },
  sustainabilityScorecard: {
    onSelectTab: (screenName, eventKey, vals) => {
      const requiredData = getRequiredData(vals)
      const { caseId } = requiredData
      return getTrackingObj(
        screenName,
        'Sustainability Scorecard',
        `Filtered - Sustainability Scorecard - ${eventKey} `,
        caseId,
        requiredData,
      )
    },
  },
  contributorsInsightTable: {
    onSelectChange: (val, vals) => {
      const requiredData = getRequiredData(vals)
      const { caseId } = requiredData
      return getTrackingObj(
        'OverView',
        'Key Trend',
        `Filtered - Key Trend - ${val.display_name} `,
        caseId,
        requiredData,
      )
    },
    onSelectTrendTab: (eventKey, vals) => {
      const requiredData = getRequiredData(vals)
      const { caseId } = requiredData
      return getTrackingObj(
        'OverView',
        eventKey === 'contributorTable' ? 'contributor Table' : 'Key Trend',
        `Clicked - Tab - ${eventKey === 'contributorTable' ? 'contributor Table' : 'Key Trend'} `,
        caseId,
        requiredData,
      )
    },
    keyTrendExpand: (vals) => {
      const requiredData = getRequiredData(vals)
      const { caseId } = requiredData
      return getTrackingObj(
        'OverView',
        'Key Trend',
        'Expand - Key Trend ',
        caseId,
        requiredData,
      )
    },
  },
  sortingModal: {
    applyKPISorting: (vals) => {
      const requiredData = getRequiredData(vals)
      const { caseId } = requiredData
      return getTrackingObj(
        `${PAGE_KEYS.overview}`,
        'KPI Sorting',
        `Changed - KPI Sorting of ${vals?.type} KPIS`,
        caseId,
        requiredData,
      )
    },
  },
  monitoringTable: {
    handleTooltipModal: (vals, row) => {
      const requiredData = getRequiredData(vals)
      const { caseId } = requiredData
      return getTrackingObj(
        'MONITORING',
        'MONITORING TABLE',
        `Clicked - Tooltip - ${row[10]}`,
        caseId,
        requiredData,
      )
    },
  },
  table: {
    handleTooltipModal: (vals, category, row) => {
      const requiredData = getRequiredData(vals)
      const { caseId } = requiredData
      return getTrackingObj(
        'Overview',
        'CONTRIBUTOR table',
        `Clicked Details - CONTRIBUTORS ${category} KPI - ${row[7]} `,
        caseId,
        requiredData,
      )
    },
  },
  CollapsibleTable: {
    handleImgCellClick: (vals, screen, row) => {
      const requiredData = getRequiredData(vals)
      const { caseId } = requiredData
      return getTrackingObj(
        `${screen}`,
        `${screen} list`,
        `Expanded/Collapsed - ${screen} - ${row?.data?.affiliateName} `,
        caseId,
        requiredData,
      )
    },
    handleImgPlusClick: (vals, screen, row) => {
      const requiredData = getRequiredData(vals)
      const { caseId } = requiredData
      return getTrackingObj(
        `${screen}`,
        `${screen} list`,
        `Clicked Expand Icon- ${screen} List row- ${row?.data?.plantName} `,
        caseId,
        requiredData,
      )
    },
    handleTrendOpportunityPlant: (vals, row, isExpanded, source) => {
      const requiredData = getRequiredData(vals)
      const { caseId } = requiredData
      const screenName = getScreenName(vals?.location?.pathname, vals?.params)
      return getTrackingObj(
        screenName,
        `${getValsBaseOnCondition(isExpanded, 'Plant Details', source + ' list')}`,
        `Open Trend Chart for - ${getValsBaseOnCondition(isExpanded, 'Plant Details', source + ' list')} sub menu of ${getValsBaseOnCondition(source === 'plant', row?.data?.plantName, row?.data?.affiliateName)} - ${getValsBaseOnCondition(source === 'plant', row?.data?.systemName, row?.data?.plantName)} `,
        caseId,
        requiredData,
      )
    },
    handleTrendOpportunity: (vals, row) => {
      const requiredData = getRequiredData(vals)
      const { caseId } = requiredData
      return getTrackingObj(
        'Affiliate',
        'Affiliate List',
        `Opened Trend Chart for - ${row?.data?.affiliateName} `,
        caseId,
        requiredData,
      )
    },
    generateUrlCell: (vals, isExpanded, source, row) => {
      const requiredData = getRequiredData(vals)
      const { caseId } = requiredData
      const screenName = getScreenName(vals?.location?.pathname, vals?.params)
      return getTrackingObj(
        screenName,
        `${isExpanded ? 'Plant Details' : source} `,
        `Clicked to Navigate overview page of ${source === 'affiliate' ? row?.data?.affiliateName : row?.data?.systemName} `,
        caseId,
        requiredData,
      )
    },
    handlePlantTrendOpportunity: (vals, isExpanded, source, row) => {
      const requiredData = getRequiredData(vals)
      const { caseId } = requiredData
      const screenName = getScreenName(vals?.location?.pathname, vals?.params)
      return getTrackingObj(
        screenName,
        `${isExpanded ? 'Plant Details' : 'PLANTS LIST'}`,
        `Opened Trend Chart- ${isExpanded ? 'Plant Details' : source + ' list'}- ${row?.data?.plantName} `,
        caseId,
        requiredData,
      )
    },
    handleSorting: (vals, screen, obj) => {
      const requiredData = getRequiredData(vals)
      const { caseId } = requiredData
      return getTrackingObj(
        `${screen}`,
        'Sorting Table',
        `Sorted -  ${screen} by - ${obj?.title} `,
        caseId,
        requiredData,
      )
    },
  },
  ODS: {
    handleStartDateChange: (vals, date) => {
      const requiredData = getRequiredData(vals)
      const { caseId } = requiredData
      return getTrackingObj(
        `${vals.tabName}`,
        'Start Date Change',
        `Clicked - Start Date - ${moment(date)?.format('YYYY-MM-DD')}`,
        caseId,
        requiredData,
      )
    },
    handleEndDateChange: (vals, date) => {
      const requiredData = getRequiredData(vals)
      const { caseId } = requiredData
      return getTrackingObj(
        `${vals.tabName}`,
        'End Date Change',
        `Clicked - End Date - ${moment(date)?.format('YYYY-MM-DD')}`,
        caseId,
        requiredData,
      )
    },
    handleTrendIconClick: (vals, requestID) => {
      const requiredData = getRequiredData(vals)
      const { caseId } = requiredData
      const screenName = getScreenName(vals?.pathname)
      return getTrackingObj(
        `${vals.tabName || screenName}`,
        'ODS cause trend',
        `Clicked - ODS cause trend - requestID: ${requestID} - cause: ${vals?.causeData?.causeMessage} `,
        caseId,
        requiredData,
      )
    },
    handleAlertManageModal: (vals, obj) => {
      const requiredData = getRequiredData(vals)
      const { caseId } = requiredData
      const screenName = getScreenName(vals?.pathname, vals?.params)
      return getTrackingObj(
        `${vals?.tabName ? vals.tabName : screenName}`,
        'Workflow Alert',
        `Clicked -  Workflow Alert - requestId : ${obj?.requestID} - cause : ${obj.causeMessage}`,
        caseId,
        requiredData,
      )
    },
    handleSystemChange: (vals, pos) => {
      const requiredData = getRequiredData(vals)
      const { caseId } = requiredData
      return getTrackingObj(
        'Alert Management',
        'System DropDown',
        `Filtered - System - ${pos?.tag_name} `,
        caseId,
        requiredData,
      )
    },
    handleCategoryChange: (vals, pos) => {
      const requiredData = getRequiredData(vals)
      const { caseId } = requiredData
      return getTrackingObj(
        'Alert Management',
        'Category DropDown',
        `Filtered - Category - ${pos?.tag_name} `,
        caseId,
        requiredData,
      )
    },
    handleDeviationChange: (vals, pos) => {
      const { caseId } = getRequiredData(vals)
      return getTrackingObj(
        'Alert Management',
        'Deviation Status DropDown',
        `Filtered - Devation Status - ${pos?.tag_name} `,
        caseId,
      )
    },
  },
  overviewODSTable: {
    handleAlertManageModal: (vals, obj) => {
      const requiredData = getRequiredData(vals)
      const { caseId } = requiredData
      return getTrackingObj(
        `${PAGE_KEYS.overview}`,
        'Workflow Alert',
        `Clicked -  Workflow Alert - requestId : ${obj?.requestID} - cause : ${obj.causeMessage}`,
        caseId,
        requiredData,
      )
    },
  },
  serverSideTable: {
    onCellChange: (field, calledBy, value, vals) => {
      return getTrackingObj(
        `${getScreenName(vals.location.href, vals.params)}`,
        'Filtering Logs',
        `Searched - ${calledBy} - ${field} column - ${value}`,
      )
    },
    columnOnClick: (calledBy, rowdata, vals) => {
      return getTrackingObj(
        `${getScreenName(vals.location.href, vals.params)}`,
        'Edit Action',
        `Clicked - ${calledBy} Edit Button - SessionID: ${rowdata?.sessionID}`,
      )
    },
    // cellExpandClick: (calledBy, colName, rowdata) => {
    //   return getTrackingObj(
    //     `${calledBy}`,
    //     `${colName.title} Expand Icon `,
    //     `Clicked - Expand Button - SessionID: ${rowdata?.sessionID}`
    //   );
    // },
    onSessionIdClick: (calledBy, result, vals) => {
      return getTrackingObj(
        `${getScreenName(vals.location.href, vals.params)}`,
        'SessionId',
        `Clicked - ${calledBy} SessionId - ${result}`,
      )
    },
  },
  RootLayout: {
    timeseriesPlots: (vals) => {
      const requiredData = getRequiredData(vals)
      const { caseId } = requiredData
      return getTrackingObj(
        'Monitoring',
        'Plot Type Change',
        'Clicked -Timeseries Plots Button',
        caseId,
        requiredData,
        true,
      )
    },
    monitoringXYClick: (vals) => {
      const requiredData = getRequiredData(vals)
      const { caseId } = requiredData
      return getTrackingObj(
        'Monitoring',
        'Plot Type Change',
        'Clicked -XY Plots Button',
        caseId,
        requiredData,
        true,
      )
    },
  },
  ActivityTrackerTab: {
    onSelectTab: (vals, eventKey) => {
      const requiredData = getRequiredData(vals)
      const { caseId } = requiredData
      return getTrackingObj(
        'App Monitoring Activity Tracker',
        `${eventKey}`,
        `Clicked - Tab - ${eventKey} `,
        caseId,
        requiredData,
      )
    },
  },
  affiliates: {
    onRegionChange: (vals, clickedOption) => {
      const requiredData = getRequiredData(vals)
      const { caseId } = requiredData
      return getTrackingObj(
        'Affiliate',
        'Affiliates',
        `Filtered - Region - ${clickedOption.display_name} `,
        caseId,
        requiredData,
      )
    },
    onAffiliateChange: (vals, clickedOption) => {
      const requiredData = getRequiredData(vals)
      const { caseId } = requiredData
      return getTrackingObj(
        'Affiliate',
        'Affiliates',
        `Filtered - Affiliate - ${clickedOption.display_name} `,
        caseId,
        requiredData,
      )
    },
  },
  SingleSelectAffiliateDropDowns: {
    handleAffiliateChange: (vals, pageKey, title, selectedAffiliate) => {
      const requiredData = getRequiredData(vals)
      const { caseId } = requiredData
      return getTrackingObj(
        `${vals?.section} ${pageKey}`,
        'Affiliate Dropdown',
        `Filtered - Affiliate - ${selectedAffiliate.affiliate} `,
        caseId,
        requiredData,
      )
    },
    handlePlantChange: (vals, pageKey, title, selectedPlant) => {
      const requiredData = getRequiredData(vals)
      const { caseId } = requiredData
      return getTrackingObj(
        `${vals?.section} ${pageKey}`,
        'Plant Dropdown',
        `Filtered - Plant - ${selectedPlant.plant}`,
        caseId,
        requiredData,
      )
    },
    handleSystemChange: (vals, pageKey, title, selectedSystem) => {
      const requiredData = getRequiredData(vals)
      const { caseId } = requiredData
      return getTrackingObj(
        `${vals?.section} ${pageKey}`,
        'System Dropdown',
        `Filtered - System - ${selectedSystem.system} `,
        caseId,
        requiredData,
      )
    },
  },
  sidebar: {
    DashboardBtnClick: (vals) => {
      const requiredData = getRequiredData(vals)
      const { caseId } = requiredData
      return getTrackingObj(
        `${getScreenName(vals.pathname, vals.params)}`,
        'Sidebar Navigations',
        'Clicked - Sidebar - Dashboard Button',
        caseId,
        requiredData,
      )
    },
    HealthCheckBtnClick: (vals) => {
      const requiredData = getRequiredData(vals)
      const { caseId } = requiredData
      return getTrackingObj(
        `${getScreenName(vals.pathname, vals.params)}`,
        'Sidebar Navigations',
        `Clicked - Sidebar - Health Check Button`,
        caseId,
        requiredData,
      )
    },
    FeaturesBtnClick: (vals) => {
      const requiredData = getRequiredData(vals)
      const { caseId } = requiredData
      return getTrackingObj(
        `${getScreenName(vals.pathname, vals.params)}`,
        'Sidebar Navigations',
        'Clicked - Sidebar - Features Button',
        caseId,
        requiredData,
      )
    },
    ErrorLoggingBtnClick: (vals) => {
      const requiredData = getRequiredData(vals)
      const { caseId } = requiredData
      return getTrackingObj(
        `${getScreenName(vals.pathname, vals.params)}`,
        'Sidebar Navigations',
        'Clicked - Sidebar - Error Logging Button',
        caseId,
        requiredData,
      )
    },
    ActivityTrackerBtnClick: (vals) => {
      const requiredData = getRequiredData(vals)
      const { caseId } = requiredData
      return getTrackingObj(
        `${getScreenName(vals.pathname, vals.params)}`,
        'Sidebar Navigations',
        'Clicked - Sidebar - Activity Tracker Button',
        caseId,
        requiredData,
      )
    },
    PerformanceTrackerBtnClick: (vals) => {
      const requiredData = getRequiredData(vals)
      const { caseId } = requiredData
      return getTrackingObj(
        `${getScreenName(vals.pathname, vals.params)}`,
        'Sidebar Navigations',
        'Clicked - Sidebar - Performance Tracker Button',
        caseId,
        requiredData,
      )
    },
    WorkflowInstanceErrorBtnClick: (vals) => {
      const requiredData = getRequiredData(vals)
      const { caseId } = requiredData
      return getTrackingObj(
        `${getScreenName(vals.pathname, vals.params)}`,
        'Sidebar Navigations',
        'Clicked - Sidebar - WORKFLOW INSTANCE ERRORS Button',
        caseId,
        requiredData,
      )
    },
    WorkflowBtnClick: (vals) => {
      const requiredData = getRequiredData(vals)
      const { caseId } = requiredData
      return getTrackingObj(
        `${getScreenName(vals.pathname, vals.params)}`,
        'Sidebar Navigations',
        'Clicked - Sidebar -  Workflow Button',
        caseId,
        requiredData,
      )
    },
    FavoriteListItemClick: (vals, item) => {
      const requiredData = getRequiredData(vals)
      const { caseId } = requiredData
      return getTrackingObj(
        `${getScreenName(vals.pathname, vals.params)}`,
        'Sidebar Navigations',
        `Clicked - Sidebar - Favorite List-${item.title}`,
        caseId,
        requiredData,
      )
    },
    SabicBtnClick: (vals) => {
      const requiredData = getRequiredData(vals)
      const { caseId } = requiredData
      return getTrackingObj(
        `${getScreenName(vals.pathname, vals.params)}`,
        'Sidebar Navigations',
        'Clicked - Sidebar -  Sabic Button',
        caseId,
        requiredData,
      )
    },
    AffiliatesBtnClick: (vals) => {
      const requiredData = getRequiredData(vals)
      const { caseId } = requiredData
      return getTrackingObj(
        `${getScreenName(vals.pathname, vals.params)}`,
        'Sidebar Navigations',
        'Clicked - Sidebar -  Affiliates Button',
        caseId,
        requiredData,
      )
    },
    SubmenuAffiliateClick: (vals, affiliate) => {
      const requiredData = getRequiredData(vals)
      const { caseId } = requiredData
      return getTrackingObj(
        `${getScreenName(vals.pathname, vals.params)}`,
        'Sidebar Navigations',
        `Clicked - Quick Access Submenu - ${affiliate.name}`,
        caseId,
        requiredData,
      )
    },
    SubmenuPlantClick: (vals, affiliate, plant) => {
      const requiredData = getRequiredData(vals)
      const { caseId } = requiredData
      return getTrackingObj(
        `${getScreenName(vals.pathname, vals.params)}`,
        'Sidebar Navigations',
        `Clicked - Quick Access Submenu - ${affiliate.name} - ${plant.name}`,
        caseId,
        requiredData,
      )
    },
    SubmenuSystemClick: (vals, affiliate, plant, system) => {
      const requiredData = getRequiredData(vals)
      const { caseId } = requiredData
      return getTrackingObj(
        `${getScreenName(vals.pathname, vals.params)}`,
        'Sidebar Navigations',
        `Clicked - Quick Access Submenu - ${affiliate.name} - ${plant.name} - ${system.name} - Overview`,
        caseId,
        requiredData,
      )
    },
    PlantsListClick: (vals, obj) => {
      const requiredData = getRequiredData(vals)
      const { caseId, affiliate } = requiredData
      return getTrackingObj(
        `${getScreenName(vals.pathname, vals.params)}`,
        'Sidebar Navigations',
        `Clicked -  ${affiliate} Plants list ${obj}`,
        caseId,
        requiredData,
      )
    },
    PlantDetailsClick: (vals, affiliate, plant) => {
      const requiredData = getRequiredData(vals)
      const { caseId } = requiredData
      return getTrackingObj(
        `${getScreenName(vals.pathname, vals.params)}`,
        'Sidebar Navigations',
        `Clicked - Quick Access Submenu - ${affiliate.name} - ${plant.name} - Plant Details`,
        caseId,
        requiredData,
      )
    },
    SystemOverviewClick: (vals, affiliate, plant, system) => {
      const requiredData = getRequiredData(vals)
      const { caseId } = requiredData
      return getTrackingObj(
        `${getScreenName(vals.pathname, vals.params)}`,
        'Sidebar Navigations',
        `Clicked - Quick Access Submenu - ${affiliate.name} - ${plant.name} - ${system.name} - Overview`,
        caseId,
        requiredData,
      )
    },
    PlantBtnClick: (vals) => {
      const requiredData = getRequiredData(vals)
      const { caseId } = requiredData
      return getTrackingObj(
        `${getScreenName(vals.pathname, vals.params)}`,
        'Sidebar Navigations',
        'Clicked - Sidebar - Plants Button',
        caseId,
        requiredData,
      )
    },
    PlantOptionsClick: (vals) => {
      const requiredData = getRequiredData(vals)
      const { caseId } = requiredData
      return getTrackingObj(
        `${getScreenName(vals.pathname, vals.params)}`,
        'Sidebar Navigations',
        'Clicked - Plant Options',
        caseId,
        requiredData,
      )
    },
    DownloadBtnClick: (vals) => {
      const requiredData = getRequiredData(vals)
      const { caseId } = requiredData
      return getTrackingObj(
        `${getScreenName(vals.pathname, vals.params)}`,
        'Download Data',
        'Clicked - Sidebar - Download Button ',
        caseId,
        requiredData,
      )
    },
    plantlevelClick: (vals) => {
      const requiredData = getRequiredData(vals)
      const { caseId } = requiredData
      return getTrackingObj(
        `${getScreenName(vals.location.href, vals.params)}`,
        'Download Data',
        'Clicked on Download Button - Plant Level',
        caseId,
        requiredData,
      )
    },
    caselevelClick: (vals) => {
      const requiredData = getRequiredData(vals)
      const { caseId } = requiredData
      return getTrackingObj(
        `${getScreenName(vals.location.href, vals.params)}`,
        'Download Data',
        'Clicked on Download Button - Case Level',
        caseId,
        requiredData,
      )
    },
    OverviewClick: (vals) => {
      const requiredData = getRequiredData(vals)
      const { caseId } = requiredData
      return getTrackingObj(
        `${getScreenName(vals.pathname, vals.params)}`,
        'Sidebar Navigations',
        'Clicked - Sidebar - Overview Button',
        caseId,
        requiredData,
      )
    },
    NetworkClick: (vals) => {
      const requiredData = getRequiredData(vals)
      const { caseId } = requiredData
      return getTrackingObj(
        `${getScreenName(vals.pathname, vals.params)}`,
        'Sidebar Navigations',
        'Clicked - Sidebar - Network Button',
        caseId,
        requiredData,
      )
    },
    OptimizationClick: (vals) => {
      const requiredData = getRequiredData(vals)
      const { caseId } = requiredData
      return getTrackingObj(
        `${getScreenName(vals.pathname, vals.params)}`,
        'Sidebar Navigations',
        'Clicked - Sidebar - Optimization Button',
        caseId,
        requiredData,
      )
    },
    MonitoringBtnClick: (vals) => {
      const requiredData = getRequiredData(vals)
      const { caseId } = requiredData
      return getTrackingObj(
        `${getScreenName(vals.pathname, vals.params)}`,
        'Sidebar Navigations',
        'Clicked - Sidebar - Monitoring Button',
        caseId,
        requiredData,
      )
    },
    EnergyManagementClick: (vals) => {
      const requiredData = getRequiredData(vals)
      const { caseId } = requiredData
      return getTrackingObj(
        `${getScreenName(vals.pathname, vals.params)}`,
        'Sidebar Navigations',
        'Clicked - Sidebar - Energy Management Button',
        caseId,
        requiredData,
      )
    },
    ConfigurationsClick: (vals) => {
      const requiredData = getRequiredData(vals)
      const { caseId } = requiredData
      return getTrackingObj(
        `${getScreenName(vals.pathname, vals.params)}`,
        'Sidebar Navigations',
        'Clicked - Sidebar - Configurations',
        caseId,
        requiredData,
      )
    },
    DeleteBookmarkBtnClick: (vals) => {
      const requiredData = getRequiredData(vals)
      const { caseId } = requiredData
      return getTrackingObj(
        `${getScreenName(vals.pathname, vals.params)}`,
        'Bookmark',
        'Clicked - Sidebar - Delete Bookmark Button',
        caseId,
        requiredData,
      )
    },
    AddBookmarkBtnClick: (vals) => {
      const requiredData = getRequiredData(vals)
      const { caseId } = requiredData
      return getTrackingObj(
        `${getScreenName(vals.pathname, vals.params)}`,
        'Bookmark',
        'Clicked - Sidebar - Add Bookmark Button',
        caseId,
        requiredData,
      )
    },
    DocumentationBtnClick: (vals) => {
      const requiredData = getRequiredData(vals)
      const { caseId } = requiredData
      return getTrackingObj(
        `${getScreenName(vals.pathname, vals.params)}`,
        'Documentation Information',
        'Clicked - Sidebar - Documentation and more information Button',
        caseId,
        requiredData,
      )
    },
    CaptureScreenPdfClick: (vals) => {
      const requiredData = getRequiredData(vals)
      const { caseId } = requiredData
      return getTrackingObj(
        `${getScreenName(vals.pathname, vals.params)}`,
        'Capture Screen',
        'Clicked - Sidebar - Capture Screen Button - Capture Pdf',
        caseId,
        requiredData,
      )
    },
    CaptureScreenPngClick: (vals) => {
      const requiredData = getRequiredData(vals)
      const { caseId } = requiredData
      return getTrackingObj(
        `${getScreenName(vals.pathname, vals.params)}`,
        'Capture Screen',
        'Clicked - Sidebar - Capture Screen Button - Capture Png',
        caseId,
        requiredData,
      )
    },
  },
  downloadCsvModal: {
    DownloadCsvBtnCaseLevel: (vals, pageKey, title, selectedSystem) => {
      const requiredData = getRequiredData(vals)
      const { caseId } = requiredData
      return getTrackingObj(
        `${getScreenName(vals.pathname, vals.params)}`,
        'Download Data',
        'Clicked - Download Data Button',
        caseId,
        requiredData,
      )
    },
    DownloadCsvBtnPlantLevel: (vals, pageKey, title, selectedSystem) => {
      const requiredData = getRequiredData(vals)
      const { caseId } = requiredData
      return getTrackingObj(
        `${getScreenName(vals.pathname, vals.params)}`,
        'Download Data',
        'Clicked - Download Data Button',
        caseId,
        requiredData,
      )
    },
    handleDateRangeSelect: (vals, date, range) => {
      const requiredData = getRequiredData(vals)
      const { caseId } = requiredData
      return getTrackingObj(
        `${getScreenName(vals.pathname, vals.params)}`,
        'Download Data Date change',
        `Clicked - change ${range} date - ${moment(date)?.format('YYYY - MM - DD')} for Download Data`,
        caseId,
        requiredData,
      )
    },
    handleAffiliateChange: (vals, selectedAffiliate) => {
      const requiredData = getRequiredData(vals)
      const { caseId } = requiredData
      return getTrackingObj(
        `${getScreenName(vals.pathname, vals.params)}`,
        'Affiliate Dropdown',
        `Filtered - Affiliate - ${selectedAffiliate.affiliate} `,
        caseId,
        requiredData,
      )
    },
    handlePlantChange: (vals, selectedPlants = []) => {
      const requiredData = getRequiredData(vals)
      const { caseId } = requiredData
      let plantname = ' '
      selectedPlants.forEach((item, i) => {
        plantname += `${i === 0 ? '' : ', '}${item.display_name}`
      })
      return getTrackingObj(
        `${getScreenName(vals.pathname, vals.params)}`,
        'Plant Dropdown',
        `Filtered - Plant - ${plantname}`,
        caseId,
        requiredData,
      )
    },
    DownloadCsvParentCheckBoxClick: (vals) => {
      const requiredData = getRequiredData(vals)
      const { caseId } = requiredData
      return getTrackingObj(
        `${getScreenName(vals.pathname, vals.params)}`,
        'Select/Unselect all Checkboxs',
        'Clicked - Checkbox - Check/Uncheck All Tags',
        caseId,
        requiredData,
      )
    },
    DownloadCsvCheckBoxClick: (vals, name) => {
      const requiredData = getRequiredData(vals)
      const { caseId } = requiredData
      return getTrackingObj(
        `${getScreenName(vals.pathname, vals.params)}`,
        'Select/Unselect Checkbox',
        `Clicked - Checkbox - ${name} Tag`,
        caseId,
        requiredData,
      )
    },
  },
  ecmFolderModal: {
    folderClick: (vals) => {
      const requiredData = getRequiredData(vals)
      const { caseId } = requiredData
      const { folderName } = vals
      return getTrackingObj(
        `${getScreenName(vals.pathname, vals.params)}`,
        'Documentation Access',
        `Clicked - Folder - ${folderName}`,
        caseId,
        requiredData,
      )
    },
    internalFolderClick: (vals) => {
      const requiredData = getRequiredData(vals)
      const { caseId } = requiredData
      const { folderName } = vals
      return getTrackingObj(
        `${getScreenName(vals.pathname, vals.params)}`,
        'Documentation Access',
        `Clicked - Internal Folder - ${folderName}`,
        caseId,
        requiredData,
      )
    },
    breadcrumbClick: (vals) => {
      const requiredData = getRequiredData(vals)
      const { caseId } = requiredData
      const { folderName } = vals
      return getTrackingObj(
        `${getScreenName(vals.pathname, vals.params)}`,
        'Documentation Access',
        `Clicked - Breadcrumb - ${folderName}`,
        caseId,
        requiredData,
      )
    },
    fileDownloadClick: (vals) => {
      const requiredData = getRequiredData(vals)
      const { caseId } = requiredData
      const { fileName, fileId, system } = vals
      return getTrackingObj(
        `${getScreenName(vals.pathname, vals.params)}`,
        'Documentation Access',
        `Clicked - File Download - ${system} - ${fileName} (${fileId})`,
        caseId,
        requiredData,
      )
    },
  },
  onTrendClick: (vals) => {
    const requiredData = getRequiredData(vals)
    const { caseId } = requiredData
    return getTrackingObj(
      `${vals?.screenName ? vals.screenName : PAGE_KEYS.Analysis}`,
      `Analysis Table`,
      `Open ${!vals.isTrend ? 'Business Impact' : 'Trend Chart'}- ${vals?.caseName}`,
      caseId,
      requiredData,
    )
  },
  userAnalytics: {
    handleStartDateChange: (vals, date) => {
      const screenName = getScreenName(vals?.location?.pathname, vals?.params)
      return getTrackingObj(
        screenName,
        'Start Date Change',
        `Clicked - Start Date - ${moment(date)?.format('YYYY-MM-DD')}`,
      )
    },
    handleEndDateChange: (vals, date) => {
      const screenName = getScreenName(vals?.location?.pathname)
      return getTrackingObj(
        screenName,
        'End Date Change',
        `Clicked - End Date - ${moment(date)?.format('YYYY-MM-DD')}`,
      )
    },
    handleSearch: (vals, data) => {
      const screenName = getScreenName(vals?.location?.pathname)
      return getTrackingObj(
        screenName,
        'Searching Interface Users',
        `Clicked - Search Result List - ${data?.employeeName}`,
      )
    },
  },
  userStatistics: {
    handleStartDateChange: (vals, date) => {
      const screenName = getScreenName(vals?.location?.pathname, vals?.params)
      return getTrackingObj(
        screenName,
        'Start Date Change',
        `Clicked - Start Date - ${moment(date)?.format('YYYY-MM-DD')}`,
      )
    },
    handleEndDateChange: (vals, date) => {
      const screenName = getScreenName(vals?.location?.pathname)
      return getTrackingObj(
        screenName,
        'End Date Change',
        `Clicked - End Date - ${moment(date)?.format('YYYY-MM-DD')}`,
      )
    },
    handleFilterChange: (vals, selectedData, field) => {
      const requiredData = getRequiredData(vals)
      const { caseId } = requiredData
      return getTrackingObj(
        `${getScreenName(vals?.location?.pathname, vals.params)}`,
        `${field} Dropdown`,
        `Filtered - ${field} - ${selectedData.display_name} `,
        caseId,
        requiredData,
      )
    },
  },
  autoDelegation: {
    onSubmit: (vals) => {
      const requiredData = getRequiredData(vals)
      const { caseId } = requiredData
      return getTrackingObj(
        `${getScreenName(vals.pathname, vals.params)}`,
        'Auto Delegation',
        'Clicked - Submit',
        caseId,
        requiredData,
      )
    },
  },
  network: {
    selectedplant: (vals, selectedValue) => {
      const requiredData = getRequiredData(vals)
      const { caseId } = requiredData
      return getTrackingObj(
        PAGE_KEYS.network,
        `Filtered - Plant List`,
        `Clicked - Plant ${selectedValue?.pageName}`,
        caseId,
        requiredData,
      )
    },
    EnterDeveloperModeClick: (vals) => {
      const requiredData = getRequiredData(vals)
      const { caseId } = requiredData
      return getTrackingObj(
        PAGE_KEYS.network,
        'Enter Developer Mode',
        `Clicked - Enter Developer Mode Button`,
        caseId,
        requiredData,
      )
    },
    ExitDeveloperModeClick: (vals) => {
      const requiredData = getRequiredData(vals)
      const { caseId } = requiredData
      return getTrackingObj(
        PAGE_KEYS.network,
        'Exit Developer Mode',
        `Clicked - Exit Developer Mode Button`,
        caseId,
        requiredData,
      )
    },
    SaveClick: (vals) => {
      const requiredData = getRequiredData(vals)
      const { caseId } = requiredData
      return getTrackingObj(
        PAGE_KEYS.network,
        'Save Button',
        `Clicked - Save Button`,
        caseId,
        requiredData,
      )
    },
    ShowHandlesClick: (vals) => {
      const requiredData = getRequiredData(vals)
      const { caseId } = requiredData
      return getTrackingObj(
        PAGE_KEYS.network,
        'Show Handles Button',
        `Clicked - Show Handles Button`,
        caseId,
        requiredData,
      )
    },
    HideHandlesClick: (vals) => {
      const requiredData = getRequiredData(vals)
      const { caseId } = requiredData
      return getTrackingObj(
        PAGE_KEYS.network,
        'Hide Handles Button',
        `Clicked - Hide Handles Button`,
        caseId,
        requiredData,
      )
    },
    NodesListBtnClick: (vals, node) => {
      const requiredData = getRequiredData(vals)
      const { caseId } = requiredData
      return getTrackingObj(
        PAGE_KEYS.network,
        `${node.name} Node`,
        `Clicked - Node List ${node.name} Node`,
        caseId,
        requiredData,
      )
    },
    ConfigNodeApplyClick: (vals) => {
      const requiredData = getRequiredData(vals)
      const { caseId } = requiredData
      return getTrackingObj(
        PAGE_KEYS.network,
        `Configure Node Apply`,
        `Clicked - Configure Node Apply Button`,
        caseId,
        requiredData,
      )
    },
    ConfigNodeCloseClick: (vals) => {
      const requiredData = getRequiredData(vals)
      const { caseId } = requiredData
      return getTrackingObj(
        PAGE_KEYS.network,
        `Configure Node Close`,
        `Clicked - Configure Node Close Button`,
        caseId,
        requiredData,
      )
    },
    ConfigNodeDeleteClick: (vals) => {
      const requiredData = getRequiredData(vals)
      const { caseId } = requiredData
      return getTrackingObj(
        PAGE_KEYS.network,
        `Configure Node Delete`,
        `Clicked - Configure Node Delete Button`,
        caseId,
        requiredData,
      )
    },
    ConfigNodeLinkClick: (vals) => {
      const requiredData = getRequiredData(vals)
      const { caseId } = requiredData
      return getTrackingObj(
        PAGE_KEYS.network,
        `Configure Node Link`,
        `Clicked - Configure Node Link Button`,
        caseId,
        requiredData,
      )
    },
    ConfigNodeUnlinkClick: (vals) => {
      const requiredData = getRequiredData(vals)
      const { caseId } = requiredData
      return getTrackingObj(
        PAGE_KEYS.network,
        `Configure Node Unlink`,
        `Clicked - Configure Node Unlink Button`,
        caseId,
        requiredData,
      )
    },
  },
  EmTopTiles: {
    onTileClick: (vals, obj) => {
      const requiredData = getRequiredData(vals)
      const { caseId } = requiredData
      return getTrackingObj(
        PAGE_KEYS.energyManagement,
        'Energy Management Top Tiles',
        `Clicked - Energy Management Tiles - ${obj.title}`,
        caseId,
        requiredData,
      )
    },
  },
  energyManagement: {
    handleStartDateChange: (vals, DPStartDate) => {
      const screenName = getScreenName(vals?.location?.pathname, vals?.params)
      const requiredData = getRequiredData(vals)
      const { caseId } = requiredData
      return getTrackingObj(
        screenName,
        'Start Date Change',
        `Clicked - Start Date - ${moment(DPStartDate)?.format('YYYY-MM-DD')}`,
        caseId,
        requiredData,
      )
    },
    handleEndDateChange: (vals, DPEndDate) => {
      const screenName = getScreenName(vals?.location?.pathname, vals?.params)
      const requiredData = getRequiredData(vals)
      const { caseId } = requiredData
      return getTrackingObj(
        screenName,
        'End Date Change',
        `Clicked - End Date - ${moment(DPEndDate)?.format('YYYY-MM-DD')}`,
        caseId,
        requiredData,
      )
    },
    selectedValue: (vals, e) => {
      if (e[0] == undefined) return
      const requiredData = getRequiredData(vals)
      const { caseId } = requiredData
      const plantName = e.map(({ name }) => name).join(', ')
      return getTrackingObj(
        `Energy Management`,
        `Filtered - Plant List`,
        `Clicked - Plant ${plantName}`,
        caseId,
        requiredData,
      )
    },
  },
  TPEnergyConsumption: {
    onTabClick: (vals, tab) => {
      const requiredData = getRequiredData(vals)
      const { caseId } = requiredData
      return getTrackingObj(
        PAGE_KEYS.energyManagement,
        'Energy Management - TP Energy Consumption',
        `Clicked - ${tab} - Tab`,
        caseId,
        requiredData,
      )
    },
  },
  EGCostIndex: {
    onTabClick: (vals, tab) => {
      const requiredData = getRequiredData(vals)
      const { caseId } = requiredData
      return getTrackingObj(
        PAGE_KEYS.energyManagement,
        'Energy Management - EG Cost Index',
        `Clicked - ${tab} - Tab`,
        caseId,
        requiredData,
      )
    },
  },
  SeuEnpiNet: {
    onTabClick: (vals, tab) => {
      const requiredData = getRequiredData(vals)
      const { caseId } = requiredData
      return getTrackingObj(
        PAGE_KEYS.energyManagement,
        'Energy Management - Seu Enpi Net',
        `Clicked - ${tab} - Tab`,
        caseId,
        requiredData,
      )
    },
    viewCategoryClick: (vals, value) => {
      const requiredData = getRequiredData(vals)
      const { caseId } = requiredData
      return getTrackingObj(
        PAGE_KEYS.energyManagement,
        'Energy Management - Seu Enpi Net Significant Energy Users Table',
        `Clicked - ${value} Category Icon`,
        caseId,
        requiredData,
      )
    },
  },
  AirSystemPerformance: {
    onTabClick: (vals, tab) => {
      const requiredData = getRequiredData(vals)
      const { caseId } = requiredData
      return getTrackingObj(
        PAGE_KEYS.energyManagement,
        'Energy Management - Air System Performance',
        `Clicked - ${tab} - Tab`,
        caseId,
        requiredData,
      )
    },
  },
  CoolingWaterPerformance: {
    onTabClick: (vals, tab) => {
      const requiredData = getRequiredData(vals)
      const { caseId } = requiredData
      return getTrackingObj(
        PAGE_KEYS.energyManagement,
        'Energy Management - Cooling Water Performance',
        `Clicked - ${tab} - Tab`,
        caseId,
        requiredData,
      )
    },
  },
  CostPerUnit: {
    onTabClick: (vals, tab) => {
      const requiredData = getRequiredData(vals)
      const { caseId } = requiredData
      return getTrackingObj(
        PAGE_KEYS.energyManagement,
        'Energy Management - CW Performance',
        `Clicked - ${tab} - Sub-Tab`,
        caseId,
        requiredData,
      )
    },
  },
  SystemSteamLosses: {
    onTabClick: (vals, tab) => {
      const requiredData = getRequiredData(vals)
      const { caseId } = requiredData
      return getTrackingObj(
        PAGE_KEYS.energyManagement,
        'Energy Management - System Steam Losses',
        `Clicked - ${tab} - Tab`,
        caseId,
        requiredData,
      )
    },
  },
  Optimization: {
    ActualModeClick: (vals) => {
      const requiredData = getRequiredData(vals)
      const { caseId } = requiredData
      return getTrackingObj(
        PAGE_KEYS.optimization,
        `${getScreenName(vals.pathname, vals.params)}`,
        'Actual Mode',
        `Clicked - Actual Mode Button`,
        caseId,
        requiredData,
      )
    },
    WhatIfModeClick: (vals) => {
      const requiredData = getRequiredData(vals)
      const { caseId } = requiredData
      return getTrackingObj(
        PAGE_KEYS.optimization,
        'What If Mode',
        `Clicked - What If Mode Button`,
        caseId,
        requiredData,
      )
    },
    EstimateDemandClick: (vals) => {
      const requiredData = getRequiredData(vals)
      const { caseId } = requiredData
      return getTrackingObj(
        PAGE_KEYS.optimization,
        'Estimate Demand Open Modal',
        `Clicked - Estimate Demand Button`,
        caseId,
        requiredData,
      )
    },
    EstimateDemandTrendIconClick: (vals, item) => {
      const requiredData = getRequiredData(vals)
      const { caseId } = requiredData
      return getTrackingObj(
        PAGE_KEYS.optimization,
        'Estimate Demand Input',
        `Clicked - ${item.tagName} - Trend icon`,
        caseId,
        requiredData,
      )
    },
    PlantLoadTrendIconClick: (vals, item) => {
      const requiredData = getRequiredData(vals)
      const { caseId } = requiredData
      return getTrackingObj(
        PAGE_KEYS.optimization,
        'Plant Parameters',
        `Clicked - ${item.tagName} - Trend Icon`,
        caseId,
        requiredData,
      )
    },
    PlantLoadInputBox: (vals, obj) => {
      const requiredData = getRequiredData(vals)
      const { caseId } = requiredData
      return getTrackingObj(
        PAGE_KEYS.optimization,
        'Plant Load',
        `Clicked - ${obj.plantname} - Input Box`,
        caseId,
        requiredData,
      )
    },
    PlantDemandTrendIconClick: (vals, item, row) => {
      const requiredData = getRequiredData(vals)
      const { caseId } = requiredData
      return getTrackingObj(
        PAGE_KEYS.optimization,
        'Plant Demand',
        `Clicked - ${item.plantName} - ${row.energycategory} - Trend Icon`,
        caseId,
        requiredData,
      )
    },
    PlantDemandInputBox: (vals, item, row) => {
      const requiredData = getRequiredData(vals)
      const { caseId } = requiredData
      return getTrackingObj(
        PAGE_KEYS.optimization,
        'Plant Demand',
        `Clicked - ${item.plantName} - ${row.energycategory} - Input Box`,
        caseId,
        requiredData,
      )
    },
    EquipAvailabilityEditIconClick: (vals, obj) => {
      const requiredData = getRequiredData(vals)
      const { caseId } = requiredData
      return getTrackingObj(
        PAGE_KEYS.optimization,
        'Equipment Availability',
        `Clicked - ${obj.assetName} - Edit Icon`,
        caseId,
        requiredData,
      )
    },
    EquipAvailabilityUpArrowIconClick: (vals, obj) => {
      const requiredData = getRequiredData(vals)
      const { caseId } = requiredData
      return getTrackingObj(
        PAGE_KEYS.optimization,
        'Equipment Availability',
        `Clicked - Asset Availability - Collapse Icon`,
        caseId,
        requiredData,
      )
    },
    EquipAvailabilityDownArrowIconClick: (vals, obj) => {
      const requiredData = getRequiredData(vals)
      const { caseId } = requiredData
      return getTrackingObj(
        PAGE_KEYS.optimization,
        'Equipment Availability',
        `Clicked - Asset Availability - Expand Icon`,
        caseId,
        requiredData,
      )
    },
    EquipAvailabilityInfoIconClick: (vals, obj) => {
      const requiredData = getRequiredData(vals)
      const { caseId } = requiredData
      return getTrackingObj(
        PAGE_KEYS.optimization,
        'Equipment Availability',
        `Clicked - ${obj.plantName} - Info Icon`,
        caseId,
        requiredData,
      )
    },
    OtherLoadInputBox: (vals, obj) => {
      const requiredData = getRequiredData(vals)
      const { caseId } = requiredData
      return getTrackingObj(
        PAGE_KEYS.optimization,
        'Other Load',
        `Clicked - ${obj.plantname} - Input Box`,
        caseId,
        requiredData,
      )
    },
    PriceInputClick: (vals) => {
      const requiredData = getRequiredData(vals)
      const { caseId } = requiredData
      return getTrackingObj(
        PAGE_KEYS.optimization,
        'Price Input Modal Open',
        `Clicked - Price Input Button`,
        caseId,
        requiredData,
      )
    },
  },
}
