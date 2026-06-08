// CCPServices.test.js
import { SERVICE } from 'config/Config'
import _get from 'libs/axios_fetch/_get'
import _post from 'libs/axios_fetch/_post'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import {
  addAuditLog,
  addCleanDataRanges,
  addNewButtonByTag,
  addODSInsights,
  addOptimizerConstraint,
  addOptimizerDerivedEquation,
  addOptimizerObjective,
  addOptimizerVariable,
  addTag,
  addTrnODSSuggestion,
  deleteCleanDataRanges,
  deleteOptimizerConstraintByConstraintID,
  deleteOptimizerDerivedEquationByDerivedEquationID,
  deleteOptimizerParameterByModelTagId,
  deleteOptimizerVariableByVariableID,
  deleteTag,
  getAffectedConstants,
  getAffectedModelIdsByTagId,
  getBlockDetails,
  getCaseDetailsByCaseId,
  getCCPData,
  getCcpInfo,
  getCleanDataRangesByCaseId,
  getDefaultValue,
  getEOTagsDataByCaseid,
  getLbmDataIterations,
  getMacros,
  getModelNamesByCaseID,
  getMstMacros,
  getODSInsights,
  getOptimizerConstraintCategoryDetails,
  getOptimizerConstraints,
  getOptimizerDerivedEquations,
  getOptimizerObjectiveFunction,
  getOptimizerParameterById,
  getOptimizerVariablesDataByCaseid,
  getPacketTypesByCaseId,
  getPipelineLocationByCaseid,
  getPipelineParametersByCaseId,
  getPlantDetails,
  getSeuDetails,
  getSubModel,
  getSubModelParameter,
  getSwitchConfigurations,
  getTagsDataForValidation,
  getTrnOdsSuggestionByCaseId,
  getUniquepipelineparameterByColumnname,
  resetODIinsights,
  updateCaseDetails,
  updateCCPData,
  updateCCPData2,
  updateCleanDataRanges,
  updateEquipementAvailability,
  updateLbmIteration,
  updateOptimizationPriceInput,
  updateOptimizerParameter,
  updatePipelineParameters,
  updateSeuDetails,
  updateSubModel,
  updateSubModelParameter,
  updateTagDataDetails,
  upsertMacrosData,
  verifyPiTagName,
} from './CCPServices'
// Mock the dependencies
vi.mock('config/Config', () => ({
  SERVICE: {
    CCP_URL: 'http://ccp-service',
    LOGGING_URL: 'http://logging-service',
    PI_URL: 'http://pi-service',
    CONFIG_URL: 'http://config-service',
    CCP_OPTIMIZER: 'http://optimizer-service',
  },
}))
vi.mock('libs/axios_fetch/_get', () => ({
  default: vi.fn(),
}))
vi.mock('libs/axios_fetch/_post', () => ({
  default: vi.fn(),
}))
describe('CCPServices', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })
  describe('Success scenarios', () => {
    beforeEach(() => {
      _post.mockResolvedValue({ data: 'success' })
      _get.mockResolvedValue({ data: 'success' })
    })
    // Test each function with success scenario
    test('updateCCPData should call _post with correct parameters', async () => {
      const body = { test: 'data' }
      const result = await updateCCPData(body)
      expect(_post).toHaveBeenCalledWith(`${SERVICE.CCP_URL}/update_ccp`, body)
      expect(result).toEqual({ data: 'success' })
    })
    test('addAuditLog should call _post with correct parameters', async () => {
      const body = { log: 'data' }
      const result = await addAuditLog(body)
      expect(_post).toHaveBeenCalledWith(
        `${SERVICE.LOGGING_URL}/add_audit_log`,
        body,
      )
      expect(result).toEqual({ data: 'success' })
    })
    test('getTagDataForValidation should call _post with correct parameters', async () => {
      const caseID = '123'
      const result = await getTagsDataForValidation(caseID)
      expect(_post).toHaveBeenCalledWith(
        `${SERVICE.CCP_URL}/get_tags_data_for_validation`,
        { caseID },
      )
      expect(result).toEqual({ data: 'success' })
    })
    test('getDefaultValue should call _post with correct parameters', async () => {
      const body = { targetValue: 100, other: 'data' }
      const result = await getDefaultValue(body)
      expect(_post).toHaveBeenCalledWith(
        `${SERVICE.LOGGING_URL}/get_default_value`,
        { ...body, targetValue: '100' },
      )
      expect(result).toEqual({ data: 'success' })
    })
    test('getDefaultValue should handle undefined targetValue', async () => {
      const body = { other: 'data' }
      const result = await getDefaultValue(body)
      expect(_post).toHaveBeenCalledWith(
        `${SERVICE.LOGGING_URL}/get_default_value`,
        { ...body, targetValue: 'undefined' },
      )
      expect(result).toEqual({ data: 'success' })
    })
    test('updateCCPData2 should call _post with correct parameters', async () => {
      const body = { test: 'data' }
      const result = await updateCCPData2(body)
      expect(_post).toHaveBeenCalledWith(
        `${SERVICE.CCP_URL}/update_tag_in_ccp_pi_af`,
        body,
      )
      expect(result).toEqual({ data: 'success' })
    })
    test('getCCPData should call _post with correct parameters', async () => {
      const caseId = '123'
      const searchField = 'test'
      const pageNumber = 1
      const pageSize = 10
      const result = await getCCPData(caseId, searchField, pageNumber, pageSize)
      expect(_post).toHaveBeenCalledWith(`${SERVICE.CCP_URL}/get_ccp_data`, {
        caseID: caseId,
        pageNumber,
        pageSize,
        searchField,
      })
      expect(result).toEqual({ data: 'success' })
    })
    test('getCcpInfo should call _post with correct parameters', async () => {
      const result = await getCcpInfo()
      expect(_post).toHaveBeenCalledWith(`${SERVICE.CCP_URL}/get_ccp_info`)
      expect(result).toEqual({ data: 'success' })
    })
    test('getSwitchConfigurations should call _post with correct parameters', async () => {
      const result = await getSwitchConfigurations()
      expect(_post).toHaveBeenCalledWith(
        `${SERVICE.CCP_URL}/get_switch_configurations`,
      )
      expect(result).toEqual({ data: 'success' })
    })
    test('getAffectedModelIdsByTagId should call _post with correct parameters', async () => {
      const tagId = 'tag1'
      const modelId = 'model1'
      const result = await getAffectedModelIdsByTagId(tagId, modelId)
      expect(_post).toHaveBeenCalledWith(
        `${SERVICE.CCP_URL}/get_affected_model_ids_by_tag_id`,
        { tagId, modelId },
      )
      expect(result).toEqual({ data: 'success' })
    })
    test('getODSInsights should call _post with correct parameters', async () => {
      const caseId = '123'
      const result = await getODSInsights(caseId)
      expect(_post).toHaveBeenCalledWith(
        `${SERVICE.CCP_URL}/get_ods_insights`,
        { caseID: caseId },
      )
      expect(result).toEqual({ data: 'success' })
    })
    test('addODSInsights should call _post with correct parameters', async () => {
      const payload = { insight: 'data' }
      const result = await addODSInsights(payload)
      expect(_post).toHaveBeenCalledWith(
        `${SERVICE.CCP_URL}/add_ods_insights`,
        payload,
      )
      expect(result).toEqual({ data: 'success' })
    })
    test('resetODIinsights should call _post with correct parameters', async () => {
      const caseId = '123'
      const result = await resetODIinsights(caseId)
      expect(_post).toHaveBeenCalledWith(
        `${SERVICE.CCP_URL}/reset_ods_insights`,
        { caseID: caseId },
      )
      expect(result).toEqual({ data: 'success' })
    })
    test('getLbmDataIterations should call _post with correct parameters', async () => {
      const caseID = '123'
      const result = await getLbmDataIterations(caseID)
      expect(_post).toHaveBeenCalledWith(
        `${SERVICE.CCP_URL}/get_lbm_data_iterations`,
        { caseID },
      )
      expect(result).toEqual({ data: 'success' })
    })
    test('getTagsDataForValidation should call _post with correct parameters', async () => {
      const caseID = '123'
      const result = await getTagsDataForValidation(caseID)
      expect(_post).toHaveBeenCalledWith(
        `${SERVICE.CCP_URL}/get_tags_data_for_validation`,
        { caseID },
      )
      expect(result).toEqual({ data: 'success' })
    })
    test('updateLbmIteration should call _post with correct parameters', async () => {
      const data = { iteration: 'data' }
      const result = await updateLbmIteration(data)
      expect(_post).toHaveBeenCalledWith(
        `${SERVICE.CCP_URL}/update_lbm_iteration`,
        { input: data },
      )
      expect(result).toEqual({ data: 'success' })
    })
    test('updateTagDataDetails should call _post with correct parameters', async () => {
      const body = { tag: 'data' }
      const result = await updateTagDataDetails(body)
      expect(_post).toHaveBeenCalledWith(`${SERVICE.CCP_URL}/update_tag`, body)
      expect(result).toEqual({ data: 'success' })
    })
    test('getModelNamesByCaseID should call _post with correct parameters', async () => {
      const caseID = '123'
      const result = await getModelNamesByCaseID(caseID)
      expect(_post).toHaveBeenCalledWith(
        `${SERVICE.CCP_URL}/get_model_names_by_case_id`,
        { caseID },
      )
      expect(result).toEqual({ data: 'success' })
    })
    test('deleteTag should call _post with correct parameters', async () => {
      const tagID = 'tag1'
      const result = await deleteTag(tagID)
      expect(_post).toHaveBeenCalledWith(`${SERVICE.CCP_URL}/delete_tag`, {
        tagID,
      })
      expect(result).toEqual({ data: 'success' })
    })
    test('addTag should call _post with correct parameters', async () => {
      const payload = { tag: 'data' }
      const result = await addTag(payload)
      expect(_post).toHaveBeenCalledWith(`${SERVICE.CCP_URL}/add_tag`, payload)
      expect(result).toEqual({ data: 'success' })
    })
    test('getEOTagsDataByCaseid should call _post with correct parameters', async () => {
      const caseID = '123'
      const searchFiled = 'test'
      const pageNumber = 1
      const pageSize = 10
      const result = await getEOTagsDataByCaseid(
        caseID,
        searchFiled,
        pageNumber,
        pageSize,
      )
      expect(_post).toHaveBeenCalledWith(
        `${SERVICE.CCP_URL}/get_eo_tags_data_by_caseid`,
        { caseID, pageNumber, pageSize, searchField: searchFiled },
      )
      expect(result).toEqual({ data: 'success' })
    })
    test('getPipelineLocationByCaseid should call _post with correct parameters', async () => {
      const caseID = '123'
      const result = await getPipelineLocationByCaseid(caseID)
      expect(_post).toHaveBeenCalledWith(
        `${SERVICE.CCP_URL}/get_pipeline_locations`,
        { caseID },
      )
      expect(result).toEqual({ data: 'success' })
    })
    test('verifyPiTagName should call _post with correct parameters', async () => {
      const piTagName = 'tag1'
      const result = await verifyPiTagName(piTagName)
      expect(_post).toHaveBeenCalledWith(
        `${SERVICE.PI_URL}/get_pi_tag_validation`,
        { piTagName },
      )
      expect(result).toEqual({ data: 'success' })
    })
    test('getCaseDetailsByCaseId should call _post with correct parameters', async () => {
      const result = await getCaseDetailsByCaseId()
      expect(_post).toHaveBeenCalledWith(
        `${SERVICE.CCP_URL}/get_case_details_by_case_id`,
        { caseID: null },
      )
      expect(result).toEqual({ data: 'success' })
    })
    test('updateCaseDetails should call _post with correct parameters', async () => {
      const payload = { case: 'data' }
      const result = await updateCaseDetails(payload)
      expect(_post).toHaveBeenCalledWith(
        `${SERVICE.CCP_URL}/update_case_details`,
        payload,
      )
      expect(result).toEqual({ data: 'success' })
    })
    test('getPlantDetails should call _get with correct parameters', async () => {
      const result = await getPlantDetails()
      expect(_get).toHaveBeenCalledWith(
        `${SERVICE.CONFIG_URL}/get_plant_details`,
      )
      expect(result).toEqual({ data: 'success' })
    })
    test('getBlockDetails should call _get with correct parameters', async () => {
      const result = await getBlockDetails()
      expect(_get).toHaveBeenCalledWith(`${SERVICE.CCP_URL}/get_block_details`)
      expect(result).toEqual({ data: 'success' })
    })
    test('getPipelineParametersByCaseId should call _post with correct parameters', async () => {
      const caseID = '123'
      const result = await getPipelineParametersByCaseId(caseID)
      expect(_post).toHaveBeenCalledWith(
        `${SERVICE.CCP_URL}/get_pipeline_parameters_by_case_id`,
        { caseID },
      )
      expect(result).toEqual({ data: 'success' })
    })
    test('updatePipelineParameters should call _post with correct parameters', async () => {
      const payload = { params: 'data' }
      const result = await updatePipelineParameters(payload)
      expect(_post).toHaveBeenCalledWith(
        `${SERVICE.CCP_URL}/update_pipeline_parameters`,
        payload,
      )
      expect(result).toEqual({ data: 'success' })
    })
    test('getUniquepipelineparameterByColumnname should call _post with correct parameters', async () => {
      const columnName = 'column1'
      const result = await getUniquepipelineparameterByColumnname(columnName)
      expect(_post).toHaveBeenCalledWith(
        `${SERVICE.CCP_URL}/get_unique_pipelineparameter_by_columnname`,
        { columnName },
      )
      expect(result).toEqual({ data: 'success' })
    })
    test('getCleanDataRangesByCaseId should call _post with correct parameters', async () => {
      const caseID = '123'
      const result = await getCleanDataRangesByCaseId(caseID)
      expect(_post).toHaveBeenCalledWith(
        `${SERVICE.CCP_URL}/get_clean_data_ranges_by_case_id`,
        { caseID, modelID: null },
      )
      expect(result).toEqual({ data: 'success' })
    })
    test('addCleanDataRanges should call _post with correct parameters', async () => {
      const payload = { ranges: 'data' }
      const result = await addCleanDataRanges(payload)
      expect(_post).toHaveBeenCalledWith(
        `${SERVICE.CCP_URL}/add_clean_data_ranges`,
        payload,
      )
      expect(result).toEqual({ data: 'success' })
    })
    test('deleteCleanDataRanges should call _post with correct parameters', async () => {
      const payload = { ranges: 'data' }
      const result = await deleteCleanDataRanges(payload)
      expect(_post).toHaveBeenCalledWith(
        `${SERVICE.CCP_URL}/delete_clean_data_ranges`,
        payload,
      )
      expect(result).toEqual({ data: 'success' })
    })
    test('updateCleanDataRanges should call _post with correct parameters', async () => {
      const payload = { ranges: 'data' }
      const result = await updateCleanDataRanges(payload)
      expect(_post).toHaveBeenCalledWith(
        `${SERVICE.CCP_URL}/update_clean_data_ranges`,
        payload,
      )
      expect(result).toEqual({ data: 'success' })
    })
    test('getPacketTypesByCaseId should call _post with correct parameters', async () => {
      const caseId = '123'
      const result = await getPacketTypesByCaseId(caseId)
      expect(_post).toHaveBeenCalledWith(
        `${SERVICE.CONFIG_URL}/get_packet_types_by_case_id`,
        { caseId },
      )
      expect(result).toEqual({ data: 'success' })
    })
    test('getOptimizerVariablesDataByCaseid should call _post with correct parameters', async () => {
      const caseID = '123'
      const result = await getOptimizerVariablesDataByCaseid(caseID)
      expect(_post).toHaveBeenCalledWith(
        `${SERVICE.CCP_OPTIMIZER}/get_optimizer_variables_data_by_caseid`,
        { caseID },
      )
      expect(result).toEqual({ data: 'success' })
    })
    test('getOptimizerConstraints should call _post with correct parameters', async () => {
      const caseID = '123'
      const result = await getOptimizerConstraints(caseID)
      expect(_post).toHaveBeenCalledWith(
        `${SERVICE.CCP_OPTIMIZER}/get_optimizer_constraints`,
        { caseID },
      )
      expect(result).toEqual({ data: 'success' })
    })
    test('getOptimizerConstraintCategoryDetails should call _get with correct parameters', async () => {
      const result = await getOptimizerConstraintCategoryDetails()
      expect(_get).toHaveBeenCalledWith(
        `${SERVICE.CCP_OPTIMIZER}/get_optimizer_constraint_category_details`,
      )
      expect(result).toEqual({ data: 'success' })
    })
    test('getOptimizerParameterById should call _post with correct parameters', async () => {
      const caseID = '123'
      const result = await getOptimizerParameterById(caseID)
      expect(_post).toHaveBeenCalledWith(
        `${SERVICE.CCP_OPTIMIZER}/get_optimizer_parameter_by_caseid`,
        { caseID },
      )
      expect(result).toEqual({ data: 'success' })
    })
    test('getOptimizerDerivedEquations should call _post with correct parameters', async () => {
      const caseID = '123'
      const result = await getOptimizerDerivedEquations(caseID)
      expect(_post).toHaveBeenCalledWith(
        `${SERVICE.CCP_OPTIMIZER}/get_optimizer_derived_equations`,
        { caseID },
      )
      expect(result).toEqual({ data: 'success' })
    })
    test('getOptimizerObjectiveFunction should call _post with correct parameters', async () => {
      const caseID = '123'
      const result = await getOptimizerObjectiveFunction(caseID)
      expect(_post).toHaveBeenCalledWith(
        `${SERVICE.CCP_OPTIMIZER}/get_optimizer_objective_function`,
        { caseID },
      )
      expect(result).toEqual({ data: 'success' })
    })
    test('addNewButtonByTag should call _post with correct parameters', async () => {
      const payload = { tag: 'data' }
      const result = await addNewButtonByTag(payload)
      expect(_post).toHaveBeenCalledWith(`${SERVICE.CCP_URL}/add_tag`, payload)
      expect(result).toEqual({ data: 'success' })
    })
    test('addOptimizerVariable should call _post with correct parameters', async () => {
      const payload = { variable: 'data' }
      const result = await addOptimizerVariable(payload)
      expect(_post).toHaveBeenCalledWith(
        `${SERVICE.CCP_OPTIMIZER}/add_optimizer_variable`,
        payload,
      )
      expect(result).toEqual({ data: 'success' })
    })
    test('addOptimizerDerivedEquation should call _post with correct parameters', async () => {
      const payload = { equation: 'data' }
      const result = await addOptimizerDerivedEquation(payload)
      expect(_post).toHaveBeenCalledWith(
        `${SERVICE.CCP_OPTIMIZER}/add_optimizer_derived_equation`,
        payload,
      )
      expect(result).toEqual({ data: 'success' })
    })
    test('updateOptimizationPriceInput should call _post with correct parameters', async () => {
      const payload = { price: 'data' }
      const result = await updateOptimizationPriceInput(payload)
      expect(_post).toHaveBeenCalledWith(
        `${SERVICE.CCP_OPTIMIZER}/update_optimization_price_input`,
        payload,
      )
      expect(result).toEqual({ data: 'success' })
    })
    test('updateEquipementAvailability should call _post with correct parameters', async () => {
      const payload = { equipment: 'data' }
      const result = await updateEquipementAvailability(payload)
      expect(_post).toHaveBeenCalledWith(
        `${SERVICE.CCP_OPTIMIZER}/Update_Equipement_Availability`,
        payload,
      )
      expect(result).toEqual({ data: 'success' })
    })
    test('addOptimizerObjective should call _post with correct parameters', async () => {
      const payload = { objective: 'data' }
      const result = await addOptimizerObjective(payload)
      expect(_post).toHaveBeenCalledWith(
        `${SERVICE.CCP_OPTIMIZER}/add_optimizer_objective`,
        payload,
      )
      expect(result).toEqual({ data: 'success' })
    })
    test('updateOptimizerParameter should call _post with correct parameters', async () => {
      const payload = { parameter: 'data' }
      const result = await updateOptimizerParameter(payload)
      expect(_post).toHaveBeenCalledWith(
        `${SERVICE.CCP_OPTIMIZER}/update_optimizer_parameter`,
        payload,
      )
      expect(result).toEqual({ data: 'success' })
    })
    test('deleteOptimizerVariableByVariableID should call _post with correct parameters', async () => {
      const payload = { variableID: '123' }
      const result = await deleteOptimizerVariableByVariableID(payload)
      expect(_post).toHaveBeenCalledWith(
        `${SERVICE.CCP_OPTIMIZER}/delete_optimizer_variable_by_variableid`,
        payload,
      )
      expect(result).toEqual({ data: 'success' })
    })
    test('deleteOptimizerParameterByModelTagId should call _post with correct parameters', async () => {
      const payload = { modelTagId: '123' }
      const result = await deleteOptimizerParameterByModelTagId(payload)
      expect(_post).toHaveBeenCalledWith(
        `${SERVICE.CCP_OPTIMIZER}/delete_optimizer_parameter_by_modeltagid`,
        payload,
      )
      expect(result).toEqual({ data: 'success' })
    })
    test('deleteOptimizerConstraintByConstraintID should call _post with correct parameters', async () => {
      const payload = { constraintID: '123' }
      const result = await deleteOptimizerConstraintByConstraintID(payload)
      expect(_post).toHaveBeenCalledWith(
        `${SERVICE.CCP_OPTIMIZER}/delete_optimizer_constraint_by_constraintid`,
        payload,
      )
      expect(result).toEqual({ data: 'success' })
    })
    test('deleteOptimizerDerivedEquationByDerivedEquationID should call _post with correct parameters', async () => {
      const payload = { derivedEquationID: '123' }
      const result =
        await deleteOptimizerDerivedEquationByDerivedEquationID(payload)
      expect(_post).toHaveBeenCalledWith(
        `${SERVICE.CCP_OPTIMIZER}/delete_optimizer_derived_equation_by_derivedequationid`,
        payload,
      )
      expect(result).toEqual({ data: 'success' })
    })
    test('addOptimizerConstraint should call _post with correct parameters', async () => {
      const payload = { constraint: 'data' }
      const result = await addOptimizerConstraint(payload)
      expect(_post).toHaveBeenCalledWith(
        `${SERVICE.CCP_OPTIMIZER}/add_optimizer_constraint`,
        payload,
      )
      expect(result).toEqual({ data: 'success' })
    })
    test('getMacros should call _post with correct parameters', async () => {
      const caseID = '123'
      const result = await getMacros(caseID)
      expect(_post).toHaveBeenCalledWith(
        `${SERVICE.CCP_URL}/get_pipeline_macros_by_case_id`,
        { caseID },
      )
      expect(result).toEqual({ data: 'success' })
    })
    test('getMstMacros should call _post with correct parameters', async () => {
      const result = await getMstMacros()
      expect(_post).toHaveBeenCalledWith(
        `${SERVICE.CCP_URL}/get_mst_pipeline_macros`,
      )
      expect(result).toEqual({ data: 'success' })
    })
    test('getAffectedConstants should call _post with correct parameters', async () => {
      const mstAfConstantId = 'constant1'
      const modelId = 'model1'
      const result = await getAffectedConstants(mstAfConstantId, modelId)
      expect(_post).toHaveBeenCalledWith(
        `${SERVICE.PI_URL}/get_affected_pi_af_constants`,
        { mstAfConstantId, modelId },
      )
      expect(result).toEqual({ data: 'success' })
    })
    test('upsertMacrosData should call _post with correct parameters', async () => {
      const body = { macros: 'data' }
      const result = await upsertMacrosData(body)
      expect(_post).toHaveBeenCalledWith(
        `${SERVICE.CCP_URL}/update_pipeline_macros`,
        body,
      )
      expect(result).toEqual({ data: 'success' })
    })
    test('getSeuDetails should call _post with correct parameters', async () => {
      const caseID = '123'
      const result = await getSeuDetails(caseID)
      expect(_post).toHaveBeenCalledWith(
        `${SERVICE.CCP_OPTIMIZER}/get_seu_details`,
        { caseID },
      )
      expect(result).toEqual({ data: 'success' })
    })
    test('getSubModel should call _post with correct parameters', async () => {
      const caseID = '123'
      const result = await getSubModel(caseID)
      expect(_post).toHaveBeenCalledWith(
        `${SERVICE.CCP_OPTIMIZER}/get_sub_model`,
        { caseID },
      )
      expect(result).toEqual({ data: 'success' })
    })
    test('getSubModelParameter should call _post with correct parameters', async () => {
      const caseID = '123'
      const result = await getSubModelParameter(caseID)
      expect(_post).toHaveBeenCalledWith(
        `${SERVICE.CCP_OPTIMIZER}/get_sub_model_parameter`,
        { caseID },
      )
      expect(result).toEqual({ data: 'success' })
    })
    test('updateSeuDetails should call _post with correct parameters', async () => {
      const payload = { seu: 'data' }
      const result = await updateSeuDetails(payload)
      expect(_post).toHaveBeenCalledWith(
        `${SERVICE.CCP_OPTIMIZER}/update_seu_details`,
        payload,
      )
      expect(result).toEqual({ data: 'success' })
    })
    test('updateSubModel should call _post with correct parameters', async () => {
      const payload = { subModel: 'data' }
      const result = await updateSubModel(payload)
      expect(_post).toHaveBeenCalledWith(
        `${SERVICE.CCP_OPTIMIZER}/update_sub_model`,
        payload,
      )
      expect(result).toEqual({ data: 'success' })
    })
    test('updateSubModelParameter should call _post with correct parameters', async () => {
      const payload = { parameter: 'data' }
      const result = await updateSubModelParameter(payload)
      expect(_post).toHaveBeenCalledWith(
        `${SERVICE.CCP_OPTIMIZER}/update_sub_model_parameter`,
        payload,
      )
      expect(result).toEqual({ data: 'success' })
    })
    test('getTrnOdsSuggestionByCaseId should call _post with correct parameters', async () => {
      const caseID = '123'
      const result = await getTrnOdsSuggestionByCaseId(caseID)
      expect(_post).toHaveBeenCalledWith(
        `${SERVICE.CCP_URL}/get_trn_ods_suggestion_by_case_id`,
        { caseID },
      )
      expect(result).toEqual({ data: 'success' })
    })
    test('addTrnODSSuggestion should call _post with correct parameters', async () => {
      const payload = { suggestion: 'data' }
      const result = await addTrnODSSuggestion(payload)
      expect(_post).toHaveBeenCalledWith(
        `${SERVICE.CCP_URL}/add_trn_ods_suggestion`,
        payload,
      )
      expect(result).toEqual({ data: 'success' })
    })
  })
  describe('Error scenarios', () => {
    beforeEach(() => {
      const error = {
        response: {
          data: { error: 'API Error' },
        },
      }
      _post.mockRejectedValue(error)
      _get.mockRejectedValue(error)
    })
    // Test error handling for a representative sample of functions
    test('updateCCPData should handle errors correctly', async () => {
      const body = { test: 'data' }
      const result = await updateCCPData(body)
      expect(result).toEqual({ error: 'API Error' })
    })
    test('addAuditLog should handle errors correctly', async () => {
      const body = { log: 'data' }
      const result = await addAuditLog(body)
      expect(result).toEqual({ error: 'API Error' })
    })
    test('getDefaultValue should handle errors correctly', async () => {
      const body = { targetValue: 100 }
      const result = await getDefaultValue(body)
      expect(result).toEqual({ error: 'API Error' })
    })
    test('getPlantDetails should handle errors correctly', async () => {
      const result = await getPlantDetails()
      expect(result).toEqual({ error: 'API Error' })
    })
    test('addCleanDataRanges should return raw error', async () => {
      const error = new Error('Network error')
      _post.mockRejectedValue(error)

      const payload = { ranges: 'data' }
      const result = await addCleanDataRanges(payload)
      expect(result).toBe(error)
    })
    test('deleteCleanDataRanges should return raw error', async () => {
      const error = new Error('Network error')
      _post.mockRejectedValue(error)

      const payload = { ranges: 'data' }
      const result = await deleteCleanDataRanges(payload)
      expect(result).toBe(error)
    })
    test('updateCleanDataRanges should return raw error', async () => {
      const error = new Error('Network error')
      _post.mockRejectedValue(error)

      const payload = { ranges: 'data' }
      const result = await updateCleanDataRanges(payload)
      expect(result).toBe(error)
    })
    test('getOptimizerVariablesDataByCaseid should handle errors correctly', async () => {
      const caseID = '123'
      const result = await getOptimizerVariablesDataByCaseid(caseID)
      expect(result).toEqual({ error: 'API Error' })
    })
    test('getTrnOdsSuggestionByCaseId should return raw error', async () => {
      const error = new Error('Network error')
      _post.mockRejectedValue(error)

      const caseID = '123'
      const result = await getTrnOdsSuggestionByCaseId(caseID)
      expect(result).toBe(error)
    })
    test('functions should handle errors without response data', async () => {
      const error = new Error('Network error')
      _post.mockRejectedValue(error)
      const result = await updateCCPData({})

      expect(result).toBeUndefined()
    })
  })
})
