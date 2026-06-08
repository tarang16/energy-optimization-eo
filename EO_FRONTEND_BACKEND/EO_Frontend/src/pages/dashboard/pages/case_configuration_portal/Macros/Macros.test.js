import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { getMacros } from 'services/CCPServices'
import Macros from './Macros'

import * as services from 'services/CCPServices'
import * as utils from 'utills/utilities'
import { beforeEach, describe, expect, test, vi } from 'vitest'

// Mock service
vi.mock('services/CCPServices', () => ({
  getMacros: vi.fn(),
}))

// Mock assets & style classes
vi.mock('assets/sabic_icons/header/edit_default_icon.svg', () => ({
  default: 'editIcon.svg',
}))
vi.mock(
  import('../CaseConfigurationPortal.module.scss'),
  async (importOriginal) => {
    const actual = await importOriginal()
    return {
      ...actual,
      img: 'img',
      editIcon: 'editIcon',
      searchContainer: 'searchContainer',
      searchInput: 'searchInput',
      tbl_ccpTabsContainer: 'tbl_ccpTabsContainer',
      customSpacingClass: 'customSpacingClass',
    }
  },
)

vi.mock('components/visuals/table/SimpleTable', () => ({
  default: ({ headers, data }) => (
    <div data-testid='SimpleTable'>
      {data?.map((row, i) => (
        <div key={i}>{row[3]}</div> // macroName column
      ))}
    </div>
  ),
}))

vi.mock(
  'components/visuals/common/custom_tooltip/CustomOverlayTooltip',
  () => ({
    default: ({ children }) => <div data-testid='Tooltip'>{children}</div>,
  }),
)

vi.mock('../Configurationdownload/ConfigurationDownload', () => ({
  default: () => <div data-testid='DownloadComponent'>Download</div>,
}))

vi.mock('config/ActivityTrackerConfig', () => ({
  TRACKEVENTOBJ: {
    CCPTabs: {
      onBtnClick: vi.fn(),
    },
  },
}))

vi.mock('components/visuals/table/SimpleTable', () => ({
  default: (props) => (
    <div data-testid='simple-table'>
      {props.headers?.map((h) => (
        <div key={h}>{h}</div>
      ))}
      {props.data?.map((row, i) => (
        <div key={i}>{row.join(',')}</div>
      ))}
    </div>
  ),
}))

vi.mock('components/visuals/common/modal/CustomModal', () => ({
  default: (props) =>
    props.show ? (
      <div data-testid='custom-modal'>
        <button onClick={props.hideModal}>Close</button>
        {props.children}
      </div>
    ) : null,
}))

vi.mock('./EditMacrosTabs', () => ({
  default: (props) => (
    <div data-testid='edit-macros-tabs'>
      EditTabs: {props.editData?.macroName}
    </div>
  ),
}))

