import { describe, it, expect, vi } from 'vitest'
import {
  TAG_TYPE_OPTIONS,
  DATA_TYPE_OPTIONS,
  SECTION_ONE_CONFIG,
  SECTION_TWO_CONFIG,
  SECTION_THREE_CONFIG,
  SECTION_FOUR_CONFIG,
} from './constant'

describe('TAG_TYPE_OPTIONS and DATA_TYPE_OPTIONS', () => {
  it('should contain expected tag type options', () => {
    expect(TAG_TYPE_OPTIONS).toEqual([
      { label: 'INFERED', value: 'infered' },
      { label: 'PI', value: 'pi' },
    ])
  })

  it('should contain expected data type options', () => {
    expect(DATA_TYPE_OPTIONS).toEqual([
      { label: 'Real', value: 'Real' },
      { label: 'Polynomial', value: 'Polynomial' },
      { label: 'Text', value: 'Text' },
      { label: 'Step', value: 'Step' },
    ])
  })
})

describe('SECTION_ONE_CONFIG', () => {
  const mockSetEditTagsList = vi.fn()
  const mockValidatePiTagName = vi.fn()

  const baseProps = {
    tagTypes: ['pi', 'infered'],
    dataTypes: ['Real', 'Polynomial'],
    blockNames: [{ label: 'Block1', value: 'block1' }],
    uomDropDownOptions: [{ label: 'C', value: 'C', UomId: 1 }],
    editTagsList: {},
    setEditTagsList: mockSetEditTagsList,
    validatePiTagName: mockValidatePiTagName,
  }

  it('should return all config fields if tagType is not "pi"', () => {
    const config = SECTION_ONE_CONFIG({ ...baseProps })
    expect(config.length).toBe(6) // piName excluded
  })

  it('should include piName field if tagType is "pi"', () => {
    const config = SECTION_ONE_CONFIG({
      ...baseProps,
      editTagsList: { tagType: 'pi' },
    })
    expect(config.find((c) => c.field === 'piName')).toBeTruthy()
  })

  it('should correctly call blurCallback for piName', () => {
    const config = SECTION_ONE_CONFIG({
      ...baseProps,
      editTagsList: { tagType: 'pi' },
    })
    const piNameConfig = config.find((c) => c.field === 'piName')
    piNameConfig.blurCallback('piName', 'val')
    expect(mockValidatePiTagName).toHaveBeenCalledWith('piName', 'val')
  })
})

describe('SECTION_TWO_CONFIG', () => {
  const mockSetFormulaBoxError = vi.fn()
  const baseProps = {
    SetFormulaBoxError: mockSetFormulaBoxError,
    editTagsList: {},
  }

  it('should return all 3 configs if tagType is not "pi"', () => {
    const config = SECTION_TWO_CONFIG(baseProps)
    expect(config.length).toBe(3)
  })

  it('should return 2 configs if tagType is "pi"', () => {
    const config = SECTION_TWO_CONFIG({
      ...baseProps,
      editTagsList: { tagType: 'pi' },
    })
    expect(config.length).toBe(2)
    expect(config.find((c) => c.field === 'inferredExpression')).toBeUndefined()
  })

  it('should call formulaBoxCallback', () => {
    const config = SECTION_TWO_CONFIG(baseProps)
    config.forEach((item) => {
      item.formulaBoxCallback({ objId: item.field })
      expect(mockSetFormulaBoxError).toHaveBeenCalledWith({ objId: item.field })
    })
  })
})

describe('SECTION_THREE_CONFIG', () => {
  it('should return 4 switch fields', () => {
    expect(SECTION_THREE_CONFIG.length).toBe(4)
    SECTION_THREE_CONFIG.forEach((field) => {
      expect(field.type).toBe('switch')
    })
  })
})

describe('SECTION_FOUR_CONFIG', () => {
  const mockSetEditTagsList = vi.fn()
  const mockHandleSetError = vi.fn()

  const baseProps = {
    handleSetError: mockHandleSetError,
    editTagsList: {},
    setEditTagsList: mockSetEditTagsList,
    modelNamesDropDownOptions: [
      { label: 'Model1', value: 'model1', ModelId: 1 },
    ],
    uomDropDownOptions: [{ label: '°C', value: 'C', UomId: 1 }],
  }

  it('should exclude PI & inferred fields if no tagType', () => {
    const config = SECTION_FOUR_CONFIG(baseProps)
    expect(config.find((c) => c.field === 'piName')).toBeUndefined()
    expect(config.find((c) => c.field === 'inferredExpression')).toBeUndefined()
  })

  it('should exclude inferredExpression if tagType is "pi"', () => {
    const config = SECTION_FOUR_CONFIG({
      ...baseProps,
      editTagsList: { tagType: 'pi' },
    })
    expect(config.find((c) => c.field === 'piName')).toBeTruthy()
    expect(config.find((c) => c.field === 'inferredExpression')).toBeUndefined()
  })

  it('should exclude piName if tagType is "inferred"', () => {
    const config = SECTION_FOUR_CONFIG({
      ...baseProps,
      editTagsList: { tagType: 'inferred' },
    })
    expect(config.find((c) => c.field === 'piName')).toBeUndefined()
    expect(config.find((c) => c.field === 'inferredExpression')).toBeTruthy()
  })

  it('should call formulaBoxCallback correctly', () => {
    const config = SECTION_FOUR_CONFIG({
      ...baseProps,
      editTagsList: { tagType: 'inferred' },
    })
    const inferred = config.find((c) => c.field === 'inferredExpression')
    inferred.formulaBoxCallback({ objId: 'inferredExpression' })
    expect(mockHandleSetError).toHaveBeenCalledWith({
      objId: 'inferredExpression',
    })
  })
})
