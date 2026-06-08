


using EOApplication.Contracts.Repositories;
using EOApplication.Contracts.Services;
using EODomain.Common;
using EODomain.Models.CCP;
using EODomain.Models.HistoricalData;
using EODomain.Models.PI;
using EOInfrastructure.Repositories;
using EOInfrastructure.Services;
using EOWebMicroservice.Controllers.v1;
using FakeItEasy;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Moq;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Diagnostics.CodeAnalysis;
using System.Dynamic;
using System.Linq;
using System.Net.Http;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;
using Xunit;

namespace UnitTestEODashboard.Tests
{
    [ExcludeFromCodeCoverage]
    public class CcpTest
    {
        #region GetCcpData
        [Fact]
        public void GetCcpDataReturnsOkWithData()
        {
            // Arrange
            int caseID = 1;
            var request = new GetCaseIDRequest()
            {
                caseID = 1
            };

            
            var GetCaseIDRepositoryResponse = new GetCaseIDRepositoryResponse
            {
                GetCaseIDResponse = new List<GetCaseIDResponse>
                {
                    new GetCaseIDResponse{
                    tagID = 123,
                    equipmentName = "element",caseID=1 }
                },
                pageCount=1

            };
           
                var GetCaseIDPageCountResponse = new GetCaseIDPageCountResponse
                {
                    GetCaseIDResponse = new List<GetCaseIDResponse>
                {
                    new GetCaseIDResponse{
                    tagID = 123,
                    equipmentName = "element",caseID=1 }
                },
                    pageCount = 1

                };

           

            var mockCCPRepository = new Mock<ICcpRepository>();
            mockCCPRepository.Setup(r => r.GetCcpDataAsync(request)).ReturnsAsync(GetCaseIDRepositoryResponse);
           

            
            var ccpServicesMock = new Mock<ICcpServices>();
            ccpServicesMock.Setup(r => r.GetCcpDataAsync(request)).ReturnsAsync(GetCaseIDPageCountResponse);

            var configurationMock = new Mock<IConfiguration>();
            
            var claimsIdentityMock = new Mock<ClaimsIdentity>();
            var accountServicesMock = new Mock<IAccountServices>();

            accountServicesMock.Setup(s => s.GetCaseIDCountFromCaseIDListAsync(caseID.ToString()))
                     .ReturnsAsync(1);

            var user = new ClaimsPrincipal(claimsIdentityMock.Object);
            var httpContext = new DefaultHttpContext();
            httpContext.User = user;
            var configServciesMock = new Mock<IConfigServices>();
            var controller = new CcpController(ccpServicesMock.Object, configurationMock.Object, accountServicesMock.Object, configServciesMock.Object);
            controller.ControllerContext.HttpContext = httpContext;
            // Act
            var result = controller.GetCcpData(request);
            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            var response = Assert.IsType<PaginatedResponse<object>>(okResult.Value);
            Assert.NotNull(response);
        }

        [Fact]
        public void GetCcpDataReturnsOkWithNoData()
        {
            // Arrange
            int caseID = 1;
            var request = new GetCaseIDRequest()
            {
                caseID = caseID
                ,
            };

            var mockCCPRepository = new Mock<ICcpRepository>();
            mockCCPRepository.Setup(r => r.GetCcpDataAsync(request))
                            .ReturnsAsync(new GetCaseIDRepositoryResponse());
            var mockCCPService = new Mock<ICcpServices>();
            mockCCPService.Setup(r => r.GetCcpDataAsync(request))
                            .ReturnsAsync(new GetCaseIDPageCountResponse());

            var ccpServicesMock = new CcpServices(mockCCPRepository.Object);

            var configurationMock = new Mock<IConfiguration>();
           
            var claimsIdentityMock = new Mock<ClaimsIdentity>();
            var accountServicesMock = new Mock<IAccountServices>();

            accountServicesMock.Setup(s => s.GetCaseIDCountFromCaseIDListAsync(caseID.ToString()))
                     .ReturnsAsync(1);

            var user = new ClaimsPrincipal(claimsIdentityMock.Object);
            var httpContext = new DefaultHttpContext();
            httpContext.User = user;
            var configServciesMock = new Mock<IConfigServices>();
            var controller = new CcpController(ccpServicesMock, configurationMock.Object, accountServicesMock.Object, configServciesMock.Object);
            controller.ControllerContext.HttpContext = httpContext;
            // Act
            var result = controller.GetCcpData(request);
            // Assert
            Assert.IsType<OkObjectResult>(result.Result);
        }

        [Fact]
        public void GetCcpDataReturnsBadRequestInvalidCaseId()
        {
            // Arrange
            int caseID = 99999999;
            var request = new GetCaseIDRequest()
            {
                caseID = caseID
            };

            var mockCCPRepository = new Mock<ICcpRepository>();
            

            var ccpServicesMock = new CcpServices(mockCCPRepository.Object);

            var configurationMock = new Mock<IConfiguration>();
           
            var accountServicesMock = new Mock<IAccountServices>();
            accountServicesMock.Setup(s => s.GetCaseIDCountFromCaseIDListAsync(caseID.ToString()))
                     .ReturnsAsync(0);
            var configServciesMock = new Mock<IConfigServices>();
            var controller = new CcpController(ccpServicesMock, configurationMock.Object, accountServicesMock.Object, configServciesMock.Object);
            // Act
            var result = controller.GetCcpData(request);
            // Assert
            Assert.IsType<BadRequestObjectResult>(result.Result);
        }
        #endregion

        #region Add Ods Insights
        [Fact]
        public void AddOdsInsightsReturnsOkResult()
        {
            // Arrange
            int caseID = 33;
            var request = new AddOdsInsightsRequest()
            {
                causeTagID = 33940,
                description = "some test",
                suggestion = "some test"
            };

            var response = new OdsInsightsResponse
            {
                Result = "test"
            };

            var mockCCPRepository = new Mock<ICcpRepository>();
            mockCCPRepository.Setup(r => r.AddOdsInsights(request)).ReturnsAsync(response);
           
            var ccpServicesMock = new CcpServices(mockCCPRepository.Object);

            var configurationMock = new Mock<IConfiguration>();
            
            var accountServicesMock = new Mock<IAccountServices>();

            accountServicesMock.Setup(s => s.GetCaseIDCountFromCaseIDListAsync(caseID.ToString()))
                     .ReturnsAsync(1);
            var claims = new List<Claim>
            {
                new Claim("uid", "123"),
                new Claim("jti", "1241s-asfas-asrwq-4qwr")
            };

            var identity = new ClaimsIdentity(claims, "TestAuth");
            var user = new ClaimsPrincipal(identity);
            var httpContext = new DefaultHttpContext();
            httpContext.User = user;
            var mockConfigServices = new Mock<IConfigServices>();
            var controller = new CcpController(ccpServicesMock, configurationMock.Object, accountServicesMock.Object, mockConfigServices.Object);
            controller.ControllerContext.HttpContext = httpContext;

            // Act
            var result = controller.AddOdsInsights(request);
            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            Assert.NotNull(okResult);
        }

        [Fact]
        public void AddOdsInsightsReturnsBadRequestResult()
        {
            // Arrange
            int caseID = 33;
            var request = new AddOdsInsightsRequest()
            {
                causeTagID = 0,
                description = "some test",
                suggestion = "some test"
            };

            var response = new OdsInsightsResponse
            {
                Result = "test"
            };

            var mockCCPRepository = new Mock<ICcpRepository>();
            mockCCPRepository.Setup(r => r.AddOdsInsights(request)).ReturnsAsync(response);
            
            
            var ccpServicesMock = new Mock<ICcpServices>();
            ccpServicesMock.Setup(r => r.AddOdsInsights(request)).ReturnsAsync(() => null!);
            var configurationMock = new Mock<IConfiguration>();
           
            var accountServicesMock = new Mock<IAccountServices>();

            accountServicesMock.Setup(s => s.GetCaseIDCountFromCaseIDListAsync(caseID.ToString()))
                     .ReturnsAsync(0);

            var claims = new List<Claim>
            {
                new Claim("uid", "123"),
                new Claim("jti", "1241s-asfas-asrwq-4qwr")
            };

            var identity = new ClaimsIdentity(claims, "TestAuth");
            var user = new ClaimsPrincipal(identity);
            var httpContext = new DefaultHttpContext();
            httpContext.User = user;
            var mockConfigServices = new Mock<IConfigServices>();
            var controller = new CcpController(ccpServicesMock.Object, configurationMock.Object, accountServicesMock.Object, mockConfigServices.Object);
            controller.ControllerContext.HttpContext = httpContext;

            // Act
           
            var result = controller.AddOdsInsights(request).GetAwaiter().GetResult();

            // Assert
           
            var badRequestResult = Assert.IsType<BadRequestObjectResult>(result);
            var responses = Assert.IsType<Response<Array>>(badRequestResult.Value);
            Assert.Equal(ResponseConstants.EMPTYDATA, responses.data);
        }
        #endregion

        #region Reset Ods Insights
        [Fact]
        public async Task ResetOdsInsights_ReturnsOk_WhenResultIsNotNull()
        {
            // Arrange
            var request = new ResetOdsInsightsRequest
            {
                caseID = 123
            };

            var mockCcpServices = new Mock<ICcpServices>();
            var mockConfiguration = new Mock<IConfiguration>();
            var mockAccountServices = new Mock<IAccountServices>();
            var mockConfigServices = new Mock<IConfigServices>();

            var expectedResponse = new OdsInsightsResponse
            {
                Result = "Success"
            };

            mockCcpServices.Setup(s => s.ResetOdsInsights(It.IsAny<ResetOdsInsightsRequest>()))
                           .ReturnsAsync(expectedResponse);

            var claims = new List<Claim>
            {
                new Claim("uid", "99")
            };
            var identity = new ClaimsIdentity(claims, "TestAuthType");
            var user = new ClaimsPrincipal(identity);
            var httpContext = new DefaultHttpContext
            {
                User = user
            };

            var controller = new CcpController(
                mockCcpServices.Object,
                mockConfiguration.Object,
                mockAccountServices.Object,
                mockConfigServices.Object)
            {
                ControllerContext = new ControllerContext
                {
                    HttpContext = httpContext
                }
            };

            // Act
            var result = await controller.ResetOdsInsights(request);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<Response<object>>(okResult.Value);
            var responseData = Assert.IsType<OdsInsightsResponse>(response.data);
            Assert.Equal("Success", responseData.Result);
        }


