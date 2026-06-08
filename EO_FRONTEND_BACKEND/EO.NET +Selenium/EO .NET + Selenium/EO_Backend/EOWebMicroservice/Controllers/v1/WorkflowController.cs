using System.Data;
using Asp.Versioning;
using EODomain.Common;
using System.Security.Claims;
using EOWebMicroservice.Filter;
using Microsoft.AspNetCore.Mvc;
using EODomain.Models.Workflow;
using EODomain.Models.RequestModels;
using EOApplication.Contracts.Services;
using EODomain.Models.Account.Workflow;
using EODomain.Models.Requests;

namespace EOWebMicroservice.Controllers.v1
{
    /// <summary>
    /// Controller to host APIs related to configuration
    /// </summary>
    [ApiVersion("1.0")]
    public class WorkflowController : BaseController
    {
        private readonly IWorkflowServices _actionManagementServices;
        private readonly IAccountServices _accountServices;

        /// <summary>
        /// Interface to logging service
        /// </summary>
        public readonly ILoggingServices _loggingServices;

        /// <summary>
        /// Interface to configuation
        /// </summary>
        public readonly IConfiguration _configuration;


        /// <summary>
        /// Constructor for WorkflowController
        /// </summary>
        /// <param name="actionManagementServices"></param>
        /// <param name="accountServices"></param>
        /// <param name="winAuthServices"></param>
        /// <param name="loggingServices"></param>
        /// <param name="configuration"></param>
        public WorkflowController(
                                    IWorkflowServices actionManagementServices,
                                    IAccountServices accountServices,
                                    IWinAuthServices winAuthServices,
                                    ILoggingServices loggingServices,
                                    IConfiguration configuration)
        {
            _accountServices = accountServices;
            _loggingServices = loggingServices;
            _configuration = configuration;
            _actionManagementServices = actionManagementServices;
        }

        /// <summary>
        /// To get action suggestions logs related to an alert
        /// </summary>
        /// <param name="request"></param>
        /// <returns></returns>
        [HttpPost("get_activity_suggestions_log_by_request_id")]
        public async Task<IActionResult> GetOdsActionSuggestionsByRequestId([FromBody] RequestIdInputRequest request)
        {
            var result = await _actionManagementServices.GetOdsActionSuggestionsByRequestIdAsync(request.requestId,request.connectionFlag);
            if (result == null || result.Count == 0)
            {
                return Ok(new Response<Array>(ResponseConstants.EMPTYOK, ResponseConstants.EMPTYOK_MESSAGE, ResponseConstants.EMPTYDATA));
            }
            else
            {
                return Ok(new Response<object>(result));
            }
        }


        /// <summary>
        /// To get list of users who could be assigned an alert
        /// </summary>
        /// <param name="request"></param>
        /// <returns></returns>
        [HttpPost("get_assignee_list_by_request_id")]
        public async Task<IActionResult> GetOdsAssigneeListByRequestId([FromBody] RequestIdAndReassignmentRequest request)
        {
            var result = await _actionManagementServices.GetOdsAssigneeListByRequestIdAsync(request.requestId, request.isReassignment);
            if (result == null || result.Count == 0)
            {
                return Ok(new Response<Array>(ResponseConstants.EMPTYOK, ResponseConstants.EMPTYOK_MESSAGE, ResponseConstants.EMPTYDATA));
            }
            else
            {
                return Ok(new Response<object>(result));
            }
        }


        /// <summary>
        /// To get acitivty logs associated with an alert
        /// </summary>
        /// <param name="request"></param>
        /// <returns></returns>
        [HttpPost("get_activity_logs_by_request_id")]
        public async Task<IActionResult> GetOdsWorkflowActionLogsByRequestId([FromBody] RequestIdInputRequest request)
        {
            var result = await _actionManagementServices.GetOdsWorkflowActionLogsByRequestIdAsync(request.requestId);
            if (result == null || result.Count == 0)
            {
                return Ok(new Response<Array>(ResponseConstants.EMPTYOK, ResponseConstants.EMPTYOK_MESSAGE, ResponseConstants.EMPTYDATA));
            }
            else
            {
                return Ok(new Response<object>(result));
            }
        }


