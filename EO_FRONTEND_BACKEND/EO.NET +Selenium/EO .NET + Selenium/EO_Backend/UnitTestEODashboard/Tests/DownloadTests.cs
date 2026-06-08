using EOApplication.Contracts.Repositories;
using EOApplication.Contracts.Services;
using EODomain.Models.Config;
using EOInfrastructure.Services;
using EOWebMicroservice.Controllers.v1;
using Microsoft.Extensions.Options;
using Moq;
using Xunit;
using EODomain.Common;
using Microsoft.AspNetCore.Mvc;
using System.Diagnostics.CodeAnalysis;
using EODomain.Models.Download;
using EOInfrastructure.Utility;
using System.Data;

namespace UnitTestEODashboard.Tests
{
    [ExcludeFromCodeCoverage]
    public class DownloadTests
    {
        private readonly Mock<IDownloadRepository> mockDownloadRepository;
        private readonly DownloadServices downloadServicesMock;
        private readonly DownloadController controller;
        private readonly Mock<IWinAuthServices> winAuthServicesMock;
        private readonly ConfigSettings configSettings;
        private readonly Mock<IOptions<ConfigSettings>> mockConfigSettings;
        public DownloadTests() 
        {

            configSettings = new ConfigSettings
            {
                chunkSize = 100,
                cacheDuration = 100
            };
            mockConfigSettings = new Mock<IOptions<ConfigSettings>>();

            mockConfigSettings.Setup(x => x.Value)
                    .Returns(configSettings);
            mockDownloadRepository = new Mock<IDownloadRepository>();
            winAuthServicesMock = new Mock<IWinAuthServices>();
            downloadServicesMock = new DownloadServices(mockDownloadRepository.Object);

            controller = new DownloadController(downloadServicesMock, mockConfigSettings.Object);
        }

        #region GetDownloadTagListAsync
        [Fact]
        public void GetDownloadTagListAsyncReturnsWhenDataExist()
        {
            // Arrange
            GetDownloadTagListRequest request = new GetDownloadTagListRequest
            {
                plantIDList = "PLANT001"
            };

            var expectedResult = new List<GetDownloadTagListResponse>
            {
            new GetDownloadTagListResponse
            {
                plant_id = 101,
                plant_name = "Plant A",
                affiliate_sap_id = 5001,
                tagList = "TAG001,TAG002,TAG003",
                nameShort = "PA",
                tagLevel = "Level 1"
            },
            new GetDownloadTagListResponse
            {
                plant_id = 102,
                plant_name = "Plant B",
                affiliate_sap_id = 5002,
                tagList = "TAG004,TAG005",
                nameShort = "PB",
                tagLevel = "Level 2"
            }
           };


            mockDownloadRepository.Setup(r => r.GetDownloadTagListAsync(request)).ReturnsAsync(expectedResult);

            // Act
            var result = controller.GetDownloadTagListAsync(request);

            // Assert
            Assert.IsType<OkObjectResult>(result.Result);

        }
        [Fact]
        public void GetDownloadTagListAsyncReturnsWhenNoDataExist()
        {
            // Arrange
            GetDownloadTagListRequest request = new GetDownloadTagListRequest
            {
                plantIDList = "PLANT001"
            };

            var expectedResult = new List<GetDownloadTagListResponse>{  };


            mockDownloadRepository.Setup(r => r.GetDownloadTagListAsync(request)).ReturnsAsync(expectedResult);

            // Act
            var result = controller.GetDownloadTagListAsync(request);

            // Assert
            var badRequestResult = Assert.IsType<OkObjectResult>(result.Result);
            var response = Assert.IsType<Response<Array>>(badRequestResult.Value);

            Assert.Equal(204, response.statuscode);
            Assert.Equal("No data found", response.errormsg);

        }
        #endregion

