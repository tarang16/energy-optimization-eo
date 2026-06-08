using Asp.Versioning;
using EOApplication.Contracts.Services;
using EODomain.Common;
using EODomain.Models.CCP;
using EOWebMicroservice.Filter;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using EOInfrastructure.Services;
using System.Net;

namespace EOWebMicroservice.Controllers.v1
{
    /// <summary>
    /// 
    /// </summary>
    [ApiVersion("1.0")]
    public class CcpController : BaseController
    {
        private readonly ICcpServices _ccpServices;

        /// <summary>
        /// config injection
        /// </summary>
        public readonly IConfiguration _configuration;

        /// <summary>
        /// account services injection
        /// </summary>
        public readonly IAccountServices _accountServices;

        /// <summary>
        /// config services injection
        /// </summary>
        public readonly IConfigServices _configServices;

        /// <summary>
        /// Constructor for CCPController
        /// </summary>
        /// <param name="ccpServices"></param>
        /// <param name="configuration"></param>
        /// <param name="accountServices"></param>
        /// <param name="configServices"></param>
        public CcpController(ICcpServices ccpServices, IConfiguration configuration, IAccountServices accountServices, IConfigServices configServices)
        {
            _ccpServices = ccpServices;
            _configuration = configuration;
            _accountServices = accountServices;
            _configServices = configServices;
        }

        /// <summary>
        /// To fetch get tags data for validation
        /// </summary>
        /// <param name="request"></param>
        /// <returns></returns>
        [HttpPost("get_tags_data_for_validation")]
        public async Task<IActionResult> GetTagsDataForValidation([FromBody] GetTagsDataByCaseIDRequest request, [FromQuery] string source = "db")
        {
            var ccpdataresult = await _ccpServices.GetTagsDataForValidationAsync(request, source);
            if (ccpdataresult == null)
            {
                return Ok(new Response<Array>(ResponseConstants.EMPTYOK, ResponseConstants.EMPTYOK_MESSAGE, ResponseConstants.EMPTYDATA));
            }
            else
            {
                return Ok(new Response<object>(ccpdataresult));
            }
        }

        /// <summary>
        /// To get list of tags associated with a case
        /// </summary>
        /// <param name="request"></param>
        /// <returns></returns>
        [HttpPost("get_eo_tags_data_by_caseid")]
        public async Task<IActionResult> GetEOTagsDataByCaseID([FromBody] GetTagsDataByCaseIDRequest request)
        {
            var result = await _ccpServices.GetEOTagsDataByCaseIDAsync(request);
            if (result == null)
            {
                return Ok(new Response<Array>(ResponseConstants.EMPTYOK, ResponseConstants.EMPTYOK_MESSAGE, ResponseConstants.EMPTYDATA));
            }
            else
            {
                return Ok(new PaginatedResponse<object>(result.GetTagsDataByCaseIDPageResponse!, request.pageNumber, request.pageSize, result.pageCount));
            }
        }

        /// <summary>
        /// To add tag
        /// </summary>
        /// <param name="request"></param>
        /// <returns></returns>
        [HttpPost("add_tag")]
        [DeveloperAuthFilter(claimType = "developer", idParameter = "caseID", skipAdmin = true)]
        public async Task<IActionResult> AddTag([FromBody] AddTagRequest request)
        {
            var result = await Task.Run(() => _ccpServices.AddTagAsync(request));
            if (result.Contains("exists") || result.Contains("succesfully"))
            {
                return Ok(new Response<object>(result));
            }
            else
            {
                return BadRequest(new Response<Array>(ResponseConstants.CUSTOMERROR, "Invalid ObjectiveId", ResponseConstants.EMPTYDATA));
            }
        }

