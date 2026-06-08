import '@testing-library/jest-dom'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import CCP from './CCP'

vi.mock('./price_input/PriceInput', () => ({
  default: () => <div>Mock PriceInput</div>,
}))
vi.mock('./equipment_availibility/EquipmentAvailibility', () => ({
  default: () => <div>Mock EquipmentAvailibility</div>,
}))
vi.mock('../CCPTabsV2', () => ({
  default: () => <div>Mock CCPTabsV2</div>,
}))
vi.mock('../Macros/Macros', () => ({
  default: () => <div>Mock Macros</div>,
}))
vi.mock('./seu_details/SeuDetails', () => ({
  default: () => <div>Mock SeuDetails</div>,
}))
vi.mock('./sub_model/SubModel', () => ({
  default: () => <div>Mock SubModel</div>,
}))
vi.mock('./sub_model_parameter/SubModelParameter', () => ({
  default: () => <div>Mock SubModel Parameter</div>,
}))

describe('CCP Component', () => {
  const setup = (initialPath = '/test/configurations/ccp/price_input') => {
    return render(
      <MemoryRouter initialEntries={[initialPath]}>
        <Routes>
          <Route
            path='/test/configurations/ccp/:subCCPKey'
            element={<CCP caseId='123' canEdit={true} />}
          />
          <Route
            path='/test/configurations/ccp'
            element={<CCP caseId='123' canEdit={true} />}
          />
        </Routes>
      </MemoryRouter>,
    )
  }

  it('should redirect to price_input if no subCCPKey is in the URL', async () => {
    setup('/test/configurations/ccp')
    await waitFor(() => {
      expect(screen.getByText('Mock PriceInput')).toBeInTheDocument()
    })
  })

  it('should render PriceInput tab content when price_input is selected', () => {
    setup('/test/configurations/ccp/price_input')
    expect(screen.getByText('Mock PriceInput')).toBeInTheDocument()
  })

  it('should render EquipmentAvailibility tab when equipment_availibility is selected', () => {
    setup('/test/configurations/ccp/equipment_availibility')
    expect(screen.getByText('Mock EquipmentAvailibility')).toBeInTheDocument()
  })

  it('should render Macros tab when macros is selected', () => {
    setup('/test/configurations/ccp/macros')
    expect(screen.getByText('Mock Macros')).toBeInTheDocument()
  })

  it('should render SeuDetails tab when seuDetails is selected', () => {
    setup('/test/configurations/ccp/seuDetails')
    expect(screen.getByText('Mock SeuDetails')).toBeInTheDocument()
  })

  it('should render SubModel tab when subModel is selected', () => {
    setup('/test/configurations/ccp/subModel')
    expect(screen.getByText('Mock SubModel')).toBeInTheDocument()
  })
  it('should render SubModelParamter tab when subModelParameter is selected', () => {
    setup('/test/configurations/ccp/subModelParameter')
    expect(screen.getByText('Mock SubModel Parameter')).toBeInTheDocument()
  })

  it('should render CCPTabsV2 tab when model is selected', () => {
    setup('/test/configurations/ccp/model')
    expect(screen.getByText('Mock CCPTabsV2')).toBeInTheDocument()
  })

  // it("should call TRACKEVENTOBJ.CCP.onTabChange on tab switch", async () => {
  //     const trackSpy = vi.spyOn(tracker.TRACKEVENTOBJ.CCP, "onTabChange");
  //     setup("/test/configurations/ccp/price_input");
  //     fireEvent.click(screen.getByRole("button", { name: /equipment availibility/i }));
  //     await waitFor(() => {
  //         expect(trackSpy).toHaveBeenCalledWith(expect.objectContaining({ eventKey: "equipment_availibility" }));
  //     });
  // });

  it('renders correctly with default props (caseId=null, canEdit=false)', async () => {
    render(
      <MemoryRouter initialEntries={['/test/configurations/ccp/price_input']}>
        <Routes>
          <Route path='/test/configurations/ccp/:subCCPKey' element={<CCP />} />
        </Routes>
      </MemoryRouter>,
    )

    // Should still render PriceInput even with default props
    await waitFor(() => {
      expect(screen.getByText('Mock PriceInput')).toBeInTheDocument()
    })
  })
})
