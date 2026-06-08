using Asp.Versioning;
using EODomain.Common;
using Microsoft.AspNetCore.Mvc;
using EODomain.Models.Account.Workflow;
using EOApplication.Contracts.Services;

namespace EOWebMicroservice.Controllers.v1
{
    /// <summary>
    /// 
    /// </summary>
    [ApiVersion("1.0")]
    public class PeOdsWorkflowController : BaseController
    {
        private readonly IPeOdsWorkflowServices _odsServices;
        private readonly IWebHostEnvironment _env;

        /// <summary>
        /// Constructor for OdsController
        /// </summary>
        /// <param name="odsServices"></param>
        /// <param name="env"></param>
        public PeOdsWorkflowController(IPeOdsWorkflowServices odsServices, IWebHostEnvironment env)
        {
            _odsServices = odsServices;
            _env = env;
        }


        /// <summary>
        /// 
        /// </summary>
        /// <returns></returns>
        [HttpPost("get_activity_logs_by_request_id")]
        public async Task<IActionResult> GetPeOdsWorkflowActionLogsByRequestId([FromBody] RequestIdEoRequest request)
        {

            try

            {
                var result = await _odsServices.GetPeOdsWorkflowActionLogsByRequestId(request, _env.ContentRootPath+"\\Utility");               
                if (result.statuscode == StatusCodes.Status421MisdirectedRequest)
                {
                    return Ok(new Response<Array>(ResponseConstants.RM_API_ERROR, result.errormsg!, ResponseConstants.EMPTYDATA));
                }
                if (result.data == null)
                {
                    return BadRequest(new Response<Array>(ResponseConstants.CUSTOMERROR, "NA", ResponseConstants.EMPTYDATA));
                }
                else
                {
                    return Ok(new Response<object>(result.data));
                }
            }

            catch (Exception ex)

            {

                return StatusCode(500, new { Message = "An error occurred", Details = ex.Message });

            }

        }

        /// <summary>
        /// 
        /// </summary>
        /// <param name="request"></param>
        /// <returns></returns>
        [HttpPost("get_details_by_request_id")]
        public async Task<IActionResult> GetOdsDataByRequestId([FromBody] RequestIdEoRequest request)
        {
            try
            {
                var result = await _odsServices.GetOdsDataByRequestId(request, _env.ContentRootPath + "\\Utility");
                if (result?.data == null || result.data.metaData == null && result.data.details == null)
                {
                    return Ok(new Response<Array>(ResponseConstants.EMPTYOK, ResponseConstants.EMPTYOK_MESSAGE, ResponseConstants.EMPTYDATA));
                }
                else
                {
                    return Ok(new Response<object>(result.data));
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Message = "An error occurred", Details = ex.Message });
            }
        }

        /// <summary>
        /// 
        /// </summary>
        /// <param name="request"></param>
        /// <returns></returns>
        [HttpPost("get_activity_suggestions_log_by_request_id")]
        public async Task<IActionResult> GetOdsActionSuggestionsByRequestId([FromBody] RequestIdEoRequest request)
        {
            try
            {
                var result = await _odsServices.GetOdsActionSuggestionsByRequestId(request, _env.ContentRootPath + "\\Utility");
                if (result.data == null || result.data.Count == 0)
                {
                    return Ok(new Response<Array>(ResponseConstants.EMPTYOK, ResponseConstants.EMPTYOK_MESSAGE, ResponseConstants.EMPTYDATA));
                }
                else
                {
                    return Ok(new Response<object>(result.data));
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Message = "An error occurred", Details = ex.Message });
            }
        }

        /// <summary>
        /// To get historical data associated with an alert
        /// </summary>
        /// <param name="request"></param>
        /// <returns></returns>
        [HttpPost("get_wf_alert_historical_data_all_user")]
        public async Task<IActionResult> GetWorkflowHistoricalDataForAllUsers([FromBody] WorkflowCauseIDRequest request)
        {
            try
            {
                var result = await _odsServices.GetWorkflowHistoricalDataForAllUsersAsync(request, _env.ContentRootPath + "\\Utility");
                if (result.data == null || result.data.Count == 0)
                {
                    return Ok(new Response<Array>(ResponseConstants.EMPTYOK, ResponseConstants.EMPTYOK_MESSAGE, ResponseConstants.EMPTYDATA));
                }
                else
                {
                    return Ok(new Response<object>(result.data));
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    Message = "An error occurred",
                    Details = ex.Message
                });
            }
        }

    }
}