        /// <summary>
        /// To update workflow action
        /// </summary>
        /// <param name="request"></param>
        /// <returns></returns>
        [HttpPost("add_activity")]
        [Base64Filter("comments")]
        [IntIDValidationFilter(caseParameter = "RequestIDList")]
        public async Task<IActionResult> PostOdsWorkflowAction([FromBody] PostOdsWorkflowActionNameRequest request)
        {
            var requestIDList = request.requestIdList!.Split(',');
            List<int> updateRequest = requestIDList.Select(x => int.Parse(x)).ToList();
            DataTable initialStatusUpdate = _actionManagementServices.CreateDataTableToUpdateWFRequestStatus(updateRequest, value: 1);
            await _actionManagementServices.UpdateTemporaryStatusOfWorkflowRequestsAsync(initialStatusUpdate);

            // Update the status of requests.
            var bulkUpdateResult = await _actionManagementServices.PostOdsWorkflowActionsInParallelAsync(request);


            if (bulkUpdateResult != null && bulkUpdateResult.sendEmailRequests!.Count > 0)
            {
                var errorLog = await _actionManagementServices.GenerateErrorLogRequest(request, bulkUpdateResult.sendEmailRequests!, HttpContext);
                await _loggingServices.AddErrorLogAsync(errorLog);
                return BadRequest(new Response<Array>(ResponseConstants.CUSTOMERROR, $"{ResponseConstants.COULD_NOT_SEND_EMAIL} {String.Join(", ", bulkUpdateResult.sendEmailRequests!)}.", ResponseConstants.EMPTYDATA));
            }
            if (bulkUpdateResult != null && bulkUpdateResult.validateRequests!.Count > 0)
            {
                var errorLog = await _actionManagementServices.GenerateErrorLogRequest(request, bulkUpdateResult.validateRequests!, HttpContext);
                await _loggingServices.AddErrorLogAsync(errorLog);
                return BadRequest(new Response<Array>(ResponseConstants.CUSTOMERROR, $"{ResponseConstants.COULD_NOT_VALIDATE_ASSIGNEE} {String.Join(", ", bulkUpdateResult.validateRequests!)}.", ResponseConstants.EMPTYDATA));
            }
            else if (bulkUpdateResult != null && bulkUpdateResult.failedRequests!.Count > 0)
            {
                var errorLog = await _actionManagementServices.GenerateErrorLogRequest(request, bulkUpdateResult.failedRequests!, HttpContext);
                await _loggingServices.AddErrorLogAsync(errorLog);
                return BadRequest(new Response<Array>(ResponseConstants.CUSTOMERROR, $"{ResponseConstants.COULD_NOT_RUN_WORKFLOW} {String.Join(", ", bulkUpdateResult.failedRequests!)}.", ResponseConstants.EMPTYDATA));
            }
            else
            {
                return Ok(new Response<object>(bulkUpdateResult!));
            }
        }


        /// <summary>
        /// To fetch details of an alert
        /// </summary>
        /// <param name="request"></param>
        /// <returns></returns>
        [HttpPost("get_details_by_request_id")]
        public async Task<IActionResult> GetOdsDataByRequestId([FromBody] RequestIdInputRequest request)
        {
            var result = await _actionManagementServices.GetOdsDataByRequestIdAsync(request.requestId);
            if (result == null || (result.metaData == null && result.details == null))
            {
                return Ok(new Response<Array>(ResponseConstants.EMPTYOK, ResponseConstants.EMPTYOK_MESSAGE, ResponseConstants.EMPTYDATA));
            }
            else
            {
                return Ok(new Response<object>(result));
            }
        }


        /// <summary>
        /// To fetch roles associated with workflow
        /// </summary>
        /// <returns></returns>
        [HttpGet("get_workflow_roles")]
        public async Task<IActionResult> GetWorkFlowRoles()
        {
            var result = await _accountServices.GetWorkflowUserRoles();
            if (result == null || result.Count == 0)
            {
                return Ok(new Response<Array>(ResponseConstants.EMPTYOK, ResponseConstants.EMPTYOK_MESSAGE, ResponseConstants.EMPTYDATA));
            }
            else
            {
                return Ok(new Response<object>(result));
            }
        }

