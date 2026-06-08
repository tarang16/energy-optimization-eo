import { SERVICE } from 'config/Config'
import _get from 'libs/axios_fetch/_get'
import _post from 'libs/axios_fetch/_post'
export async function updateCCPData(body) {
  try {
    const url = `${SERVICE.CCP_URL}/update_ccp`
    return await _post(url, body)
  } catch (error) {
    return error?.response?.data
  }
}
export async function addAuditLog(body) {
  try {
    const url = `${SERVICE.LOGGING_URL}/add_audit_log`
    return await _post(url, body)
  } catch (error) {
    return error?.response?.data
  }
}
export async function getDefaultValue(body) {
  try {
    const payload = {
      ...body,
      targetValue: `${body?.targetValue}`,
    }
    const url = `${SERVICE.LOGGING_URL}/get_default_value`
    return await _post(url, payload)
  } catch (error) {
    return error?.response?.data
  }
}
export async function updateCCPData2(body) {
  try {
    const url = `${SERVICE.CCP_URL}/update_tag_in_ccp_pi_af`
    return await _post(url, body)
  } catch (error) {
    return error?.response?.data
  }
}
export async function getCCPData(caseId, searchField, pageNumber, pageSize) {
  try {
    let url = `${SERVICE.CCP_URL}/get_ccp_data`
    const body = {
      caseID: caseId,
      pageNumber: pageNumber,
      pageSize: pageSize,
      searchField: searchField,
    }
    return await _post(url, body)
  } catch (error) {
    return error?.response?.data
  }
}
export async function getCcpInfo() {
  try {
    const url = `${SERVICE.CCP_URL}/get_ccp_info`
    return await _post(url)
  } catch (error) {
    return error?.response?.data
  }
}
export async function getSwitchConfigurations() {
  try {
    const url = `${SERVICE.CCP_URL}/get_switch_configurations`
    return await _post(url)
  } catch (error) {
    return error?.response?.data
  }
}
export async function getAffectedModelIdsByTagId(tagId, modelId) {
  try {
    const url = `${SERVICE.CCP_URL}/get_affected_model_ids_by_tag_id`
    const payload = {
      tagId,
      modelId,
    }
    return await _post(url, payload)
  } catch (error) {
    return error?.response?.data
  }
}
export async function getODSInsights(caseId) {
  try {
    let url = `${SERVICE.CCP_URL}/get_ods_insights`
    const body = {
      caseID: caseId,
    }
    return await _post(url, body)
  } catch (error) {
    return error?.response?.data
  }
}
export async function addODSInsights(payload) {
  try {
    const url = `${SERVICE.CCP_URL}/add_ods_insights`
    return await _post(url, payload)
  } catch (error) {
    return error?.response?.data
  }
}
export async function resetODIinsights(caseId) {
  try {
    let url = `${SERVICE.CCP_URL}/reset_ods_insights`
    const body = {
      caseID: caseId,
    }
    return await _post(url, body)
  } catch (error) {
    return error?.response?.data
  }
}
export async function getLbmDataIterations(caseID) {
  try {
    const url = `${SERVICE.CCP_URL}/get_lbm_data_iterations`
    const payload = {
      caseID,
    }
    return await _post(url, payload)
  } catch (error) {
    return error?.response?.data
  }
}
export async function getTagsDataForValidation(caseID) {
  try {
    const url = `${SERVICE.CCP_URL}/get_tags_data_for_validation`
    const payload = {
      caseID,
    }
    return await _post(url, payload)
  } catch (error) {
    return error?.response?.data
  }
}
export async function updateLbmIteration(data) {
  try {
    const url = `${SERVICE.CCP_URL}/update_lbm_iteration`
    const payload = {
      input: data,
    }
    return await _post(url, payload)
  } catch (error) {
    return error?.response?.data
  }
}
export async function updateTagDataDetails(body) {
  try {
    const url = `${SERVICE.CCP_URL}/update_tag`
    return await _post(url, body)
  } catch (error) {
    return error?.response?.data
  }
}
export async function getModelNamesByCaseID(caseID) {
  try {
    const url = `${SERVICE.CCP_URL}/get_model_names_by_case_id`
    const payload = {
      caseID: caseID,
    }
    return await _post(url, payload)
  } catch (error) {
    return error?.response?.data
  }
}
export async function deleteTag(tagID) {
  try {
    const url = `${SERVICE.CCP_URL}/delete_tag`
    const payload = {
      tagID: tagID,
    }
    return await _post(url, payload)
  } catch (error) {
    return error?.response?.data
  }
}
export async function addTag(payload) {
  try {
    const url = `${SERVICE.CCP_URL}/add_tag`
    return await _post(url, payload)
  } catch (error) {
    return error?.response?.data
  }
}
export async function getEOTagsDataByCaseid(
  caseID,
  searchFiled,
  pageNumber,
  pageSize,
) {
  try {
    const url = `${SERVICE.CCP_URL}/get_eo_tags_data_by_caseid`
    const payload = {
      caseID: caseID,
      pageNumber: pageNumber,
      pageSize: pageSize,
      searchField: searchFiled,
    }
    return await _post(url, payload)
  } catch (error) {
    return error?.response?.data
  }
}
export async function getPipelineLocationByCaseid(caseID) {
  try {
    const url = `${SERVICE.CCP_URL}/get_pipeline_locations`
    const payload = {
      caseID,
    }
    return await _post(url, payload)
  } catch (error) {
    return error?.response?.data
  }
}
export async function verifyPiTagName(piTagName) {
  try {
    const url = `${SERVICE.PI_URL}/get_pi_tag_validation`
    const payload = {
      piTagName,
    }
    return await _post(url, payload)
  } catch (error) {
    return error?.response?.data
  }
}
export async function getCaseDetailsByCaseId() {
  try {
    const url = `${SERVICE.CCP_URL}/get_case_details_by_case_id`
    const payload = {
      caseID: null,
    }
    return await _post(url, payload)
  } catch (error) {
    return error?.response?.data
  }
}
export const updateCaseDetails = async (payload) => {
  try {
    const url = `${SERVICE.CCP_URL}/update_case_details`
    return await _post(url, payload)
  } catch (error) {
    return error?.response?.data
  }
}
export const getPlantDetails = async () => {
  try {
    const url = `${SERVICE.CONFIG_URL}/get_plant_details`
    return await _get(url)
  } catch (error) {
    return error?.response?.data
  }
}
export const getBlockDetails = async () => {
  try {
    const url = `${SERVICE.CCP_URL}/get_block_details`
    return await _get(url)
  } catch (error) {
    return error?.response?.data
  }
}
export const getPipelineParametersByCaseId = async (caseID) => {
  try {
    const payload = {
      caseID: caseID,
    }
    const url = `${SERVICE.CCP_URL}/get_pipeline_parameters_by_case_id`
    return await _post(url, payload)
  } catch (error) {
    return error?.response?.data
  }
}
export const updatePipelineParameters = async (payload) => {
  try {
    const url = `${SERVICE.CCP_URL}/update_pipeline_parameters`
    return await _post(url, payload)
  } catch (error) {
    return error?.response?.data
  }
}
export const getUniquepipelineparameterByColumnname = async (columnName) => {
  try {
    const payload = {
      columnName: columnName,
    }
    const url = `${SERVICE.CCP_URL}/get_unique_pipelineparameter_by_columnname`
    return await _post(url, payload)
  } catch (error) {
    return error?.response?.data
  }
}
export const getCleanDataRangesByCaseId = async (caseID) => {
  try {
    const payload = {
      caseID: caseID,
      modelID: null,
    }
    const url = `${SERVICE.CCP_URL}/get_clean_data_ranges_by_case_id`
    return await _post(url, payload)
  } catch (error) {
    return error?.response?.data
  }
}
export const addCleanDataRanges = async (payload) => {
  try {
    const url = `${SERVICE.CCP_URL}/add_clean_data_ranges`
    return await _post(url, payload)
  } catch (error) {
    return error
  }
}
export const deleteCleanDataRanges = async (payload) => {
  try {
    const url = `${SERVICE.CCP_URL}/delete_clean_data_ranges`
    return await _post(url, payload)
  } catch (error) {
    return error
  }
}
export const updateCleanDataRanges = async (payload) => {
  try {
    const url = `${SERVICE.CCP_URL}/update_clean_data_ranges`
    return await _post(url, payload)
  } catch (error) {
    return error
  }
}
export const getPacketTypesByCaseId = async (caseId) => {
  try {
    const payload = {
      caseId: caseId,
    }
    const url = `${SERVICE.CONFIG_URL}/get_packet_types_by_case_id`
    return await _post(url, payload)
  } catch (error) {
    return error?.response?.data
  }
}
export async function getOptimizerVariablesDataByCaseid(caseID) {
  try {
    const url = `${SERVICE.CCP_OPTIMIZER}/get_optimizer_variables_data_by_caseid`
    const payload = {
      caseID,
    }
    return await _post(url, payload)
  } catch (error) {
    console.error('Error in getOptimizerVariablesDataByCaseid:', error)
    return error?.response?.data
  }
}
export async function getOptimizerConstraints(caseID) {
  try {
    const url = `${SERVICE.CCP_OPTIMIZER}/get_optimizer_constraints`
    const payload = {
      caseID,
    }
    return await _post(url, payload)
  } catch (error) {
    console.error('Error in getOptimizerConstraints:', error)
    return error?.response?.data
  }
}
export async function getOptimizerConstraintCategoryDetails() {
  try {
    const url = `${SERVICE.CCP_OPTIMIZER}/get_optimizer_constraint_category_details`
    return await _get(url)
  } catch (error) {
    console.error('Error in getOptimizerConstraints:', error)
    return error?.response?.data
  }
}
export async function getOptimizerParameterById(caseID) {
  try {
    const url = `${SERVICE.CCP_OPTIMIZER}/get_optimizer_parameter_by_caseid`
    const payload = {
      caseID,
    }
    return await _post(url, payload)
  } catch (error) {
    console.error('Error in getOptimizerParameterById:', error)
    return error?.response?.data
  }
}
export async function getOptimizerDerivedEquations(caseID) {
  try {
    const url = `${SERVICE.CCP_OPTIMIZER}/get_optimizer_derived_equations`
    const payload = {
      caseID,
    }
    return await _post(url, payload)
  } catch (error) {
    console.error('Error in getOptimizerDerivedEquations:', error)
    return error?.response?.data
  }
}
export async function getOptimizerObjectiveFunction(caseID) {
  try {
    const url = `${SERVICE.CCP_OPTIMIZER}/get_optimizer_objective_function`
    const payload = {
      caseID,
    }
    return await _post(url, payload)
  } catch (error) {
    console.error('Error in getOptimizerObjectiveFunction:', error)
    return error?.response?.data
  }
}
export const addNewButtonByTag = async (payload) => {
  try {
    const url = `${SERVICE.CCP_URL}/add_tag`
    return await _post(url, payload)
  } catch (error) {
    return error
  }
}
export const addOptimizerVariable = async (payload) => {
  try {
    const url = `${SERVICE.CCP_OPTIMIZER}/add_optimizer_variable`
    return await _post(url, payload)
  } catch (error) {
    return error
  }
}
export const addOptimizerDerivedEquation = async (payload) => {
  try {
    const url = `${SERVICE.CCP_OPTIMIZER}/add_optimizer_derived_equation`
    return await _post(url, payload)
  } catch (error) {
    return error
  }
}
export const updateOptimizationPriceInput = async (payload) => {
  try {
    const url = `${SERVICE.CCP_OPTIMIZER}/update_optimization_price_input`
    return await _post(url, payload)
  } catch (error) {
    return error
  }
}
export const updateEquipementAvailability = async (payload) => {
  try {
    const url = `${SERVICE.CCP_OPTIMIZER}/Update_Equipement_Availability`
    return await _post(url, payload)
  } catch (error) {
    return error
  }
}
export const addOptimizerObjective = async (payload) => {
  try {
    const url = `${SERVICE.CCP_OPTIMIZER}/add_optimizer_objective`
    return await _post(url, payload)
  } catch (error) {
    return error
  }
}
export const updateOptimizerParameter = async (payload) => {
  try {
    const url = `${SERVICE.CCP_OPTIMIZER}/update_optimizer_parameter`
    return await _post(url, payload)
  } catch (error) {
    return error
  }
}
export const deleteOptimizerVariableByVariableID = async (payload) => {
  try {
    const url = `${SERVICE.CCP_OPTIMIZER}/delete_optimizer_variable_by_variableid`
    return await _post(url, payload)
  } catch (error) {
    return error
  }
}
export const deleteOptimizerParameterByModelTagId = async (payload) => {
  try {
    const url = `${SERVICE.CCP_OPTIMIZER}/delete_optimizer_parameter_by_modeltagid`
    return await _post(url, payload)
  } catch (error) {
    return error
  }
}
export const deleteOptimizerConstraintByConstraintID = async (payload) => {
  try {
    const url = `${SERVICE.CCP_OPTIMIZER}/delete_optimizer_constraint_by_constraintid`
    return await _post(url, payload)
  } catch (error) {
    return error
  }
}
export const deleteOptimizerDerivedEquationByDerivedEquationID = async (
  payload,
) => {
  try {
    const url = `${SERVICE.CCP_OPTIMIZER}/delete_optimizer_derived_equation_by_derivedequationid`
    return await _post(url, payload)
  } catch (error) {
    return error
  }
}
export const addOptimizerConstraint = async (payload) => {
  try {
    const url = `${SERVICE.CCP_OPTIMIZER}/add_optimizer_constraint`
    return await _post(url, payload)
  } catch (error) {
    return error
  }
}
export async function getMacros(caseID) {
  try {
    let url = `${SERVICE.CCP_URL}/get_pipeline_macros_by_case_id`
    const body = {
      caseID,
    }
    return await _post(url, body)
  } catch (error) {
    return error?.response?.data
  }
}
export async function getMstMacros() {
  try {
    let url = `${SERVICE.CCP_URL}/get_mst_pipeline_macros`
    return await _post(url)
  } catch (error) {
    return error?.response?.data
  }
}
export async function getAffectedConstants(mstAfConstantId, modelId) {
  try {
    const url = `${SERVICE.PI_URL}/get_affected_pi_af_constants`
    const payload = {
      mstAfConstantId,
      modelId,
    }
    return await _post(url, payload)
  } catch (error) {
    return error?.response?.data
  }
}
export async function upsertMacrosData(body) {
  try {
    const url = `${SERVICE.CCP_URL}/update_pipeline_macros`
    return await _post(url, body)
  } catch (error) {
    return error?.response?.data
  }
}
export async function getSeuDetails(caseID) {
  try {
    const url = `${SERVICE.CCP_OPTIMIZER}/get_seu_details`
    const payload = {
      caseID: caseID,
    }
    return await _post(url, payload)
  } catch (error) {
    return error?.response?.data
  }
}
export async function getSubModel(caseID) {
  try {
    const url = `${SERVICE.CCP_OPTIMIZER}/get_sub_model`
    const payload = {
      caseID: caseID,
    }
    return await _post(url, payload)
  } catch (error) {
    return error?.response?.data
  }
}
export async function getSubModelParameter(caseID) {
  try {
    const url = `${SERVICE.CCP_OPTIMIZER}/get_sub_model_parameter`
    const payload = {
      caseID: caseID,
    }
    return await _post(url, payload)
  } catch (error) {
    return error?.response?.data
  }
}
export const updateSeuDetails = async (payload) => {
  try {
    const url = `${SERVICE.CCP_OPTIMIZER}/update_seu_details`
    return await _post(url, payload)
  } catch (error) {
    return error
  }
}
export const updateSubModel = async (payload) => {
  try {
    const url = `${SERVICE.CCP_OPTIMIZER}/update_sub_model`
    return await _post(url, payload)
  } catch (error) {
    return error
  }
}
export const updateSubModelParameter = async (payload) => {
  try {
    const url = `${SERVICE.CCP_OPTIMIZER}/update_sub_model_parameter`
    return await _post(url, payload)
  } catch (error) {
    return error
  }
}
export const getTrnOdsSuggestionByCaseId = async (caseID) => {
  try {
    const url = `${SERVICE.CCP_URL}/get_trn_ods_suggestion_by_case_id`
    const payload = {
      caseID,
    }
    return await _post(url, payload)
  } catch (error) {
    return error
  }
}
export async function addTrnODSSuggestion(payload) {
  try {
    const url = `${SERVICE.CCP_URL}/add_trn_ods_suggestion`
    return await _post(url, payload)
  } catch (error) {
    return error?.response?.data
  }
}
