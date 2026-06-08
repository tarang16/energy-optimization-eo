using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.Extensions.Caching.Memory;
using System.Diagnostics.CodeAnalysis;
using System.Reflection;

namespace EOWebMicroservice.Filter
{
    /// <summary>
    /// Caching filter
    /// </summary>
    [ExcludeFromCodeCoverage]
    [ExcludeFromDescription]
    public class CacheAttributeFilter : IAsyncActionFilter
    {
        private readonly IMemoryCache _cache;

        /// <summary>
        /// Constructor for caching filter
        /// </summary>
        /// <param name="cache"></param>
        public CacheAttributeFilter(IMemoryCache cache)
        {
            _cache = cache;
        }

        /// <summary>
        /// Execution method
        /// </summary>
        /// <param name="context"></param>
        /// <param name="next"></param>
        /// <returns></returns>
        public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
        {
            // Check if the action has the CacheAttribute
            var actionMethod = context.ActionDescriptor as Microsoft.AspNetCore.Mvc.Controllers.ControllerActionDescriptor;
            var cacheAttribute = actionMethod?.MethodInfo.GetCustomAttribute<CacheAttribute>();
            if (cacheAttribute != null)
            {
                // Construct the cache key
                var cacheKey = cacheAttribute.CacheKey;
                // Try to get the cached result
                if (_cache.TryGetValue(cacheKey, out object? cachedResult))
                {
                    // Return the cached result
                    context.Result = new JsonResult(cachedResult);
                    return;
                }
                // Proceed with the action execution
                var resultContext = await next();
                // Cache the result
                _cache.Set(cacheKey, resultContext.Result, TimeSpan.FromMinutes(cacheAttribute.DurationInMinutes));
            }
            else
            {
                // Proceed with the action execution if no cache attribute is present
                await next();
            }
        }
    }
}