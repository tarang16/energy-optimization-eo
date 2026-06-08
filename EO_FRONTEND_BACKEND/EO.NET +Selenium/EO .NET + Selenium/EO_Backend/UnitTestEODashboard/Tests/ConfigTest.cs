using Moq;
using Xunit;
using FakeItEasy;
using System.Data;
using System.Dynamic;
using EODomain.Common;
using EODomain.Models.Config;
using EODomain.Models.Account;
using Microsoft.AspNetCore.Mvc;
using EODomain.Models.Requests;
using EOInfrastructure.Services;
using Microsoft.Extensions.Options;
using System.Diagnostics.CodeAnalysis;
using EOWebMicroservice.Controllers.v1;
using EOApplication.Contracts.Services;
using EOApplication.Contracts.Repositories;

namespace UnitTestEODashboard.Tests
{
    [ExcludeFromCodeCoverage]
    public class ConfigTest
    {
        private readonly Mock<IConfigRepository> mockConfigRepository;
        private readonly ConfigServices configServicesMock;
        private readonly ConfigController controller;
        private readonly Mock<IAccountServices> accountServicesMock;
        private readonly ConfigSettings configSettings;
        private readonly Mock<IOptions<ConfigSettings>> mockConfigSettings ;

        public ConfigTest()
        {
            configSettings = new ConfigSettings
            {
                chunkSize = 100,
                cacheDuration = 100
            };
            mockConfigSettings = new Mock<IOptions<ConfigSettings>>();

            mockConfigSettings.Setup(x => x.Value)
                    .Returns(configSettings);
            mockConfigRepository = new Mock<IConfigRepository>();
            accountServicesMock = new Mock<IAccountServices>();
            configServicesMock = new ConfigServices(mockConfigRepository.Object);

            controller = new ConfigController(configServicesMock, accountServicesMock.Object, mockConfigSettings.Object);
        }



        #region GetLandingCorporateAsync
        [Fact]
        public void GetLandingCorporateAsyncEmptyOkResponseWhenNoData()
        {
            // Arrange
            LandingCorporateRequest request = new LandingCorporateRequest()
            {
                caseIDList="1"
            };
            var expectedResult = new List<GetLandingCorporateSPResponse>() { };

            mockConfigRepository.Setup(r => r.GetLandingCorporateAsync(It.IsAny<string>())).ReturnsAsync(expectedResult);


            // Act
            var result = controller.GetLandingCorporateAsync(request);

            // Assert
            var badRequestResult = Assert.IsType<OkObjectResult>(result.Result);
            var response = Assert.IsType<Response<Array>>(badRequestResult.Value);
            Assert.Equal(204, response.statuscode);
            Assert.Equal("No data found", response.errormsg);
        }

        [Fact]
        public void GetLandingCorporateAsyncResponseWhenDataExists()
        {
            // Arrange
            LandingCorporateRequest request = new LandingCorporateRequest()
            {
                caseIDList="1"
            };
            var expectedResult = new List<GetLandingCorporateSPResponse>()
            {
                 new GetLandingCorporateSPResponse()
                {
                      caseId = 59,
                      active = 1,
                      affiliateCode=4400,
                      affiliateName= "Arrazi",
                     regionName= "MIDDLE EAST",
                     regionNameShort ="ME",
                     timeStampEpoch =1672520400000,
                     timeStamp = DateTime.Now,
                     affiliateID=1,
                     opportunityCo2=1,
                     opportunityEnergyBills=1,
                     opportunityFuel=1,
                     urlAffiliateImage="url"

                },
                 new GetLandingCorporateSPResponse()
                 {
                     caseId = 5,
                     active = 1,
                     affiliateCode=4400,
                     affiliateName= "Arrazi",
                     regionName= "MIDDLE EAST",
                     regionNameShort ="ME",
                     timeStampEpoch =1672520400000,
                     timeStamp = DateTime.Now,
                     affiliateID=2,
                     opportunityCo2=1,
                     opportunityEnergyBills=1,
                     opportunityFuel=1,
                     urlAffiliateImage="url"

                },
                  new GetLandingCorporateSPResponse()
                {
                      caseId = 4,
                      active = 1,
                      affiliateCode=4400,
                      affiliateName= "Arrazi",
                      regionName= "MIDDLE EAST",
                      regionNameShort ="ME",
                      timeStampEpoch =1172520400000,
                      timeStamp = DateTime.Now,
                      affiliateID=3,
                      opportunityCo2=1,
                      opportunityEnergyBills=1,
                      opportunityFuel=1,
                      urlAffiliateImage="url"

                }

            };
            mockConfigRepository.Setup(r => r.GetLandingCorporateAsync(It.IsAny<string>())).ReturnsAsync(expectedResult);


            // Act
            var result = controller.GetLandingCorporateAsync(request);

            // Assert
            Assert.IsType<OkObjectResult>(result.Result);
        }
        #endregion



