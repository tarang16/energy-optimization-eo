using Asp.Versioning;
using EOApplication.Contracts.Services;
using EODomain.Common;
using EOWebMicroservice.Filter;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.Net;
using System.Security.Claims;
using EODomain.Models.CCP;
using EODomain.Models.CcpOptimizer;
using System.Data;
using EODomain.Models.Requests;
using EOInfrastructure.Services;

namespace EOWebMicroservice.Controllers.v1
{
    /// <summary>
    /// 
    /// </summary>
    [ApiVersion("1.0")]
    public class CcpOptimizerController : BaseController
    {
        private readonly ICcpOptimizerServices _ccpServices;
        /// <summary>
        /// Gets the configuration settings for the application.
        /// </summary>
        /// 
        public readonly IConfiguration _configuration;
        /// <summary>
        /// Gets the configuration settings for the application.
        /// </summary>
        public readonly IAccountServices _accountServices;
        /// <summary>
        /// Gets the configuration settings for the application.
        /// </summary>
        public readonly IConfigServices _configServices;

        /// <summary>
        /// Constructor for CcpOptimizerController
        /// </summary>
        /// <param name="ccpServices"></param>
        /// <summary>
        /// Initializes a new instance of the CcpOptimizerController class.
        /// </summary>

        /// <param name="configuration">The configuration settings used for the controller.</param>
        /// <param name="accountServices">The account services used by the controller.</param>
        /// <param name="configServices">The config services used by the controller.</param>

        public CcpOptimizerController(ICcpOptimizerServices ccpServices, IConfiguration configuration, IAccountServices accountServices, IConfigServices configServices)
        {
            _ccpServices = ccpServices;
            _configuration = configuration;
            _accountServices = accountServices;
            _configServices = configServices;
        }

        /// <summary>
        /// To fetch all the Optimizer Constraints Data for the given input of a CaseID
        /// </summary>
        /// <param name="request"></param>
        /// <returns></returns>
        [HttpPost("get_optimizer_constraints")]
        public async Task<IActionResult> GetOptimizerConstraints([FromBody] GetCaseIDRequest request)
        {
            var ccpdataresult = await _ccpServices.GetOptimizerConstraintsAsync(request.caseID);
            if (ccpdataresult.Count == 0)
            {
                return Ok(new Response<Array>(ResponseConstants.EMPTYOK, ResponseConstants.EMPTYOK_MESSAGE, ResponseConstants.EMPTYDATA));
            }
            else
            {
                return Ok(new Response<object>(ccpdataresult));
            }

        }

        /// <summary>
        /// To fetch all the Optimizer Variables Data for the given input of a CaseID
        /// </summary>
        /// <param name="request"></param>
        /// <returns></returns>
        [HttpPost("get_optimizer_variables_data_by_caseid")]
        public async Task<IActionResult> GetOptimizerVariablesDataByCaseIdAsync([FromBody] GetCaseIDRequest request)
        {
            var ccpdataresult = await _ccpServices.GetOptimizerVariablesDataByCaseIdAsync(request.caseID);
            if (ccpdataresult.Count == 0)
            {
                return Ok(new Response<Array>(ResponseConstants.EMPTYOK, ResponseConstants.EMPTYOK_MESSAGE, ResponseConstants.EMPTYDATA));
            }
            else
            {
                return Ok(new Response<object>(ccpdataresult));
            }

        }

        /// <summary>
        /// To fetch all the Optimizer Parameter Data for the given input of a CaseID
        /// </summary>
        /// <param name="request"></param>
        /// <returns></returns>
        [HttpPost("get_optimizer_parameter_by_caseid")]
        public async Task<IActionResult> GetOptimizerParameterByCaseIdAsync([FromBody] GetCaseIDRequest request)
        {
            var ccpdataresult = await _ccpServices.GetOptimizerParameterByCaseIdAsync(request.caseID);
            if (ccpdataresult.Count == 0)
            {
                return Ok(new Response<Array>(ResponseConstants.EMPTYOK, ResponseConstants.EMPTYOK_MESSAGE, ResponseConstants.EMPTYDATA));
            }
            else
            {
                return Ok(new Response<object>(ccpdataresult));
            }

        }