        /// <summary>
        /// To updat tag
        /// </summary>
        /// <param name="request"></param>
        /// <returns></returns>
        [HttpPost("update_tag")]
        [DeveloperAuthFilter(claimType = "developer", idParameter = "caseID", skipAdmin = true)]
        public async Task<IActionResult> UpdateTag([FromBody] UpdateTagRequest request)
        {
            var result = await Task.Run(() => _ccpServices.UpdateTagAsync(request));
            if (result.Contains("updated"))
            {
                return Ok(new Response<object>(result));
            }
            else
            {
                return BadRequest(new Response<Array>(ResponseConstants.CUSTOMERROR, "Invalid ObjectiveId", ResponseConstants.EMPTYDATA));
            }
        }

        /// <summary>
        /// To fetch all the Blocks Data
        /// </summary>
        /// <returns></returns>
        [HttpGet("get_block_details")]
        public async Task<IActionResult> GetBlockDetails()
        {
            var ccpdataresult = await _ccpServices.GetBlocksAsync();
            if (ccpdataresult.Count == 0)
            {
                return Ok(new Response<Array>(ResponseConstants.EMPTYOK, ResponseConstants.EMPTYOK_MESSAGE, ResponseConstants.EMPTYDATA));
            }
            else
            {
                return Ok(new Response<object>(ccpdataresult));
            }
        }

        /// <summary>
        /// To fetch get model name by case id
        /// </summary>
        /// <param name="request"></param>
        /// <returns></returns>
        [HttpPost("get_model_names_by_case_id")]
        public async Task<IActionResult> GetModelNamesByCaseIdDataAsync([FromBody] GetModelNamesByCaseIdDataRequest request)
        {
            var result = await _ccpServices.GetModelNamesByCaseIdDataAsync(request);
            if (result == null)
            {
                return Ok(new Response<Array>(ResponseConstants.EMPTYOK, ResponseConstants.EMPTYOK_MESSAGE, ResponseConstants.EMPTYDATA));
            }
            else
            {
                return Ok(new Response<object>(result));
            }

        }

        /// <summary>
        /// To delete provided tag if exists
        /// </summary>
        /// <param name="request"></param>
        /// <returns></returns>
        [HttpPost("delete_tag")]
        public async Task<IActionResult> DeleteTagDataAsync([FromBody] DeleteTagDataRequest request)
        {
            var result = await _ccpServices.DeleteTagDataAsync(request);
            if (result == null)
            {
                return Ok(new Response<Array>(ResponseConstants.EMPTYOK, ResponseConstants.EMPTYOK_MESSAGE, ResponseConstants.EMPTYDATA));
            }
            else
            {
                return Ok(new Response<object>(result));
            }

        }

        /// <summary>
        /// To fetch all the details of all the tags available for the given input of a CaseID
        /// This also tells if a tag is pi tag or not
        /// </summary>
        /// <param name="request"></param>
        /// <returns></returns>
        [HttpPost("get_ccp_data")]
        public async Task<IActionResult> GetCcpData([FromBody] GetCaseIDRequest request)
        {
            int caseCount = _accountServices.GetCaseIDCountFromCaseIDListAsync(request.caseID.ToString()).Result;
            if (caseCount != 1)
            {
                return BadRequest(new Response<Array>(ResponseConstants.CUSTOMERROR, "Invalid caseID", ResponseConstants.EMPTYDATA));
            }

            var ccpdataresult = await _ccpServices.GetCcpDataAsync(request);
            if (ccpdataresult.GetCaseIDResponse == null || ccpdataresult.GetCaseIDResponse.Count == 0 || ccpdataresult.GetCaseIDResponse!.Count == 0)
            {
                return Ok(new Response<Array>(ResponseConstants.EMPTYOK, ResponseConstants.EMPTYOK_MESSAGE, ResponseConstants.EMPTYDATA));
            }
            else
            {
                return Ok(new PaginatedResponse<object>(ccpdataresult.GetCaseIDResponse!, request.pageNumber, request.pageSize, ccpdataresult.pageCount));
            }

        }

