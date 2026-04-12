import asyncHandler from "../../utils/asyncHandler.js";
import sendResponse from "../../utils/sendResponse.js";
import applicationService from "./application.service.js";

const submitApplication = asyncHandler(async (req, res) => {
  const result = await applicationService.submitApplication(req.body);

  return sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Application submitted successfully",
    data: result,
  });
});

const updateApplicationStatus = asyncHandler(async (req, res) => {
  const { applicationId } = req.params;
  const { status, notes } = req.body;

  await applicationService.updateApplicationStatus(
    applicationId,
    status,
    notes
  );

  return sendResponse(res, {
    statusCode: 200,
    success: true,
    message: `Application ${status} successfully`,
  });
});

const getApplicationsForOrganization = asyncHandler(async (req, res) => {
  const { organizationId } = req.params;
  const { status } = req.query;

  const applications = await applicationService.getApplicationsForOrganization(
    organizationId,
    status
  );

  return sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Applications fetched successfully",
    data: applications,
  });
});

const getApplicationsForOrganizationByMongoId = asyncHandler(
  async (req, res) => {
    const { organizationId } = req.params;
    const { status } = req.query;

    const applications =
      await applicationService.getApplicationsForOrganizationByMongoId(
        organizationId,
        status
      );

    return sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Applications fetched successfully",
      data: applications,
    });
  }
);

const getApplicationsForStudent = asyncHandler(async (req, res) => {
  const { studentId } = req.params;

  const applications = await applicationService.getApplicationsForStudent(
    studentId
  );

  return sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Student applications fetched successfully",
    data: applications,
  });
});

const deleteApplication = asyncHandler(async (req, res) => {
  const { applicationId } = req.params;

  await applicationService.deleteApplication(applicationId);

  return sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Application deleted successfully",
  });
});

const applicationController = {
  submitApplication,
  updateApplicationStatus,
  getApplicationsForOrganization,
  getApplicationsForOrganizationByMongoId,
  getApplicationsForStudent,
  deleteApplication,
};

export default applicationController;