        /// <summary>
        /// To get list of alerts assigned to a user.
        /// </summary>
        /// <param name="request"></param>
        /// <returns></returns>
        [HttpPost("get_wf_assigned_list_by_userid")]
        public async Task<IActionResult> GetWorkflowAssignedListByUserID([FromBody] GetWorkflowListRequest request)
        {
            var result = await _actionManagementServices.GetWorkflowAssignedListByUserID(request.userIdList!);
            if (result == null || result.Count == 0)
            {
                return Ok(new Response<Array>(ResponseConstants.EMPTYOK, ResponseConstants.EMPTYOK_MESSAGE, ResponseConstants.EMPTYDATA));
            }
            else
            {
                return Ok(new Response<object>(result));
            }
        }

        /// <summary>
        /// To get historical data associated with an alert
        /// </summary>
        /// <param name="request"></param>
        /// <returns></returns>
        [HttpPost("get_wf_alert_historical_data_all_user")]
        public async Task<IActionResult> GetWorkflowHistoricalDataForAllUsers([FromBody] WorkflowCauseIDRequest request)
        {
            var result = await _actionManagementServices.GetWorkflowHistoricalDataForAllUsersAsync(request.reqID);
            if (result == null || result.Count == 0)
            {
                return Ok(new Response<Array>(ResponseConstants.EMPTYOK, ResponseConstants.EMPTYOK_MESSAGE, ResponseConstants.EMPTYDATA));
            }
            else
            {
                return Ok(new Response<object>(result));
            }
        }


        /// <summary>
        /// To get historical data associated with an alert
        /// </summary>
        /// <param name="request"></param>
        /// <returns></returns>
        [HttpPost("get_wf_alert_historical_data")]
        public async Task<IActionResult> GetWorkflowHistoricalData([FromBody] WorkflowCauseIDRequest request)
        {
            var result = await _actionManagementServices.GetWorkflowHistoricalDataAsync(request.reqID);
            if (result == null || result.Count == 0)
            {
                return Ok(new Response<Array>(ResponseConstants.EMPTYOK, ResponseConstants.EMPTYOK_MESSAGE, ResponseConstants.EMPTYDATA));
            }
            else
            {
                return Ok(new Response<object>(result));
            }
        }


        /// <summary>
        /// To fetch users related to workflow with a particular role
        /// </summary>
        /// <param name="request"></param>
        /// <returns></returns>
        [HttpPost("get_workflow_users_by_role")]
        [AuthorizeOnAnyOnePolicy("WorkflowUserManagementAccess,AdminAccess")]
        public async Task<IActionResult> GetWorkflowUsersByRoleAffiliatePlant([FromBody] GetWorkflowUsersByRoleRequest request)
        {
            string role = request.role!;
            int? plantID = request.affiliateId!;
            var checkUserAccess = CommonMethod.IsWorkflowActionAllowed(HttpContext, plantID);
            if (!checkUserAccess)
            {
                return BadRequest(new Response<Array>(ResponseConstants.CUSTOMERROR, ResponseConstants.WORKLFOW_NOTAUTHORIZED_MESSAGE!, ResponseConstants.EMPTYDATA));
            }
            var UsersByRoleresult = await _accountServices.GetWorkflowUsersByRoleAffiliatePlantAsync(role, plantID);
            if (UsersByRoleresult.Count == 0)
            {
                return Ok(new Response<Array>(ResponseConstants.EMPTYOK, ResponseConstants.EMPTYOK_MESSAGE, ResponseConstants.EMPTYDATA));
            }
            else
            {
                return Ok(new Response<object>(UsersByRoleresult));
            }
        }

