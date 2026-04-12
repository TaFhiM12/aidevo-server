import { Router } from "express";
import organizationController from "./organization.controller.js";

const router = Router();

router.get("/", organizationController.getAllOrganizations);
router.get(
  "/with-applications",
  organizationController.getOrganizationsWithApplications
);

router.get(
  "/email/:organizationEmail/members",
  organizationController.getMembersByOrganizationEmail
);

router.get(
  "/by-id/:organizationId/applications",
  organizationController.getApplicationsForOrganizationByMongoId
);

router.get(
  "/:organizationId/applications",
  organizationController.getApplicationsForOrganization
);

router.get("/:organizationId/profile", organizationController.getOrganizationProfile);
router.put("/:organizationId/profile", organizationController.updateOrganizationProfile);
router.patch("/:organizationId/field", organizationController.updateOrganizationField);
router.post("/:organizationId/cover-photo", organizationController.updateCoverPhoto);
router.post("/:organizationId/photo-album", organizationController.updatePhotoAlbum);
router.get("/:organizationId/photo-album", organizationController.getPhotoAlbum);

router.get("/events/:email", organizationController.getOrganizationEvents);

export default router;