        [Fact]
        public async Task ResetOdsInsightsReturnsBadRequestResult()
        {
            var request = new ResetOdsInsightsRequest()
            {
                caseID = 0,
                updatedBy = 123
            };

            var mockCCPRepository = new Mock<ICcpRepository>();

            mockCCPRepository.Setup(r => r.ResetOdsInsights(It.IsAny<ResetOdsInsightsRequest>())).ReturnsAsync((OdsInsightsResponse)null!);

            
            var ccpServicesMock = new CcpServices(mockCCPRepository.Object);

            var configurationMock = new Mock<IConfiguration>();
            
            var accountServicesMock = new Mock<IAccountServices>();
            var mockConfigServices = new Mock<IConfigServices>();

            var claims = new List<Claim>
            {
                new Claim("uid", "123"),
                new Claim("jti", "1241s-asfas-asrwq-4qwr")
            };

            var identity = new ClaimsIdentity(claims, "TestAuth");
            var user = new ClaimsPrincipal(identity);
            var httpContext = new DefaultHttpContext { User = user };

            var controller = new CcpController(ccpServicesMock, configurationMock.Object, accountServicesMock.Object, mockConfigServices.Object);
            controller.ControllerContext.HttpContext = httpContext;

            // Act
            var result = await controller.ResetOdsInsights(request);

            // Assert
            var badRequestResult = Assert.IsType<BadRequestObjectResult>(result);
            var responseObj = Assert.IsType<Response<Array>>(badRequestResult.Value);
            Assert.Equal(400,responseObj.statuscode);
        }
        #endregion

        #region GetCaseDetailsByCaseId

        [Fact]
        public async Task GetCaseDetailsByCaseIdReturnsNoDataFound()
        {
            // Arrange
            var request = new NullableCaseIdRequest()
            {
                caseID = null, // simulating a case where no case ID is provided
            };
          
            
         
            var mockCCPRepository = new Mock<ICcpRepository>();
            
            var ccpServicesMock = new CcpServices(mockCCPRepository.Object);

            var configurationMock = new Mock<IConfiguration>();
            
           
            var accountServicesMock = new Mock<IAccountServices>();

            var claims = new List<Claim>
    {
        new Claim("uid", "0"), // for user ID 0 or null
        new Claim("jti", "1241s-asfas-asrwq-4qwr")
    };

            var identity = new ClaimsIdentity(claims, "TestAuth");
            var user = new ClaimsPrincipal(identity);
            var httpContext = new DefaultHttpContext();
            httpContext.User = user;
           



            var mockConfigServices = new Mock<IConfigServices>();
            var controller = new CcpController(ccpServicesMock, configurationMock.Object, accountServicesMock.Object, mockConfigServices.Object);
            controller.ControllerContext.HttpContext = httpContext;

            // Act
            var result = await controller.GetCaseDetailsByCaseId(request);

            // Assert
            var noContentResult = Assert.IsType<OkObjectResult>(result);
            Assert.NotNull(noContentResult);

        }


        [Fact]
        public async Task GetCaseDetailsByCaseIdReturnsBadResponse_WhenErrorOccurs()
        {
            // Arrange
            var request = new NullableCaseIdRequest()
            {
                caseID = null, // Simulating a case where no case ID is provided
            };
          var mockCCPRepository = new Mock<ICcpRepository>();
        
            var ccpServicesMock = new CcpServices(mockCCPRepository.Object);

            var configurationMock = new Mock<IConfiguration>();
           
            var accountServicesMock = new Mock<IAccountServices>();

            var claims = new List<Claim>
    {
        new Claim("uid", "11"), // Mocked user ID (simulating no specific user ID)
        new Claim("jti", "1241s-asfas-asrwq-4qwr") // Mocked JWT ID
    };

            var identity = new ClaimsIdentity(claims, "0");
            var user = new ClaimsPrincipal(identity);
            var httpContext = new DefaultHttpContext();
            httpContext.User = user;
           
            

            mockCCPRepository.Setup(r => r.GetCaseDetailsByCaseIDAsync(It.IsAny<int>()))!
                    .ReturnsAsync((List<GetCaseDetailsByCaseIDStoredProcedureResponse>)null!); // Simulating null result (invalid data)
            var mockConfigServices = new Mock<IConfigServices>();
            var controller = new CcpController(ccpServicesMock, configurationMock.Object, accountServicesMock.Object, mockConfigServices.Object);
            controller.ControllerContext.HttpContext = httpContext;

            // Act
            var result = await controller.GetCaseDetailsByCaseId(request);


            var objectResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<Response<Array>>(objectResult.Value);
            Assert.Equal(204, response.statuscode);

        }



        [Fact]
        public void GetCaseDetailsByCaseIdReturnsWithOkResult()
        {

            var request = new NullableCaseIdRequest()
            {
                caseID = 1,

            };

            

            var dataGridList = new List<GetCaseDetailsByCaseIDStoredProcedureResponse> { };
            dataGridList.AddRange(A.CollectionOfDummy<GetCaseDetailsByCaseIDStoredProcedureResponse>(2).AsEnumerable());
            var claims = new List<Claim>
            {
                new Claim("uid", "123"),
                new Claim("jti", "1241s-asfas-asrwq-4qwr")
            };

           
            var identity = new ClaimsIdentity(claims, "TestAuth");
            var user = new ClaimsPrincipal(identity);
            var httpContext = new DefaultHttpContext();
            httpContext.User = user;

            int userID = CommonMethod.GetEmployeeIdFromClaim(httpContext);
           
            var mockCCPRepository = new Mock<ICcpRepository>();
            mockCCPRepository.Setup(r => r.GetCaseDetailsByCaseIDAsync(userID)).ReturnsAsync(dataGridList);

            
            var ccpServicesMock = new CcpServices(mockCCPRepository.Object);

            var configurationMock = new Mock<IConfiguration>();
           
            var accountServicesMock = new Mock<IAccountServices>();

            var mockConfigServices = new Mock<IConfigServices>();
            var controller = new CcpController(ccpServicesMock, configurationMock.Object, accountServicesMock.Object, mockConfigServices.Object);
            controller.ControllerContext.HttpContext = httpContext;
            var result = controller.GetCaseDetailsByCaseId(request);
            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result.Result);//204No data Found
            var response = Assert.IsType<Response<object>>(okResult.Value);
            Assert.Equal(200, response.statuscode);

        }


        #endregion

        #region PostUpdateCaseDetails
        [Fact]
        public void PostUpdateCaseDetailsWithReturnNoDataFound()
        {
            // Arrange
            var request = new UpdateCaseDetailsRequest
            {
                caseID = 1,
                caseName = "Valid Case",
                plantID = 1,
                processFrequency = 60,
                slot = 1,
                referenceDocUrl = "http://example.com",
                description = "Valid Description"
            };

            var mockCcpRepository = new Mock<ICcpRepository>();
            
            var mockAccountServices = new Mock<IAccountServices>();
            var mockConfigServices = new Mock<IConfigServices>();
            var mockConfiguration = new Mock<IConfiguration>();

            mockAccountServices.Setup(s => s.GetCaseIDCountFromCaseIDListAsync(request.caseID.ToString()))
                               .ReturnsAsync(1);

            mockCcpRepository.Setup(r => r.PostUpdateCaseDetailsAsync(It.IsAny<UpdateCaseDetailsRequest>()))
                             .ReturnsAsync("");

            var ccpServices = new CcpServices(mockCcpRepository.Object);
            var controller = new CcpController(
                ccpServices,
                mockConfiguration.Object,
                mockAccountServices.Object,
                mockConfigServices.Object
            );

            var result = controller.PostUpdateCaseDetails(request);

            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            var responseObj = Assert.IsType<Response<Array>>(okResult.Value);
            Assert.Equal(ResponseConstants.EMPTYDATA, responseObj.data);
        }
        [Fact]
        public async Task PostUpdateCaseDetailsWithReturnOkResult()
        {
            // Arrange
            int caseID = 1;
            var request = new UpdateCaseDetailsRequest()
            {
                caseID = caseID,
                caseName = "UTD_EO_1",
                plantID = 1,
                processFrequency = 60,
                slot = 1,
                referenceDocUrl = "https://sin.ecm.sabic.com/ecm/livelink.exe/app/nodes/814890639",
                description = "United Energy Optimization"
            };
            string response = "Record Updated";
            var mockCCPRepository = new Mock<ICcpRepository>();
            mockCCPRepository.Setup(r => r.PostUpdateCaseDetailsAsync(request)).ReturnsAsync(response);
          
            var ccpServicesMock = new CcpServices(mockCCPRepository.Object);

            var configurationMock = new Mock<IConfiguration>();
           
            var accountServicesMock = new Mock<IAccountServices>();

            var mockConfigServices = new Mock<IConfigServices>();
            var controller = new CcpController(ccpServicesMock, configurationMock.Object, accountServicesMock.Object, mockConfigServices.Object);

            // Mocking the service method
            accountServicesMock.Setup(s => s.GetCaseIDCountFromCaseIDListAsync(caseID.ToString()))
                .ReturnsAsync(1);  // Return 1 when GetCaseIDCountFromCaseIDListAsync is called with the caseID

            // Act
            var result = await controller.PostUpdateCaseDetails(request);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            Assert.NotNull(okResult);  // Optionally check if the result is not null
                                       // You can also verify that the response value is as expected
            
        }

