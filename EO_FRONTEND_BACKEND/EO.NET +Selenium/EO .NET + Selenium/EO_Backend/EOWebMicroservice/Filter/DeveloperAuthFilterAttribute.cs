using EODomain.Common;
using EODomain.Models.Enums;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Newtonsoft.Json;
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
    [AttributeUsage(AttributeTargets.Class | AttributeTargets.Method, Inherited = true, AllowMultiple = true)]
    public class DeveloperAuthFilterAttribute : ActionFilterAttribute, IActionFilter
    {
        /// <summary>
        /// 
        /// </summary>
        public string? claimType { get; set; }

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
            return await ProcessCaseIdAuth(User, idArray, controller);
        }

        

        /// <summary>
        /// 
        /// </summary>
        /// <param name="User"></param>
        /// <param name="affiliateID"></param>
        /// <returns></returns>
        public bool ProcessAuthRequestAsync(ClaimsIdentity User,dynamic? affiliateID)
        {
            if (affiliateID != null && affiliateID != 0)
            {
                string[] inputId = new string[] { affiliateID!.ToString() };
                return CommonMethod.ProcessAuthRequest(inputId, User, skipAdmin, claimType ?? string.Empty);
            }
            return false;
        }

        /// <summary>
        /// 
        /// </summary>
        /// <param name="context"></param>
        public override void OnActionExecuting(ActionExecutingContext context)
        {
            var model = context.ActionArguments["request"] as dynamic;

            var controller = context.Controller as dynamic;

            if (HasProperty(model, idParameter) && !Authorization((ClaimsIdentity)context.HttpContext.User.Identity!, GetPropertyIdName(model, idParameter), controller).Result)
            {
                BadRequest(context);
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
            var response = false;

            ids = ids.Contains(',') ? ids + "," : ids;

            var idArray = ids.Split(',');
            if (idArray.Length > 0) response = await IsAuthorized(User, idArray, controller);
            return response;
        }


        /// <summary>
        /// 
        /// </summary>
        /// <param name="User"></param>
        /// <param name="idArray"></param>
        /// <param name="controller"></param>
        /// <returns></returns>
        public async Task<bool> ProcessCaseIdAuth(ClaimsIdentity User, string[] idArray, dynamic controller)
        {
            if (idParameter!.Contains("caseid", StringComparison.CurrentCultureIgnoreCase) && claimType!.Equals("developer", StringComparison.CurrentCultureIgnoreCase))
            {
                var affiliateID = await controller._configServices.GetAffiliateIDByCaseID(Convert.ToInt32(idArray[0]));
                return ProcessAuthRequestAsync(User, affiliateID);
            }
            if (idParameter!.Contains("derivedequationid", StringComparison.CurrentCultureIgnoreCase) && claimType!.Equals("developer", StringComparison.CurrentCultureIgnoreCase))
            {
                var affiliateID = await controller._configServices.GetAffiliateIDByDerivedEquationId(Convert.ToInt32(idArray[0]));
                return ProcessAuthRequestAsync(User, affiliateID);
            }
            if (idParameter!.Contains("variableid", StringComparison.CurrentCultureIgnoreCase) && claimType!.Equals("developer", StringComparison.CurrentCultureIgnoreCase))
            {
                var affiliateID = await controller._configServices.GetAffiliateIDByVariableId(Convert.ToInt32(idArray[0]));
                return ProcessAuthRequestAsync(User, affiliateID);
            }
            if (idParameter!.Contains("constraintid", StringComparison.CurrentCultureIgnoreCase) && claimType!.Equals("developer", StringComparison.CurrentCultureIgnoreCase))
            {
                var affiliateID = await controller._configServices.GetAffiliateIDByConstraintId(Convert.ToInt32(idArray[0]));
                return ProcessAuthRequestAsync(User, affiliateID);
            }
            if (idParameter!.Contains("modeltagid", StringComparison.CurrentCultureIgnoreCase) && claimType!.Equals("developer", StringComparison.CurrentCultureIgnoreCase))
            {
                var affiliateID = await controller._configServices.GetAffiliateIDByModelTagId(Convert.ToInt32(idArray[0]));
                return ProcessAuthRequestAsync(User, affiliateID);
            }
            if (idParameter!.Contains("objectiveid", StringComparison.CurrentCultureIgnoreCase) && claimType!.Equals("developer", StringComparison.CurrentCultureIgnoreCase))
            {
                var affiliateID = await controller._configServices.GetAffiliateIDByObjectiveId(Convert.ToInt32(idArray[0]));
                return ProcessAuthRequestAsync(User, affiliateID);
            }
            if (idParameter!.Contains("modelid", StringComparison.CurrentCultureIgnoreCase) && claimType!.Equals("developer", StringComparison.CurrentCultureIgnoreCase))
            {
                var affiliateID = await controller._configServices.GetAffiliateIDByModelId(Convert.ToInt32(idArray[0]));
                return ProcessAuthRequestAsync(User, affiliateID);
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
                                        ResponseConstants.NOT_AUTHORIZED_TO_TAKE_THIS_ACTION,
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
