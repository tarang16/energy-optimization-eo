using Asp.Versioning;
using EOApplication.Contracts.Services;
using EODomain.Common;
using EODomain.Models.Network;
using EODomain.Models.Optimization;
using EODomain.Models.Requests;
using EOInfrastructure.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using System.Net;

namespace EOWebMicroservice.Controllers.v1
{
    /// <summary>
    /// 
    /// </summary>
    [ApiVersion("1.0")]
    public class OptimizationController : BaseController
    {
        private readonly IOptimizationServices _optimizationServices;
        private readonly IConfiguration _configuration;
        
        /// <summary>
        /// 
        /// </summary>
        /// <param name="optimizationServices"></param>
        /// <param name="configuration"></param>
        public OptimizationController(IOptimizationServices optimizationServices,IConfiguration configuration)
        {
            _optimizationServices = optimizationServices;
            _configuration = configuration;
        }


        /// <summary>
        /// 
        /// </summary>
        /// <param name="request"></param>
        /// <returns></returns>
        [HttpPost("get_demand")]
        public async Task<IActionResult> GetDemandInputs([FromBody] CaseIdDateTimeRequest request, [FromQuery] string source = "db")
        {
            var result = await _optimizationServices.GetDemandInputsAsync(request, source);
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
        /// 
        /// </summary>
        /// <param name="request"></param>
        /// <returns></returns>
        [HttpPost("get_equipment_availability")]
        public async Task<IActionResult> GetAssetAvailability([FromBody] CaseIdDateTimeRequest request, [FromQuery] string source = "db")
        {
            var result = await _optimizationServices.GetAssetAvailabilityAsync(request, source);
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
        /// 
        /// </summary>
        /// <param name="request"></param>
        /// <returns></returns>
        [HttpPost("get_plant_load")]
        public async Task<IActionResult> GetPlantLoad([FromBody] CaseIdDateTimeRequest request, [FromQuery] string source = "db")
        {
            var result = await _optimizationServices.GetPlantLoadAsync(request, source);
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
        /// 
        /// </summary>
        /// <param name="request"></param>
        /// <returns></returns>
        [HttpPost("get_optimizer_output")]
        public async Task<IActionResult> GetOutputMapping([FromBody] CaseIdDateTimeRequest request, [FromQuery] string source = "db")
        {
            var result = await _optimizationServices.GetOutputMappingAsync(request, source);
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
        /// 
        /// </summary>
        /// <param name="request"></param>
        /// <returns></returns>
        [HttpPost("get_optimization_price")]
        public async Task<IActionResult> GetOptimizationPriceInput([FromBody] CaseIdInputRequest request)
        {
            var result = await _optimizationServices.GetOptimizationPriceInputAsync(request);
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
        ///To get what if plant parameters
        /// </summary>
        [HttpPost("get_what_if_plant_parameters")]
        public async Task<IActionResult> GetWhatIfPlantParameters(GetWhatIfPlantParametersRequest request, [FromQuery] string source = "db")
        {
            var result = await _optimizationServices.GetWhatIfPlantParametersAsync(request, source);
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
        /// To get what if demand calculation
        /// </summary>

        [HttpPost("get_what_if_demand_calculation")]
        public async Task<IActionResult> WhatIfDemandCalculation(WhatIfDemandCalculationRequest request)
        {
            var currentUserId = CommonMethod.GetEmployeeIdFromClaim(HttpContext);
            request.userID = Convert.ToInt32(currentUserId);
            if (request.scenarioName.IsNullOrEmpty())
            {
                request.scenarioName = Constants.DefaultScenario;
            }
            string rmWhatIfDemandURL = _configuration.GetSection("RMWhatIfDemandSetting").GetSection("RMWhatIfDemandURL").Value!;
            var result = await _optimizationServices.WhatIfDemandCalculationAsync(request);
            if (result != null)
            {
                return Ok(new Response<object>(result));
            }
            else
            {
                
                return Ok(new Response<Array>(ResponseConstants.RM_API_ERROR, rmWhatIfDemandURL + ":" + ResponseConstants.RMAPI_ERRORMESSAGE, ResponseConstants.EMPTYDATA));
            }
        }
        /// <summary>
        /// To get what if Output
        /// </summary>
        [HttpPost("get_what_if_output")]
        public async Task<IActionResult> WhatIfOutput(WhatIfOutputRequest request)
        {
            var currentUserId = CommonMethod.GetEmployeeIdFromClaim(HttpContext);
            request.userID = Convert.ToInt32(currentUserId);
            if (request.scenarioName.IsNullOrEmpty())
            {
                request.scenarioName = Constants.DefaultScenario;
            }
            var result = await _optimizationServices.WhatIfOutputAsync(request);
            if (result.modelStatus == 1 || result.modelStatus == 0)  // success and expception response
            {
                return Ok(new Response<object>(result));
            }
            else if (result.modelStatus == -1)  // 421 response
            {
                return Ok(new Response<Array>(ResponseConstants.RM_API_ERROR, result.url + ":" + ResponseConstants.RMAPI_ERRORMESSAGE, ResponseConstants.EMPTYDATA));
            }
            else  // any other response
            {
                return Ok(new Response<Array>(result.modelStatus, result.modelMessage, ResponseConstants.EMPTYDATA));
            }
        }
    }
}
