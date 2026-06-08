export const TAG_TYPE_OPTIONS = [
  {
    label: 'INFERED',
    value: 'infered',
  },
  {
    label: 'PI',
    value: 'pi',
  },
]
export const DATA_TYPE_OPTIONS = [
  {
    label: 'Real',
    value: 'Real',
  },
  {
    label: 'Polynomial',
    value: 'Polynomial',
  },
  {
    label: 'Text',
    value: 'Text',
  },
  {
    label: 'Step',
    value: 'Step',
  },
]
export const SECTION_ONE_CONFIG = ({
  tagTypes,
  dataTypes,
  blockNames,
  uomDropDownOptions,
  editTagsList,
  setEditTagsList,
  validatePiTagName,
}) => {
  const config = [
    {
      title: 'TAG NAME',
      type: 'input',
      field: 'tagName',
      width: 'col-8',
      required: true,
    },
    {
      title: 'TAG DESCRIPTION',
      field: 'description',
      type: 'input',
      width: 'col-8',
    },
    {
      title: 'UI DISPLAY NAME',
      field: 'uiDisplayName',
      type: 'input',
      width: 'col-8',
    },
    {
      title: 'TAG TYPE',
      field: 'tagType',
      width: 'col-8',
      type: 'select',
      selectOptions: tagTypes.map((x) => ({
        label: x ?? '-',
        value: x,
      })),
      required: true,
    },
    {
      title: 'DATA TYPE',
      field: 'dataType',
      width: 'col-8',
      type: 'select',
      selectOptions: dataTypes.map((x) => ({
        label: x,
        value: x,
      })),
      required: true,
    },
    {
      title: 'UOM',
      field: 'uom',
      width: 'col-8',
      type: 'rSelect',
      selectOptions: uomDropDownOptions,
      hasInfoIcon: true,
      selectBoxCallback: (key, val) => {
        setEditTagsList((pre) => ({
          ...pre,
          uomId: val?.UomId,
        }))
      },
    },
    // {
    // 	title: "BLOCK NAME",
    // 	field: "blockName",
    // 	width: "col-8",
    // 	type: "select",
    // 	selectOptions: blockNames,
    // 	required: true,
    // 	selectBoxCallback: (key, val) => {
    // 		const blockId = val?.blockId;
    // 		setEditTagsList((pre) => ({ ...pre, blockId: blockId }))
    // 	}
    // },
    {
      title: 'PI NAME',
      field: 'piName',
      width: 'col-8',
      type: 'input',
      required: true,
      blurCallback: (key, value) => validatePiTagName(key, value),
    },
  ]
  return editTagsList?.tagType === 'pi' ? config : config.slice(0, -1)
}
export const SECTION_TWO_CONFIG = ({ SetFormulaBoxError, editTagsList }) => {
  const config = [
    {
      title: 'DESIGN EXPRESSION',
      field: 'designExpression',
      width: '40%',
      type: 'formula',
      formulaBoxCallback: (data) => {
        const { objId } = data
        if (objId === 'designExpression') {
          SetFormulaBoxError(data)
        }
      },
    },
    {
      title: 'INFERRED FORMULA EXPRESSION',
      field: 'inferredExpression',
      width: '40%',
      type: 'formula',
      formulaBoxCallback: (data) => {
        const { objId } = data
        if (objId === 'inferredExpression') {
          SetFormulaBoxError(data)
        }
      },
    },
    {
      title: 'POLARITY EXPRESSION',
      field: 'polarityExpression',
      type: 'formula',
      width: '82%',
      calculatedValueLabel: 'CALC STATE',
      formulaBoxCallback: (data) => {
        const { objId } = data
        if (objId === 'polarityExpression') {
          SetFormulaBoxError(data)
        }
      },
    },
  ]
  return editTagsList?.tagType !== 'pi'
    ? config
    : config.filter((_, index) => index !== 1)
}
export const SECTION_THREE_CONFIG = [
  {
    title: 'FLAG_MA',
    type: 'switch',
    field: 'flagMA',
    width: '50%',
  },
  {
    title: 'FLAG_DATA_AVAILABLE_CHECK',
    type: 'switch',
    field: 'flagDataAvailableCheck',
    width: '50%',
  },
  {
    title: 'FLAG_OUTPUT_RUN_ALWAYS',
    type: 'switch',
    field: 'flagOutputRunAlways',
    width: '50%',
  },
  {
    title: 'FLAG_OUTPUT',
    type: 'switch',
    field: 'flagOutput',
    width: '50%',
  },
]
export const SECTION_FOUR_CONFIG = ({
  handleSetError,
  editTagsList,
  setEditTagsList,
  modelNamesDropDownOptions,
  uomDropDownOptions,
}) => {
  const tagType = editTagsList?.tagType
  const config = [
    {
      title: 'MODEL NAME',
      field: 'modelID',
      width: '30%',
      height: '4vmin',
      type: 'select',
      selectOptions: modelNamesDropDownOptions,
      className: 'AddNewSelect ',
      selectBoxCallback: (key, val) => {
        const modelID = val?.ModelId
        setEditTagsList((pre) => ({
          ...pre,
          modelIDValue: modelID,
        }))
      },
    },
    {
      title: 'TAG NAME',
      field: 'tagName',
      width: '30%',
      height: '4vmin',
      type: 'input',
    },
    {
      title: 'UI DISPLAY NAME',
      field: 'uiDisplayName',
      width: '30%',
      height: '4vmin',
      type: 'input',
      hasInfoIcon: true,
    },
    {
      title: 'TAG DESCRIPTION',
      field: 'description',
      width: '62%',
      height: '4vmin',
      type: 'input',
      hasInfoIcon: true,
      className: 'AddNewSelect ',
    },
    {
      title: 'DATA TYPE',
      field: 'dataType',
      width: '30%',
      height: '4vmin',
      type: 'select',
      selectOptions: [
        {
          label: 'polinomial',
          value: 'polinomial',
        },
        {
          label: 'real',
          value: 'real',
        },
      ],
      hasInfoIcon: true,
      className: 'AddNewSelect ',
    },
    {
      title: 'UOM',
      field: 'uomID',
      width: '30%',
      height: '4vmin',
      type: 'select',
      selectOptions: uomDropDownOptions,
      hasInfoIcon: true,
      className: 'AddNewSelect ',
      selectBoxCallback: (key, val) => {
        const UomId = val?.UomId
        setEditTagsList((pre) => ({
          ...pre,
          UomIdValue: UomId,
        }))
      },
    },
    {
      title: 'TAG TYPE',
      field: 'tagType',
      width: '30%',
      height: '4vmin',
      type: 'select',
      selectOptions: [
        {
          label: 'pi',
          value: 'pi',
        },
        {
          label: 'inferred',
          value: 'inferred',
        },
      ],
    },
    {
      title: 'PI NAME',
      field: 'piName',
      width: '30%',
      height: '4vmin',
      type: 'input',
      hasInfoIcon: true,
    },
    {
      title: 'INFERRED EXPRESSION',
      field: 'inferredExpression',
      type: 'formula',
      width: '93%',
      height: '4vmin',
      hasInfoIcon: true,
      calculatedValueLabel: 'CALC STATE',
      formulaBoxCallback: (data) => {
        const { objId } = data
        if (objId === 'inferredExpression') {
          handleSetError(data)
        }
      },
    },
  ]
  let filteredConfig
  if (tagType === 'pi') {
    filteredConfig = config.filter((_, index) => index !== 8)
  } else if (tagType === 'inferred') {
    filteredConfig = config.filter((_, index) => index !== 7)
  } else {
    filteredConfig = config.filter((_, index) => index !== 7 && index !== 8)
  }
  return filteredConfig
}