        /// <summary>
        /// To Add the details of a CauseTagID
        /// </summary>
        /// <param name="request"></param>
        /// <returns></returns>
        [HttpPost("add_ods_insights")]
        [GenericPlantAuthFilterAttribute(claimType = "ccp", idParameter = "causeTagId", skipAdmin = true)]
        [Base64FilterAttribute("suggestion", "description")]
        public async Task<IActionResult> AddOdsInsights([FromBody] AddOdsInsightsRequest request)
        {
            var claims = HttpContext.User.Identity as ClaimsIdentity;
            Claim? claimUID = claims!.Claims.FirstOrDefault(claim => claim.Type == "uid");
            int userID = Convert.ToInt32(claimUID!.Value);
            request.createdBy = userID;
            request.udpatedBy = userID;
            var result = await Task.Run(() => _ccpServices.AddOdsInsights(request!));
            if (result == null)
            {
                return BadRequest(new Response<Array>(ResponseConstants.CUSTOMERROR, "Invalid causeTagId", ResponseConstants.EMPTYDATA));
            }
            else
            {
                return Ok(new Response<object>(result));
            }
        }

        /// <summary>
        /// To remove all the details of insights of a given caseID
        /// <param name="request"></param>
        /// <returns></returns>
        /// </summary>
        [HttpPost("reset_ods_insights")]
        [GenericPlantAuthFilterAttribute(claimType = "ccp", idParameter = "caseID", skipAdmin = true)]
        public async Task<IActionResult> ResetOdsInsights([FromBody] ResetOdsInsightsRequest request)
        {
            var claims = HttpContext.User.Identity as ClaimsIdentity;
            Claim? claimUID = claims!.Claims.FirstOrDefault(claim => claim.Type == "uid");
            int userID = Convert.ToInt32(claimUID!.Value);
            request.updatedBy = userID;
            var result = await _ccpServices.ResetOdsInsights(request!);
            if (result == null)
            {
                return BadRequest(new Response<Array>(ResponseConstants.CUSTOMERROR, "Invalid caseID", ResponseConstants.EMPTYDATA));
            }
            else
            {
                return Ok(new Response<object>(result));
            }
        }

        /// <summary>
        /// To fetch tag name and value for iterations
        /// </summary>
        /// <param name="request"></param>
        /// <returns></returns>
        [HttpPost("get_tag_data_for_validation")]
        public async Task<IActionResult> GetTagDataForValidation([FromBody] GetTagDataByCaseIDRequest request, [FromQuery] string source = "db")
        {
            var result = await _ccpServices.GetTagDataForValidationAsync(request.caseID, source);
            if (result == null || result.Count == 0)
            {
                return Ok(new Response<Array>(ResponseConstants.EMPTYOK, ResponseConstants.EMPTYOK_MESSAGE, ResponseConstants.EMPTYDATA));
            }
            else
            {
                return Ok(new Response<object>(result));
            }
        }

        /// <summary>
        /// To update tag related data from case configuration portal
        /// </summary>
        /// <param name="request"></param>
        /// <returns></returns>
        [HttpPost("update_ccp")]
        [DeveloperAuthFilter(claimType = "developer", idParameter = "caseID", skipAdmin = true)]
        public async Task<IActionResult> UpdateCCP([FromBody] UpdateCcpRequest request)
        {
            var result = await _ccpServices.UpdateCCP(request);
            if (result == 0)
            {
                return Ok(new Response<Array>(ResponseConstants.EMPTYOK, ResponseConstants.EMPTYOK_MESSAGE, ResponseConstants.EMPTYDATA));
            }
            else
            {
                return Ok(new Response<object>(result));
            }
        }