        [Fact]
        public async Task PostUpdateCaseDetails_WithInvalidCaseID_ReturnsBadRequest()
        {
            // Arrange
            var request = new UpdateCaseDetailsRequest
            {
                caseID = 999,
                caseName = "Invalid Case",
                plantID = 1,
                processFrequency = 60,
                slot = 1,
                referenceDocUrl = "http://invalid.com",
                description = "Invalid test"
            };

            var mockCCPRepository = new Mock<ICcpRepository>();
           
            var mockAccountServices = new Mock<IAccountServices>();
            var mockConfigServices = new Mock<IConfigServices>();
            var mockConfiguration = new Mock<IConfiguration>();

            mockAccountServices.Setup(s => s.GetCaseIDCountFromCaseIDListAsync(request.caseID.ToString()))
                               .ReturnsAsync(0);

            var ccpServices = new CcpServices(mockCCPRepository.Object);
            var controller = new CcpController(
                ccpServices,
                mockConfiguration.Object,
                mockAccountServices.Object,
                mockConfigServices.Object
            );

            // Act
            var result = await controller.PostUpdateCaseDetails(request);

            // Assert
            var badRequestResult = Assert.IsType<BadRequestObjectResult>(result);
            var responseObj = Assert.IsType<Response<Array>>(badRequestResult.Value);
            Assert.Equal(ResponseConstants.EMPTYDATA, responseObj.data);
        }
        #endregion

        #region PostDeleteCaseDetails
        [Fact]
        public async Task PostDeleteCaseDetailsWithOkResult()
        {
            int caseID = 1;

            var request = new DeleteCaseDetailsRequest()
            {
                caseID = 1,
                isActive = 1
            };

            var response = "Data Deleted";

            var mockCCPRepository = new Mock<ICcpRepository>();
            mockCCPRepository.Setup(r => r.PostDeleteCaseDetailsAsync(request)).ReturnsAsync(response);
           
            var ccpServicesMock = new CcpServices(mockCCPRepository.Object);
            var configurationMock = new Mock<IConfiguration>();
           
            var accountServicesMock = new Mock<IAccountServices>();



            var mockConfigServices = new Mock<IConfigServices>();
            var controller = new CcpController(ccpServicesMock, configurationMock.Object, accountServicesMock.Object, mockConfigServices.Object);

            // Mocking the service method
            accountServicesMock.Setup(s => s.GetCaseIDCountFromCaseIDListAsync(caseID.ToString()))
                .ReturnsAsync(1);  // Return 1 when GetCaseIDCountFromCaseIDListAsync is called with the caseID

            // Act
            var result = await controller.PostDeleteCaseDetails(request);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            

            var resp = Assert.IsType<Response<object>>(okResult.Value);
            Assert.NotNull(resp);
        }

        [Fact]
        public async Task PostDeleteCaseDetailsWithNoResult()
        {
            int caseID = 1;

            var request = new DeleteCaseDetailsRequest()
            {
                caseID = 1,
                isActive = 1
            };

            string response = null!;

            var mockCCPRepository = new Mock<ICcpRepository>();
            mockCCPRepository.Setup(r => r.PostDeleteCaseDetailsAsync(request))!.ReturnsAsync(response);
            
            var ccpServicesMock = new CcpServices(mockCCPRepository.Object);
            var configurationMock = new Mock<IConfiguration>();
           
            var accountServicesMock = new Mock<IAccountServices>();



            var mockConfigServices = new Mock<IConfigServices>();
            var controller = new CcpController(ccpServicesMock, configurationMock.Object, accountServicesMock.Object, mockConfigServices.Object);

            // Mocking the service method
            accountServicesMock.Setup(s => s.GetCaseIDCountFromCaseIDListAsync(caseID.ToString()))
                .ReturnsAsync(1);  // Return 1 when GetCaseIDCountFromCaseIDListAsync is called with the caseID

            // Act
            var result = await controller.PostDeleteCaseDetails(request);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            Assert.NotNull(okResult);  // Optionally check if the result is not null
                                       // You can also verify that the response value is as expected
           




        }

        [Fact]
        public async Task PostDeleteCaseDetailsInvalidCaseID()
        {

            int caseID = 99999999; 

            var request = new DeleteCaseDetailsRequest()
            {
                caseID = caseID,
                isActive = 1
            };

            string response = null!;

            var mockCCPRepository = new Mock<ICcpRepository>();
            mockCCPRepository.Setup(r => r.PostDeleteCaseDetailsAsync(request))!.ReturnsAsync(response);
            
            var ccpServicesMock = new CcpServices(mockCCPRepository.Object);
            var configurationMock = new Mock<IConfiguration>();
          
            
            var accountServicesMock = new Mock<IAccountServices>();



            var mockConfigServices = new Mock<IConfigServices>();
            var controller = new CcpController(ccpServicesMock, configurationMock.Object, accountServicesMock.Object, mockConfigServices.Object);

            // Mocking the service method
            accountServicesMock.Setup(s => s.GetCaseIDCountFromCaseIDListAsync(caseID.ToString()))
                .ReturnsAsync(0);  // Return 1 when GetCaseIDCountFromCaseIDListAsync is called with the caseID

            // Act
            var result = await controller.PostDeleteCaseDetails(request);

            // Assert
            var okResult = Assert.IsType<BadRequestObjectResult>(result);
            Assert.NotNull(okResult);  
           
        }
        #endregion

        #region PostAddCaseDetails 
        [Fact]
        public async Task PostAddCaseDetailsWithOKResult()
        {
            var request = new InsertCaseDetailsRequest()
            {
                active = 1,
                plantID = 1,
                caseName = "Some text",
                processFrequency = 1,
                slot = 1,
                description = "some text"

            };
            var response = "Data Insert";
            var mockCCPRepository = new Mock<ICcpRepository>();
            mockCCPRepository.Setup(r => r.PostAddCaseDetailsAsync(request)).ReturnsAsync(response);
            
            var ccpServicesMock = new CcpServices(mockCCPRepository.Object);
            var configurationMock = new Mock<IConfiguration>();
           
            var accountServicesMock = new Mock<IAccountServices>();



            var mockConfigServices = new Mock<IConfigServices>();
            var controller = new CcpController(ccpServicesMock, configurationMock.Object, accountServicesMock.Object, mockConfigServices.Object);

            var result = await controller.PostAddCaseDetails(request);
            var okResult = Assert.IsType<OkObjectResult>(result);
            Assert.NotNull(okResult);  // Optionally check if the result is not null

           



        }

        [Fact]
        public async Task PostAddCaseDetailsWithNoResult()
        {

            var request = new InsertCaseDetailsRequest()
            {
                //active = 1,
                //plantID = 1,
                //caseName = "Some text",
                //processFrequency = 1,
                //slot = 1,
                //description = "some text"

            };
            string response = null!;
            var mockCCPRepository = new Mock<ICcpRepository>();


            mockCCPRepository.Setup(r => r.PostAddCaseDetailsAsync(request))!.ReturnsAsync(response);

            // Act
            var result1 = await mockCCPRepository.Object.PostAddCaseDetailsAsync(request);

            // Assert
            Assert.Null(result1);  // Check that the result is null
            
            var ccpServicesMock = new CcpServices(mockCCPRepository.Object);
            var configurationMock = new Mock<IConfiguration>();
            
            var accountServicesMock = new Mock<IAccountServices>();



            var mockConfigServices = new Mock<IConfigServices>();
            var controller = new CcpController(ccpServicesMock, configurationMock.Object, accountServicesMock.Object, mockConfigServices.Object);

            var result = await controller.PostAddCaseDetails(request);
            var okResult = Assert.IsType<OkObjectResult>(result);
            Assert.NotNull(okResult);  // Optionally check if the result is not null

           
        }
        #endregion

        #region UpdateTagDetailsInAfAndCcpTable
        [Fact]
        public void UpdateTagDetailsInAfAndCcpTableReturnsOkWhenDataUpdated()
        {
            // Arrange
            var request = new UpdateCcpAndPiAttributeValueRequest
            {
                tagStuckSwitch = 1,
                modelID = 12,
                tagName = "tag name",
                type = "pi",
                piTagName = "something",
                equipmentName = "equipment",
                max = 12,
                min = 10,
                tagOutOfBoundSwitch = 1,
                piAfTag = 1,
                tagID = 111,
                tagBoundAtLimitsSwitch = 1,
                defaultSwitch = 1,
                defaultValue = 1,
                tagNanSwitch = 1,
               
                createdBy = 1
            };

            var response = new UpdateTagsCcpAndPiAfResponse
            {
                status = 200,
                attributes = new Attributes
                {
                    attributes_failed = new List<string> { "DF", "DS" },
                    attributes_success = new List<string> { "DF", "DS" }
                },
                message = "Tag updated successfully"
            };

            var mockCcpRepository = new Mock<ICcpRepository>();
            mockCcpRepository.Setup(x => x.UpsertTagDetailsInCcpTable(request))
                        .ReturnsAsync(1);

            
            var mockCcpServices = new Mock<ICcpServices>();
            mockCcpServices.Setup(x => x.UpdateTagDetailsInAfAndCcpTable(It.IsAny<UpdateCcpAndPiAttributeValueRequest>()))
                            .ReturnsAsync(response);

            var mockConfiguration = new Mock<IConfiguration>();
            var mockAccountServices = new Mock<IAccountServices>();
            var mockConfigServices = new Mock<IConfigServices>();

            var claims = new List<Claim>
            {
                new Claim("uid", "123"),
                new Claim("jti", "1241s-asfas-asrwq-4qwr")
            };

            var identity = new ClaimsIdentity(claims, "TestAuth");
            var user = new ClaimsPrincipal(identity);
            var httpContext = new DefaultHttpContext();
            httpContext.User = user;

            var ccpController = new CcpController(mockCcpServices.Object,
                                                  mockConfiguration.Object,
                                                  mockAccountServices.Object,
                                                  mockConfigServices.Object);
            ccpController.ControllerContext.HttpContext = httpContext;
            // Act
            var result = ccpController.UpdateTagDetailsInAfAndCcpTable(request);

            // Assert
            Assert.IsType<OkObjectResult>(result.Result);
        }


