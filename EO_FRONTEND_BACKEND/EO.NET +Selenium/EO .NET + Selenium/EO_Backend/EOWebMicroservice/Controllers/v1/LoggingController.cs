using Microsoft.AspNetCore.Mvc;
using EOApplication.Contracts.Services;
using EODomain.Common;
using EODomain.Models.LogTables;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Asp.Versioning;

namespace EOWebMicroservice.Controllers.v1
{
    /// <summary>
    /// Controller to host APIs for logging
    /// </summary>
    [ApiVersion("1.0")]
    public class LoggingController : BaseController
    {
        /// <summary>
        /// Interface to configuration
        /// </summary>
        public readonly IConfiguration _configuration;
        private readonly ILoggingServices _loggingServices;

        /// <summary>
        /// Constructor for LoggingController class
        /// </summary>
        /// <param name="configuration"></param>
        /// <param name="loggingServices"></param>
        public LoggingController(IConfiguration configuration, ILoggingServices loggingServices)
        {
            _configuration = configuration;
            _loggingServices = loggingServices;
        }


        /// <summary>
        /// This API is used to log performance of UI components.
        /// </summary>
        /// <param name="performanceLogs"></param>
        /// <returns></returns>
        [HttpPost("add_performance_log")]
        public async Task<IActionResult> AddPerformanceLogs([FromBody] UpsertLogPerformanceLogs performanceLogs)
        {
            var claims = HttpContext.User.Identity as ClaimsIdentity;
            Claim? claimUID = claims!.Claims.FirstOrDefault(claim => claim.Type == "uid");
            string sessionID = claims!.Claims.FirstOrDefault(claim => claim.Type == "jti")!.ToString().Replace("jti: ", "");
            int userID = Convert.ToInt32(claimUID!.Value);
            HttpContext context = HttpContext;
            var result = await _loggingServices.AddPerformanceLogsAsync(performanceLogs, userID, sessionID, context);
            return Ok(new Response<object>(result));
        }

        /// <summary>
        /// This API is used to log Activity tracking  of UI components.
        /// </summary>
        /// <param name="activityTrackerRequest"></param>
        /// <returns></returns>
        [HttpPost("add_activity_tracker")]
        public async Task<IActionResult> AddUserActivityTracker([FromBody] ActivityTrackerRequest activityTrackerRequest)
        {

            var claims = HttpContext.User.Identity as ClaimsIdentity;
            Claim? claimUID = claims!.Claims.FirstOrDefault(claim => claim.Type == "uid");
            string sessionID = claims!.Claims.FirstOrDefault(claim => claim.Type == "jti")!.ToString().Replace("jti: ", "");
            int userID = Convert.ToInt32(claimUID!.Value);

            var result = await _loggingServices.AddUserActivityTrackerAsync(activityTrackerRequest, userID, sessionID);
            return Ok(new Response<object>(result));

        }

        /// <summary>
        /// This API is used to log Error of UI components.
        /// </summary>
        /// <param name="errorLogs"></param>
        /// <returns></returns>
        [HttpPost("add_error_log")]
        public async Task<IActionResult> AddErrorLogs([FromBody] LogErrorLogs errorLogs)
        {
            var claims = HttpContext.User.Identity as ClaimsIdentity;
            Claim? claimUID = claims!.Claims.FirstOrDefault(claim => claim.Type == "uid");
            string sessionID = claims!.Claims.FirstOrDefault(claim => claim.Type == "jti")!.ToString().Replace("jti: ", "");
            int userID = Convert.ToInt32(claimUID!.Value);
            errorLogs.CreatedBy = userID;
            errorLogs.UpdatedBy = userID;
            errorLogs.EmployeeId = userID;
            errorLogs.API = HttpContext! == null ? null! : $"{HttpContext.Request.Path}";
            errorLogs.SessionId = sessionID;


            var result = await _loggingServices.AddErrorLogAsync(errorLogs);
            return Ok(new Response<object>(result));

        }



        /// <summary>
        /// This API is used to get the AuditLogs.
        /// </summary>
        /// <param name="request"></param>
        /// <returns></returns>
        [HttpPost("get_audit_log")]
        public async Task<IActionResult> GetAuditLog([FromBody] GetAuditLogRequest request)
        {
            var result = await _loggingServices.GetAuditLogAsync(request);
            return Ok(new Response<object>(result));

        }


        /// <summary>
        /// To fetch valid audit activity types
        /// </summary>
        /// <returns></returns>
        [HttpGet("get_all_audit_activity_type")]
        public async Task<IActionResult> GetValidAuditLogTypes()
        {
            var result = await _loggingServices.GetValidAuditLogTypesAsync();
            return Ok(new Response<object>(result));
        }


        /// <summary>
        /// To add audit log
        /// </summary>
        /// <param name="request"></param>
        /// <returns></returns>
        [HttpPost("add_audit_log")]
        public async Task<IActionResult> PostAuditLog([FromBody] AddAuditLogRequest request)
        {
            var createdBy = CommonMethod.GetEmployeeIdFromClaim(HttpContext);
            var result = await _loggingServices.PostAuditLogAsync(request, createdBy);
            return Ok(new Response<object>(result));
        }

        /// <summary>
        /// To get default value based on GetDefaultValueRequest model
        /// </summary>
        /// <param name="request"></param>
        /// <returns></returns>
        [HttpPost("get_default_value")]
        public async Task<IActionResult> GetDefaultValue([FromBody] GetDefaultValueRequest request)
        {
            var result = await _loggingServices.GetDefaultValueAsync(request);
            return Ok(new Response<object>(result));
        }
    }
}