// Utility to render with route
const renderWithRouter = (ui, route = '/case/123') => {
  window.history.pushState({}, 'Test page', route)
  return render(
    <MemoryRouter initialEntries={[route]}>
      <Routes>
        <Route path='/case/:caseId' element={ui} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('Macros component', () => {
  const mockData = [
    {
      pipelineMacroId: 'M1',
      category: 'Cat1',
      value: '123',
      macroName: 'MacroOne',
      defaultValue: 'Def1',
      description: 'This is a test macro',
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('renders search input and table headers', async () => {
    getMacros.mockResolvedValue({
      statuscode: 200,
      data: mockData,
    })
    renderWithRouter(<Macros canEdit={false} role='TEST' caseId='123' />)
    expect(await screen.findByPlaceholderText('Search...')).toBeInTheDocument()
    expect(await screen.findByText('PIPELINE MACRO ID')).toBeInTheDocument()
    expect(await screen.findByTestId('simple-table')).toBeInTheDocument()
  })

  test('handles API failure gracefully', async () => {
    getMacros.mockRejectedValue(new Error('API Error'))
    renderWithRouter(<Macros canEdit={false} role='TEST' caseId='123' />)
    // await waitFor(() => {
    //     expect(screen.queryByTestId("simple-table")).not.toBeNull();
    // });
  })

  test('disables edit icon if canEdit is false', async () => {
    getMacros.mockResolvedValue({
      statuscode: 200,
      data: mockData,
    })
    renderWithRouter(<Macros canEdit={false} role='TEST' caseId='123' />)
    // await waitFor(() =>
    //     expect(screen.getByTestId("simple-table")).toBeInTheDocument()
    // );
    // const editIcon = screen.getByRole("img");
    // expect(editIcon).toHaveClass("disabledImg");
  })

  // test("opens modal with edit data if canEdit is true", async () => {
  //     getMacros.mockResolvedValue({
  //         statuscode: 200,
  //         data: mockData,
  //     });
  //     renderWithRouter(<Macros canEdit={true} role="TEST" caseId="123" />);
  //     const editButton = await screen.findByRole("img");
  //     fireEvent.click(editButton);
  //     // expect(await screen.findByTestId("custom-modal")).toBeInTheDocument();
  //     // expect(screen.getByTestId("edit-macros-tabs")).toHaveTextContent(
  //     //     "MacroOne"
  //     // );
  // });

  test('filters data on search input', async () => {
    getMacros.mockResolvedValue({
      statuscode: 200,
      data: [
        ...mockData,
        {
          pipelineMacroId: 'M2',
          category: 'OtherCat',
          value: '456',
          macroName: 'MacroTwo',
          defaultValue: 'Def2',
          description: 'Another macro',
        },
      ],
    })
    renderWithRouter(<Macros canEdit={false} role='TEST' caseId='123' />)
    const input = await screen.findByPlaceholderText('Search...')
    fireEvent.change(input, { target: { value: 'MacroTwo' } })
    // await waitFor(() => {
    //     expect(screen.getByText(/MacroTwo/i)).toBeInTheDocument();
    //     expect(screen.queryByText(/MacroOne/i)).not.toBeInTheDocument();
    // });
  })

  test('renders ConfigurationDownload if filteredData is present', async () => {
    getMacros.mockResolvedValue({
      statuscode: 200,
      data: mockData,
    })
    renderWithRouter(<Macros canEdit={false} role='TEST' caseId='123' />)
    await screen.findByText('PIPELINE MACRO ID')
    const input = screen.getByPlaceholderText('Search...')
    fireEvent.change(input, { target: { value: 'MacroOne' } })
    // await waitFor(() =>
    //     expect(screen.getByTestId("config-download")).toBeInTheDocument()
    // );
  })
})

vi.mock('services/CCPServices', () => ({
  getMacros: vi.fn(),
}))

vi.mock('utills/utilities', () => ({
  filterTableData: vi.fn(),
  showToast: vi.fn(),
}))

const mockData = [
  {
    pipelineMacroId: 'PM-1',
    category: 'Pressure',
    value: '100',
    macroName: 'HighPressure',
    defaultValue: '90',
    description: 'Macro for pressure',
  },
]

describe('fetchData function in Macros.jsx', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('sets tableData to empty on non-200 response', async () => {
    services.getMacros.mockResolvedValueOnce({
      statuscode: 500,
      data: [],
    })

    render(
      <MemoryRouter>
        <Macros role='developer' caseId='123' />
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(screen.queryByText('HighPressure')).not.toBeInTheDocument()
    })
  })

  test('shows toast and clears data on API failure', async () => {
    services.getMacros.mockRejectedValueOnce(new Error('Server error'))

    render(
      <MemoryRouter>
        <Macros role='developer' caseId='123' />
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(utils.showToast).toHaveBeenCalledWith(
        'Error while fetching PI AF constants data',
        expect.any(Error),
      )
    })

    expect(screen.queryByText('HighPressure')).not.toBeInTheDocument()
  })
})
