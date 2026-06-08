using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using EOApplication.Contracts.Services;
using EODomain.Models.Account;
using EODomain.Common;
using EOWebMicroservice.Filter;
using Asp.Versioning;
using EODomain.Models.Requests;
using EODomain.Models.Config;
using EOInfrastructure.Services;
using Microsoft.Extensions.Options;
using EODomain.Models.Download;

namespace EOWebMicroservice.Controllers.v1
{
    
    /// <summary>
 /// Controller to host APIs for user management
 /// </summary>
    [ApiVersion("1.0")] 
    public class DownloadController : BaseController
    {
        
         private readonly IDownloadServices _downloadService;
        private readonly ConfigSettings _configSettings;
        /// <summary>
        /// Controller to host APIs for user management
        /// </summary>
        public DownloadController(IDownloadServices downloadService,IOptions<ConfigSettings> configSettings)
        {
            _downloadService = downloadService;
            _configSettings = configSettings.Value;
        }
        /// <summary>
        /// Controller to host APIs for user management
        /// </summary>
        [HttpPost("get_download_tag_list")]
        //[IntIDValidationFilterAttribute(caseParameter = "plantIDList")]
        public async Task<IActionResult> GetDownloadTagListAsync([FromBody] GetDownloadTagListRequest request)
        {
            var result = await _downloadService.GetDownloadTagListAsync(request);
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
        /// To get download data
        /// </summary>

        [HttpPost("get_download_data")]
        //[IntIDValidationFilterAttribute(caseParameter = "plantID_list")]
        public async Task<IActionResult> GetDownloadDataAsync([FromBody] DownloadDataRequest request)
        {
            request.chunkSize = _configSettings.chunkSize;
            var result = await _downloadService.GetDownloadDataAsync(request);
            if (result.Status == ResponseConstants.EMPTYOK.ToString() || result.Status == null)
            {
                return Ok(new Response<object>(ResponseConstants.EMPTYOK, ResponseConstants.EMPTYOK_MESSAGE, result!));
            }
            else
            {
                return Ok(new Response<object>(result));
            }
        }

        /// <summary>
        /// To get case wise download data
        /// </summary>
        [HttpPost("get_case_wise_download_data")]
        public async Task<IActionResult> GetCaseWiseDownloadDataAsync([FromBody] DownloadCaseWiseDataRequest request, [FromQuery] string source = "db")
        {

            var result = await _downloadService.GetCaseWiseDownloadDataAsync(request, source);
            if (result.Status == ResponseConstants.EMPTYOK.ToString() || result.Status == null)
            {
                return Ok(new Response<object>(ResponseConstants.EMPTYOK, ResponseConstants.EMPTYOK_MESSAGE, result!));
            }
            else
            {
                return Ok(new Response<object>(result));
            }
        }



    }
}
