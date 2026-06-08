import '@testing-library/jest-dom'
import { act, fireEvent, render, screen } from '@testing-library/react'
import * as tracker from 'config/ActivityTrackerConfig'
import { useAtomValue } from 'jotai'
import {
  useLocation,
  useNavigate,
  useOutletContext,
  useParams,
} from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import CaseConfigurationPortal from './CaseConfigurationPortal_EO'

vi.mock('react-router-dom')
vi.mock('components/elements/performance_log/PerformanceLog', () => ({
  default: ({ children }) => <div>{children}</div>,
}))
vi.mock('./CCP/CCP', () => ({
  default: () => <div>Mocked CCP</div>,
}))
vi.mock('./ccp_tags/tagDetails', () => ({
  default: () => <div>Mocked TagDetails</div>,
}))
vi.mock('./optimizer/Optimizer', () => ({
  default: () => <div>Mocked Optimizer</div>,
}))
vi.mock('./suggestion/Suggestion', () => ({
  default: () => <div>Mocked Suggestion</div>,
}))
// Will override in each test

vi.mock(import('jotai'), async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    useAtomValue: vi.fn(),
    fetchAndSaveValidationData: vi.fn(),
  }
})

describe('CaseConfigurationPortal_EO', () => {
  const mockNavigate = vi.fn()
  beforeEach(() => {
    vi.clearAllMocks()
    useOutletContext.mockReturnValue({ caseId: '123', affiliateId: '456' })
    useNavigate.mockReturnValue(mockNavigate)
    useAtomValue.mockImplementation((atom) => {
      if (atom.toString().includes('TokenAtom')) {
        return { canAccessDeveloper: () => true }
      }
      if (atom.toString().includes('AppAtom')) {
        return { caseData: [] }
      }
      return null
    })
  })

  it('renders with default selected tab (tag-details)', () => {
    useParams.mockReturnValue({ CCPKey: 'tag-details' })
    useLocation.mockReturnValue({
      pathname: '/app/case/configurations/tag-details',
    })
    render(<CaseConfigurationPortal />)
    expect(screen.getByText('Mocked TagDetails')).toBeInTheDocument()
  })

  it('renders CCP tab content when selectedTab is ccp', () => {
    useParams.mockReturnValue({ CCPKey: 'ccp' })
    useLocation.mockReturnValue({ pathname: '/app/case/configurations/ccp' })
    render(<CaseConfigurationPortal />)
    expect(screen.getByText('Mocked CCP')).toBeInTheDocument()
  })

  it('renders Optimizer tab content when selectedTab is optimizer', () => {
    useParams.mockReturnValue({ CCPKey: 'optimizer' })
    useLocation.mockReturnValue({
      pathname: '/app/case/configurations/optimizer',
    })
    render(<CaseConfigurationPortal />)
    expect(screen.getByText('Mocked Optimizer')).toBeInTheDocument()
  })

  it('renders Suggestion tab content when selectedTab is suggestion', () => {
    useParams.mockReturnValue({ CCPKey: 'suggestion' })
    useLocation.mockReturnValue({
      pathname: '/app/case/configurations/suggestion',
    })
    render(<CaseConfigurationPortal />)
    expect(screen.getByText('Mocked Suggestion')).toBeInTheDocument()
  })

  it('tracks tab change event and navigates on tab select', () => {
    const trackSpy = vi.spyOn(tracker.TRACKEVENTOBJ.CCP, 'onTabChange')
    useParams.mockReturnValue({ CCPKey: 'tag-details' })
    useLocation.mockReturnValue({
      pathname: '/app/case/configurations/tag-details',
    })
    render(<CaseConfigurationPortal />)
    const optimizerTab = screen.getByRole('tab', { name: /optimizer/i })
    fireEvent.click(optimizerTab)
    expect(trackSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        eventKey: 'optimizer',
        params: expect.anything(),
        caseData: [],
      }),
    )
    expect(mockNavigate).toHaveBeenCalledWith(
      '/app/case/configurations/optimizer/variables',
    )
  })

  it('responds to param change and re-renders selected tab', async () => {
    useParams.mockReturnValue({ CCPKey: 'ccp' })
    useLocation.mockReturnValue({ pathname: '/app/case/configurations/ccp' })
    const { rerender } = render(<CaseConfigurationPortal />)
    expect(screen.getByText('Mocked CCP')).toBeInTheDocument()
    useParams.mockReturnValue({ CCPKey: 'optimizer' })
    useLocation.mockReturnValue({
      pathname: '/app/case/configurations/optimizer',
    })
    await act(() => rerender(<CaseConfigurationPortal />))
    expect(screen.getByText('Mocked Optimizer')).toBeInTheDocument()
  })
})

// describe('fetchAndSaveValidationData', () => {
//   const mockSetValidationData = vi.fn();
//   const mockGetTagsDataForValidation = vi.fn();
//   const fetchAndSaveValidationData  = vi.fn();
//   beforeEach(() => {
//     vi.clearAllMocks();
//   });

//   it('sets parsed validation data when API returns data', async () => {
//     const mockData = {
//       data: [
//         { tagName: 'Tag1', value: '10.5' },
//         { tagName: 'Tag2', value: '20' },
//         { tagName: 'Tag3', value: null }, // Should be skipped
//       ],
//     };
//     mockGetTagsDataForValidation.mockResolvedValue(mockData);
//     await fetchAndSaveValidationData('case-123', mockSetValidationData, mockGetTagsDataForValidation);
//     expect(mockSetValidationData).toHaveBeenCalledWith({
//       Tag1: 10.5,
//       Tag2: 20,
//     });
//   });

//   it('sets empty object when API returns no data', async () => {
//     mockGetTagsDataForValidation.mockResolvedValue({ data: [] });
//     await fetchAndSaveValidationData('case-123', mockSetValidationData, mockGetTagsDataForValidation);
//     expect(mockSetValidationData).toHaveBeenCalledWith({});
//   });

//   it('sets empty object when API returns undefined', async () => {
//     mockGetTagsDataForValidation.mockResolvedValue(undefined);
//     await fetchAndSaveValidationData('case-123', mockSetValidationData, mockGetTagsDataForValidation);
//     expect(mockSetValidationData).toHaveBeenCalledWith({});
//   });

// });
