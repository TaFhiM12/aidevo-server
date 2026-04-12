import asyncHandler from "../../utils/asyncHandler.js";
import sendResponse from "../../utils/sendResponse.js";
import organizationService from "./organization.service.js";

const getAllOrganizations = asyncHandler(async (req, res) => {
  const organizations = await organizationService.getAllOrganizations();

  return sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Organizations fetched successfully",
    data: organizations,
  });
});

const getOrganizationsWithApplications = asyncHandler(async (req, res) => {
  const organizations =
    await organizationService.getOrganizationsWithApplications();

  return sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Organizations with applications fetched successfully",
    data: organizations,
  });
});

const getOrganizationProfile = asyncHandler(async (req, res) => {
  const organization = await organizationService.getOrganizationProfile(
    req.params.organizationId
  );

  return sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Organization profile fetched successfully",
    data: organization,
  });
});

const updateOrganizationProfile = asyncHandler(async (req, res) => {
  const organization = await organizationService.updateOrganizationProfile(
    req.params.organizationId,
    req.body
  );

  return sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Profile updated successfully",
    data: organization,
  });
});

const updateOrganizationField = asyncHandler(async (req, res) => {
  const { field, value } = req.body;

  const organization = await organizationService.updateOrganizationField(
    req.params.organizationId,
    field,
    value
  );

  return sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Field updated successfully",
    data: organization,
  });
});

const updateCoverPhoto = asyncHandler(async (req, res) => {
  const result = await organizationService.updateCoverPhoto(
    req.params.organizationId,
    req.body.coverPhotoURL
  );

  return sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Cover photo updated successfully",
    data: result,
  });
});

const updatePhotoAlbum = asyncHandler(async (req, res) => {
  await organizationService.updatePhotoAlbum(
    req.params.organizationId,
    req.body.photos
  );

  return sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Photo album updated successfully",
  });
});

const getPhotoAlbum = asyncHandler(async (req, res) => {
  const photoAlbum = await organizationService.getPhotoAlbum(
    req.params.organizationId
  );

  return sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Photo album fetched successfully",
    data: photoAlbum,
  });
});

const getMembersByOrganizationEmail = asyncHandler(async (req, res) => {
  const result = await organizationService.getMembersByOrganizationEmail(
    req.params.organizationEmail,
    req.query.search
  );

  return sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Organization members fetched successfully",
    data: result,
  });
});

const getOrganizationEvents = asyncHandler(async (req, res) => {
  const events = await organizationService.getOrganizationEvents(
    req.params.email
  );

  return sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Organization events fetched successfully",
    data: events,
  });
});

const getApplicationsForOrganization = asyncHandler(async (req, res) => {
  const applications = await organizationService.getApplicationsForOrganization(
    req.params.organizationId,
    req.query.status
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
    const applications =
      await organizationService.getApplicationsForOrganizationByMongoId(
        req.params.organizationId,
        req.query.status
      );

    return sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Applications fetched successfully",
      data: applications,
    });
  }
);

const organizationController = {
  getAllOrganizations,
  getOrganizationsWithApplications,
  getOrganizationProfile,
  updateOrganizationProfile,
  updateOrganizationField,
  updateCoverPhoto,
  updatePhotoAlbum,
  getPhotoAlbum,
  getMembersByOrganizationEmail,
  getOrganizationEvents,
  getApplicationsForOrganization,
  getApplicationsForOrganizationByMongoId,
};

export default organizationController;