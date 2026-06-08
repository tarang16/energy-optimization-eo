using Microsoft.AspNetCore.Mvc;
using System.Diagnostics.CodeAnalysis;
using System.Text.RegularExpressions;

namespace EOWebMicroservice.Filter
{
    /// <summary>
    /// 
    /// </summary>
    [AttributeUsage(AttributeTargets.Class | AttributeTargets.Method, AllowMultiple = false, Inherited = true)]
    public class AuthorizeOnAnyOnePolicyAttribute : TypeFilterAttribute
    {
        /// <summary>
        /// Initializes a new instance of the AuthorizeOnAnyOnePolicyAttribute class.
        /// </summary>
        /// <param name="policies">A comma delimited list of policies that are allowed to access the resource.</param>
        /// <returns></returns>
        [ExcludeFromCodeCoverageAttribute]
        public AuthorizeOnAnyOnePolicyAttribute(string policies) : base(typeof(AuthorizeOnAnyOnePolicyFilter))
        {
            Regex commaDelimitedWhitespaceCleanup = new Regex("\\s+,\\s+|\\s+,|,\\s+",
                RegexOptions.IgnoreCase | RegexOptions.CultureInvariant | RegexOptions.IgnorePatternWhitespace | RegexOptions.Compiled, TimeSpan.FromMilliseconds(100));

            Arguments = new object[] { commaDelimitedWhitespaceCleanup.Replace(policies, ",") };
        }
    }
}
