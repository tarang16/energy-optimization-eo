using EOApplication.Contracts.Services;
using System.Diagnostics.CodeAnalysis;
using System.Net;
using System.Security.Claims;
using EODomain.Common;
using EODomain.Models.LogTables;
using System.Text;
using System.Text.Json;
using EODomain.Models.ValidationModels;
using EODomain.Models.WinAuth;
using EODomain.Models.Account;
using EODomain.Models.AIHub;
using System.ComponentModel.DataAnnotations;

namespace EOWebMicroservice.Middleware
{
    /// <summary>
    /// Middleware for authentication
    /// </summary>
    [ExcludeFromCodeCoverage]
    public class BearerAuthMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly IAccountServices _accountServices;

        /// <summary>
        /// 
        /// </summary>
        /// <param name="next"></param>
        /// <param name="accountServices"></param>
        public BearerAuthMiddleware(RequestDelegate next, IAccountServices accountServices)
        {
            _next = next;
            _accountServices = accountServices;
        }


        /// <summary>
        /// 
        /// </summary>
        /// <param name="context"></param>
        /// <returns></returns>
        public ValidateRoleClaimsAndIpRequest GetInfoFromClaims(HttpContext context)
        {
            var claims = context.User.Identity as ClaimsIdentity;

            Claim? claimUID = claims!.Claims.FirstOrDefault(claim => claim.Type == "uid");
            Claim? claimsIP = claims!.Claims.FirstOrDefault(claim => claim.Type == "cip");
            Claim? tokenId = claims!.Claims.FirstOrDefault(claim => claim.Type == "tokenGuid");
            Claim? roleClaim = claims!.Claims.FirstOrDefault(claim => claim.Type.Contains("role"));
            var userID = Convert.ToInt32(claimUID!.Value);
            var tokenGuid = tokenId!.Value;
            var tokenIp = claimsIP!.Value;
            string requestIp = context.Connection.RemoteIpAddress!.ToString();
            var tokenRole = roleClaim!.Value;

            ValidateRoleClaimsAndIpRequest response = new ValidateRoleClaimsAndIpRequest
            {
                userID = userID,
                tokenGuid = tokenGuid,
                requestIp = requestIp,
                tokenIp = tokenIp,
                tokenRole = tokenRole,
            };
            return response;
        }


        /// <summary>
        /// 
        /// </summary>
        /// <param name="validationInput"></param>
        /// <param name="context"></param>
        /// <returns></returns>
        public async Task<int> ValidateRoleClaimsAndIp(ValidateRoleClaimsAndIpRequest validationInput, HttpContext context)
        {
            int ID = Convert.ToInt32(validationInput.userID);
            var userDetails = await _accountServices.GetTokenAuthorizationDataAsync(ID, validationInput.tokenGuid, context);
            

            IsValidSourceInput validationRequest = new IsValidSourceInput
            {
                tokenIp = validationInput.tokenIp,
                requestIp = validationInput.requestIp,
            };

            // if IP address in JWT and Request source different then return Unauthorized 
            bool isValidIpRequest = CommonMethod.IsValidSource(validationRequest);
            // if invalid source and response has not started
            if (!isValidIpRequest)
            {
                return 401;
            }

            // Checks if the role assigned to user or the claims issued to user has changed
            // when the token was generated vs when the request using the token is made. 
            bool isValidRoleOrClaim = await IsValidRoleOrClaim(validationInput: validationInput, userDetails: userDetails, context);
            if (!isValidRoleOrClaim)
            {
                return 498;
            }

            var loginSessionData = userDetails.tokenInfo;
            // Checking if user has active session
            if (loginSessionData!.isActive == 1 && loginSessionData!.endTime == null && loginSessionData.startTime != null && loginSessionData.isOnline == 1)
            {
                return 200;
            }
            return 401;
        }


