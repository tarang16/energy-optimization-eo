using Asp.Versioning;
using EOApplication.Contracts.Services;
using EODomain.Common;
using EODomain.Models;
using EODomain.Models.RequestModels;
using Microsoft.AspNetCore.Mvc;

namespace EOWebMicroservice.Controllers.v1
{
    /// <summary>
    /// Controller to host APIs related to monitoring health infrastructure
    /// </summary>
    [ApiVersion("1.0")]
    public class HealthInfraController : BaseController
    {
        private readonly IHealthInfraServices _healthInfraServices;
        private readonly IAccountServices _accountServices;

        /// <summary>
        /// Constructor for HealthInfraController
        /// </summary>
        /// <param name="healthInfraServices"></param>
        /// <param name="accountServices"></param>
        public HealthInfraController(IHealthInfraServices healthInfraServices, IAccountServices accountServices)
        {
            _healthInfraServices = healthInfraServices;
            _accountServices = accountServices;
        }

        /// <summary>
        /// This API fetches health status of various infrastructure and stores them to database
        /// </summary>
        /// <returns></returns>
        [HttpPost("log_infra_services_status")]
        public async Task<IActionResult> LogInfraServicesStatusAsync()
        {
            string urlRequested= this.HttpContext.Request.Path.ToString();
            var result = await Task.Run(() => _healthInfraServices.LogInfraServicesStatusAsync(urlRequested));
            return Ok(new Response<object>(result));
        }

        /// <summary>
        /// To get infrastructure connectivity data
        /// </summary>
        /// <param name="request"></param>
        /// <returns></returns>
        [HttpPost("get_infra_monitoring_connectivity")]
        public async Task<IActionResult> GetInfraMonitoringConnectivity([FromBody] GetInfraMonitoringRequest request)
        {
            if (request.stime != null && request.etime != null)
            {
                bool validTimeInputs = CommonMethod.IsValidTimeInput(request.stime.ToString()!, request.etime.ToString()!);
                if (!validTimeInputs)
                {
                    return BadRequest(new Response<Array>(ResponseConstants.CUSTOMERROR, "Start time(sTime) cannot be a later time than end time(eTime)", ResponseConstants.EMPTYDATA));
                }
            }
            var result = await _healthInfraServices.GetInfraMonitoringConnectivityAsync(request);
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
        /// To fetch trend of lag in PI related data
        /// </summary>
        /// <param name="request"></param>
        /// <returns></returns>
        [HttpPost("get_pi_data_infra_monitoring_lag_trend")]
        public async Task<IActionResult> GetPIDataInfraMonitoringLagTrend([FromBody] GetPIDataInfraMonitoringLagTrendRequest request)
        {
            if (request.stime != null && request.etime != null)
            {
                bool validTimeInputs = CommonMethod.IsValidTimeInput(request.stime.ToString()!, request.etime.ToString()!);
                if (!validTimeInputs)
                {
                    return BadRequest(new Response<Array>(ResponseConstants.CUSTOMERROR, "Start time(sTime) cannot be a later time than end time(eTime)", ResponseConstants.EMPTYDATA));
                }
            }

            if (request.caseIDList != null)
            {
                var caseIDs = request.caseIDList.Split(",");
                int countCaseIDs = caseIDs.Length;
                int countValidCaseIDs = await _accountServices.GetCaseIDCountFromCaseIDListAsync(request.caseIDList);

                if (countCaseIDs != countValidCaseIDs)
                {
                    return BadRequest(new Response<Array>(ResponseConstants.CUSTOMERROR, "Invalid caseIDs", ResponseConstants.EMPTYDATA));
                }
            }

            var result = await _healthInfraServices.GetPIDataInfraMonitoringLagTrendAsync(request);
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
        /// To fetch infrastructure health status by caseID
        /// </summary>
        /// <returns></returns>
        [HttpPost("get_infra_monitoring_case_wise")]
        public async Task<IActionResult> GetInfraMonitoringCaseWiseAsync([FromBody] CaseIdListInputRequest request)
        {            

            var result = await _healthInfraServices.GetInfraMonitoringCaseWiseAsync(request);
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
        /// To fetch infrastructure health status by caseID
        /// </summary>
        /// <param name="request"></param>
        /// <returns></returns>
        [HttpPost("get_infra_monitoring_case_wise_trend")]
        public async Task<IActionResult> GetInfraMonitoringCaseWiseTrendAsync([FromBody] GetInfraMonitoringCaseWiseRequest request)
        {
            if (request.caseIDList != null)
            {                
                int countValidCaseIDs = await _accountServices.GetCaseIDCountFromCaseIDListAsync(request.caseIDList.ToString()!);

                if (countValidCaseIDs != 1)
                {
                    return BadRequest(new Response<Array>(ResponseConstants.CUSTOMERROR, "Invalid caseIDs", ResponseConstants.EMPTYDATA));
                }
            }

            var result = await _healthInfraServices.GetInfraMonitoringCaseWiseTrendAsync(request);
            if (result == null)
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
