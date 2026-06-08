import { CompareValuesWithSymbol } from '@/utills/utilities'
import { AppAtom } from 'atoms/AppAtom'
import {
  allTagsDataAtom,
  deleteAtom,
  nodeConfigAtom,
  plantListAtom,
  selectedEdgeIdAtom,
  selectedNodeIdAtom,
  selectedPageAtom,
  tagListAtom,
  updateConfigAtom,
} from 'atoms/NetworkAtom'
import CustomModal from 'components/visuals/common/modal/CustomModal'
import { TRACKEVENTOBJ } from 'config/ActivityTrackerConfig'
import { useAtom, useAtomValue, useSetAtom } from 'jotai'
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import Select from 'react-select'
import styles from './flow.module.scss'
import { BoilerNodeFieldConfig } from './nodes/Boiler'
import { CylindricalTankNodeFieldConfig } from './nodes/CylindricalTank'
import { DearatorNodeFieldConfig } from './nodes/Dearator'
import { HorizontalDrumNodeFieldConfig } from './nodes/DrumHorizontal'
import { VerticalDrumNodeFieldConfig } from './nodes/DrumVertical'
import { FurnaceNodeFieldConfig } from './nodes/Furnace'
import { GroudNodeFieldConfig } from './nodes/GroupNode'
import { HeaderNodeFieldConfig } from './nodes/HeaderNode'
import { LabelTagParameterNodeFieldConfig } from './nodes/LabelTagParameterNode'
import { LabelTextNodeFieldConfig } from './nodes/LabelTextNode'
import { MotorNodeFieldConfig } from './nodes/Motor'
import { PipeBottomInNodeFieldConfig } from './nodes/PipeBottomInNode'
import { PipeLeftInNodeFieldConfig } from './nodes/PipeLeftInNode'
import { PipeRightInNodeFieldConfig } from './nodes/PipeRightInNode'
import { PipeTopInNodeFieldConfig } from './nodes/PipeTopInNode'
import { PlantNodeFieldConfig } from './nodes/Plant'
import { TagEnergyConsumptionNodeFieldConfig } from './nodes/TagEnergyConsumptionNode'
import { LabelTagEnergyNodeFieldConfig } from './nodes/TagEnergyNode'
import { TagParameterNodeFieldConfig } from './nodes/TagParameterNode'
import { TankNodeFieldConfig } from './nodes/Tank'
import { TextBoxNodeFieldConfig } from './nodes/TextboxNode'
import { TextBoxTwoNodeFieldConfig } from './nodes/TextboxNodeTwo'
import { TurbineNodeFieldConfig } from './nodes/Turbine'
import { ValveNodeFieldConfig } from './nodes/Valve'
import { edgeOptions, text_box_resources } from './utils'
const nodeTypesConfig = {
  'text-box-node': TextBoxNodeFieldConfig,
  'header-node': HeaderNodeFieldConfig,
  'turbine-node': TurbineNodeFieldConfig,
  'motor-node': MotorNodeFieldConfig,
  'valve-node': ValveNodeFieldConfig,
  'tag-parameter-node': TagParameterNodeFieldConfig,
  'label-text-node': LabelTextNodeFieldConfig,
  'label-tag-parameter-node': LabelTagParameterNodeFieldConfig,
  'tag-energy-node': LabelTagEnergyNodeFieldConfig,
  'group-node': GroudNodeFieldConfig,
  'boiler-node': BoilerNodeFieldConfig,
  'furnace-node': FurnaceNodeFieldConfig,
  'dearator-node': DearatorNodeFieldConfig,
  'tank-node': TankNodeFieldConfig,
  'cylindrical-tank-node': CylindricalTankNodeFieldConfig,
  'vertical-drum-node': VerticalDrumNodeFieldConfig,
  'horizontal-drum-node': HorizontalDrumNodeFieldConfig,
  'plant-node': PlantNodeFieldConfig,
  'tag-energy-consumption-node': TagEnergyConsumptionNodeFieldConfig,
  'pipe-top-in-node': PipeTopInNodeFieldConfig,
  'pipe-bottom-in-node': PipeBottomInNodeFieldConfig,
  'pipe-left-in-node': PipeLeftInNodeFieldConfig,
  'pipe-right-in-node': PipeRightInNodeFieldConfig,
  'text-box-node-two': TextBoxTwoNodeFieldConfig,
}
const switchStyles = {
  display: 'flex',
  alignItems: 'center',
}
const switchContainerStyles = {
  position: 'relative',
  width: '40px',
  height: '20px',
  borderRadius: '20px',
  transition: 'background-color 0.3s ease',
}
const switchKnobStyles = {
  position: 'absolute',
  top: '50%',
  width: '14px',
  height: '14px',
  backgroundColor: 'white',
  borderRadius: '50%',
  transition: 'left 0.3s ease-in-out',
  transform: 'translateY(-50%)',
}
const inputStyles = {
  opacity: 0,
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  cursor: 'pointer',
  zIndex: 1,
}
const NodeConfigurator = () => {
  const params = useParams()
  const appContext = useAtomValue(AppAtom)
  const [config, setConfig] = useAtom(nodeConfigAtom)
  const setShouldUpdateConfig = useSetAtom(updateConfigAtom)
  const plantList = useAtomValue(plantListAtom)
  const [selectedNodeId, setSelectedNodeId] = useAtom(selectedNodeIdAtom)
  const [selectedEdgeId, setSelectedEdgeId] = useAtom(selectedEdgeIdAtom)
  const setDelete = useSetAtom(deleteAtom)
  const [showLinkModal, setShowLinkModal] = useState(false)
  const [selectedLink, setSelectedLink] = useState('linkedTag')
  const [selectedTag, setSelectedTag] = useState({})
  const tagsList = useAtomValue(tagListAtom)
  const selectedPage = useAtomValue(selectedPageAtom)
  const allTagsDataList = useAtomValue(allTagsDataAtom)

  const tagData = allTagsDataList?.find((x) =>
    CompareValuesWithSymbol('&&', x.tagId, x.tagId == config?.data?.linkedTag),
  )
  const tagData2 = allTagsDataList?.find((x) =>
    CompareValuesWithSymbol('&&', x.tagId, x.tagId == config?.data?.linkedTag2),
  )
  useEffect(() => {
    setConfig(null)
    setSelectedEdgeId(null)
    setSelectedNodeId(null)
    setSelectedTag({})
    setShowLinkModal(false)
  }, [selectedPage])
  function onSaveLinkModal() {
    if (selectedNodeId && selectedTag?.tagId) {
      if (selectedLink === 'linkedTag') {
        setConfig((p) => ({
          ...p,
          data: {
            ...p.data,
            linkedTag: selectedTag.tagId,
          },
        }))
      } else if (selectedLink === 'linkedTag2') {
        setConfig((p) => ({
          ...p,
          data: {
            ...p.data,
            linkedTag2: selectedTag.tagId,
          },
        }))
      } else if (selectedLink === 'linkedTag3') {
        setConfig((p) => ({
          ...p,
          data: {
            ...p.data,
            linkedTag3: selectedTag.tagId,
          },
        }))
      }
      setSelectedTag({})
      setShowLinkModal(false)
    }
  }
  const handleUnlink = (tagName) => {
    setConfig((p) => ({
      ...p,
      data: {
        ...p.data,
        [tagName]: null,
      },
    }))
  }
  const onConfigChange = (event) => {
    const { name, value, type, checked } = event.target
    if (name === 'template') {
      const selectedData = text_box_resources.find((x) => x.id === value)
      setConfig((prev) => ({
        ...prev,
        data: {
          ...prev.data,
          [name]: value,
          backgroundColor: selectedData.bgColor,
          borderColor: selectedData.borderColor,
        },
      }))
    } else if (type === 'checkbox') {
      setConfig((prev) => ({
        ...prev,
        data: {
          ...prev.data,
          [name]: checked,
        },
      }))
    } else {
      setConfig((prev) => ({
        ...prev,
        data: {
          ...prev.data,
          [name]:
            name === 'numSourceHandles' ||
            name === 'numTargetHandles' ||
            name === 'numSourceHandlesRight' ||
            name === 'numTargetHandlesTop' ||
            name === 'numSourceHandlesBottom' ||
            name === 'numTargetHandlesLeft'
              ? parseInt(value)
              : value,
        },
      }))
    }
  }
  const onEdgeConfigChange = (event) => {
    const { name, value } = event.target
    setConfig((prev) => ({
      ...prev,
      [name]: value,
      markerEnd: value,
    }))
  }
  const getOptionsList = (key) => {
    if (key === 'plant') {
      return [
        {
          id: null,
          name: 'Select Plant',
        },
        ...plantList.map((x) => ({
          id: x.pageId,
          name: x.pageName,
        })),
      ]
    }
  }
  const getData = (selectedEdgeId, config) => {
    if (selectedEdgeId) {
      return config
    } else {
      return config?.data
    }
  }
  const getInputField = (field, data) => {
    if (field.type === 'number') {
      return (
        <div key={field.name} data-static-id='NodeConfigurator.js_div_75807f'>
          <label
            className='text-13-bold text-uppercase'
            data-static-id='NodeConfigurator.js_label_c8f80f'
          >
            {field.label} :{' '}
          </label>
          <input
            className='form-control text-14-regular'
            type='number'
            name={field.name}
            value={data?.[field.name] ?? ''}
            min={field.min}
            onChange={onConfigChange}
            data-static-id='NodeConfigurator.js_input_17a6e9'
          />
        </div>
      )
    }
    if (field.type === 'text') {
      return (
        <div key={field.name} data-static-id='NodeConfigurator.js_div_3a5772'>
          <label
            className='text-13-bold text-uppercase'
            data-static-id='NodeConfigurator.js_label_182a42'
          >
            {field.label} :{' '}
          </label>
          <input
            className='form-control text-14-regular'
            type='text'
            name={field.name}
            value={data?.[field.name] ?? ''}
            onChange={onConfigChange}
            data-static-id='NodeConfigurator.js_input_55eb44'
          />
        </div>
      )
    }
    if (field.type === 'color') {
      return (
        <div key={field.name} data-static-id='NodeConfigurator.js_div_42e300'>
          <label
            className='text-13-bold text-uppercase'
            data-static-id='NodeConfigurator.js_label_daa443'
          >
            {field.label} :{' '}
          </label>
          <input
            className='form-control text-14-regular '
            type='color'
            name={field.name}
            value={data?.[field.name] ?? ''}
            onChange={onConfigChange}
            data-static-id='NodeConfigurator.js_input_341268'
          />
        </div>
      )
    }
    if (field.type === 'switch') {
      const isChecked = CompareValuesWithSymbol('||', data?.[field.name], false)
      return (
        <div
          className='d-flex align-items-center gap-1'
          key={field.name}
          style={{
            marginTop: '10px',
          }}
          data-static-id='NodeConfigurator.js_div_4ef58c'
        >
          <label
            className='text-13-bold text-uppercase'
            data-static-id='NodeConfigurator.js_label_63b41d'
          >
            {field.label} :
          </label>
          <div
            className={``}
            style={switchStyles}
            data-static-id='NodeConfigurator.js_div_422796'
          >
            <label
              style={{
                ...switchContainerStyles,
                backgroundColor: isChecked ? '#009fdf' : '#939598',
              }}
              data-static-id='NodeConfigurator.js_label_508fa9'
            >
              <input
                type='checkbox'
                checked={data?.[field.name] || ''}
                name={field.name}
                onChange={onConfigChange}
                style={inputStyles}
                data-static-id='NodeConfigurator.js_input_7109d8'
              />
              <div
                style={{
                  ...switchKnobStyles,
                  left: isChecked ? 'calc(100% - 17px)' : '3px',
                }}
                data-static-id='NodeConfigurator.js_div_5a69c0'
              ></div>
            </label>
          </div>
        </div>
      )
    }
    return (
      <div key={field.name} data-static-id='NodeConfigurator.js_div_fdc8eb'>
        <label
          className='text-13-bold text-uppercase'
          data-static-id='NodeConfigurator.js_label_ef39ac'
        >
          {field.label} :{' '}
        </label>
        <select
          className='form-select'
          name={field.name}
          value={data?.[field.name] || ''}
          onChange={onConfigChange}
          style={{
            fontSize: '1.4vmin',
            width: '100',
            borderRadius: '.3vmin',
            border: 'none',
          }}
          data-static-id='NodeConfigurator.js_select_554f00'
        >
          {(field.customOptionsKey
            ? getOptionsList(field.customOptionsKey)
            : field.options
          ).map((resource) => (
            <option
              key={resource.id}
              value={resource.id}
              data-static-id='NodeConfigurator.js_option_d0d31a'
            >
              {resource.name}
            </option>
          ))}
        </select>
      </div>
    )
  }
  const getLinkUnlinkBtn = (isLinkBtn, tag) => {
    if (isLinkBtn) {
      return (
        <button
          data-test-id='link-button'
          className={`${styles.primaryBlueButton} text-14-regular text-uppercase`}
          onClick={() => {
            TRACKEVENTOBJ.network.ConfigNodeLinkClick({
              params,
              caseData: appContext.caseData,
            })
            setShowLinkModal(true)
            setSelectedLink(tag)
          }}
          data-static-id='NodeConfigurator.js_button_f6a04a'
        >
          Link
        </button>
      )
    } else {
      return (
        <button
          className={`${styles.primaryGrayButton} text-14-regular text-uppercase`}
          onClick={() => handleUnlink(tag)}
          data-static-id='NodeConfigurator.js_button_43b11d'
        >
          Unlink
        </button>
      )
    }
  }
  const data = getData(selectedEdgeId, config)
  const fieldsToRender = nodeTypesConfig[config?.nodeType]?.fields ?? []
  const showLinkModalButton = CompareValuesWithSymbol(
    '||',
    nodeTypesConfig[config?.nodeType]?.showLinkModal,
    false,
  )
  if (CompareValuesWithSymbol('&&', !selectedNodeId, !selectedEdgeId)) {
    return (
      <div className='h-100' data-static-id='NodeConfigurator.js_div_0adee2'>
        <h3
          className='text-14-bold text-uppercase mb_1'
          data-static-id='NodeConfigurator.js_h3_860aa0'
        >
          Configure Node
        </h3>
        <p
          className='text-12-regular text-uppercase'
          data-static-id='NodeConfigurator.js_p_e4f028'
        >
          Please select a node/edge to configure
        </p>
      </div>
    )
  }
  if (selectedNodeId) {
    return (
      <div className='h-100' data-static-id='NodeConfigurator.js_div_9d1f7e'>
        <h3
          className='text-14-bold mb_1 text-uppercase'
          data-static-id='NodeConfigurator.js_h3_c83fb4'
        >
          Configure Node
        </h3>
        <p
          className='text-13-bold text-uppercase mb_05'
          data-static-id='NodeConfigurator.js_p_e20888'
        >
          Node id :{' '}
          <span
            className='text-13-bold text_primary_gray_2'
            data-static-id='NodeConfigurator.js_span_9308dc'
          >
            {config.id}
          </span>
        </p>
        <p
          className='text-13-bold text-uppercase mb_1'
          data-static-id='NodeConfigurator.js_p_ddbb0e'
        >
          Node Name :{' '}
          <span
            className='text-13-bold text_primary_gray_2'
            data-static-id='NodeConfigurator.js_span_88f3a9'
          >
            {config.name}
          </span>
        </p>
        <>
          {fieldsToRender.map((field) => getInputField(field, data))}
          {}
          {showLinkModalButton && (
            <>
              <div
                className='d-flex align-items-center gap-1'
                data-static-id='NodeConfigurator.js_div_f63831'
              >
                <br data-static-id='NodeConfigurator.js_br_4f7b36' />
                <br data-static-id='NodeConfigurator.js_br_40a1c4' />
                <label
                  className='text-13-bold text-uppercase'
                  data-static-id='NodeConfigurator.js_label_fd997d'
                >
                  Linked Tag:{' '}
                  {CompareValuesWithSymbol('||', data?.linkedTag, '-')}{' '}
                  {tagData?.tagName ? `| ${tagData?.tagName}` : ''}
                </label>
                <div
                  className={``}
                  style={switchStyles}
                  data-static-id='NodeConfigurator.js_div_e8caca'
                >
                  {getLinkUnlinkBtn(!data?.linkedTag, 'linkedTag')}
                </div>
              </div>
              {Object.keys(data).includes('linkedTag2') && (
                <div
                  className='d-flex align-items-center gap-1'
                  data-static-id='NodeConfigurator.js_div_0b9e62'
                >
                  <br data-static-id='NodeConfigurator.js_br_bbdb6d' />
                  <br data-static-id='NodeConfigurator.js_br_d34918' />
                  <label
                    className='text-13-bold text-uppercase'
                    data-static-id='NodeConfigurator.js_label_25e582'
                  >
                    Linked Tag 2:{' '}
                    {CompareValuesWithSymbol('||', data?.linkedTag2, '-')}{' '}
                    {tagData2?.tagName ? `| ${tagData2?.tagName}` : ''}
                  </label>
                  <div
                    className={``}
                    style={switchStyles}
                    data-static-id='NodeConfigurator.js_div_9de6a9'
                  >
                    {getLinkUnlinkBtn(!data?.linkedTag2, 'linkedTag2')}
                  </div>
                </div>
              )}
              {Object.keys(data).includes('linkedTag3') && (
                <div
                  className='d-flex align-items-center gap-1'
                  data-static-id='NodeConfigurator.js_div_173cee'
                >
                  <br data-static-id='NodeConfigurator.js_br_0fb049' />
                  <br data-static-id='NodeConfigurator.js_br_1adb89' />
                  <label
                    className='text-13-bold text-uppercase'
                    data-static-id='NodeConfigurator.js_label_cd6c92'
                  >
                    Linked Tag 3:{' '}
                    {CompareValuesWithSymbol('||', data?.linkedTag3, '-')}{' '}
                    {tagData2?.tagName ? `| ${tagData2?.tagName}` : ''}
                  </label>
                  <div
                    className={``}
                    style={switchStyles}
                    data-static-id='NodeConfigurator.js_div_53f1aa'
                  >
                    {getLinkUnlinkBtn(!data?.linkedTag3, 'linkedTag3')}
                  </div>
                </div>
              )}
            </>
          )}
          <div
            className='d-flex align-items-center flex-wrap mt-2 gap-2'
            data-static-id='NodeConfigurator.js_div_b32c54'
          >
            <button
              className={`${styles.primaryBlueButton} text-14-regular text-uppercase`}
              onClick={() => {
                TRACKEVENTOBJ.network.ConfigNodeApplyClick({
                  params,
                  caseData: appContext.caseData,
                })
                setShouldUpdateConfig(true)
              }}
              data-static-id='NodeConfigurator.js_button_6ccff3'
            >
              Apply
            </button>
            <button
              className={`${styles.primaryGrayButton} text-14-regular text-uppercase`}
              onClick={() => {
                TRACKEVENTOBJ.network.ConfigNodeCloseClick({
                  params,
                  caseData: appContext.caseData,
                })
                setSelectedNodeId(null)
              }}
              data-static-id='NodeConfigurator.js_button_69520c'
            >
              Close
            </button>
            <button
              className={`${styles.primaryRedButton} text-14-regular text-uppercase`}
              onClick={() => {
                TRACKEVENTOBJ.network.ConfigNodeDeleteClick({
                  params,
                  caseData: appContext?.caseData,
                })
                setDelete(true)
              }}
              data-static-id='NodeConfigurator.js_button_76492e'
            >
              Delete
            </button>
          </div>
          <br data-static-id='NodeConfigurator.js_br_17ac1a' />
          <div
            className='text-13-regular text-uppercase'
            data-static-id='NodeConfigurator.js_div_43441f'
          >
            Note: All changes to the node will only be applied upon clicking
            Apply button
          </div>
          <CustomModal
            show={showLinkModal}
            hideModal={() => setShowLinkModal(false)}
            hideCameraIcon='false'
            title='Link Tag'
            modalHeight='40vmin'
            size='md'
            bodyHeight='calc(100% - 5vmin)'
          >
            <div
              className={`${styles.rowStyle} h-100 d-flex flex-column justify-content-between`}
              data-static-id='NodeConfigurator.js_div_f98145'
            >
              <div
                className='w-100'
                data-static-id='NodeConfigurator.js_div_f38ad8'
              >
                <Select
                  className={`text-14-regular customSelectBoxField`}
                  onChange={(selectedValue) => setSelectedTag(selectedValue)}
                  options={tagsList}
                  getOptionLabel={({
                    tagId,
                    tagName,
                    uom,
                    uiDisplayName,
                    piName,
                  }) =>
                    `tagId: ${tagId || '-'} | tagName: ${tagName || '-'} | uiDisplayName: ${uiDisplayName || '-'} (uom: ${uom || '-'}) | piName: ${piName || '-'}`
                  }
                  getOptionValue={(option) => option.tagId}
                  placeholder='Select a Tag'
                  classNamePrefix='react-select-modifyDetails'
                  isClearable
                  data-static-id='NodeConfigurator.js_Select_30c72a'
                />
              </div>
              <div
                className={`d-flex justify-content-end w-100 ${styles.btnContainer}`}
                data-static-id='NodeConfigurator.js_div_f7d0e9'
              >
                <button
                  className={`me-2  ${styles.primaryBlueButton} text-14-regular text-uppercase`}
                  onClick={() => {
                    onSaveLinkModal()
                  }}
                  disabled={!selectedTag?.tagId}
                  data-static-id='NodeConfigurator.js_button_3d38cd'
                >
                  Save
                </button>
                <button
                  className={`${styles.primaryGrayButton} text-14-regular text-uppercase`}
                  onClick={() => {
                    setShowLinkModal(false)
                  }}
                  data-static-id='NodeConfigurator.js_button_f9e391'
                >
                  Cancel
                </button>
              </div>
            </div>
          </CustomModal>
        </>
      </div>
    )
  }
  return (
    <div className='h-100' data-static-id='NodeConfigurator.js_div_e4f8a0'>
      <h3
        className='text-14-bold mb_1'
        data-static-id='NodeConfigurator.js_h3_bd0cae'
      >
        Configure Edge
      </h3>
      <p className='text-13-bold' data-static-id='NodeConfigurator.js_p_56932f'>
        Edge id :{' '}
        <span
          className='text_primary_gray_2'
          data-static-id='NodeConfigurator.js_span_d22b77'
        >
          {config.id}
        </span>
      </p>
      <div data-static-id='NodeConfigurator.js_div_760808'>
        <label
          className='text-13-bold text-uppercase'
          data-static-id='NodeConfigurator.js_label_3d6057'
        >
          Color :{' '}
        </label>
        <select
          className='form-select'
          name={'type'}
          value={data?.type || ''}
          onChange={onEdgeConfigChange}
          style={{
            fontSize: '1.4vmin',
            width: '100%',
            borderRadius: '.3vmin',
            border: 'none',
          }}
          data-static-id='NodeConfigurator.js_select_9d3f84'
        >
          {edgeOptions.map((resource) => (
            <option
              key={resource.id}
              value={resource.id}
              data-static-id='NodeConfigurator.js_option_11dc3b'
            >
              {resource.name}
            </option>
          ))}
        </select>
      </div>
      <div
        className='d-flex flex-wrap gap-1 mt-2'
        data-static-id='NodeConfigurator.js_div_b081cc'
      >
        <button
          className={`${styles.primaryBlueButton} text-14-regular text-uppercase`}
          onClick={() => setShouldUpdateConfig(true)}
          data-static-id='NodeConfigurator.js_button_001cfe'
        >
          Apply
        </button>
        <button
          className={`${styles.primaryGrayButton} text-14-regular text-uppercase`}
          onClick={() => setSelectedEdgeId(null)}
          data-static-id='NodeConfigurator.js_button_863cba'
        >
          Close
        </button>
        <button
          className={`${styles.primaryRedButton} text-14-regular text-uppercase`}
          onClick={() => setDelete(true)}
          data-static-id='NodeConfigurator.js_button_d81204'
        >
          Delete
        </button>
      </div>
    </div>
  )
}
export default NodeConfigurator
