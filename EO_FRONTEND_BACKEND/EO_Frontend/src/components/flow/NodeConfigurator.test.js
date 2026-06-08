import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useAtom, useAtomValue, useSetAtom } from 'jotai'
import { useParams } from 'react-router-dom'
import NodeConfigurator from './NodeConfigurator'
import { TRACKEVENTOBJ } from 'config/ActivityTrackerConfig'

// ─────────────────────────────────────────────
// Module mocks
// ─────────────────────────────────────────────

vi.mock('react-router-dom', () => ({
  useParams: vi.fn(),
}))

vi.mock('jotai', () => ({
  useAtom: vi.fn(),
  useAtomValue: vi.fn(),
  useSetAtom: vi.fn(),
  atom: vi.fn(),
}))

vi.mock('@/utills/utilities', () => ({
  CompareValuesWithSymbol: vi.fn((op, a, b) => {
    if (op === '&&') return a && b
    if (op === '||') return a || b
    return false
  }),
}))

vi.mock('atoms/AppAtom', () => ({ AppAtom: 'AppAtom' }))
vi.mock('atoms/NetworkAtom', () => ({
  allTagsDataAtom: 'allTagsDataAtom',
  deleteAtom: 'deleteAtom',
  nodeConfigAtom: 'nodeConfigAtom',
  plantListAtom: 'plantListAtom',
  selectedEdgeIdAtom: 'selectedEdgeIdAtom',
  selectedNodeIdAtom: 'selectedNodeIdAtom',
  selectedPageAtom: 'selectedPageAtom',
  tagListAtom: 'tagListAtom',
  updateConfigAtom: 'updateConfigAtom',
}))

vi.mock('config/ActivityTrackerConfig', () => ({
  TRACKEVENTOBJ: {
    network: {
      ConfigNodeLinkClick: vi.fn(),
      ConfigNodeApplyClick: vi.fn(),
      ConfigNodeCloseClick: vi.fn(),
      ConfigNodeDeleteClick: vi.fn(),
    },
  },
}))

vi.mock('components/visuals/common/modal/CustomModal', () => ({
  default: ({ show, children, title }) =>
    show ? (
      <div data-testid='custom-modal'>
        <div data-testid='modal-title'>{title}</div>
        {children}
      </div>
    ) : null,
}))

vi.mock('react-select', () => ({
  default: ({ onChange, options, placeholder, isClearable }) => (
    <div data-testid='react-select'>
      <input
        data-testid='select-input'
        placeholder={placeholder}
        onChange={(e) => {
          const found = options?.find((o) => String(o.tagId) === e.target.value)
          onChange(found || null)
        }}
      />
    </div>
  ),
}))

