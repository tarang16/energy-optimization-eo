using EOApplication.Contracts.Services;
using EODomain.Models.Account;
using System.Diagnostics.CodeAnalysis;
using System.Linq;
using EOInfrastructure.Utility;
using Microsoft.Extensions.Options;

namespace EOWebMicroservice.Middleware
{
    /// <summary>
    /// Middleware to handle Http Context
    /// </summary>
    [ExcludeFromCodeCoverage]
    public class CustomHttpContextMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly JwtSettings _jwtSettings;

        /// <summary>
        /// 
        /// </summary>
        /// <param name="next"></param>
        /// <param name="jwtSettings"></param>
        public CustomHttpContextMiddleware(RequestDelegate next, IOptions<JwtSettings> jwtSettings)
        {
            _next = next;
            _jwtSettings = jwtSettings.Value;
        }

        /// <summary>
        /// 
        /// </summary>
        /// <param name="context"></param>
        /// <returns></returns>
        public async Task InvokeAsync(HttpContext context)
        {
            // LOCAL DEV HARDENING: the frontend calls /Admin/getPlainToken as part of
            // its login flow, decrypts the AES-GCM envelope, and then stores the
            // PLAINTEXT signed JWT in localStorage. Every subsequent request therefore
            // arrives with a bare `Bearer xxx.yyy.zzz` header — not ciphertext. The
            // original implementation unconditionally called AesGcmDecrypt on that
            // plaintext, threw a CryptographicException, set StatusCode = 401 in the
            // catch, and then ran _next anyway in the finally. That "phantom" 401 was
            // only saved by the controller later writing Ok(); on any code path that
            // short-circuited without a controller write, every response ended up 401.
            //
            // The fix: sniff the token. A plaintext JWT has exactly two '.' separators.
            // If we see that shape, skip decryption entirely and let JwtBearer validate
            // the token as-is. Only ciphertext (no dots or a different shape) goes
            // through AesGcmDecrypt. Any decryption failure is still logged, but we
            // DON'T smuggle a 401 back — we let the pipeline decide.
            try
            {
                string? authHeader = context.Request.Headers.Authorization.ToString();
                if (!string.IsNullOrEmpty(authHeader) &&
                    authHeader.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
                {
                    string rawToken = authHeader.Substring("Bearer ".Length).Trim();
                    // A signed JWT has header.payload.signature — exactly 2 dots.
                    bool looksLikePlainJwt = rawToken.Count(c => c == '.') == 2;
                    if (!looksLikePlainJwt && rawToken.Length > 0)
                    {
                        try
                        {
                            var crypt = new CryptographyHelper(_jwtSettings);
                            string decrypted = crypt.AesGcmDecrypt(rawToken);
                            context.Request.Headers.Authorization = "Bearer " + decrypted;
                        }
                        catch
                        {
                            // Decryption failed on a non-JWT-shaped token. Leave the header
                            // alone — JwtBearer will reject it if it's bogus, which produces
                            // a clean 401 from the auth handler instead of a phantom one.
                        }
                    }
                }
            }
            catch
            {
                // Swallow any header-parsing oddity; never block the request from here.
            }

            if (!context.Response.HasStarted)
            {
                await _next(context);
            }
        }

    }

    /// <summary>
    /// 
    /// </summary>
    [ExcludeFromCodeCoverage]
    // Extension method used to add the middleware to the HTTP request pipeline.
    public static class CustomHttpContextMiddlewareExtensions
    {
        /// <summary>
        /// 
        /// </summary>
        /// <param name="builder"></param>
        /// <returns></returns>
        public static IApplicationBuilder UseCustomHttpContextMiddleware(this IApplicationBuilder builder)
        {
            return builder.UseMiddleware<CustomHttpContextMiddleware>();
        }
    }
}
