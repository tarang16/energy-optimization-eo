/**
 * AffiliateFolderModal – comprehensive unit tests (Vitest + RTL)
 *
 * Key design decisions:
 *
 * 1. MULTIPLE BUTTONS PROBLEM
 *    At level >= 2 the DOM always has at least two buttons:
 *      - Real back button → data-static-id="AffiliateFolderModal.js_button_7c4f19"
 *      - Breadcrumb mock  → data-testid="breadcrumb-btn"
 *    Fix: getBackBtn(container) uses querySelector on data-static-id — never ambiguous.
 *
 * 2. DYNAMIC HIERARCHY
 *    dynamicFolderHierarchy state is ONLY populated by EcmFile (child) via the
 *    setDynamicFolderHierarchy prop. handleDynamicFolderClick does NOT populate it.
 *    Fix: EcmFile mock captures the setter; tests inject hierarchy via act().
 *
 * 3. vi.clearAllMocks() vs mockClear()
 *    vi.clearAllMocks() wipes implementations — use mockClear() to reset call
 *    history only and keep mockResolvedValue intact.
 */

import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('config/ActivityTrackerConfig', () => ({
  TRACKEVENTOBJ: {
    ecmFolderModal: {
      breadcrumbClick: vi.fn(),
      folderClick: vi.fn(),
    },
  },
}))

vi.mock('config/env', () => ({
  env: { EO_TM_NODE_ID: 'tm-node-123' },
}))

vi.mock('react-router-dom', () => ({
  useLocation: () => ({ pathname: '/test-path' }),
  useParams: () => ({ caseId: 'case-001' }),
}))

vi.mock('services/EcmServices', () => ({
  get_ecm_files: vi.fn(),
  getFilesFromEcmByCaseId: vi.fn(),
}))

vi.mock('../loader/Loader', () => ({
  default: () => <div data-testid='loader'>Loading…</div>,
}))

/**
 * EcmFile mock:
 * - Captures setDynamicFolderHierarchy so tests can inject hierarchy state via act().
 * - Exposes a button data-testid="ecm-file-set-hierarchy" to trigger injection.
 */
let capturedSetDynamicFolderHierarchy = null
vi.mock('./EcmFile', () => ({
  default: (props) => {
    capturedSetDynamicFolderHierarchy = props.setDynamicFolderHierarchy
    return (
      <tr data-testid={`ecm-file-${props.id ?? 'file'}`}>
        <td>{props.name ?? 'file'}</td>
      </tr>
    )
  },
}))

/**
 * Breadcrumb mock — three buttons covering every handleDynamicFolderClick branch:
 *   breadcrumb-btn          nodeId='node-1', label='Test Folder'  → full happy path
 *   breadcrumb-btn-no-label nodeId='node-2', label=undefined      → skip tracking
 *   breadcrumb-btn-no-node  nodeId=null,     label='Null Node'    → early return
 */
vi.mock('./AffiliateFolderBreadcrumb', () => ({
  default: (props) => (
    <div data-testid='breadcrumb-component'>
      <button
        data-testid='breadcrumb-btn'
        onClick={() => props.handleDynamicFolderClick('node-1', 'Test Folder')}
      >
        Breadcrumb
      </button>
      <button
        data-testid='breadcrumb-btn-no-label'
        onClick={() => props.handleDynamicFolderClick('node-2')}
      >
        No Label
      </button>
      <button
        data-testid='breadcrumb-btn-no-node'
        onClick={() => props.handleDynamicFolderClick(null, 'Null Node')}
      >
        Null Node
      </button>
      <button
        data-testid='breadcrumb-load-files'
        onClick={() => props.getFilesByCaseId({ caseID: 'case-001' })}
      >
        Load Files
      </button>
    </div>
  ),
}))

vi.mock('./EcmClickableBox', () => ({
  default: ({ handleFolderClick, data, parentData }) => (
    <button
      data-testid={`clickable-box-${data.key}`}
      onClick={() => handleFolderClick(data.data, parentData)}
    >
      {data.label}
    </button>
  ),
}))

