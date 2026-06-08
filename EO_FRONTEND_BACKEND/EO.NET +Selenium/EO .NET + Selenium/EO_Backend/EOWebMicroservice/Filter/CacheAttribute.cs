using System.Diagnostics.CodeAnalysis;

namespace EOWebMicroservice.Filter
{
    /// <summary>
    /// Caching attribute
    /// </summary>
    [ExcludeFromCodeCoverage]
    [ExcludeFromDescription]
    [AttributeUsage(AttributeTargets.Method, Inherited = true, AllowMultiple = false)]
    public class CacheAttribute : Attribute
    {
        /// <summary>
        /// parametr
        /// </summary>
        public string CacheKey { get; }

        /// <summary>
        /// parameter
        /// </summary>
        public int DurationInMinutes { get; }

        /// <summary>
        /// Caching attribute
        /// </summary>
        /// <param name="cacheKey"></param>
        /// <param name="durationInMinutes"></param>
        public CacheAttribute(string cacheKey, int durationInMinutes)
        {
            CacheKey = cacheKey;
            DurationInMinutes = durationInMinutes;
        }
    }
}