        #region GetUserByIDNameEmail
        [Fact]
        public void GetUserByIDNameEmailReturnsResultWhenUserFound()
        {
            //Arrange
            GetUserByIDNameEmailRequest request = new GetUserByIDNameEmailRequest
            {
                keyword = "1234"
            };
            var userByKeyword = new List<GetUsersDetailsWithCountryTimeZone>
            {
                new GetUsersDetailsWithCountryTimeZone
                {
                    affiliateName = "1000",
                    employeeId = 12345,
                },
                new GetUsersDetailsWithCountryTimeZone
                {
                    affiliateName = "5500",
                    employeeId = 12347,
                },
               
            };
            // Arrange
            var mockAccountRepository = new Mock<IAccountRepository>();
            mockAccountRepository.Setup(s => s.GetUserByIDNameEmailAsync(It.IsAny<string>()))
                            .ReturnsAsync(userByKeyword);
            var mockAccountService = new Mock<IAccountServices>();
            mockAccountService.Setup(s => s.GetUserByIDNameEmailAsync(It.IsAny<string>()))
                            .ReturnsAsync(userByKeyword);

            // Act
            var result = controller.GetUserByIDNameEmail(request);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            Assert.Equal(200, okResult.StatusCode);
        }

        [Fact]
        public void GetUserByIDNameEmailReturnsEmptyResultWhenNoUserFound()
        {
            //Arrange
            GetUserByIDNameEmailRequest request = new GetUserByIDNameEmailRequest
            {
                keyword = "1234"
            };
            // Arrange
            var mockAccountRepository = new Mock<IAccountRepository>();
            mockAccountRepository.Setup(s => s.GetUserByIDNameEmailAsync(It.IsAny<string>()))
                            .ReturnsAsync(new List<GetUsersDetailsWithCountryTimeZone>());
            
           

            // Act
            var result = controller.GetUserByIDNameEmail(request);

            // Assert
            Assert.IsType<OkObjectResult>(result.Result);
        }
        #endregion

        #region GetCaseHierarchy
        [Fact]
        public void GetCaseHierarchySuccessfulResultReturnsOkWithData()
        {
            // Arrange
            var expectedResult = new List<GetCaseHierarchyResponse>()
            {
                new GetCaseHierarchyResponse()
                {
                    caseId = "59",
                    caseName = "ACETYLENE REACTORS OPTIMIZATION",
                    region = "EUROPE",
                    affiliate = "GELEEN",
                    //plant = "OLEFINS 4",
                    country = "NETHERLAND"
                },
                new GetCaseHierarchyResponse()
                {
                    caseId = "104",
                    caseName = "BOILER SYSTEM SUPPLY",
                    region = "MIDDLE EAST",
                    affiliate = "ARRAZI",
                    //plant = "ARRAZI-2",
                    country = "KINGDOM OF SAUDI ARABIA"
                },
                new GetCaseHierarchyResponse()
                {
                    caseId = "103",
                    caseName = "REFORMER PERFORMANCE MANAGEMENT",
                    region = "MIDDLE EAST",
                    affiliate = "ARRAZI",
                    //plant = "ARRAZI-2",
                    country = "KINGDOM OF SAUDI ARABIA"
                }
            };
            mockConfigRepository.Setup(r => r.GetCaseHierarchyAsync()).ReturnsAsync(expectedResult);

            // Act
            var result = controller.GetCaseHierarchy();

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            var response = Assert.IsType<Response<object>>(okResult.Value);
            Assert.Equal(200, response.statuscode);

        }

