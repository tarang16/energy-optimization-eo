using EODomain.Common;
using EODomain.Models;
using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;
using EOWebMicroservice.Filter;
using EODomain.Models.Favorites;
using EOApplication.Contracts.Services;
using Microsoft.AspNetCore.Authorization;
using Asp.Versioning;


namespace EOWebMicroservice.Controllers.v1
{
    /// <summary>
    /// 
    /// </summary>
    [ApiVersion("1.0")]
    public class FavoritesController : BaseController
    {
        private readonly IFavoritesServices _favoritesServices;
        private readonly IAccountServices _accountServices;
        private readonly IWinAuthServices _winAuthServices;

        /// <summary>
        /// Constructor for FavoritesController
        /// </summary>
        /// <param name="favoritesServices"></param>
        /// <param name="accountServices"></param>
        /// <param name="winAuthServices"></param>
        public FavoritesController(
                            IFavoritesServices favoritesServices,
                            IAccountServices accountServices,
                            IWinAuthServices winAuthServices)
        {
            _favoritesServices = favoritesServices;
            _accountServices = accountServices;
            _winAuthServices = winAuthServices;
        }


        /// <summary>
        /// This API fetches the favorite pages bookmarked by a user.
        /// </summary>
        /// <returns></returns>
        [HttpGet("get_favorite_by_user_id")]
        public async Task<IActionResult> GetFavoriteByUserID()
        {
            var claims = HttpContext.User.Identity as ClaimsIdentity;
            Claim? claimUID = claims!.Claims.FirstOrDefault(claim => claim.Type == "uid");
            int userID = Convert.ToInt32(claimUID!.Value);
            var GetFavoriteByUserIDresult = await _favoritesServices.GetFavoriteByUserIDAsync(userID);
            if (GetFavoriteByUserIDresult == null || GetFavoriteByUserIDresult.Count == 0)
            {
                return Ok(new Response<Array>(ResponseConstants.EMPTYOK, ResponseConstants.EMPTYOK_MESSAGE, ResponseConstants.EMPTYDATA));
            }
            else
            {
                return Ok(new Response<object>(GetFavoriteByUserIDresult));
            }
        }


        /// <summary>
        /// This API bookmarks a page as favorites for a user.
        /// </summary>
        /// <param name="request"></param>
        /// <returns></returns>
        [HttpPost("add_favorite_by_user_id")]
        public async Task<IActionResult> PostAddFavoriteByUserID([FromBody] PostAddFavoriteByUserIDRequest request)
        {
            var claims = HttpContext.User.Identity as ClaimsIdentity;
            Claim? claimUID = claims!.Claims.FirstOrDefault(claim => claim.Type == "uid");
            int userID = Convert.ToInt32(claimUID!.Value);
            request.userID = userID;
            var AddFavoriteByUserIDresult = await _favoritesServices.PostAddFavoriteByUserIDAsync(request);
            if (AddFavoriteByUserIDresult == null || AddFavoriteByUserIDresult.Count == 0)
            {
                return Ok(new Response<Array>(ResponseConstants.EMPTYOK, ResponseConstants.EMPTYOK_MESSAGE, ResponseConstants.EMPTYDATA));
            }
            else
            {
                return Ok(new Response<object>(AddFavoriteByUserIDresult));
            }
        }


        /// <summary>
        /// This API removes a bookmarked page from favorites for a user.
        /// </summary>
        /// <param name="request"></param>
       
