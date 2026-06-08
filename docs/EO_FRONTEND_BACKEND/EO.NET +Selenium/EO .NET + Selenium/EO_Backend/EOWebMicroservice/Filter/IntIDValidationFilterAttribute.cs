using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Newtonsoft.Json;
using EODomain.Common;
using System.Diagnostics.CodeAnalysis;
using System.Net;
using System.Reflection;

namespace EOWebMicroservice.Filter
{
    /// <summary>
    /// 
    /// </summary>
    [ExcludeFromCodeCoverage]
    [AttributeUsage(AttributeTargets.Class | AttributeTargets.Method, Inherited = true, AllowMultiple = false)]
    public class IntIDValidationFilterAttribute : ActionFilterAttribute, IActionFilter
    {
        /// <summary>
        /// 
        /// </summary>
        public string? caseParameter { get; set; }

        /// <summary>
        /// 
        /// </summary>
        /// <param name="context"></param>
        public override void OnActionExecuting(ActionExecutingContext context)
        {
            var model = context.ActionArguments["request"] as dynamic;

            // To be done: Check if the required service exists in the controller

            if (HasProperty(model, caseParameter) && !ValidId(GetPropertyIdName(model, caseParameter)))
            {
                BadRequest(context);
            }
        }


        /// <summary>
        /// 
        /// </summary>
        /// <param name="idList"></param>
        /// <returns></returns>
        public static bool ValidId(string idList)
        {
            var response = false;
            var idArray = idList.Split(',');
            if (idArray.Length > 0)
            {
                response = IsValid(idArray);
            }
            return response;
        }


        /// <summary>
        /// To check if the array of ID is valid
        /// </summary>
        /// <param name="idArray"></param>
        /// <returns></returns>
        public static bool IsValid(string[] idArray)
        {
            return !idArray
                .Where(ID => !string.IsNullOrEmpty(ID))
                .Any(ID => !int.TryParse(ID, out _));
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
            Type typeOne = obj.GetType();

            // Check if the type has a property with the given name
            PropertyInfo propertyOne = typeOne.GetProperty(propertyName)!;
            return (propertyOne != null);
        }

        /// <summary>
        /// 
        /// </summary>
        /// <param name="obj"></param>
        /// <param name="idParameter"></param>
        /// <returns></returns>
        public static string? GetPropertyIdName(object obj, string idParameter)
        {
            Type typeTwo = obj.GetType()!;
            PropertyInfo piOne = typeTwo.GetProperty(idParameter)!;
            return piOne.GetValue(obj, null)!.ToString()!;
        }

        /// <summary>
        /// 
        /// </summary>
        /// <param name="filterContext"></param>
        public void BadRequest(ActionExecutingContext filterContext)
        {
            filterContext.HttpContext.Response.ContentType = "application/json";
            filterContext.HttpContext.Response.StatusCode = (int)HttpStatusCode.InternalServerError;
            var response = new Response<Array>(ResponseConstants.CUSTOMERROR,
                                        ResponseConstants.INVALID_ID_TYPE,
                                        ResponseConstants.EMPTYDATA);

            filterContext.Result = new ContentResult
            {
                StatusCode = ResponseConstants.CUSTOMERROR,
                ContentType = "text/json",
                Content = JsonConvert.SerializeObject(response)
            };
        }
    }
}