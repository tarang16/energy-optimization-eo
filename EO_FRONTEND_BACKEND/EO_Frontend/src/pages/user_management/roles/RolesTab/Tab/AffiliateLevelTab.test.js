import '@testing-library/jest-dom'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { processAffiliateData } from 'pages/AFFILIATES_DROPDOWNS/SingleSelect/SingleSelectAffiliateDropDowns.function'
import {
  deleteUserClaim,
  getUserManagementRoleByAffiliateId,
} from 'services/AccountServices'
import { getUsersByIdNameEmail } from 'services/ConfigServices'
import { describe, expect, it, vi } from 'vitest'
import { AffiliateLevelTab } from './AffiliateLevelTab'

vi.mock(
  import('pages/AFFILIATES_DROPDOWNS/SingleSelect/SingleSelectAffiliateDropDowns.function'),
  async (importOriginal) => {
    const actual = await importOriginal()
    return {
      ...actual,
      processAffiliateData: vi.fn(),
    }
  },
)
vi.mock(import('services/AccountServices'), async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    getUserManagementRoleByAffiliateId: vi.fn(),
    deleteUserClaim: vi.fn(),
  }
})
vi.mock(import('services/ConfigServices'), async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    getUsersByIdNameEmail: vi.fn(),
  }
})

const mockData = [
  {
    display_name: 'Choose any Affiliate',
    tag_name: 'Choose any Affiliate',
  },
  {
    display_name: 'UNITED',
    tag_name: 'UNITED',
    regionName: 'MIDDLE EAST',
    affiliate: 'UNITED',
    affiliate_code: 2200,
    caseID: '1',
    affiliateID: 10,
  },
]

const mockData2 = [
  {
    claimId: 883,
    claimType: 'affiliate',
    claimValue: '10',
    employeeId: 30768424,
    employeeName: 'Satyam,Sharma',
    firstName: 'Satyam',
    lastName: 'Sharma',
    email: 'SharmaSa@SABIC.com',
    roleName: 'admin',
    roleNormalizedName: 'ADMIN',
    affiliateCode: '2200',
    affiliateId: 10,
    affiliateName: 'UNITED',
  },
  {
    claimId: 889,
    claimType: 'affiliate',
    claimValue: '10',
    employeeId: 30774130,
    employeeName: 'Rahul,Agarwal',
    firstName: 'Rahul',
    lastName: 'Agarwal',
    email: 'AgarwalR@SABIC.com',
    roleName: 'admin',
    roleNormalizedName: 'ADMIN',
    affiliateCode: '1400',
    affiliateId: 20,
    affiliateName: 'ARRAZI',
  },
  {
    claimId: 898,
    claimType: 'affiliate',
    claimValue: '10',
    employeeId: 30752284,
    employeeName: 'Gharai, Shankhadeep',
    firstName: 'Shankhadeep',
    lastName: 'Gharai',
    email: 'GharaiS@SABIC.com',
    roleName: 'admin',
    roleNormalizedName: 'ADMIN',
    affiliateCode: '1000',
    affiliateId: null,
    affiliateName: 'SABIC',
  },
  {
    claimId: 899,
    claimType: 'affiliate',
    claimValue: '10',
    employeeId: 30761332,
    employeeName: 'Lalge, Sachin',
    firstName: 'Sachin ',
    lastName: 'Lalge',
    email: 'LalgeS@SABIC.com',
    roleName: 'admin',
    roleNormalizedName: 'ADMIN',
    affiliateCode: '1000',
    affiliateId: null,
    affiliateName: 'SABIC',
  },
]

const addUserData = {
  data: [
    {
      employeeName: 'abcddef',
      employeeID: 13863,
      email: 'abc@sabic.com',
      affiliateName: 'HADEED',
    },
    {
      employeeName: 'ghij jkl',
      employeeID: 2006008,
      email: 'ghi@sabic-hpp.com',
      affiliateName: 'SABIC IP India Pvt. Ltd.',
    },
    {
      employeeName: 'mnop pqr',
      employeeID: 30011304,
      email: 'mno@SABIC.com',
      affiliateName: 'SABIC',
    },
  ],
}

