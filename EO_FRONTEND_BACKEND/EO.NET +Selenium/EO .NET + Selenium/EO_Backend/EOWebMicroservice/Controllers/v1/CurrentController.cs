using Asp.Versioning;
using EOApplication.Contracts.Services;
using EODomain.Common;
using EODomain.Models.Current;
using EODomain.Models.Network;
using EODomain.Models.Requests;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EOWebMicroservice.Controllers.v1
{
    /// <summary>
    /// 
    /// </summary>
    [ApiVersion("1.0")]
    public class CurrentController : BaseController
    {
        private readonly ICurrentServices _currentServices;

        /// <summary>
        /// 
        /// </summary>
        /// <param name="currentServices"></param>
        public CurrentController(ICurrentServices currentServices)
        {
            _currentServices = currentServices;
        }

        /// <summary>
        /// To fetch the data to be shown in insights section of the dashboard for a given  caseID and time 
        /// </summary>
        /// <param name="request"></param>
        /// <returns></returns>
        [HttpPost("get_kpi_output")]
        public async Task<IActionResult> GetKpiOutput([FromBody] CaseIdDateTimeRequest request, [FromQuery] string source = "db")
        {
            int caseID = request.caseID;
            DateTime time = request.time;
            var kpioutputobjResult = await _currentServices.GetKpiOutputAsync(caseID, time, source);
            if (kpioutputobjResult == null)
            {

                return Ok(new Response<Array>(ResponseConstants.EMPTYOK, ResponseConstants.EMPTYOK_MESSAGE, ResponseConstants.EMPTYDATA));
            }
            else
            {
                return Ok(new Response<object>(kpioutputobjResult));
            }
        }

        /// <summary>
        /// 
        /// </summary>
        /// <param name="request"></param>
        /// <returns></returns>
        [HttpPost("get_time_actual")]
        public async Task<IActionResult> GetTimeActualDataAsync([FromBody] CaseIdInputRequest request)
        {
            int? caseID = request.caseID;
            var timeActualResult = await _currentServices.GetTimeActualDataAsync(caseID);
            if (timeActualResult == null)
            {

                return Ok(new Response<Array>(ResponseConstants.EMPTYOK, ResponseConstants.EMPTYOK_MESSAGE, ResponseConstants.EMPTYDATA));
            }
            else
            {
                return Ok(new Response<object>(timeActualResult));
            }
        }

        /// <summary>
        /// 
        /// </summary>
        /// <param name="request"></param>
        /// <returns></returns>
        [HttpPost("get_system_top_tile_data")]
        public async Task<IActionResult> GetSystemTopTileDataAsync([FromBody] CaseIdDateTimeRequest request, [FromQuery] string source = "db")
        {
            int caseID = request.caseID;
            DateTime time = request.time;
            var kpioutputobjResult = await _currentServices.GetSystemTopTileDataAsync(caseID, time, source);
            if (kpioutputobjResult == null)
            {

                return Ok(new Response<Array>(ResponseConstants.EMPTYOK, ResponseConstants.EMPTYOK_MESSAGE, ResponseConstants.EMPTYDATA));
            }
            else
            {
                return Ok(new Response<object>(kpioutputobjResult));
            }
        }

        /// <summary>
        /// 
        /// </summary>
        /// <param name="request"></param>
        /// <returns></returns>
        [HttpPost("get_monitoring_data")]
        public async Task<IActionResult> GetMonitoringData([FromBody] CaseIdDateTimeApiMonitoringRequest request, [FromQuery] string source = "db")
        {

            var kpioutputobjResult = await _currentServices.GetMonitoringDataAsync(request, source);
            if (kpioutputobjResult.GetMonitoringDataStoredProcedureResponse == null || kpioutputobjResult.GetMonitoringDataStoredProcedureResponse.Count == 0)
            {

                return Ok(new Response<Array>(ResponseConstants.EMPTYOK, ResponseConstants.EMPTYOK_MESSAGE, ResponseConstants.EMPTYDATA));
            }
            else
            {


                var responseData = kpioutputobjResult.GetMonitoringDataStoredProcedureResponse;
                int? pageCount = kpioutputobjResult.pageCount;

                return Ok(new PaginatedResponse<object>(responseData!, request.pageNumber, request.pageSize, pageCount));

            }
        }

        /// <summary>
        /// 
        /// </summary>
        /// <param name="request"></param>
        /// <returns></returns>
        [HttpPost("get_tree_diagram_by_case_id")]
        public async Task<IActionResult> GetTreeDiagramByCaseID([FromBody] GetTreeDiagramByCaseIDRequest request, [FromQuery] string source = "db")
        {
            var treenDiagraResult = await _currentServices.GetTreeDiagramByCaseIDAsync(request, source);
            if (treenDiagraResult == null)
            {

                return Ok(new Response<Array>(ResponseConstants.EMPTYOK, ResponseConstants.EMPTYOK_MESSAGE, ResponseConstants.EMPTYDATA));
            }
            else
            {
                return Ok(new Response<object>(treenDiagraResult));
            }
        }

        /// <summary>
        /// 
        /// </summary>
        /// <param name="request"></param>
        /// <returns></returns>
        [HttpPost("get_overview_trend")]
        public async Task<IActionResult> GetOverviewTrendDataAsync([FromBody] CaseIdInputRequest request, [FromQuery] string source = "db")
        {
            int? caseID = request.caseID;
            var treenDiagraResult = await _currentServices.GetOverviewTrendDataAsync(caseID, source);
            if (treenDiagraResult == null)
            {

                return Ok(new Response<Array>(ResponseConstants.EMPTYOK, ResponseConstants.EMPTYOK_MESSAGE, ResponseConstants.EMPTYDATA));
            }
            else
            {
                return Ok(new Response<object>(treenDiagraResult));
            }
        }

        /// <summary>
        /// To get seu output data
        /// </summary>
        [HttpPost("get_seu_output_data")]
        public async Task<IActionResult> GetSeuOutputDataAsync([FromBody] CaseIdDateTimeRequest request, [FromQuery] string source = "db")
        {
            int caseID = request.caseID;
            DateTime time = request.time;
            var seoOutputResult = await _currentServices.GetSeuOutputDataAsync(caseID, time, source);
            if (seoOutputResult == null)
            {

                return Ok(new Response<Array>(ResponseConstants.EMPTYOK, ResponseConstants.EMPTYOK_MESSAGE, ResponseConstants.EMPTYDATA));
            }
            else
            {
                return Ok(new Response<object>(seoOutputResult));
            }
        }

        /// <summary>
        /// 
        /// </summary>
        /// <param name="request"></param>
        /// <returns></returns>
        [HttpPost("get_seec_trend")]
        public async Task<IActionResult> GetSeecTrendDataAsync([FromBody] CaseIdTimeRangeGroupByRequest request, [FromQuery] string source = "db")
        {
            var seecTrendResult = await _currentServices.GetSeecTrendDataAsync(request, source);
            if (seecTrendResult == null)
            {

                return Ok(new Response<Array>(ResponseConstants.EMPTYOK, ResponseConstants.EMPTYOK_MESSAGE, ResponseConstants.EMPTYDATA));
            }
            else
            {
                return Ok(new Response<object>(seecTrendResult));
            }
        }

        /// <summary>
        /// To fetch enegry distribution
        /// </summary>
        /// <param name="request"></param>
        /// <returns></returns>
        [HttpPost("get_enegry_distribution")]
        public async Task<IActionResult> GetEnegryDistributionAsync([FromBody] CaseIdDateTimeRequest request, [FromQuery] string source = "db")
        {
            var energyDistributionResult = await _currentServices.GetEnegryDistributionAsync(request, source);
            if (energyDistributionResult == null)
            {
                return Ok(new Response<Array>(ResponseConstants.EMPTYOK, ResponseConstants.EMPTYOK_MESSAGE, ResponseConstants.EMPTYDATA));
            }
            else
            {
                return Ok(new Response<object>(energyDistributionResult));
            }
        }

        /// <summary>
        /// To fetch kevs output details
        /// </summary>
        /// <param name="request"></param>
        /// <returns></returns>
        [HttpPost("get_kevs_output")]
        public async Task<IActionResult> GetKevsOutputAsync([FromBody] CaseIdDateTimeRequest request, [FromQuery] string source = "db")
        {
            var energyDistributionResult = await _currentServices.GetKevsOutputAsync(request, source);
            if (energyDistributionResult == null)
            {
                return Ok(new Response<Array>(ResponseConstants.EMPTYOK, ResponseConstants.EMPTYOK_MESSAGE, ResponseConstants.EMPTYDATA));
            }
            else
            {
                return Ok(new Response<object>(energyDistributionResult));
            }
        }

        /// <summary>
        /// 
        /// </summary>
        /// <param name="request"></param>
        /// <returns></returns>
        [HttpPost("get_monitoring_categories")]
        public async Task<IActionResult> GetMonitoringCategories([FromBody] GetMonitoringCategoriesRequest request)
        {
       
            var categoryoutputobjResult = await _currentServices.GetMonitoringCategories(request);
            if (categoryoutputobjResult == null)
            {

                return Ok(new Response<Array>(ResponseConstants.EMPTYOK, ResponseConstants.EMPTYOK_MESSAGE, ResponseConstants.EMPTYDATA));
            }
            else
            {
                return Ok(new Response<object>(categoryoutputobjResult));
            }
        }

    }
}
