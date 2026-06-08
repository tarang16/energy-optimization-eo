import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { TRACKEVENTOBJ } from 'config/ActivityTrackerConfig'
import { useAtomValue } from 'jotai'
import { useParams } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import SingleSelectAffiliateDropDowns from './SingleSelectAffiliateDropDowns'
import {
  handleAffiliateChangeDropDown,
  handlePlantChangeDropDown,
  handleSystemChangeDropDown,
  processAffiliateData,
} from './SingleSelectAffiliateDropDowns.function'

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('jotai', () => ({
  useAtomValue: vi.fn(),
  atom: vi.fn(),
}))

vi.mock('react-router-dom', () => ({
  useParams: vi.fn(),
}))

vi.mock('atoms/AppAtom', () => ({ AppAtom: 'AppAtom' }))
vi.mock('atoms/RootAtom', () => ({ TokenAtom: 'TokenAtom' }))

vi.mock('./SingleSelectAffiliateDropDowns.function', () => ({
  handleAffiliateChangeDropDown: vi.fn(),
  handlePlantChangeDropDown: vi.fn(),
  handleSystemChangeDropDown: vi.fn(),
  processAffiliateData: vi.fn(),
}))

vi.mock('config/ActivityTrackerConfig', () => ({
  TRACKEVENTOBJ: {
    SingleSelectAffiliateDropDowns: {
      handleAffiliateChange: vi.fn(),
      handlePlantChange: vi.fn(),
      handleSystemChange: vi.fn(),
    },
  },
}))

// Mock SingleSelect to a simple testable component
vi.mock('components/visuals/dropdown/single_select/SingleSelect', () => ({
  default: ({ data, onSelectChange, classes }) => (
    <div data-testid='single-select' className={classes?.container}>
      {data?.map((item, i) => (
        <button
          key={i}
          data-testid={`option-${item.label ?? item.value ?? i}`}
          onClick={() => onSelectChange(item)}
        >
          {item.label ?? item.value}
        </button>
      ))}
    </div>
  ),
}))

// Mock CSS module
vi.mock('./SingleSelectAffiliateDropDowns.module.scss', () => ({
  default: {
    parentContainerDropDown: 'parentContainerDropDown',
    dropdownMainDiv: 'dropdownMainDiv',
    dropdownItem: 'dropdownItem',
    dropdownContainer: 'dropdownContainer',
    buttonContainer: 'buttonContainer',
    disabled_button: 'disabled_button',
    enable_button: 'enable_button',
  },
}))

// ─── Test Data ────────────────────────────────────────────────────────────────

const mockToken = 'mock-token-123'
const mockParams = { id: 'case-1' }
const mockCaseData = [{ id: 1, name: 'Case 1' }]
const mockCtxData = { caseData: mockCaseData }

const mockAffiliateList = [
  { label: 'Affiliate A', value: 'aff-a' },
  { label: 'Affiliate B', value: 'aff-b' },
]
const mockMapData = { 'aff-a': { plants: [], systems: [] } }