        [Fact]
        public void UpdateTagDetailsInAfAndCcpTableReturnsBadRequestWhenDataUpdated()
        {
            // Arrange
            var request = new UpdateCcpAndPiAttributeValueRequest
            {
                tagStuckSwitch = 1,
                modelID = 12,
                tagName = "tag name",
                type = "pi",
                piTagName = "something",
                equipmentName = "equipment",
                max = 12,
                min = 10,
                tagOutOfBoundSwitch = 1,
                piAfTag = 1,
                tagID = 111,
                tagBoundAtLimitsSwitch = 1,
                defaultSwitch = 1,
                defaultValue = 1,
                tagNanSwitch = 1,
                createdBy = 1
            };

            var response = new UpdateTagsCcpAndPiAfResponse
            {
                status = 500,
                attributes = new Attributes
                {
                    attributes_failed = new List<string> { "DF", "DS" },
                    attributes_success = new List<string> { "DF", "DS" }
                },
                message = "Tag was not updated successfully"
            };

            var mockCcpRepository = new Mock<ICcpRepository>();
            mockCcpRepository.Setup(x => x.UpsertTagDetailsInCcpTable(request))
                        .ReturnsAsync(1);

           

            var mockCcpServices = new Mock<ICcpServices>();
            mockCcpServices.Setup(x => x.UpdateTagDetailsInAfAndCcpTable(It.IsAny<UpdateCcpAndPiAttributeValueRequest>()))
                            .ReturnsAsync(response);

            var mockConfiguration = new Mock<IConfiguration>();
            var mockAccountServices = new Mock<IAccountServices>();
            var mockConfigServices = new Mock<IConfigServices>();

            var claims = new List<Claim>
            {
                new Claim("uid", "123"),
                new Claim("jti", "1241s-asfas-asrwq-4qwr")
            };

            var identity = new ClaimsIdentity(claims, "TestAuth");
            var user = new ClaimsPrincipal(identity);
            var httpContext = new DefaultHttpContext();
            httpContext.User = user;

            var ccpController = new CcpController(mockCcpServices.Object,
                                                  mockConfiguration.Object,
                                                  mockAccountServices.Object,
                                                  mockConfigServices.Object);
            ccpController.ControllerContext.HttpContext = httpContext;
            // Act
            var result = ccpController.UpdateTagDetailsInAfAndCcpTable(request);

            // Assert
            Assert.IsType<BadRequestObjectResult>(result.Result);
        }


        [Fact]
        public void UpdateTagDetailsInAfAndCcpTableReturnsOkWhenPiAfNotNeededToBeUpdated()
        {
            // Arrange
            var request = new UpdateCcpAndPiAttributeValueRequest
            {
                tagStuckSwitch = 1,
                modelID = 12,
                tagName = "tag name",
                type = "not pi",
                createdBy = 1,
                
            };

           

            var mockCcpRepository = new Mock<ICcpRepository>();
            mockCcpRepository.Setup(x => x.UpsertTagDetailsInCcpTable(request))
                            .ReturnsAsync(1);

            
            var ccpServices = new CcpServices(mockCcpRepository.Object);

            var mockConfiguration = new Mock<IConfiguration>();
            var mockAccountServices = new Mock<IAccountServices>();
            var mockConfigServices = new Mock<IConfigServices>();

            var claims = new List<Claim>
            {
                new Claim("uid", "123"),
                new Claim("jti", "1241s-asfas-asrwq-4qwr")
            };

            var identity = new ClaimsIdentity(claims, "TestAuth");
            var user = new ClaimsPrincipal(identity);
            var httpContext = new DefaultHttpContext();
            httpContext.User = user;

            var ccpController = new CcpController(ccpServices,
                                                  mockConfiguration.Object,
                                                  mockAccountServices.Object,
                                                  mockConfigServices.Object);
            ccpController.ControllerContext.HttpContext = httpContext;

            // Act
            var result = ccpController.UpdateTagDetailsInAfAndCcpTable(request);

            // Assert
            Assert.IsType<OkObjectResult>(result.Result);
        }

        [Fact]
        public void UpdateTagDetailsInAfAndCcpTableReturnsBadRequestWhenPiAfNeedsToBeUpdatedButFails()
        {
            // Arrange
            var request = new UpdateCcpAndPiAttributeValueRequest
            {
                tagStuckSwitch = 1,
                modelID = 12,
                tagName = "tag name",
                type = "pi",
                piTagName = "something",
                equipmentName = "equipment",
                max = 12,
                min = 10,
                tagOutOfBoundSwitch = 1,
                piAfTag = 1,
                tagID = 111,
                tagBoundAtLimitsSwitch = 1,
                defaultSwitch = 1,
                defaultValue = 1,
                tagNanSwitch = 1,
                
                createdBy = 1
            };

            var response = new UpdateTagsCcpAndPiAfResponse
            {
                status = 400,
                attributes = new Attributes
                {
                    attributes_failed = new List<string> { "DF", "DS" },
                    attributes_success = new List<string> { "DF", "DS" }
                },
                message = "Tag was not updated successfully"
            };

            var mockCcpRepository = new Mock<ICcpRepository>();
            mockCcpRepository.Setup(x => x.UpsertTagDetailsInCcpTable(request))
                        .ReturnsAsync(1);

           

            var mockCcpServices = new Mock<ICcpServices>();
            mockCcpServices.Setup(x => x.UpdateTagDetailsInAfAndCcpTable(It.IsAny<UpdateCcpAndPiAttributeValueRequest>()))
                            .ReturnsAsync(response);

            var mockConfiguration = new Mock<IConfiguration>();
            var mockAccountServices = new Mock<IAccountServices>();
            var mockConfigServices = new Mock<IConfigServices>();

            var claims = new List<Claim>
            {
                new Claim("uid", "123"),
                new Claim("jti", "1241s-asfas-asrwq-4qwr")
            };

            var identity = new ClaimsIdentity(claims, "TestAuth");
            var user = new ClaimsPrincipal(identity);
            var httpContext = new DefaultHttpContext();
            httpContext.User = user;

            var ccpController = new CcpController(mockCcpServices.Object,
                                                  mockConfiguration.Object,
                                                  mockAccountServices.Object,
                                                  mockConfigServices.Object);
            ccpController.ControllerContext.HttpContext = httpContext;
            // Act
            var result = ccpController.UpdateTagDetailsInAfAndCcpTable(request);

            // Assert
            Assert.IsType<BadRequestObjectResult>(result.Result);
        }


        [Fact]
        public void UpdateTagDetailsInAfAndCcpTableReturnsOkRequestWhenPiAfNeedsToBeUpdatedAndWorks()
        {
            // Arrange
            var request = new UpdateCcpAndPiAttributeValueRequest
            {
                tagStuckSwitch = 1,
                modelID = 12,
                tagName = "tag name",
                type = "pi",
                piTagName = "something",
                equipmentName = "equipment",
                max = 12,
                min = 10,
                tagOutOfBoundSwitch = 1,
                piAfTag = 1,
                tagID = 111,
                tagBoundAtLimitsSwitch = 1,
                defaultSwitch = 1,
                defaultValue = 1,
                tagNanSwitch = 1,
               
                createdBy = 1
            };

            

           

            var mockCcpRepository = new Mock<ICcpRepository>();
            mockCcpRepository.Setup(x => x.UpsertTagDetailsInCcpTable(request))
                        .ReturnsAsync(1);

            

            var ccpServices = new CcpServices(mockCcpRepository.Object);

            var mockConfiguration = new Mock<IConfiguration>();
            var mockAccountServices = new Mock<IAccountServices>();
            var mockConfigServices = new Mock<IConfigServices>();

            var claims = new List<Claim>
            {
                new Claim("uid", "123"),
                new Claim("jti", "1241s-asfas-asrwq-4qwr")
            };

            var identity = new ClaimsIdentity(claims, "TestAuth");
            var user = new ClaimsPrincipal(identity);
            var httpContext = new DefaultHttpContext();
            httpContext.User = user;

            var ccpController = new CcpController(ccpServices,
                                                  mockConfiguration.Object,
                                                  mockAccountServices.Object,
                                                  mockConfigServices.Object);
            ccpController.ControllerContext.HttpContext = httpContext;

            // Act
            var result = ccpController.UpdateTagDetailsInAfAndCcpTable(request);

            // Assert
            Assert.IsType<OkObjectResult>(result.Result);
        }

        
        
        #endregion

        [Fact]
        public async Task GetTagsDataForValidation_ReturnsEmptyOk_WhenResultIsNull()
        {
            // Arrange
            var request = new GetTagsDataByCaseIDRequest { caseId = 1 };
            var mockConfiguration = new Mock<IConfiguration>();
            var mockAccountServices = new Mock<IAccountServices>();
            var mockConfigServices = new Mock<IConfigServices>();
            var mockCcpRepository = new Mock<ICcpRepository>();
            
            var ccpServices = new CcpServices(mockCcpRepository.Object);
            var ccpController = new CcpController(ccpServices,
                                                  mockConfiguration.Object,
                                                  mockAccountServices.Object,
                                                  mockConfigServices.Object);
            mockCcpRepository.Setup(s => s.GetTagsDataForValidationAsync(request))
                            .ReturnsAsync((object)null!);
            // Act
            var result = await ccpController.GetTagsDataForValidation(request);

            // Assert
          

           
            var RequestResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<Response<Array>>(RequestResult.Value);
            Assert.Equal(204, response.statuscode);
        }