        /// <summary>
        /// To get tag data for update
        /// </summary>
        /// <param name="request"></param>
        /// <returns></returns>
        [HttpPost("get_tag_data_for_update")]
        public async Task<IActionResult> GetTagDataForUpdate([FromBody] GetTagDataForUpdateRequest request)
        {

            var result = await _ccpServices.GetTagDataForUpdateAsync(request);

            if (result == null)
            {
                return Ok(new Response<Array>(ResponseConstants.EMPTYOK, ResponseConstants.EMPTYOK_MESSAGE, ResponseConstants.EMPTYDATA));
            }
            else
            {
                return Ok(new Response<object>(result));
            }
        }

        /// <summary>
        /// To fetch case details
        /// </summary>
        /// <param name="request"></param>
        /// <returns></returns>
        [HttpPost("get_case_details_by_case_id")]
        public async Task<IActionResult> GetCaseDetailsByCaseId([FromBody] NullableCaseIdRequest request)
        {
            int userID = CommonMethod.GetEmployeeIdFromClaim(HttpContext);
            var result = await _ccpServices.GetCaseDetailsByCaseIDAsync(userID);
            if (result == null)
            {
                return Ok(new Response<Array>(ResponseConstants.EMPTYOK, ResponseConstants.EMPTYOK_MESSAGE, ResponseConstants.EMPTYDATA));
            }
            else
            {
                return Ok(new Response<object>(result));
            }
        }

        /// <summary>
        /// To update case details
        /// </summary>
        /// <param name="request"></param>
        /// <returns></returns>
        [HttpPost("update_case_details")]
        [GenericPlantAuthFilterAttribute(claimType = "ccp", idParameter = "caseID", skipAdmin = true)]
        [Base64FilterAttribute("caseName", "referenceDocUrl", "description")]
        public async Task<IActionResult> PostUpdateCaseDetails([FromBody] UpdateCaseDetailsRequest request)
        {
            int caseID = request.caseID;
            if (request != null)
            {
                int caseCount = _accountServices.GetCaseIDCountFromCaseIDListAsync(caseID.ToString()).Result;
                if (caseCount != 1)
                {
                    return BadRequest(new Response<Array>(ResponseConstants.CUSTOMERROR, "Invalid caseID", ResponseConstants.EMPTYDATA));
                }
            }
            var result = await _ccpServices.PostUpdateCaseDetailsAsync(request!);
            if (string.IsNullOrEmpty(result))
            {
                return Ok(new Response<Array>(ResponseConstants.EMPTYOK, ResponseConstants.EMPTYOK_MESSAGE, ResponseConstants.EMPTYDATA));
            }
            else
            {
                return Ok(new Response<object>(result));
            }
        }





        /// <summary>
        /// To delete case details
        /// </summary>
        /// <param name="request"></param>
        /// <returns></returns>
        [HttpPost("delete_case_details")]
        [GenericPlantAuthFilterAttribute(claimType = "ccp", idParameter = "caseID", skipAdmin = true)]
        public async Task<IActionResult> PostDeleteCaseDetails([FromBody] DeleteCaseDetailsRequest request)
        {
            int caseID = request.caseID;
            if (request != null)
            {
                int caseCount = _accountServices.GetCaseIDCountFromCaseIDListAsync(caseID.ToString()).Result;
                if (caseCount != 1)
                {
                    return BadRequest(new Response<Array>(ResponseConstants.CUSTOMERROR, "Invalid caseID", ResponseConstants.EMPTYDATA));
                }
            }
            var result = await _ccpServices.PostDeleteCaseDetailsAsync(request!);
            if (result == null)
            {
                return Ok(new Response<Array>(ResponseConstants.EMPTYOK, ResponseConstants.EMPTYOK_MESSAGE, ResponseConstants.EMPTYDATA));
            }
            else
            {
                return Ok(new Response<object>(result));
            }
        }

