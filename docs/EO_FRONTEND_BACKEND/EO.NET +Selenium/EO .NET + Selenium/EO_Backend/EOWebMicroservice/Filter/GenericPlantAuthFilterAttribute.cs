using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Newtonsoft.Json;
using EOApplication.Contracts.Services;
using EODomain.Models.Enums;
using EODomain.Common;
using EOWebMicroservice.Controllers;
using System.Diagnostics.CodeAnalysis;
using System.Net;
using System.Reflection;
using System.Security.Claims;

namespace EOWebMicroservice.Filter
{
    /// <summary>
    /// 
    /// </summary>
    [ExcludeFromCodeCoverage]
    [ExcludeFromDescription]
    [AttributeUsage(AttributeTargets.Class | AttributeTargets.Method, Inherited = true, AllowMultiple = false)]
    public class GenericPlantAuthFilterAttribute : ActionFilterAttribute, IActionFilter
    {
        /// <summary>
        /// 
        /// </summary>
        public string? claimType { get; set;}

        /// <summary>
        /// 
        /// </summary>
        public string? idParameter { get; set; }

        /// <summary>
        /// flag to check if admin role should be allowed access or not. 
        /// </summary>
        public bool skipAdmin { get; set; } = false;

        /// <summary>
        /// 
        /// </summary>
        /// <param name="context"></param>
        public override void OnActionExecuting(ActionExecutingContext context)
        {
            var model = context.ActionArguments["request"] as dynamic;
            
            var controller = context.Controller as dynamic;
            /*
            For the api update_lbm_iteration in CCP controller we don't get caseID
            directly from the model because it is nested. Hence, considering it as
            a separate if conditon.
             */
            if (idParameter == "lbmupdate")
            {
                idParameter = model!.input[0].caseID.ToString();
                if (!Authorization((ClaimsIdentity)context.HttpContext.User.Identity!, idParameter, controller).Result)
                {
                    BadRequest(context);
                }
            }
            else
            {
                if (HasProperty(model, idParameter) && !Authorization((ClaimsIdentity)context.HttpContext.User.Identity!, GetPropertyIdName(model, idParameter), controller).Result)
                {
                    BadRequest(context);
                }
            }
        }

        /// <summary>
        /// 
        /// </summary>
        /// <param name="User"></param>
        /// <param name="ids"></param>
        /// <param name="controller"></param>
        /// <returns></returns>
        public async Task<bool> Authorization(ClaimsIdentity User, string ids, dynamic controller)
        {
            ids = ids.Contains(',') ? ids + "," : ids;
            var response = false;

            var idArray = ids.Split(',');
            if (idArray.Length > 0)
            {
                response = await IsAuthorized(User, idArray, controller);
            }
            return response;
        }

        /// <summary>
        /// 
        /// </summary>
        /// <param name="User"></param>
        /// <param name="idArray"></param>
        /// <param name="controller"></param>
        /// <returns></returns>
        public async Task<bool> IsAuthorized(ClaimsIdentity User, string[] idArray, dynamic controller)
        {
            /*
            For APIs in VC controller which has caseID in input 
            and the claim is for plantID. Checking if the caseID is part of the
            plantID in claims.
            */
            if (idParameter!.Contains("caseid", StringComparison.CurrentCultureIgnoreCase) && claimType!.Equals("vc", StringComparison.CurrentCultureIgnoreCase))
            {
                var plantID = await controller._configServices.GetPlantIdByCaseId(Convert.ToInt32(idArray[0]));
                if (plantID != null && plantID != 0)
                {
                    string[] inputId = new string[] { plantID!.ToString() };
                    return CommonMethod.ProcessAuthRequest(inputId, User, skipAdmin, claimType ?? string.Empty);
                }
            }
            /*
            For APIs in VC controller which has spanID or ID in input 
            and the claim is for plantID. Checking if the spanID or ID is part of the
            plantID in claims.
            */
            else if ((idParameter.Equals("id", StringComparison.CurrentCultureIgnoreCase) || idParameter.Equals("spanid", StringComparison.CurrentCultureIgnoreCase)) && claimType!.Equals("vc", StringComparison.CurrentCultureIgnoreCase))
            {
                var plantID = await controller._configServices.GetPlantIDByVCSpanID(Convert.ToInt32(idArray[0]));
                if (plantID != null && plantID != 0)
                {
                    string[] inputId = new string[] { plantID!.ToString() };
                    return CommonMethod.ProcessAuthRequest(inputId, User, skipAdmin, claimType ?? string.Empty);
                }
            }
            /*
            For APIs in CCP controller which has caseID, causeTagID, tagID
            in input.
            */
            else if (claimType!.Equals("ccp", StringComparison.CurrentCultureIgnoreCase))
            {
               return await ProcessCcpRequests(controller, idArray, User);
            }
            return false;
        }


