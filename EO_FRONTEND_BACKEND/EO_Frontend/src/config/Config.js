import { env } from 'config/env'
export const BASE_URL = env.EO_BASEURL
export const SERVICE = {
  AUTH_URL: `${BASE_URL}/WinAuth`,
  CONFIG_URL: `${BASE_URL}/Config`,
  FAV_URL: `${BASE_URL}/Favorites`,
  HISTORICAL_URL: `${BASE_URL}/Historical`,
  ACCOUNT_URL: `${BASE_URL}/Account`,
  ADMIN_URL: `${BASE_URL}/Admin`,
  CCP_URL: `${BASE_URL}/Ccp`,
  HEALTH_INFRA_URL: `${BASE_URL}/HealthInfra`,
  CURRENT_URL: `${BASE_URL}/Current`,
  ODS_URL: `${BASE_URL}/ODS`,
  LOGGING_URL: `${BASE_URL}/Logging`,
  WORK_FLOW_URL: `${BASE_URL}/Workflow`,
  PE_ODS_WORK_FLOW_URL: `${BASE_URL}/PeOdsWorkflow`,
  ECM_URL: `${BASE_URL}/Ecm`,
  PI_URL: `${BASE_URL}/PI`,
  EM_URL: `${BASE_URL}/EnergyManagement`,
  NETWORK_URL: `${BASE_URL}/Network`,
  OPTIMIMZATION: `${BASE_URL}/optimization`,
  CCP_OPTIMIZER: `${BASE_URL}/CcpOptimizer`,
  DOWNLOAD_URL: `${BASE_URL}/Download`,
}
export const TOKEN = {
  AUTH_TOKEN_VAR: 'EOAuthToken',
  AUTH_TOKEN_EXPIRY_CHECK_INTERVAL: parseInt(
    env.EO_AUTH_TOKEN_EXPIRY_CHECK_INTERVAL,
  ),
  AUTH_TOKEN_EXPIRY_BUFFER: parseInt(env.EO_AUTH_TOKEN_EXPIRY_BUFFER),
  TOKEN_KEY_CCP: 'ccp',
  TOKEN_KEY_DEVELOPER: 'developer',
  TOKEN_KEY_ODS: 'ods',
  TOKEN_KEY_READ: 'read',
  TOKEN_KEY_FIRSTNAME: 'family_name',
  TOKEN_KEY_LASTNAME: 'given_name',
  TOKEN_KEY_ROLES: 'roles',
}
export const APP_CONFIG = {
  TOOLTIP_SUBSTR_LIMIT: 80,
  PLANT_DATA_VAR: 'EOPlantData',
  TIMEZONE_VAR: 'EOTimeZOne',
  AFFILIATE_DATA_VAR: 'EOAffiliateData',
  RECORDS_PER_PAGE: 20,
  CACHE_TIME_LIMIT: parseInt(env.EO_CACHE_TIME_LIMIT),
  CACHE_REFRESH_MIN_DURATION: parseInt(env.EO_CACHE_REFRESH_MIN_DURATION),
  EO_APPLICATION_NAME: env.EO_APPLICATION_NAME,
}
export const ADMIN_STATS = {
  STATS_RECORDS_PER_PAGE: 7,
  ANALYTICS_RECORDS_PER_PAGE: 8,
}
export const ROLES = {
  ADMIN: 'admin',
  CORPORATE: 'corporate',
  PARTIAL_CORPORATE: 'partial_corporate',
  USER: 'user',
  NO_USER: 'non_user',
}
export const STAGE_ROLE = {
  1: 'Process Manager',
  2: 'Process Engineer',
  3: 'Operation Manager',
  4: 'Operation Engineer',
}
export const STAGE_BULK_ROLE = {
  1: 'Process Engineer',
  2: 'Operation Manager',
}
export const STAGE_ROLE_ASSIGNEE = {
  1: 'Process Engineer',
  2: 'Operation Manager',
  3: 'Operation Engineer',
}
export const NAVIGATION = {
  LOADING: 'loading',
  IDLE: 'idle',
  SUBMITTING: 'SUBMITTING',
}
export const EMPTY_CASE = {
  affiliate: null,
  affiliate_code: null,
  case_id: null,
  plant: null,
  plant_id: null,
  region: null,
  system: null,
}
export const ERRORTITLE = {
  CLIENT_ERROR: 'UNAUTHORIZED',
  UNAUTHORIZED_ERROR: 'UNAUTHORIZED',
  UNKNOWN_ERROR: 'ERROR',
  APPLICATION_ERROR: 'SOMETHING WENT WRONG',
}
export const ERRORMSG = {
  APPLICATION_ERROR: 'Invalid Application Data, Unable to process.',
  UNKNOWN_ERROR:
    'Please try again later.\nIf error persists, kindly contact system administrator',
  UNAUTHENTICATED_ERROR:
    'Resource not available for anonymous access.\n Client authentication failed, Kindly contact system administrator.',
  INVALID_RESOURCE: 'The requested resource does not exists.',
  UNAUTHORIZED_ERROR:
    "You're not authorized to view the requested resource, kindly contact system administrator",
  ANONYMOUS_ACCESS_ERROR:
    'Resource not available for anonymous access. Client authentication required.',
  CASE_TIME_NULL_ERROR:
    'Unable to load system information, please try again later',
  TIMEOUT_ERROR: 'Resuest timed out, please try again later.',
  SERVER_ERROR: 'Server error, please try again later.',
}
export const MINMAXINTERVALTIME = {
  MAXTIME: 10000,
  INTERVALTIME: 5000,
}
export const TIMEZONE_INFO = {
  LANGUAGE: env.EO_DEFAULT_LANGUAGE,
  TIMEZONE: env.EO_DEFAULT_TIMEZONE,
}
export const SUSTAINABILITY_SCORECARD = {
  REFRESH_DATA: parseInt(env.EO_SUS_CARD_REFRESH_TIME),
}
export const WORKFLOW_ROLE = {
  SUSTAINABILITY_FOCAL_POINT: '1',
  OPERATION_PROCESS_ENGINEER: '2',
  INFO_GROUP: '3',
  ESCALATION: '4',
  Mailing_List_Business_Users: '5',
}
export const STAGE_ACTION = {
  INITIATED: 'Initiated',
  ACCEPT: 'Accept',
  DELEGATE: 'Forward',
  REJECT: 'Reject',
  REASSING: 'Forward',
  CLOSE: 'Closed (Implemented)',
  CHANGED_TARGET_DATE: 'Change Target Date',
  WILL_IMPLEMENT: 'Set Target Date',
  MARK_AS_UNDER_STUDY: 'Change Target Date',
  REVISE_TARGET_DATE: 'Change Target Date',
  CLOSE_REJECT: 'Closed (Rejected)',
  CONFIRM_IMPLEMENTATION: 'Closed (Implemented)',
}
export const BULK_STAGES = {
  STAGE_ONE: 1,
  STAGE_TWO: 2,
  STAGE_THREE: 3,
  STAGE_FOUR: 4,
}
export const refreshInterval = 5000
export const maxLengthInput = 5000
export const countUpdateInterval = 15000
export const submitConfirmationMessage =
  'Are you sure you want to submit the request? This action will update the existing records.'