        /// <summary>
        /// To add a case detail
        /// </summary>
        /// <param name="request"></param>
        /// <returns></returns>
        [HttpPost("add_case_details")]
        [GenericPlantAuthFilterAttribute(claimType = "ccp", idParameter = "caseID", skipAdmin = true)]
        public async Task<IActionResult> PostAddCaseDetails([FromBody] InsertCaseDetailsRequest request)
        {
            var result = await _ccpServices.PostAddCaseDetailsAsync(request!);
            if (result == null)
            {
                return Ok(new Response<Array>(ResponseConstants.EMPTYOK, ResponseConstants.EMPTYOK_MESSAGE, ResponseConstants.EMPTYDATA));
            }
            else
            {
                return Ok(new Response<object>(result));
            }
        }

        /// <summary>
        /// To update tags data in CCP and PI AF
        /// </summary>
        /// <param name="request"></param>
        /// <returns></returns>
        [HttpPost("update_tag_in_ccp_pi_af")]
        [GenericPlantAuthFilterAttribute(claimType = "ccp", idParameter = "caseID", skipAdmin = true)]
        public async Task<IActionResult> UpdateTagDetailsInAfAndCcpTable([FromBody] UpdateCcpAndPiAttributeValueRequest request)
        {
            var currentUserId = CommonMethod.GetEmployeeIdFromClaim(HttpContext);
            request.createdBy = currentUserId;
            var ccpTagsResponse = await _ccpServices.UpdateTagDetailsInAfAndCcpTable(request!);
            if (ccpTagsResponse.status != (int)HttpStatusCode.OK)
            {
                var attributesArray = new[]
                {
                 ccpTagsResponse.attributes!.attributes_failed?.ToArray(),
                 ccpTagsResponse.attributes!.attributes_success?.ToArray(),
                };

                return BadRequest(new Response<Array>(ccpTagsResponse.status, ccpTagsResponse.message!, attributesArray));
            }
            else
            {
                return Ok(new Response<object>(ccpTagsResponse));
            }
        }

        /// <summary>
        /// To get affected model ids by tag id.
        /// </summary>
        /// <param name="request"></param>
        /// <returns></returns>                                                                                                                 
        [HttpPost("get_affected_model_ids_by_tag_id")]
        public async Task<IActionResult> GetAffectedModelIdsByTagId([FromBody] GetAffectedModelIdsByTagIdRequest request)
        {
            var result = await _ccpServices.GetAffectedModelIdsByTagId(request);
            if (result.Count == 0)
            {
                return Ok(new Response<Array>(ResponseConstants.EMPTYOK, ResponseConstants.EMPTYOK_MESSAGE, ResponseConstants.EMPTYDATA));
            }
            else
            {
                return Ok(new Response<object>(result));
            }

        }

        /// <summary>
        /// To get case configuration portal info.
        /// </summary>
        /// <returns></returns>                                                                        
        [HttpPost("get_ccp_info")]
        public async Task<IActionResult> GetCaseConfigurationPortalInfo()
        {
            var result = await _ccpServices.GetCaseConfigurationPortalInfo();
            if (result.ToString() == null)
            {
                return Ok(new Response<Array>(ResponseConstants.EMPTYOK, ResponseConstants.EMPTYOK_MESSAGE, ResponseConstants.EMPTYDATA));
            }
            else
            {
                return Ok(new Response<object>(result));
            }
        }

        /// <summary>
        /// To fetch pipeline macros by caseId.
        /// </summary>
        /// <param name="request"></param>
        /// <returns></returns>                                                                        
        [HttpPost("get_pipeline_macros_by_case_id")]
        public async Task<IActionResult> GetPipelineMacrosByCaseId(GetPipelineMacrosByCaseIdRequest request)
        {
            var result = await _ccpServices.GetPipelineMacrosByCaseIdAsync(request);
            if (result.ToString() == null)
            {
                return Ok(new Response<Array>(ResponseConstants.EMPTYOK, ResponseConstants.EMPTYOK_MESSAGE, ResponseConstants.EMPTYDATA));
            }
            else
            {
                return Ok(new Response<object>(result));
            }
        }

