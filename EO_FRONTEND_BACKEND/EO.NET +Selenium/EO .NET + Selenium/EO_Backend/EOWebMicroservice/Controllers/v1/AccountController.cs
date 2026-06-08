using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using EOApplication.Contracts.Services;
using EODomain.Models.Account;
using EODomain.Common;
using EOWebMicroservice.Filter;
using Asp.Versioning;
using EODomain.Models.Requests;
using EOInfrastructure.Services;
using System.Security.Claims;

namespace EOWebMicroservice.Controllers.v1
{
    /// <summary>
    /// Controller to host APIs for user management
    /// </summary>
    [ApiVersion("1.0")]
    [Route("api/v{version:apiVersion}/[controller]")]
    [ApiController]
   
    public class AccountController : ControllerBase
    {
        private readonly IAccountServices _accountService;
        private readonly IEmailServices _emailServices;

        /// <summary>
        /// Constructor for account controller
        /// </summary>
        /// <param name="accountServices"></param>
        /// <param name="emailServices"></param>
        public AccountController(IAccountServices accountServices, IEmailServices emailServices)
        {
            _accountService = accountServices;
            _emailServices = emailServices;
        }

        /// <summary>
        /// To fetch all the users for a given role. 
        /// </summary>
        /// <param>role</param>
        /// <returns></returns>
        [Authorize(Policy = "AdminAccess")]
        [HttpPost("get_users_by_role")]
        public async Task<IActionResult> GetUsersByRole([FromBody] GetUserByRoleRequest request)
        {
            string inputRole = await _accountService.GetValidRoleAsync(request.role!);
            if (inputRole != request.role)
            {
                return BadRequest(new Response<Array>(ResponseConstants.CUSTOMERROR, "Invalid role", ResponseConstants.EMPTYDATA));
            }

            var UsersByRoleresult = await _accountService.GetUsersByRoleAsync(request.role);
            if (UsersByRoleresult.Count == 0)
            {
                return Ok(new Response<Array>(ResponseConstants.EMPTYOK, ResponseConstants.EMPTYOK_MESSAGE, ResponseConstants.EMPTYDATA));
            }
            else
            {
                return Ok(new Response<object>(UsersByRoleresult));
            }
        }


        /// <summary>
        /// To assigns role to a user.  
        /// </summary>
        /// <param>role</param>
        /// <param>userIDList</param>
        /// <param>createdByUserID</param>
        /// <returns></returns>
        [Authorize(Policy = "AdminAccess")]
        [HttpPost("add_users_to_role")]
        [IntIDValidationFilterAttribute(caseParameter = "userIDList")]
        public async Task<IActionResult> PostAddRoleToUsers(PostAddRoleToUsersRequest request)
        {
            var validationResult = await _accountService.ValidationsPostAddRoleToUsers(request);
            if (!validationResult.isValid)
            {
                return BadRequest(new Response<Array>(ResponseConstants.CUSTOMERROR, validationResult.message!, ResponseConstants.EMPTYDATA));
            }

            List<GetUsersByRoleStoredProcedureResponse> userRoleData = validationResult.userData!;
            string usersToAdd = _accountService.GetUsersToAddAndExistingUsers(userRoleData, request.userIDList!)[0];
            string existingUsers = _accountService.GetUsersToAddAndExistingUsers(userRoleData, request.userIDList!)[1];

            if (usersToAdd == "")
            {
                return BadRequest(new Response<Array>(ResponseConstants.CUSTOMERROR, "Users: " + request.userIDList + " already have role: " + request.role, ResponseConstants.EMPTYDATA));
            }
            request.userIDList = usersToAdd;
            var AddRoleToUsersRequestresult = await _accountService.PostAddRoleToUsersRequestAsync(request);
            if (AddRoleToUsersRequestresult == null || AddRoleToUsersRequestresult.Count == 0)
            {
                return Ok(new Response<Array>(ResponseConstants.EMPTYOK, ResponseConstants.EMPTYOK_MESSAGE, ResponseConstants.EMPTYDATA));
            }
            else
            {
                if (existingUsers.Length > 0)
                {
                    return Ok(new Response<object>(200, "Users: " + existingUsers + " already have role: " + request.role, AddRoleToUsersRequestresult));
                }
                else
                {
                    string token = await _accountService.GenerateNewTokenWhenAdminActionTakenAsync(User, HttpContext, Request);
                    return Ok(new TokenResponse<object>(AddRoleToUsersRequestresult, token));
                }
            }
        }

