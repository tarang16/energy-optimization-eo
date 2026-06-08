using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.AspNetCore.Mvc;
using EODomain.Models.Enums;
using EODomain.Common;
using System.Security.Claims;
using Newtonsoft.Json;
using System.Net;
using System.Reflection;
using System.Diagnostics.CodeAnalysis;

namespace EOWebMicroservice.Filter
{
    /// <summary>
    /// 
    /// </summary>
    [ExcludeFromCodeCoverage]
    [ExcludeFromDescription]
    [AttributeUsage(AttributeTargets.Class | AttributeTargets.Method, AllowMultiple = false, Inherited = true)]
    public class PlantIdAuthfilterAttribute : ActionFilterAttribute, IActionFilter
    {
        /// <summary>
        /// 
        /// </summary>
        /// <param name="context"></param>
        public override void OnActionExecuting(ActionExecutingContext context)
        {
            var model = context.ActionArguments["request"] as dynamic;
            if (HasProperty(model, "plantID") && !PalntIdAuthorization((ClaimsIdentity)context.HttpContext.User.Identity!, Convert.ToString(model!.plantID)))
            {
                BadRequest(context);
                
            }
            if (HasProperty(model, "plantIDList") && !PalntIdAuthorization((ClaimsIdentity)context.HttpContext.User.Identity!, Convert.ToString(model!.plantIDList)))
            {
                BadRequest(context);                
            }
        }

        /// <summary>
        /// 
        /// </summary>
        /// <param name="User"></param>
        /// <param name="plantId"></param>
        /// <returns></returns>
        public static bool PalntIdAuthorization(ClaimsIdentity User, string plantId)
        {
            var response = false;

            plantId = plantId.Contains(',') ? plantId + "," : plantId;

            var plantId_array = plantId.Split(',');
            if (plantId_array.Length > 0)
            {
                response = IsAuthorized(User, plantId_array);
            }
            return response;
        }

        /// <summary>
        /// 
        /// </summary>
        /// <param name="user"></param>
        /// <param name="plantIdArray"></param>
        /// <returns></returns>
        public static bool IsAuthorized(ClaimsIdentity user, string[] plantIdArray)
        {
            var roles = user.Claims
                .Where(c => c.Type == ClaimTypes.Role)
                .Select(c => c.Value)
                .ToList();

            // if admin or corporate role exists, always authorized
            if (roles.Contains(Roles.admin.ToString()) || roles.Contains(Roles.corporate.ToString()))
            {
                return true;
            }

            const string plantClaims = "plantClaims";

            // check if *all* provided non-empty plantIds exist in claims
            return plantIdArray
                .Where(pid => !string.IsNullOrEmpty(pid))
                .All(pid => user.Claims.Any(c => c.Type == plantClaims && c.Value == pid));
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
        /// <param name="filterContext"></param>
        public void BadRequest(ActionExecutingContext filterContext)
        {
            filterContext.HttpContext.Response.StatusCode = (int)HttpStatusCode.InternalServerError;
            filterContext.HttpContext.Response.ContentType = "application/json";
            
            var badResponse = new Response<Array>(ResponseConstants.NOTAUTHORIZED,
                ResponseConstants.NOTAUTHORIZED_MESSAGE,
           ResponseConstants.EMPTYDATA);

            filterContext.Result = new ContentResult
            {
                Content = JsonConvert.SerializeObject(badResponse),
                ContentType = "text/json",
                StatusCode = ResponseConstants.NOTAUTHORIZED
            };
        }
    }
}
