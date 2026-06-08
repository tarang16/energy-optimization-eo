using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Infrastructure;
using Newtonsoft.Json;
using EOApplication.Contracts.Services;
using EODomain.Common;
using EODomain.Models.LogTables;
using Microsoft.Data.SqlClient;
using System.Diagnostics;
using System.Diagnostics.CodeAnalysis;
using System.Net;
using System.Security.Claims;
using System.Text;

namespace EOWebMicroservice.Middleware
{
    /// <summary>
    /// Middleware to handle exceptions
    /// </summary>
    [ExcludeFromCodeCoverage]
    public class GlobalExceptionMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILoggingServices _loggingServices;
        private readonly string _rmBaseUrl;
        private readonly string _piBaseUrl;

        /// <summary>
        /// 
        /// </summary>
        /// <param name="next"></param>
        /// <param name="loggingServices"></param>
        /// <param name="configuration"></param>
        public GlobalExceptionMiddleware(RequestDelegate next, ILoggingServices loggingServices, IConfiguration configuration)
        {
            _loggingServices = loggingServices;
            _next = next;
            _rmBaseUrl = configuration.GetConnectionString("RapidMinerAIHubBaseURL")!;
            _piBaseUrl = configuration.GetConnectionString("PiWebApiBaseURL")!;
        }

        /// <summary>
        /// 
        /// </summary>
        /// <param name="context"></param>
        /// <returns></returns>
        public async Task InvokeAsync(HttpContext context)
        {
            var stopwatch = Stopwatch.StartNew();
            try
            {
                if (!context.Response.HasStarted)
                {
                    await _next(context);
                    stopwatch.Stop();
                }
            }
            catch (TimeoutException ex)
            {
                string elapsedTime = stopwatch.Elapsed.ToString(@"hh\:mm\:ss\.fff");
                stopwatch.Stop();
                await AddErrorLog(context, ex, elapsedTime);
                await HandleTimeoutExceptionAsync(context, ex);
            }
            catch (AccessViolationException avEx)
            {
                string elapsedTime = stopwatch.Elapsed.ToString(@"hh\:mm\:ss\.fff");
                stopwatch.Stop();
                await AddErrorLog(context, avEx, elapsedTime);
                await HandleExceptionAsync(context, avEx);
            }
            catch (Exception ex)
            {
                if (context != null)
                {
                    string elapsedTime = stopwatch.Elapsed.ToString(@"hh\:mm\:ss\.fff");
                    stopwatch.Stop();
                    // LOCAL DEV: tee the exception to stdout so we can see the root cause
                    // in the terminal without tailing the LogErrorLogs table.
                    Console.Error.WriteLine($"\n[GlobalException] {context.Request.Method} {context.Request.Path}\n  {ex.GetType().FullName}: {ex.Message}\n{ex.StackTrace}\n");
                    if (ex.InnerException != null)
                    {
                        Console.Error.WriteLine($"  INNER: {ex.InnerException.GetType().FullName}: {ex.InnerException.Message}\n{ex.InnerException.StackTrace}\n");
                    }
                    await AddErrorLog(context, ex, elapsedTime);
                    await HandleExceptionAsync(context, ex);
                }
            }

        }


        private static Task HandleTimeoutExceptionAsync(HttpContext context, TimeoutException ex)
        {
            context.Response.ContentType = "application/json";            
            context.Response.StatusCode = (int)HttpStatusCode.RequestTimeout;
            var response = new Response<Array>(context.Response.StatusCode,
                ex.Message + "\n" + ex.StackTrace,
                ResponseConstants.EMPTYDATA);


            return context.Response.WriteAsync(JsonConvert.SerializeObject(response));
        }

        private static Task HandleExceptionAsync(HttpContext context, Exception ex)
        {
            context.Response.ContentType = "application/json";
            context.Response.StatusCode = (int)HttpStatusCode.InternalServerError;
            var response = new Response<Array>(context.Response.StatusCode,
                ex.Message,
                ResponseConstants.EMPTYDATA);

            return context.Response.WriteAsync(JsonConvert.SerializeObject(response));
        }

        /// <summary>
        /// 
        /// </summary>
        /// <param name="context"></param>
        /// <returns></returns>
        public static string GetCurrentSession(HttpContext context)
        {
            var claims = context.User.Identity as ClaimsIdentity;
            Claim? claimUID = claims!.Claims.FirstOrDefault(claim => claim.Type == "uid");
            var userId = claimUID != null ? claimUID.Value : CommonMethod.GetUserName(context.User.Claims);
            Claim? JTI = claims!.Claims.FirstOrDefault(claim => claim.Type == "jti");
            var sessionId = JTI == null ? "" : JTI.Value.ToString();

            if (userId == null || userId == string.Empty)
            {
                var userName = claims.Name!.ToString();
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
                userId = userName;
            }

            return userId + ":" + sessionId;
        }