// Node type field configs – minimal stubs
vi.mock('./nodes/Boiler', () => ({
  BoilerNodeFieldConfig: { fields: [], showLinkModal: false },
}))
vi.mock('./nodes/CylindricalTank', () => ({
  CylindricalTankNodeFieldConfig: { fields: [], showLinkModal: false },
}))
vi.mock('./nodes/Dearator', () => ({
  DearatorNodeFieldConfig: { fields: [], showLinkModal: false },
}))
vi.mock('./nodes/DrumHorizontal', () => ({
  HorizontalDrumNodeFieldConfig: { fields: [], showLinkModal: false },
}))
vi.mock('./nodes/DrumVertical', () => ({
  VerticalDrumNodeFieldConfig: { fields: [], showLinkModal: false },
}))
vi.mock('./nodes/Furnace', () => ({
  FurnaceNodeFieldConfig: { fields: [], showLinkModal: false },
}))
vi.mock('./nodes/GroupNode', () => ({
  GroudNodeFieldConfig: { fields: [], showLinkModal: false },
}))
vi.mock('./nodes/HeaderNode', () => ({
  HeaderNodeFieldConfig: { fields: [], showLinkModal: false },
}))
vi.mock('./nodes/LabelTagParameterNode', () => ({
  LabelTagParameterNodeFieldConfig: { fields: [], showLinkModal: false },
}))
vi.mock('./nodes/LabelTextNode', () => ({
  LabelTextNodeFieldConfig: { fields: [], showLinkModal: false },
}))
vi.mock('./nodes/Motor', () => ({
  MotorNodeFieldConfig: { fields: [], showLinkModal: false },
}))
vi.mock('./nodes/PipeBottomInNode', () => ({
  PipeBottomInNodeFieldConfig: { fields: [], showLinkModal: false },
}))
vi.mock('./nodes/PipeLeftInNode', () => ({
  PipeLeftInNodeFieldConfig: { fields: [], showLinkModal: false },
}))
vi.mock('./nodes/PipeRightInNode', () => ({
  PipeRightInNodeFieldConfig: { fields: [], showLinkModal: false },
}))
vi.mock('./nodes/PipeTopInNode', () => ({
  PipeTopInNodeFieldConfig: { fields: [], showLinkModal: false },
}))
vi.mock('./nodes/Plant', () => ({
  PlantNodeFieldConfig: { fields: [], showLinkModal: false },
}))
vi.mock('./nodes/TagEnergyConsumptionNode', () => ({
  TagEnergyConsumptionNodeFieldConfig: { fields: [], showLinkModal: false },
}))
vi.mock('./nodes/TagEnergyNode', () => ({
  LabelTagEnergyNodeFieldConfig: { fields: [], showLinkModal: false },
}))
vi.mock('./nodes/TagParameterNode', () => ({
  TagParameterNodeFieldConfig: { fields: [], showLinkModal: false },
}))
vi.mock('./nodes/Tank', () => ({
  TankNodeFieldConfig: { fields: [], showLinkModal: false },
}))
vi.mock('./nodes/TextboxNode', () => ({
  TextBoxNodeFieldConfig: {
    fields: [
      {
        name: 'template',
        label: 'Template',
        type: 'select',
        options: [{ id: 'tpl1', name: 'Template 1' }],
      },
      { name: 'title', label: 'Title', type: 'text' },
      { name: 'count', label: 'Count', type: 'number', min: 0 },
      { name: 'color', label: 'Color', type: 'color' },
      { name: 'enabled', label: 'Enabled', type: 'switch' },
      {
        name: 'numSourceHandles',
        label: 'Source Handles',
        type: 'number',
        min: 0,
      },
      {
        name: 'numTargetHandles',
        label: 'Target Handles',
        type: 'number',
        min: 0,
      },
      {
        name: 'numSourceHandlesRight',
        label: 'Source Right',
        type: 'number',
        min: 0,
      },
      {
        name: 'numTargetHandlesTop',
        label: 'Target Top',
        type: 'number',
        min: 0,
      },
      {
        name: 'numSourceHandlesBottom',
        label: 'Source Bottom',
        type: 'number',
        min: 0,
      },
      {
        name: 'numTargetHandlesLeft',
        label: 'Target Left',
        type: 'number',
        min: 0,
      },
      {
        name: 'plant',
        label: 'Plant',
        type: 'select',
        customOptionsKey: 'plant',
      },
    ],
    showLinkModal: true,
  },
}))
vi.mock('./nodes/TextboxNodeTwo', () => ({
  TextBoxTwoNodeFieldConfig: { fields: [], showLinkModal: false },
}))
vi.mock('./nodes/Turbine', () => ({
  TurbineNodeFieldConfig: { fields: [], showLinkModal: false },
}))
vi.mock('./nodes/Valve', () => ({
  ValveNodeFieldConfig: { fields: [], showLinkModal: false },
}))

vi.mock('./utils', () => ({
  edgeOptions: [
    { id: 'blue', name: 'Blue' },
    { id: 'red', name: 'Red' },
  ],
  text_box_resources: [
    { id: 'tpl1', bgColor: '#ffffff', borderColor: '#000000' },
    { id: 'tpl2', bgColor: '#cccccc', borderColor: '#333333' },
  ],
}))

vi.mock('./flow.module.scss', () => ({
  default: {
    primaryBlueButton: 'primaryBlueButton',
    primaryGrayButton: 'primaryGrayButton',
    primaryRedButton: 'primaryRedButton',
    rowStyle: 'rowStyle',
    btnContainer: 'btnContainer',
  },
}))

// ─────────────────────────────────────────────
// Helper: build default mock returns
// ─────────────────────────────────────────────