describe('CorporateTab Component', () => {
  it('first render without error', async () => {
    await act(async () => {
      processAffiliateData.mockReturnValue({
        obj: {},
        affiliateDropDownArray: mockData,
      })
      render(
        <AffiliateLevelTab
          pageKey='dashboard'
          title='Affiliate Level'
          claimType='affiliate'
          info='This page lists all users who have access to specific affiliates, selected from the drop-down menu. Admins can use this page to grant or revoke affiliate-level access to the concerned affiliate.'
          role='affiliatelevel'
        />,
      )
    })
  })

  it('handle affiliate search', async () => {
    await act(async () => {
      processAffiliateData.mockReturnValue({
        obj: {},
        affiliateDropDownArray: mockData,
      })
      render(
        <AffiliateLevelTab
          pageKey='dashboard'
          title='Affiliate Level'
          claimType='affiliate'
          info='This page lists all users who have access to specific affiliates, selected from the drop-down menu. Admins can use this page to grant or revoke affiliate-level access to the concerned affiliate.'
          role='affiliatelevel'
        />,
      )
    })

    const affiliateSearchInput = await screen.findByTestId(
      'Affiliate-search-bar',
    )
    fireEvent.change(affiliateSearchInput, { target: { value: 'abhijit' } })
    expect(affiliateSearchInput.value).toBe('abhijit')
  })

  it('handle affiliate dropdown', async () => {
    await act(async () => {
      processAffiliateData.mockReturnValue({
        obj: {},
        affiliateDropDownArray: mockData,
      })
      getUserManagementRoleByAffiliateId.mockReturnValue({ data: mockData2 })
      render(
        <AffiliateLevelTab
          pageKey='dashboard'
          title='Affiliate Level'
          claimType='affiliate'
          info='This page lists all users who have access to specific affiliates, selected from the drop-down menu. Admins can use this page to grant or revoke affiliate-level access to the concerned affiliate.'
          role='affiliatelevel'
        />,
      )
    })

    const affiliateDropDown = await screen.findByTestId('single-select-click')
    fireEvent.click(affiliateDropDown)
    fireEvent.click(screen.getByText('UNITED'))
  })

  it('handle add user', async () => {
    getUsersByIdNameEmail.mockResolvedValue(addUserData)
    await act(async () => {
      processAffiliateData.mockReturnValue({
        obj: {},
        affiliateDropDownArray: mockData,
      })
      render(
        <AffiliateLevelTab
          pageKey='dashboard'
          title='Affiliate Level'
          claimType='affiliate'
          info='This page lists all users who have access to specific affiliates, selected from the drop-down menu. Admins can use this page to grant or revoke affiliate-level access to the concerned affiliate.'
          role='affiliatelevel'
        />,
      )
    })

    fireEvent.change(
      screen.getByTestId('searchBarID').querySelector('.react-select__input'),
      {
        target: { value: 'abcd' },
      },
    )

    fireEvent.keyDown(
      screen.getByTestId('searchBarID').querySelector('.react-select__input'),
      {
        key: 'Enter',
      },
    )
    const addUserBtn = await screen.findByTestId('add-button-roles-tab')
    fireEvent.click(addUserBtn)
  })

  it('handle delete user', async () => {
    window.confirm = vi.fn(() => true)
    deleteUserClaim.mockResolvedValue({ statuscode: 200 })
    await act(async () => {
      processAffiliateData.mockReturnValue({
        obj: {},
        affiliateDropDownArray: mockData,
      })
      getUserManagementRoleByAffiliateId.mockReturnValue({ data: mockData2 })
      render(
        <AffiliateLevelTab
          pageKey='dashboard'
          title='Affiliate Level'
          claimType='affiliate'
          info='This page lists all users who have access to specific affiliates, selected from the drop-down menu. Admins can use this page to grant or revoke affiliate-level access to the concerned affiliate.'
          role='affiliatelevel'
        />,
      )
    })

    const affiliateDropDown = await screen.findByTestId('single-select-click')
    fireEvent.click(affiliateDropDown)
    fireEvent.click(screen.getByText('UNITED'))

    const deleteBtn = await screen.findAllByTestId('deleteButtonAffiliateLevel')
    fireEvent.click(deleteBtn[0])
  })
})
