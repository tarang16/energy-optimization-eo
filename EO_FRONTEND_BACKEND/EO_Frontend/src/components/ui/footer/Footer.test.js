import '@testing-library/jest-dom'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import moment from 'moment-timezone'
import { MemoryRouter } from 'react-router-dom'
import Footer from './Footer'

// Mock Jotai
import { useAtomValue, useSetAtom } from 'jotai'

vi.mock(import('jotai'), async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    useAtomValue: vi.fn(),
    useSetAtom: vi.fn(),
  }
})

// Mock services
import { addUserPreference } from 'services/FavoriteService'
vi.mock('services/FavoriteService', () => ({
  addUserPreference: vi.fn(),
}))

// Mock utilities
import { getUserTimeZone, showToast } from 'utills/utilities'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
vi.mock('utills/utilities', () => ({
  getUserTimeZone: vi.fn(),
  showToast: vi.fn(),
  convertFormulaToHtml: vi.fn(),
}))

// Mock activity tracker
vi.mock('config/ActivityTrackerConfig', () => ({
  TRACKEVENTOBJ: {
    footer: {
      handleTimeZone: vi.fn(),
    },
  },
}))

// Constants
const mockCaseData = {
  caseData: [{ id: 1, name: 'Mock Case' }],
}

describe('Footer Component', () => {
  const mockSetIsLoading = vi.fn()
  const mockSetDefaultTimezone = vi.fn()

  beforeEach(() => {
    useAtomValue.mockImplementation((atom) => {
      if (atom.toString().includes('AppAtom')) return mockCaseData
      if (atom.toString().includes('TokenAtom')) return 'mock-token'
      return 'Asia/Kolkata'
    })
    useSetAtom.mockReturnValue(mockSetDefaultTimezone)
    getUserTimeZone.mockResolvedValue('Asia/Kolkata')
    addUserPreference.mockResolvedValue({ statuscode: 200 })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  test('renders footer with copyright', async () => {
    render(
      <MemoryRouter>
        <Footer />
      </MemoryRouter>,
    )

    expect(
      screen.getByText(
        new RegExp(
          `${moment().format('YYYY')} Saudi Basic Industries Corporation`,
        ),
      ),
    ).toBeInTheDocument()

    // Wait for timezone to load
    await waitFor(() => {
      expect(screen.getByText('Asia/Kolkata')).toBeInTheDocument()
    })
  })

  // test("opens modal on timezone click", async () => {
  // 	render(
  // 		<MemoryRouter>
  // 			<Footer />
  // 		</MemoryRouter>
  // 	);

  // 	await waitFor(() => {
  // 		fireEvent.click(screen.getByText("Asia/Kolkata"));
  // 	});

  // 	expect(screen.getByText("SET TIMEZONE")).toBeInTheDocument();
  // });

  // test("handles timezone dropdown and submit", async () => {
  // 	window.confirm = vi.fn(() => true); // Simulate user confirming

  // 	render(
  // 		<MemoryRouter>
  // 			<Footer setIsLoading={mockSetIsLoading} />
  // 		</MemoryRouter>
  // 	);

  // 	fireEvent.click(await screen.findByText("Asia/Kolkata"));

  // 	// Dropdown selection
  // 	const newOption = await screen.findByText("Asia/Kolkata");
  // 	fireEvent.click(newOption);

  // 	// Submit
  // 	fireEvent.click(screen.getByText("Submit"));

  // 	await waitFor(() => {
  // 		expect(addUserPreference).toHaveBeenCalledWith("Asia/Kolkata");
  // 		expect(showToast).toHaveBeenCalledWith("Timezone Updated successfully...", "success");
  // 		expect(mockSetIsLoading).toHaveBeenCalledWith(true);
  // 		expect(mockSetIsLoading).toHaveBeenCalledWith(false);
  // 	});
  // });

  test('handles timezone update failure', async () => {
    addUserPreference.mockResolvedValueOnce({ statuscode: 500 })
    window.confirm = vi.fn(() => true)

    render(
      <MemoryRouter>
        <Footer setIsLoading={mockSetIsLoading} />
      </MemoryRouter>,
    )

    fireEvent.click(await screen.findByText('Asia/Kolkata'))
    fireEvent.click(screen.getByText('Submit'))

    await waitFor(() => {
      expect(showToast).toHaveBeenCalledWith(
        'Error while updating Timezone...',
        'error',
      )
    })
  })

  test('does not update timezone if user cancels confirm', async () => {
    window.confirm = vi.fn(() => false)

    render(
      <MemoryRouter>
        <Footer setIsLoading={mockSetIsLoading} />
      </MemoryRouter>,
    )

    fireEvent.click(await screen.findByText('Asia/Kolkata'))
    fireEvent.click(screen.getByText('Submit'))

    expect(addUserPreference).not.toHaveBeenCalled()
  })
})