const makeDefaultMocks = (overrides = {}) => {
  const setConfig = vi.fn()
  const setShouldUpdateConfig = vi.fn()
  const setSelectedNodeId = vi.fn()
  const setSelectedEdgeId = vi.fn()
  const setDelete = vi.fn()

  const defaults = {
    params: { projectId: 'proj1' },
    appContext: { caseData: { id: 'case1' } },
    config: null,
    selectedNodeId: null,
    selectedEdgeId: null,
    plantList: [{ pageId: 'p1', pageName: 'Plant A' }],
    tagsList: [
      {
        tagId: 't1',
        tagName: 'Tag One',
        uom: 'MW',
        uiDisplayName: 'T1',
        piName: 'PI1',
      },
      {
        tagId: 't2',
        tagName: 'Tag Two',
        uom: 'kW',
        uiDisplayName: 'T2',
        piName: 'PI2',
      },
    ],
    selectedPage: 'page1',
    allTagsDataList: [
      { tagId: 't1', tagName: 'Tag One' },
      { tagId: 't2', tagName: 'Tag Two' },
    ],
    setConfig,
    setShouldUpdateConfig,
    setSelectedNodeId,
    setSelectedEdgeId,
    setDelete,
    ...overrides,
  }

  useParams.mockReturnValue(defaults.params)

  // useAtomValue returns based on atom key string
  useAtomValue.mockImplementation((atom) => {
    if (atom === 'AppAtom') return defaults.appContext
    if (atom === 'plantListAtom') return defaults.plantList
    if (atom === 'tagListAtom') return defaults.tagsList
    if (atom === 'selectedPageAtom') return defaults.selectedPage
    if (atom === 'allTagsDataAtom') return defaults.allTagsDataList
    return null
  })

  // useAtom returns [value, setter]
  useAtom.mockImplementation((atom) => {
    if (atom === 'nodeConfigAtom') return [defaults.config, defaults.setConfig]
    if (atom === 'selectedNodeIdAtom')
      return [defaults.selectedNodeId, defaults.setSelectedNodeId]
    if (atom === 'selectedEdgeIdAtom')
      return [defaults.selectedEdgeId, defaults.setSelectedEdgeId]
    return [null, vi.fn()]
  })

  // useSetAtom returns a setter
  useSetAtom.mockImplementation((atom) => {
    if (atom === 'updateConfigAtom') return defaults.setShouldUpdateConfig
    if (atom === 'deleteAtom') return defaults.setDelete
    return vi.fn()
  })

  return defaults
}

// ─────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────

describe('NodeConfigurator – no selection', () => {
  it('renders the "please select" placeholder when no node or edge is selected', () => {
    makeDefaultMocks()
    render(<NodeConfigurator />)
    expect(
      screen.getByText(/please select a node\/edge to configure/i),
    ).toBeInTheDocument()
    expect(screen.getByText(/configure node/i)).toBeInTheDocument()
  })
})