        /// <summary>
        /// To deletes role assigned to user. 
        /// </summary>
        /// <param name="request"></param>
        /// <returns></returns>
        [Authorize(Policy = "AdminAccess")]
        [HttpPost("delete_roles_for_user_id")]
        public async Task<IActionResult> DeleteRoleForUserID(DeleteRoleForUserRequest request)
        {
            string inputRole = await _accountService.GetValidRoleAsync(request.role!);
            if (inputRole != request.role)
            {
                return BadRequest(new Response<Array>(ResponseConstants.CUSTOMERROR, "Invalid role", ResponseConstants.EMPTYDATA));
            }

            int checkUserID = _accountService.GetUserCountFromEmployeeListAsync(request.userID.ToString()).Result;
            if (checkUserID == 0)
            {
                return BadRequest(new Response<Array>(ResponseConstants.CUSTOMERROR, "Invalid userID", ResponseConstants.EMPTYDATA));
            }
            var currentUserId = CommonMethod.GetEmployeeIdFromClaim(HttpContext);
            request.updatedByUserID = Convert.ToInt32(currentUserId);
            var DeleteRoletoUserresult = await _accountService.DeleteRoletoUserAsync(request);
            if (DeleteRoletoUserresult.Count == 0)
            {
                return Ok(new Response<Array>(ResponseConstants.EMPTYOK, ResponseConstants.EMPTYOK_MESSAGE, ResponseConstants.EMPTYDATA));
            }
            else
            {
                string urlRequested = this.HttpContext.Request.Path.ToString();
                await Task.Run(() => _emailServices.SendAdminActivityEmailAsync(urlRequested, request.updatedByUserID.ToString(), request.userID.ToString(), request.role!, "Delete", IsClaim: false));
                string token = await _accountService.GenerateNewTokenWhenAdminActionTakenAsync(User, HttpContext, Request);
                return Ok(new TokenResponse<object>(DeleteRoletoUserresult, token));
            }
        }


        /// <summary>
        /// To add custom users to the dashboard
        /// </summary>
        /// <param name="request"></param>
        /// <returns></returns>
        [Authorize(Policy = "AdminAccess")]
        [HttpPost("add_custom_user")]
        public async Task<IActionResult> AddUserToCustomUserTable(AddUserToCustomUserTableRequest request)
        {
            string employeeID = request.employeeID.ToString()!;
            var resultEmp = await _accountService.GetUserAccessdataByEmployeeIDAsync(employeeID);
            if(resultEmp.roles!.Count > 0 || resultEmp.features!.Count > 0)
            {
                return BadRequest(new Response<Array>(ResponseConstants.CUSTOMERROR, $"user already exists: {request.employeeID}", ResponseConstants.EMPTYDATA));
            }
            var result = await _accountService.AddUserToCustomUserTableAsync(request);
            return Ok(new Response<object>(result));
        }

        /// <summary>
        /// To add claims to users
        /// </summary>
        /// <param name="request"></param>
        /// <returns></returns>
        [Authorize(Policy = "AdminAccess")]
        [HttpPost("add_user_claim")]
        public async Task<IActionResult> AddClaimstoUser(AddClaimToUserRequest request)
        {
            var validation = await _accountService.AddClaimToUserRequestValidation(request, HttpContext);
            if (!validation.isValid)
            {
                return BadRequest(new Response<Array>(ResponseConstants.CUSTOMERROR, validation.message!, ResponseConstants.EMPTYDATA));
            }

            int createdBy = CommonMethod.GetEmployeeIdFromClaim(HttpContext);

            var result = await _accountService.AddClaimsToUsersAsync(request, createdBy);
            if (result == null || result == 0)
            {
                return BadRequest(new Response<Array>(ResponseConstants.CUSTOMERROR, $"Could not add claims for users: {request.UserId}", ResponseConstants.EMPTYDATA));
            }
           
            string urlRequested = this.HttpContext.Request.Path.ToString();
            string[] claimValues = request.Claims!.FirstOrDefault().Value.Split(',');  
            await Task.Run(() => _emailServices.SendAdminActivityEmailAsync(urlRequested, createdBy.ToString(), request.UserId!, String.Join(", ", request.Claims!.Keys), "Add", claimValues, IsClaim: true));
            string token = await _accountService.GenerateNewTokenWhenAdminActionTakenAsync(User, HttpContext, Request);
            return Ok(new TokenResponse<object>(result, token));
        }


