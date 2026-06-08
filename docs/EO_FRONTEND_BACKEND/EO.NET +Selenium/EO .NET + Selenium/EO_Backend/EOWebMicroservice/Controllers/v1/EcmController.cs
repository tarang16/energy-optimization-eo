using EODomain.Common;
using EODomain.Models.ECM;
using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;
using EOWebMicroservice.Filter;
using Microsoft.AspNetCore.Http;
using EOApplication.Contracts.Services;
using Asp.Versioning;

namespace EOWebMicroservice.Controllers.v1
{
    /// <summary>
    /// Controller to host ECM related APIs
    /// </summary>
    [ApiVersion("1.0")]
    public class EcmController : BaseController
    {
        private readonly IEcmServices _ecmServices;

        /// <summary>
        /// Constructor for EcmController
        /// </summary>
        /// <param name="ecmServices"></param>
        public EcmController(IEcmServices ecmServices)
        {
            _ecmServices = ecmServices;
        }

        /// <summary>
        /// To get ecm auth token
        /// </summary>
        /// <returns></returns>
        [HttpPost("get_ecm_auth_token")]
        public async Task<IActionResult> GetEcmAuthTokenAsync()
        {
            var result = await Task.Run(() => _ecmServices.GetEcmAuthTokenAsync());
            if (result == null)
            {
                return BadRequest(new Response<Array>(ResponseConstants.CUSTOMERROR, "failed to get ecm auth token!", ResponseConstants.EMPTYDATA));
            }
            else
            {
                return Ok(new Response<object>(result));
            }
        }
        
        /// <summary>
        /// To download file from ECM
        /// </summary>
        /// <param name="request"></param>
        /// <returns></returns>
        [HttpPost("download_from_ecm")]
        [CaseIdAuthfilterAttribute]
        public async Task<IActionResult> DownloadFromEcmAsync([FromBody] DownloadFromEcmRequest request)
        {
            var result = await Task.Run(() => _ecmServices.DownloadFromEcmAsync(request));
            if (result.FileName == null)
            {
                return BadRequest(new Response<Array>(ResponseConstants.CUSTOMERROR, result.Message!, ResponseConstants.EMPTYDATA));
            }
            else
            {
                return Ok(new Response<object>(result));
            }
        }

        /// <summary>
        /// To upload file to ECM
        /// </summary>
        /// <param name="file"></param>
        /// <returns></returns>
        [HttpPost("upload_to_ecm")]
        public async Task<IActionResult> UploadToEcmAsync(IFormFile file)
        {
            var claims = HttpContext.User.Identity as ClaimsIdentity;
            Claim? claimUID = claims!.Claims.FirstOrDefault(claim => claim.Type == "uid");
            int userID = Convert.ToInt32(claimUID!.Value);
            var result = await Task.Run(() => _ecmServices.UploadToEcmAsync(file, userID));
            if (result.Id == null)
            {
                return BadRequest(new Response<Array>(ResponseConstants.CUSTOMERROR, result.Message!, ResponseConstants.EMPTYDATA));
            }
            else
            {
                return Ok(new Response<object>(result));
            }
        }
        

        /// <summary>
        /// To to get all the files that where uploaded to a node in ECM.
        /// </summary>
        /// <param name="request"></param>
        /// <returns></returns>
        [HttpPost("get_ecm_files")]
        public async Task<IActionResult> GetEcmFilesByNodeIdAsync([FromBody] NodeIdRequest request)
        {
            int nodeId = request.nodeId;
            string nodeIdString = nodeId.ToString();
            var result = await Task.Run(() => _ecmServices.GetEcmFilesByNodeIdAsyc(nodeIdString));
            if(result.statuscode == StatusCodes.Status421MisdirectedRequest)
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



        /// <summary>
        /// To get Ecm Node ID
        /// </summary>
        /// <param name="request"></param>
        /// <returns></returns>
        [HttpPost("get_ecm_nodeId")]
        public async Task<IActionResult> GetEcmNodeIdByCaseId([FromBody] EcmCaseIdInputRequest request)
        {
            int caseId = request.caseID;
            var result = await Task.Run(() => _ecmServices.GetEcmNodeIdByCaseIdAsync(caseId));
            if (result == null || result < 0 || result == 0)
            {
                return BadRequest(new Response<Array>(ResponseConstants.EMPTYOK, ResponseConstants.COULD_NOT_FIND_FILES_IN_ECM, ResponseConstants.EMPTYDATA));
            }
            else
            {
                return Ok(new Response<object>(result!));
            }
        }


        /// <summary>
        /// API to get walk through data of furnace by fileListTutID
        /// </summary>
        /// <param name="request"></param>
        /// <returns></returns>
        [HttpPost("get_walkthrough_data_by_file_list_tut_id")]
        public async Task<IActionResult> GetWalkthroughDataFurnaceByFileListTutID([FromBody] GetWalkthroughDataByFurnaceEcmRequest request)
        {
            var result = await _ecmServices.GetWalkthroughDataFurnaceByFileListTutID(request);
            // If result set is empty
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
