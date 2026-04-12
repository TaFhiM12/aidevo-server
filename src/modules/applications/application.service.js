import ApiError from "../../utils/ApiError.js";
import userRepository from "../users/user.repository.js";
import applicationRepository from "./application.repository.js";
import { ObjectId } from "mongodb";
import { getCollections } from "../../config/collections.js";
import notificationService from "../notifications/notification.service.js";

const submitApplication = async (applicationData) => {
  if (!applicationData.studentId || !applicationData.organizationId) {
    throw new ApiError(400, "Student ID and Organization ID are required");
  }

  const studentUser = await userRepository.findByUid(applicationData.studentId);

  if (!studentUser) {
    throw new ApiError(404, "Student not found");
  }

  const organizationUser = await userRepository.findByUid(
    applicationData.organizationId
  );

  if (!organizationUser) {
    throw new ApiError(404, "Organization not found");
  }

  const studentMongoId = studentUser._id.toString();
  const organizationMongoId = organizationUser._id.toString();

  const existingApplication =
    await applicationRepository.findExistingActiveApplication(
      studentMongoId,
      organizationMongoId
    );

  if (existingApplication) {
    throw new ApiError(400, "You have already applied to this organization");
  }

  const application = {
    studentId: studentMongoId,
    studentEmail: studentUser.email,
    studentName: studentUser.name,
    studentPhoto: studentUser.photoURL,
    organizationId: organizationMongoId,
    organizationName:
      organizationUser.organization?.name || organizationUser.name,
    organizationEmail: organizationUser.email,
    fullName: applicationData.fullName,
    email: applicationData.email,
    phone: applicationData.phone,
    department: applicationData.department,
    session: applicationData.session,
    currentYear: applicationData.currentYear,
    skills: applicationData.skills,
    experience: applicationData.experience,
    motivation: applicationData.motivation,
    expectations: applicationData.expectations,
    resume: applicationData.resume,
    studentInfo: {
      studentId: studentUser.student?.studentId,
      department: studentUser.student?.department,
      session: studentUser.student?.session,
    },
    status: "pending",
    appliedAt: new Date(),
    updatedAt: new Date(),
  };

  const result = await applicationRepository.createOne(application);

  await Promise.all([
    notificationService.createNotification({
      recipientUid: organizationUser.uid,
      type: "application_submitted",
      title: "New Application Received",
      message: `${studentUser.name} applied to join ${organizationUser.organization?.name || organizationUser.name}.`,
      actorUid: studentUser.uid,
      actorName: studentUser.name,
      meta: {
        applicationId: result.insertedId,
        organizationId: organizationMongoId,
      },
    }),
    notificationService.createNotification({
      recipientUid: studentUser.uid,
      type: "application_confirmation",
      title: "Application Submitted",
      message: `Your application to ${organizationUser.organization?.name || organizationUser.name} is pending review.`,
      actorUid: organizationUser.uid,
      actorName: organizationUser.organization?.name || organizationUser.name,
      meta: {
        applicationId: result.insertedId,
        organizationId: organizationMongoId,
      },
    }),
  ]);

  return {
    applicationId: result.insertedId,
  };
};

const updateApplicationStatus = async (applicationId, status, notes) => {
  const application = await applicationRepository.findOneById(applicationId);

  if (!application) {
    throw new ApiError(404, "Application not found");
  }

  if (status === "approved") {
    const memberData = {
      studentId: application.studentId,
      organizationId: application.organizationId,
      studentEmail: application.studentEmail,
      studentName: application.fullName,
      organizationName: application.organizationName,
      organizationEmail: application.organizationEmail,
      studentPhoto: application.studentPhoto,
      studentInfo: application.studentInfo,
      joinedAt: new Date(),
      status: "active",
      role: "member",
    };

    const memberInsertResult = await applicationRepository.insertMemberIfNotExists(
      memberData
    );

    if (memberInsertResult.inserted) {
      await applicationRepository.incrementOrganizationMembershipCount(
        application.organizationId,
        1
      );
    }
  }

  const updateData = {
    status,
    updatedAt: new Date(),
  };

  if (notes) {
    updateData.notes = notes;
  }

  await applicationRepository.updateStatusById(applicationId, updateData);

  const studentUser = await userRepository.findById(application.studentId);
  if (studentUser?.uid) {
    await notificationService.createNotification({
      recipientUid: studentUser.uid,
      type: "application_status",
      title: `Application ${status}`,
      message: `Your application at ${application.organizationName} has been ${status}.`,
      actorName: application.organizationName,
      meta: {
        applicationId,
        status,
        organizationId: application.organizationId,
      },
    });
  }

  return null;
};

const getApplicationsForOrganization = async (organizationUid, status) => {
  const organization = await userRepository.findByUid(organizationUid);

  if (!organization) {
    throw new ApiError(404, "Organization not found");
  }

  return applicationRepository.findByOrganizationId(
    organization._id.toString(),
    status
  );
};

const getApplicationsForOrganizationByMongoId = async (
  organizationId,
  status
) => {
  return applicationRepository.findByOrganizationId(organizationId, status);
};

const getApplicationsForStudent = async (studentUid) => {
  const student = await userRepository.findByUid(studentUid);

  if (!student) {
    throw new ApiError(404, "Student not found");
  }

  const applications = await applicationRepository.findByStudentId(
    student._id.toString()
  );

  const { usersCollection } = getCollections();

  const applicationsWithOrgDetails = await Promise.all(
    applications.map(async (application) => {
      let organization = null;

      if (ObjectId.isValid(application.organizationId)) {
        organization = await usersCollection.findOne(
          { _id: new ObjectId(application.organizationId) },
          {
            projection: {
              "organization.name": 1,
              "organization.type": 1,
              "organization.campus": 1,
              photoURL: 1,
            },
          }
        );
      }

      return {
        ...application,
        organization,
      };
    })
  );

  return applicationsWithOrgDetails;
};

const deleteApplication = async (applicationId) => {
  const application = await applicationRepository.findOneById(applicationId);

  if (!application) {
    throw new ApiError(404, "Application not found");
  }

  if (application.status === "approved") {
    await applicationRepository.deleteMember(
      application.studentId,
      application.organizationId
    );

    await applicationRepository.incrementOrganizationMembershipCount(
      application.organizationId,
      -1
    );
  }

  await applicationRepository.deleteOneById(applicationId);

  const studentUser = await userRepository.findById(application.studentId);
  if (studentUser?.uid) {
    await notificationService.createNotification({
      recipientUid: studentUser.uid,
      type: "application_removed",
      title: "Application Removed",
      message: `Your application record for ${application.organizationName} has been removed.`,
      actorName: application.organizationName,
      meta: {
        applicationId,
      },
    });
  }

  return null;
};

const applicationService = {
  submitApplication,
  updateApplicationStatus,
  getApplicationsForOrganization,
  getApplicationsForOrganizationByMongoId,
  getApplicationsForStudent,
  deleteApplication,
};

export default applicationService;