// trackingUtils.test.js
import {
  getCaseIdByAffiliate,
  getTrackingObj,
  getValsBaseOnCondition,
  slugToText,
} from 'utills/utilities'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  PAGE_KEYS,
  TRACKEVENTOBJ,
  getScreenName,
} from './ActivityTrackerConfig'
// Mock the utility functions
vi.mock('utills/utilities', () => ({
  getCaseIdByAffiliate: vi.fn(),
  getTrackingObj: vi.fn(),
  getValsBaseOnCondition: vi.fn(),
  slugToText: vi.fn(),
}))

// Mock moment

vi.mock('moment', () => ({
  default: () => {
    const mockMoment = vi.fn(() => ({
      format: vi.fn(() => '2023-01-01'),
    }))
    mockMoment.format = vi.fn(() => '2023-01-01')
    return mockMoment
  },
}))

describe('Tracking Utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getCaseIdByAffiliate.mockReturnValue('test-case-id')
    getTrackingObj.mockReturnValue({ event: 'tracked' })
    getValsBaseOnCondition.mockImplementation((val, truthy, falsy) =>
      val ? truthy : falsy,
    )
    slugToText.mockReturnValue('test-affiliate')
  })
  describe('PAGE_KEYS', () => {
    it('should have all the expected page keys', () => {
      expect(PAGE_KEYS.Monitoring).toBe('Monitoring')
      expect(PAGE_KEYS.performanceTracker).toBe('Performance Tracker')
      expect(PAGE_KEYS.corporate).toBe('Sabic')
      expect(PAGE_KEYS.UserManagement).toBe('User Management')
      // Test all other page keys
      expect(Object.keys(PAGE_KEYS).length).toBeGreaterThan(0)
    })
  })
  describe('getScreenName', () => {
    it('should return "Sabic" for root path', () => {
      expect(getScreenName('/')).toBe('Sabic')
    })
    it('should return correct label for known routes', () => {
      expect(getScreenName('/affiliates')).toBe('Affiliate')
      expect(getScreenName('/overview')).toBe('Overview')
      expect(getScreenName('/monitoring')).toBe('Monitoring')
      expect(getScreenName('/configurations')).toBe('Configurations')
    })
    it('should return "Affiliate" when params.affiliate exists', () => {
      expect(getScreenName('/unknown', { affiliate: 'test' })).toBe('Affiliate')
    })
    it('should return empty string for unknown routes without affiliate', () => {
      expect(getScreenName('/unknown')).toBe('')
    })
  })
  describe('TRACKEVENTOBJ', () => {
    const mockVals = {
      params: { affiliate: 'test-affiliate' },
      caseData: {},
      eventKey: 'test-event',
      tabName: 'test-tab',
      btnName: 'test-button',
      tagName: 'test-tag',
      pathname: '/test',
      location: { href: '/test', pathname: '/test' },
      data: { test: 'value' },
      key: 'test-key',
      value: 'test-value',
      requestID: 'test-request-id',
      axis: 'test-axis',
      title: 'test-title',
      activeRegion: 'test-region',
      selectedValue: 'test-value',
      userData: { employeeName: 'test-user', role: 'test-role' },
      employeeName: 'test-employee',
      role: 'test-role',
      calledBy: 'test-caller',
      causeData: { causeMessage: 'test-cause' },
    }
    describe('Optimizer', () => {
      it('should call onTabChange correctly', () => {
        const result = TRACKEVENTOBJ.Optimizer.onTabChange(mockVals)
        expect(getCaseIdByAffiliate).toHaveBeenCalled()
        expect(getTrackingObj).toHaveBeenCalled()
        expect(result).toEqual({ event: 'tracked' })
      })
    })
    describe('CCP', () => {
      it('should call onTabChange correctly', () => {
        const result = TRACKEVENTOBJ.CCP.onTabChange(mockVals)
        expect(getTrackingObj).toHaveBeenCalled()
        expect(result).toEqual({ event: 'tracked' })
      })
    })
    describe('CCPTabs', () => {
      it('should call onBtnClick correctly', () => {
        const result = TRACKEVENTOBJ.CCPTabs.onBtnClick(mockVals)
        expect(getTrackingObj).toHaveBeenCalled()
        expect(result).toEqual({ event: 'tracked' })
      })
    })
    describe('AlertStatusTable', () => {
      it('should call onAlertButtonClick correctly', () => {
        const result =
          TRACKEVENTOBJ.AlertStatusTable.onAlertButtonClick(mockVals)
        expect(getTrackingObj).toHaveBeenCalled()
        expect(result).toEqual({ event: 'tracked' })
      })
    })
    describe('AlertStatistics', () => {
      it('should call onMonthChange correctly', () => {
        const result = TRACKEVENTOBJ.AlertStatistics.onMonthChange(mockVals)
        expect(getTrackingObj).toHaveBeenCalled()
        expect(result).toEqual({ event: 'tracked' })
      })
    })
    describe('CCPTags', () => {
      it('should call onSearch correctly', () => {
        const result = TRACKEVENTOBJ.CCPTags.onSearch(mockVals)
        expect(getTrackingObj).toHaveBeenCalled()
        expect(result).toEqual({ event: 'tracked' })
      })
      it('should call onDropDownChange correctly', () => {
        const result = TRACKEVENTOBJ.CCPTags.onDropDownChange(mockVals)
        expect(getTrackingObj).toHaveBeenCalled()
        expect(result).toEqual({ event: 'tracked' })
      })
      it('should call modelNamDropDownChange correctly', () => {
        const result = TRACKEVENTOBJ.CCPTags.modelNamDropDownChange(mockVals)
        expect(getTrackingObj).toHaveBeenCalled()
        expect(result).toEqual({ event: 'tracked' })
      })
      it('should call onBtnClick correctly', () => {
        const result = TRACKEVENTOBJ.CCPTags.onBtnClick(mockVals)
        expect(getTrackingObj).toHaveBeenCalled()
        expect(result).toEqual({ event: 'tracked' })
      })
      it('should call onEditTag correctly', () => {
        const result = TRACKEVENTOBJ.CCPTags.onEditTag(mockVals)
        expect(getTrackingObj).toHaveBeenCalled()
        expect(result).toEqual({ event: 'tracked' })
      })
    })
    describe('InboxWorkflow', () => {
      it('should call onDropDownChange correctly', () => {
        const result = TRACKEVENTOBJ.InboxWorkflow.onDropDownChange(mockVals)
        expect(getTrackingObj).toHaveBeenCalled()
        expect(result).toEqual({ event: 'tracked' })
      })
      it('should call onBulkUpdateSubmit with data', () => {
        const result = TRACKEVENTOBJ.InboxWorkflow.onBulkUpdateSubmit({
          ...mockVals,
          data: { key1: 'value1', key2: 'value2' },
        })
        expect(getTrackingObj).toHaveBeenCalled()
        expect(result).toEqual({ event: 'tracked' })
      })
      it('should call onBulkUpdateSubmit with empty data', () => {
        const result = TRACKEVENTOBJ.InboxWorkflow.onBulkUpdateSubmit({
          ...mockVals,
          data: {},
        })
        expect(getTrackingObj).toHaveBeenCalled()
        expect(result).toEqual({ event: 'tracked' })
      })
    })
    describe('Monitoring', () => {
      it('should call handleSelected correctly', () => {
        const result = TRACKEVENTOBJ.Monitoring.handleSelected({
          ...mockVals,
          data: { parameter: 'test-param' },
          axis: 'test-axis',
        })
        expect(getValsBaseOnCondition).toHaveBeenCalled()
        expect(getTrackingObj).toHaveBeenCalled()
        expect(result).toEqual({ event: 'tracked' })
      })
      it('should call handleTrendSave correctly', () => {
        const result = TRACKEVENTOBJ.Monitoring.handleTrendSave(mockVals)
        expect(getTrackingObj).toHaveBeenCalled()
        expect(result).toEqual({ event: 'tracked' })
      })
      it('should call onCheckboxClick correctly', () => {
        const result = TRACKEVENTOBJ.Monitoring.onCheckboxClick(mockVals)
        expect(getTrackingObj).toHaveBeenCalled()
        expect(result).toEqual({ event: 'tracked' })
      })
      it('should call onApplyClick correctly', () => {
        const result = TRACKEVENTOBJ.Monitoring.onApplyClick(mockVals)
        expect(getTrackingObj).toHaveBeenCalled()
        expect(result).toEqual({ event: 'tracked' })
      })
      it('should call onDeleteClick correctly', () => {
        const result = TRACKEVENTOBJ.Monitoring.onDeleteClick(mockVals)
        expect(getTrackingObj).toHaveBeenCalled()
        expect(result).toEqual({ event: 'tracked' })
      })
      it('should call onDropDownChange correctly', () => {
        const result = TRACKEVENTOBJ.Monitoring.onDropDownChange(mockVals)
        expect(getTrackingObj).toHaveBeenCalled()
        expect(result).toEqual({ event: 'tracked' })
      })
    })
    describe('performanceTracker', () => {
      it('should call onTabChange correctly', () => {
        const result = TRACKEVENTOBJ.performanceTracker.onTabChange(
          mockVals,
          'test-event-key',
        )
        expect(getTrackingObj).toHaveBeenCalled()
        expect(result).toEqual({ event: 'tracked' })
      })
    })
    describe('corporate', () => {
      it('should call numberCircle correctly', () => {
        const result = TRACKEVENTOBJ.corporate.numberCircle(mockVals, {
          regionName: 'test-region',
        })
        expect(getTrackingObj).toHaveBeenCalled()
        expect(result).toEqual({ event: 'tracked' })
      })
      it('should call handleClickRegion correctly', () => {
        const result = TRACKEVENTOBJ.corporate.handleClickRegion(
          mockVals,
          'test-region',
        )
        expect(getTrackingObj).toHaveBeenCalled()
        expect(result).toEqual({ event: 'tracked' })
      })
      it('should call onLogin correctly', () => {
        const result = TRACKEVENTOBJ.corporate.onLogin()
        expect(getTrackingObj).toHaveBeenCalled()
        expect(result).toEqual({ event: 'tracked' })
      })
      it('should call onForcedLogin correctly', () => {
        const result = TRACKEVENTOBJ.corporate.onForcedLogin()
        expect(getTrackingObj).toHaveBeenCalled()
        expect(result).toEqual({ event: 'tracked' })
      })
    })
    describe('addUser', () => {
      it('should call onAddClick correctly', () => {
        const result = TRACKEVENTOBJ.addUser.onAddClick(
          'test-page',
          'test-title',
          'test-users',
        )
        expect(getTrackingObj).toHaveBeenCalled()
        expect(result).toEqual({ event: 'tracked' })
      })
    })
    describe('workflowConfiguration', () => {
      it('should call handleSubmit correctly', () => {
        const result = TRACKEVENTOBJ.workflowConfiguration.handleSubmit()
        expect(getTrackingObj).toHaveBeenCalled()
        expect(result).toEqual({ event: 'tracked' })
      })
    })
    describe('addUserWorkflow', () => {
      it('should call onAddClick correctly', () => {
        const result = TRACKEVENTOBJ.addUserWorkflow.onAddClick(
          'test-role',
          'test-users',
          'test-page',
        )
        expect(getTrackingObj).toHaveBeenCalled()
        expect(result).toEqual({ event: 'tracked' })
      })
      it('should call onBusinessUserBtnClick correctly', () => {
        const result = TRACKEVENTOBJ.addUserWorkflow.onBusinessUserBtnClick()
        expect(getTrackingObj).toHaveBeenCalled()
        expect(result).toEqual({ event: 'tracked' })
      })
      it('should call onReturnBackClick correctly', () => {
        const result = TRACKEVENTOBJ.addUserWorkflow.onReturnBackClick()
        expect(getTrackingObj).toHaveBeenCalled()
        expect(result).toEqual({ event: 'tracked' })
      })
    })
    describe('UserManagement', () => {
      it('should call onDropDownChange correctly', () => {
        const result = TRACKEVENTOBJ.UserManagement.onDropDownChange(mockVals)
        expect(getTrackingObj).toHaveBeenCalled()
        expect(result).toEqual({ event: 'tracked' })
      })
      it('should call onTabChange correctly', () => {
        const result = TRACKEVENTOBJ.UserManagement.onTabChange(mockVals)
        expect(getTrackingObj).toHaveBeenCalled()
        expect(result).toEqual({ event: 'tracked' })
      })
      it('should call onDeleteClick correctly', () => {
        const result = TRACKEVENTOBJ.UserManagement.onDeleteClick(mockVals)
        expect(getTrackingObj).toHaveBeenCalled()
        expect(result).toEqual({ event: 'tracked' })
      })
      it('should call onUserDeleteAdminCorporate correctly', () => {
        const result =
          TRACKEVENTOBJ.UserManagement.onUserDeleteAdminCorporate(mockVals)
        expect(getTrackingObj).toHaveBeenCalled()
        expect(result).toEqual({ event: 'tracked' })
      })
      it('should call onUserDeleteFeature correctly', () => {
        const result =
          TRACKEVENTOBJ.UserManagement.onUserDeleteFeature(mockVals)
        expect(getTrackingObj).toHaveBeenCalled()
        expect(result).toEqual({ event: 'tracked' })
      })
      it('should call onUserDelete correctly', () => {
        const result = TRACKEVENTOBJ.UserManagement.onUserDelete(mockVals)
        expect(getTrackingObj).toHaveBeenCalled()
        expect(result).toEqual({ event: 'tracked' })
      })
    })
    describe('breadcrumb', () => {
      it('should call linkOnClick correctly', () => {
        const result = TRACKEVENTOBJ.breadcrumb.linkOnClick(
          'test-key',
          'test-val',
          mockVals,
        )
        expect(getTrackingObj).toHaveBeenCalled()
        expect(result).toEqual({ event: 'tracked' })
      })
    })
    describe('footer', () => {
      it('should call handleTimeZone correctly', () => {
        const result = TRACKEVENTOBJ.footer.handleTimeZone({
          ...mockVals,
          selectedTimeZone: 'test-timezone',
        })
        expect(getTrackingObj).toHaveBeenCalled()
        expect(result).toEqual({ event: 'tracked' })
      })
    })
    describe('header', () => {
      it('should call backOnClick correctly', () => {
        const result = TRACKEVENTOBJ.header.backOnClick(mockVals)
        expect(getTrackingObj).toHaveBeenCalled()
        expect(result).toEqual({ event: 'tracked' })
      })
      it('should call inboxWorkflowOnClick correctly', () => {
        const result = TRACKEVENTOBJ.header.inboxWorkflowOnClick(mockVals)
        expect(getTrackingObj).toHaveBeenCalled()
        expect(result).toEqual({ event: 'tracked' })
      })
      it('should call helpOnClick correctly', () => {
        const result = TRACKEVENTOBJ.header.helpOnClick(mockVals)
        expect(getTrackingObj).toHaveBeenCalled()
        expect(result).toEqual({ event: 'tracked' })
      })
      it('should call adminOnClick correctly', () => {
        const result = TRACKEVENTOBJ.header.adminOnClick(mockVals)
        expect(getTrackingObj).toHaveBeenCalled()
        expect(result).toEqual({ event: 'tracked' })
      })
      it('should call adminBackOnClick correctly', () => {
        const result = TRACKEVENTOBJ.header.adminBackOnClick(mockVals)
        expect(getTrackingObj).toHaveBeenCalled()
        expect(result).toEqual({ event: 'tracked' })
      })
      it('should call logoutOnClick correctly', () => {
        const result = TRACKEVENTOBJ.header.logoutOnClick(mockVals)
        expect(getTrackingObj).toHaveBeenCalled()
        expect(result).toEqual({ event: 'tracked' })
      })
    })
    describe('searchBar', () => {
      it('should call handleSearch correctly', () => {
        const result = TRACKEVENTOBJ.searchBar.handleSearch(
          'test-page',
          'test-title',
          { employeeID: 'test-id', employeeName: 'test-name' },
        )
        expect(getTrackingObj).toHaveBeenCalled()
        expect(result).toEqual({ event: 'tracked' })
      })
    })
    describe('favoriteTrends', () => {
      it('should call favTrendOnClick correctly', () => {
        const result = TRACKEVENTOBJ.favoriteTrends.favTrendOnClick(
          { subTitle: 'test-sub', title: 'test-title' },
          mockVals,
        )
        expect(getTrackingObj).toHaveBeenCalled()
        expect(result).toEqual({ event: 'tracked' })
      })
    })
    describe('overview', () => {
      it('should call modelWarningClick correctly', () => {
        const result = TRACKEVENTOBJ.overview.modelWarningClick(mockVals)
        expect(getTrackingObj).toHaveBeenCalled()
        expect(result).toEqual({ event: 'tracked' })
      })
      it('should call sopForGridTransitionClick correctly', () => {
        const result =
          TRACKEVENTOBJ.overview.sopForGridTransitionClick(mockVals)
        expect(getTrackingObj).toHaveBeenCalled()
        expect(result).toEqual({ event: 'tracked' })
      })
      it('should call modelSkipDateClick correctly', () => {
        const result = TRACKEVENTOBJ.overview.modelSkipDateClick({
          ...mockVals,
          key: 'test-key',
          date: '2023-01-01',
        })
        expect(getTrackingObj).toHaveBeenCalled()
        expect(result).toEqual({ event: 'tracked' })
      })
      it('should call resetBtnOnClick correctly', () => {
        const result = TRACKEVENTOBJ.overview.resetBtnOnClick(mockVals)
        expect(getTrackingObj).toHaveBeenCalled()
        expect(result).toEqual({ event: 'tracked' })
      })
      it('should call onTabChange correctly', () => {
        const result = TRACKEVENTOBJ.overview.onTabChange({
          ...mockVals,
          activeTab: 'overview',
          label: 'test-label',
        })
        expect(getTrackingObj).toHaveBeenCalled()
        expect(result).toEqual({ event: 'tracked' })
      })
    })
    describe('cardAction', () => {
      const cardData = {
        kpi1_line1: 'test-kpi1',
        tagName: 'test-tag',
        displayName: 'test-display',
      }
      it('should call detailsModalOnClick correctly', () => {
        const result = TRACKEVENTOBJ.cardAction.detailsModalOnClick(cardData, {
          ...mockVals,
          calledBy: 'CardTopTiles',
        })
        expect(getTrackingObj).toHaveBeenCalled()
        expect(result).toEqual({ event: 'tracked' })
      })
      it('should call causeModalOnClick correctly', () => {
        const result = TRACKEVENTOBJ.cardAction.causeModalOnClick(cardData, {
          ...mockVals,
          calledBy: 'CardTopTiles',
        })
        expect(getTrackingObj).toHaveBeenCalled()
        expect(result).toEqual({ event: 'tracked' })
      })
      it('should call trendModalOnClick correctly', () => {
        const result = TRACKEVENTOBJ.cardAction.trendModalOnClick(cardData, {
          ...mockVals,
          calledBy: 'CardTopTiles',
        })
        expect(getTrackingObj).toHaveBeenCalled()
        expect(result).toEqual({ event: 'tracked' })
      })
    })
    describe('cardTopTiles', () => {
      it('should call categoryOnClick correctly', () => {
        const result = TRACKEVENTOBJ.cardTopTiles.categoryOnClick(
          { category: 'test-category' },
          mockVals,
        )
        expect(getTrackingObj).toHaveBeenCalled()
        expect(result).toEqual({ event: 'tracked' })
      })
    })
    describe('landingPagesTopKpi', () => {
      it('should call enrolledAffiliateClick correctly', () => {
        const result =
          TRACKEVENTOBJ.landingPagesTopKpi.enrolledAffiliateClick(mockVals)
        expect(getTrackingObj).toHaveBeenCalled()
        expect(result).toEqual({ event: 'tracked' })
      })
    })
    describe('adminTableUpdateModal', () => {
      it('should call adminTableUpdatedOnClick correctly', () => {
        const result =
          TRACKEVENTOBJ.adminTableUpdateModal.adminTableUpdatedOnClick(mockVals)
        expect(getTrackingObj).toHaveBeenCalled()
        expect(result).toEqual({ event: 'tracked' })
      })
    })
    describe('ODSAlertModal', () => {
      it('should call yesConfirmationModal correctly', () => {
        const result = TRACKEVENTOBJ.ODSAlertModal.yesConfirmationModal(
          'test-caller',
          {
            ...mockVals,
            data: { test: 'value' },
          },
        )
        expect(getTrackingObj).toHaveBeenCalled()
        expect(result).toEqual({ event: 'tracked' })
      })
      it('should call WorkflowHistoricLogsModal correctly', () => {
        const result =
          TRACKEVENTOBJ.ODSAlertModal.WorkflowHistoricLogsModal(mockVals)
        expect(getTrackingObj).toHaveBeenCalled()
        expect(result).toEqual({ event: 'tracked' })
      })
    })
    describe('dashboardStatusLegend', () => {
      it('should call onDateChange correctly', () => {
        const result = TRACKEVENTOBJ.dashboardStatusLegend.onDateChange({
          ...mockVals,
          date: '2023-01-01',
        })
        expect(getTrackingObj).toHaveBeenCalled()
        expect(result).toEqual({ event: 'tracked' })
      })
      it('should call alertIconOnClick correctly', () => {
        const result =
          TRACKEVENTOBJ.dashboardStatusLegend.alertIconOnClick(mockVals)
        expect(getTrackingObj).toHaveBeenCalled()
        expect(result).toEqual({ event: 'tracked' })
      })
      it('should call timeInfoIconOnClick correctly', () => {
        const result =
          TRACKEVENTOBJ.dashboardStatusLegend.timeInfoIconOnClick(mockVals)
        expect(getTrackingObj).toHaveBeenCalled()
        expect(result).toEqual({ event: 'tracked' })
      })
      it('should call modelAlertOnClick correctly', () => {
        const result =
          TRACKEVENTOBJ.dashboardStatusLegend.modelAlertOnClick(mockVals)
        expect(getTrackingObj).toHaveBeenCalled()
        expect(result).toEqual({ event: 'tracked' })
      })
      it('should call calenderIconOnClick correctly', () => {
        const result =
          TRACKEVENTOBJ.dashboardStatusLegend.calenderIconOnClick(mockVals)
        expect(getTrackingObj).toHaveBeenCalled()
        expect(result).toEqual({ event: 'tracked' })
      })
      it('should call modelSkipOnClick correctly', () => {
        const result =
          TRACKEVENTOBJ.dashboardStatusLegend.modelSkipOnClick(mockVals)
        expect(getTrackingObj).toHaveBeenCalled()
        expect(result).toEqual({ event: 'tracked' })
      })
    })
    describe('DateRangeContainer', () => {
      it('should call handleStartDateChange correctly', () => {
        const result = TRACKEVENTOBJ.DateRangeContainer.handleStartDateChange(
          'test-screen',
          'test-functionality',
          '2023-01-01',
          true,
          mockVals,
        )
        expect(getTrackingObj).toHaveBeenCalled()
        expect(result).toEqual({ event: 'tracked' })
      })
      it('should call handleEndDateChange correctly', () => {
        const result = TRACKEVENTOBJ.DateRangeContainer.handleEndDateChange(
          'test-screen',
          'test-functionality',
          '2023-01-01',
          true,
          mockVals,
        )
        expect(getTrackingObj).toHaveBeenCalled()
        expect(result).toEqual({ event: 'tracked' })
      })
    })
    describe('HealthCheck', () => {
      it('should call onTrendClick correctly', () => {
        const result = TRACKEVENTOBJ.HealthCheck.onTrendClick({
          affiliateName: 'test-affiliate',
          plantName: 'test-plant',
          systemName: 'test-system',
          piTag: 'test-pi',
        })
        expect(getTrackingObj).toHaveBeenCalled()
        expect(result).toEqual({ event: 'tracked' })
      })
      it('should call onAffiliateChange correctly', () => {
        const result = TRACKEVENTOBJ.HealthCheck.onAffiliateChange({
          displayName: 'test-display',
        })
        expect(getTrackingObj).toHaveBeenCalled()
        expect(result).toEqual({ event: 'tracked' })
      })
    })
    describe('healthStatusInfo', () => {
      it('should call showTrend correctly', () => {
        const result = TRACKEVENTOBJ.healthStatusInfo.showTrend()
        expect(getTrackingObj).toHaveBeenCalled()
        expect(result).toEqual({ event: 'tracked' })
      })
      it('should call AIHubTrend correctly', () => {
        const result = TRACKEVENTOBJ.healthStatusInfo.AIHubTrend()
        expect(getTrackingObj).toHaveBeenCalled()
        expect(result).toEqual({ event: 'tracked' })
      })
      it('should call PIConnectivityTrend correctly', () => {
        const result = TRACKEVENTOBJ.healthStatusInfo.PIConnectivityTrend()
        expect(getTrackingObj).toHaveBeenCalled()
        expect(result).toEqual({ event: 'tracked' })
      })
    })
    describe('sustainabilityScorecard', () => {
      it('should call onSelectTab correctly', () => {
        const result = TRACKEVENTOBJ.sustainabilityScorecard.onSelectTab(
          'test-screen',
          'test-event',
          mockVals,
        )
        expect(getTrackingObj).toHaveBeenCalled()
        expect(result).toEqual({ event: 'tracked' })
      })
    })
    describe('contributorsInsightTable', () => {
      it('should call onSelectChange correctly', () => {
        const result = TRACKEVENTOBJ.contributorsInsightTable.onSelectChange(
          { display_name: 'test-display' },
          mockVals,
        )
        expect(getTrackingObj).toHaveBeenCalled()
        expect(result).toEqual({ event: 'tracked' })
      })
      it('should call onSelectTrendTab correctly', () => {
        const result = TRACKEVENTOBJ.contributorsInsightTable.onSelectTrendTab(
          'contributorTable',
          mockVals,
        )
        expect(getTrackingObj).toHaveBeenCalled()
        expect(result).toEqual({ event: 'tracked' })
      })
      it('should call keyTrendExpand correctly', () => {
        const result =
          TRACKEVENTOBJ.contributorsInsightTable.keyTrendExpand(mockVals)
        expect(getTrackingObj).toHaveBeenCalled()
        expect(result).toEqual({ event: 'tracked' })
      })
    })
    describe('sortingModal', () => {
      it('should call applyKPISorting correctly', () => {
        const result = TRACKEVENTOBJ.sortingModal.applyKPISorting({
          ...mockVals,
          type: 'test-type',
        })
        expect(getTrackingObj).toHaveBeenCalled()
        expect(result).toEqual({ event: 'tracked' })
      })
    })
    describe('monitoringTable', () => {
      it('should call handleTooltipModal correctly', () => {
        const result = TRACKEVENTOBJ.monitoringTable.handleTooltipModal(
          mockVals,
          { 10: 'test-value' },
        )
        expect(getTrackingObj).toHaveBeenCalled()
        expect(result).toEqual({ event: 'tracked' })
      })
    })
    describe('table', () => {
      it('should call handleTooltipModal correctly', () => {
        const result = TRACKEVENTOBJ.table.handleTooltipModal(
          mockVals,
          'test-category',
          { 7: 'test-value' },
        )
        expect(getTrackingObj).toHaveBeenCalled()
        expect(result).toEqual({ event: 'tracked' })
      })
    })
    describe('CollapsibleTable', () => {
      const rowData = {
        data: {
          affiliateName: 'test-affiliate',
          plantName: 'test-plant',
          systemName: 'test-system',
        },
      }
      it('should call handleImgCellClick correctly', () => {
        const result = TRACKEVENTOBJ.CollapsibleTable.handleImgCellClick(
          mockVals,
          'test-screen',
          rowData,
        )
        expect(getTrackingObj).toHaveBeenCalled()
        expect(result).toEqual({ event: 'tracked' })
      })
      it('should call handleImgPlusClick correctly', () => {
        const result = TRACKEVENTOBJ.CollapsibleTable.handleImgPlusClick(
          mockVals,
          'test-screen',
          rowData,
        )
        expect(getTrackingObj).toHaveBeenCalled()
        expect(result).toEqual({ event: 'tracked' })
      })
      it('should call handleTrendOpportunityPlant correctly', () => {
        const result =
          TRACKEVENTOBJ.CollapsibleTable.handleTrendOpportunityPlant(
            mockVals,
            rowData,
            true,
            'plant',
          )
        expect(getTrackingObj).toHaveBeenCalled()
        expect(result).toEqual({ event: 'tracked' })
      })
      it('should call handleTrendOpportunity correctly', () => {
        const result = TRACKEVENTOBJ.CollapsibleTable.handleTrendOpportunity(
          mockVals,
          rowData,
        )
        expect(getTrackingObj).toHaveBeenCalled()
        expect(result).toEqual({ event: 'tracked' })
      })
      it('should call generateUrlCell correctly', () => {
        const result = TRACKEVENTOBJ.CollapsibleTable.generateUrlCell(
          mockVals,
          true,
          'affiliate',
          rowData,
        )
        expect(getTrackingObj).toHaveBeenCalled()
        expect(result).toEqual({ event: 'tracked' })
      })
      it('should call handlePlantTrendOpportunity correctly', () => {
        const result =
          TRACKEVENTOBJ.CollapsibleTable.handlePlantTrendOpportunity(
            mockVals,
            true,
            'plant',
            rowData,
          )
        expect(getTrackingObj).toHaveBeenCalled()
        expect(result).toEqual({ event: 'tracked' })
      })
      it('should call handleSorting correctly', () => {
        const result = TRACKEVENTOBJ.CollapsibleTable.handleSorting(
          mockVals,
          'test-screen',
          { title: 'test-title' },
        )
        expect(getTrackingObj).toHaveBeenCalled()
        expect(result).toEqual({ event: 'tracked' })
      })
    })
    describe('ODS', () => {
      it('should call handleStartDateChange correctly', () => {
        const result = TRACKEVENTOBJ.ODS.handleStartDateChange(
          { ...mockVals, tabName: 'test-tab' },
          '2023-01-01',
        )
        expect(getTrackingObj).toHaveBeenCalled()
        expect(result).toEqual({ event: 'tracked' })
      })
      it('should call handleEndDateChange correctly', () => {
        const result = TRACKEVENTOBJ.ODS.handleEndDateChange(
          { ...mockVals, tabName: 'test-tab' },
          '2023-01-01',
        )
        expect(getTrackingObj).toHaveBeenCalled()
        expect(result).toEqual({ event: 'tracked' })
      })
      it('should call handleTrendIconClick correctly', () => {
        const result = TRACKEVENTOBJ.ODS.handleTrendIconClick(
          { ...mockVals, tabName: 'test-tab' },
          'test-request-id',
        )
        expect(getTrackingObj).toHaveBeenCalled()
        expect(result).toEqual({ event: 'tracked' })
      })
      it('should call handleAlertManageModal correctly', () => {
        const result = TRACKEVENTOBJ.ODS.handleAlertManageModal(
          { ...mockVals, tabName: 'test-tab' },
          { requestID: 'test-id', causeMessage: 'test-cause' },
        )
        expect(getTrackingObj).toHaveBeenCalled()
        expect(result).toEqual({ event: 'tracked' })
      })
      it('should call handleSystemChange correctly', () => {
        const result = TRACKEVENTOBJ.ODS.handleSystemChange(mockVals, {
          tag_name: 'test-tag',
        })
        expect(getTrackingObj).toHaveBeenCalled()
        expect(result).toEqual({ event: 'tracked' })
      })
      it('should call handleCategoryChange correctly', () => {
        const result = TRACKEVENTOBJ.ODS.handleCategoryChange(mockVals, {
          tag_name: 'test-tag',
        })
        expect(getTrackingObj).toHaveBeenCalled()
        expect(result).toEqual({ event: 'tracked' })
      })
      it('should call handleDeviationChange correctly', () => {
        const result = TRACKEVENTOBJ.ODS.handleDeviationChange(mockVals, {
          tag_name: 'test-tag',
        })
        expect(getTrackingObj).toHaveBeenCalled()
        expect(result).toEqual({ event: 'tracked' })
      })
    })
    describe('overviewODSTable', () => {
      it('should call handleAlertManageModal correctly', () => {
        const result = TRACKEVENTOBJ.overviewODSTable.handleAlertManageModal(
          mockVals,
          { requestID: 'test-id', causeMessage: 'test-cause' },
        )
        expect(getTrackingObj).toHaveBeenCalled()
        expect(result).toEqual({ event: 'tracked' })
      })
    })
    describe('serverSideTable', () => {
      it('should call onCellChange correctly', () => {
        const result = TRACKEVENTOBJ.serverSideTable.onCellChange(
          'test-field',
          'test-caller',
          'test-value',
          mockVals,
        )
        expect(getTrackingObj).toHaveBeenCalled()
        expect(result).toEqual({ event: 'tracked' })
      })
      it('should call columnOnClick correctly', () => {
        const result = TRACKEVENTOBJ.serverSideTable.columnOnClick(
          'test-caller',
          { sessionID: 'test-session' },
          mockVals,
        )
        expect(getTrackingObj).toHaveBeenCalled()
        expect(result).toEqual({ event: 'tracked' })
      })
      it('should call onSessionIdClick correctly', () => {
        const result = TRACKEVENTOBJ.serverSideTable.onSessionIdClick(
          'test-caller',
          'test-result',
          mockVals,
        )
        expect(getTrackingObj).toHaveBeenCalled()
        expect(result).toEqual({ event: 'tracked' })
      })
    })
    describe('RootLayout', () => {
      it('should call timeseriesPlots correctly', () => {
        const result = TRACKEVENTOBJ.RootLayout.timeseriesPlots(mockVals)
        expect(getTrackingObj).toHaveBeenCalled()
        expect(result).toEqual({ event: 'tracked' })
      })
      it('should call monitoringXYClick correctly', () => {
        const result = TRACKEVENTOBJ.RootLayout.monitoringXYClick(mockVals)
        expect(getTrackingObj).toHaveBeenCalled()
        expect(result).toEqual({ event: 'tracked' })
      })
    })

    describe('ActivityTrackerTab', () => {
      it('should call onSelectTab correctly', () => {
        const result = TRACKEVENTOBJ.ActivityTrackerTab.onSelectTab(
          mockVals,

          'test-event',
        )

        expect(getTrackingObj).toHaveBeenCalled()

        expect(result).toEqual({ event: 'tracked' })
      })
    })

    describe('affiliates', () => {
      it('should call onRegionChange correctly', () => {
        const result = TRACKEVENTOBJ.affiliates.onRegionChange(
          mockVals,

          { display_name: 'test-display' },
        )

        expect(getTrackingObj).toHaveBeenCalled()

        expect(result).toEqual({ event: 'tracked' })
      })

      it('should call onAffiliateChange correctly', () => {
        const result = TRACKEVENTOBJ.affiliates.onAffiliateChange(
          mockVals,

          { display_name: 'test-display' },
        )

        expect(getTrackingObj).toHaveBeenCalled()

        expect(result).toEqual({ event: 'tracked' })
      })
    })

    describe('SingleSelectAffiliateDropDowns', () => {
      it('should call handleAffiliateChange correctly', () => {
        const result =
          TRACKEVENTOBJ.SingleSelectAffiliateDropDowns.handleAffiliateChange(
            mockVals,

            'test-page',

            'test-title',

            { affiliate: 'test-affiliate' },
          )

        expect(getTrackingObj).toHaveBeenCalled()

        expect(result).toEqual({ event: 'tracked' })
      })

      it('should call handlePlantChange correctly', () => {
        const result =
          TRACKEVENTOBJ.SingleSelectAffiliateDropDowns.handlePlantChange(
            mockVals,

            'test-page',

            'test-title',

            { plant: 'test-plant' },
          )

        expect(getTrackingObj).toHaveBeenCalled()

        expect(result).toEqual({ event: 'tracked' })
      })

      it('should call handleSystemChange correctly', () => {
        const result =
          TRACKEVENTOBJ.SingleSelectAffiliateDropDowns.handleSystemChange(
            mockVals,

            'test-page',

            'test-title',

            { system: 'test-system' },
          )

        expect(getTrackingObj).toHaveBeenCalled()

        expect(result).toEqual({ event: 'tracked' })
      })
    })

    describe('sidebar', () => {
      it('should call DashboardBtnClick correctly', () => {
        const result = TRACKEVENTOBJ.sidebar.DashboardBtnClick(mockVals)

        expect(getTrackingObj).toHaveBeenCalled()

        expect(result).toEqual({ event: 'tracked' })
      })

      it('should call HealthCheckBtnClick correctly', () => {
        const result = TRACKEVENTOBJ.sidebar.HealthCheckBtnClick(mockVals)

        expect(getTrackingObj).toHaveBeenCalled()

        expect(result).toEqual({ event: 'tracked' })
      })

      it('should call FeaturesBtnClick correctly', () => {
        const result = TRACKEVENTOBJ.sidebar.FeaturesBtnClick(mockVals)

        expect(getTrackingObj).toHaveBeenCalled()

        expect(result).toEqual({ event: 'tracked' })
      })

      it('should call ErrorLoggingBtnClick correctly', () => {
        const result = TRACKEVENTOBJ.sidebar.ErrorLoggingBtnClick(mockVals)

        expect(getTrackingObj).toHaveBeenCalled()

        expect(result).toEqual({ event: 'tracked' })
      })

      it('should call ActivityTrackerBtnClick correctly', () => {
        const result = TRACKEVENTOBJ.sidebar.ActivityTrackerBtnClick(mockVals)

        expect(getTrackingObj).toHaveBeenCalled()

        expect(result).toEqual({ event: 'tracked' })
      })

      it('should call PerformanceTrackerBtnClick correctly', () => {
        const result =
          TRACKEVENTOBJ.sidebar.PerformanceTrackerBtnClick(mockVals)

        expect(getTrackingObj).toHaveBeenCalled()

        expect(result).toEqual({ event: 'tracked' })
      })

      it('should call WorkflowBtnClick correctly', () => {
        const result = TRACKEVENTOBJ.sidebar.WorkflowBtnClick(mockVals)

        expect(getTrackingObj).toHaveBeenCalled()

        expect(result).toEqual({ event: 'tracked' })
      })

      it('should call FavoriteListItemClick correctly', () => {
        const result = TRACKEVENTOBJ.sidebar.FavoriteListItemClick(
          mockVals,

          { title: 'test-title' },
        )

        expect(getTrackingObj).toHaveBeenCalled()

        expect(result).toEqual({ event: 'tracked' })
      })

      it('should call SabicBtnClick correctly', () => {
        const result = TRACKEVENTOBJ.sidebar.SabicBtnClick(mockVals)

        expect(getTrackingObj).toHaveBeenCalled()

        expect(result).toEqual({ event: 'tracked' })
      })

      it('should call AffiliatesBtnClick correctly', () => {
        const result = TRACKEVENTOBJ.sidebar.AffiliatesBtnClick(mockVals)

        expect(getTrackingObj).toHaveBeenCalled()

        expect(result).toEqual({ event: 'tracked' })
      })

      it('should call SubmenuAffiliateClick correctly', () => {
        const result = TRACKEVENTOBJ.sidebar.SubmenuAffiliateClick(
          mockVals,

          { name: 'test-name' },
        )

        expect(getTrackingObj).toHaveBeenCalled()

        expect(result).toEqual({ event: 'tracked' })
      })

      it('should call SubmenuPlantClick correctly', () => {
        const result = TRACKEVENTOBJ.sidebar.SubmenuPlantClick(
          mockVals,

          { name: 'test-affiliate' },

          { name: 'test-plant' },
        )

        expect(getTrackingObj).toHaveBeenCalled()

        expect(result).toEqual({ event: 'tracked' })
      })

      it('should call SubmenuSystemClick correctly', () => {
        const result = TRACKEVENTOBJ.sidebar.SubmenuSystemClick(
          mockVals,

          { name: 'test-affiliate' },

          { name: 'test-plant' },

          { name: 'test-system' },
        )

        expect(getTrackingObj).toHaveBeenCalled()

        expect(result).toEqual({ event: 'tracked' })
      })

      it('should call PlantsListClick correctly', () => {
        const result = TRACKEVENTOBJ.sidebar.PlantsListClick(
          mockVals,

          'test-obj',
        )

        expect(getTrackingObj).toHaveBeenCalled()

        expect(result).toEqual({ event: 'tracked' })
      })

      it('should call PlantDetailsClick correctly', () => {
        const result = TRACKEVENTOBJ.sidebar.PlantDetailsClick(
          mockVals,

          { name: 'test-affiliate' },

          { name: 'test-plant' },
        )

        expect(getTrackingObj).toHaveBeenCalled()

        expect(result).toEqual({ event: 'tracked' })
      })

      it('should call SystemOverviewClick correctly', () => {
        const result = TRACKEVENTOBJ.sidebar.SystemOverviewClick(
          mockVals,

          { name: 'test-affiliate' },

          { name: 'test-plant' },

          { name: 'test-system' },
        )

        expect(getTrackingObj).toHaveBeenCalled()

        expect(result).toEqual({ event: 'tracked' })
      })

      it('should call PlantBtnClick correctly', () => {
        const result = TRACKEVENTOBJ.sidebar.PlantBtnClick(mockVals)

        expect(getTrackingObj).toHaveBeenCalled()

        expect(result).toEqual({ event: 'tracked' })
      })

      it('should call PlantOptionsClick correctly', () => {
        const result = TRACKEVENTOBJ.sidebar.PlantOptionsClick(mockVals)

        expect(getTrackingObj).toHaveBeenCalled()

        expect(result).toEqual({ event: 'tracked' })
      })

      it('should call DownloadBtnClick correctly', () => {
        const result = TRACKEVENTOBJ.sidebar.DownloadBtnClick(mockVals)

        expect(getTrackingObj).toHaveBeenCalled()

        expect(result).toEqual({ event: 'tracked' })
      })

      it('should call plantlevelClick correctly', () => {
        const result = TRACKEVENTOBJ.sidebar.plantlevelClick(mockVals)

        expect(getTrackingObj).toHaveBeenCalled()

        expect(result).toEqual({ event: 'tracked' })
      })

      it('should call caselevelClick correctly', () => {
        const result = TRACKEVENTOBJ.sidebar.caselevelClick(mockVals)

        expect(getTrackingObj).toHaveBeenCalled()

        expect(result).toEqual({ event: 'tracked' })
      })

      it('should call OverviewClick correctly', () => {
        const result = TRACKEVENTOBJ.sidebar.OverviewClick(mockVals)

        expect(getTrackingObj).toHaveBeenCalled()

        expect(result).toEqual({ event: 'tracked' })
      })

      it('should call NetworkClick correctly', () => {
        const result = TRACKEVENTOBJ.sidebar.NetworkClick(mockVals)

        expect(getTrackingObj).toHaveBeenCalled()

        expect(result).toEqual({ event: 'tracked' })
      })

      it('should call OptimizationClick correctly', () => {
        const result = TRACKEVENTOBJ.sidebar.OptimizationClick(mockVals)

        expect(getTrackingObj).toHaveBeenCalled()

        expect(result).toEqual({ event: 'tracked' })
      })

      it('should call MonitoringBtnClick correctly', () => {
        const result = TRACKEVENTOBJ.sidebar.MonitoringBtnClick(mockVals)

        expect(getTrackingObj).toHaveBeenCalled()

        expect(result).toEqual({ event: 'tracked' })
      })

      it('should call EnergyManagementClick correctly', () => {
        const result = TRACKEVENTOBJ.sidebar.EnergyManagementClick(mockVals)

        expect(getTrackingObj).toHaveBeenCalled()

        expect(result).toEqual({ event: 'tracked' })
      })

      it('should call ConfigurationsClick correctly', () => {
        const result = TRACKEVENTOBJ.sidebar.ConfigurationsClick(mockVals)

        expect(getTrackingObj).toHaveBeenCalled()

        expect(result).toEqual({ event: 'tracked' })
      })

      it('should call DeleteBookmarkBtnClick correctly', () => {
        const result = TRACKEVENTOBJ.sidebar.DeleteBookmarkBtnClick(mockVals)

        expect(getTrackingObj).toHaveBeenCalled()

        expect(result).toEqual({ event: 'tracked' })
      })

      it('should call AddBookmarkBtnClick correctly', () => {
        const result = TRACKEVENTOBJ.sidebar.AddBookmarkBtnClick(mockVals)

        expect(getTrackingObj).toHaveBeenCalled()

        expect(result).toEqual({ event: 'tracked' })
      })

      it('should call DocumentationBtnClick correctly', () => {
        const result = TRACKEVENTOBJ.sidebar.DocumentationBtnClick(mockVals)

        expect(getTrackingObj).toHaveBeenCalled()

        expect(result).toEqual({ event: 'tracked' })
      })

      it('should call CaptureScreenPdfClick correctly', () => {
        const result = TRACKEVENTOBJ.sidebar.CaptureScreenPdfClick(mockVals)

        expect(getTrackingObj).toHaveBeenCalled()

        expect(result).toEqual({ event: 'tracked' })
      })

      it('should call CaptureScreenPngClick correctly', () => {
        const result = TRACKEVENTOBJ.sidebar.CaptureScreenPngClick(mockVals)

        expect(getTrackingObj).toHaveBeenCalled()

        expect(result).toEqual({ event: 'tracked' })
      })
    })

    describe('downloadCsvModal', () => {
      it('should call DownloadCsvBtnCaseLevel correctly', () => {
        const result = TRACKEVENTOBJ.downloadCsvModal.DownloadCsvBtnCaseLevel(
          mockVals,

          'test-page',

          'test-title',

          { system: 'test-system' },
        )

        expect(getTrackingObj).toHaveBeenCalled()

        expect(result).toEqual({ event: 'tracked' })
      })

      it('should call DownloadCsvBtnPlantLevel correctly', () => {
        const result = TRACKEVENTOBJ.downloadCsvModal.DownloadCsvBtnPlantLevel(
          mockVals,

          'test-page',

          'test-title',

          { system: 'test-system' },
        )

        expect(getTrackingObj).toHaveBeenCalled()

        expect(result).toEqual({ event: 'tracked' })
      })

      it('should call handleDateRangeSelect correctly', () => {
        const result = TRACKEVENTOBJ.downloadCsvModal.handleDateRangeSelect(
          mockVals,

          '2023-01-01',

          'test-range',
        )

        expect(getTrackingObj).toHaveBeenCalled()

        expect(result).toEqual({ event: 'tracked' })
      })

      it('should call handleAffiliateChange correctly', () => {
        const result = TRACKEVENTOBJ.downloadCsvModal.handleAffiliateChange(
          mockVals,

          { affiliate: 'test-affiliate' },
        )

        expect(getTrackingObj).toHaveBeenCalled()

        expect(result).toEqual({ event: 'tracked' })
      })

      it('should call handlePlantChange correctly', () => {
        const result = TRACKEVENTOBJ.downloadCsvModal.handlePlantChange(
          mockVals,

          [{ display_name: 'test-plant' }],
        )

        expect(getTrackingObj).toHaveBeenCalled()

        expect(result).toEqual({ event: 'tracked' })
      })

      it('should call DownloadCsvParentCheckBoxClick correctly', () => {
        const result =
          TRACKEVENTOBJ.downloadCsvModal.DownloadCsvParentCheckBoxClick(
            mockVals,
          )

        expect(getTrackingObj).toHaveBeenCalled()

        expect(result).toEqual({ event: 'tracked' })
      })

      it('should call DownloadCsvCheckBoxClick correctly', () => {
        const result = TRACKEVENTOBJ.downloadCsvModal.DownloadCsvCheckBoxClick(
          mockVals,

          'test-name',
        )

        expect(getTrackingObj).toHaveBeenCalled()

        expect(result).toEqual({ event: 'tracked' })
      })
    })

    describe('ecmFolderModal', () => {
      it('should call folderClick correctly', () => {
        const result = TRACKEVENTOBJ.ecmFolderModal.folderClick({
          ...mockVals,

          folderName: 'test-folder',
        })

        expect(getTrackingObj).toHaveBeenCalled()

        expect(result).toEqual({ event: 'tracked' })
      })

      it('should call internalFolderClick correctly', () => {
        const result = TRACKEVENTOBJ.ecmFolderModal.internalFolderClick({
          ...mockVals,

          folderName: 'test-folder',
        })

        expect(getTrackingObj).toHaveBeenCalled()

        expect(result).toEqual({ event: 'tracked' })
      })

      it('should call breadcrumbClick correctly', () => {
        const result = TRACKEVENTOBJ.ecmFolderModal.breadcrumbClick({
          ...mockVals,

          folderName: 'test-folder',
        })

        expect(getTrackingObj).toHaveBeenCalled()

        expect(result).toEqual({ event: 'tracked' })
      })

      it('should call fileDownloadClick correctly', () => {
        const result = TRACKEVENTOBJ.ecmFolderModal.fileDownloadClick({
          ...mockVals,

          fileName: 'test-file',

          fileId: 'test-id',

          system: 'test-system',
        })

        expect(getTrackingObj).toHaveBeenCalled()

        expect(result).toEqual({ event: 'tracked' })
      })
    })

    describe('onTrendClick', () => {
      it('should call onTrendClick correctly', () => {
        const result = TRACKEVENTOBJ.onTrendClick({
          ...mockVals,

          screenName: 'test-screen',

          isTrend: true,

          caseName: 'test-case',
        })

        expect(getTrackingObj).toHaveBeenCalled()

        expect(result).toEqual({ event: 'tracked' })
      })
    })

    describe('userAnalytics', () => {
      it('should call handleStartDateChange correctly', () => {
        const result = TRACKEVENTOBJ.userAnalytics.handleStartDateChange(
          mockVals,

          '2023-01-01',
        )

        expect(getTrackingObj).toHaveBeenCalled()

        expect(result).toEqual({ event: 'tracked' })
      })

      it('should call handleEndDateChange correctly', () => {
        const result = TRACKEVENTOBJ.userAnalytics.handleEndDateChange(
          mockVals,

          '2023-01-01',
        )

        expect(getTrackingObj).toHaveBeenCalled()

        expect(result).toEqual({ event: 'tracked' })
      })

      it('should call handleSearch correctly', () => {
        const result = TRACKEVENTOBJ.userAnalytics.handleSearch(
          mockVals,

          { employeeName: 'test-name' },
        )

        expect(getTrackingObj).toHaveBeenCalled()

        expect(result).toEqual({ event: 'tracked' })
      })
    })

    describe('userStatistics', () => {
      it('should call handleStartDateChange correctly', () => {
        const result = TRACKEVENTOBJ.userStatistics.handleStartDateChange(
          mockVals,

          '2023-01-01',
        )

        expect(getTrackingObj).toHaveBeenCalled()

        expect(result).toEqual({ event: 'tracked' })
      })

      it('should call handleEndDateChange correctly', () => {
        const result = TRACKEVENTOBJ.userStatistics.handleEndDateChange(
          mockVals,

          '2023-01-01',
        )

        expect(getTrackingObj).toHaveBeenCalled()

        expect(result).toEqual({ event: 'tracked' })
      })

      it('should call handleFilterChange correctly', () => {
        const result = TRACKEVENTOBJ.userStatistics.handleFilterChange(
          mockVals,

          { display_name: 'test-display' },

          'test-field',
        )

        expect(getTrackingObj).toHaveBeenCalled()

        expect(result).toEqual({ event: 'tracked' })
      })
    })

    describe('autoDelegation', () => {
      it('should call onSubmit correctly', () => {
        const result = TRACKEVENTOBJ.autoDelegation.onSubmit(mockVals)

        expect(getTrackingObj).toHaveBeenCalled()

        expect(result).toEqual({ event: 'tracked' })
      })
    })

    describe('network', () => {
      it('should call selectedplant correctly', () => {
        const result = TRACKEVENTOBJ.network.selectedplant(
          mockVals,

          { pageName: 'test-page' },
        )

        expect(getTrackingObj).toHaveBeenCalled()

        expect(result).toEqual({ event: 'tracked' })
      })

      it('should call EnterDeveloperModeClick correctly', () => {
        const result = TRACKEVENTOBJ.network.EnterDeveloperModeClick(mockVals)

        expect(getTrackingObj).toHaveBeenCalled()

        expect(result).toEqual({ event: 'tracked' })
      })

      it('should call ExitDeveloperModeClick correctly', () => {
        const result = TRACKEVENTOBJ.network.ExitDeveloperModeClick(mockVals)

        expect(getTrackingObj).toHaveBeenCalled()

        expect(result).toEqual({ event: 'tracked' })
      })

      it('should call SaveClick correctly', () => {
        const result = TRACKEVENTOBJ.network.SaveClick(mockVals)

        expect(getTrackingObj).toHaveBeenCalled()

        expect(result).toEqual({ event: 'tracked' })
      })

      it('should call ShowHandlesClick correctly', () => {
        const result = TRACKEVENTOBJ.network.ShowHandlesClick(mockVals)

        expect(getTrackingObj).toHaveBeenCalled()

        expect(result).toEqual({ event: 'tracked' })
      })

      it('should call HideHandlesClick correctly', () => {
        const result = TRACKEVENTOBJ.network.HideHandlesClick(mockVals)

        expect(getTrackingObj).toHaveBeenCalled()

        expect(result).toEqual({ event: 'tracked' })
      })

      it('should call NodesListBtnClick correctly', () => {
        const result = TRACKEVENTOBJ.network.NodesListBtnClick(
          mockVals,

          { name: 'test-node' },
        )

        expect(getTrackingObj).toHaveBeenCalled()

        expect(result).toEqual({ event: 'tracked' })
      })

      it('should call ConfigNodeApplyClick correctly', () => {
        const result = TRACKEVENTOBJ.network.ConfigNodeApplyClick(mockVals)

        expect(getTrackingObj).toHaveBeenCalled()

        expect(result).toEqual({ event: 'tracked' })
      })

      it('should call ConfigNodeCloseClick correctly', () => {
        const result = TRACKEVENTOBJ.network.ConfigNodeCloseClick(mockVals)

        expect(getTrackingObj).toHaveBeenCalled()

        expect(result).toEqual({ event: 'tracked' })
      })

      it('should call ConfigNodeDeleteClick correctly', () => {
        const result = TRACKEVENTOBJ.network.ConfigNodeDeleteClick(mockVals)

        expect(getTrackingObj).toHaveBeenCalled()

        expect(result).toEqual({ event: 'tracked' })
      })

      it('should call ConfigNodeLinkClick correctly', () => {
        const result = TRACKEVENTOBJ.network.ConfigNodeLinkClick(mockVals)

        expect(getTrackingObj).toHaveBeenCalled()

        expect(result).toEqual({ event: 'tracked' })
      })

      it('should call ConfigNodeUnlinkClick correctly', () => {
        const result = TRACKEVENTOBJ.network.ConfigNodeUnlinkClick(mockVals)

        expect(getTrackingObj).toHaveBeenCalled()

        expect(result).toEqual({ event: 'tracked' })
      })
    })

    describe('EmTopTiles', () => {
      it('should call onTileClick correctly', () => {
        const result = TRACKEVENTOBJ.EmTopTiles.onTileClick(
          mockVals,

          { title: 'test-title' },
        )

        expect(getTrackingObj).toHaveBeenCalled()

        expect(result).toEqual({ event: 'tracked' })
      })
    })

    describe('energyManagement', () => {
      it('should call handleStartDateChange correctly', () => {
        const result = TRACKEVENTOBJ.energyManagement.handleStartDateChange(
          mockVals,

          '2023-01-01',
        )

        expect(getTrackingObj).toHaveBeenCalled()

        expect(result).toEqual({ event: 'tracked' })
      })

      it('should call handleEndDateChange correctly', () => {
        const result = TRACKEVENTOBJ.energyManagement.handleEndDateChange(
          mockVals,

          '2023-01-01',
        )

        expect(getTrackingObj).toHaveBeenCalled()

        expect(result).toEqual({ event: 'tracked' })
      })

      it('should call selectedValue correctly', () => {
        const result = TRACKEVENTOBJ.energyManagement.selectedValue(
          mockVals,

          [{ name: 'test-plant' }],
        )

        expect(getTrackingObj).toHaveBeenCalled()

        expect(result).toEqual({ event: 'tracked' })
      })
    })

    describe('TPEnergyConsumption', () => {
      it('should call onTabClick correctly', () => {
        const result = TRACKEVENTOBJ.TPEnergyConsumption.onTabClick(
          mockVals,

          'test-tab',
        )

        expect(getTrackingObj).toHaveBeenCalled()

        expect(result).toEqual({ event: 'tracked' })
      })
    })

    describe('EGCostIndex', () => {
      it('should call onTabClick correctly', () => {
        const result = TRACKEVENTOBJ.EGCostIndex.onTabClick(
          mockVals,

          'test-tab',
        )

        expect(getTrackingObj).toHaveBeenCalled()

        expect(result).toEqual({ event: 'tracked' })
      })
    })

    //end
  })
})
