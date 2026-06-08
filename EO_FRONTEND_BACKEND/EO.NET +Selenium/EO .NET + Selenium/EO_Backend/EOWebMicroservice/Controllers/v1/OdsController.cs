using Asp.Versioning;
using EOApplication.Contracts.Services;
using EODomain.Common;
using EODomain.Models.Config;
using EODomain.Models.Ods;
using EOWebMicroservice.Filter;
using Microsoft.AspNetCore.Mvc;

using Microsoft.Extensions.Options;

namespace EOWebMicroservice.Controllers.v1
{
    /// <summary>
    /// 
    /// </summary>
    [ApiVersion("1.0")]
    public class OdsController : BaseController
    {
        private readonly IOdsServices _odsServices;
        private readonly IAccountServices _accountServices;
        private readonly ConfigSettings _configSettings;
       
        /// <summary>
        /// Constructor for OdsController
        /// </summary>
        /// <param name="odsServices"></param>
        /// <param name="accountServices"></param>
        /// <param name="configSettings"></param>
        
        public OdsController(IOdsServices odsServices, IAccountServices accountServices, IOptions<ConfigSettings> configSettings)
        {
            _odsServices = odsServices;
          
            _accountServices = accountServices;
            _configSettings = configSettings.Value;
            
        }


        /// <summary>
        /// 
        /// </summary>
        /// <param name="request"></param>
        /// <returns></returns>
        [HttpPost("get_ods_overview_by_case_id_time")]
        public async Task<IActionResult> GetDemandInputs([FromBody] OdsCaseIdDateTimeRequest request, [FromQuery] string source = "db")
        {
            var result = await _odsServices.GetOdsOveriewByCaseIdTimeAsync(request, source);

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
        /// To fetch ods data given a list of caseIDs and time range
        /// </summary>
        /// <param name="request"></param>
        /// <returns></returns>
        [HttpPost("get_ods_data_by_case_id_list_time_range")]
        [IntIDValidationFilterAttribute(caseParameter = "caseIDList")]
        public async Task<IActionResult> GetOdsDataByCaseIDListTimeRange([FromBody] OdsCaseIdListTimeRangeStringRequest request)
        {

            string caseIDList = request.caseIDList!;
            string sTime = request.sTime!;
            string eTime = request.eTime!;
            bool validTimeInputs = CommonMethod.IsValidTimeInput(sTime!, eTime!);
            if (!validTimeInputs)
            {
                return BadRequest(new Response<Array>(ResponseConstants.CUSTOMERROR, "Start time(sTime) cannot be a later time than end time(eTime)", ResponseConstants.EMPTYDATA));
            }

            var caseIDs = caseIDList!.Split(",");

            int countCaseIDs = caseIDs.Length;
            int countValidCaseIDs = _accountServices.GetCaseIDCountFromCaseIDListAsync(caseIDList!).Result;

            if (countCaseIDs != countValidCaseIDs)
            {
                return BadRequest(new Response<Array>(ResponseConstants.CUSTOMERROR, "Invalid caseIDs", ResponseConstants.EMPTYDATA));
            }

            var result = await _odsServices.GetOdsDataByCaseIDListAsync(caseIDList!, sTime, eTime);
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
        /// To fetch the effect and business kpi tags for a given caseID
        /// </summary>
        /// <param name="request"></param>
        /// <returns></returns>   //sp is missing
        [HttpPost("get_ods_kpi_tag_by_case_id")]
        public async Task<IActionResult> GetOdsKpiTagByCaseID([FromBody] OdsCaseIdInputRequest request)
        {

            int caseID = request.caseId;
            int caseCount = _accountServices.GetCaseIDCountFromCaseIDListAsync(caseID.ToString()).Result;
            if (caseCount != 1)
            {
                return BadRequest(new Response<Array>(ResponseConstants.CUSTOMERROR, "Invalid caseID", ResponseConstants.EMPTYDATA));
            }

            var result = await _odsServices.GetOdsKpiTagByCaseIDAsync(caseID);
            if (result == null || result.Count == 0)
            {
                return Ok(new Response<Array>(ResponseConstants.EMPTYOK, ResponseConstants.EMPTYOK_MESSAGE, ResponseConstants.EMPTYDATA));
            }
            else
            {
                return Ok(new Response<List<GetOdsKpiTagByCaseIDStoredProcedureResponse>>(result));
            }
        }


        /// <summary>
        /// This API fetches a number of information from ODS table for a given a list of caseIDs and time range.
        /// </summary>
        /// <param name="request"></param>
        /// <returns></returns>
        [HttpPost("get_ods_data_for_plant_by_case_id_list_time_range")]
        [IntIDValidationFilterAttribute(caseParameter = "caseIDList")]
        public async Task<IActionResult> GetOdsDataForPlantByCaseIDListTimeRange([FromBody] OdsCaseIdListTimeRangeStringRequest request)
        {

            string caseIDList = request.caseIDList!;
            string sTime = request.sTime!;
            string eTime = request.eTime!;

            bool validTimeInputs = CommonMethod.IsValidTimeInput(sTime, eTime);
            if (!validTimeInputs)
            {
                return BadRequest(new Response<Array>(ResponseConstants.CUSTOMERROR, "Start time(sTime) cannot be a later time than end time(eTime)", ResponseConstants.EMPTYDATA));
            }

            var caseIDs = caseIDList!.Split(",");
            int countCaseIDs = caseIDs.Length;
            int countValidCaseIDs = _accountServices.GetCaseIDCountFromCaseIDListAsync(caseIDList!).Result;

            if (countCaseIDs != countValidCaseIDs)
            {
                return BadRequest(new Response<Array>(ResponseConstants.CUSTOMERROR, "Invalid caseIDs", ResponseConstants.EMPTYDATA));
            }

            var result = await _odsServices.GetOdsDataForPlantByCaseIDListTimeRangeAsync(request);
            if (result == null || result.Count <= 0)
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
        [HttpPost("get_ods_trend_data_by_request_id_time_range")]
        public async Task<IActionResult> GetOdsTrendDataByRequestIdAndTimeRange([FromBody] RequestIdTimeStringRangeRequest request, [FromQuery] string source = "db")
        {
            string sTime = request.sTime!;
            string eTime = request.eTime!;

            bool validTimeInputs = CommonMethod.IsValidTimeInput(sTime, eTime);
            if (!validTimeInputs)
            {
                return BadRequest(new Response<Array>(ResponseConstants.CUSTOMERROR, "Start time(sTime) cannot be a later time than end time(eTime)", ResponseConstants.EMPTYDATA));
            }

            var result = await _odsServices.GetOdsTrendDataByRequestIdAndTimeRangeAsync(request, source);
            if (result == null || result.Count <= 0)
            {
                return Ok(new Response<Array>(ResponseConstants.EMPTYOK, ResponseConstants.EMPTYOK_MESSAGE, ResponseConstants.EMPTYDATA));
            }
            else
            {
                return Ok(new Response<object>(result));
            }
        }


        /// <summary>
        /// To fetch the alert Statistics by case id List 
        /// </summary>
        /// <param name="request"></param>
        /// <returns></returns>
        [HttpPost("get_ods_alert_statistics_by_case_id_list")]
        public async Task<IActionResult> GetOdsAlertStatisticsByCaseIDList([FromBody] OdsCaseIdListRequest request)
        {

            int requestCount = request.caseIdList!.Split(",").Length;
            int caseCount = _accountServices.GetCaseIDCountFromCaseIDListAsync(request.caseIdList!).Result;
            if (caseCount != requestCount)
            {
                return BadRequest(new Response<Array>(ResponseConstants.CUSTOMERROR, "Invalid caseID", ResponseConstants.EMPTYDATA));
            }

            var result = await _odsServices.GetOdsAlertStatisticsByCaseIDList(request!);
            if (result == null)
            {
                return Ok(new Response<Array>(ResponseConstants.EMPTYOK, ResponseConstants.EMPTYOK_MESSAGE, ResponseConstants.EMPTYDATA));
            }
            else
            {
                return Ok(new Response<GetOdsAlertStatisticsByCaseIDListResponse>(result));
            }

        }

        /// <summary>
        /// To fetch the alert Statistics by case id List 
        /// </summary>
        /// <param name="request"></param>
        /// <returns></returns>
        [HttpPost("get_ods_alert_statistics_for_role")]
        public async Task<IActionResult> GetOdsAlertStatisticsForRole([FromBody] OdsCaseIdListRequest request)
        {

            int requestCount = request.caseIdList!.Split(",").Length;
            int caseCount = _accountServices.GetCaseIDCountFromCaseIDListAsync(request.caseIdList!).Result;
            if (caseCount != requestCount)
            {
                return BadRequest(new Response<Array>(ResponseConstants.CUSTOMERROR, "Invalid caseID", ResponseConstants.EMPTYDATA));
            }

            var result = await _odsServices.GetOdsAlertStatisticsForRole(request);
            if (result == null)
            {
                return Ok(new Response<Array>(ResponseConstants.EMPTYOK, ResponseConstants.EMPTYOK_MESSAGE, ResponseConstants.EMPTYDATA));
            }
            else
            {
                return Ok(new Response<List<GetOdsAlertStatisticsForRoleResponse>>(result));
            }

        }

        /// <summary>
        /// To fetch the alert Statistics by case id List 
        /// </summary>
        /// <param name="request"></param>
        /// <returns></returns>
        [HttpPost("get_ods_alert_statistics_pending_alerts")]
        public async Task<IActionResult> GetOdsAlertStatisticsPendingAlerts([FromBody] OdsCaseIdListRequest request)
        {

            int requestCount = request.caseIdList!.Split(",").Length;
            int caseCount = _accountServices.GetCaseIDCountFromCaseIDListAsync(request.caseIdList!).Result;
            if (caseCount != requestCount)
            {
                return BadRequest(new Response<Array>(ResponseConstants.CUSTOMERROR, "Invalid caseID", ResponseConstants.EMPTYDATA));
            }

            var result = await _odsServices.GetOdsAlertStatisticsPendingAlerts(request);
            if (result == null || result.Count == 0)
            {
                return Ok(new Response<Array>(ResponseConstants.EMPTYOK, ResponseConstants.EMPTYOK_MESSAGE, ResponseConstants.EMPTYDATA));
            }
            else
            {
                return Ok(new Response<List<GetOdsAlertStatisticsPendingAlertsResponse>>(result));
            }

        }

        /// <summary>
        /// To fetch the alert Statistics by case id List 
        /// </summary>
        /// <param name="request"></param>
        /// <returns></returns>
        [HttpPost("get_ods_alert_statistics_overdue_alerts")]
        public async Task<IActionResult> GetOdsAlertStatisticsOverdueAlerts([FromBody] OdsCaseIdListRequest request)
        {

            int requestCount = request.caseIdList!.Split(",").Length;
            int caseCount = _accountServices.GetCaseIDCountFromCaseIDListAsync(request.caseIdList!).Result;
            if (caseCount != requestCount)
            {
                return BadRequest(new Response<Array>(ResponseConstants.CUSTOMERROR, "Invalid caseID", ResponseConstants.EMPTYDATA));
            }

            var result = await _odsServices.GetOdsAlertStatisticsOverDueAlerts(request);
            if (result == null)
            {
                return Ok(new Response<Array>(ResponseConstants.EMPTYOK, ResponseConstants.EMPTYOK_MESSAGE, ResponseConstants.EMPTYDATA));
            }
            else
            {
                return Ok(new Response<List<GetOdsAlertStatisticsOverdueAlertsResponse>>(result));
            }

        }


        /// <summary>
        /// To fetch the alert Statistics which are in progress by case id List 
        /// </summary>
        /// <param name="request"></param>
        /// <returns></returns>
        [HttpPost("get_ods_alert_statistics_inprogress_alerts")]
        public async Task<IActionResult> GetOdsAlertStatisticsInProgressAlerts([FromBody] OdsCaseIdListRequest request)
        {

            int requestCount = request.caseIdList!.Split(",").Length;
            int caseCount = _accountServices.GetCaseIDCountFromCaseIDListAsync(request.caseIdList!).Result;
            if (caseCount != requestCount)
            {
                return BadRequest(new Response<Array>(ResponseConstants.CUSTOMERROR, "Invalid caseID", ResponseConstants.EMPTYDATA));
            }

            var result = await _odsServices.GetOdsAlertStatisticsInProgressAlerts(request);
            if (result == null)
            {
                return Ok(new Response<Array>(ResponseConstants.EMPTYOK, ResponseConstants.EMPTYOK_MESSAGE, ResponseConstants.EMPTYDATA));
            }
            else
            {
                return Ok(new Response<List<GetOdsAlertStatisticsInProgressAlertsResponse>>(result));
            }

        }


        /// <summary>
        /// To fetch the alert Statistics which are in progress by case id List 
        /// </summary>
        /// <param name="request"></param>
        /// <returns></returns>
        [HttpPost("get_ods_alert_statistics_utilization_report")]
        public async Task<IActionResult> GetOdsClosedAlertStatisticsByCaseIDList([FromBody] GetOdsClosedAlertStatisticsByCaseIDListRequest request)
        {

            int requestCount = request.caseIdList!.Split(",").Length;
            int caseCount = _accountServices.GetCaseIDCountFromCaseIDListAsync(request.caseIdList!).Result;
            if (caseCount != requestCount)
            {
                return BadRequest(new Response<Array>(ResponseConstants.CUSTOMERROR, "Invalid caseID", ResponseConstants.EMPTYDATA));
            }

            var result = await _odsServices.GetOdsClosedAlertStatisticsByCaseIDList(request.caseIdList!, request.dateTime);
            if (result == null)
            {
                return Ok(new Response<Array>(ResponseConstants.EMPTYOK, ResponseConstants.EMPTYOK_MESSAGE, ResponseConstants.EMPTYDATA));
            }
            else
            {
                return Ok(new Response<GetOdsClosedAlertStatisticsByCaseIDListResponse>(result));
            }

        }


        /// <summary>
        /// To fetch the alert statistics for Targets Modified alerts
        /// </summary>
        /// <param name="request"></param>
        /// <returns></returns>
        [HttpPost("get_ods_alert_statistics_target_modified_alerts")]
        public async Task<IActionResult> GetOdsClosedAlertStatisticsStatisticsTargetModifiedAlerts([FromBody] OdsCaseIdListRequest request)
        {

            int requestCount = request.caseIdList!.Split(",").Length;
            int caseCount = _accountServices.GetCaseIDCountFromCaseIDListAsync(request.caseIdList!).Result;
            if (caseCount != requestCount)
            {
                return BadRequest(new Response<Array>(ResponseConstants.CUSTOMERROR, "Invalid caseID", ResponseConstants.EMPTYDATA));
            }

            var result = await _odsServices.GetOdsClosedAlertStatisticsStatisticsTargetModifiedAlertsAsync(request!);
            if (result == null)
            {
                return Ok(new Response<Array>(ResponseConstants.EMPTYOK, ResponseConstants.EMPTYOK_MESSAGE, ResponseConstants.EMPTYDATA));
            }
            else
            {
                return Ok(new Response<List<GetOdsClosedAlertStatisticsStatisticsTargetModifiedAlertsResponse>>(result));
            }

        }

        /// <summary>
        /// 
        /// </summary>
        /// <param name="request"></param>
        /// <returns></returns>
        [HttpPost("get_ods_alert_statistics_by_case_ids_and_state")]
        [IntIDValidationFilter(caseParameter = "caseIDList")]
        public async Task<IActionResult> GetOdsAlertStatisticsByCaseIdListAndState([FromBody] GetOdsAlertStatisticsByCaseIdListAndStateRequest request)
        {
            var result = await _odsServices.GetOdsAlertStatisticsByCaseIdListAndStateAsync(request);
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
        /// Download ods alert statistics data
        /// </summary>
        [HttpPost("download_ods_alert_statistics_data")]
        [IntIDValidationFilterAttribute(caseParameter = "caseIDList")]
        public async Task<IActionResult> DownloadOdsAlertStatisticsData([FromBody] OdsStatisticsDownloadDataRequest request)
        {
            request.chunkSize = _configSettings.chunkSize;
            var result = await _odsServices.GetOdsAlertStatisticsDownloadDataAsync(request);
            if (result.Status == ResponseConstants.EMPTYOK.ToString())
            {
                return Ok(new Response<object>(ResponseConstants.EMPTYOK, ResponseConstants.EMPTYOK_MESSAGE, result!));
            }
            else
            {
                return Ok(new Response<object>(result));
            }
        }

        /// <summary>
        /// update mute alerts log by cause id list
        /// </summary>

        [HttpPost("update_mute_alerts_log_by_cause_id_list")]
        public async Task<IActionResult> UpdatemutealertslogByCauseIdList(UpdateMuteAlertsLogByCauseId request)
        {
            var result = await _odsServices.UpdatemutealertslogByCauseIdListAsync(request);
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
        /// To get mute alerts log
        /// </summary>

        [HttpPost("get_mute_alerts_log")]
        public async Task<IActionResult> Getmutealertslog(MuteAlertsLogRequest request)
        {
            var result = await _odsServices.GetmutealertslogAsync(request);
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
        /// To update PEODS Alert Details
        /// </summary>
        /// <param name="request"></param>
        /// <returns></returns>
        [HttpPost("update_PEODSAlertDetails")]
        public async Task<IActionResult> UpdatePeOdsAlertDetails(UpdatePeOdsAlertDetails request)
        {
            var result = await _odsServices.UpdatePeOdsAlertDetailsAsync(request);
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
        /// To get Ods alerts statistics data comments
        /// </summary>
        /// <param name="request"></param>
        /// <returns></returns>
        [HttpPost("get_ods_alert_statistics_download_data_comments")]
        public async Task<IActionResult> GetOdsAlertStatisticsDownloadDataComments(OdsCaseIdListRequest request)
        {
            var result = await _odsServices.GetOdsAlertStatisticsDownloadDataComments(request);
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
