using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Newtonsoft.Json;
using EOApplication.Contracts.Services;
using EODomain.Common;
using EOWebMicroservice.Controllers;
using System;
using System.Diagnostics.CodeAnalysis;
using System.Net;
using System.Reflection;
using System.Security.Claims;
using EODomain.Models.Enums;

namespace EOWebMicroservice.Filter
{
    /// <summary>
    /// 
    /// </summary>
    [ExcludeFromCodeCoverage]
    [ExcludeFromDescription]
    [AttributeUsage(AttributeTargets.Class | AttributeTargets.Method, Inherited = true, AllowMultiple = true)]
    public class CaseIdAuthfilterAttribute : ActionFilterAttribute, IActionFilter
    {
        

        /// <summary>
        /// 
        /// </summary>
        /// <param name="User"></param>
        /// <param name="caseId"></param>
        /// <returns></returns>
        public static bool CaseIdAuthorization(ClaimsIdentity User, string caseId)
        {
            var response = false;
            if (caseId == null)
            {
                return true;
            }
            if (!caseId.Contains(','))
            {
                caseId = caseId + ",";
            }
            var case_id_array = caseId.Split(',');
            if (case_id_array.Length > 0)
            {
                response = IsAuthorized(User, case_id_array);
            }
            return response;
        }

        /// <summary>
        /// 
        /// </summary>
        /// <param name="user"></param>
        /// <param name="caseIdArray"></param>
        /// <returns></returns>
        public static bool IsAuthorized(ClaimsIdentity user, string[] caseIdArray)
        {
            if (user == null || caseIdArray == null || caseIdArray.Length == 0)
                return false;

            var roles = user.Claims
                .Where(c => c.Type == ClaimTypes.Role)
                .Select(c => c.Value)
                .ToList();

            // Admin or corporate role always has access
            if (roles.Contains(Roles.admin.ToString()) || roles.Contains(Roles.corporate.ToString()))
                return true;

            const string caseClaims = "readClaims";

            // Check if ALL case IDs are present in claims
            return caseIdArray
                .Where(caseId => !string.IsNullOrEmpty(caseId))
                .All(caseId =>
                    user.Claims.Any(c => c.Type == caseClaims && c.Value == caseId));
        }



        /// <summary>
        /// 
        /// </summary>
        /// <param name="context"></param>
        public override void OnActionExecuting(ActionExecutingContext context)
        {
            var model = context.ActionArguments["request"] as dynamic;
            if (HasProperty(model, "caseID") && !CaseIdAuthorization((ClaimsIdentity)context.HttpContext.User.Identity!, Convert.ToString(model!.caseID)))
            {

                BadRequest(context);
            }
            if (HasProperty(model, "caseIDList") && !CaseIdAuthorization((ClaimsIdentity)context.HttpContext.User.Identity!, Convert.ToString(model!.caseIDList)))
            {
                BadRequest(context);
            }
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
            if (obj == null)
            {
                return true;
            }
            Type type = obj.GetType();

            // Check if the type has a property with the given name
            PropertyInfo property = type.GetProperty(propertyName)!;
            return (property != null);
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
