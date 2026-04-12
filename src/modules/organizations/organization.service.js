import ApiError from "../../utils/ApiError.js";
import organizationRepository from "./organization.repository.js";
import applicationService from "../applications/application.service.js";
import { getCollections } from "../../config/collections.js";

const getAllOrganizations = async () => {
  return organizationRepository.findAllActive();
};

const getOrganizationsWithApplications = async () => {
  const organizations = await organizationRepository.findAllActive();
  const { applicationsCollection } = getCollections();

  const organizationsWithCounts = await Promise.all(
    organizations.map(async (organization) => {
      const applicationCount = await applicationsCollection.countDocuments({
        organizationId: organization._id.toString(),
        status: "approved",
      });

      return {
        ...organization,
        applicationCount,
      };
    })
  );

  return organizationsWithCounts;
};

const getOrganizationProfile = async (organizationId) => {
  const organization = await organizationRepository.findById(organizationId);

  if (!organization) {
    throw new ApiError(404, "Organization not found");
  }

  return organization;
};

const updateOrganizationProfile = async (organizationId, updateData) => {
  const existingOrg = await organizationRepository.findById(organizationId);

  if (!existingOrg) {
    throw new ApiError(404, "Organization not found");
  }

  const updateFields = {};

  if (updateData.organization) {
    updateFields.organization = {
      ...existingOrg.organization,
      ...updateData.organization,
    };
  }

  if (updateData.name) {
    updateFields.name = updateData.name;
  }

  if (updateData.photoURL) {
    updateFields.photoURL = updateData.photoURL;
  }

  await organizationRepository.updateById(organizationId, updateFields);

  return organizationRepository.findById(organizationId);
};

const updateOrganizationField = async (organizationId, field, value) => {
  const existingOrg = await organizationRepository.findById(organizationId);

  if (!existingOrg) {
    throw new ApiError(404, "Organization not found");
  }

  const updatePath = {};

  if (field.startsWith("organization.")) {
    const nestedField = field.replace("organization.", "");
    updatePath[`organization.${nestedField}`] = value;
  } else {
    updatePath[field] = value;
  }

  await organizationRepository.updateById(organizationId, updatePath);

  return organizationRepository.findById(organizationId);
};

const updateCoverPhoto = async (organizationId, coverPhotoURL) => {
  const existingOrg = await organizationRepository.findById(organizationId);

  if (!existingOrg) {
    throw new ApiError(404, "Organization not found");
  }

  await organizationRepository.updateById(organizationId, {
    "organization.coverPhoto": coverPhotoURL,
  });

  return {
    coverPhotoURL,
  };
};

const updatePhotoAlbum = async (organizationId, photos) => {
  const existingOrg = await organizationRepository.findById(organizationId);

  if (!existingOrg) {
    throw new ApiError(404, "Organization not found");
  }

  await organizationRepository.updateById(organizationId, {
    "organization.photoAlbum": photos,
  });

  return null;
};

const getPhotoAlbum = async (organizationId) => {
  const organization = await organizationRepository.findPhotoAlbumById(
    organizationId
  );

  if (!organization) {
    throw new ApiError(404, "Organization not found");
  }

  return organization.organization?.photoAlbum || [];
};

const getMembersByOrganizationEmail = async (organizationEmail, search) => {
  const organization = await organizationRepository.findByEmail(
    organizationEmail
  );

  if (!organization) {
    throw new ApiError(404, "Organization not found");
  }

  const members = await organizationRepository.findMembersByOrganizationId(
    organization._id.toString(),
    search
  );

  return {
    members,
    organization: {
      name: organization.organization?.name,
      email: organization.email,
    },
  };
};

const getOrganizationEvents = async (email) => {
  return organizationRepository.findEventsByOrganizationEmail(email);
};

const getApplicationsForOrganization = async (organizationId, status) => {
  return applicationService.getApplicationsForOrganization(organizationId, status);
};

const getApplicationsForOrganizationByMongoId = async (organizationId, status) => {
  return applicationService.getApplicationsForOrganizationByMongoId(
    organizationId,
    status
  );
};

const organizationService = {
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

export default organizationService;