        #endregion

        #region GetLandingAffiliateScoreCard
        [Fact]
        public void GetLandingAffiliateScoreCardAsyncResponseWhenDataExists()
        {
            // Arrange
            var expectedResult = new List<GetLandingAffiliateSustainabilityCardResponse>();
            expectedResult.AddRange(A.CollectionOfFake<GetLandingAffiliateSustainabilityCardResponse>(5).AsEnumerable());
            int affiliateSapID = 1400;
            string? upto = "today";

            var request = new GetLandingAffiliateScoreCardRequest()
            {
                affiliateID = affiliateSapID,
                upto = upto
            };


            mockConfigRepository.Setup(x => x.GetLandingAffiliateScoreCardAsync(affiliateSapID, upto!))
                .ReturnsAsync(expectedResult);


            // Act
            var result = controller.GetLandingAffiliateScoreCard(request);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            var response = Assert.IsType<Response<object>>(okResult.Value);
           
            Assert.Equal(200, response.statuscode);
        }

        [Fact]
        public void GetLandingAffiliateScoreCardReturnsOkWhenNoData()
        {            
            // Arrange
            var mockConfigServices = new Mock<IConfigServices>();
            
           
            mockConfigSettings.Setup(x => x.Value).Returns(new ConfigSettings());

           
            var request = new GetLandingAffiliateScoreCardRequest
            {
                affiliateID = 1400,
                upto = "today"
            };

            mockConfigRepository
                .Setup(s => s.GetLandingAffiliateScoreCardAsync(request.affiliateID, request.upto!))
                .ReturnsAsync(new List<GetLandingAffiliateSustainabilityCardResponse>());

            // Act
            var result = controller.GetLandingAffiliateScoreCard(request);

            // Assert
            var badRequestResult = Assert.IsType<OkObjectResult>(result.Result);
            var response = Assert.IsType<Response<object>>(badRequestResult.Value);
            Assert.Equal(200, response.statuscode);
            
        }
        #endregion

        #region GetCaseInfoByCaseIdList
        [Fact]
        public void GetCaseInfoByCaseIdListAsyncResponseWhenDataExists()
        {
            // Arrange
            CaseIdListRequest request = new CaseIdListRequest()
            {
                caseIdList = "1"
            };
            var expectedResult = new List<GetCaseInfoByByCaseIdListResponse>()
            {
            new GetCaseInfoByByCaseIdListResponse()
            {
                caseID = 201,
                caseName = "Energy Optimization Project",
                frequency = 12,
                slot = 3,
                description = "A project focused on reducing energy consumption in chemical plants.",
                url = "https://example.com/case/201",
                affiliateID = 1001,
                active = 1
            },
            new GetCaseInfoByByCaseIdListResponse()
            {
                caseID = 202,
                caseName = "Safety Compliance Upgrade",
                frequency = 6,
                slot = 2,
                description = "Upgrading safety standards across various units.",
                url = "https://example.com/case/202",
                affiliateID = 1002,
                active = 1
            },
            new GetCaseInfoByByCaseIdListResponse()
            {
                caseID = 203,
                caseName = "Carbon Footprint Reduction",
                frequency = 24,
                slot = 4,
                description = "Initiative to minimize CO2 emissions in the refining process.",
                url = "https://example.com/case/203",
                affiliateID = 1003,
                active = 0
            }
        };



            mockConfigRepository.Setup(r => r.GetCaseInfoByCaseIdListAsync(request)).ReturnsAsync(expectedResult);


            // Act
            var result = controller.GetCaseInfoByCaseIdList(request);

            // Assert
            Assert.IsType<OkObjectResult>(result.Result);
        }
        #endregion
        #region GetUomAsync
        [Fact]
        public void GetUomAsyncResponseWhenDataExists()
        {
            // Arrange
            var expectedResult = new List<ExpandoObject>();

            dynamic obj1 = new ExpandoObject();
            obj1.caseID = 201;
            obj1.caseName = "Energy Optimization Project";
            obj1.frequency = 12;
            obj1.slot = 3;
            obj1.description = "A project focused on reducing energy consumption in chemical plants.";

            expectedResult.Add(obj1);

            dynamic obj2 = new ExpandoObject();
            obj2.caseID = 202;
            obj2.caseName = "Safety Compliance Upgrade";
            obj2.frequency = 6;
            obj2.slot = 2;
            obj2.description = "Upgrading safety standards across various units.";

            mockConfigRepository.Setup(r => r.GetUomAsync()).ReturnsAsync(expectedResult);


            // Act
            var result = controller.GetUomAsync();

            // Assert
            Assert.IsType<OkObjectResult>(result.Result);
        }
        [Fact]
        public void GetUomAsyncResponseWhenNoDataExists()
        {
            // Arrange
          

            mockConfigRepository.Setup(r => r.GetUomAsync()).ReturnsAsync(null);

            // Act
            var result = controller.GetUomAsync();

            // Assert
            var badRequestResult = Assert.IsType<OkObjectResult>(result.Result);
            var response = Assert.IsType<Response<Array>>(badRequestResult.Value);

            Assert.Equal(204, response.statuscode);
            Assert.Equal("No data found", response.errormsg);
        }