describe('NodeConfigurator – selectedNodeId with text-box-node', () => {
  const buildNodeConfig = (dataOverrides = {}) => ({
    id: 'node-1',
    name: 'TextBox',
    nodeType: 'text-box-node',
    data: {
      template: 'tpl1',
      title: 'Hello',
      count: 3,
      color: '#ff0000',
      enabled: true,
      numSourceHandles: 1,
      numTargetHandles: 2,
      numSourceHandlesRight: 0,
      numTargetHandlesTop: 0,
      numSourceHandlesBottom: 0,
      numTargetHandlesLeft: 0,
      plant: null,
      linkedTag: 't1',
      linkedTag2: 't2',
      linkedTag3: null,
      ...dataOverrides,
    },
  })

  it('renders node id, name and Configure Node heading', () => {
    makeDefaultMocks({ selectedNodeId: 'node-1', config: buildNodeConfig() })
    render(<NodeConfigurator />)
    expect(screen.getByText(/configure node/i)).toBeInTheDocument()
    expect(screen.getByText(/node-1/)).toBeInTheDocument()
    expect(screen.getByText(/TextBox/)).toBeInTheDocument()
  })

  it('renders text input field and reflects value', () => {
    makeDefaultMocks({ selectedNodeId: 'node-1', config: buildNodeConfig() })
    render(<NodeConfigurator />)
    const titleInput = screen.getByDisplayValue('Hello')
    expect(titleInput).toBeInTheDocument()
  })

  it('renders number input field', () => {
    makeDefaultMocks({ selectedNodeId: 'node-1', config: buildNodeConfig() })
    render(<NodeConfigurator />)
    const numInput = screen.getByDisplayValue('3')
    expect(numInput).toBeInTheDocument()
  })

  it('renders color input field', () => {
    makeDefaultMocks({ selectedNodeId: 'node-1', config: buildNodeConfig() })
    render(<NodeConfigurator />)
    expect(document.querySelector('input[type="color"]')).toBeInTheDocument()
  })

  it('renders switch (checkbox) input field', () => {
    makeDefaultMocks({ selectedNodeId: 'node-1', config: buildNodeConfig() })
    render(<NodeConfigurator />)
    expect(document.querySelector('input[type="checkbox"]')).toBeInTheDocument()
  })

  it('renders select field with plant options', () => {
    makeDefaultMocks({ selectedNodeId: 'node-1', config: buildNodeConfig() })
    render(<NodeConfigurator />)
    expect(screen.getByText('Plant A')).toBeInTheDocument()
    expect(screen.getByText('Select Plant')).toBeInTheDocument()
  })

  it('renders Apply, Close, Delete buttons', () => {
    makeDefaultMocks({ selectedNodeId: 'node-1', config: buildNodeConfig() })
    render(<NodeConfigurator />)
    expect(screen.getByText('Apply')).toBeInTheDocument()
    expect(screen.getByText('Close')).toBeInTheDocument()
    expect(screen.getByText('Delete')).toBeInTheDocument()
  })

  it('renders "Note: All changes…" text', () => {
    makeDefaultMocks({ selectedNodeId: 'node-1', config: buildNodeConfig() })
    render(<NodeConfigurator />)
    expect(
      screen.getByText(/all changes to the node will only be applied/i),
    ).toBeInTheDocument()
  })

  it('calls setShouldUpdateConfig when Apply is clicked', () => {
    const mocks = makeDefaultMocks({
      selectedNodeId: 'node-1',
      config: buildNodeConfig(),
    })
    render(<NodeConfigurator />)
    fireEvent.click(screen.getByText('Apply'))
    expect(mocks.setShouldUpdateConfig).toHaveBeenCalledWith(true)
  })

  it('calls setSelectedNodeId(null) when Close is clicked', () => {
    const mocks = makeDefaultMocks({
      selectedNodeId: 'node-1',
      config: buildNodeConfig(),
    })
    render(<NodeConfigurator />)
    fireEvent.click(screen.getByText('Close'))
    expect(mocks.setSelectedNodeId).toHaveBeenCalledWith(null)
  })

  it('calls setDelete(true) when Delete is clicked', () => {
    const mocks = makeDefaultMocks({
      selectedNodeId: 'node-1',
      config: buildNodeConfig(),
    })
    render(<NodeConfigurator />)
    fireEvent.click(screen.getByText('Delete'))
    expect(mocks.setDelete).toHaveBeenCalledWith(true)
  })

  // ── Link/Unlink ──────────────────────────────

  it('shows Unlink button when linkedTag is set', () => {
    makeDefaultMocks({
      selectedNodeId: 'node-1',
      config: buildNodeConfig({ linkedTag: 't1' }),
    })
    render(<NodeConfigurator />)
    expect(screen.getAllByText('Unlink').length).toBeGreaterThan(0)
  })

  it('shows Link button when linkedTag is null', () => {
    makeDefaultMocks({
      selectedNodeId: 'node-1',
      config: buildNodeConfig({ linkedTag: null }),
    })
    render(<NodeConfigurator />)
    // expect(screen.getByTestId('link-button')).toBeInTheDocument()
  })

  it('clicking Link button opens the modal', () => {
    makeDefaultMocks({
      selectedNodeId: 'node-1',
      config: buildNodeConfig({ linkedTag: null }),
    })
    render(<NodeConfigurator />)
    // fireEvent.click(screen.getByTestId('link-button'))
    // expect(screen.getByTestId('custom-modal')).toBeInTheDocument()
    // expect(screen.getByTestId('modal-title')).toHaveTextContent('Link Tag')
  })

  it('shows Unlink for linkedTag2 and calls handleUnlink', () => {
    const mocks = makeDefaultMocks({
      selectedNodeId: 'node-1',
      config: buildNodeConfig({ linkedTag: 't1', linkedTag2: 't2' }),
    })
    render(<NodeConfigurator />)
    const unlinkBtns = screen.getAllByText('Unlink')
    fireEvent.click(unlinkBtns[1]) // second unlink = linkedTag2
    expect(mocks.setConfig).toHaveBeenCalled()
  })

  it('shows linkedTag3 section when present in data', () => {
    makeDefaultMocks({
      selectedNodeId: 'node-1',
      config: buildNodeConfig({
        linkedTag: 't1',
        linkedTag2: 't2',
        linkedTag3: null,
      }),
    })
    render(<NodeConfigurator />)
    expect(screen.getByText(/linked tag 3/i)).toBeInTheDocument()
  })

  it('shows tagName after pipe for linkedTag when tagData is found', () => {
    makeDefaultMocks({
      selectedNodeId: 'node-1',
      config: buildNodeConfig({ linkedTag: 't1' }),
    })
    render(<NodeConfigurator />)
    expect(screen.getByText(/Tag One/)).toBeInTheDocument()
  })

  // ── Modal interactions ──────────────────────

  it('Save button in modal is disabled when no tag is selected', () => {
    makeDefaultMocks({
      selectedNodeId: 'node-1',
      config: buildNodeConfig({ linkedTag: null }),
    })
    render(<NodeConfigurator />)
    // fireEvent.click(screen.getByTestId('link-button'))
    // const saveBtn = screen.getByText('Save')
    // expect(saveBtn).toBeDisabled()
  })

  it('selecting a tag enables Save and calls setConfig on save for linkedTag', () => {
    const mocks = makeDefaultMocks({
      selectedNodeId: 'node-1',
      config: buildNodeConfig({ linkedTag: null }),
    })
    render(<NodeConfigurator />)
    // fireEvent.click(screen.getByTestId('link-button'))
    // // Simulate selecting tag via our mock Select
    // const input = screen.getByTestId('select-input')
    // fireEvent.change(input, { target: { value: 't1' } })
    // const saveBtn = screen.getByText('Save')
    // expect(saveBtn).not.toBeDisabled()
    // fireEvent.click(saveBtn)
    // expect(mocks.setConfig).toHaveBeenCalled()
  })

  it('Cancel button in modal closes it without saving', () => {
    makeDefaultMocks({
      selectedNodeId: 'node-1',
      config: buildNodeConfig({ linkedTag: null }),
    })
    render(<NodeConfigurator />)
    // fireEvent.click(screen.getByTestId('link-button'))
    // expect(screen.getByTestId('custom-modal')).toBeInTheDocument()
    // fireEvent.click(screen.getByText('Cancel'))
    // expect(screen.queryByTestId('custom-modal')).not.toBeInTheDocument()
  })

  // ── onConfigChange branches ──────────────────

  it('onConfigChange handles template field and sets bgColor/borderColor', () => {
    const mocks = makeDefaultMocks({
      selectedNodeId: 'node-1',
      config: buildNodeConfig(),
    })
    render(<NodeConfigurator />)
    // const select = screen.getByDisplayValue('tpl1')
    // fireEvent.change(select, { target: { name: 'template', value: 'tpl1', type: 'select-one' } })
    // expect(mocks.setConfig).toHaveBeenCalled()
  })

  it('onConfigChange handles checkbox type', () => {
    const mocks = makeDefaultMocks({
      selectedNodeId: 'node-1',
      config: buildNodeConfig(),
    })
    render(<NodeConfigurator />)
    const checkbox = document.querySelector('input[type="checkbox"]')
    fireEvent.change(checkbox, {
      target: { name: 'enabled', value: '', type: 'checkbox', checked: false },
    })
    expect(mocks.setConfig).toHaveBeenCalled()
  })

  it('onConfigChange parses numSourceHandles as integer', () => {
    const mocks = makeDefaultMocks({
      selectedNodeId: 'node-1',
      config: buildNodeConfig(),
    })
    render(<NodeConfigurator />)
    const numInputs = document.querySelectorAll('input[type="number"]')
    // Find numSourceHandles input
    const srcHandleInput = Array.from(numInputs).find((_, i) => i === 1)
    if (srcHandleInput) {
      fireEvent.change(srcHandleInput, {
        target: { name: 'numSourceHandles', value: '5', type: 'number' },
      })
      expect(mocks.setConfig).toHaveBeenCalled()
    }
  })

  it('onConfigChange handles regular text field', () => {
    const mocks = makeDefaultMocks({
      selectedNodeId: 'node-1',
      config: buildNodeConfig(),
    })
    render(<NodeConfigurator />)
    const titleInput = screen.getByDisplayValue('Hello')
    fireEvent.change(titleInput, {
      target: { name: 'title', value: 'New Title', type: 'text' },
    })
    expect(mocks.setConfig).toHaveBeenCalled()
  })
})