        /// <summary>
        /// 
        /// </summary>
        /// <param name="context"></param>
        /// <param name="ex"></param>
        /// <param name="duration"></param>
        /// <returns></returns>
        public async Task AddErrorLog(HttpContext context, Exception ex, string? duration = null)
        {
            // LOCAL DEV HARDENING: only set status if the response hasn't been flushed yet,
            // and fall back to 0 for non-numeric user ids (e.g. "NA" before login).
            if (!context.Response.HasStarted)
            {
                context.Response.StatusCode = (int)HttpStatusCode.InternalServerError;
            }
            var sqlEx = ex.GetType().ToString().Contains("Sql") ? (SqlException)ex : null;

            var session = GetCurrentSession(context);
            var userId = context != null ? session.Split(':')[0] : string.Empty;
            var sessionId = context != null ? session.Split(':')[1] : string.Empty;
            string requestBody = context != null ? await GetRawBodyAsync(context.Request) : "NA";
            string errorSeverity = GetErrorSeverity(ex);
            int parsedUserId = int.TryParse(userId, out var uid) ? uid : 0;
            var model = new LogErrorLogs()
            {
                EmployeeId = parsedUserId,
                ApplicationName = Path.GetFileNameWithoutExtension(System.Reflection.Assembly.GetExecutingAssembly().Location).ToString(),
                HostName = Environment.MachineName,
                LayerName = "backend",
                API = context! == null ? null! : $"{context!.Request.Path}",
                StoredProcedure = sqlEx != null ? sqlEx.Procedure : "NA",
                ErrorNumber = sqlEx != null ? sqlEx.Number.ToString() : "NA",
                ErrorState = sqlEx != null ? sqlEx.State.ToString() : "NA",
                ErrorSeverity = errorSeverity,
                StackTraceId = ex.HResult.ToString(),
                StackTrace = ex.StackTrace,
                ErrorType = ex.GetType().ToString(),
                ErrorMessage = ex.Message,
                SessionId = sessionId,
                RequestBody = requestBody,
                CreatedBy = parsedUserId,
                UpdatedBy = parsedUserId,
                CreatedOn = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss"),
                UpdatedOn = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss"),
                StatusCode = context != null ? context.Response.StatusCode : null,
                WebServer = Environment.MachineName,
                Duration = duration
            };
            await _loggingServices.AddErrorLogAsync(model);
        }


        /// <summary>
        /// 
        /// </summary>
        /// <param name="error"></param>
        /// <returns></returns>
        public static BadRequestObjectResult BadRequest([ActionResultObjectValue] object? error)
        {
            return new BadRequestObjectResult(error);
        }


        /// <summary>
        /// 
        /// </summary>
        /// <param name="request"></param>
        /// <param name="encoding"></param>
        /// <returns></returns>
        private static async Task<string> GetRawBodyAsync(HttpRequest request, Encoding? encoding = null)
        {
            // LOCAL DEV HARDENING: Kestrel's HttpRequestStream is not seekable unless
            // EnableBuffering() was called earlier in the pipeline. If we blindly set
            // request.Body.Position = 0 in the catch path we throw NotSupportedException,
            // which masks the ORIGINAL exception we are trying to log. Guard every access
            // and swallow any failure so the real error surfaces in the console / DB.
            try
            {
                if (request?.Body == null)
                {
                    return "NA";
                }
                if (request.Body.CanSeek)
                {
                    request.Body.Position = 0;
                }
                using var reader = new StreamReader(request.Body, encoding ?? Encoding.UTF8,
                    detectEncodingFromByteOrderMarks: false, bufferSize: 1024, leaveOpen: true);
                string body = await reader.ReadToEndAsync().ConfigureAwait(false);
                if (request.Body.CanSeek)
                {
                    request.Body.Position = 0;
                }
                return body;
            }
            catch
            {
                return "NA";
            }
        }


        /// <summary>
        /// Method to categorise errors by severity
        /// </summary>
        /// <param name="exception"></param>
        /// <returns></returns>
        public string GetErrorSeverity(Exception exception)
        {
            string exceptionString = exception.ToString().ToLower();
            List<string> criticalSeverity = new List<string>()
            {
                _rmBaseUrl,
                _piBaseUrl,
                "cannot open database",
            };
            // LOCAL DEV: _rmBaseUrl and _piBaseUrl are null when config is blank.
            // string.Contains(null) throws ArgumentNullException in .NET 8.
            criticalSeverity.RemoveAll(string.IsNullOrEmpty);
            List<string> highSeverity = new List<string>
            {
                "login",
                "could not find stored procedure",
                "cannot continue the execution",
                "procedure or function",
                "no policy found",
                "no such host is known",
                "a connection attempt failed because the"
            };

            List<string> mediumSeverity = new List<string>
            {
                "connection timeout expired",
                "deadlocked",
                "error parsing",
                "invalid column name",
                "conversion failed"
            };
            if (criticalSeverity.Exists(item => exceptionString.Contains(item)))
            {
                return "critical";
            }
            else if (highSeverity.Exists(item => exceptionString.Contains(item)))
            {
                return "high";
            }
            else if (mediumSeverity.Exists(item => exceptionString.Contains(item)))
            {
                return "medium";
            }
            return "low";
        }
    }

    /// <summary>
    /// 
    /// </summary>
    [ExcludeFromCodeCoverage]
    // Extension method used to add the middleware to the HTTP request pipeline.
    public static class GlobalExceptionMiddlewareExtensions
    {
        /// <summary>
        /// 
        /// </summary>
        /// <param name="builder"></param>
        /// <returns></returns>
        public static IApplicationBuilder UseGlobalExceptionMiddleware(this IApplicationBuilder builder)
        {
            return builder.UseMiddleware<GlobalExceptionMiddleware>();
        }
    }

}