        /// <summary>
        /// To add users to a workflow role
        /// </summary>
        /// <param name="request"></param>
        /// <returns></returns>
        [HttpPost("add_workflow_user")]
        [AuthorizeOnAnyOnePolicy("WorkflowUserManagementAccess,AdminAccess")]
        public async Task<IActionResult> AddWorkflowUsers([FromBody] AddWorkflowUserRequest request)
        {
            string userID = request.userIDList!;
            string role = request.role!;
            int? affiliateId = request.affiliateId!;
            string managerID = request.managerID!;
            var checkUserAccess = CommonMethod.IsWorkflowActionAllowed(HttpContext, affiliateId);
            if (!checkUserAccess)
            {
                return BadRequest(new Response<Array>(ResponseConstants.CUSTOMERROR, ResponseConstants.WORKLFOW_NOTAUTHORIZED_MESSAGE!, ResponseConstants.EMPTYDATA));
            }
            var validationsResponse = await _accountServices.WorkflowUserAdditionValidation(userID, role, affiliateId);
            if (!validationsResponse.isValid)
            {
                return BadRequest(new Response<Array>(ResponseConstants.CUSTOMERROR, validationsResponse.message!, ResponseConstants.EMPTYDATA));
            }

            string createdBy = CommonMethod.GetEmployeeIdFromClaim(HttpContext).ToString();
            var requestedRole = await _accountServices.GetWorkflowRequestRole(request);

            if (requestedRole != null && requestedRole.roleId == 1)
            {
                var usersByRoleresult = await _accountServices.GetWorkflowUsersByRoleAffiliatePlantAsync(role, affiliateId);
                if (usersByRoleresult != null && usersByRoleresult.Count > 0)
                {
                    var item = usersByRoleresult.FirstOrDefault();
                    var deleteResult = await _accountServices.DeleteWorkflowUserAsync(item!.employeeID, item!.role, createdBy);
                    if (deleteResult.isActive == 1)
                    {
                        return BadRequest(new Response<Array>(ResponseConstants.CUSTOMERROR, $"Could not delete user {item.employeeID} from role {item.role}", ResponseConstants.EMPTYDATA));
                    }
                }
                var addResponse1 = await _accountServices.AddWorkflowUsersAsync(userID, role, affiliateId, managerID, createdBy);
                if (addResponse1.Count == 0)
                {
                    return BadRequest(new Response<Array>(ResponseConstants.CUSTOMERROR, $"Could not add users {userID} to role {request.role}", ResponseConstants.EMPTYDATA));
                }
                else
                {
                    string token = await _accountServices.GenerateNewTokenWhenAdminActionTakenAsync(User, HttpContext, Request);
                    return Ok(new TokenResponse<object>(addResponse1, token));
                }
            }

            var addResponse = await _accountServices.AddWorkflowUsersAsync(userID, role, affiliateId, managerID, createdBy);

            if (addResponse.Count == 0)
            {
                return BadRequest(new Response<Array>(ResponseConstants.CUSTOMERROR, $"Could not add users {request.userIDList} to role {request.role}", ResponseConstants.EMPTYDATA));
            }
            else
            {
                string token = await _accountServices.GenerateNewTokenWhenAdminActionTakenAsync(User, HttpContext, Request);
                return Ok(new TokenResponse<object>(addResponse, token));
            }
        }

        /// <summary>
        /// To delete a workflow user from a role assigned for a plant
        /// </summary>
        /// <param name="request"></param>
        /// <returns></returns>
        [HttpPost("delete_workflow_user_from_role")]
        [AuthorizeOnAnyOnePolicy("WorkflowUserManagementAccess,AdminAccess")]
        public async Task<IActionResult> DeleteWorkflowUser([FromBody] DeleteWorkflowUserRoleRequest request)
        {
            string userID = request.userId!;
            string role = request.role!;
            int? plantID = request.affiliateId;
            var checkUserAccess = CommonMethod.IsWorkflowActionAllowed(HttpContext, plantID);
            if (!checkUserAccess)
            {
                return BadRequest(new Response<Array>(ResponseConstants.CUSTOMERROR, ResponseConstants.WORKLFOW_NOTAUTHORIZED_MESSAGE, ResponseConstants.EMPTYDATA));
            }
            var claims = HttpContext.User.Identity as ClaimsIdentity;
            Claim? claimUID = claims!.Claims.FirstOrDefault(claim => claim.Type == "uid");
            string updatedBy = Convert.ToInt32(claimUID!.Value).ToString();

            var deleteResult = await _accountServices.DeleteWorkflowUserAsync(userID, role, updatedBy);
            if (deleteResult.isActive == 1)
            {
                return BadRequest(new Response<Array>(ResponseConstants.CUSTOMERROR, $"Could not delete user {request.userId} from role {request.role}", ResponseConstants.EMPTYDATA));
            }
            else
            {
                string token = await _accountServices.GenerateNewTokenWhenAdminActionTakenAsync(User, HttpContext, Request);
                return Ok(new TokenResponse<object>(deleteResult, token));
            }
        }