        /// <returns></returns>
        [HttpPost("delete_favorite_by_fav_id")]
        public async Task<IActionResult> PostDeleteFavoriteByFavID([FromBody] PostDeleteFavoriteByFavIDRequest request)
        {
            var claims = HttpContext.User.Identity as ClaimsIdentity;
            Claim? claimUID = claims!.Claims.FirstOrDefault(claim => claim.Type == "uid");
            int userID = Convert.ToInt32(claimUID!.Value);
            request.userID = userID;
            var DeleteFavoriteresult = await _favoritesServices.PostDeleteFavoriteByFavIDAsync(request);
            if (DeleteFavoriteresult == null || DeleteFavoriteresult.Count == 0)
            {
                return Ok(new Response<Array>(ResponseConstants.EMPTYOK, ResponseConstants.EMPTYOK_MESSAGE, ResponseConstants.EMPTYDATA));
            }
            else
            {
                var currentUser = User.Identity;
                int userLoginID = Convert.ToInt32(claimUID!.Value);

                if (currentUser!.IsAuthenticated)
                {
                    string ipAddress = HttpContext.Connection.RemoteIpAddress!.ToString();
                    string browserName = Request.Headers["Sec-Ch-Ua"]!;
                    string userAgent = Request.Headers.UserAgent!;
                    string languages = Request.Headers.AcceptLanguage!;
                    string browser = browserName + "|" + languages.Split(",")[0].ToString() + "|" + userAgent;

                    //go to database check if user exist, if available and generate token
                    var user = await _accountServices.GetUserbyEmployeeIdAsync(userLoginID);
                    var userData = await _accountServices.GetDataForAuthenticationByUserIdAsync(userLoginID);
                    var tokenResponse = await _winAuthServices.GenerateToken(user, ipAddress, browser, 0, userData);
                    if (tokenResponse != null)
                    {
                        var temp = tokenResponse;
                        DeleteFavoriteresult[0].token = temp;
                    }
                }
                return Ok(new Response<object>(DeleteFavoriteresult));
            }
        }




        /// <summary>
        /// This API adds a trend plot data as favorites for a user. 
        /// </summary>
        /// <param name="request"></param>
        /// <returns></returns>
        [HttpPost("add_favorite_trend_by_user_id")]
        public async Task<IActionResult> PostAddFavoriteTrendByUserID([FromBody] PostFavTrendByUserID request)
        {
            var claims = HttpContext.User.Identity as ClaimsIdentity;
            Claim? claimUID = claims!.Claims.FirstOrDefault(claim => claim.Type == "uid");
            int userID = Convert.ToInt32(claimUID!.Value);

            var AddFavoriteTrendByCaseresult = await _favoritesServices.PostAddFavoriteTrendByUserIDAsync(userID, request);
            if (AddFavoriteTrendByCaseresult == null)
            {
                return Ok(new Response<Array>(ResponseConstants.EMPTYOK, ResponseConstants.EMPTYOK_MESSAGE, ResponseConstants.EMPTYDATA));
            }
            else
            {
                return Ok(new Response<object>(AddFavoriteTrendByCaseresult));
            }
        }


        /// <summary>
        /// This API fetches favorite trend plots data for a caseID bookmarked by user. 
        /// </summary>
        /// <param name="request"></param>
        /// <returns></returns>
        [HttpPost("get_favorite_trend_by_fav_trend_id")]
        public async Task<IActionResult> GetFavoriteTrendByFavID([FromBody] FavTrendRequest request)
        {
            var claims = HttpContext.User.Identity as ClaimsIdentity;
            Claim? claimUID = claims!.Claims.FirstOrDefault(claim => claim.Type == "uid");
            int userID = Convert.ToInt32(claimUID!.Value);
            var GetFavoriteTrendByCaseresult = await _favoritesServices.GetFavoriteTrendByFavIDAsync(userID, request.FavTrendGUID);
            if (GetFavoriteTrendByCaseresult == null)
            {
                return Ok(new Response<Array>(ResponseConstants.EMPTYOK, ResponseConstants.EMPTYOK_MESSAGE, ResponseConstants.EMPTYDATA));
            }
            else
            {
                return Ok(new Response<object>(GetFavoriteTrendByCaseresult));
            }
        }

