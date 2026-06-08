using Asp.Versioning;
using EOApplication.Contracts.Services;
using EODomain.Common;
using EODomain.Models.Network;
using EODomain.Models.Requests;
using EOWebMicroservice.Filter;
using Microsoft.AspNetCore.Mvc;

namespace EOWebMicroservice.Controllers.v1
{
    /// <summary>
    /// 
    /// </summary>
    [ApiVersion("1.0")]
    public class NetworkController : BaseController
    {
        private readonly INetworkServices _networkServices;
        /// <summary>
        /// Injecting config services
        /// </summary>
        public readonly IConfigServices _configServices;
        
        /// <summary>
        /// 
        /// </summary>
        /// <param name="networkServices"></param>
        /// <param name="configServices"></param>
        public NetworkController(INetworkServices networkServices, IConfigServices configServices)
        {
            _networkServices = networkServices;
            _configServices = configServices;
        }


        /// <summary>
        /// 
        /// </summary>
        /// <param name="request"></param>
        /// <returns></returns>
        [HttpPost("get_mst_network_pages")]
        public async Task<IActionResult> GetEnpiDailyTrend([FromBody] GetMstNetworkPagesRequest request)
        {
            var result = await _networkServices.GetMstNetworkPagesAsync(request);
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
        [HttpPost("get_trn_network_pages")]
        public async Task<IActionResult> GetTrnNetworkPages([FromBody] GetTrnNetworkPagesRequest request)
        {
            var result = await _networkServices.GetTrnNetworkPagesAsync(request);
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
        [HttpPost("add_mst_network_pages")]
        [DeveloperAuthFilter(claimType = "developer", idParameter = "caseid", skipAdmin = true)]
        public async Task<IActionResult> PostMstNetworkPages([FromBody] PostMstNetworkPagesRequest request)
        {
            var result = await _networkServices.PostMstNetworkPagesAsync(request);
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
        [HttpPost("add_trn_network_pages")]
        [DeveloperAuthFilter(claimType = "developer", idParameter = "caseID", skipAdmin = true)]
        public async Task<IActionResult> PostTrnNetworkPages([FromBody] PostTrnNetworkPagesRequest request)
        {
            var result = await _networkServices.PostTrnNetworkPagesAsync(request);
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
        [HttpPost("get_all_tags_by_case_id")]
        public async Task<IActionResult> GetAllTagsByCaseID([FromBody] CaseIdInputRequest request)
        {
            var result = await _networkServices.GetAllTagsByCaseIDAsync(request);
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
        [HttpPost("get_all_tag_data_by_case_id")]
        public async Task<IActionResult> GetAllTagDataByCaseID([FromBody] CaseIdDateTimeRequest request, [FromQuery] string source = "db")
        {
            var result = await _networkServices.GetAllTagDataByCaseIDAsync(request, source);
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