const defaultProcessResult = {
  obj: mockMapData,
  affiliateDropDownArray: mockAffiliateList,
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function setup(props = {}) {
  return render(<SingleSelectAffiliateDropDowns {...props} />)
}

// ─── Setup ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks()

  useAtomValue.mockImplementation((atom) => {
    if (atom === 'AppAtom') return mockCtxData
    if (atom === 'TokenAtom') return mockToken
    return null
  })

  useParams.mockReturnValue(mockParams)
  processAffiliateData.mockReturnValue(defaultProcessResult)
})

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('SingleSelectAffiliateDropDowns', () => {
  // ── Rendering ──────────────────────────────────────────────────────────────

  describe('Rendering', () => {
    it('renders the root container', () => {
      const { container } = setup()
      expect(
        container.querySelector(
          '[data-static-id="SingleSelectAffiliateDropDowns.js_div_29fd76"]',
        ),
      ).toBeInTheDocument()
    })

    it('renders the main dropdown div', () => {
      const { container } = setup()
      expect(
        container.querySelector(
          '[data-static-id="SingleSelectAffiliateDropDowns.js_div_305ac1"]',
        ),
      ).toBeInTheDocument()
    })

    it('always renders the Affiliate dropdown', () => {
      const { container } = setup()
      expect(
        container.querySelector(
          '[data-static-id="SingleSelectAffiliateDropDowns.js_div_e46163"]',
        ),
      ).toBeInTheDocument()
    })

    it('renders Plant dropdown when Plant is in DropDownList', () => {
      const { container } = setup({ DropDownList: ['Affiliate', 'Plant'] })
      expect(
        container.querySelector(
          '[data-static-id="SingleSelectAffiliateDropDowns.js_div_530d33"]',
        ),
      ).toBeInTheDocument()
    })

    it('does NOT render Plant dropdown when Plant is not in DropDownList', () => {
      const { container } = setup({ DropDownList: ['Affiliate'] })
      expect(
        container.querySelector(
          '[data-static-id="SingleSelectAffiliateDropDowns.js_div_530d33"]',
        ),
      ).not.toBeInTheDocument()
    })

    it('renders System dropdown when System is in DropDownList', () => {
      const { container } = setup({ DropDownList: ['Affiliate', 'System'] })
      expect(
        container.querySelector(
          '[data-static-id="SingleSelectAffiliateDropDowns.js_div_6da4d6"]',
        ),
      ).toBeInTheDocument()
    })

    it('does NOT render System dropdown when System is not in DropDownList', () => {
      const { container } = setup({ DropDownList: ['Affiliate'] })
      expect(
        container.querySelector(
          '[data-static-id="SingleSelectAffiliateDropDowns.js_div_6da4d6"]',
        ),
      ).not.toBeInTheDocument()
    })

    it('renders all three dropdowns with default DropDownList', () => {
      const { container } = setup()
      expect(
        container.querySelector(
          '[data-static-id="SingleSelectAffiliateDropDowns.js_div_e46163"]',
        ),
      ).toBeInTheDocument()
      expect(
        container.querySelector(
          '[data-static-id="SingleSelectAffiliateDropDowns.js_div_530d33"]',
        ),
      ).toBeInTheDocument()
      expect(
        container.querySelector(
          '[data-static-id="SingleSelectAffiliateDropDowns.js_div_6da4d6"]',
        ),
      ).toBeInTheDocument()
    })

    it('does NOT render submit button when showSubmitButton is false', () => {
      const { container } = setup({ showSubmitButton: false })
      expect(
        container.querySelector(
          '[data-static-id="SingleSelectAffiliateDropDowns.js_div_7bf818"]',
        ),
      ).not.toBeInTheDocument()
    })

    it('renders submit button when showSubmitButton is true', () => {
      const { container } = setup({ showSubmitButton: true })
      expect(
        container.querySelector(
          '[data-static-id="SingleSelectAffiliateDropDowns.js_div_7bf818"]',
        ),
      ).toBeInTheDocument()
    })

    it('renders affiliate options from processAffiliateData', () => {
      setup()
      expect(screen.getByTestId('option-Affiliate A')).toBeInTheDocument()
      expect(screen.getByTestId('option-Affiliate B')).toBeInTheDocument()
    })
  })

  // ── processAffiliateData Initialization ───────────────────────────────────

  describe('Initialization', () => {
    it('calls processAffiliateData with ctxData and token on mount', () => {
      setup()
      expect(processAffiliateData).toHaveBeenCalledWith(mockCtxData, mockToken)
    })

    it('handles missing caseData gracefully (undefined ctxData.caseData)', () => {
      useAtomValue.mockImplementation((atom) => {
        if (atom === 'AppAtom') return {} // no caseData
        if (atom === 'TokenAtom') return mockToken
        return null
      })
      expect(() => setup()).not.toThrow()
    })

    it('handles null ctxData gracefully', () => {
      useAtomValue.mockImplementation((atom) => {
        if (atom === 'AppAtom') return null
        if (atom === 'TokenAtom') return mockToken
        return null
      })
      // caseData falls back to [], processAffiliateData is still called
      expect(() => setup()).not.toThrow()
      expect(processAffiliateData).toHaveBeenCalled()
    })
  })

  // ── Submit Button ──────────────────────────────────────────────────────────

  describe('Submit Button', () => {
    it('renders button with enable_button class when not disabled', () => {
      setup({ showSubmitButton: true, disabledSubmitButton: false })
      const btn = screen.getByRole('button', { name: /submit/i })
      expect(btn).toHaveClass('enable_button')
      expect(btn).not.toHaveClass('disabled_button')
    })

    it('renders button with disabled_button class when disabled', () => {
      setup({ showSubmitButton: true, disabledSubmitButton: true })
      const btn = screen.getByRole('button', { name: /submit/i })
      expect(btn).toHaveClass('disabled_button')
      expect(btn).not.toHaveClass('enable_button')
    })

    it('button is disabled when disabledSubmitButton is true', () => {
      setup({ showSubmitButton: true, disabledSubmitButton: true })
      const btn = screen.getByRole('button', { name: /submit/i })
      expect(btn).toBeDisabled()
    })

    it('button is NOT disabled when disabledSubmitButton is false', () => {
      setup({ showSubmitButton: true, disabledSubmitButton: false })
      const btn = screen.getByRole('button', { name: /submit/i })
      expect(btn).not.toBeDisabled()
    })

    it('calls onSubmit with selectedData and setSelectedData on click', () => {
      const onSubmit = vi.fn()
      setup({ showSubmitButton: true, disabledSubmitButton: false, onSubmit })
      fireEvent.click(screen.getByRole('button', { name: /submit/i }))
      expect(onSubmit).toHaveBeenCalledTimes(1)
      // First arg is the selectedData object
      expect(onSubmit.mock.calls[0][0]).toMatchObject({
        affiliate: mockAffiliateList,
        plants: [],
        systems: [],
        caseId: '',
        selectedAffiliate: {},
        selectedPlant: {},
        selectedSystem: {},
      })
      // Second arg is the setState function
      expect(typeof onSubmit.mock.calls[0][1]).toBe('function')
    })

    it('does not call onSubmit when button is disabled', () => {
      const onSubmit = vi.fn()
      setup({ showSubmitButton: true, disabledSubmitButton: true, onSubmit })
      fireEvent.click(screen.getByRole('button', { name: /submit/i }))
      expect(onSubmit).not.toHaveBeenCalled()
    })
  })

  // ── Affiliate Dropdown Interactions ───────────────────────────────────────

  describe('Affiliate Dropdown', () => {
    it('calls handleAffiliateChange prop when an affiliate is selected', () => {
      const handleAffiliateChange = vi.fn()
      setup({ handleAffiliateChange })
      fireEvent.click(screen.getByTestId('option-Affiliate A'))
      expect(handleAffiliateChange).toHaveBeenCalledWith(mockAffiliateList[0])
    })

    it('calls handleAffiliateChangeDropDown when an affiliate is selected', () => {
      setup()
      fireEvent.click(screen.getByTestId('option-Affiliate A'))
      expect(handleAffiliateChangeDropDown).toHaveBeenCalledWith(
        mockAffiliateList[0],
        mockMapData,
        expect.any(Function),
        undefined, // showAllOption default
      )
    })

    it('calls TRACKEVENTOBJ.handleAffiliateChange when isDropdownEvent is true', () => {
      setup({
        isDropdownEvent: true,
        pageKey: 'testPage',
        title: 'TestTitle',
        section: 'sec1',
      })
      fireEvent.click(screen.getByTestId('option-Affiliate A'))
      expect(
        TRACKEVENTOBJ.SingleSelectAffiliateDropDowns.handleAffiliateChange,
      ).toHaveBeenCalledWith(
        { params: mockParams, caseData: mockCaseData, section: 'sec1' },
        'testPage',
        'TestTitle',
        mockAffiliateList[0],
      )
    })

    it('does NOT call TRACKEVENTOBJ.handleAffiliateChange when isDropdownEvent is false', () => {
      setup({ isDropdownEvent: false })
      fireEvent.click(screen.getByTestId('option-Affiliate A'))
      expect(
        TRACKEVENTOBJ.SingleSelectAffiliateDropDowns.handleAffiliateChange,
      ).not.toHaveBeenCalled()
    })

    it('passes showAllOption to handleAffiliateChangeDropDown', () => {
      setup({ showAllOption: true })
      fireEvent.click(screen.getByTestId('option-Affiliate A'))
      expect(handleAffiliateChangeDropDown).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.any(Function),
        true,
      )
    })
  })

  // ── Plant Dropdown Interactions ───────────────────────────────────────────

  describe('Plant Dropdown', () => {
    const plantOptions = [{ label: 'Plant X', value: 'plt-x' }]

    beforeEach(() => {
      // Simulate plants being populated via handleAffiliateChangeDropDown
      handleAffiliateChangeDropDown.mockImplementation(
        (_selected, _map, setSelectedData, _showAll) => {
          setSelectedData((prev) => ({ ...prev, plants: plantOptions }))
        },
      )
    })

    it('renders plant options after affiliate selection populates plants', async () => {
      setup()
      fireEvent.click(screen.getByTestId('option-Affiliate A'))
      await waitFor(() => {
        expect(screen.getByTestId('option-Plant X')).toBeInTheDocument()
      })
    })

    it('calls handlePlantChange prop when a plant is selected', async () => {
      const handlePlantChange = vi.fn()
      setup({ handlePlantChange })
      fireEvent.click(screen.getByTestId('option-Affiliate A'))
      await waitFor(() => screen.getByTestId('option-Plant X'))
      fireEvent.click(screen.getByTestId('option-Plant X'))
      expect(handlePlantChange).toHaveBeenCalledWith(plantOptions[0])
    })

    it('calls handlePlantChangeDropDown when a plant is selected', async () => {
      setup()
      fireEvent.click(screen.getByTestId('option-Affiliate A'))
      await waitFor(() => screen.getByTestId('option-Plant X'))
      fireEvent.click(screen.getByTestId('option-Plant X'))
      expect(handlePlantChangeDropDown).toHaveBeenCalledWith(
        plantOptions[0],
        mockMapData,
        expect.any(Function),
        undefined,
      )
    })

    it('calls TRACKEVENTOBJ.handlePlantChange when isDropdownEvent is true', async () => {
      setup({
        isDropdownEvent: true,
        pageKey: 'pg',
        title: 'ti',
        section: 'sec',
      })
      fireEvent.click(screen.getByTestId('option-Affiliate A'))
      await waitFor(() => screen.getByTestId('option-Plant X'))
      fireEvent.click(screen.getByTestId('option-Plant X'))
      expect(
        TRACKEVENTOBJ.SingleSelectAffiliateDropDowns.handlePlantChange,
      ).toHaveBeenCalledWith(
        { params: mockParams, caseData: mockCaseData, section: 'sec' },
        'pg',
        'ti',
        plantOptions[0],
      )
    })

    it('does NOT call TRACKEVENTOBJ.handlePlantChange when isDropdownEvent is false', async () => {
      setup({ isDropdownEvent: false })
      fireEvent.click(screen.getByTestId('option-Affiliate A'))
      await waitFor(() => screen.getByTestId('option-Plant X'))
      fireEvent.click(screen.getByTestId('option-Plant X'))
      expect(
        TRACKEVENTOBJ.SingleSelectAffiliateDropDowns.handlePlantChange,
      ).not.toHaveBeenCalled()
    })

    it('passes showAllOption to handlePlantChangeDropDown', async () => {
      setup({ showAllOption: false })
      fireEvent.click(screen.getByTestId('option-Affiliate A'))
      await waitFor(() => screen.getByTestId('option-Plant X'))
      fireEvent.click(screen.getByTestId('option-Plant X'))
      expect(handlePlantChangeDropDown).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.any(Function),
        false,
      )
    })
  })

  // ── System Dropdown Interactions ──────────────────────────────────────────

  describe('System Dropdown', () => {
    const systemOptions = [{ label: 'System Z', value: 'sys-z' }]

    beforeEach(() => {
      handleAffiliateChangeDropDown.mockImplementation(
        (_selected, _map, setSelectedData) => {
          setSelectedData((prev) => ({ ...prev, systems: systemOptions }))
        },
      )
    })

    it('renders system options after affiliate selection populates systems', async () => {
      setup()
      fireEvent.click(screen.getByTestId('option-Affiliate A'))
      await waitFor(() => {
        expect(screen.getByTestId('option-System Z')).toBeInTheDocument()
      })
    })

    it('calls handleSystemChange prop when a system is selected', async () => {
      const handleSystemChange = vi.fn()
      setup({ handleSystemChange })
      fireEvent.click(screen.getByTestId('option-Affiliate A'))
      await waitFor(() => screen.getByTestId('option-System Z'))
      fireEvent.click(screen.getByTestId('option-System Z'))
      expect(handleSystemChange).toHaveBeenCalledWith(systemOptions[0])
    })

    it('calls handleSystemChangeDropDown when a system is selected', async () => {
      setup()
      fireEvent.click(screen.getByTestId('option-Affiliate A'))
      await waitFor(() => screen.getByTestId('option-System Z'))
      fireEvent.click(screen.getByTestId('option-System Z'))
      expect(handleSystemChangeDropDown).toHaveBeenCalledWith(
        systemOptions[0],
        expect.any(Function),
      )
    })

    it('calls TRACKEVENTOBJ.handleSystemChange when isDropdownEvent is true', async () => {
      setup({ isDropdownEvent: true, pageKey: 'p', title: 't', section: 's' })
      fireEvent.click(screen.getByTestId('option-Affiliate A'))
      await waitFor(() => screen.getByTestId('option-System Z'))
      fireEvent.click(screen.getByTestId('option-System Z'))
      expect(
        TRACKEVENTOBJ.SingleSelectAffiliateDropDowns.handleSystemChange,
      ).toHaveBeenCalledWith(
        { params: mockParams, caseData: mockCaseData, section: 's' },
        'p',
        't',
        systemOptions[0],
      )
    })

    it('does NOT call TRACKEVENTOBJ.handleSystemChange when isDropdownEvent is false', async () => {
      setup({ isDropdownEvent: false })
      fireEvent.click(screen.getByTestId('option-Affiliate A'))
      await waitFor(() => screen.getByTestId('option-System Z'))
      fireEvent.click(screen.getByTestId('option-System Z'))
      expect(
        TRACKEVENTOBJ.SingleSelectAffiliateDropDowns.handleSystemChange,
      ).not.toHaveBeenCalled()
    })
  })

  // ── Default Props ─────────────────────────────────────────────────────────

  describe('Default Props', () => {
    it('uses empty function defaults for all handler props without throwing', () => {
      // No handlers passed — should still work fine
      expect(() => {
        setup({ showSubmitButton: true, disabledSubmitButton: false })
        fireEvent.click(screen.getByRole('button', { name: /submit/i }))
      }).not.toThrow()
    })

    it('uses default DropDownList when none provided', () => {
      const { container } = setup()
      // All three should be present
      expect(
        container.querySelector(
          '[data-static-id="SingleSelectAffiliateDropDowns.js_div_530d33"]',
        ),
      ).toBeInTheDocument()
      expect(
        container.querySelector(
          '[data-static-id="SingleSelectAffiliateDropDowns.js_div_6da4d6"]',
        ),
      ).toBeInTheDocument()
    })
  })

  // ── CSS Classes ───────────────────────────────────────────────────────────

  describe('CSS Classes', () => {
    it('applies w-100 and h-100 to root container', () => {
      const { container } = setup()
      const root = container.querySelector(
        '[data-static-id="SingleSelectAffiliateDropDowns.js_div_29fd76"]',
      )
      expect(root).toHaveClass('w-100', 'h-100')
    })

    it('applies dropdownContainer class to SingleSelect containers', () => {
      const { container } = setup()
      const selects = container.querySelectorAll('.dropdownContainer')
      expect(selects.length).toBeGreaterThan(0)
    })
  })
})