        /// <summary>
        /// To fetch all the Derived Equations Data for the given input of a CaseID
        /// </summary>
        /// <param name="request"></param>
        /// <returns></returns>
        [HttpPost("get_optimizer_derived_equations")]
        public async Task<IActionResult> GetOptimizerDerivedEquations([FromBody] GetCaseIDRequest request)
        {
            var ccpdataresult = await _ccpServices.GetOptimizerDerivedEquationsAsync(request.caseID);
            if (ccpdataresult.Count == 0)
            {
                return Ok(new Response<Array>(ResponseConstants.EMPTYOK, ResponseConstants.EMPTYOK_MESSAGE, ResponseConstants.EMPTYDATA));
            }
            else
            {
                return Ok(new Response<object>(ccpdataresult));
            }

        }

        /// <summary>
        /// To fetch all the Objective Function Data for the given input of a CaseID
        /// </summary>
        /// <param name="request"></param>
        /// <returns></returns>
        [HttpPost("get_optimizer_objective_function")]
        public async Task<IActionResult> GetOptimizerObjectiveFunction([FromBody] GetCaseIDRequest request)
        {
            var ccpdataresult = await _ccpServices.GetOptimizerObjectiveFunctionAsync(request.caseID);
            if (ccpdataresult.Count == 0)
            {
                return Ok(new Response<Array>(ResponseConstants.EMPTYOK, ResponseConstants.EMPTYOK_MESSAGE, ResponseConstants.EMPTYDATA));
            }
            else
            {
                return Ok(new Response<object>(ccpdataresult));
            }
        }

        /// <summary>
        /// To insert/update details of Optimizer Objectives 
        /// </summary>
        /// <param name="request"></param>
        /// <returns></returns>
        [HttpPost("add_optimizer_objective")]
        [DeveloperAuthFilter(claimType = "developer", idParameter = "modelTagId", skipAdmin = true)]
        public async Task<IActionResult> AddOptimizerObjective([FromBody] AddOptimizerObjectiveRequest request)
        {
            var claims = HttpContext.User.Identity as ClaimsIdentity;
            Claim? claimUID = claims!.Claims.FirstOrDefault(claim => claim.Type == "uid");
            int userID = Convert.ToInt32(claimUID!.Value);
            request.createdBy = userID;
            request.modifiedBy = (request.objectiveId != 0 || request.objectiveId != null) ? userID : null;
            var result = await Task.Run(() => _ccpServices.AddOptimizerObjectiveAsync(request!));  
            string errorMessageView = string.Empty;
            string errorMessage = string.Empty;
            bool isFirst = true;
            if (result != null)
            {
                foreach (var items in result)
                {
                    if (isFirst)
                    {
                        errorMessageView = items.Value;
                        errorMessage = items.Key;
                        isFirst = false;
                    }
                }
            }
            if (result == null || errorMessage.Contains("Error"))
            {
                return BadRequest(new Response<Array>(ResponseConstants.CUSTOMERROR, errorMessageView, ResponseConstants.EMPTYDATA));
            }
            else
            {
                return Ok(new Response<object?>(result));
            }

        }

        /// <summary>
        /// To insert/update details of Optimizer Derived Equations 
        /// </summary>
        /// <param name="request"></param>
        /// <returns></returns>
        [HttpPost("add_optimizer_derived_equation")]
        [DeveloperAuthFilter(claimType = "developer", idParameter = "modelTagId", skipAdmin = true)]
        public async Task<IActionResult> AddOptimizerDerivedEquation([FromBody] AddOptimizerDerivedEquationRequest request)
        {
            var result = await Task.Run(() => _ccpServices.AddOptimizerDerivedEquationAsync(request!));
            string? errorMessage = string.Empty;
            string? errorMessageView = string.Empty;
            bool isFirst = true;
            if (result != null)
            {
                foreach (var item1 in result)
                {
                    if (isFirst)
                    {
                        errorMessage = item1.Key;
                        errorMessageView = item1.Value;
                        isFirst = false;
                    }
                }
            }
            if (result == null || errorMessage.Contains("Error"))
            {
                return BadRequest(new Response<Array>(ResponseConstants.CUSTOMERROR, errorMessageView, ResponseConstants.EMPTYDATA));
            }
            else
            {
                return Ok(new Response<object?>(result));
            }

        }

