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
    [ExcludeFromDescription]
    [AttributeUsage(AttributeTargets.Class | AttributeTargets.Method, AllowMultiple = false, Inherited = true)]


    public class AffiliateAuthFilterAttribute : ActionFilterAttribute, IActionFilter
    {
        /// <summary>
        /// 
        /// </summary>
        /// <param name="context"></param>
        public override void OnActionExecuting(ActionExecutingContext context)
        {
            var model = context.ActionArguments["request"] as dynamic;
            if (HasProperty(model, "affiliateID") && !AffiliateIdAuthorization((ClaimsIdentity)context.HttpContext.User.Identity!, Convert.ToString(model!.affiliateID)))
            {

                BadRequest(context);
            }
            if (HasProperty(model, "affiliateIDList") && !AffiliateIdAuthorization((ClaimsIdentity)context.HttpContext.User.Identity!, Convert.ToString(model!.affiliateIDList)))
            {
                BadRequest(context);
            }
        }

        /// <summary>
        /// 
        /// </summary>
        /// <param name="User"></param>
        /// <param name="affiliateID"></param>
        /// <returns></returns>
        public static bool AffiliateIdAuthorization(ClaimsIdentity User, string affiliateID)
        {
            var response = false;
            if (affiliateID == null)
            {
                return true;
            }
            if (!affiliateID.Contains(','))
            {
                affiliateID = affiliateID + ",";
            }
            var affiliate_id_array = affiliateID.Split(',');
            if (affiliate_id_array.Length > 0)
            {
                response = IsAuthorized(User, affiliate_id_array);
            }
            return response;
        }

        /// <summary>
        /// 
        /// </summary>
        /// <param name="user"></param>
        /// <param name="affiliateIdArray"></param>
        /// <returns></returns>
        public static bool IsAuthorized(ClaimsIdentity user, string[] affiliateIdArray)
        {
            if (user == null || affiliateIdArray == null || affiliateIdArray.Length == 0)
                return false;

            var roles = user.Claims
                .Where(c => c.Type == ClaimTypes.Role)
                .Select(c => c.Value)
                .ToList();

            // ✅ Admins and corporates are always authorized
            if (roles.Contains(Roles.admin.ToString()) || roles.Contains(Roles.corporate.ToString()))
                return true;

            const string affiliateClaims = "affiliate";

            // ✅ Check if any affiliate claim matches one of the provided IDs
            return affiliateIdArray
                .Where(id => !string.IsNullOrEmpty(id))
                .Any(id => user.Claims.Any(c => c.Type == affiliateClaims && c.Value == id));
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