        /// <summary>
        /// To process CCP related claims
        /// </summary>
        /// <param name="controller"></param>
        /// <param name="idArray"></param>
        /// <param name="user"></param>
        /// <returns></returns>
        public async Task<bool> ProcessCcpRequests(dynamic controller, string[] idArray, ClaimsIdentity user)
        {
            /*
            Checking claims based on plantID associated with:
            1. causeTagID
            2. caseID
            3. tagID
            */
            if (idParameter!.Contains("causetagid", StringComparison.CurrentCultureIgnoreCase) && claimType!.Equals("ccp", StringComparison.CurrentCultureIgnoreCase))
            {
                var plantID = await controller._configServices.GetPlantIDByCauseTagIDAsync(Convert.ToInt32(idArray[0]));
                if (plantID != null && plantID != 0)
                {
                    string[] inputId = new string[] { plantID!.ToString() };
                    return CommonMethod.ProcessAuthRequest(inputId, user, skipAdmin, claimType ?? string.Empty);
                }
            }
            /*
            For update_lbm_iteration API. The request body accepts array of objects and we need
            extract caseID from the first element. 
            */
            else if (claimType!.Equals("ccp", StringComparison.CurrentCultureIgnoreCase) && (idParameter!.Contains("caseid", StringComparison.CurrentCultureIgnoreCase) || Int32.TryParse(idParameter, out _)))
            {
                var plantID = await controller._configServices.GetPlantIdByCaseId(Convert.ToInt32(idArray[0]));
                if (plantID != null && plantID != 0)
                {
                    string[] inputId = new string[] { plantID!.ToString() };
                    return CommonMethod.ProcessAuthRequest(inputId, user, skipAdmin, claimType ?? string.Empty);
                }
            }
            else if ((idParameter!.Contains("tagid", StringComparison.CurrentCultureIgnoreCase) || idParameter!.Contains("modelid", StringComparison.CurrentCultureIgnoreCase)) && claimType.Equals("ccp", StringComparison.CurrentCultureIgnoreCase))
            {
                return await ProcessTagIdAndModelIdRelatedCcpRequest(controller, idArray, user);
            }
            return false;
        }


        /// <summary>
        /// To process CCP related requests where filter is based on modelID and tagID
        /// </summary>
        /// <param name="controller"></param>
        /// <param name="idArray"></param>
        /// <param name="user"></param>
        /// <returns></returns>
        public async Task<bool> ProcessTagIdAndModelIdRelatedCcpRequest(dynamic controller, string[] idArray, ClaimsIdentity user)
        {
            if (idParameter!.Contains("tagid", StringComparison.CurrentCultureIgnoreCase) && claimType!.Equals("ccp", StringComparison.CurrentCultureIgnoreCase))
            {
                var plantID = await controller._configServices.GetPlantIDByTagIDAsync(Convert.ToInt32(idArray[0]));
                if (plantID != null && plantID != 0)
                {
                    string[] inputId = new string[] { plantID!.ToString() };
                    return CommonMethod.ProcessAuthRequest(inputId, user, skipAdmin, claimType ?? string.Empty);
                }
            }
            else if (idParameter!.Contains("modelid", StringComparison.CurrentCultureIgnoreCase) && claimType!.Equals("ccp", StringComparison.CurrentCultureIgnoreCase))
            {
                var plantID = await controller._configServices.GetPlantIDByModelIdAsync(Convert.ToInt32(idArray[0]));
                if (plantID != null && plantID != 0)
                {
                    string[] inputId = new string[] { plantID!.ToString() };
                    return CommonMethod.ProcessAuthRequest(inputId, user, skipAdmin, claimType ?? string.Empty);
                }
            }
            return false;
        }


        /// <summary>
        /// 
        /// </summary>
        /// <param name="obj"></param>
        /// <param name="propertyName"></param>
        /// <returns></returns>
        public static bool HasProperty(object obj, string propertyName)
        {
            // Get the type of the object
            Type type = obj.GetType();

            // Check if the type has a property with the given name
            PropertyInfo property = type.GetProperty(propertyName)!;
            return (property != null);
        }


        /// <summary>
        /// 
        /// </summary>
        /// <param name="obj"></param>
        /// <param name="idParameter"></param>
        /// <returns></returns>
        public static string? GetPropertyIdName(object obj, string idParameter)
        {
            Type type = obj.GetType()!;
            PropertyInfo pi = type.GetProperty(idParameter)!;
            return pi.GetValue(obj, null)!.ToString()!;
        }


        /// <summary>
        /// 
        /// </summary>
        /// <param name="filterContext"></param>
        public void BadRequest(ActionExecutingContext filterContext)
        {
            filterContext.HttpContext.Response.ContentType = "application/json";
            filterContext.HttpContext.Response.StatusCode = (int)HttpStatusCode.InternalServerError;
            var response = new Response<Array>(ResponseConstants.NOTAUTHORIZED,
                                        ResponseConstants.NOTAUTHORIZED_MESSAGE,
                                        ResponseConstants.EMPTYDATA);

            filterContext.Result = new ContentResult
            {
                StatusCode = ResponseConstants.NOTAUTHORIZED,
                ContentType = "text/json",
                Content = JsonConvert.SerializeObject(response)
            };
        }

    }
}