        /// <summary>
        /// To fetch configurations related to workflow
        /// </summary>
        /// <returns></returns>
        [HttpPost("get_workflow_configurations")]
        public async Task<IActionResult> GetWorkflowConfigurations([FromBody] GetWorkflowConfigurationsRequest request)
        {
            var result = await _actionManagementServices.GetWorkflowConfigurationsAsync(request);
            if (result.Count == 0)
            {
                return Ok(new Response<Array>(ResponseConstants.EMPTYOK, ResponseConstants.EMPTYOK_MESSAGE, ResponseConstants.EMPTYDATA));
            }
            else
            {
                return Ok(new Response<object>(result));
            }
        }

        /// <summary>
        /// To update workflow configurations
        /// </summary>
        /// <param name="request"></param>
        /// <returns></returns>
        [HttpPost("update_workflow_configurations")]
        public async Task<IActionResult> UpdateWorkflowConfigurationsAsync([FromBody] List<WorkflowConfigurations> request)
        {
            int updatedBy = CommonMethod.GetEmployeeIdFromClaim(HttpContext);
            var result = await _actionManagementServices.UpdateWorkflowConfigurationsAsync(request, updatedBy);
            if (!result)
            {
                return BadRequest(new Response<Array>(ResponseConstants.CUSTOMERROR, ResponseConstants.COULD_NOT_UPDATE_WORKFLOW_CONFIGURATIONS, ResponseConstants.EMPTYDATA));
            }
            else
            {
                return Ok(new Response<object>(result));
            }
        }

        /// <summary>
        /// To get workflow pm delegation information
        /// </summary>
        /// <param name="request"></param>
        /// <returns></returns>
        [HttpPost("get_workflow_pm_delegation_info")]
        public async Task<IActionResult> GetWorkflowPmDelegationInfo([FromBody] EmployeeIdInputRequest request)
        {
            var result = await _actionManagementServices.GetWorkflowPmDelegationInfoAsync(request);
            if (result == null)
            {
                return Ok(new Response<Array>(ResponseConstants.EMPTYOK, ResponseConstants.EMPTYOK_MESSAGE, ResponseConstants.EMPTYDATA));
            }
            else
            {
                return Ok(new Response<object>(result));
            }
        }

        /// <summary>
        /// To update PM delegation information
        /// </summary>
        /// <param name="request"></param>
        /// <returns></returns>
        [HttpPost("update_workflow_pm_delegation_info")]
        public async Task<IActionResult> UpdateWorkflowPmDelegationInfo([FromBody] List<UpdateWorkflowPmDelegationInfoRequest> request)
        {
            var result = await _actionManagementServices.UpdateWorkflowPmDelegationInfoAsync(request);
            if (result == 0)
            {
                return BadRequest(new Response<Array>(ResponseConstants.CUSTOMERROR, ResponseConstants.COULD_NOT_UPDATE_PM_DELEGATION_INFORMATION, ResponseConstants.EMPTYDATA));
            }
            else
            {
                return Ok(new Response<object>(result));
            }
        }