        #endregion

        #region GetScreenNamesByAffiliateIDsAsync
        [Fact]
        public void GetScreenNamesByAffiliateIDsAsyncResponseWhenDataExists()
        {
            // Arrange
            var expectedResult = new List<ExpandoObject>();

            var request = new GetUserStatisticsScreensRequest()
            {
                screenName = "Test Screen",
                affiliateIDs = "1001"
            };

            dynamic obj1 = new ExpandoObject();
            obj1.caseID = 201;
            obj1.caseName = "Energy Optimization Project";
            obj1.frequency = 12;
            obj1.slot = 3;
            obj1.description = "A project focused on reducing energy consumption in chemical plants.";

            expectedResult.Add(obj1);

            dynamic obj2 = new ExpandoObject();
            obj2.caseID = 202;
            obj2.caseName = "Safety Compliance Upgrade";
            obj2.frequency = 6;
            obj2.slot = 2;
            obj2.description = "Upgrading safety standards across various units.";

            mockConfigRepository.Setup(r => r.GetScreenNamesByAffiliateIDsAsync(request)).ReturnsAsync(expectedResult);


            // Act
            var result = controller.GetScreenNamesByAffiliateIDsAsync(request);

            // Assert
            Assert.IsType<OkObjectResult>(result.Result);
        }

        [Fact]
        public void GetScreenNamesByAffiliateIDsAsyncResponseWhenNoDataExists()
        {
            // Arrange
           

            var request = new GetUserStatisticsScreensRequest()
            {
                screenName = "Test Screen",
                affiliateIDs = "1001"
            };

            mockConfigRepository.Setup(r => r.GetScreenNamesByAffiliateIDsAsync(request)).ReturnsAsync(null);


            // Act
            var result = controller.GetScreenNamesByAffiliateIDsAsync(request);

            // Assert
            var badRequestResult = Assert.IsType<OkObjectResult>(result.Result);
            var response = Assert.IsType<Response<Array>>(badRequestResult.Value);

            Assert.Equal(204, response.statuscode);
            Assert.Equal("No data found", response.errormsg);
        }
        #endregion

        #region GetViewDataDictionaryByTableName
        [Fact]
        public void GetViewDataDictionaryByTableNameReturnsOk()
        {
            // Arrange
            GetViewDataDictionaryByTableNameRequest request = new GetViewDataDictionaryByTableNameRequest
            {
                TableNameList = "test data"
            };

            var expectedResult = new List<GetViewDataDictionaryByTableNameResponse>
            {
            new GetViewDataDictionaryByTableNameResponse
            {
                tableName = "Users",
                columnName = "UserId",
                description = "Primary key for the Users table",
                expectedOutputFormatExample = "123",
                dataTypeName = "int",
                maxLength = null,
                isNullable = false,
                constraintName = "PK_Users",
                constraintType = "PRIMARY KEY",
                indexName = "IX_Users_UserId",
                typeDesc = "Identity Column",
                isUnique = true
            },
            new GetViewDataDictionaryByTableNameResponse
            {
                tableName = "Users",
                columnName = "UserName",
                description = "Username of the user",
                expectedOutputFormatExample = "john_doe",
                dataTypeName = "nvarchar",
                maxLength = 50,
                isNullable = false,
                constraintName = "UQ_Users_UserName",
                constraintType = "UNIQUE",
                indexName = "IX_Users_UserName",
                typeDesc = "Unique Constraint",
                isUnique = true
            }
            };

            mockConfigRepository.Setup(r => r.GetViewDataDictionaryByTableNameAsync(request)).ReturnsAsync(expectedResult);

            // Act
            var result = controller.GetViewDataDictionaryByTableName(request);

            // Assert
            Assert.IsType<OkObjectResult>(result.Result);

        }

