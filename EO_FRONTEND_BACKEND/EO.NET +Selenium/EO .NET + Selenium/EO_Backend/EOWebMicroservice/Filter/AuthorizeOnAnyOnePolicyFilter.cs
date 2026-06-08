using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using System.Diagnostics.CodeAnalysis;

namespace EOWebMicroservice.Filter
{
    /// <summary>
    /// 
    /// </summary>
    [ExcludeFromCodeCoverageAttribute]
    public class AuthorizeOnAnyOnePolicyFilter : IAsyncAuthorizationFilter
    {
        private readonly IAuthorizationService authorization;

        /// <summary>
        /// 
        /// </summary>
        public string Policies { get; private set; }

        /// <summary>
        /// Initializes a new instance of the AuthorizeOnAnyOnePolicyFilter class.
        /// </summary>
        /// <param name="policies">A comma delimited list of policies that are allowed to access the resource.</param>
        /// <param name="authorization">The AuthorizationFilterContext.</param>
        public AuthorizeOnAnyOnePolicyFilter(string policies, IAuthorizationService authorization)
        {
            Policies = policies;
            this.authorization = authorization;
        }

        /// <summary>
        /// Called early in the filter pipeline to confirm request is authorized.
        /// </summary>
        /// <param name="context">A context for authorization filters i.e. IAuthorizationFilter and IAsyncAuthorizationFilter implementations.</param>
        /// <returns>Sets the context.Result to ForbidResult() if the user fails all of the policies listed.</returns>
        public async Task OnAuthorizationAsync(AuthorizationFilterContext context)
        {
            var policies = Policies.Split(",").ToList();
            // Loop through policies.  User need only belong to one policy to be authorized.
            foreach (var policy in policies)
            {
                var authorized = await authorization.AuthorizeAsync(context.HttpContext.User, policy);
                if (authorized.Succeeded)
                {
                    return;
                }
            }
            context.Result = new ForbidResult();
        }
    }
}