        /// <summary>
        /// To insert/update details of Optimizer Variables 
        /// </summary>
        /// <param name="request"></param>
        /// <returns></returns>
        [HttpPost("add_optimizer_variable")]
        [DeveloperAuthFilter(claimType = "developer", idParameter = "modelTagId", skipAdmin = true)]
        public async Task<IActionResult> AddOptimizerVariable([FromBody] AddOptimizerVariableRequest request)
        {
            
            var result = await Task.Run(() => _ccpServices.AddOptimizerVariableAsync(request!));
            string errorMessage = string.Empty;
            string errorMessageView = string.Empty;
            bool isFirst = true;
            if (result != null)
            {
                foreach (var item in result)
                {
                    if (isFirst)
                    {
                        errorMessage = item.Key;
                        errorMessageView = item.Value;
                        isFirst = false;
                    }
                }
            }
            if (result == null || errorMessage.Contains("Error"))
            {
                return BadRequest(new Response<Array>(ResponseConstants.CUSTOMERROR, errorMessageView, ResponseConstants.EMPTYDATA));
            }
            else
            {
                return Ok(new Response<object?>(result));
            }

        }

        /// <summary>
        /// To insert/update details of Optimizer Constraint 
        /// </summary>
        /// <param name="request"></param>
        /// <returns></returns>
        [HttpPost("add_optimizer_constraint")]
        [DeveloperAuthFilter(claimType = "developer", idParameter = "modelId", skipAdmin = true)]
        public async Task<IActionResult> AddOptimizerConstraint([FromBody] AddOptimizerConstraintRequest request)
        {
           
            var result = await Task.Run(() => _ccpServices.AddOptimizerConstraintAsync(request!));
            if (result == null)
            {
                return BadRequest(new Response<Array>(ResponseConstants.CUSTOMERROR,"null", ResponseConstants.EMPTYDATA));
            }
            string errorMessage = string.Empty;
            string errorMessageView = string.Empty;
            bool isFirst = true;
            foreach (var item in result)
            {
                if (isFirst)
                {
                    errorMessage = item.Key;
                    errorMessageView = item.Value;
                    isFirst = false;
                }
            }
            if (errorMessage.Contains("Error"))
            {
                return BadRequest(new Response<Array>(ResponseConstants.CUSTOMERROR, errorMessageView, ResponseConstants.EMPTYDATA));
            }
           
            return Ok(new Response<object?>(result));
            

        }

        /// <summary>
        /// To insert/update details of Optimizer Parameter
        /// </summary>
        /// <param name="request"></param>
        /// <returns></returns>
        [HttpPost("update_optimizer_parameter")]
        [DeveloperAuthFilter(claimType = "developer", idParameter = "modelTagId", skipAdmin = true)]
        public async Task<IActionResult> UpdateOptimizerParameter([FromBody] AddOptimizerParameterRequest request)
        {
            
            var result = await Task.Run(() => _ccpServices.UpdateOptimizerParameterAsync(request!));
            if (result == null)
            {
                return BadRequest(new Response<Array>(ResponseConstants.CUSTOMERROR, "null", ResponseConstants.EMPTYDATA));
            }

            string errorMessage = string.Empty;
            string errorMessageView = string.Empty;
            bool isFirst = true;
            foreach (var item in result)
            {
                if (isFirst)
                {
                    errorMessage = item.Key;
                    errorMessageView = item.Value;
                    isFirst = false;
                }
            }
            if (errorMessage.Contains("Error"))
            {
                return BadRequest(new Response<Array>(ResponseConstants.CUSTOMERROR, errorMessageView, ResponseConstants.EMPTYDATA));
            }
            
             return Ok(new Response<object?>(result));
           

        }