        [Fact]
        public async Task GetTagsDataForValidation_ReturnsOkWithData_WhenResultIsNotNull()
        {
            // Arrange
            var request = new GetTagsDataByCaseIDRequest { caseId = 1 };
            var expectedData = new { Tag = "Example" };
            var mockConfiguration = new Mock<IConfiguration>();
            var mockAccountServices = new Mock<IAccountServices>();
            var mockConfigServices = new Mock<IConfigServices>();
            var mockCcpRepository = new Mock<ICcpRepository>();
           
            var ccpServices = new CcpServices(mockCcpRepository.Object);
            var ccpController = new CcpController(ccpServices,
                                                  mockConfiguration.Object,
                                                  mockAccountServices.Object,
                                                  mockConfigServices.Object);
            mockCcpRepository.Setup(s => s.GetTagsDataForValidationAsync(request))
                            .ReturnsAsync(expectedData);
            // Act
            var result = await ccpController.GetTagsDataForValidation(request);

            // Assert
            Assert.IsType<OkObjectResult>(result);
        }

        [Fact]
        public async Task GetEOTagsDataByCaseID_ReturnsEmptyOk_WhenResultIsNull()
        {
            // Arrange
            var request = new GetTagsDataByCaseIDRequest { caseId = 1 };
            var GetTagsDataByCaseIDPageCountResponse = new GetTagsDataByCaseIDPageCountResponse();
            var mockConfiguration = new Mock<IConfiguration>();
            var mockAccountServices = new Mock<IAccountServices>();
            var mockConfigServices = new Mock<IConfigServices>();
            var mockCcpRepository = new Mock<ICcpRepository>();
         
            var ccpServices = new CcpServices(mockCcpRepository.Object);
            var ccpController = new CcpController(ccpServices,
                                                  mockConfiguration.Object,
                                                  mockAccountServices.Object,
                                                  mockConfigServices.Object);
            mockCcpRepository.Setup(s => s.GetEOTagsDataByCaseIDAsync(request))
                            .ReturnsAsync(GetTagsDataByCaseIDPageCountResponse);

            // Act
            var result = await ccpController.GetEOTagsDataByCaseID(request) as OkObjectResult;

            // Assert
            Assert.NotNull(result);
            
        }

        [Fact]
        public async Task GetEOTagsDataByCaseID_ReturnsOkWithData_WhenResultIsNotNull()
        {
            // Arrange
            var request = new GetTagsDataByCaseIDRequest
            {
                caseId = 1
            };
            
            var GetTagsDataByCaseIDPageCountResponse = new GetTagsDataByCaseIDPageCountResponse
            {
                GetTagsDataByCaseIDPageResponse = new List<GetTagsDataByCaseIDPageResponse>
                {
                    new GetTagsDataByCaseIDPageResponse{
                    tagID=1,
                    modelID=1,
                    modelDescription="Test",

                } },
                pageCount = 1

            };
            var mockConfiguration = new Mock<IConfiguration>();
            var mockAccountServices = new Mock<IAccountServices>();
            var mockConfigServices = new Mock<IConfigServices>();
            var mockCcpRepository = new Mock<ICcpRepository>();
            
            var ccpServices = new CcpServices(mockCcpRepository.Object);
            var ccpController = new CcpController(ccpServices,
                                                  mockConfiguration.Object,
                                                  mockAccountServices.Object,
                                                  mockConfigServices.Object);

            mockCcpRepository.Setup(s => s.GetEOTagsDataByCaseIDAsync(request))
                            .ReturnsAsync(GetTagsDataByCaseIDPageCountResponse);

            // Act
            var result = await ccpController.GetEOTagsDataByCaseID(request) as OkObjectResult;

            // Assert
            Assert.NotNull(result);
           
        }

        [Fact]
        public async Task GetBlockDetails_ReturnsEmptyOk_WhenNoBlocks()
        {
            // Arrange
            var mockCcpRepository = new Mock<ICcpRepository>();
            var mockConfiguration = new Mock<IConfiguration>();
            var mockAccountServices = new Mock<IAccountServices>();
            var mockConfigServices = new Mock<IConfigServices>();
            
            var ccpServices = new CcpServices(mockCcpRepository.Object);
            var ccpController = new CcpController(ccpServices,
                                                  mockConfiguration.Object,
                                                  mockAccountServices.Object,
                                                  mockConfigServices.Object);
            mockCcpRepository.Setup(s => s.GetBlocksAsync())
                            .ReturnsAsync(new List<object>());

            // Act
            var result = await ccpController.GetBlockDetails() as OkObjectResult;

            // Assert
            Assert.NotNull(result);
            var response = Assert.IsType<Response<Array>>(result.Value);
            Assert.Equal(204, response.statuscode);
        }

        [Fact]
        public async Task GetBlockDetails_ReturnsOkWithData_WhenBlocksExist()
        {
            // Arrange
            var mockData = new List<object>
    {
        new { BlockId = 1, Name = "Block A" }
    };
            var mockCcpRepository = new Mock<ICcpRepository>();
            var mockConfiguration = new Mock<IConfiguration>();
            var mockAccountServices = new Mock<IAccountServices>();
            var mockConfigServices = new Mock<IConfigServices>();
            
            var ccpServices = new CcpServices(mockCcpRepository.Object);
            var ccpController = new CcpController(ccpServices,
                                                  mockConfiguration.Object,
                                                  mockAccountServices.Object,
                                                  mockConfigServices.Object);
            mockCcpRepository.Setup(s => s.GetBlocksAsync())
                            .ReturnsAsync(mockData);

            // Act
            var result = await ccpController.GetBlockDetails() as OkObjectResult;

            // Assert
            Assert.NotNull(result);
            var response = Assert.IsType<Response<object>>(result.Value);
            Assert.Equal(mockData, response.data);
        }

        [Fact]
        public async Task GetModelNamesByCaseIdDataAsync_ReturnsEmptyOk_WhenResultIsNull()
        {
            // Arrange
            var request = new GetModelNamesByCaseIdDataRequest { caseID = 1 };
            var mockCcpRepository = new Mock<ICcpRepository>();
            var mockConfiguration = new Mock<IConfiguration>();
            var mockAccountServices = new Mock<IAccountServices>();
            var mockConfigServices = new Mock<IConfigServices>();
            
            var ccpServices = new CcpServices(mockCcpRepository.Object);
            var ccpController = new CcpController(ccpServices,
                                                  mockConfiguration.Object,
                                                  mockAccountServices.Object,
                                                  mockConfigServices.Object);
            mockCcpRepository.Setup(s => s.GetModelNamesByCaseIdDataAsync(request))
                            .ReturnsAsync((object)null!);

            // Act
            var result = await ccpController.GetModelNamesByCaseIdDataAsync(request);

            // Assert
            Assert.IsType<OkObjectResult>(result);
        }

        [Fact]
        public async Task GetModelNamesByCaseIdDataAsync_ReturnsOkWithData_WhenResultIsNotNull()
        {
            // Arrange
            var request = new GetModelNamesByCaseIdDataRequest
            {
                caseID = 1
            };
            var expectedData = new { ModelName = "ModelX" };
            var mockCcpRepository = new Mock<ICcpRepository>();
            var mockConfiguration = new Mock<IConfiguration>();
            var mockAccountServices = new Mock<IAccountServices>();
            var mockConfigServices = new Mock<IConfigServices>();
            
            var ccpServices = new CcpServices(mockCcpRepository.Object);
            var ccpController = new CcpController(ccpServices,
                                                  mockConfiguration.Object,
                                                  mockAccountServices.Object,
                                                  mockConfigServices.Object);
            mockCcpRepository.Setup(s => s.GetModelNamesByCaseIdDataAsync(request))
                            .ReturnsAsync(expectedData);

            // Act
            var result = await ccpController.GetModelNamesByCaseIdDataAsync(request) as OkObjectResult;

            // Assert
            Assert.NotNull(result);
            var response = Assert.IsType<Response<object>>(result.Value);
            Assert.Equal(expectedData, response.data);
        }

        [Fact]
        public async Task DeleteTagDataAsync_ReturnsEmptyOk_WhenResultIsNull()
        {
            // Arrange
            var request = new DeleteTagDataRequest { tagID = 1 };
            var mockCcpRepository = new Mock<ICcpRepository>();
            var mockConfiguration = new Mock<IConfiguration>();
            var mockAccountServices = new Mock<IAccountServices>();
            var mockConfigServices = new Mock<IConfigServices>();
            
            var ccpServices = new CcpServices(mockCcpRepository.Object);
            var ccpController = new CcpController(ccpServices,
                                                  mockConfiguration.Object,
                                                  mockAccountServices.Object,
                                                  mockConfigServices.Object);
            mockCcpRepository.Setup(s => s.DeleteTagDataAsync(null!));


            // Act
            var result = await ccpController.DeleteTagDataAsync(request) as OkObjectResult;

            // Assert
            Assert.NotNull(result);
            var response = Assert.IsType<Response<Array>>(result.Value);
            Assert.Equal(ResponseConstants.EMPTYDATA, response.data);
        }

        [Fact]
        public async Task DeleteTagDataAsync_ReturnsOkWithData_WhenResultIsNotNull()
        {
            // Arrange
            var request = new DeleteTagDataRequest { tagID = 1 };
            
            var expectedResult = "Deleted successfully";
            
            var mockConfiguration = new Mock<IConfiguration>();
            var mockAccountServices = new Mock<IAccountServices>();
            var mockConfigServices = new Mock<IConfigServices>();
            
            
            var mockCcpServices = new Mock<ICcpServices>();

            mockCcpServices.Setup(s => s.DeleteTagDataAsync(It.IsAny<DeleteTagDataRequest>())).ReturnsAsync(expectedResult);

            var ccpController = new CcpController(mockCcpServices.Object,
                                                  mockConfiguration.Object,
                                                  mockAccountServices.Object,
                                                  mockConfigServices.Object);

            

            // Act
            var result = await ccpController.DeleteTagDataAsync(request) as OkObjectResult;

            // Assert
            Assert.IsType<OkObjectResult>(result);
        }