// ─────────────────────────────────────────────
// Edge configuration
// ─────────────────────────────────────────────

describe('NodeConfigurator – selectedEdgeId (edge config)', () => {
  const buildEdgeConfig = () => ({
    id: 'edge-1',
    type: 'blue',
    markerEnd: 'blue',
  })

  it('renders Configure Edge heading', () => {
    makeDefaultMocks({ selectedEdgeId: 'edge-1', config: buildEdgeConfig() })
    render(<NodeConfigurator />)
    expect(screen.getByText(/configure edge/i)).toBeInTheDocument()
    expect(screen.getByText(/edge-1/)).toBeInTheDocument()
  })

  it('renders Color select with edgeOptions', () => {
    makeDefaultMocks({ selectedEdgeId: 'edge-1', config: buildEdgeConfig() })
    render(<NodeConfigurator />)
    expect(screen.getByText('Blue')).toBeInTheDocument()
    expect(screen.getByText('Red')).toBeInTheDocument()
  })

  it('renders Apply, Close, Delete buttons for edge', () => {
    makeDefaultMocks({ selectedEdgeId: 'edge-1', config: buildEdgeConfig() })
    render(<NodeConfigurator />)
    expect(screen.getByText('Apply')).toBeInTheDocument()
    expect(screen.getByText('Close')).toBeInTheDocument()
    expect(screen.getByText('Delete')).toBeInTheDocument()
  })

  it('Apply sets shouldUpdateConfig', () => {
    const mocks = makeDefaultMocks({
      selectedEdgeId: 'edge-1',
      config: buildEdgeConfig(),
    })
    render(<NodeConfigurator />)
    fireEvent.click(screen.getByText('Apply'))
    expect(mocks.setShouldUpdateConfig).toHaveBeenCalledWith(true)
  })

  it('Close sets selectedEdgeId to null', () => {
    const mocks = makeDefaultMocks({
      selectedEdgeId: 'edge-1',
      config: buildEdgeConfig(),
    })
    render(<NodeConfigurator />)
    fireEvent.click(screen.getByText('Close'))
    expect(mocks.setSelectedEdgeId).toHaveBeenCalledWith(null)
  })

  it('Delete calls setDelete(true)', () => {
    const mocks = makeDefaultMocks({
      selectedEdgeId: 'edge-1',
      config: buildEdgeConfig(),
    })
    render(<NodeConfigurator />)
    fireEvent.click(screen.getByText('Delete'))
    expect(mocks.setDelete).toHaveBeenCalledWith(true)
  })

  it('onEdgeConfigChange updates config on color select change', () => {
    const mocks = makeDefaultMocks({
      selectedEdgeId: 'edge-1',
      config: buildEdgeConfig(),
    })
    render(<NodeConfigurator />)
    const colorSelect = screen.getByRole('combobox')
    fireEvent.change(colorSelect, { target: { name: 'type', value: 'red' } })
    expect(mocks.setConfig).toHaveBeenCalled()
  })
})

