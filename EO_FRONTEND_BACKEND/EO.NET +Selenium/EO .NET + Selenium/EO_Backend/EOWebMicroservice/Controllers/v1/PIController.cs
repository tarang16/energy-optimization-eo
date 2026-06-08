using Asp.Versioning;
using EOApplication.Contracts.Services;
using EODomain.Common;
using EODomain.Models.CCP;
using EODomain.Models.PI;
using EOWebMicroservice.Filter;
using Microsoft.AspNetCore.Mvc;

namespace EOWebMicroservice.Controllers.v1
{

    /// <summary>
    /// Controller to host APIs related to PI service modelId
    /// </summary>
    [ApiVersion("1.0")]
    public class PIController : BaseController
    {
        private readonly IPIServices _piservices;

        /// <summary>
        /// Constructor for PIController class
        /// </summary>
        /// <param name="piServices"></param>
        public PIController(IPIServices piServices)
        {
            _piservices = piServices;
        }

        /// <summary>
        /// To fetch all the details of all the tags available for the given input of a CaseID
        /// </summary>
        /// <param name="request"></param>
        /// <returns></returns>
        [HttpPost("get_pi_tag_validation")]
        public async Task<IActionResult> GetPiTagValidated([FromBody] PiDataValidationRequest request)
        {
            var response = await _piservices.GetPiTagValidatedAsync(request);
            if (response == null)
            {
                return Ok(new Response<Array>(ResponseConstants.EMPTYOK, ResponseConstants.EMPTYOK_MESSAGE, ResponseConstants.EMPTYDATA));
            }
            else
            {
                return Ok(new Response<object>(response));
            }
        }
       
    }
}
