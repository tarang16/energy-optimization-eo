import '@testing-library/jest-dom'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { downloadFromEcm } from 'services/EcmServices'
import { convertBase64ToStr } from 'utills/utilities'
import { describe, it, vi } from 'vitest'
import { mock_downloadFromEcm } from '../../../../index.test'
import WorkflowActivity from './WorkflowActivity'

let mockData = mock_downloadFromEcm
vi.mock('services/EcmServices', () => ({
  downloadFromEcm: vi.fn(),
}))

vi.mock('utills/utilities', () => ({
  convertBase64ToStr: vi.fn(),
  convertFormulaToHtml: vi.fn((html) => html),
  uuid4: vi.fn(() => 'mock-uuid'),
}))

describe('WorkflowActivity', () => {
  it('renders without crashing', () => {
    const ODSWorkflowLogs = [
      {
        createdOn: '2022-03-18T10:00:00Z',
        email: 'test@example.com',
        employeeName: 'John Doe',
        roleName: 'Manager',
        comments: 'Test comment',
        action: 'Approval',
        attachments: [
          { attachmentName: 'file.txt', attachmentUrl: '/file.txt' },
          { attachmentUrl: '/file.txt' },
        ],
      },
    ]
    const odsAssigneeData = {
      email: 'test@example.com',
      employeeName: 'Jane Smith',
      roleName: 'Employee',
      status: 'Pending',
    }
    render(
      <WorkflowActivity
        ODSWorkflowLogs={ODSWorkflowLogs}
        odsAssigneeData={odsAssigneeData}
      />,
    )
    const downloadIcon = screen.getAllByAltText('workflow-download-icon')
    fireEvent.click(downloadIcon[0])
  })

  it('renders with attachment without filestram', () => {
    act(() => {
      mockData = {
        data: {
          fileName: 'alert status.pdf',
          message: 'File content fetched successfully from ecm.',
        },
        errormsg: '',
        statuscode: 200,
      }
    })
    const ODSWorkflowLogs = [
      {
        createdOn: '2022-03-18T10:00:00Z',
        email: 'test@example.com',
        employeeName: 'John Doe',
        roleName: 'Manager',
        comments: 'Test comment',
        action: 'Approval',
        attachments: [
          { attachmentName: 'file.txt', attachmentUrl: '/file.txt' },
          { attachmentUrl: '/file.txt' },
        ],
      },
    ]
    const odsAssigneeData = {
      email: 'test@example.com',
      employeeName: 'Jane Smith',
      roleName: 'Employee',
      status: 'Pending',
    }
    render(
      <WorkflowActivity
        ODSWorkflowLogs={ODSWorkflowLogs}
        odsAssigneeData={odsAssigneeData}
      />,
    )
    const downloadIcon = screen.getAllByAltText('workflow-download-icon')
    fireEvent.click(downloadIcon[0])
  })

  it('renders with null Data', () => {
    const ODSWorkflowLogs = []
    const odsAssigneeData = null
    render(
      <WorkflowActivity
        ODSWorkflowLogs={ODSWorkflowLogs}
        odsAssigneeData={odsAssigneeData}
      />,
    )
  })

  it('renders with without odsAssigneeData Data', () => {
    const ODSWorkflowLogs = []
    const odsAssigneeData = null
    render(
      <WorkflowActivity
        ODSWorkflowLogs={ODSWorkflowLogs}
        odsAssigneeData={undefined}
      />,
    )
  })

  it('renders image with fallback source on error', () => {
    const ODSWorkflowLogs = [
      {
        createdOn: '2022-03-18T10:00:00Z',
        email: null,
        employeeName: null,
        roleName: 'Manager',
        comments: 'Test comment',
        action: 'Approval',
        attachments: [{ attachmentName: 'file.txt' }],
      },
    ]
    const odsAssigneeData = {
      email: null,
      employeeName: null,
      roleName: 'Employee',
      status: 'Pending',
    }
    const { container } = render(
      <WorkflowActivity
        ODSWorkflowLogs={ODSWorkflowLogs}
        odsAssigneeData={odsAssigneeData}
      />,
    )
    const img = container.querySelector('img')
    const mockErrorEvent = new Event('error')
    img.dispatchEvent(mockErrorEvent)
  })

  it('renders image with fallback source on error', () => {
    const odsAssigneeData = {
      email: 'test@example.com',
      employeeName: 'Jane Smith',
      roleName: 'Employee',
      status: 'Pending',
    }
    const { container } = render(
      <WorkflowActivity
        odsAssigneeData={odsAssigneeData}
        ODSWorkflowLogs={undefined}
      />,
    )
    const img = container.querySelector('img')
    const mockErrorEvent = new Event('error')
    img.dispatchEvent(mockErrorEvent)
  })

  it('handles file download successfully', async () => {
    const mockFileId = '/file.txt'
    const ODSWorkflowLogs = [
      {
        createdOn: '2022-03-18T10:00:00Z',
        email: 'test@example.com',
        employeeName: 'John Doe',
        roleName: 'Manager',
        comments: 'Test comment',
        action: 'Approval',
        attachments: [
          { attachmentName: 'file.txt', attachmentUrl: mockFileId },
        ],
      },
    ]
    downloadFromEcm.mockResolvedValue({
      data: {
        fileStream: 'SGVsbG8gd29ybGQ=',
        fileName: 'file.txt',
      },
    })
    convertBase64ToStr.mockReturnValue('Hello world')
    global.URL.createObjectURL = vi.fn(() => 'mockObjectURL')
    render(
      <WorkflowActivity
        ODSWorkflowLogs={ODSWorkflowLogs}
        odsAssigneeData={undefined}
      />,
    )
    const downloadIcon = screen.getByAltText('workflow-download-icon')
    await act(async () => {
      fireEvent.click(downloadIcon)
    })
  })

  it('handles error when downloading the file', async () => {
    const mockFileId = '/file.txt'
    const ODSWorkflowLogs = [
      {
        createdOn: '2022-03-18T10:00:00Z',
        email: 'test@example.com',
        employeeName: 'John Doe',
        roleName: 'Manager',
        comments: 'Test comment',
        action: 'Approval',
        attachments: [
          { attachmentName: 'file.txt', attachmentUrl: mockFileId },
        ],
      },
    ]
    downloadFromEcm.mockRejectedValue(new Error('Download failed'))
    render(
      <WorkflowActivity
        ODSWorkflowLogs={ODSWorkflowLogs}
        odsAssigneeData={undefined}
      />,
    )
    const downloadIcon = screen.getByAltText('workflow-download-icon')
    await act(async () => {
      fireEvent.click(downloadIcon)
    })
    // expect(downloadFromEcm).toHaveBeenCalledWith(mockFileId);
    // expect(global.URL.createObjectURL).not.toHaveBeenCalled();
  })
})