        [Fact]
        public async Task AddTagReturnsOk_WhenResultContainsSuccess()
        {
            // Arrange
            var request = new AddTagRequest
            {
                caseID = 1
            };
            var mockCcpRepository = new Mock<ICcpRepository>();
            var mockConfiguration = new Mock<IConfiguration>();
            var mockAccountServices = new Mock<IAccountServices>();
            var mockConfigServices = new Mock<IConfigServices>();
           
            var ccpServices = new CcpServices(mockCcpRepository.Object);
            var ccpController = new CcpController(ccpServices,
                                                  mockConfiguration.Object,
                                                  mockAccountServices.Object,
                                                  mockConfigServices.Object);
            mockCcpRepository.Setup(x => x.AddTagAsync(request)).ReturnsAsync("Tag succesfully added");

            // Act
            var result = await ccpController.AddTag(request);

            // Assert
           
            var okResult = Assert.IsType<OkObjectResult>(result);
            Assert.NotNull(okResult);
        }

        [Fact]
        public async Task AddTagReturnsBadRequest_WhenResultDoesNotContainSuccess()
        {
            // Arrange
            var request = new AddTagRequest();
            var expectedResult = "Tag could not be added";
            var mockCcpRepository = new Mock<ICcpRepository>();
            var mockConfiguration = new Mock<IConfiguration>();
            var mockAccountServices = new Mock<IAccountServices>();
            var mockConfigServices = new Mock<IConfigServices>();
            
            var ccpServices = new CcpServices(mockCcpRepository.Object);
            var ccpController = new CcpController(ccpServices,
                                                  mockConfiguration.Object,
                                                  mockAccountServices.Object,
                                                  mockConfigServices.Object);
            mockCcpRepository.Setup(service => service.AddTagAsync(request))
                .ReturnsAsync(expectedResult);

            // Act
            var result = await ccpController.AddTag(request);

            // Assert
            var badRequestResult = Assert.IsType<BadRequestObjectResult>(result);
            Assert.Equal(400,badRequestResult.StatusCode);
        }

        [Fact]
        public async Task UpdateTag_ReturnsOk_WhenResultContainsUpdated()
        {
            // Arrange
            var request = new UpdateTagRequest
            {
                tagID = 1
            };
            var expectedResult = "Tag updated successfully";
            var mockCcpRepository = new Mock<ICcpRepository>();
            var mockConfiguration = new Mock<IConfiguration>();
            var mockAccountServices = new Mock<IAccountServices>();
            var mockConfigServices = new Mock<IConfigServices>();
            
            var ccpServices = new CcpServices(mockCcpRepository.Object);
            var ccpController = new CcpController(ccpServices,
                                                  mockConfiguration.Object,
                                                  mockAccountServices.Object,
                                                  mockConfigServices.Object);
            mockCcpRepository.Setup(service => service.UpdateTagAsync(request))
                .ReturnsAsync(expectedResult);

            // Act
            var result = await ccpController.UpdateTag(request);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            Assert.Equal(200, okResult.StatusCode);
        }

        [Fact]
        public async Task UpdateTag_ReturnsBadRequest_WhenResultDoesNotContainUpdated()
        {
            // Arrange
            var request = new UpdateTagRequest();

            var mockCcpRepository = new Mock<ICcpRepository>();
            var mockConfiguration = new Mock<IConfiguration>();
            var mockAccountServices = new Mock<IAccountServices>();
            var mockConfigServices = new Mock<IConfigServices>();
            

            mockCcpRepository.Setup(service => service.UpdateTagAsync(request))
                .ReturnsAsync("Tag failed to update");

            var ccpServices = new CcpServices(mockCcpRepository.Object);
            var ccpController = new CcpController(ccpServices,
                                                  mockConfiguration.Object,
                                                  mockAccountServices.Object,
                                                  mockConfigServices.Object);

            // Act
            var result = await ccpController.UpdateTag(request);

            // Assert
            var badRequestResult = Assert.IsType<BadRequestObjectResult>(result);
            Assert.Equal(400,badRequestResult.StatusCode);
        }

        [Fact]
        public async Task UpdateCCP_ReturnsEmptyOk_WhenResultIsZero()
        {
            // Arrange
            var request = new UpdateCcpRequest();
            var mockCcpRepository = new Mock<ICcpRepository>();
            var mockConfiguration = new Mock<IConfiguration>();
            var mockAccountServices = new Mock<IAccountServices>();
            var mockConfigServices = new Mock<IConfigServices>();
            
            var ccpServices = new CcpServices(mockCcpRepository.Object);
            var ccpController = new CcpController(ccpServices,
                                                  mockConfiguration.Object,
                                                  mockAccountServices.Object,
                                                  mockConfigServices.Object);
            mockCcpRepository.Setup(service => service.UpdateCCP(request)).ReturnsAsync(0);

            // Act
            var result = await ccpController.UpdateCCP(request);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<Response<Array>>(okResult.Value);
            Assert.Equal(204,response.statuscode);
        }

        [Fact]
        public async Task UpdateCCP_ReturnsSuccessResult_WhenResultIsNonZero()
        {
            // Arrange
            var request = new UpdateCcpRequest
            {
                modelID = 1
            };
            var expectedResult = 1;
            var mockCcpRepository = new Mock<ICcpRepository>();
            var mockConfiguration = new Mock<IConfiguration>();
            var mockAccountServices = new Mock<IAccountServices>();
            var mockConfigServices = new Mock<IConfigServices>();
            
            var ccpServices = new CcpServices(mockCcpRepository.Object);
            var ccpController = new CcpController(ccpServices,
                                                  mockConfiguration.Object,
                                                  mockAccountServices.Object,
                                                  mockConfigServices.Object);
            mockCcpRepository.Setup(service => service.UpdateCCP(request)).ReturnsAsync(expectedResult);

            // Act
            var result = await ccpController.UpdateCCP(request);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            Assert.Equal(200, okResult.StatusCode);
        }

        [Fact]
        public async Task GetTagDataForUpdate_ReturnsEmptyOk_WhenResultIsNull()
        {
            // Arrange
            var request = new GetTagDataForUpdateRequest();
            var mockCcpRepository = new Mock<ICcpRepository>();
            var mockConfiguration = new Mock<IConfiguration>();
            var mockAccountServices = new Mock<IAccountServices>();
            var mockConfigServices = new Mock<IConfigServices>();
            
            var ccpServices = new CcpServices(mockCcpRepository.Object);
            var ccpController = new CcpController(ccpServices,
                                                  mockConfiguration.Object,
                                                  mockAccountServices.Object,
                                                  mockConfigServices.Object);
            mockCcpRepository.Setup(service => service.GetTagDataForUpdateAsync(null!));

            // Act
            var result = await ccpController.GetTagDataForUpdate(request);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<Response<Array>>(okResult.Value);
            Assert.Equal(204,response.statuscode);
        }

        [Fact]
        public async Task GetTagDataForUpdate_ReturnsSuccessResult_WhenResultIsNotNull()
        {
            // Arrange
            var request = new GetTagDataForUpdateRequest
            {
                tagID = 1
            };

            var mockCcpRepository = new Mock<ICcpRepository>();
            var mockConfiguration = new Mock<IConfiguration>();
            var mockAccountServices = new Mock<IAccountServices>();
            var mockConfigServices = new Mock<IConfigServices>();
           

            var expectedResult = new GetTagDataForUpdateResponse();

            mockCcpRepository.Setup(r => r.GetTagDataForUpdateAsync(It.Is<GetTagDataForUpdateRequest>(x => x.tagID == request.tagID)))
                             .ReturnsAsync(expectedResult);

            var ccpServices = new CcpServices(mockCcpRepository.Object);
            var ccpController = new CcpController(
                ccpServices,
                mockConfiguration.Object,
                mockAccountServices.Object,
                mockConfigServices.Object
            );

            // Act
            var result = await ccpController.GetTagDataForUpdate(request);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<Response<object>>(okResult.Value);
            Assert.Equal(expectedResult, response.data);
        }


        [Fact]
        public async Task GetAffectedModelIdsByTagId_ReturnsDataResponse_WhenDataExists()
        {
            // Arrange
            var request = new GetAffectedModelIdsByTagIdRequest
            {
                tagId = 1,
                modelId = 100
            };

            var mockData = new List<object> { new { Id = 1 } };
            var mockCcpRepository = new Mock<ICcpRepository>();
            var mockConfiguration = new Mock<IConfiguration>();
            var mockAccountServices = new Mock<IAccountServices>();
            var mockConfigServices = new Mock<IConfigServices>();
            

            mockCcpRepository
                .Setup(repo => repo.GetAffectedModelIdsByTagId(request))
                .ReturnsAsync(mockData);

            var ccpServices = new CcpServices(mockCcpRepository.Object);
            var controller = new CcpController(ccpServices,
                                               mockConfiguration.Object,
                                               mockAccountServices.Object,
                                               mockConfigServices.Object);

            // Act
            var result = await controller.GetAffectedModelIdsByTagId(request);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);

