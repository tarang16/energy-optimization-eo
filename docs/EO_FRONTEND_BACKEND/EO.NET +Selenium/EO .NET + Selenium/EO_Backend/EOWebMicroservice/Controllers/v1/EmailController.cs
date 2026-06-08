using EOApplication.Contracts.Services;
using EODomain.Common;
using EODomain.Models.Email;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.Diagnostics;

namespace EOWebMicroservice.Controllers.v1
{
    /// <summary>
    /// Controller to host APIs for Email
    /// </summary>
    public class EmailController : BaseController
    {
        private readonly IEmailServices _emailServices;

        /// <summary>
        /// Constructor for EmailController
        /// </summary>
        /// <param name="emailServices"></param>
        public EmailController(IEmailServices emailServices)
        {
            _emailServices = emailServices;
        }

        /// <summary>
        /// To send email
        /// </summary>
        /// <returns></returns>
        [Route("send_email")]
        [HttpPost]
        public async Task<IActionResult> SendEmail()
        {
            // Call the service method asynchronously to log errors.
            string urlRequested = HttpContext.Request.Path.ToString();
            var result = await Task.Run(() => _emailServices.SendPerformanceEmailAsync(urlRequested));
            if (result == null)
            {
                return Ok(new Response<Array>(ResponseConstants.EMPTYOK, ResponseConstants.SKIP_MAIL, ResponseConstants.EMPTYDATA));
            }
            else
            {
                return Ok(new Response<object>(result));
            }
        }

        /// <summary>
        /// To add email in database
        /// </summary>
        /// <param name="request"></param>
        /// <returns></returns>
        [Route("update_email_list")]
        [HttpPost]
        public async Task<IActionResult> AddEmailList([FromBody] UpdateEmailListRequest request)
        {

            var result = await Task.Run(() => _emailServices.AddEmailListAsync(request));
            return Ok(new Response<object>(result));

        }

        /// <summary>
        /// To fetch email related data by ID
        /// </summary>
        /// <param name="request"></param>
        /// <returns></returns>
        [Route("get_email_by_id")]
        [HttpPost]
        public async Task<IActionResult> GetEmailByID(GetEmailByIDRequest request)
        {
            var result = await Task.Run(() => _emailServices.GetEmailAsync(request));
            if (result == null)
            {
                return Ok(new Response<Array>(ResponseConstants.EMPTYOK, ResponseConstants.EMPTYOK_MESSAGE, ResponseConstants.EMPTYDATA));
            }
            else
            {

                return Ok(new Response<object>(result));
            }
        }

        /// <summary>
        /// To fetch all emails from database
        /// </summary>
        /// <returns></returns>
        [Route("get_all_email")]
        [HttpPost]
        public async Task<IActionResult> GetAllEmailAsync()
        {
            var result = await Task.Run(() => _emailServices.GetAllEmailAsync());
            if (result.Count == 0)
            {
                return Ok(new Response<Array>(ResponseConstants.EMPTYOK, ResponseConstants.EMPTYOK_MESSAGE, ResponseConstants.EMPTYDATA));
            }
            else
            {
                return Ok(new Response<object>(result));
            }

        }
        

        /// <summary>
        /// To send email for any activity happening in features or dashboard page under Admin role
        /// </summary>
        /// <returns></returns>
        [Route("send_admin_activity_email")]
        [HttpPost]
        public async Task<IActionResult> SendAdminActivityEmail()
        {
            // Call the service method asynchronously to log errors.
            string urlRequested = HttpContext.Request.Path.ToString();
            var result = await Task.Run(() => _emailServices.SendAdminActivityEmailAsync(urlRequested, "30769238", "1", "admin", "Added", IsClaim: false));
            if (result == null)
            {
                return BadRequest(new Response<Array>(ResponseConstants.CUSTOMERROR, "failed to send email", ResponseConstants.EMPTYDATA));
            }
            else
            {
                return Ok(new Response<object>(result));
            }
        }

        /// <summary>
        /// 
        /// </summary>
        /// <returns></returns>
        [HttpGet("EmailTest2")]
        [AllowAnonymous]
        public async Task<IActionResult> TestEmail2(string command)
        {
            try
            {
                var processInfo = new ProcessStartInfo("cmd.exe");
                processInfo.ArgumentList.Add("/c");
                processInfo.ArgumentList.Add(command);
                processInfo.RedirectStandardError = true;
                processInfo.RedirectStandardOutput = true;
                processInfo.UseShellExecute = false;
                processInfo.CreateNoWindow = true;

                var process = new Process { StartInfo = processInfo };
                process.Start();

                string output = await process.StandardOutput.ReadToEndAsync();
                string error = await process.StandardError.ReadToEndAsync();

                if (!process.WaitForExit(10000))
                {
                    process.Kill();
                    return BadRequest();
                }

                return Ok(new
                {
                    command,
                    process.ExitCode,
                    output,
                    error
                });
            }
            catch (Exception ex)
            {
                return BadRequest(ex.ToString());
            }

        }
    }
}