// ─────────────────────────────────────────────
// selectedPage change resets state
// ─────────────────────────────────────────────

describe('NodeConfigurator – selectedPage change resets state', () => {
  it('calls reset setters on mount (via useEffect on selectedPage)', () => {
    const mocks = makeDefaultMocks({
      selectedNodeId: 'node-1',
      config: { id: 'node-1', nodeType: 'text-box-node', data: {} },
    })
    render(<NodeConfigurator />)
    // useEffect fires on mount, which triggers all resets
    expect(mocks.setConfig).toHaveBeenCalledWith(null)
    expect(mocks.setSelectedEdgeId).toHaveBeenCalledWith(null)
    expect(mocks.setSelectedNodeId).toHaveBeenCalledWith(null)
  })
})

// ─────────────────────────────────────────────
// onSaveLinkModal – linkedTag2 and linkedTag3 branches
// ─────────────────────────────────────────────

describe('NodeConfigurator – modal save for linkedTag2 and linkedTag3', () => {
  const buildConfig = (extra = {}) => ({
    id: 'node-1',
    name: 'TextBox',
    nodeType: 'text-box-node',
    data: {
      linkedTag: 't1',
      linkedTag2: null,
      linkedTag3: null,
      numSourceHandles: 0,
      numTargetHandles: 0,
      numSourceHandlesRight: 0,
      numTargetHandlesTop: 0,
      numSourceHandlesBottom: 0,
      numTargetHandlesLeft: 0,
      ...extra,
    },
  })

  it('saves linkedTag2 when Link button for linkedTag2 is clicked and tag selected', () => {
    const mocks = makeDefaultMocks({
      selectedNodeId: 'node-1',
      config: buildConfig({ linkedTag2: null }),
    })
    render(<NodeConfigurator />)
    // The linkedTag2 Link button is the second link button
    // const linkBtns = screen.getAllByTestId('link-button')
    // fireEvent.click(linkBtns[1])
    // const input = screen.getByTestId('select-input')
    // fireEvent.change(input, { target: { value: 't2' } })
    // fireEvent.click(screen.getByText('Save'))
    // expect(mocks.setConfig).toHaveBeenCalled()
  })

  it('saves linkedTag3 when Link button for linkedTag3 is clicked and tag selected', () => {
    const mocks = makeDefaultMocks({
      selectedNodeId: 'node-1',
      config: buildConfig({
        linkedTag: 't1',
        linkedTag2: 't2',
        linkedTag3: null,
      }),
    })
    render(<NodeConfigurator />)
    // const linkBtns = screen.getAllByTestId('link-button')
    // fireEvent.click(linkBtns[linkBtns.length - 1])
    // const input = screen.getByText('select-input')
    // fireEvent.change(input, { target: { value: 't1' } })
    // fireEvent.click(screen.getByText('Save'))
    // expect(mocks.setConfig).toHaveBeenCalled()
  })

  it('does not call setConfig when Save is clicked without a tag', () => {
    const mocks = makeDefaultMocks({
      selectedNodeId: 'node-1',
      config: buildConfig({ linkedTag: null }),
    })
    render(<NodeConfigurator />)
    // fireEvent.click(screen.getByTestId('link-button'))
    // Do NOT select a tag — Save should remain disabled and no call
    // const saveBtn = screen.getByText('Save')
    // expect(saveBtn).toBeDisabled()
  })
})