        /// <summary>
        /// To delete claims assigned to users
        /// </summary>
        /// 
        /// <param name="request"></param>
        /// <returns></returns>
        [Authorize(Policy = "AdminAccess")]
        [HttpPost("delete_user_claim")]
        [IntIDValidationFilterAttribute(caseParameter = "claimIDList")]
        public async Task<IActionResult> DeleteClaimsFromUser(DeleteClaimFromUserRequest request)
        {
            var userId = CommonMethod.GetEmployeeIdFromClaim(HttpContext);

            request.claimIDList = request.claimIDList!.Replace(" ", "");
            if (request.claimIDList == "")
            {
                return BadRequest(new Response<Array>(ResponseConstants.CUSTOMERROR, "Input parameter is empty", ResponseConstants.EMPTYDATA));
            }
            var result = await _accountService.DeleteClaimsFromUserAsync(request, Convert.ToInt32(userId));

            string urlRequested = this.HttpContext.Request.Path.ToString();
            string[] claimValues = request.claimIDList!.Split(",");
            await Task.Run(() => _emailServices.SendAdminActivityEmailAsync(urlRequested, userId.ToString(), "", request.claimIDList!, "Delete", claimValues, IsClaim: true));
            string token = await _accountService.GenerateNewTokenWhenAdminActionTakenAsync(User, HttpContext, Request);
            return Ok(new TokenResponse<object>(result, token));
        }

        /// <summary>
        /// 
        /// </summary>
        /// <param name="request"></param>
        /// <returns></returns>
        [Authorize(Policy = "AdminAccess")]
        [HttpPost("get_um_user_by_employee_id")]
        public async Task<IActionResult> GetUserAccessdataByEmployeeID([FromBody] EmployeeIdAsStringRequest request)
        {
            string employeeID = request.employeeID!;
            var result = await _accountService.GetUserAccessdataByEmployeeIDAsync(employeeID);
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
        [Authorize(Policy = "AdminAccess")]
        [HttpPost("get_um_role_by_affiliate_id")]
        public async Task<IActionResult> GetUserDetailsWithAffiliateClaim([FromBody] AffiliateIdListClaimTypeRequest request)
        {
            var result = await _accountService.GetUserDetailsWithAffiliateClaimAsync(request);
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
        /// To Logout user
        /// </summary>
        ///
        /// <returns></returns>
        [Authorize]
        [HttpGet("logout")]
        public async Task<IActionResult> LogoutUser()
        {
            var claims = HttpContext.User.Identity as ClaimsIdentity;
            Claim? jti = claims!.Claims.FirstOrDefault(claim => claim.Type == "jti");
            Claim? uid = claims!.Claims.FirstOrDefault(claim => claim.Type == "uid");
            if (jti == null || uid == null)
            {
                return BadRequest(new Response<Array>(ResponseConstants.CUSTOMERROR, "User not logged in", ResponseConstants.EMPTYDATA));
            }
            int userID = Convert.ToInt32(uid!.Value);
            var LogoutUserResult = await _accountService.LogoutUserAsync(userID);
            if (LogoutUserResult)
            {
                return Ok(new Response<object>(LogoutUserResult));
            }
            else
            {
                return BadRequest(new Response<Array>(ResponseConstants.CUSTOMERROR, "An error occured while logging out", ResponseConstants.EMPTYDATA));
            }
        }


        /// <summary>
        /// 
        /// </summary>
        /// <param name="request"></param>
        /// <returns></returns>
        [Authorize(Policy = "AdminAccess")]
        [HttpPost("delete_user_role_claims")]
        public async Task<IActionResult> DeleteUerRoleClaimsByUserID(DeleteUerRoleClaimsByUserID request)
        {
            
           var currentUserId = CommonMethod.GetEmployeeIdFromClaim(HttpContext);
            request.updatedByUserID = Convert.ToInt32(currentUserId);
            var DeleteRoleCliamstoUserresult = await _accountService.DeleteUerRoleClaimsByUserID(request);
            if (DeleteRoleCliamstoUserresult.Count == 0)
            {
                return Ok(new Response<Array>(ResponseConstants.EMPTYOK, ResponseConstants.EMPTYOK_MESSAGE, ResponseConstants.EMPTYDATA));
            }
            else
            {
                string urlRequested = this.HttpContext.Request.Path.ToString();
                await Task.Run(() => _emailServices.SendAdminActivityEmailAsync(urlRequested, request.updatedByUserID.ToString(), request.userID.ToString(),"", "Delete", IsClaim: false));
                string token = await _accountService.GenerateNewTokenWhenAdminActionTakenAsync(User, HttpContext, Request);
                return Ok(new TokenResponse<object>(DeleteRoleCliamstoUserresult, token));
            }
        }

    }
}