        /// <summary>
        /// To get all favorite trends  
        /// </summary>
        /// <returns></returns>
        [HttpGet("get_all_favorite_trend_by_fav_trend_id")]
        public async Task<IActionResult> GetAllFavoriteTrendByFavIDAsync()
        {
            var claims = HttpContext.User.Identity as ClaimsIdentity;
            Claim? claimUID = claims!.Claims.FirstOrDefault(claim => claim.Type == "uid");
            int userID = Convert.ToInt32(claimUID!.Value);
            var GetFavoriteTrendByCaseresult = await _favoritesServices.GetAllFavoriteTrendByFavIDAsync(userID);
            if (GetFavoriteTrendByCaseresult == null)
            {
                return Ok(new Response<Array>(ResponseConstants.EMPTYOK, ResponseConstants.EMPTYOK_MESSAGE, ResponseConstants.EMPTYDATA));
            }
            else
            {
                return Ok(new Response<object>(GetFavoriteTrendByCaseresult));
            }
        }


        /// <summary>
        /// This API deletes favorite trend plots data for a user.
        /// </summary>
        /// <param name="request"></param>
        /// <returns></returns>
        [HttpPost("delete_favorite_trend_by_fav_trend_id")]
        public async Task<IActionResult> PostDeleteFavoriteTrendByFavTrendID([FromBody] FavTrendRequest request)
        {
            var claims = HttpContext.User.Identity as ClaimsIdentity;
            Claim? claimUID = claims!.Claims.FirstOrDefault(claim => claim.Type == "uid");
            int userID = Convert.ToInt32(claimUID!.Value);
            var DeleteFavoriteTrendresult = await _favoritesServices.PostDeleteFavoriteTrendByFavIDAsync(userID, request.FavTrendGUID);
            if (DeleteFavoriteTrendresult == null)
            {
                return Ok(new Response<Array>(ResponseConstants.EMPTYOK, ResponseConstants.EMPTYOK_MESSAGE, ResponseConstants.EMPTYDATA));
            }
            else
            {
                return Ok(new Response<object>(DeleteFavoriteTrendresult));
            }
        }


        /// <summary>
        /// To add user preferences
        /// </summary>
        /// <param name="request"></param>
        /// <returns></returns>
        [HttpPost("add_user_preference")]
        public async Task<IActionResult> PostUserPreferencesAsync([FromBody] object request)
        {
            int userID = CommonMethod.GetEmployeeIdFromClaim(HttpContext);

            var postResult = await _favoritesServices.PostUserPreferencesAsync(userID, request);
            if (postResult == null)
            {
                return Ok(new Response<Array>(ResponseConstants.EMPTYOK, ResponseConstants.EMPTYOK_MESSAGE, ResponseConstants.EMPTYDATA));
            }
            else
            {
                return Ok(new Response<object>(postResult));
            }
        }


        /// <summary>
        /// To fetch user preferences
        /// </summary>
        /// <param name="request"></param>
        /// <returns></returns>
        [HttpPost("get_user_preference")]
        public async Task<IActionResult> GetUserPreferences([FromBody] GetUserPreferencesRequest request)
        {
            int userID = CommonMethod.GetEmployeeIdFromClaim(HttpContext);
            string? key = request.key!;
            string? parameter = request.parameter!;

            var getResult = await _favoritesServices.GetUserPreferencesAsync(userID, key, parameter);
            if (getResult == null || getResult.Count == 0)
            {
                return Ok(new Response<Array>(ResponseConstants.EMPTYOK, ResponseConstants.EMPTYOK_MESSAGE, ResponseConstants.EMPTYDATA));
            }
            else
            {
                return Ok(new Response<object>(getResult));
            }
        }

        /// <summary>
        /// To delete user preferences
        /// </summary>
        /// <param name="request"></param>
        /// <returns></returns>
        [HttpPost("delete_user_preference")]
        [IntIDValidationFilter(caseParameter = "ids")]
        public async Task<IActionResult> DeleteUserPreferences([FromBody] DeleteUserPreferenceRequest request)
        {
            var getResult = await _favoritesServices.DeleteUserPreferencesAsync(request.ids!);
            if (getResult)
            {
                return Ok(new Response<object>(getResult));
            }
            else
            {
                return Ok(new Response<Array>(ResponseConstants.EMPTYOK, ResponseConstants.EMPTYOK_MESSAGE, ResponseConstants.EMPTYDATA));
            }
        }
    }
}