            var response = Assert.IsType<Response<object>>(okResult.Value);
            Assert.Equal(200, response.statuscode);
        }

        [Fact]
        public async Task GetAffectedModelIdsByTagId_ReturnsEmptyOkResponse_WhenNoData()
        {
            // Arrange
            var request = new GetAffectedModelIdsByTagIdRequest
            {
                tagId = 1,
                modelId = 100
            };

            var mockCcpRepository = new Mock<ICcpRepository>();
            var mockConfiguration = new Mock<IConfiguration>();
            var mockAccountServices = new Mock<IAccountServices>();
            var mockConfigServices = new Mock<IConfigServices>();
            

            mockCcpRepository
                .Setup(repo => repo.GetAffectedModelIdsByTagId(request))
                .ReturnsAsync(new List<object>());

            var ccpServices = new CcpServices(mockCcpRepository.Object);
            var controller = new CcpController(ccpServices,
                                               mockConfiguration.Object,
                                               mockAccountServices.Object,
                                               mockConfigServices.Object);

            // Act
            var result = await controller.GetAffectedModelIdsByTagId(request);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<Response<Array>>(okResult.Value);
            Assert.Equal(204, response.statuscode);

        }

        [Fact]
        public async Task GetCaseConfigurationPortalInfo_ReturnssResult_WhenResultIsValid()
        {
            // Arrange
            var result = new List<dynamic>();

            dynamic item1 = new ExpandoObject();
            item1.parameter = "Param1";
            item1.ccpInfoId = 1;
            item1.description = "Description 1";
            item1.piAf = "AF1";

            dynamic item2 = new ExpandoObject();
            item2.parameter = "Param1";
            item2.ccpInfoId = 2;
            item2.description = "Description 2";
            item2.piAf = "AF2";

            dynamic item3 = new ExpandoObject();
            item3.parameter = "Param2";
            item3.ccpInfoId = 3;
            item3.description = "Description 3";
            item3.piAf = "AF3";

            result.Add(item1);
            result.Add(item2);
            result.Add(item3);
            var mockCcpRepository = new Mock<ICcpRepository>();
            var mockConfiguration = new Mock<IConfiguration>();
            var mockAccountServices = new Mock<IAccountServices>();
            var mockConfigServices = new Mock<IConfigServices>();
           
            var ccpServices = new CcpServices(mockCcpRepository.Object);
            var ccpController = new CcpController(ccpServices,
                                                  mockConfiguration.Object,
                                                  mockAccountServices.Object,
                                                  mockConfigServices.Object);

            mockCcpRepository
                .Setup(service => service.GetCaseConfigurationPortalInfo())
                .ReturnsAsync(result);

            // Act
            var result1 = await ccpController.GetCaseConfigurationPortalInfo();

            // Assert
            Assert.NotNull(result1);
        }

        [Fact]
        public async Task GetCaseConfigurationPortalInfo_ReturnsEmptyResponse_WhenResultToStringIsNull()
        {
            // Arrange
            var mockCcpServices = new Mock<ICcpServices>();
            
            var mockConfiguration = new Mock<IConfiguration>();
            var mockAccountServices = new Mock<IAccountServices>();
            var mockConfigServices = new Mock<IConfigServices>();
            

            var mockDynamicResult = new Mock<object>();
            mockDynamicResult.Setup(m => m.ToString()).Returns(() => null);

            mockCcpServices
                .Setup(s => s.GetCaseConfigurationPortalInfo())
                .ReturnsAsync(mockDynamicResult.Object);

            var ccpController = new CcpController(mockCcpServices.Object,
                                                  mockConfiguration.Object,
                                                  mockAccountServices.Object,
                                                  mockConfigServices.Object);

            // Act
            var response = await ccpController.GetCaseConfigurationPortalInfo();

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(response);
            var responseValue = Assert.IsType<Response<Array>>(okResult.Value);
            Assert.Equal(ResponseConstants.EMPTYDATA, responseValue.data);
        }

        [Fact]
        public async Task GetMstPipelineMacros_ReturnsEmptyResponse_WhenResultToStringIsNull()
        {
            // Arrange
            var mockCcpRepository = new Mock<ICcpRepository>();
            var mockConfiguration = new Mock<IConfiguration>();
            var mockAccountServices = new Mock<IAccountServices>();
            var mockConfigServices = new Mock<IConfigServices>();
            

            var mockDynamic = new Mock<object>();
            mockDynamic.Setup(m => m.ToString()).Returns(() => null);

            mockCcpRepository
                .Setup(r => r.GetMstPipelineMacrosAsync())
                .ReturnsAsync(mockDynamic.Object);

            var ccpServices = new CcpServices(mockCcpRepository.Object);
            var controller = new CcpController(
                ccpServices,
                mockConfiguration.Object,
                mockAccountServices.Object,
                mockConfigServices.Object
            );

            // Act
            var response = await controller.GetMstPipelineMacros();

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(response);
            var responseValue = Assert.IsType<Response<Array>>(okResult.Value);
            Assert.Equal(ResponseConstants.EMPTYDATA, responseValue.data);
        }

        [Fact]
        public async Task GetMstPipelineMacros_ReturnsResult_WhenResultToStringIsNotNull()
        {
            // Arrange
            var mockCcpRepository = new Mock<ICcpRepository>();
            var mockConfiguration = new Mock<IConfiguration>();
            var mockAccountServices = new Mock<IAccountServices>();
            var mockConfigServices = new Mock<IConfigServices>();
            

            dynamic item = new ExpandoObject();
            item.Name = "Macro1";
            var resultList = new List<dynamic> { item };

            mockCcpRepository
                .Setup(r => r.GetMstPipelineMacrosAsync())
                .ReturnsAsync(resultList);

            var ccpServices = new CcpServices(mockCcpRepository.Object);
            var controller = new CcpController(
                ccpServices,
                mockConfiguration.Object,
                mockAccountServices.Object,
                mockConfigServices.Object
            );

            // Act
            var response = await controller.GetMstPipelineMacros();

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(response);
            var responseValue = Assert.IsType<Response<object>>(okResult.Value);
            Assert.NotNull(responseValue.data);
        }

        [Fact]
        public async Task GetPipelineMacrosByCaseId_ReturnsEmptyResponse_WhenResultToStringIsNull()
        {
            // Arrange
            var mockCcpRepository = new Mock<ICcpRepository>();
            var mockConfiguration = new Mock<IConfiguration>();
            var mockAccountServices = new Mock<IAccountServices>();
            var mockConfigServices = new Mock<IConfigServices>();
           

            dynamic dynamicObject = new System.Dynamic.ExpandoObject();
            dynamicObject.ToString = new Func<string>(() => null!);

            mockCcpRepository.Setup(r => r.GetPipelineMacrosByCaseIdAsync(It.IsAny<GetPipelineMacrosByCaseIdRequest>()))
                             .ReturnsAsync((object)dynamicObject);

            var ccpServices = new CcpServices(mockCcpRepository.Object);
            var controller = new CcpController(
                ccpServices,
                mockConfiguration.Object,
                mockAccountServices.Object,
                mockConfigServices.Object
            );

            var request = new GetPipelineMacrosByCaseIdRequest { caseID = 123 };

            // Act
            var result = await controller.GetPipelineMacrosByCaseId(request);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<Response<Array>>(okResult.Value);
            Assert.Equal(ResponseConstants.EMPTYDATA, response.data);
        }
       
        [Fact]
        public async Task GetPipelineMacrosByCaseId_ReturnsDataResponse_WhenResultToStringIsNotNull()
        {
            // Arrange
            var mockCcpRepository = new Mock<ICcpRepository>();
            var mockConfiguration = new Mock<IConfiguration>();
            var mockAccountServices = new Mock<IAccountServices>();
            var mockConfigServices = new Mock<IConfigServices>();
            

            var customObject = new { someKey = "someValue" };

            mockCcpRepository
                .Setup(r => r.GetPipelineMacrosByCaseIdAsync(It.IsAny<GetPipelineMacrosByCaseIdRequest>()))
                .ReturnsAsync(customObject);

            var ccpServices = new CcpServices(mockCcpRepository.Object);
            var controller = new CcpController(
                ccpServices,
                mockConfiguration.Object,
                mockAccountServices.Object,
                mockConfigServices.Object
            );

            var request = new GetPipelineMacrosByCaseIdRequest { caseID = 456 };

            // Act
            var result = await controller.GetPipelineMacrosByCaseId(request);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<Response<object>>(okResult.Value);
            Assert.Equal(customObject, response.data);
        }

        [Fact]
        public async Task GetSwitchConfigurations_ReturnsEmptyResponse_WhenResultToStringIsNull()
        {
            // Arrange
            var mockCcpServices = new Mock<ICcpServices>();
            var mockConfiguration = new Mock<IConfiguration>();
            var mockAccountServices = new Mock<IAccountServices>();
            var mockConfigServices = new Mock<IConfigServices>();
            

            var mockResult = new Mock<object>();
            mockResult.Setup(x => x.ToString()).Returns(() => null);

            mockCcpServices.Setup(s => s.GetSwitchConfigurationsAsync())
                           .ReturnsAsync(mockResult.Object);

            var controller = new CcpController(
                mockCcpServices.Object,
                mockConfiguration.Object,
                mockAccountServices.Object,
                mockConfigServices.Object
            );

            // Act
            var result = await controller.GetSwitchConfigurations();

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<Response<Array>>(okResult.Value);
            Assert.Equal(ResponseConstants.EMPTYDATA, response.data);
        }

        [Fact]
        public async Task GetSwitchConfigurations_ReturnsGroupedResult_WhenDataIsAvailable()
        {
            // Arrange
            var mockCcpRepository = new Mock<ICcpRepository>();
           
            var mockConfiguration = new Mock<IConfiguration>();
            var mockAccountServices = new Mock<IAccountServices>();
            var mockConfigServices = new Mock<IConfigServices>();

            dynamic row1 = new ExpandoObject();
            row1.parameter = "Param1";
            row1.switchConfigurationID = 1;
            row1.description = "Test Config 1";

            dynamic row2 = new ExpandoObject();
            row2.parameter = "Param1";
            row2.switchConfigurationID = 2;
            row2.description = "Test Config 2";

            IEnumerable<dynamic> fakeData = new List<dynamic> { row1, row2 };

            mockCcpRepository.Setup(r => r.GetSwitchConfigurationsAsync())
                             .ReturnsAsync(fakeData);

            var ccpServices = new CcpServices(mockCcpRepository.Object);

            var controller = new CcpController(
                ccpServices,
                mockConfiguration.Object,
                mockAccountServices.Object,
                mockConfigServices.Object
            );

            // Act
            var result = await controller.GetSwitchConfigurations();

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<Response<object>>(okResult.Value);
            Assert.NotNull(response.data);
        }

        [Fact]
        public async Task UpdatePipelineMacros_ReturnsEmptyResponse_WhenResultIsZero()
        {
            // Arrange
            var mockCcpRepository = new Mock<ICcpRepository>();
            
            var mockConfiguration = new Mock<IConfiguration>();
            var mockAccountServices = new Mock<IAccountServices>();
            var mockConfigServices = new Mock<IConfigServices>();

            var request = new UpdatePipelineMacrosRequest
            {
                pipelineMacroID = 1,
                value = "TestValue",
                mstPipelineMacroID = 10
            };

            mockCcpRepository.Setup(repo => repo.UpdatePipelineMacrosAsync(request))
                             .ReturnsAsync(0);

            var ccpServices = new CcpServices(mockCcpRepository.Object);

            var controller = new CcpController(
                ccpServices,
                mockConfiguration.Object,
                mockAccountServices.Object,
                mockConfigServices.Object
            );

            // Act
            var result = await controller.UpdatePipelineMacros(request);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<Response<Array>>(okResult.Value);
            Assert.Equal(ResponseConstants.EMPTYDATA, response.data);
        }

        [Fact]
        public async Task UpdatePipelineMacros_ReturnsSuccessResponse_WhenResultIsNonZero()
        {
            // Arrange
            var mockCcpRepository = new Mock<ICcpRepository>();
            
            var mockConfiguration = new Mock<IConfiguration>();
            var mockAccountServices = new Mock<IAccountServices>();
            var mockConfigServices = new Mock<IConfigServices>();

            var request = new UpdatePipelineMacrosRequest
            {
                pipelineMacroID = 2,
                value = "SomeValue",
                mstPipelineMacroID = 20
            };

            mockCcpRepository.Setup(repo => repo.UpdatePipelineMacrosAsync(request))
                             .ReturnsAsync(1);

            var ccpServices = new CcpServices(mockCcpRepository.Object);

            var controller = new CcpController(
                ccpServices,
                mockConfiguration.Object,
                mockAccountServices.Object,
                mockConfigServices.Object
            );

            // Act
            var result = await controller.UpdatePipelineMacros(request);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<Response<object>>(okResult.Value);
            Assert.Equal(1, response.data);
        }

        #region GetTrnOdsSuggestionByCaseId
        [Fact]
        public async Task GetTrnOdsSuggestionByCaseIdAsync_ReturnsOk_WithData()
        {
            // Arrange
            var request = new GetTrnOdsByCaseIDRequest
            {
                caseID = 100,
                defaultValue = 1
            };

            var expectedData = new { Suggestion = "ODS suggestion" };

            var mockCcpRepository = new Mock<ICcpRepository>();
            mockCcpRepository.Setup(r => r.GetTrnOdsSuggestionByCaseIdAsync(request))
                             .ReturnsAsync(expectedData);

            var ccpServices = new CcpServices(mockCcpRepository.Object);

            var controller = new CcpController(
                ccpServices,
                Mock.Of<IConfiguration>(),
                Mock.Of<IAccountServices>(),
                Mock.Of<IConfigServices>()
            );

            // Act
            var result = await controller.GetTrnOdsSuggestionByCaseIdAsync(request);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<Response<object>>(okResult.Value);
            Assert.Equal(expectedData, response.data);
        }

        [Fact]
        public async Task GetTrnOdsSuggestionByCaseIdAsync_ReturnsEmptyOk_WhenResultToStringIsNull()
        {
            // Arrange
            var request = new GetTrnOdsByCaseIDRequest
            {
                caseID = 123,
                defaultValue = 1
            };

            var mockResult = new Mock<object>();
           
            mockResult.Setup(o => o.ToString()).Returns(() => null!);

            var mockCcpRepository = new Mock<ICcpRepository>();
            mockCcpRepository.Setup(r => r.GetTrnOdsSuggestionByCaseIdAsync(request))
                             .ReturnsAsync(mockResult.Object);

            var ccpServices = new CcpServices(mockCcpRepository.Object);

            var controller = new CcpController(
                ccpServices,
                Mock.Of<IConfiguration>(),
                Mock.Of<IAccountServices>(),
                Mock.Of<IConfigServices>()
            );

            // Act
            var result = await controller.GetTrnOdsSuggestionByCaseIdAsync(request);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<Response<Array>>(okResult.Value);
           
            Assert.Equal(204, response.statuscode);

        }
        #endregion

        #region AddTrnOdsSuggestion
        [Fact]
        public async Task AddTrnOdsSuggestionAsync_ReturnsOk_WhenRepositoryReturnsResult()
        {
            // Arrange
            var mockCcpRepository = new Mock<ICcpRepository>();

            var testUserId = 123;

            var request = new AddOdsInsightsRequest
            {
                causeTagID = 10,
                description = "Test Description",
                suggestion = "Test Suggestion"
            };

            var expectedResponse = new OdsInsightsResponse
            { 
                Result = "Success"
            };

            mockCcpRepository
                .Setup(repo => repo.AddTrnOdsSuggestionAsync(It.IsAny<AddOdsInsightsRequest>()))
                .ReturnsAsync(expectedResponse);

            var ccpService = new CcpServices(mockCcpRepository.Object);

            var controller = new CcpController(
                ccpService,
                Mock.Of<IConfiguration>(),
                Mock.Of<IAccountServices>(),
                Mock.Of<IConfigServices>()
            );

            var user = new ClaimsPrincipal(new ClaimsIdentity(new Claim[]
            {
                new Claim("uid", testUserId.ToString())
            }, "mock"));

            controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = user }
            };

            // Act
            var result = await controller.AddTrnOdsSuggestionAsync(request);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<EODomain.Common.Response<object>>(okResult.Value);
            Assert.Equal(200, response.statuscode);
        }

        [Fact]
        public async Task AddTrnOdsSuggestionAsync_ReturnsBadRequest_WhenRepositoryReturnsNull()
        {
            // Arrange
            var mockCcpRepository = new Mock<ICcpRepository>();

            var testUserId = 123;

            var request = new AddOdsInsightsRequest
            {
                causeTagID = 10,
                description = "Test Description"
            };

            mockCcpRepository
            .Setup(repo => repo.AddTrnOdsSuggestionAsync(It.IsAny<AddOdsInsightsRequest>()))
            .ReturnsAsync((OdsInsightsResponse)(object?)null!);

            var ccpService = new CcpServices(mockCcpRepository.Object);

            var controller = new CcpController(
                ccpService,
                Mock.Of<IConfiguration>(),
                Mock.Of<IAccountServices>(),
                Mock.Of<IConfigServices>()
            );

            var user = new ClaimsPrincipal(new ClaimsIdentity(new Claim[]
            {
            new Claim("uid", testUserId.ToString())
            }, "mock"));

            controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = user }
            };

            // Act
            var result = await controller.AddTrnOdsSuggestionAsync(request);

            // Assert
            var badRequestResult = Assert.IsType<BadRequestObjectResult>(result);
            var response = Assert.IsType<EODomain.Common.Response<Array>>(badRequestResult.Value);
            Assert.Equal(400, response.statuscode);
        }
        #endregion

        #region GetTagDataForValidation
        [Fact]
        public async Task GetTagDataForValidationReturnsOkWhenDataFound()
        {
            // Arrange
            var request = new GetTagDataByCaseIDRequest
            {
                caseID = 12
            };
            var repoMethodResponse = new List<GetTagDataForValidationStoredProcedureResponse>
            {
                new GetTagDataForValidationStoredProcedureResponse
                {
                    name_short = "tag_1",
                    Value = "1.123"
                },
                new GetTagDataForValidationStoredProcedureResponse
                {
                    name_short = "tag_2",
                    Value = "2.123"
                }
            };

            var mockCcpRepository = new Mock<ICcpRepository>();
            mockCcpRepository.Setup(x => x.GetTagDataForValidationAsync(It.IsAny<int>()))
                            .ReturnsAsync(repoMethodResponse);

           

            var ccpServicesMock = new CcpServices(mockCcpRepository.Object);
            var configurationMock = new Mock<IConfiguration>();
            var accountServicesMock = new Mock<IAccountServices>();

            var configServciesMock = new Mock<IConfigServices>();

            var controller = new CcpController(ccpServicesMock, configurationMock.Object, accountServicesMock.Object, configServciesMock.Object);

            //Act
            var result = await controller.GetTagDataForValidation(request);

            //Assert
            
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<Response<object>>(okResult.Value);           
            Assert.Equal(200, response.statuscode);
        }

        [Fact]
        public void GetTagDataForValidationReturnsOkWhenNoDataFound()
        {
            // Arrange
            var request = new GetTagDataByCaseIDRequest
            {
                caseID = 12
            };
            var mockCcpRepository = new Mock<ICcpRepository>();
            mockCcpRepository.Setup(x => x.GetTagDataForValidationAsync(It.IsAny<int>()))
                            .ReturnsAsync(new List<GetTagDataForValidationStoredProcedureResponse>());

            

            var ccpServicesMock = new CcpServices(mockCcpRepository.Object);
            var configurationMock = new Mock<IConfiguration>();
            var accountServicesMock = new Mock<IAccountServices>();

            var configServciesMock = new Mock<IConfigServices>();
            var controller = new CcpController(ccpServicesMock, configurationMock.Object, accountServicesMock.Object, configServciesMock.Object);

            //Act
            var result = controller.GetTagDataForValidation(request);

            //Assert
            Assert.IsType<OkObjectResult>(result.Result);
        }
        #endregion
    }
}