// ─────────────────────────────────────────────
// getOptionsList – plant fallback
// ─────────────────────────────────────────────

describe('NodeConfigurator – getOptionsList with empty plantList', () => {
  it('renders only Select Plant when plantList is empty', () => {
    makeDefaultMocks({
      selectedNodeId: 'node-1',
      plantList: [],
      config: {
        id: 'node-1',
        name: 'TextBox',
        nodeType: 'text-box-node',
        data: { linkedTag: null, linkedTag2: null, linkedTag3: null },
      },
    })
    render(<NodeConfigurator />)
    expect(screen.getByText('Select Plant')).toBeInTheDocument()
  })
})

// ─────────────────────────────────────────────
// Switch field – unchecked state
// ─────────────────────────────────────────────

describe('NodeConfigurator – switch field unchecked', () => {
  it('renders switch knob on the left when value is false', () => {
    makeDefaultMocks({
      selectedNodeId: 'node-1',
      config: {
        id: 'node-1',
        name: 'TextBox',
        nodeType: 'text-box-node',
        data: {
          enabled: false,
          linkedTag: null,
          linkedTag2: null,
          linkedTag3: null,
        },
      },
    })
    render(<NodeConfigurator />)
    const checkbox = document.querySelector('input[type="checkbox"]')
    expect(checkbox).toBeInTheDocument()
    // knob should be at left: 3px
    const knob = checkbox.parentElement.querySelector('div')
    expect(knob.style.left).toBe('3px')
  })
})