        #region GetDownloadDataAsync
        [Fact]
        public void GetDownloadDataAsyncReturnsOkWhenDataExist()
        {
            // Arrange
            var request = new DownloadDataRequest
            {
                tagNames = "TAG001", 
                plantID_list = "101",
                sTime = new DateTime(2025, 3, 1, 0, 0, 0,DateTimeKind.Utc), 
                eTime = new DateTime(2025, 3, 19, 23, 59, 59, DateTimeKind.Utc), 
                chunkSize = 1000 
            };

            var expectedResult = new List<dynamic>
            {
                new
                {
                    Status = "Success",
                    fileStream = new byte[] { 0x25, 0x50, 0x44, 0x46 },
                    message = "File downloaded successfully."
                }
            };


            mockDownloadRepository.Setup(r => r.GetDownloadDataAsync(request)).ReturnsAsync(expectedResult);

            // Act
            var result = controller.GetDownloadDataAsync(request);

            // Assert
            Assert.IsType<OkObjectResult>(result.Result);

        }
        [Fact]
        public void GetDownloadDataAsyncReturnsOkWhenNoDataExist()
        {
            // Arrange
            var request = new DownloadDataRequest
            {
                tagNames = "TAG001",
                plantID_list = "101",
                sTime = new DateTime(2025, 3, 1, 0, 0, 0),
                eTime = new DateTime(2025, 3, 19, 23, 59, 59),
                chunkSize = 1000
            };

            var expectedResult = new List<dynamic>() { };
            


            mockDownloadRepository.Setup(r => r.GetDownloadDataAsync(request)).ReturnsAsync(expectedResult);

            // Act
            var result = controller.GetDownloadDataAsync(request);

            // Assert
            var badRequestResult = Assert.IsType<OkObjectResult>(result.Result);
            var response = Assert.IsType<Response<object>>(badRequestResult.Value);

            Assert.Equal(204, response.statuscode);
            Assert.Equal("No data found", response.errormsg);

        }

        [Fact]
        public void GenerateExcelSheetTestElsePart()
        {
            
            var expectedResult = new List<DataTable>
            {
                new DataTable()

            };
            var names = new List<string> 
            {
                "test"
            };

            // Act
            var result = ExcelHelper.GenerateExcelSheet(expectedResult, "dummy", names);

            // Assert
            Assert.IsType<byte[]>(result);

        }



        #endregion

        #region GetCaseWiseDownloadDataAsync
        [Fact]
        public void GetCaseWiseDownloadDataAsyncReturnsOkWhenDataExist()
        {
            // Arrange
            var request = new DownloadCaseWiseDataRequest
            {
                tagIdList = "TAG001",
                caseId = 101,
                sTime = new DateTime(2025, 3, 1, 0, 0, 0),
                eTime = new DateTime(2025, 3, 19, 23, 59, 59),
                chunkSize = 1000
            };

            var expectedResult = new List<dynamic>
            {
                new
                {
                    Status = "Success",
                    fileStream = new byte[] { 0x25, 0x50, 0x44, 0x46 },
                    message = "File downloaded successfully."
                }
            };


            mockDownloadRepository.Setup(r => r.GetCaseWiseDownloadDataAsync(request)).ReturnsAsync(expectedResult);

            // Act
            var result = controller.GetCaseWiseDownloadDataAsync(request);

            // Assert
            Assert.IsType<OkObjectResult>(result.Result);

        }
        [Fact]
        public void GetCaseWiseDownloadDataAsyncReturnsOkWhenNoDataExist()
        {
            // Arrange
            var request = new DownloadCaseWiseDataRequest
            {
                tagIdList = "TAG001",
                caseId = 101,
                sTime = new DateTime(2025, 3, 1, 0, 0, 0),
                eTime = new DateTime(2025, 3, 19, 23, 59, 59),
                chunkSize = 1000
            };

            var expectedResult = new List<dynamic>() { };
            

            mockDownloadRepository.Setup(r => r.GetCaseWiseDownloadDataAsync(request)).ReturnsAsync(expectedResult);

            // Act
            var result = controller.GetCaseWiseDownloadDataAsync(request);

            // Assert
            var badRequestResult = Assert.IsType<OkObjectResult>(result.Result);
            var response = Assert.IsType<Response<object>>(badRequestResult.Value);

            Assert.Equal(204, response.statuscode);
            Assert.Equal("No data found", response.errormsg);

        }
        #endregion
    }
}