        /// <summary>
        /// To get the data for delegation for a process manager.
        /// </summary>
        /// <param name="request"></param>
        /// <returns></returns>
        [HttpPost("get_workflow_pm_delegation_info_by_employee_id")]
        public async Task<IActionResult> GetWorkflowPmDelegationInfoByEmployeeId([FromBody] EmployeeIdInputRequest request)
        {
            string employeeID = request.employeeID!;
            var result = await _actionManagementServices.GetWorkflowPmDelegationInfoByEmployeeIdAsync(employeeID);
            if (result == null)
            {
                return Ok(new Response<Array>(ResponseConstants.EMPTYOK, ResponseConstants.EMPTYOK_MESSAGE, ResponseConstants.EMPTYDATA));
            }
            else
            {
                return Ok(new Response<object>(result));
            }
        }

        /// <summary>
        /// To mute workflow notifications related to a causeID
        /// </summary>
        /// <param name="request"></param>
        /// <returns></returns>
        [HttpPost("mute_workflow_alerts_by_cause_id")]
        public async Task<IActionResult> AddMuteWorkflowNotificationsData([FromBody] MuteWorkflowNotificationRequest request)
        {
            var result = await _actionManagementServices.AddMuteWorkflowNotificationsDataAsync(request);
            if (!result)
            {
                return BadRequest(new Response<Array>(ResponseConstants.EMPTYOK, ResponseConstants.COULD_NOT_UPDATE_MUTE_STATUS + request.causeId, ResponseConstants.EMPTYDATA));
            }
            else
            {
                return Ok(new Response<object>(result));
            }
        }

        /// <summary>
        /// To fetch mute alert by causeID
        /// </summary>
        /// <param name="request"></param>
        /// <returns></returns>
        [HttpPost("get_workflow_mute_alert_frequency_by_cause_id")]
        public async Task<IActionResult> GetWorkflowMutedAlertByCauseId([FromBody] CauseIdTimeInputRequest request)
        {
            var result = await _actionManagementServices.GetWorkflowMutedAlertByCauseIdAsync(request);
            if (result == null)
            {
                return Ok(new Response<Array>(ResponseConstants.EMPTYOK, ResponseConstants.EMPTYOK_MESSAGE, ResponseConstants.EMPTYDATA));
            }
            else
            {
                return Ok(new Response<object>(result));
            }
        }
        /// <summary>
        /// To fetch mute alert by causeID
        /// </summary>
        /// <param name="request"></param>
        /// <returns></returns>
        [HttpPost("update_workflow_configuration_affiliateId")]
        public async Task<IActionResult> UpdateWorkflowConfigurations([FromBody] UpdateWorkflowConfigurationsRequest request)
        {
            var result = await _actionManagementServices.UpdateWorkflowConfigurations(request);
            if (result == null)
            {
                return Ok(new Response<Array>(ResponseConstants.EMPTYOK, ResponseConstants.EMPTYOK_MESSAGE, ResponseConstants.EMPTYDATA));
            }
            else
            {
                return Ok(new Response<object>(result));
            }

        }

        /// <summary>
        /// To fetch mute alert by causeID
        /// </summary>
        /// <param name="request"></param>
        /// <returns></returns>
        [HttpPost("ods_check_send_email")]
        public async Task<IActionResult> ODSCheckSendEmail([FromBody] OdsCheckSendEmailRequest request)
        {
            var result = await _actionManagementServices.ODSCheckSendEmail(request);
            if (result == null)
            {
                return Ok(new Response<Array>(ResponseConstants.EMPTYOK, ResponseConstants.EMPTYOK_MESSAGE, ResponseConstants.EMPTYDATA));
            }
            else
            {
                return Ok(new Response<object>(result));
            }

        }


        /// <summary>
        /// To fetch mute alert by causeID
        /// </summary>
        /// <param name="request"></param>
        /// <returns></returns>
        [HttpPost("ods_check_auto_closure_by_req_id")]
        public async Task<IActionResult> OdsCheckAutoClosureByReqId([FromBody] OdsCheckAutoClosureByReqIdRequest request)
        {
            var result = await _actionManagementServices.OdsCheckAutoClosureByReqId(request);
            if (result == null)
            {
                return Ok(new Response<Array>(ResponseConstants.EMPTYOK, ResponseConstants.EMPTYOK_MESSAGE, ResponseConstants.EMPTYDATA));
            }
            else
            {
                return Ok(new Response<object>(result));
            }

        }