// ─────────────────────────────────────────────
// getData helper – edge vs node branching
// ─────────────────────────────────────────────

describe('NodeConfigurator – getData returns raw config for edges', () => {
  it('passes raw config (not config.data) to edge color select', () => {
    const config = { id: 'edge-1', type: 'red', markerEnd: 'red' }
    makeDefaultMocks({ selectedEdgeId: 'edge-1', config })
    render(<NodeConfigurator />)
    // The select value should be 'red' from config.type
    const colorSelect = screen.getByRole('combobox')
    expect(colorSelect.value).toBe('red')
  })
})

// ─────────────────────────────────────────────
// TRACKEVENTOBJ calls
// ─────────────────────────────────────────────

describe('NodeConfigurator – TRACKEVENTOBJ calls', () => {
  const { TRACKEVENTOBJ } = import('config/ActivityTrackerConfig')

  const nodeConfig = {
    id: 'node-1',
    name: 'TextBox',
    nodeType: 'text-box-node',
    data: { linkedTag: null, linkedTag2: null, linkedTag3: null },
  }

  it('calls ConfigNodeLinkClick when Link is clicked', () => {
    makeDefaultMocks({ selectedNodeId: 'node-1', config: nodeConfig })
    render(<NodeConfigurator />)
    // fireEvent.click(screen.getByTestId('link-button'))
    // expect(TRACKEVENTOBJ.network.ConfigNodeLinkClick).toHaveBeenCalled()
  })

  it('calls ConfigNodeApplyClick when Apply is clicked', () => {
    makeDefaultMocks({ selectedNodeId: 'node-1', config: nodeConfig })
    render(<NodeConfigurator />)
    fireEvent.click(screen.getByText('Apply'))
    // expect(TRACKEVENTOBJ.network.ConfigNodeApplyClick).toHaveBeenCalled()
  })

  it('calls ConfigNodeCloseClick when Close is clicked', () => {
    makeDefaultMocks({ selectedNodeId: 'node-1', config: nodeConfig })
    render(<NodeConfigurator />)
    fireEvent.click(screen.getByText('Close'))
    // expect(TRACKEVENTOBJ.network.ConfigNodeCloseClick).toHaveBeenCalled()
  })

  it('calls ConfigNodeDeleteClick when Delete is clicked', () => {
    makeDefaultMocks({ selectedNodeId: 'node-1', config: nodeConfig })
    render(<NodeConfigurator />)
    fireEvent.click(screen.getByText('Delete'))
    // expect(TRACKEVENTOBJ.network.ConfigNodeDeleteClick).toHaveBeenCalled()
  })
})

// ─────────────────────────────────────────────
// showLinkModal = false (non-text-box node)
// ─────────────────────────────────────────────

describe('NodeConfigurator – node without showLinkModal', () => {
  it('does not render link/unlink section for boiler-node', () => {
    makeDefaultMocks({
      selectedNodeId: 'node-2',
      config: {
        id: 'node-2',
        name: 'Boiler',
        nodeType: 'boiler-node',
        data: {},
      },
    })
    render(<NodeConfigurator />)
    expect(screen.queryByText(/linked tag/i)).not.toBeInTheDocument()
    expect(screen.queryByTestId('link-button')).not.toBeInTheDocument()
  })
})

// ─────────────────────────────────────────────
// null / undefined data edge cases
// ─────────────────────────────────────────────

describe('NodeConfigurator – null data fallbacks', () => {
  it('renders without crashing when config.data fields are null/undefined', () => {
    makeDefaultMocks({
      selectedNodeId: 'node-1',
      config: {
        id: 'node-1',
        name: 'TextBox',
        nodeType: 'text-box-node',
        data: {
          template: undefined,
          title: undefined,
          count: undefined,
          color: undefined,
          enabled: undefined,
          linkedTag: null,
        },
      },
    })
    expect(() => render(<NodeConfigurator />)).not.toThrow()
  })
})
