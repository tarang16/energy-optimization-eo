using Asp.Versioning;
using EOApplication.Contracts.Services;
using EODomain.Common;
using EODomain.Models.Config;
using EODomain.Models.Requests;
using EOWebMicroservice.Filter;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using System.Security.Claims;

namespace EOWebMicroservice.Controllers.v1
{
    /// <summary>
    /// Controller to host APIs related to configuration
    /// </summary>
    [ApiVersion("1.0")]
    public class ConfigController : BaseController
    {
        private readonly IConfigServices _configServices;
        private readonly IAccountServices _accountServices;

        /// <summary>
        /// Constructor for ConfigController
        /// </summary>
        /// <param name="configServices"></param>
        /// <param name="accountServices"></param>
        /// <param name="configSettings"></param>
        public ConfigController(
                            IConfigServices configServices,
                            IAccountServices accountServices,
                             IOptions<ConfigSettings> configSettings)
        {
            _configServices = configServices;
            _accountServices = accountServices;
        }

        /// <summary>
        /// To fetch the details of system, plant, affiliate, sub-region, and region along with the corresponding CaseID.
        /// </summary>
        /// <returns></returns>
        [HttpGet("get_casehierarchy")]
        public async Task<IActionResult> GetCaseHierarchy()
        {
            var caseHierarchyResult = await _configServices.GetCaseHierarchyAsync();
            return Ok(new Response<object>(caseHierarchyResult));
        }

        /// <summary>
        /// To fetch details of total opportunities along with active and over due deviations used in Corporate Landing page.
        /// </summary>
        /// <param name="request"></param>
        /// <returns></returns>
        [HttpPost("get_landing_corporate")]
        public async Task<IActionResult> GetLandingCorporateAsync([FromBody] LandingCorporateRequest request)
        {
            string? caseIDList = request.caseIDList;
            var LandingCorporateresult = await _configServices.GetLandingCorporateAsync(caseIDList);

            if (LandingCorporateresult.Count == 0)
            {
                return Ok(new Response<Array>(ResponseConstants.EMPTYOK, ResponseConstants.EMPTYOK_MESSAGE, ResponseConstants.EMPTYDATA));
            }
            else
            {
                return Ok(new Response<object>(LandingCorporateresult));
            }
        }

        /// <summary>
        /// 
        /// </summary>
        /// <param name="request"></param>
        /// <returns></returns>
        [HttpPost("get_landing_affiliate_score_card")]
        public async Task<IActionResult> GetLandingAffiliateScoreCard([FromBody] GetLandingAffiliateScoreCardRequest request)
        {
            var LandingAffiliateresult = await _configServices.GetLandingAffiliateScoreCardAsync(request.affiliateID, request.upto!);
            if (LandingAffiliateresult == null)
            {
                return Ok(new Response<Array>(ResponseConstants.EMPTYOK, ResponseConstants.EMPTYOK_MESSAGE, ResponseConstants.EMPTYDATA));
            }
            else
            {
                return Ok(new Response<object>(LandingAffiliateresult));
            }
        }


        /// <summary>
        /// To fetch the list of details of users/Users with a keywords  
        /// </summary>
        /// <param name="request"></param>
        /// <returns></returns>
        [HttpPost("get_user_by_id_name_email")]
        public async Task<IActionResult> GetUserByIDNameEmail([FromBody] GetUserByIDNameEmailRequest request)
        {
            var GetUserByIDNameEmailresult = await _accountServices.GetUserByIDNameEmailAsync(request.keyword!);
            if (GetUserByIDNameEmailresult==null || GetUserByIDNameEmailresult.Count == 0)
            {
                return Ok(new Response<Array>(ResponseConstants.EMPTYOK, ResponseConstants.EMPTYOK_MESSAGE, ResponseConstants.EMPTYDATA));
            }
            else
            {
                return Ok(new Response<object>(GetUserByIDNameEmailresult));
            }
        }



        /// <summary>
        /// To get case info by case id list
        /// </summary>
        /// <param name="request"></param>
        /// <returns></returns>
        [HttpPost("get_case_info_by_case_id_list")]
        public async Task<IActionResult> GetCaseInfoByCaseIdList([FromBody] CaseIdListRequest request)
        {
            var result = await _configServices.GetCaseInfoByCaseIdListAsync(request);
            return Ok(result);
        }

        /// <summary>
        /// 
        /// </summary>
        /// <returns></returns>
        [HttpGet("get_uom")]
        public async Task<IActionResult> GetUomAsync()
        {
            var result = await _configServices.GetUomAsync();
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
        /// To get screen names by affiliate ids
        ///  </summary>
        [HttpPost("get_screennames_by_affiliate_ids")]
        public async Task<IActionResult> GetScreenNamesByAffiliateIDsAsync([FromBody] GetUserStatisticsScreensRequest request)
        {
            var result = await _configServices.GetScreenNamesByAffiliateIDsAsync(request);
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
        /// To get the data for viewData 
        /// </summary>
        /// <param name="request"></param>s
        /// <returns></returns>
        [HttpPost("get_view_data_dictionary_by_table_name")]
        [CaseIdAuthfilterAttribute]
        public async Task<IActionResult> GetViewDataDictionaryByTableName([FromBody] GetViewDataDictionaryByTableNameRequest request)
        {

            var result = await _configServices.GetViewDataDictionaryByTableNameAsync(request);

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
        /// to get the data for the walkthrough
        /// </summary>
        /// <param name="request"></param>
        /// <returns></returns>
        [HttpPost("get_walkthrough_data_by_pagekey")]
        public async Task<IActionResult> GetWalkthroughDataByPageKey([FromBody] GetWalkthroughDataByPagekeyRequest request)
        {
            var result = await _configServices.GetWalkthroughDataByPageKey(request);
            if (result == null || result.Count <= 0)
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
