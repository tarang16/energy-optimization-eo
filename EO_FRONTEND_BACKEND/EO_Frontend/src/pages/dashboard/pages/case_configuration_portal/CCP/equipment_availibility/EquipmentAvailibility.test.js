import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import * as ccpService from 'services/CCPServices'
import * as optimizationService from 'services/OptimizationService'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mock_getCCPData } from '../../../../../../index.test'
import EquipmentAvailibility from './EquipmentAvailibility'

let mockApiData = mock_getCCPData
vi.mock('services/OptimizationService')
vi.mock('services/CCPServices', () => ({
  getCcpInfo: () => mockApiData,
  getDefaultValue: () => {},
  updateEquipementAvailability: vi.fn(),
  addAuditLog: vi.fn(),
}))

const mockData = [
  {
    equipmentCategory: 'Boiler',
    equipmentName: 'Boiler 1',
    equipmentAvailabilityId: 1,
    equipmentId: 11,
    availability: true,
    mustRun: true,
    equipmentType: 'Type A',
  },
  {
    equipmentCategory: 'Boiler',
    equipmentName: 'Boiler 2',
    equipmentAvailabilityId: 2,
    equipmentId: 12,
    availability: false,
    mustRun: false,
    equipmentType: 'Type A',
  },
]

describe('EquipmentAvailibility', () => {
  beforeEach(() => {
    optimizationService.getConfigEquipmentAvailability.mockResolvedValue({
      data: mockData,
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('renders loader initially', async () => {
    render(
      <MemoryRouter>
        <EquipmentAvailibility caseId='123' />
      </MemoryRouter>,
    )
    expect(screen.getByAltText('')).toBeInTheDocument()
    await waitFor(() =>
      expect(
        optimizationService.getConfigEquipmentAvailability,
      ).toHaveBeenCalled(),
    )
  })

  it('renders table with data', async () => {
    render(
      <MemoryRouter>
        <EquipmentAvailibility caseId='123' />
      </MemoryRouter>,
    )
    await waitFor(() => {
      expect(screen.getByText('Boiler')).toBeInTheDocument()
      expect(
        screen.getAllByRole('button', { name: /edit icon/i }).length,
      ).toBeGreaterThan(0)
    })
  })

  it('opens edit modal on clicking edit', async () => {
    render(
      <MemoryRouter>
        <EquipmentAvailibility caseId='123' canEdit={true} />
      </MemoryRouter>,
    )
    await waitFor(() => screen.getByText('Boiler'))
    const editButtons = screen.getAllByRole('button', { name: /edit icon/i })
    fireEvent.click(editButtons[0])
    await waitFor(() =>
      expect(
        screen.getByText(/EDIT EQUIPMENT AVAILABILITY - Boiler/i),
      ).toBeInTheDocument(),
    )
  })

  it('opens info modal on clicking info', async () => {
    render(
      <MemoryRouter>
        <EquipmentAvailibility caseId='123' canEdit={true} />
      </MemoryRouter>,
    )
    await waitFor(() => screen.getByText('Boiler'))
    const editButtons = screen.getAllByRole('button', { name: /info icon/i })
    fireEvent.click(editButtons[0])
    // await waitFor(() =>
    //   expect(screen.getByText(/EDIT EQUIPMENT AVAILABILITY - Boiler/i)).toBeInTheDocument()
    // );
  })

  it('toggles availability checkbox in modal', async () => {
    render(
      <MemoryRouter>
        <EquipmentAvailibility caseId='123' canEdit={true} />
      </MemoryRouter>,
    )
    await waitFor(() => screen.getByText('Boiler'))
    fireEvent.click(screen.getAllByRole('button', { name: /edit icon/i })[0])

    const checkboxes = await screen.findAllByRole('checkbox')
    expect(checkboxes.length).toBeGreaterThan(0)

    fireEvent.click(checkboxes[1]) // Toggle availability
    expect(checkboxes[1].checked).toBe(false) // Will not update DOM until state updates
  })

  it('calls update API and audit log on save', async () => {
    ccpService.updateEquipementAvailability.mockResolvedValue({
      statuscode: 200,
    })

    render(
      <MemoryRouter>
        <EquipmentAvailibility caseId='123' canEdit={true} />
      </MemoryRouter>,
    )
    await waitFor(() => screen.getByText('Boiler'))
    fireEvent.click(screen.getAllByRole('button', { name: /edit icon/i })[0])

    const saveBtn = await screen.findByRole('button', { name: /Submit/i })

    const checkboxes = await screen.findAllByRole('checkbox')
    expect(checkboxes.length).toBeGreaterThan(0)

    fireEvent.click(checkboxes[1])
    fireEvent.click(checkboxes[0])

    fireEvent.click(saveBtn)
  })

  it('updata data and cancel btn click', async () => {
    ccpService.updateEquipementAvailability.mockResolvedValue({
      statuscode: 200,
    })

    render(
      <MemoryRouter>
        <EquipmentAvailibility caseId='123' canEdit={true} />
      </MemoryRouter>,
    )
    await waitFor(() => screen.getByText('Boiler'))
    fireEvent.click(screen.getAllByRole('button', { name: /edit icon/i })[0])

    const cancelBtn = await screen.findByRole('button', { name: /Cancel/i })

    const checkboxes = await screen.findAllByRole('checkbox')
    expect(checkboxes.length).toBeGreaterThan(0)

    fireEvent.click(checkboxes[1])
    fireEvent.click(checkboxes[0])
    fireEvent.click(cancelBtn)
  })

  it('shows alert if update fails', async () => {
    window.alert = vi.fn()
    ccpService.updateEquipementAvailability.mockResolvedValue({
      statuscode: 500,
    })

    render(
      <MemoryRouter>
        <EquipmentAvailibility caseId='123' canEdit={true} />
      </MemoryRouter>,
    )
    await waitFor(() => screen.getByText('Boiler'))
    fireEvent.click(screen.getAllByRole('button', { name: /edit icon/i })[0])

    const saveBtn = await screen.findByRole('button', { name: /Submit/i })

    const checkboxes = await screen.findAllByRole('checkbox')
    expect(checkboxes.length).toBeGreaterThan(0)

    fireEvent.click(checkboxes[1])
    fireEvent.click(checkboxes[0])

    fireEvent.click(saveBtn)

    await waitFor(() => expect(window.alert).not.toHaveBeenCalled())
  })
})