        [Fact]
        public void GetViewDataDictionaryByTableNameReturnsOkWhenNoDataExist()
        {
            // Arrange
            GetViewDataDictionaryByTableNameRequest request = new GetViewDataDictionaryByTableNameRequest
            {
                TableNameList = "test data"
            };

            var expectedResult = new List<GetViewDataDictionaryByTableNameResponse>{ };

            mockConfigRepository.Setup(r => r.GetViewDataDictionaryByTableNameAsync(request)).ReturnsAsync(expectedResult);

            // Act
            var result = controller.GetViewDataDictionaryByTableName(request);

            // Assert
            var badRequestResult = Assert.IsType<OkObjectResult>(result.Result);
            var response = Assert.IsType<Response<Array>>(badRequestResult.Value);

            Assert.Equal(204, response.statuscode);
            Assert.Equal("No data found", response.errormsg);

        }
        #endregion

        [Fact]
        public async Task GetCaseHierarchyAsync_ReturnsStructuredHierarchy()
        {
            // Arrange
            var mockResponse = new List<GetCaseHierarchyResponse>
        {
            new GetCaseHierarchyResponse { region = "Region1", country = "Country1", affiliate = "Affiliate1", regionShortName = "Code1", affiliateImage = "Image1", affiliateSapId = 1, caseName = "Case1", affiliateId = 1 },
        };
            var configRepositoryMock = new Mock<IConfigRepository>();
            var mockConfigServices = new ConfigServices(configRepositoryMock.Object);

            configRepositoryMock.Setup(repo => repo.GetCaseHierarchyAsync()).ReturnsAsync(mockResponse);

            // Act
            var result = await mockConfigServices.GetCaseHierarchyAsync();

            // Assert
            Assert.NotNull(result);
            var structuredResult = result as IEnumerable<dynamic>;
            Assert.Single(structuredResult!);

        }

        [Theory]
        [InlineData("off_plant_startup", "STARTUP")]
        [InlineData("off_plant_sd", "SHUTDOWN")]
        [InlineData("on", "ONLINE")]
        [InlineData(null, "-")]
        [InlineData("unknown_status", "-")]

        public void GetSystemStatus_ReturnsExpectedResult(string inputStatus, string expectedOutput)
        {
            // Arrange

            
            
            // Act

            var result = ConfigServices.GetSystemStatus(inputStatus);

            // Assert
            Assert.Equal(expectedOutput, result);
        }

        [Fact]
        public void GenerateUptoListForLandingSustainability_CoversAllBranches()
        {
            // Arrange
           
            
            // Act
            var result1 = ConfigServices.GenerateUptoListForLandingSustainability(null);
            var result2 = ConfigServices.GenerateUptoListForLandingSustainability("week,quarter");
            var result3 = ConfigServices.GenerateUptoListForLandingSustainability("week");

            // Assert
            Assert.Equal(new List<string> { "today", "yesterday", "month", "year" }, result1);
            Assert.Equal(new List<string> { "week", "quarter" }, result2);
            Assert.Equal(new List<string> { "week" }, result3);
        }

        [Fact]

        public async Task GetAffiliateIDByModelId_ReturnsExpectedValue()