vi.mock('../../../assets/sabic_new_icons/arrow_down_blue.svg', () => ({
  default: 'arrow_down_blue.svg',
}))

vi.mock('./AffliateFolder.module.scss', () => ({ default: {} }))

// ─── Imports (after mocks) ────────────────────────────────────────────────────

import { TRACKEVENTOBJ } from 'config/ActivityTrackerConfig'
import { get_ecm_files, getFilesFromEcmByCaseId } from 'services/EcmServices'
import AffiliateFolderModal from './AffiliateFolderModal'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const BACK_BTN_STATIC_ID = 'AffiliateFolderModal.js_button_7c4f19'

/** Unambiguously selects the real back button by its data-static-id */
function getBackBtn(container) {
  return container.querySelector(`[data-static-id="${BACK_BTN_STATIC_ID}"]`)
}

const mockFile = { id: 'f1', name: 'document.pdf', size: 1024 }
const mockFile2 = { id: 'f2', name: 'report.docx', size: 2048 }

const defaultAffiliateFolderData = {
  level: 1,
  type: 'affiliate',
  selectedRegion: '',
  selectedAffiliate: '',
}

const sampleAffiliateDataState = [
  {
    regionName: 'Region A',
    regionShortName: 'RA',
    affiliates: [
      { affiliateName: 'Affiliate 1', caseID: 'case-001' },
      { affiliateName: 'Affiliate 2', caseID: 'case-002' },
    ],
  },
]

