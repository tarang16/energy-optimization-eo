using EOApplication.Contracts.Services;
using EODomain.Common;
using EODomain.Models.AIHub;
using EODomain.Models.LogTables;
using EODomain.Models.WinAuth;
using System.Diagnostics.CodeAnalysis;
using System.Net;
using System.Text;
using System.Text.Json;

namespace EOWebMicroservice.Middleware
{
    /// <summary>
    /// Middleware for authentication
    /// </summary>
    [ExcludeFromCodeCoverage]
    public class NegotiateAuthMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly IWinAuthServices _winAuthServices;
        private readonly IAccountServices _accountServices;

        /// <summary>
        /// 
        /// </summary>
        /// <param name="next"></param>
        /// <param name="winAuthServices"></param>
        /// <param name="accountServices"></param>
        public NegotiateAuthMiddleware(RequestDelegate next, IWinAuthServices winAuthServices, IAccountServices accountServices)
        {
            _next = next;
            _winAuthServices = winAuthServices;
            _accountServices = accountServices;
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

                if (authHeader != null && authHeader.StartsWith("negotiate", StringComparison.CurrentCultureIgnoreCase))
                {
                   await CallAuthHeaderAsync(context);
                }
                else if (authHeader == null && !context.Response.HasStarted) 
                {
                     context.Response.StatusCode = (int) HttpStatusCode.Unauthorized;
                     return;
                    
                }
            }
            catch
            {
                // Checking if response has already started before calling await _next
                if (!context.Response.HasStarted)
                {
                    context.Response.StatusCode = (int) HttpStatusCode.Unauthorized;
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
        /// <param name="context"></param>
        /// <returns></returns>
        public async Task CallAuthHeaderAsync(HttpContext context)
        {
            context.Request.EnableBuffering();
            string requestBody;
            using (StreamReader reader = new StreamReader(context.Request.Body, Encoding.UTF8, detectEncodingFromByteOrderMarks: false, bufferSize: 1024, leaveOpen: true))
            {
                requestBody = await reader.ReadToEndAsync();
            }
            context.Request.Body.Position = 0;
            var request = new GetTokenRequest();
            if (!string.IsNullOrEmpty(requestBody))
            {
                request = JsonSerializer.Deserialize<GetTokenRequest>(requestBody)!;
            }

            var currentUser = context.User.Identity!.Name;
            if (currentUser != null)
            {
                var user = await _accountServices.GetUserbyLoginIdAsync(currentUser!, context.Request.Path.ToString());
                var loginSessionData = await _winAuthServices.GetLatestLoginSessionByUserAsync(Convert.ToInt32(user.employeeId)!, context.Request.Path.ToString());
                if (loginSessionData != null)
                {
                    RequestIpBrowserVersion source = new RequestIpBrowserVersion
                    {
                        IpAddress = loginSessionData!.ipAddress,
                        BrowserName = loginSessionData?.browserName,
                        BrowserVersion = loginSessionData?.browserVersion
                    };
                    string requestIp = context.Connection.RemoteIpAddress!.ToString();
                    var isValidSource = _winAuthServices.ValidateRequestSource(requestIp, source);
                    if (!isValidSource && request.forcedLogin! == 0 && !context.Response.HasStarted)
                    {
                        context.Response.StatusCode = (int)HttpStatusCode.Conflict;
                        await context.Response.WriteAsync(ResponseConstants.CONFLICT_MESSAGE);
                        return;
                    }
                }
            }
        }
    }


    /// <summary>
    /// 
    /// </summary>
    [ExcludeFromCodeCoverage]
    // Extension method used to add the middleware to the HTTP request pipeline.
    public static class NegotiateAuthMiddlewareExtensions
    {

        /// <summary>
        /// 
        /// </summary>
        /// <param name="builder"></param>
        /// <returns></returns>
        public static IApplicationBuilder UseNegotiateAuthMiddleware(this IApplicationBuilder builder)
        {
            return builder.UseMiddleware<NegotiateAuthMiddleware>();
        }
    }
}