        /// <summary>
        /// To fetch start eo workflow
        /// </summary>
        /// <param name="request"></param>
        /// <returns></returns>
        [HttpPost("start_eo_workflow")]
        public async Task<IActionResult> GetStartEoWorkflow([FromBody] GetStartEoWorkflowRequest request)
        {
            var result = await _actionManagementServices.GetStartEoWorkflowAsync(request);
            if (result == null)
            {
                return Ok(new Response<Array>(ResponseConstants.EMPTYOK, ResponseConstants.EMPTYOK_MESSAGE, ResponseConstants.EMPTYDATA));
            }
            else
            {
                return Ok(new Response<object>(result));
            }
        }
        /// <summary>
        /// 
        /// </summary>
        /// <param name="request"></param>
        /// <returns></returns>

        [HttpPost("get_wf_cumulative_lost_opportunity_trend_data_by_request_id")]
        public async Task<IActionResult> GetWFCumulativeLostOpportunityTrendDataByRequestId([FromBody] GetWFCumulativeLostOpportunityTrendDataByRequest request)
        {
            var result = await _actionManagementServices.GetWFCumulativeLostOpportunityTrendDataByRequest(request);
            if (result == null)
            {
                return Ok(new Response<Array>(ResponseConstants.EMPTYOK, ResponseConstants.EMPTYOK_MESSAGE, ResponseConstants.EMPTYDATA));
            }
            else
            {
                return Ok(new Response<object>(result));
            }
        }


        /// <summary>
        /// to get the failed instances of bpm
        /// </summary>
        /// <param name="request"></param>
        /// <returns></returns>
        [HttpPost("get_corrupted_failed_instances")]
        public async Task<IActionResult> GetFailedInstances([FromBody] TerminateFailedInstancesApiRequestBody request)
        {
            var bulkUpdateResult = await _actionManagementServices.GetFailedInstancesApiRequestAsync(request);
            return Ok(new Response<object>(bulkUpdateResult!));

        }

        /// <summary>
        /// get the log from db of the terminated instances
        /// </summary>
        /// <returns></returns>

        [HttpPost("get_terminated_instances_log")]
        public async Task<IActionResult> GetTerminatedInstancesLog()
        {
            var result = await _actionManagementServices.GetTerminatedInstancesLog();
            return Ok(new Response<object>(result));
        }


        /// <summary>
        /// to delete the instances from bpm based on assignedBy
        /// </summary>
        /// <param name="request"></param>
        /// <returns></returns>
        [HttpPost("terminate_instance")]
        public async Task<IActionResult> GetHandleCorruptedInstance([FromBody] GetHandleCorruptedInstanceRequest request)
        {
            var bulkUpdateResult = await _actionManagementServices.GetHandleCorruptedInstanceAsync(request);
            return Ok(new Response<object>(bulkUpdateResult!));
        }

        /// <summary>
        /// to delete multiple instances from bpm 
        /// </summary>
        /// <param name="request"></param>
        /// <returns></returns>
        [HttpPost("bulk_terminate_instances")]
        public async Task<IActionResult> TerminateFailedInstances([FromBody] TerminateFailedInstancesApiRequestBody request)
        {
            var bulkUpdateResult = await _actionManagementServices.TerminateFailedInstancesAsync(request);
            return Ok(new Response<object>(bulkUpdateResult!));

        }

        /// <summary>
        /// To get handling reasons of workflow
        /// </summary>
        /// <param name="request"></param>
        /// <returns></returns>
        [HttpPost("get_workflow_handling_reasons")]
        public async Task<IActionResult> GetWorkFlowHandlingReasons([FromBody] GetWorkFlowHandlingReasonsRequest request)
        {
            var result = await _actionManagementServices.GetWorkFlowHandlingReasons(request);
            if (result == null)
            {
                return Ok(new Response<Array>(ResponseConstants.EMPTYOK, ResponseConstants.EMPTYOK_MESSAGE, ResponseConstants.EMPTYDATA));
            }
            else
            {
                return Ok(new Response<object>(result));
            }
        }
    }
}
