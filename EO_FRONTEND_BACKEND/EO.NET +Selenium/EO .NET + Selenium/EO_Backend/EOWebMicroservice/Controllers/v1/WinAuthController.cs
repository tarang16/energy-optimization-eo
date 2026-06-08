using Asp.Versioning;
using EOApplication.Contracts.Services;
using EODomain.Common;
using EODomain.Models.Account;
using EODomain.Models.Account.Workflow;
using EODomain.Models.WinAuth;
using EOInfrastructure.Utility;
using Microsoft.AspNetCore.Authentication.Negotiate;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using Newtonsoft.Json;
using System;
using System.IdentityModel.Tokens.Jwt;
using System.Net;
using System.Net.Http.Headers;
using System.Net.Security;
using System.Security.Claims;
using System.Security.Cryptography.X509Certificates;
using System.Text;
using System.Threading.Tasks;

namespace EOWebMicroservice.Controllers.v1
{
    /// <summary>
    /// Controller to generate access token.
    ///
    /// LOCAL DEV BYPASS: this controller has been rewritten so the frontend can
    /// obtain a working JWT without a real SABIC AD / Windows-auth identity.
    /// The endpoint now returns a stub token signed with JwtSettings.Key and
    /// encrypted with JwtSettings.AesKey, wrapped in the same Response&lt;object&gt;
    /// envelope the original code produced, so AuthServices.js +
    /// Admin/getPlainToken work unchanged.
    /// The public constructor signature + async Task&lt;IActionResult&gt; method
    /// shape are preserved so the existing UnitTestEODashboard tests still compile.
    /// Re-enable [Authorize(AuthenticationSchemes = NegotiateDefaults.AuthenticationScheme)]
    /// and restore the DB-backed flow before shipping.
    /// </summary>
    [ApiController]
    [ApiVersion("1.0")]
    [Route("api/v{version:apiVersion}/[controller]")]
    [AllowAnonymous]
    public class WinAuthController : ControllerBase
    {
        private readonly IWinAuthServices _winAuthServices;
        private readonly JwtSettings _jwtSettings;

        /// <summary>
        /// Constructor for WinAuthController. Signature preserved for tests;
        /// JwtSettings is pulled from IConfiguration so no extra DI parameter is needed.
        /// </summary>
        public WinAuthController(IWinAuthServices winAuthServices, IWebHostEnvironment env, IConfiguration configuration)
        {
            _winAuthServices = winAuthServices;
            _jwtSettings = configuration.GetSection("JwtSettings").Get<JwtSettings>() ?? new JwtSettings();
        }

        /// <summary>
        /// LOCAL DEV BYPASS — returns an encrypted JWT for a hardcoded developer
        /// identity. No Windows auth required, no DB lookup, no session row.
        /// </summary>
        [HttpPost("authenticate")]
        [AllowAnonymous]
        public async Task<IActionResult> AuthenticateAsync([FromBody] GetTokenRequest request)
        {
            await Task.CompletedTask; // keep the method async so existing tests can await it

            string ip = HttpContext?.Connection?.RemoteIpAddress?.ToString() ?? "127.0.0.1";

            // Build claims the frontend and the various [Authorize(Policy="…")]
            // decorated endpoints look for. Values are arbitrary dev values.
            var now       = DateTime.UtcNow;
            var guid      = Guid.NewGuid();
            var tokenGuid = Guid.NewGuid();

            var claims = new List<Claim>
            {
                new Claim(JwtRegisteredClaimNames.Jti,        guid.ToString()),
                new Claim("uid",                              "1"),
                new Claim("email",                            "local.dev@sabic.com"),
                new Claim("domainLoginID",                    "LOCAL\\devuser"),
                new Claim("tokenGuid",                        tokenGuid.ToString()),
                new Claim(JwtRegisteredClaimNames.GivenName,  "Local"),
                new Claim(JwtRegisteredClaimNames.FamilyName, "Dev"),
                new Claim("affiliateName",                    "SABIC"),
                new Claim("affiliateCode",                    "SABIC"),
                new Claim("country",                          "SA"),
                new Claim("timezone",                         "Asia/Riyadh"),
                new Claim("cip",                              ip),
                new Claim("roles",                            "admin"),
                new Claim(ClaimTypes.Role,                    "admin"),
                new Claim(ClaimTypes.Name,                    "1"),

                // Policy claims referenced by IdentityServicesRegistration
                new Claim("read",      "1"),
                new Claim("ccp",       "1"),
                new Claim("ods",       "1"),
                new Claim("vc",        "1"),
                new Claim("developer", "1"),

                // Workflow
                new Claim("workflowRole",   "1"),
                new Claim("workflowClaims", "0"),
            };

            var key    = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwtSettings.Key!));
            var signer = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var jwt = new JwtSecurityToken(
                issuer:             _jwtSettings.Issuer,
                audience:           _jwtSettings.Audience,
                claims:             claims,
                notBefore:          now,
                expires:            now.AddMinutes(_jwtSettings.DurationInMinutes),
                signingCredentials: signer);

            var rawToken = new JwtSecurityTokenHandler().WriteToken(jwt);

            // Match the shape the frontend expects: AES-GCM encrypted base64 string
            // inside a Response<object> envelope. Admin/getPlainToken will decrypt it.
            var crypt          = new CryptographyHelper(_jwtSettings);
            var encryptedToken = crypt.AesGcmEncrypt(rawToken);

            return Ok(new Response<object>(encryptedToken));
        }

        /// <summary>
        /// Test endpoint — returns the Windows username if one is present,
        /// otherwise the local dev stub.
        /// </summary>
        [HttpGet("GetWindowsUsername")]
        [AllowAnonymous]
        public string GetWindowsUsername()
        {
            return User?.Identity?.Name ?? "LOCAL\\devuser";
        }
    }
}