        /// <summary>
        /// To fetch mst pipeline macros.
        /// </summary>
        /// <returns></returns>                                                                        
        [HttpPost("get_mst_pipeline_macros")]
        public async Task<IActionResult> GetMstPipelineMacros()
        {
            var result = await _ccpServices.GetMstPipelineMacrosAsync();
            if (result.ToString() == null)
            {
                return Ok(new Response<Array>(ResponseConstants.EMPTYOK, ResponseConstants.EMPTYOK_MESSAGE, ResponseConstants.EMPTYDATA));
            }
            else
            {
                return Ok(new Response<object>(result));
            }
        }

        /// <summary>
        /// To update pipeline macros
        /// </summary>
        /// <param name="request"></param>
        /// <returns></returns>
        [HttpPost("update_pipeline_macros")]
        [DeveloperAuthFilter(claimType = "developer", idParameter = "caseID", skipAdmin = true)]
        public async Task<IActionResult> UpdatePipelineMacros([FromBody] UpdatePipelineMacrosRequest request)
        {
            var result = await _ccpServices.UpdatePipelineMacrosAsync(request);

            if (result == 0)
            {
                return Ok(new Response<Array>(ResponseConstants.EMPTYOK, ResponseConstants.EMPTYOK_MESSAGE, ResponseConstants.EMPTYDATA));
            }
            else
            {
                return Ok(new Response<object>(result));
            }
        }

        /// <summary>
        /// To get switch configurations
        /// </summary>
        /// <returns></returns>                                                                        
        [HttpPost("get_switch_configurations")]
        public async Task<IActionResult> GetSwitchConfigurations()
        {
            var result = await _ccpServices.GetSwitchConfigurationsAsync();
            if (result.ToString() == null)
            {
                return Ok(new Response<Array>(ResponseConstants.EMPTYOK, ResponseConstants.EMPTYOK_MESSAGE, ResponseConstants.EMPTYDATA));
            }
            else
            {
                return Ok(new Response<object>(result));
            }
        }

        /// <summary>
        /// To get trn ods suggestions by case Id
        /// </summary>
        /// <returns></returns>                                                                        
        [HttpPost("get_trn_ods_suggestion_by_case_id")]
        public async Task<IActionResult> GetTrnOdsSuggestionByCaseIdAsync(GetTrnOdsByCaseIDRequest request)
        {
            var result = await _ccpServices.GetTrnOdsSuggestionByCaseIdAsync(request);
            if (result.ToString() == null)
            {
                return Ok(new Response<Array>(ResponseConstants.EMPTYOK, ResponseConstants.EMPTYOK_MESSAGE, ResponseConstants.EMPTYDATA));
            }
            else
            {
                return Ok(new Response<object>(result));
            }
        }

        /// <summary>
        /// To Add the details of a CauseTagID
        /// </summary>
        /// <param name="request"></param>
        /// <returns></returns>
        [HttpPost("add_trn_ods_suggestion")]
        [GenericPlantAuthFilterAttribute(claimType = "ccp", idParameter = "causeTagId", skipAdmin = true)]
        [Base64FilterAttribute("suggestion", "description")]
        public async Task<IActionResult> AddTrnOdsSuggestionAsync([FromBody] AddOdsInsightsRequest request)
        {
            var claims = HttpContext.User.Identity as ClaimsIdentity;
            Claim? claimUID = claims!.Claims.FirstOrDefault(claim => claim.Type == "uid");
            int userID = Convert.ToInt32(claimUID!.Value);
            request.createdBy = userID;
            request.udpatedBy = userID;
            var result = await Task.Run(() => _ccpServices.AddTrnOdsSuggestionAsync(request!));
            if (result == null)
            {
                return BadRequest(new Response<Array>(ResponseConstants.CUSTOMERROR, "Invalid causeTagId", ResponseConstants.EMPTYDATA));
            }
            else
            {
                return Ok(new Response<object>(result));
            }
        }
    }
}
