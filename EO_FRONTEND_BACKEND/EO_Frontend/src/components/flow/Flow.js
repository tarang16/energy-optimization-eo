import {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  Background,
  Controls,
  getConnectedEdges,
  ReactFlow,
  useReactFlow,
  useUpdateNodeInternals,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { AppAtom } from 'atoms/AppAtom'
import {
  deleteAtom,
  developerModeAtom,
  dragNodeTypeAtom,
  networkLockedAtom,
  newNodeAtom,
  nodeConfigAtom,
  plantListAtom,
  selectedEdgeIdAtom,
  selectedNodeIdAtom,
  selectedPageAtom,
  updateConfigAtom,
} from 'atoms/NetworkAtom'
import { TokenAtom } from 'atoms/RootAtom'
import Loader from 'components/ui/loader/Loader'
import { getUserDomainID } from 'components/visuals/common/modal/ODSAlertModal'
import { TRACKEVENTOBJ } from 'config/ActivityTrackerConfig'
import { useAtom, useAtomValue } from 'jotai'
import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import {
  getPageNodeDataByPageId,
  savePageNodeDataByPageId,
} from 'services/NetworkServices'
import { showToast } from 'utills/utilities'
import FlowingPipeEdge from './edges/FlowingPipeEdge'
import styles from './flow.module.scss'
import Marker from './marker'
import { BoilerNode } from './nodes/Boiler'
import { CylindricalTankNode } from './nodes/CylindricalTank'
import { DearatorNode } from './nodes/Dearator'
import { HorizontalDrumNode } from './nodes/DrumHorizontal'
import { VerticalDrumNode } from './nodes/DrumVertical'
import { FurnaceNode } from './nodes/Furnace'
import { GroupNode } from './nodes/GroupNode'
import { HeaderNode } from './nodes/HeaderNode'
import { LabelTagParameterNode } from './nodes/LabelTagParameterNode'
import { LabelTextNode } from './nodes/LabelTextNode'
import { MotorNode } from './nodes/Motor'
import { PipeBottomInNode } from './nodes/PipeBottomInNode'
import { PipeLeftInNode } from './nodes/PipeLeftInNode'
import { PipeRightInNode } from './nodes/PipeRightInNode'
import { PipeTopInNode } from './nodes/PipeTopInNode'
import { PlantNode } from './nodes/Plant'
import { TagEnergyConsumptionNode } from './nodes/TagEnergyConsumptionNode'
import { TagEnergyNode } from './nodes/TagEnergyNode'
import { TagParameterNode } from './nodes/TagParameterNode'
import { TankNode } from './nodes/Tank'
import { TextboxNode } from './nodes/TextboxNode'
import { TextboxTwoNode } from './nodes/TextboxNodeTwo'
import { TurbineNode } from './nodes/Turbine'
import { ValveNode } from './nodes/Valve'
import { allNodes } from './NodesList'
function generateRandom8DigitNumber() {
  const array = new Uint32Array(1)
  window.crypto?.getRandomValues(array)
  return (array[0] % 90000000) + 10000000
}

// Define custom node types
const nodeTypes = {
  headerNode: HeaderNode,
  textboxNode: TextboxNode,
  textboxNodeTwo: TextboxTwoNode,
  turbineNode: TurbineNode,
  motorNode: MotorNode,
  valveNode: ValveNode,
  tagParameterNode: TagParameterNode,
  tagEnergyNode: TagEnergyNode,
  labelTextNode: LabelTextNode,
  labelTagParameterNode: LabelTagParameterNode,
  groupNode: GroupNode,
  boilerNode: BoilerNode,
  furnaceNode: FurnaceNode,
  dearatorNode: DearatorNode,
  tankNode: TankNode,
  cylindricalTankNode: CylindricalTankNode,
  verticalDrumNode: VerticalDrumNode,
  horizontalDrumNode: HorizontalDrumNode,
  plantNode: PlantNode,
  tagEnergyConsumptionNode: TagEnergyConsumptionNode,
  pipeTopInNode: PipeTopInNode,
  pipeBottomInNode: PipeBottomInNode,
  pipeLeftInNode: PipeLeftInNode,
  pipeRightInNode: PipeRightInNode,
}

// Define custom edge types
export const edgeTypes = {
  flowingPipe: (props) =>
    FlowingPipeEdge({
      ...props,
      type: 'default',
    }),
  flowingPipeFuel: (props) =>
    FlowingPipeEdge({
      ...props,
      type: 'fuel',
    }),
  flowingPipePower: (props) =>
    FlowingPipeEdge({
      ...props,
      type: 'power',
    }),
  flowingPipeHp: (props) =>
    FlowingPipeEdge({
      ...props,
      type: 'hp',
    }),
  flowingPipeMp: (props) =>
    FlowingPipeEdge({
      ...props,
      type: 'mp',
    }),
  flowingPipeLp: (props) =>
    FlowingPipeEdge({
      ...props,
      type: 'lp',
    }),
  flowingPipeWater: (props) =>
    FlowingPipeEdge({
      ...props,
      type: 'water',
    }),
  flowingPipSuspectCondensate: (props) =>
    FlowingPipeEdge({
      ...props,
      type: 'suspect',
    }),
  flowingPipeCleanCondensate: (props) =>
    FlowingPipeEdge({
      ...props,
      type: 'clean',
    }),
  flowingPipeVhp: (props) =>
    FlowingPipeEdge({
      ...props,
      type: 'vhp',
    }),
  flowingPipeAir: (props) =>
    FlowingPipeEdge({
      ...props,
      type: 'air',
    }),
  flowingPipeCoolingWater: (props) =>
    FlowingPipeEdge({
      ...props,
      type: 'coolingWater',
    }),
}
export const getPageNodeByPageId = async (
  caseId,
  pageId,
  setPageDataLoading,
  setNodes,
  setEdges,
  zoomTo,
  fitView,
) => {
  setPageDataLoading(true)
  const res = await getPageNodeDataByPageId(caseId, pageId)
  if (res?.data?.length) {
    const latestNodeData = res?.data[0]
    if (latestNodeData) {
      if (latestNodeData?.nodeJson) {
        setNodes(JSON.parse(latestNodeData?.nodeJson))
      }
      if (latestNodeData?.edgeJson) {
        setEdges(JSON.parse(latestNodeData?.edgeJson))
      }
      setTimeout(() => {
        zoomTo(0.5)
        fitView()
      }, 2000)
    } else {
      setNodes([])
      setEdges([])
    }
  } else {
    setNodes([])
    setEdges([])
  }
  setPageDataLoading(false)
}
export const setSelectedNodeEdgeFunc = async ({
  selectedNodeId,
  selectedEdgeId,
  nodes,
  setNodes,
  setSelectedNodeId,
  setConfig,
  setShouldDelete,
  setEdges,
  edges,
  setSelectedEdgeId,
}) => {
  if (selectedNodeId) {
    const newNodes = nodes.filter((node) => node.id !== selectedNodeId)
    const deletedNode = nodes.find((node) => node.id === selectedNodeId)
    setNodes(newNodes)
    setSelectedNodeId(null)
    setConfig(null)
    setShouldDelete(false)
    setEdges(
      [deletedNode].reduce((acc, node) => {
        const connectedEdges = getConnectedEdges([node], edges)
        const remainingEdges = acc.filter(
          (edge) => !connectedEdges.includes(edge),
        )
        return [...remainingEdges]
      }, edges),
    )
  }
  if (selectedEdgeId) {
    const newEdges = edges.filter((edge) => edge.id !== selectedEdgeId)
    setEdges(newEdges)
    setSelectedEdgeId(null)
    setConfig(null)
    setShouldDelete(false)
  }
}
export const handleSaveClick = async (
  isDeveloperMode,
  isNetworkLocked,
  setLoading,
  token,
  selectedPage,
  nodes,
  edges,
) => {
  if (!isDeveloperMode || isNetworkLocked) return
  setLoading(true)
  const employeeId = await getUserDomainID(token)
  const data = {
    pageId: selectedPage.pageId,
    nodeJson: JSON.stringify(nodes),
    edgeJson: JSON.stringify(edges),
    createdBy: employeeId,
    modifiedBy: employeeId,
    modifiedOn: new Date(),
    caseID: selectedPage.caseId,
  }
  const res = await savePageNodeDataByPageId(data)
  if (res?.data?.pageIdAdded && res?.statuscode === 200) {
    showToast('Network diagram save successfully...', 'success')
  } else {
    showToast('Failed to save network diagram. Please try again', 'error')
  }
  setLoading(false)
}
export const onDropCall = async (
  event,
  {
    screenToFlowPosition,
    type,
    setSelectedEdgeId,
    setSelectedNodeId,
    setConfig,
    setNewNode,
    setType,
  },
) => {
  event?.preventDefault()
  const position = screenToFlowPosition({
    x: event.clientX,
    y: event.clientY,
  })
  if (!type || !position) {
    return
  }
  const newNodeData = allNodes.find((x) => x.type === type)
  if (newNodeData) {
    setSelectedNodeId(null)
    setSelectedEdgeId(null)
    setConfig(null)
    setNewNode({
      ...newNodeData,
      position,
    })
    setType(null)
  }
}
export const onPaneClick = (
  event,
  setConfig,
  setSelectedEdgeId,
  setSelectedNodeId,
) => {
  setConfig(null)
  setSelectedEdgeId(null)
  setSelectedNodeId(null)
}
export const handleKeyPress = (
  e,
  setNewNode,
  setNodeToCopy,
  nodeToCopy,
  config,
  selectedNodeId,
  setShouldDelete,
) => {
  if (e.ctrlKey && e.key === 'v' && nodeToCopy) {
    setNewNode(nodeToCopy)
    setNodeToCopy(null)
  }
  if (e.ctrlKey && e.key === 'c' && config && selectedNodeId) {
    setNodeToCopy(config)
  }
  if (e.key === 'Delete' && config) {
    setShouldDelete(true)
  }
}
export const onNodeClick = (
  node,
  isDeveloperMode,
  plantList,
  setSelectedPage,
  setSelectedNodeId,
  setSelectedEdgeId,
  setConfig,
) => {
  if (!isDeveloperMode) {
    if (node?.type === 'plantNode' && node?.data?.page) {
      const plant = plantList.find((x) => x.pageId == node.data.page)
      setSelectedPage(plant)
    }
  } else {
    setSelectedNodeId(node.id)
    setSelectedEdgeId(null)
    setConfig(node)
  }
}
export const onEdgeClick = (
  event,
  edge,
  isDeveloperMode,
  setSelectedEdgeId,
  setSelectedNodeId,
  setConfig,
) => {
  if (!isDeveloperMode) return
  setSelectedEdgeId(edge.id)
  setSelectedNodeId(null)
  setConfig({
    ...edge,
    configType: 'edge',
  })
}
function Flow() {
  const params = useParams()
  const appContext = useAtomValue(AppAtom)
  const [isPageDataLoading, setPageDataLoading] = useState(false)
  const [newNode, setNewNode] = useAtom(newNodeAtom)
  const [config, setConfig] = useAtom(nodeConfigAtom)
  const [shouldUpdateConfig, setShouldUpdateConfig] = useAtom(updateConfigAtom)
  const [selectedNodeId, setSelectedNodeId] = useAtom(selectedNodeIdAtom)
  const [selectedEdgeId, setSelectedEdgeId] = useAtom(selectedEdgeIdAtom)
  const isNetworkLocked = useAtomValue(networkLockedAtom)
  const [nodeToUpdate, setNodeToUpdate] = useState(null)
  const [isLoading, setLoading] = useState(false)
  const [nodes, setNodes] = useState([])
  const [edges, setEdges] = useState([])
  const isDeveloperMode = useAtomValue(developerModeAtom)
  const [shouldDelete, setShouldDelete] = useAtom(deleteAtom)
  const [type, setType] = useAtom(dragNodeTypeAtom)
  const [nodeToCopy, setNodeToCopy] = useState(null)
  const [selectedPage, setSelectedPage] = useAtom(selectedPageAtom)
  const plantList = useAtomValue(plantListAtom)
  const token = useAtomValue(TokenAtom)
  const updateNodeInternals = useUpdateNodeInternals()
  const { screenToFlowPosition, fitView, zoomTo } = useReactFlow()
  useEffect(() => {
    if (shouldDelete) {
      setSelectedNodeEdgeFunc({
        selectedNodeId,
        selectedEdgeId,
        nodes,
        setNodes,
        setSelectedNodeId,
        setConfig,
        setShouldDelete,
        setEdges,
        edges,
        setSelectedEdgeId,
      })
    }
  }, [shouldDelete, selectedEdgeId, selectedNodeId, nodes, edges])
  useEffect(() => {
    if (selectedPage) {
      getPageNodeByPageId(
        selectedPage.caseId,
        selectedPage.pageId,
        setPageDataLoading,
        setNodes,
        setEdges,
        zoomTo,
        fitView,
      )
    }
  }, [selectedPage])
  const onNodesChange = useCallback(
    (changes) => {
      if (!isDeveloperMode) return
      setNodes((nds) => applyNodeChanges(changes, nds))
    },
    [setNodes, isDeveloperMode],
  )
  const onEdgesChange = useCallback(
    (changes) => {
      if (!isDeveloperMode) return
      setEdges((eds) => applyEdgeChanges(changes, eds))
    },
    [setEdges, isDeveloperMode],
  )
  const onConnect = useCallback(
    (params) => {
      if (!isDeveloperMode) return
      setEdges((eds) =>
        addEdge(
          {
            ...params,
            type: 'flowingPipe',
            markerEnd: 'flowingPipe',
          },
          eds,
        ),
      )
    },
    [isDeveloperMode],
  )
  useEffect(() => {
    if (nodeToUpdate) {
      updateNodeInternals(nodeToUpdate)
      setNodeToUpdate(null)
    }
  }, [nodeToUpdate])
  useEffect(() => {
    if (shouldUpdateConfig && selectedNodeId) {
      const updatedNodes = nodes.map((node) =>
        node.id === selectedNodeId
          ? {
              ...node,
              data: {
                ...node.data,
                ...config.data,
              },
            }
          : node,
      )
      setNodeToUpdate(selectedNodeId)
      setNodes(updatedNodes)
      setSelectedNodeId(null)
      setShouldUpdateConfig(false)
    }
  }, [shouldUpdateConfig, config, nodes, selectedNodeId])
  useEffect(() => {
    if (shouldUpdateConfig && selectedEdgeId) {
      const updatedEdges = edges.map((edge) =>
        edge.id === selectedEdgeId
          ? {
              ...edge,
              type: config.type,
              markerEnd: config.markerEnd,
            }
          : edge,
      )
      setEdges(updatedEdges)
      setSelectedEdgeId(null)
      setShouldUpdateConfig(false)
    }
  }, [shouldUpdateConfig, config, edges, selectedEdgeId])
  useEffect(() => {
    if (newNode) {
      const newId = `${newNode.nodeType}-${generateRandom8DigitNumber()}`
      setNodes([
        ...nodes,
        {
          ...newNode,
          id: newId,
        },
      ])
      setSelectedNodeId(newId)
      setConfig({
        ...newNode,
        id: newId,
      })
      setNewNode(null)
    }
  }, [newNode, nodes])
  useEffect(() => {
    window.addEventListener('keydown', (e) =>
      handleKeyPress(
        e,
        setNewNode,
        setNodeToCopy,
        nodeToCopy,
        config,
        selectedNodeId,
        setShouldDelete,
      ),
    )
    return () => {
      window.removeEventListener('keydown', (e) =>
        handleKeyPress(
          e,
          setNewNode,
          setNodeToCopy,
          nodeToCopy,
          config,
          selectedNodeId,
          setShouldDelete,
        ),
      )
    }
  }, [config, nodeToCopy, selectedNodeId])
  const onDragOver = useCallback((event) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }, [])
  const onDrop = useCallback(
    (event) =>
      onDropCall(event, {
        screenToFlowPosition,
        type,
        setSelectedEdgeId,
        setSelectedNodeId,
        setConfig,
        setNewNode,
        setType,
      }),
    [screenToFlowPosition, type],
  )
  return (
    <div
      id='react-flow-container'
      style={{
        height: '100%',
        width: '100%',
        position: 'relative',
      }}
      data-static-id='Flow.js_div_7327bf'
    >
      {selectedPage?.pageId && isDeveloperMode && (
        <button
          className={`${styles.saveButton} ${styles.positionPrimaryButton}  text-14-regular text-uppercase`}
          id='save-button'
          data-testid='save-button'
          onClick={() => {
            TRACKEVENTOBJ.network.SaveClick({
              params,
              caseData: appContext.caseData,
            })
            handleSaveClick(
              isDeveloperMode,
              isNetworkLocked,
              setLoading,
              token,
              selectedPage,
              nodes,
              edges,
            )
          }}
          disabled={!selectedPage?.pageId || isLoading}
          data-static-id='Flow.js_button_ea5ee6'
        >
          {isLoading ? 'Saving...' : 'Save'}
        </button>
      )}
      {isPageDataLoading ? (
        <Loader />
      ) : (
        <>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={(event, node) =>
              onNodeClick(
                node,
                isDeveloperMode,
                plantList,
                setSelectedPage,
                setSelectedNodeId,
                setSelectedEdgeId,
                setConfig,
              )
            }
            onEdgeClick={(event, edge) =>
              onEdgeClick(
                event,
                edge,
                isDeveloperMode,
                setSelectedEdgeId,
                setSelectedNodeId,
                setConfig,
              )
            }
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            fitView
            fitViewOptions={{
              padding: 2000,
            }}
            minZoom={0.05}
            maxZoom={3}
            nodesDraggable={isDeveloperMode}
            nodesConnectable={isDeveloperMode}
            onPaneClick={(event) =>
              onPaneClick(
                event,
                setConfig,
                setSelectedEdgeId,
                setSelectedNodeId,
              )
            }
            onDrop={onDrop}
            onDragOver={onDragOver}
            style={{
              backgroundColor: 'white',
            }}
          >
            <Marker type='flowingPipe' />
            <Marker type='flowingPipeFuel' />
            <Marker type='flowingPipePower' />
            <Marker type='flowingPipeHp' />
            <Marker type='flowingPipeMp' />
            <Marker type='flowingPipeLp' />
            <Marker type='flowingPipeWater' />
            <Marker type='flowingPipSuspectCondensate' />
            <Marker type='flowingPipeCleanCondensate' />
            <Marker type='flowingPipeAir' />
            <Marker type='flowingPipeCoolingWater' />
            <Controls
              position='bottom-right'
              showInteractive={isDeveloperMode}
            />
            <Background variant={isDeveloperMode ? 'lines' : 'none'} />
          </ReactFlow>
        </>
      )}
    </div>
  )
}
export default Flow