        /// <summary>
        /// To check if the user role or claims have changed. 
        /// </summary>
        /// <returns></returns>
        public async Task<bool> IsValidRoleOrClaim(ValidateRoleClaimsAndIpRequest validationInput, GetTokenAuthorizationDataStoredProcedureResponse userDetails, HttpContext context)
        {
            var currentUserRole = userDetails.userRole;
            

            var allUserClaims = userDetails.allClaims;

            // if user role in token and currently in database are different then return Forbidden.
            if (validationInput.tokenRole != currentUserRole!.name)
            {
                return false;
            }
            // for each claim type in allUserClaims, check if the corresponding claim exists in the token
            var claims = context.User.Identity as ClaimsIdentity;
            var urlRequested = context.Request.Path;
            var claimsToCheck = await _accountServices.GetValidClaimTypes(urlRequested);
            foreach (var claim in claimsToCheck)
            {
                List<int> tokenClaims = claims!.Claims
                                .Where(item => item.Type.Equals(claim!, StringComparison.InvariantCultureIgnoreCase))
                                .Select(v => Convert.ToInt32(v.Value))
                                .ToList();
                List<int> userClaims = allUserClaims!
                                .Where(item => item.claimType!.Equals(claim!, StringComparison.InvariantCultureIgnoreCase))
                                .Select(v => Convert.ToInt32(v.claimValue))
                                .ToList();
                if (userClaims.Count <= 0 && tokenClaims.Count <= 0)
                {
                    continue;
                }
                else if (userClaims.Count > 0 && tokenClaims.Count <= 0)
                {
                    return false;
                }
                else if (userClaims.Count <= 0 && tokenClaims.Count > 0)
                {
                    return false;
                }
                else if (tokenClaims!.Count > 0 && userClaims!.Count > 0)
                {
                    tokenClaims!.Sort();
                    userClaims!.Sort();
                    // if sequences do not match, return false
                    if (!Enumerable.SequenceEqual(tokenClaims, userClaims))
                    {
                        return false;
                    }
                }
            }
            return true;
        }


        /// <summary>
        /// This is the main method which gets the HttpContext and is used for validations. 
        /// </summary>
        /// <param name="context"></param>
        /// <returns></returns>
        public async Task InvokeAsync(HttpContext context)
        {
            try
            {
                string authHeader = context.Request.Headers.Authorization!;
                if (authHeader != null && authHeader.StartsWith("bearer", StringComparison.CurrentCultureIgnoreCase))
                {
                    var validationInput = GetInfoFromClaims(context);
                    var validationResult = await ValidateRoleClaimsAndIp(validationInput, context);
                    await checkValidateResult(validationResult, context);
                }
            }
            catch
            {
                // Checking if response has already started before calling await _next
                if (!context.Response.HasStarted)
                {
                    context.Response.StatusCode = (int)HttpStatusCode.Unauthorized;
                    return;
                }
            }
            finally
            {
                // Checking if response has already started before calling await _next
                if (!context.Response.HasStarted)
                {
                    await _next(context);
                }
            }
        }

        /// <summary>
        /// 
        /// </summary>
        /// <param name="validationResult"></param>
        /// <param name="context"></param>
        /// <returns></returns>
        public async Task checkValidateResult(int validationResult, HttpContext context)
        {
            // if IP address in JWT and Request source different then return Unauthorized
            if (validationResult == 401 && !context.Response.HasStarted)
            {
                context.Response.StatusCode = 401;
                await context.Response.WriteAsync("Unauthorized");
                return;
            }

            // if user role or claims in token and currently in database are different then return Forbidden.
            if (validationResult == 498 && !context.Response.HasStarted)
            {
                context.Response.ContentType = "application/json";
                context.Response.StatusCode = 498;
                var response = new Response<Array>(context.Response.StatusCode,
                   ResponseConstants.ACCESSCHANGED_MESSAGE,
                    ResponseConstants.EMPTYDATA);
                await context.Response.WriteAsync(Newtonsoft.Json.JsonConvert.SerializeObject(response));
                return;
            }

            if (validationResult == 200 && !context.Response.HasStarted)
            {
                await _next(context);
            }
            // Checking if response has already started before calling await _next
            if (!context.Response.HasStarted)
            {
                context.Response.StatusCode = 401;
                await context.Response.WriteAsync("Unauthorized");
                
            }
        }
    }


    /// <summary>
    /// 
    /// </summary>
    [ExcludeFromCodeCoverage]
    // Extension method used to add the middleware to the HTTP request pipeline.
    public static class BearerAuthMiddlewareExtensions
    {

        /// <summary>
        /// 
        /// </summary>
        /// <param name="builder"></param>
        /// <returns></returns>
        public static IApplicationBuilder UseBearerAuthMiddleware(this IApplicationBuilder builder)
        {
            return builder.UseMiddleware<BearerAuthMiddleware>();
        }
    }
}
