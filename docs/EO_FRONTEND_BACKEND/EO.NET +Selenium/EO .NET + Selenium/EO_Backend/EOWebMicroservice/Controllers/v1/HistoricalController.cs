using Asp.Versioning;
using EOApplication.Contracts.Services;
using EODomain.Common;
using EODomain.Models.HistoricalData;
using EODomain.Models.Network;
using EODomain.Models.Requests;
using EOInfrastructure.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using System.Drawing.Printing;

namespace EOWebMicroservice.Controllers.v1
{
    /// <summary>
    /// 
    /// </summary>
    /// 
    [ApiVersion("1.0")]
    public class HistoricalController : BaseController
    {
        private readonly IHistoricalServices _historicalServices;

        /// <summary>
        /// 
        /// </summary>
        /// <param name="historicalServices"></param>
        public HistoricalController(IHistoricalServices historicalServices)
        {
            _historicalServices = historicalServices;
        }

        /// <summary>
        /// 
        /// </summary>
        /// <param name="request"></param>
        /// <returns></returns>
        [HttpPost("get_calenderdata")]
        public async Task<IActionResult> GetCalenderData([FromBody] CaseIdInputRequest request)
        {
            int? caseID = request.caseID;
            
            var calenderdataresult = await _historicalServices.GetCalenderDataAsync(caseID);
            if (calenderdataresult == null)
            {
                return Ok(new Response<Array>(ResponseConstants.EMPTYOK, ResponseConstants.EMPTYOK_MESSAGE, ResponseConstants.EMPTYDATA));
            }
            else
            {
                return Ok(new Response<object>(calenderdataresult));
            }
        }

        /// <summary>
        /// 
        /// </summary>
        /// <param name="request"></param>
        /// <returns></returns>
        [HttpPost("get_trenddata_actual_optimum")]
        public async Task<IActionResult> GetTrendDataActualOptimum([FromBody] GetTrendDataActualOptimumRequest request, [FromQuery] string source = "db")
        {
            var actualoptimumtrendresult = await _historicalServices.GetActualOptimumTrendDataAsync(request, source);
            if (actualoptimumtrendresult == null || actualoptimumtrendresult.Count == 0)
            {
                return Ok(new Response<Array>(ResponseConstants.EMPTYOK, ResponseConstants.EMPTYOK_MESSAGE, ResponseConstants.EMPTYDATA));
            }
            else
            {
                return Ok(new Response<object>(actualoptimumtrendresult));
            }
        }

        /// <summary>
        /// 
        /// </summary>
        /// <param name="request"></param>
        /// <returns></returns>
        [HttpPost("get_opportunity_trend_by_case_id_list")]
        public async Task<IActionResult> GetOpportunityTrendDataAsync([FromBody] CaseIdListTimeRangeStringRequest request)
        {
            var result = await _historicalServices.GetOpportunityTrendDataAsync(request);
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
        [HttpPost("get_date_model_skip_monitoring")]
        public async Task<IActionResult> GetDataModelSkipMonitoringCalendarData([FromBody] CaseIdTimeRangeRequest request)
        {
            var result = await _historicalServices.GetDataModelSkipMonitoringCalendarDataAsync(request);
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
        [HttpPost("get_data_model_skip")]
        public async Task<IActionResult> GetDataModelSkipMonitoringData(CaseIdTimeRangeDayDiffRequest request, [FromQuery] string source = "db")
        {
            var result = await _historicalServices.GetDataModelSkipDataAsync(request, source);
            if (result == null)
            {
                return Ok(new Response<Array>(ResponseConstants.EMPTYOK, ResponseConstants.EMPTYOK_MESSAGE, ResponseConstants.EMPTYDATA));
            }
            else
            {
                return Ok(new PaginatedResponse<object>(result.data!, request.pageNumber, request.pageSize, result.pageCount));
            }
        }
    }
}
