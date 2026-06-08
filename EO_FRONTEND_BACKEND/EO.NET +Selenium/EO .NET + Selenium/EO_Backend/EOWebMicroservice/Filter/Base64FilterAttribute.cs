using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using System.Diagnostics.CodeAnalysis;
using System.Reflection;
using System.Text.RegularExpressions;

namespace EOWebMicroservice.Filter
{
    /// <summary>
    /// 
    /// </summary>
    [ExcludeFromCodeCoverage]
    [ExcludeFromDescription]
    [AttributeUsage(AttributeTargets.Class | AttributeTargets.Method, Inherited = true, AllowMultiple = false)]
    public  class Base64FilterAttribute : ActionFilterAttribute
    {
        private readonly string[] _params;

        /// <summary>
        /// 
        /// </summary>
        /// <param name="parameters"></param>
        // Constructor accepting parameters for base64 validation
        public Base64FilterAttribute(params string[] parameters)
        {
            _params = parameters;
        }

        /// <summary>
        /// 
        /// </summary>
        /// <param name="context"></param>
        public override void OnActionExecuting(ActionExecutingContext context)
        {
            foreach (var arg in context.ActionArguments.Values)
            {
                if (arg == null)
                {
                    continue;
                }

                var type = arg.GetType();

                // Loop through the specified properties to validate
                foreach (var propertyName in _params)
                {
                    // Use reflection to get the property value
                    PropertyInfo propInfo = type.GetProperty(propertyName)!;

                    if (propInfo != null)
                    {
                        var value = propInfo.GetValue(arg) as string;

                        if (value != null && !IsBase64String(value))
                        {
                            context.Result = new ContentResult
                            {
                                Content = $"Property '{propertyName}' is not a valid base64 string.",
                                StatusCode = 400
                            };
                            return;
                        }
                    }
                    else
                    {
                        context.Result = new ContentResult
                        {
                            Content = $"Property '{propertyName}' not found in the request model.",
                            StatusCode = 400
                        };
                        return;
                    }
                }
            }

            base.OnActionExecuting(context);
        }

        
        private static bool IsBase64String(string value)
        {
            if (string.IsNullOrEmpty(value))
                return false;


            if (value.Length % 4 != 0)
                return false;

            var base64Regex = @"^[a-zA-Z0-9\+/]*={0,2}$";
            // not condition `!`
            if (!System.Text.RegularExpressions.Regex.IsMatch(value, base64Regex, RegexOptions.None, TimeSpan.FromMilliseconds(100)))
            {
                return false;
            }


            int bytesParsed;
            try
            {
                Span<byte> buffer = new Span<byte>(new byte[value.Length]);
                bool result= Convert.TryFromBase64String(value, buffer, out bytesParsed);
                if (result)
                    return true;
                else
                    return false;
            }
            catch (FormatException)
            {
                return false;
            }
        }
    }
}