        {

            // Arrange

            int modelId = 123;

            int expectedAffiliateId = 456;

            mockConfigRepository

                .Setup(repo => repo.GetAffiliateIDByModelId(modelId)).ReturnsAsync(expectedAffiliateId);

            // Act

            var result = await configServicesMock.GetAffiliateIDByModelId(modelId);

            // Assert

            Assert.Equal(expectedAffiliateId, result);


        }

        [Fact]
        public void GetAffiliateIDByObjectiveId_ReturnsExpectedAffiliateId()
        {
            // Arrange
            
            int testObjectiveId = 1;
            int expectedAffiliateId = 123;

            mockConfigRepository
                .Setup(repo => repo.GetAffiliateIDByObjectiveId(testObjectiveId))
                .ReturnsAsync(expectedAffiliateId);


            // Act
            var result = configServicesMock.GetAffiliateIDByObjectiveId(testObjectiveId);

            // Assert
            Assert.Equal(expectedAffiliateId, result.Result);
        }

        [Fact]
        public void GetAffiliateIDByModelTagId_ReturnsExpectedAffiliateId()
        {
            // Arrange
            
            int testModelTagId = 5;
            int expectedAffiliateId = 456;

            mockConfigRepository
                .Setup(repo => repo.GetAffiliateIDByModelTagId(testModelTagId))
                .ReturnsAsync(expectedAffiliateId);

            // Act
            var result = configServicesMock.GetAffiliateIDByModelTagId(testModelTagId);

            // Assert
            Assert.Equal(expectedAffiliateId, result.Result);
        }

        [Fact]

        public void GetAffiliateIDByConstraintId_ReturnsExpectedAffiliateId()

        {

            // Arrange

            int testConstraintId = 10;

            int expectedAffiliateId = 789;

            mockConfigRepository

                .Setup(repo => repo.GetAffiliateIDByConstraintId(testConstraintId))

                .ReturnsAsync(expectedAffiliateId);

            // Act

            var result = configServicesMock.GetAffiliateIDByConstraintId(testConstraintId);

            // Assert

            Assert.NotNull(result);

        }

        [Fact]

        public void GetAffiliateIDByVariableId_ReturnsExpectedAffiliateId()
        {
            // Arrange

            int testVariableId = 20;

            int expectedAffiliateId = 321;

            mockConfigRepository

                .Setup(repo => repo.GetAffiliateIDByVariableId(testVariableId))

                .ReturnsAsync(expectedAffiliateId);

            // Act

            var result = configServicesMock.GetAffiliateIDByVariableId(testVariableId);

            // Assert
            Assert.NotNull (result);
            Assert.Equal(expectedAffiliateId, result.Result);

        }

        [Fact]

        public void GetAffiliateIDByDerivedEquationId_ReturnsExpectedAffiliateId()
        {

            // Arrange

            int testDerivedEquationId = 30;

            int expectedAffiliateId = 654;

            mockConfigRepository

                .Setup(repo => repo.GetAffiliateIDByDerivedEquationId(testDerivedEquationId))

                .ReturnsAsync(expectedAffiliateId);

            

            // Act

            var result = configServicesMock.GetAffiliateIDByDerivedEquationId(testDerivedEquationId);

            // Assert

            Assert.Equal(expectedAffiliateId, result.Result);

        }

        [Fact]

        public void GetAffiliateIDByCaseID_ReturnsExpectedAffiliateId()
        {

            // Arrange

            int testCaseID = 42;

            int expectedAffiliateId = 777;

            mockConfigRepository

                .Setup(repo => repo.GetAffiliateIDByCaseID(testCaseID))

                .ReturnsAsync(expectedAffiliateId);

            // Act

            var result = configServicesMock.GetAffiliateIDByCaseID(testCaseID);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(expectedAffiliateId, result.Result);

        }

        [Fact]
        public void LogoutUserAsync_ReturnsTrue_WhenLogoutSucceeds()
        {
            // Arrange
            
            int testUserId = 99;
            bool expectedResult = true;

            mockConfigRepository
                .Setup(repo => repo.LogoutUserAsync(testUserId))
                .ReturnsAsync(expectedResult);

            // Act
            var result = configServicesMock.LogoutUserAsync(testUserId);

            // Assert
            Assert.True(result.Result);
        }
    }
}