export const userWarningMessage =
  'Changes you made will not be saved, are you sure want to cancel.'
export const userConfirmationMessage =
  'Entered Formula expression cannot be syntactically validated in Frontend.If you are sure, the entered expression is compatible with backend, you can proceed to save OR  change the expression.   Are you sure you want to Submit request ?'
export const auditLogConfig = {
  activityName: {
    update: 'Update',
    add: 'Add',
    delete: 'Delete',
  },
  activityCategory: {
    tagDetails: 'Tag Details',
    variables: 'Variables',
    parameters: 'Parameters',
    constraints: 'Constraints',
    derived_equations: 'Derived Equations',
    objective: 'Objective',
    priceInput: 'Price Input',
    equipmentAvailability: 'Equipment Availability',
    constants: 'Constants',
    seuDetails: 'seu Details',
    subModel: 'sub Model',
    macros: 'Macros',
    suggestion: 'Suggestion',
    subModelParameter: 'sub Model Parameter',
  },
  activitydescription: {
    updateTagDetails: 'Modifying the values for the modelTagId in tag Details',
    updatevariables: 'Modifying the values for the variableId in Optimizer',
    updateparameters: 'Modifying the values for the modelTagId in Optimizer',
    updateconstraints: 'Modifying the values for the constraintId in Optimizer',
    updatederived_equations:
      'Modifying the values for derivedEquationId Tag in Optimizer',
    updateobjective: 'Modifying the values for the objectiveId in Optimizer',
    updatePriceInput: 'Modifying the values for the price Input in price Input',
    updateEquipmentAvailability:
      'Modifying the values for the EquipmentAvailabilityId in Equipment Availability',
    updateConstants: 'Modifying the values for the constants',
    updateSeuDetails: 'Modifying the values for the Seu Details in CCP',
    updateSubModel: 'Modifying the values for the Sub Model in CCP',
    updateMacros: 'Modifying the values for the macros in CCP',
    updateSuggestion: 'Modifying the values for the causeTagID in Suggestion',
    updateSubModelParameter:
      'Modifying the values of the Sub Model Parameter in CCP',
  },
  target: {
    tagDetails: 'modelTagId',
    variables: 'variableModelTagId',
    parameters: 'parameterModelTagId',
    constraints: 'constraintId',
    derived_equations: 'derivedEquationModelTagId',
    objective: 'objectiveId',
    priceInput: 'priceInputModelTagId',
    equipmentAvailability: 'equipmentavailabilityId',
    updatePiAfConstants: 'constantId',
    updateTagConstant: 'constantTagId',
    benchmarkingModel: 'benchmarkingTagID',
    seuDetails: 'seuID',
    subModel: 'subModelID',
    pipelineMacroId: 'pipelineMacroId',
    suggestions: 'causeTagID',
    subModelParameterID: 'subModelParameterID',
  },
}
export const GET_STAGE_ACTION = {
  0: 'INITIATED',
  1: 'ACCEPT',
  2: 'DELEGATE',
  3: 'REJECT',
  4: 'CLOSE',
  5: 'REASSING',
  6: 'CHANGED_TARGET_DATE',
  7: 'WILL_IMPLEMENT',
}
export const TRACK_EVENT = {
  applicationName: env.EO_APPLICATION_NAME,
}
export const DEFAULT_TIMEZONE = 'Asia/Riyadh'
export const ACTIVE_TAB = {
  DAILYVIEW: 'Daily view',
  MONTHLYVIEW: 'Monthly view',
  YEARLYVIEW: 'Yearly view',
  PLANTVIEW: 'Plant view',
  ENPI_GJ: 'ENPI(GJ)',
  EnpiDollar: 'ENPI($)',
  Energy: 'ENERGY(GJ)',
  Efficiency: 'EFFICIENCY(%)',
  CATEGORYVIEW: 'Category view',
}
export const FORMULA_BOX_VALIDATION = {
  MISSING_NOMINAL: 9876543210,
  MISSING_NUMERIC: 1234567890,
}
export const MODEL_CONFIG_STATUS_CODES = {
  MODEL_FAILEDT_FIND_TOOLTIP: 0,
  MODEL_YET_TO_RUN: 1,
  MODEL_FAILED_TO_FIND_SOLUTION: 2,
  MODEL_CONVERGED: 3,
  SERVICE_UNAVAILABLE: 4,
}