        /// <summary>
        /// To delete derived equations details
        /// </summary>
        /// <param name="request"></param>
        /// <returns></returns>
        [HttpPost("delete_optimizer_derived_equation_by_derivedequationid")]
        [DeveloperAuthFilter(claimType = "developer", idParameter = "derivedEquationId", skipAdmin = true)]
        public async Task<IActionResult> PostDeleteOptimizerDerivedEquation([FromBody] OptimizerDerivedEquationIdRequest request)
        {
            var result = await _ccpServices.PostDeleteOptimizerDerivedEquationAsync(request!);
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
        /// To delete variable details
        /// </summary>
        /// <param name="request"></param>
        /// <returns></returns>
        [HttpPost("delete_optimizer_variable_by_variableid")]
        [DeveloperAuthFilter(claimType = "developer", idParameter = "variableId", skipAdmin = true)]
        public async Task<IActionResult> PostDeleteOptimizerVariable([FromBody] OptimizerVariableIdRequest request)
        {
            var result = await _ccpServices.PostDeleteOptimizerVariableAsync(request!);
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
        /// To delete constraint details
        /// </summary>
        /// <param name="request"></param>
        /// <returns></returns>
        [HttpPost("delete_optimizer_constraint_by_constraintid")]
        [DeveloperAuthFilter(claimType = "developer", idParameter = "constraintId", skipAdmin = true)]
        public async Task<IActionResult> PostDeleteOptimizerConstraint([FromBody] OptimizerConstraintIdRequest request)
        {
            var result = await _ccpServices.PostDeleteOptimizerConstraintAsync(request!);
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
        /// To delete parameter details
        /// </summary>
        /// <param name="request"></param>
        /// <returns></returns>
        [HttpPost("delete_optimizer_parameter_by_modeltagid")]
        [DeveloperAuthFilter(claimType = "developer", idParameter = "modelTagId", skipAdmin = true)]
        public async Task<IActionResult> PostDeleteOptimizerParameter([FromBody] OptimizerParameterIdRequest request)
        {
            var result = await _ccpServices.PostDeleteOptimizerParameterAsync(request!);
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
        /// To fetch all the Constraint Category Data
        /// </summary>        
        /// <returns></returns>
        [HttpGet("get_optimizer_constraint_category_details")]
        public async Task<IActionResult> GetOptimizerConstraintCategory()
        {
            var ccpdataresult = await _ccpServices.GetOptimizerConstraintCategoryAsync();
            if (ccpdataresult.Count == 0)
            {
                return Ok(new Response<Array>(ResponseConstants.EMPTYOK, ResponseConstants.EMPTYOK_MESSAGE, ResponseConstants.EMPTYDATA));
            }
            else
            {
                return Ok(new Response<object>(ccpdataresult));
            }

        }

        /// <summary>
        /// To Update Equipment Availability
        /// </summary>

        [HttpPost("Update_Equipement_Availability")]
        public async Task<IActionResult> UpdateEquipmentAvailability([FromBody] UpdEquipAvaliabilityRequestData equipmentData)
        {

            var claims = HttpContext.User.Identity as ClaimsIdentity;
            Claim? claimUID = claims!.Claims.FirstOrDefault(claim => claim.Type == "uid");
            int userID = Convert.ToInt32(claimUID!.Value);
            equipmentData.createdBy = userID;
            var result = await _ccpServices.UpdateEquipmentAvailabilityAsync(equipmentData);
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
        /// To Get Config Equipment Availability
        /// </summary>

        [HttpPost("get_config_equipment_availability")]
        public async Task<IActionResult> GetConfigEquipmentAvailability([FromBody] GetCaseIDRequest request)
        {
            var ccpdataresult = await _ccpServices.GetConfigEquipmentAvailabilityAsync(request.caseID);
            if (ccpdataresult.Count == 0)
            {
                return Ok(new Response<Array>(ResponseConstants.EMPTYOK, ResponseConstants.EMPTYOK_MESSAGE, ResponseConstants.EMPTYDATA));
            }
            else
            {
                return Ok(new Response<object>(ccpdataresult));
            }

        }

        /// <summary>
        /// To Update Optimization Price Input
        /// </summary>

        [HttpPost("update_optimization_price_input")]
        public async Task<IActionResult> UpdateOptimizationPriceInput([FromBody] UpdateOptimizationPriceInput request)
        {

            var result = await _ccpServices.UpdateOptimizationPriceInputAsync(request!);
            if (string.IsNullOrEmpty(result))
            {
                return Ok(new Response<Array>(ResponseConstants.EMPTYOK, ResponseConstants.EMPTYOK_MESSAGE, ResponseConstants.EMPTYDATA));
            }
            else
            {
                return Ok(new Response<object>(result));
            }

        }


        /// <summary>
        /// To get seu details data
        /// </summary>
        [HttpPost("get_seu_details")]
        public async Task<IActionResult> GetSeuDetailsData([FromBody] CaseIdSeuInputRequest request)
        {
            int caseID = request.caseID;
            var SeuDetailsResult = await _ccpServices.GetSeuDetailsDataAsync(caseID);
            if (SeuDetailsResult == null)
            {

                return Ok(new Response<Array>(ResponseConstants.EMPTYOK, ResponseConstants.EMPTYOK_MESSAGE, ResponseConstants.EMPTYDATA));
            }
            else
            {
                return Ok(new Response<object>(SeuDetailsResult));
            }
        }

        /// <summary>
        /// to get sub model data
        /// </summary>
        [HttpPost("get_sub_model")]
        public async Task<IActionResult> GetSubModelDataAsync([FromBody] CaseIdSeuInputRequest request)
        {
            int caseID = request.caseID;
            var SubModelResult = await _ccpServices.GetSubModelDataAsync(caseID);
            if (SubModelResult == null)
            {

                return Ok(new Response<Array>(ResponseConstants.EMPTYOK, ResponseConstants.EMPTYOK_MESSAGE, ResponseConstants.EMPTYDATA));
            }
            else
            {
                return Ok(new Response<object>(SubModelResult));
            }
        }

        /// <summary>
        /// To update seu details data
        /// </summary>
        [HttpPost("update_seu_details")]
        public async Task<IActionResult> UpdateSeuDetailsDataAsync([FromBody] UpdateSeuDetailsRequest request)
        {
            var SeuDetailsResult = await _ccpServices.UpdateSeuDetailsDataAsync(request);
            if (SeuDetailsResult == null)
            {

                return Ok(new Response<Array>(ResponseConstants.EMPTYOK, ResponseConstants.EMPTYOK_MESSAGE, ResponseConstants.EMPTYDATA));
            }
            else
            {
                return Ok(new Response<object>(SeuDetailsResult));
            }
        }

        /// <summary>
        /// To update sub model data
        /// </summary>
        [HttpPost("update_sub_model")]
        public async Task<IActionResult> UpdateSubModelDataAsync([FromBody] UpdateSubModelRequest request)
        {
            var SeuDetailsResult = await _ccpServices.UpdateSubModelDataAsync(request);
            if (SeuDetailsResult == null)
            {

                return Ok(new Response<Array>(ResponseConstants.EMPTYOK, ResponseConstants.EMPTYOK_MESSAGE, ResponseConstants.EMPTYDATA));
            }
            else
            {
                return Ok(new Response<object>(SeuDetailsResult));
            }
        }

        /// <summary>
        /// to get the data for sub model parameter
        /// </summary>
        /// <param name="request"></param>
        /// <returns></returns>
        [HttpPost("get_sub_model_parameter")]
        public async Task<IActionResult> GetSubModelParameter([FromBody] GetCaseIDRequest request)
        {
            var SeuDetailsResult = await _ccpServices.GetSubModelParameterAsync(request);
            if (SeuDetailsResult == null)
            {

                return Ok(new Response<Array>(ResponseConstants.EMPTYOK, ResponseConstants.EMPTYOK_MESSAGE, ResponseConstants.EMPTYDATA));
            }
            else
            {
                return Ok(new Response<object>(SeuDetailsResult));
            }
        }


        /// <summary>
        /// to update the value of sub model parameter 
        /// </summary>
        /// <param name="request"></param>
        /// <returns></returns>
        [HttpPost("update_sub_model_parameter")]
        public async Task<IActionResult> UpdateSubModelParameter([FromBody] UpdateSubModelParameterRequest request)
        {
            var SeuDetailsResult = await _ccpServices.UpdateSubModelParameterAsync(request);
            if (SeuDetailsResult == null)
            {

                return Ok(new Response<Array>(ResponseConstants.EMPTYOK, ResponseConstants.EMPTYOK_MESSAGE, ResponseConstants.EMPTYDATA));
            }
            else
            {
                return Ok(new Response<object>(SeuDetailsResult));
            }
        }

    }
}
