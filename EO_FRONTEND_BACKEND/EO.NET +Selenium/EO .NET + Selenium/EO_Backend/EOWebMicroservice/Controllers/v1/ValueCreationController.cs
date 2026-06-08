using Asp.Versioning;
using EOApplication.Contracts.Services;
using EODomain.Common;
using EODomain.Models.ValueCreation;
using EOInfrastructure.Services;
using EOWebMicroservice.Filter;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using System.Security.Claims;

namespace EOWebMicroservice.Controllers.v1
{
    /// <summary>
    /// Controller to host APIs for value creation
    /// </summary>
    [ApiVersion("1.0")]
    public class ValueCreationController : BaseController
    {
        /// <summary>
        /// Interface to configuration
        /// </summary>
        public readonly IConfiguration _configuration;

        /// <summary>
        /// Interface to value creation services
        /// </summary>
        public readonly IValueCreationServices _valueCreationServices;

        /// <summary>
        /// Interface to account services
        /// </summary>
        public readonly IAccountServices _accountServices;

        /// <summary>
        /// Interface to winauth services
        /// </summary>
        public readonly IWinAuthServices _winAuthServices;

        /// <summary>
        /// Interface to config services
        /// </summary>
        public readonly IConfigServices _configServices;

        /// <summary>
        /// Constructor for ValueCreationController class
        /// </summary>
        /// <param name="configuration"></param>
        /// <param name="valueCreationServices"></param>
        /// <param name="accountServices"></param>
        /// <param name="winAuthServices"></param>
        /// <param name="configServices"></param>
        public ValueCreationController(
                                IConfiguration configuration,
                                IValueCreationServices valueCreationServices,
                                IAccountServices accountServices,
                                IWinAuthServices winAuthServices,
                                IConfigServices configServices)
        {
            _configuration = configuration;
            _valueCreationServices = valueCreationServices;
            _accountServices = accountServices;
            _winAuthServices = winAuthServices;
            _configServices = configServices;
        }

