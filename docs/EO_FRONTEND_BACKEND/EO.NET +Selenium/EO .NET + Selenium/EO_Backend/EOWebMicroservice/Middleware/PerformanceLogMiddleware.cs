using System.Diagnostics;
using EODomain.Common;
using EOApplication.Contracts.Services;
using System.Security.Claims;
using System.Text;
using EODomain.Models.LogTables;
using System.Diagnostics.CodeAnalysis;

namespace EOWebMicroservice.Middleware
{
    /// <summary>
    /// Middlewar to log performance of apis
    /// </summary>
    // You may need to install the Microsoft.AspNetCore.Http.Abstractions package into your project
    [ExcludeFromCodeCoverage]
    public class PerformanceLogMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger _logger;
        private readonly ILoggingServices _loggingServices;

        /// <summary>
        /// 
        /// </summary>
        /// <param name="next"></param>
        /// <param name="logger"></param>
        /// <param name="loggingServices"></param>
        public PerformanceLogMiddleware(RequestDelegate next, 
                                    ILogger<PerformanceLogMiddleware> logger, 
                                    ILoggingServices loggingServices)
        {
            _next = next;
            _logger = logger;
            _loggingServices = loggingServices;
        }

        /// <summary>
        /// 
        /// </summary>
        /// <param name="httpContext"></param>
        /// <returns></returns>
        [ExcludeFromCodeCoverage]
        public async Task Invoke(HttpContext httpContext)
        {
            
            var stopwatch = Stopwatch.StartNew();
            // Checking if response has already started or not. If yes then not setting anything.
            if (!httpContext.Response.HasStarted)
            {
                httpContext.Response.OnStarting(() =>
                {
                    httpContext.Response.Headers["X-Request-Duration"] = stopwatch.Elapsed.TotalMilliseconds.ToString();
                    return Task.CompletedTask;
                });
            }

            httpContext.Request.EnableBuffering();
            // get request body
            string requestBody;
            using (StreamReader reader = new StreamReader(httpContext.Request.Body, Encoding.UTF8, detectEncodingFromByteOrderMarks: false, bufferSize: 1024, leaveOpen: true))
            {
                requestBody = await reader.ReadToEndAsync();
            }
            httpContext.Request.Body.Position = 0;

            // Not doing _next(httpContext) if response has already started.
            if (!httpContext.Response.HasStarted)
            {
                await _next(httpContext);
            }

            // check for username in JWT 
            var claims = httpContext.User.Identity as ClaimsIdentity;
            Claim? claimUID = claims!.Claims.FirstOrDefault(claim => claim.Type == "uid");
            string userID = claimUID != null ? claimUID.Value : CommonMethod.GetUserName(httpContext.User.Claims);
            Claim? JTI = claims!.Claims.FirstOrDefault(claim => claim.Type == "jti");
            string? SessionID = JTI == null ? "" : JTI.Value.ToString();
            if (userID == null || userID == String.Empty)
            {
                var userName= claims.Name == null ? "NA" : claims.Name.ToString() ;
                if (userName.Contains("//"))
                {
                    var userList = userName.Split("//");
                    userName = userList[userList.Length - 1];
                }
                if (userName.Contains('\\'))
                {
                    var userList = userName.Split("\\");
                    userName = userList[userList.Length - 1];
                }
                userID = userName;
            }
                       

            var httpMethod = httpContext.Request.Method;
            var requestPath = httpContext.Request.Path;   
            var statusCode = httpContext.Response.StatusCode;

            _logger.LogInformation("Request: {RequestPath}", requestPath);
            _logger.LogInformation("Duration: {Duration} ms", stopwatch.Elapsed.TotalMilliseconds);
            

            //centralized api performance  logging
            LogApiPerformanceLogs lOG_APIPerformanceLogs = new LogApiPerformanceLogs();
            lOG_APIPerformanceLogs.Createdby = userID;
            lOG_APIPerformanceLogs.EndPointName = requestPath;
            lOG_APIPerformanceLogs.ElapsedTime = stopwatch.Elapsed.ToString();
            lOG_APIPerformanceLogs.customMessage = null!;
            lOG_APIPerformanceLogs.RoleID = null!;
            lOG_APIPerformanceLogs.SessionID = SessionID;
            lOG_APIPerformanceLogs.LayerID = null;
            lOG_APIPerformanceLogs.HttpMethod = httpMethod;
            lOG_APIPerformanceLogs.StatusCode = statusCode;
            lOG_APIPerformanceLogs.RequestBody = requestBody;
            lOG_APIPerformanceLogs.RequestTimeStamp = System.DateTime.UtcNow;
            lOG_APIPerformanceLogs.ResponseBody = null;
            lOG_APIPerformanceLogs.ResponseTimeStamp = null;
            lOG_APIPerformanceLogs.LayerName = "backend";

            await _loggingServices.AddAPIPerformanceLog(lOG_APIPerformanceLogs);
        }

    }

    /// <summary>
    /// 
    /// </summary>
    // Extension method used to add the middleware to the HTTP request pipeline.
    [ExcludeFromCodeCoverage]
    public static class PerformanceLogMiddlewareExtensions
    {
        /// <summary>
        /// 
        /// </summary>
        /// <param name="builder"></param>
        /// <returns></returns>
        public static IApplicationBuilder UsePerformanceLogMiddleware(this IApplicationBuilder builder)
        {
            return builder.UseMiddleware<PerformanceLogMiddleware>();
        }
    }
}
