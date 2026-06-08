import { AppAtom } from 'atoms/AppAtom'
import {
  dragNodeTypeAtom,
  newNodeAtom,
  nodeConfigAtom,
  selectedEdgeIdAtom,
  selectedNodeIdAtom,
  selectedPageAtom,
} from 'atoms/NetworkAtom'
import { TRACKEVENTOBJ } from 'config/ActivityTrackerConfig'
import { useAtomValue, useSetAtom } from 'jotai'
import { useParams } from 'react-router-dom'
import styles from './flow.module.scss'
import { BoilerNodeConfig } from './nodes/Boiler'
import { CylindricalTankNodeConfig } from './nodes/CylindricalTank'
import { DearatorNodeConfig } from './nodes/Dearator'
import { HorizontalDrumNodeConfig } from './nodes/DrumHorizontal'
import { VerticalDrumNodeConfig } from './nodes/DrumVertical'
import { FurnaceNodeConfig } from './nodes/Furnace'
import { GroupNodeConfig } from './nodes/GroupNode'
import { HeaderNodeConfig } from './nodes/HeaderNode'
import { LabelTagParameterNodeConfig } from './nodes/LabelTagParameterNode'
import { LabelTextNodeConfig } from './nodes/LabelTextNode'
import { MotorNodeConfig } from './nodes/Motor'
import { PipeBottomInNodeConfig } from './nodes/PipeBottomInNode'
import { PipeLeftInNodeConfig } from './nodes/PipeLeftInNode'
import { PipeRightInNodeConfig } from './nodes/PipeRightInNode'
import { PipeTopInNodeConfig } from './nodes/PipeTopInNode'
import { PlantNodeConfig } from './nodes/Plant'
import { TagEnergyConsumptionNodeConfig } from './nodes/TagEnergyConsumptionNode'
import { TagEnergyNodeConfig } from './nodes/TagEnergyNode'
import { TagParameterNodeConfig } from './nodes/TagParameterNode'
import { TankNodeConfig } from './nodes/Tank'
import { TextBoxNodeConfig } from './nodes/TextboxNode'
import { TextBoxTwoNodeConfig } from './nodes/TextboxNodeTwo'
import { TurbineNodeConfig } from './nodes/Turbine'
import { ValveNodeConfig } from './nodes/Valve'
export const allNodes = [
  HeaderNodeConfig,
  TextBoxNodeConfig,
  TextBoxTwoNodeConfig,
  TurbineNodeConfig,
  MotorNodeConfig,
  ValveNodeConfig,
  TagParameterNodeConfig,
  LabelTagParameterNodeConfig,
  TagEnergyNodeConfig,
  TagEnergyConsumptionNodeConfig,
  LabelTextNodeConfig,
  GroupNodeConfig,
  BoilerNodeConfig,
  FurnaceNodeConfig,
  DearatorNodeConfig,
  TankNodeConfig,
  CylindricalTankNodeConfig,
  VerticalDrumNodeConfig,
  HorizontalDrumNodeConfig,
  PlantNodeConfig,
  PipeTopInNodeConfig,
  PipeBottomInNodeConfig,
  PipeLeftInNodeConfig,
  PipeRightInNodeConfig,
]
const NodesList = () => {
  const params = useParams()
  const appContext = useAtomValue(AppAtom)
  const setConfig = useSetAtom(nodeConfigAtom)
  const setNewNode = useSetAtom(newNodeAtom)
  const setSelectedNodeId = useSetAtom(selectedNodeIdAtom)
  const setSelectedEdgeId = useSetAtom(selectedEdgeIdAtom)
  const selectedPage = useAtomValue(selectedPageAtom)
  const setType = useSetAtom(dragNodeTypeAtom)
  const handleNodeClick = (node) => {
    setSelectedNodeId(null)
    setSelectedEdgeId(null)
    setConfig(null)
    setNewNode(node)
  }
  const onDragStart = (event, nodeType) => {
    setType(nodeType)
    event.dataTransfer.effectAllowed = 'move'
  }
  return (
    <div
      className={`${styles.nodeListContainer}`}
      data-static-id='NodesList.js_div_c6fa00'
    >
      <h3
        className='text-14-bold text-uppercase mb_1'
        data-static-id='NodesList.js_h3_65c0a9'
      >
        Nodes List
      </h3>
      {selectedPage ? (
        allNodes.map((node) => (
          <div
            data-testid={`node-${node.name}`}
            id={`node-list-${node.name}`}
            className={`${styles.nodeListItem}`}
            onDragStart={(event) => onDragStart(event, node.type)}
            draggable
            onClick={() => {
              TRACKEVENTOBJ.network.NodesListBtnClick(
                {
                  params,
                  caseData: appContext.caseData,
                },
                node,
              )
              handleNodeClick(node)
            }}
            key={node.name}
            data-static-id='NodesList.js_div_fcb562'
          >
            <p
              className={`mt_03 text-14-regular text-center text-uppercase text_primary_white`}
              data-static-id='NodesList.js_p_bb5a67'
            >
              {node.name}
            </p>
          </div>
        ))
      ) : (
        <p
          className='text-13-regular text-uppercase'
          data-static-id='NodesList.js_p_3e2453'
        >
          Please select page to see nodes list
        </p>
      )}
    </div>
  )
}
export default NodesList