        /// <summary>
        /// To fetch all the active spans from value creation table
        /// </summary>
        /// <param name="request"></param>
        /// <returns></returns>
        [HttpPost("get_all_vc_action_by_case_id")]
        [CaseIdAuthfilterAttribute]
        public async Task<IActionResult> GetAllVCActionByCaseIDAsync(GetAllValueCreationByCaseIDRequest request)
        {
            var result = await _valueCreationServices.GetAllMasterValueCreationCaseIDAsync(request);
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
        /// To add a MasterVC to database
        /// </summary>
        /// <param name="request"></param>
        /// <returns></returns>
        [HttpPost("add_master_vc_action")]
        [CaseIdAuthfilter]
        [Base64Filter("actionDescription", "actionTitle")]
        public async Task<IActionResult> PostAddMasterVCActionAsync([FromBody] PostAddValueCreationDataRequest request)
        {
            int caseID = request.caseID;
            var claims = HttpContext.User.Identity as ClaimsIdentity;
            Claim? claimUID = claims!.Claims.FirstOrDefault(claim => claim.Type == "uid");
            int userID = Convert.ToInt32(claimUID!.Value);

            int caseCount = _accountServices.GetCaseIDCountFromCaseIDListAsync(caseID.ToString()).Result;
            if (caseCount != 1)
            {
                return BadRequest(new Response<Array>(ResponseConstants.CUSTOMERROR, "Invalid caseID", ResponseConstants.EMPTYDATA));
            }
            var result = await _valueCreationServices.PostAddMasterValueCreationDataAsync(request, userID);
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
        /// To fetch all active spans for the input caseID
        /// </summary>
        /// <param name="request"></param>
        /// <returns></returns>
        [HttpPost("get_vc_span_by_case_id")]
        [CaseIdAuthfilterAttribute]
        public async Task<IActionResult> GetVCSpanByCaseIdAsync([FromBody] ValueCreationCalcTimeSeriesRequest request, [FromQuery] string source = "db")
        {
            int caseID = request.caseID;
            int caseCount = _accountServices.GetCaseIDCountFromCaseIDListAsync(caseID.ToString()).Result;
            if (caseCount != 1)
            {
                return BadRequest(new Response<Array>(ResponseConstants.CUSTOMERROR, "Invalid caseID", ResponseConstants.EMPTYDATA));
            }
            var result = await _valueCreationServices.GetValueCreationSpanDataByCaseIdAsync(request, source);
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
        /// To add a value creation span to database
        /// </summary>
        /// <param name="request"></param>
        /// <returns></returns>
        [HttpPost("add_vc_span")]
        //[GenericPlantAuthFilter(claimType = "vc", idParameter = "caseID")]
        [Base64Filter("remarks", "changes")]
        public async Task<IActionResult> PostAddVCSpanAsync([FromBody] PostAddValueCreationSpanDataRequest request)
        {
            int caseID = request.caseID;
            var claims = HttpContext.User.Identity as ClaimsIdentity;
            Claim? claimUID = claims!.Claims.FirstOrDefault(claim => claim.Type == "uid");
            int userID = Convert.ToInt32(claimUID!.Value);

            int caseCount = _accountServices.GetCaseIDCountFromCaseIDListAsync(caseID.ToString()).Result;
            if (caseCount != 1)
            {
                return BadRequest(new Response<Array>(ResponseConstants.CUSTOMERROR, "Invalid caseID", ResponseConstants.EMPTYDATA));
            }

            var result = await _valueCreationServices.PostAddValueCreationSpanDataAsync(request, userID);

            if (!int.TryParse(result, out caseCount))
            {
                return BadRequest(new Response<Array>(ResponseConstants.CUSTOMERROR, result!.ToString(), ResponseConstants.EMPTYDATA));
            }
            else
            {
                return Ok(new Response<object>(result));
            }
        }



        /// <summary>
        /// To delete a span using span table id
        /// </summary>
        /// <param name="request"></param>
        /// <returns></returns>
        [HttpPost("delete_vc_span_by_id")]
        //[GenericPlantAuthFilter(claimType = "vc", idParameter = "ID")]
        public async Task<IActionResult> PostDeleteVCSpanByIdAsync([FromBody] DeleteRequestUsingGuid request)
        {
            var claims = HttpContext.User.Identity as ClaimsIdentity;
            Claim? claimUID = claims!.Claims.FirstOrDefault(claim => claim.Type == "uid");
            request.userID = Convert.ToInt32(claimUID!.Value);

            var result = await _valueCreationServices.PostDeleteValueCreationSpanDataByIdAsync(request);
            if (!result)
            {
                return Ok(new Response<Array>(ResponseConstants.EMPTYOK, ResponseConstants.EMPTYOK_MESSAGE, ResponseConstants.EMPTYDATA));
            }
            else
            {
                return Ok(new Response<object>(result));
            }
        }


        /// <summary>
        /// To fetch all active spans for the input caseID
        /// </summary>
        /// <param name="request"></param>
        /// <returns></returns>
        [HttpPost("get_value_mst_vc_case_info_by_case_id")]
        [CaseIdAuthfilterAttribute]
        public async Task<IActionResult> GetAllMasterVCCaseInfoAsync(GetAllValueCreationByCaseIDRequest request)
        {
            int caseID = request.caseID;

            int caseCount = _accountServices.GetCaseIDCountFromCaseIDListAsync(caseID.ToString()).Result;
            if (caseCount != 1)
            {
                return BadRequest(new Response<Array>(ResponseConstants.CUSTOMERROR, "Invalid caseID", ResponseConstants.EMPTYDATA));
            }

            var result = await _valueCreationServices.GetAllMasterValueCreationCaseInfoAsync(request);
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
        /// for  calculation using spanID or caseID
        /// </summary>
        /// <param name="request"></param>
        /// <returns></returns>
        [HttpPost("get_vc_calc_timeseries")]
        [CaseIdAuthfilterAttribute]
        public async Task<IActionResult> GetVCSpanCalcAsync([FromBody] ValueCreationCalcTimeSeriesRequest request, [FromQuery] string source = "db")
        {
            int? caseID = request.caseID;
            if (caseID != null)
            {
                // case id valid check
                int caseCount = _accountServices.GetCaseIDCountFromCaseIDListAsync(caseID.ToString()!).Result;
                if (caseCount != 1)
                {
                    return BadRequest(new Response<Array>(ResponseConstants.CUSTOMERROR, "Invalid caseID", ResponseConstants.EMPTYDATA));
                }
            }
            // case ID access check
            var result = await _valueCreationServices.GetValueCreationSpanCalcAsync(request, source);
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
        /// To fetch all active logVC for the input SpanID
        /// </summary>
        /// <param name="request"></param>
        /// <returns>LogValueCreationStoredProcedureResponse</returns>
        [HttpPost("get_vc_by_case_id_list")]
        [IntIDValidationFilter(caseParameter = "caseIDList")]
        [CaseIdAuthfilter]
        public async Task<IActionResult> GetVCByCaseIDListAsync(GetVCByCaseIDListRequest request, [FromQuery] string source = "db")
        {
            var result = await _valueCreationServices.GetVCByCaseIDListAsync(request, source);
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
        /// To fetch all tag details of a particular Case ID 
        /// </summary>
        /// <param name="request"></param>
        /// <returns></returns>
        [HttpPost("get_vc_span_alerts")]
        [IntIDValidationFilter(caseParameter = "caseIDList")]
        [CaseIdAuthfilter]
        public async Task<IActionResult> GetVCspanAlertAsync(GetVCSpanAlertRequest request)
        {
            var result = await _valueCreationServices.GetVCspanAlertAsync(request);
            if (result.Count == 0)
            {
                return Ok(new Response<Array>(ResponseConstants.EMPTYOK, ResponseConstants.EMPTYOK_MESSAGE, ResponseConstants.EMPTYDATA));
            }
            else
            {
                return Ok(new Response<object>(result));
            }
        }
    }
}