function renderComponent(overrides = {}) {
  const props = {
    affiliateFolderData: {
      ...defaultAffiliateFolderData,
      ...(overrides.affiliateFolderData ?? {}),
    },
    setAffiliateFolderData: overrides.setAffiliateFolderData ?? vi.fn(),
    affiliateDataState:
      overrides.affiliateDataState ?? sampleAffiliateDataState,
    caseData: overrides.caseData ?? { id: 'case-data-1' },
  }
  return { ...render(<AffiliateFolderModal {...props} />), props }
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('AffiliateFolderModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    capturedSetDynamicFolderHierarchy = null
    getFilesFromEcmByCaseId.mockResolvedValue([mockFile])
    get_ecm_files.mockResolvedValue([mockFile])
  })

  // ══════════════════════════════════════════════════════════════════════════
  // LEVEL 1 – Affiliate list view
  // ══════════════════════════════════════════════════════════════════════════

  describe('Level 1 – affiliate list view', () => {
    it('renders the Training Material heading', () => {
      const { container } = renderComponent()
      // Target the <p> heading specifically via data-static-id to avoid
      // ambiguity with the clickable box button which has the same text
      expect(
        container.querySelector(
          '[data-static-id="AffiliateFolderModal.js_p_0a2c65"]',
        ),
      ).not.toBeNull()
    })

    it('renders the Training Material clickable box', () => {
      renderComponent()
      expect(screen.getByTestId('clickable-box-tm')).toBeInTheDocument()
    })

    it('renders region names from affiliateDataState', () => {
      renderComponent()
      expect(screen.getByText('Region A')).toBeInTheDocument()
    })

    it('renders a clickable box for every affiliate', () => {
      renderComponent()
      expect(
        screen.getByTestId('clickable-box-Affiliate 1'),
      ).toBeInTheDocument()
      expect(
        screen.getByTestId('clickable-box-Affiliate 2'),
      ).toBeInTheDocument()
    })

    it('renders multiple regions when provided', () => {
      renderComponent({
        affiliateDataState: [
          {
            regionName: 'EMEA',
            regionShortName: 'EM',
            affiliates: [{ affiliateName: 'Aff-EM', caseID: 'c-em' }],
          },
          {
            regionName: 'APAC',
            regionShortName: 'AP',
            affiliates: [{ affiliateName: 'Aff-AP', caseID: 'c-ap' }],
          },
        ],
      })
      expect(screen.getByText('EMEA')).toBeInTheDocument()
      expect(screen.getByText('APAC')).toBeInTheDocument()
    })

    it('renders with empty affiliateDataState without crashing', () => {
      renderComponent({ affiliateDataState: [] })
      // Both the <p> heading and the clickable box contain 'Training Material'
      expect(screen.getAllByText('Training Material').length).toBeGreaterThan(0)
    })

    it('does NOT render the back button at level 1', () => {
      const { container } = renderComponent()
      expect(getBackBtn(container)).toBeNull()
    })

    it('does NOT render the breadcrumb component at level 1', () => {
      renderComponent()
      expect(screen.queryByTestId('breadcrumb-component')).toBeNull()
    })

    it('renders the level-1 outer container', () => {
      const { container } = renderComponent()
      expect(
        container.querySelector(
          '[data-static-id="AffiliateFolderModal.js_div_6bdf99"]',
        ),
      ).not.toBeNull()
    })
  })

  // ══════════════════════════════════════════════════════════════════════════
  // handleFolderClick – Training Material
  // ══════════════════════════════════════════════════════════════════════════

  describe('handleFolderClick – Training Material', () => {
    it('calls get_ecm_files with EO_TM_NODE_ID', async () => {
      renderComponent()
      fireEvent.click(screen.getByTestId('clickable-box-tm'))
      await waitFor(() =>
        expect(get_ecm_files).toHaveBeenCalledWith('tm-node-123'),
      )
    })

    it('sets affiliateFolderData to level 5 / type "tm"', async () => {
      const setAffiliateFolderData = vi.fn()
      renderComponent({ setAffiliateFolderData })
      fireEvent.click(screen.getByTestId('clickable-box-tm'))
      await waitFor(() =>
        expect(setAffiliateFolderData).toHaveBeenCalledWith(
          expect.objectContaining({
            level: 5,
            type: 'tm',
            selectedRegion: 'tm-node-123',
            selectedAffiliate: 'tm-node-123',
          }),
        ),
      )
    })

    it('tracks folderClick with folderName "Training Material"', async () => {
      renderComponent()
      fireEvent.click(screen.getByTestId('clickable-box-tm'))
      await waitFor(() =>
        expect(TRACKEVENTOBJ.ecmFolderModal.folderClick).toHaveBeenCalledWith(
          expect.objectContaining({ folderName: 'Training Material' }),
        ),
      )
    })

    it('handles get_ecm_files returning empty array', async () => {
      get_ecm_files.mockResolvedValue([])
      renderComponent()
      fireEvent.click(screen.getByTestId('clickable-box-tm'))
      await waitFor(() => expect(get_ecm_files).toHaveBeenCalled())
    })
  })

  // ══════════════════════════════════════════════════════════════════════════
  // handleFolderClick – Affiliate
  // ══════════════════════════════════════════════════════════════════════════

  describe('handleFolderClick – Affiliate', () => {
    it('calls getFilesFromEcmByCaseId with affiliate caseID', async () => {
      renderComponent()
      fireEvent.click(screen.getByTestId('clickable-box-Affiliate 1'))
      await waitFor(() =>
        expect(getFilesFromEcmByCaseId).toHaveBeenCalledWith('case-001'),
      )
    })

    it('sets affiliateFolderData to level 2 / type "files"', async () => {
      const setAffiliateFolderData = vi.fn()
      renderComponent({ setAffiliateFolderData })
      fireEvent.click(screen.getByTestId('clickable-box-Affiliate 1'))
      await waitFor(() =>
        expect(setAffiliateFolderData).toHaveBeenCalledWith(
          expect.objectContaining({ level: 2, type: 'files' }),
        ),
      )
    })

    it('stores the correct selectedAffiliate object', async () => {
      const setAffiliateFolderData = vi.fn()
      renderComponent({ setAffiliateFolderData })
      fireEvent.click(screen.getByTestId('clickable-box-Affiliate 1'))
      await waitFor(() =>
        expect(setAffiliateFolderData).toHaveBeenCalledWith(
          expect.objectContaining({
            selectedAffiliate: {
              affiliateName: 'Affiliate 1',
              caseID: 'case-001',
            },
          }),
        ),
      )
    })

    it('stores parent region as selectedRegion', async () => {
      const setAffiliateFolderData = vi.fn()
      renderComponent({ setAffiliateFolderData })
      fireEvent.click(screen.getByTestId('clickable-box-Affiliate 1'))
      await waitFor(() =>
        expect(setAffiliateFolderData).toHaveBeenCalledWith(
          expect.objectContaining({
            selectedRegion: expect.objectContaining({ regionName: 'Region A' }),
          }),
        ),
      )
    })

    it('tracks folderClick with affiliate name', async () => {
      renderComponent()
      fireEvent.click(screen.getByTestId('clickable-box-Affiliate 1'))
      await waitFor(() =>
        expect(TRACKEVENTOBJ.ecmFolderModal.folderClick).toHaveBeenCalledWith(
          expect.objectContaining({ folderName: 'Affiliate 1' }),
        ),
      )
    })
  })

  // ══════════════════════════════════════════════════════════════════════════
  // Level 2 – Static render
  // ══════════════════════════════════════════════════════════════════════════

  describe('Level 2 – static render', () => {
    const level2Data = {
      affiliateFolderData: {
        level: 2,
        type: 'files',
        selectedRegion: { regionName: 'Region A' },
        selectedAffiliate: { affiliateName: 'Affiliate 1', caseID: 'case-001' },
      },
    }

    it('renders the breadcrumb component', () => {
      renderComponent(level2Data)
      expect(screen.getByTestId('breadcrumb-component')).toBeInTheDocument()
    })

    it('renders the back button', () => {
      const { container } = renderComponent(level2Data)
      expect(getBackBtn(container)).not.toBeNull()
    })

    it('shows "No files found" when files state is empty on initial render', () => {
      renderComponent(level2Data)
      expect(
        screen.getByText(/No files found for the case/i),
      ).toBeInTheDocument()
    })

    it('renders the level>1 overflow-hidden scroll container', () => {
      const { container } = renderComponent(level2Data)
      expect(
        container.querySelector(
          '[data-static-id="AffiliateFolderModal.js_div_9304a8"]',
        ),
      ).not.toBeNull()
    })
  })

  // ══════════════════════════════════════════════════════════════════════════
  // Level 5 – Static render
  // ══════════════════════════════════════════════════════════════════════════

  describe('Level 5 – static render', () => {
    const level5Data = {
      affiliateFolderData: {
        level: 5,
        type: 'tm',
        selectedRegion: 'tm-node-123',
        selectedAffiliate: 'tm-node-123',
      },
    }

    it('renders the breadcrumb component', () => {
      renderComponent(level5Data)
      expect(screen.getByTestId('breadcrumb-component')).toBeInTheDocument()
    })

    it('renders the back button', () => {
      const { container } = renderComponent(level5Data)
      expect(getBackBtn(container)).not.toBeNull()
    })

    it('shows "No files found" on initial render', () => {
      renderComponent(level5Data)
      expect(
        screen.getByText(/No files found for the case/i),
      ).toBeInTheDocument()
    })
  })

  // ══════════════════════════════════════════════════════════════════════════
  // Level 3 – Static render
  // ══════════════════════════════════════════════════════════════════════════

  describe('Level 3 – static render', () => {
    const level3Data = {
      affiliateFolderData: {
        level: 3,
        type: 'files',
        selectedRegion: { regionName: 'Region A' },
        selectedAffiliate: { affiliateName: 'Affiliate 1', caseID: 'case-001' },
        selectedPlant: 'plant-1',
      },
    }

    it('renders breadcrumb component', () => {
      renderComponent(level3Data)
      expect(screen.getByTestId('breadcrumb-component')).toBeInTheDocument()
    })

    it('renders the back button', () => {
      const { container } = renderComponent(level3Data)
      expect(getBackBtn(container)).not.toBeNull()
    })
  })

  // ══════════════════════════════════════════════════════════════════════════
  // renderFiles – Loader state
  // ══════════════════════════════════════════════════════════════════════════

  describe('renderFiles – loading state', () => {
    it('shows Loader while getFilesFromEcmByCaseId is pending', async () => {
      let resolve
      getFilesFromEcmByCaseId.mockReturnValue(
        new Promise((r) => {
          resolve = r
        }),
      )
      renderComponent({
        affiliateFolderData: {
          level: 2,
          type: 'files',
          selectedRegion: { regionName: 'Region A' },
          selectedAffiliate: {
            affiliateName: 'Affiliate 1',
            caseID: 'case-001',
          },
        },
      })
      fireEvent.click(screen.getByTestId('breadcrumb-load-files'))
      await waitFor(() =>
        expect(screen.getByTestId('loader')).toBeInTheDocument(),
      )
      resolve([])
    })

    it('shows Loader while get_ecm_files is pending after breadcrumb click', async () => {
      let resolve
      get_ecm_files.mockReturnValue(
        new Promise((r) => {
          resolve = r
        }),
      )
      renderComponent({
        affiliateFolderData: {
          level: 2,
          type: 'files',
          selectedRegion: { regionName: 'Region A' },
          selectedAffiliate: {
            affiliateName: 'Affiliate 1',
            caseID: 'case-001',
          },
        },
      })
      fireEvent.click(screen.getByTestId('breadcrumb-btn'))
      await waitFor(() =>
        expect(screen.getByTestId('loader')).toBeInTheDocument(),
      )
      resolve([])
    })
  })

  // ══════════════════════════════════════════════════════════════════════════
  // renderFiles – File table
  // ══════════════════════════════════════════════════════════════════════════

  describe('renderFiles – file table', () => {
    it('renders table headers after files load', async () => {
      getFilesFromEcmByCaseId.mockResolvedValue([mockFile])
      renderComponent({
        affiliateFolderData: {
          level: 2,
          type: 'files',
          selectedRegion: { regionName: 'Region A' },
          selectedAffiliate: {
            affiliateName: 'Affiliate 1',
            caseID: 'case-001',
          },
        },
      })
      fireEvent.click(screen.getByTestId('breadcrumb-load-files'))
      await waitFor(() => {
        expect(screen.getByText('File Name')).toBeInTheDocument()
        expect(screen.getByText('File Size')).toBeInTheDocument()
        expect(screen.getByText('Action')).toBeInTheDocument()
      })
    })

    it('renders an EcmFile row for each file', async () => {
      getFilesFromEcmByCaseId.mockResolvedValue([mockFile, mockFile2])
      renderComponent({
        affiliateFolderData: {
          level: 2,
          type: 'files',
          selectedRegion: { regionName: 'Region A' },
          selectedAffiliate: {
            affiliateName: 'Affiliate 1',
            caseID: 'case-001',
          },
        },
      })
      fireEvent.click(screen.getByTestId('breadcrumb-load-files'))
      await waitFor(() => {
        expect(screen.getByTestId('ecm-file-f1')).toBeInTheDocument()
        expect(screen.getByTestId('ecm-file-f2')).toBeInTheDocument()
      })
    })

    it('shows "No files found" when service returns empty array', async () => {
      // Render directly at level 2 — navigation from level 1 does not work
      // because setAffiliateFolderData is a mock and never re-renders the component.
      getFilesFromEcmByCaseId.mockResolvedValue([])
      renderComponent({
        affiliateFolderData: {
          level: 2,
          type: 'files',
          selectedRegion: { regionName: 'Region A' },
          selectedAffiliate: {
            affiliateName: 'Affiliate 1',
            caseID: 'case-001',
          },
        },
      })
      // breadcrumb-load-files calls getFilesByCaseId which resolves to []
      fireEvent.click(screen.getByTestId('breadcrumb-load-files'))
      await waitFor(() =>
        expect(
          screen.getByText(/No files found for the case/i),
        ).toBeInTheDocument(),
      )
    })

    it('renders files loaded via get_ecm_files (TM flow)', async () => {
      // Render directly at level 5 — clicking clickable-box-tm calls
      // setAffiliateFolderData (a mock) so the component never re-renders.
      get_ecm_files.mockResolvedValue([mockFile])
      renderComponent({
        affiliateFolderData: {
          level: 5,
          type: 'tm',
          selectedRegion: 'tm-node-123',
          selectedAffiliate: 'tm-node-123',
        },
      })
      // breadcrumb-btn triggers get_ecm_files which populates files state
      fireEvent.click(screen.getByTestId('breadcrumb-btn'))
      await waitFor(() =>
        expect(screen.getByTestId('ecm-file-f1')).toBeInTheDocument(),
      )
    })
  })

  // ══════════════════════════════════════════════════════════════════════════
  // handleBackClick – NO dynamic hierarchy
  // ══════════════════════════════════════════════════════════════════════════

  describe('handleBackClick – no dynamic folder hierarchy', () => {
    it('navigates from level 2 to level 1', async () => {
      const setAffiliateFolderData = vi.fn()
      const { container } = renderComponent({
        setAffiliateFolderData,
        affiliateFolderData: {
          level: 2,
          type: 'files',
          selectedRegion: { regionName: 'Region A' },
          selectedAffiliate: { affiliateName: 'Aff1', caseID: 'c1' },
        },
      })
      fireEvent.click(getBackBtn(container))
      await waitFor(() =>
        expect(setAffiliateFolderData).toHaveBeenCalledWith(
          expect.objectContaining({
            level: 1,
            type: 'affiliate',
            selectedRegion: '',
            selectedAffiliate: '',
          }),
        ),
      )
    })

    it('navigates from level 5 to level 1', async () => {
      const setAffiliateFolderData = vi.fn()
      const { container } = renderComponent({
        setAffiliateFolderData,
        affiliateFolderData: {
          level: 5,
          type: 'tm',
          selectedRegion: 'tm-node-123',
          selectedAffiliate: 'tm-node-123',
        },
      })
      fireEvent.click(getBackBtn(container))
      await waitFor(() =>
        expect(setAffiliateFolderData).toHaveBeenCalledWith(
          expect.objectContaining({
            level: 1,
            type: 'affiliate',
            selectedRegion: '',
            selectedAffiliate: '',
          }),
        ),
      )
      // No hierarchy → get_ecm_files must NOT be called
      expect(get_ecm_files).not.toHaveBeenCalled()
    })

    it('navigates from level 3 to level 2, clearing selectedPlant', async () => {
      const setAffiliateFolderData = vi.fn()
      const { container } = renderComponent({
        setAffiliateFolderData,
        affiliateFolderData: {
          level: 3,
          type: 'files',
          selectedRegion: { regionName: 'Region A' },
          selectedAffiliate: { affiliateName: 'Aff1', caseID: 'c1' },
          selectedPlant: 'plant-1',
        },
      })
      fireEvent.click(getBackBtn(container))
      await waitFor(() =>
        expect(setAffiliateFolderData).toHaveBeenCalledWith(
          expect.objectContaining({
            level: 2,
            type: 'files',
            selectedPlant: '',
          }),
        ),
      )
    })
  })

  // ══════════════════════════════════════════════════════════════════════════
  // handleBackClick – WITH dynamic folder hierarchy
  //
  // dynamicFolderHierarchy is ONLY populated by EcmFile child component via
  // the setDynamicFolderHierarchy prop. We inject it using act() after
  // capturing the setter from the EcmFile mock.
  // ══════════════════════════════════════════════════════════════════════════

  describe('handleBackClick – with dynamic folder hierarchy', () => {
    /**
     * Base props for a level-2 render with files already loaded.
     * Rendering at level 2 directly (instead of navigating from level 1)
     * ensures EcmFile renders immediately and captures setDynamicFolderHierarchy
     * without depending on setAffiliateFolderData (which is a mock and never
     * actually transitions the component).
     */
    const level2WithFilesProps = {
      affiliateFolderData: {
        level: 2,
        type: 'files',
        selectedRegion: { regionName: 'Region A' },
        selectedAffiliate: { affiliateName: 'Affiliate 1', caseID: 'case-001' },
      },
    }

    /**
     * Helper: render at level 2 with files pre-loaded, wait for EcmFile to
     * appear (capturing the setter), then inject the given hierarchy via act().
     */
    async function setupWithHierarchy(hierarchy, extraProps = {}) {
      // Use breadcrumb-load-files which calls getFilesByCaseId directly.
      // This populates files state WITHOUT calling handleDynamicFolderClick,
      // so dynamicFolderHierarchy is not touched before we inject it.
      getFilesFromEcmByCaseId.mockResolvedValue([mockFile])

      const result = renderComponent({ ...level2WithFilesProps, ...extraProps })

      fireEvent.click(screen.getByTestId('breadcrumb-load-files'))

      await waitFor(() =>
        expect(screen.getByTestId('ecm-file-f1')).toBeInTheDocument(),
      )

      expect(capturedSetDynamicFolderHierarchy).not.toBeNull()
      act(() => capturedSetDynamicFolderHierarchy(hierarchy))

      return result
    }

    /**
     * Scenario A:
     * Hierarchy has ONE node [node-1]. Back pops it → hierarchy empty →
     * falls to getFilesFromEcmByCaseId (level 2, not TM).
     */
    it('re-fetches affiliate files when hierarchy empties after back (level 2)', async () => {
      const { container } = await setupWithHierarchy([
        { id: 'node-1', label: 'Folder 1' },
      ])

      get_ecm_files.mockClear()
      getFilesFromEcmByCaseId.mockClear()

      fireEvent.click(getBackBtn(container))

      await waitFor(() =>
        expect(getFilesFromEcmByCaseId).toHaveBeenCalledWith('case-001'),
      )
      expect(get_ecm_files).not.toHaveBeenCalled()
    })

    /**
     * Scenario B:
     * Hierarchy has TWO nodes [node-1, node-2]. Back pops node-2 →
     * hierarchy still has [node-1] → calls get_ecm_files('node-1').
     */
    it('fetches previous node when hierarchy still has items after back', async () => {
      const { container } = await setupWithHierarchy([
        { id: 'node-1', label: 'Folder 1' },
        { id: 'node-2', label: 'Folder 2' },
      ])

      get_ecm_files.mockClear()

      fireEvent.click(getBackBtn(container))

      await waitFor(() => expect(get_ecm_files).toHaveBeenCalledWith('node-1'))
    })

    /**
     * Scenario C (TM branch):
     * Level 5, hierarchy has ONE node. Back pops it → hierarchy empty →
     * level==5 branch → setAffiliateFolderData(level 5) + get_ecm_files(EO_TM_NODE_ID).
     */
    it('calls get_ecm_files(EO_TM_NODE_ID) when hierarchy empties at level 5 (TM branch)', async () => {
      const setAffiliateFolderData = vi.fn()

      // Start at level 5 with files already loaded (so EcmFile renders)
      const { container } = renderComponent({
        setAffiliateFolderData,
        affiliateFolderData: {
          level: 5,
          type: 'tm',
          selectedRegion: 'tm-node-123',
          selectedAffiliate: 'tm-node-123',
        },
      })

      // Use breadcrumb-load-files to populate files without touching hierarchy state
      getFilesFromEcmByCaseId.mockResolvedValue([mockFile])
      fireEvent.click(screen.getByTestId('breadcrumb-load-files'))
      await waitFor(() =>
        expect(screen.getByTestId('ecm-file-f1')).toBeInTheDocument(),
      )
      expect(capturedSetDynamicFolderHierarchy).not.toBeNull()

      // Inject one node into hierarchy
      act(() =>
        capturedSetDynamicFolderHierarchy([
          { id: 'node-1', label: 'Folder 1' },
        ]),
      )

      get_ecm_files.mockClear()
      setAffiliateFolderData.mockClear()

      // Back: pops node-1 → hierarchy empty → level==5 → TM branch
      fireEvent.click(getBackBtn(container))

      await waitFor(() =>
        expect(get_ecm_files).toHaveBeenCalledWith('tm-node-123'),
      )
      expect(setAffiliateFolderData).toHaveBeenCalledWith(
        expect.objectContaining({ level: 5, type: 'tm' }),
      )
    })
  })

  // ══════════════════════════════════════════════════════════════════════════
  // handleDynamicFolderClick – all branches
  // ══════════════════════════════════════════════════════════════════════════

  describe('handleDynamicFolderClick – breadcrumb interactions', () => {
    const level2Data = {
      affiliateFolderData: {
        level: 2,
        type: 'files',
        selectedRegion: { regionName: 'Region A' },
        selectedAffiliate: { affiliateName: 'Aff1', caseID: 'c1' },
      },
    }

    it('calls get_ecm_files with the correct nodeId', async () => {
      renderComponent(level2Data)
      fireEvent.click(screen.getByTestId('breadcrumb-btn'))
      await waitFor(() => expect(get_ecm_files).toHaveBeenCalledWith('node-1'))
    })

    it('tracks breadcrumbClick when label is provided', async () => {
      renderComponent(level2Data)
      fireEvent.click(screen.getByTestId('breadcrumb-btn'))
      await waitFor(() =>
        expect(
          TRACKEVENTOBJ.ecmFolderModal.breadcrumbClick,
        ).toHaveBeenCalledWith(
          expect.objectContaining({ folderName: 'Test Folder' }),
        ),
      )
    })

    it('does NOT track breadcrumbClick when no label is provided', async () => {
      renderComponent(level2Data)
      fireEvent.click(screen.getByTestId('breadcrumb-btn-no-label'))
      await waitFor(() => expect(get_ecm_files).toHaveBeenCalledWith('node-2'))
      expect(
        TRACKEVENTOBJ.ecmFolderModal.breadcrumbClick,
      ).not.toHaveBeenCalled()
    })

    it('does nothing (early return) when nodeId is falsy', async () => {
      renderComponent(level2Data)
      fireEvent.click(screen.getByTestId('breadcrumb-btn-no-node'))
      await new Promise((r) => setTimeout(r, 50))
      expect(get_ecm_files).not.toHaveBeenCalled()
    })
  })

  // ══════════════════════════════════════════════════════════════════════════
  // Edge cases
  // ══════════════════════════════════════════════════════════════════════════

  describe('edge cases', () => {
    it('does not crash when caseData is undefined', () => {
      expect(() => renderComponent({ caseData: undefined })).not.toThrow()
    })

    it('does not crash when affiliateDataState is empty', () => {
      expect(() => renderComponent({ affiliateDataState: [] })).not.toThrow()
    })

    it('does not render back button when level < 2', () => {
      const { container } = renderComponent()
      expect(getBackBtn(container)).toBeNull()
    })

    it('renders level>1 scroll container (overflow-hidden) at level 2', () => {
      const { container } = renderComponent({
        affiliateFolderData: {
          level: 2,
          type: 'files',
          selectedRegion: 'r1',
          selectedAffiliate: { affiliateName: 'A', caseID: 'c1' },
        },
      })
      expect(
        container.querySelector(
          '[data-static-id="AffiliateFolderModal.js_div_9304a8"]',
        ),
      ).not.toBeNull()
    })

    it('renders the level-1 outer container at level 1', () => {
      const { container } = renderComponent()
      expect(
        container.querySelector(
          '[data-static-id="AffiliateFolderModal.js_div_6bdf99"]',
        ),
      ).not.toBeNull()
    })
  })
})
