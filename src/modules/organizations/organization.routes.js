import { Router } from "express";
import organizationController from "./organization.controller.js";
import {
  authenticateJWT,
  authorizeAccess,
  matchEmailParamWithAuth,
  matchParamWithAuth,
} from "../../middleware/authenticateJWT.js";

const router = Router();

const ADMIN_ROLES = ["super-admin", "superAdmin"];

router.get("/", organizationController.getAllOrganizations);
router.get(
  "/with-applications",
  organizationController.getOrganizationsWithApplications
);

router.get(
  "/email/:organizationEmail/members",
  authenticateJWT,
  authorizeAccess({
    roles: ADMIN_ROLES,
    matchers: [matchEmailParamWithAuth("organizationEmail")],
  }),
  organizationController.getMembersByOrganizationEmail
);

router.get(
  "/by-id/:organizationId/applications",
  authenticateJWT,
  authorizeAccess({
    roles: ADMIN_ROLES,
    matchers: [matchParamWithAuth("organizationId", ["userId"])],
  }),
  organizationController.getApplicationsForOrganizationByMongoId
);

router.get(
  "/:organizationId/applications",
  authenticateJWT,
  authorizeAccess({
    roles: ADMIN_ROLES,
    matchers: [matchParamWithAuth("organizationId", ["uid", "userId"])],
  }),
  organizationController.getApplicationsForOrganization
);

router.get(
  "/:organizationId/profile",
  authenticateJWT,
  authorizeAccess({
    roles: ADMIN_ROLES,
    matchers: [matchParamWithAuth("organizationId", ["userId"])],
  }),
  organizationController.getOrganizationProfile
);
router.put(
  "/:organizationId/profile",
  authenticateJWT,
  authorizeAccess({
    roles: ADMIN_ROLES,
    matchers: [matchParamWithAuth("organizationId", ["userId"])],
  }),
  organizationController.updateOrganizationProfile
);
router.patch(
  "/:organizationId/field",
  authenticateJWT,
  authorizeAccess({
    roles: ADMIN_ROLES,
    matchers: [matchParamWithAuth("organizationId", ["userId"])],
  }),
  organizationController.updateOrganizationField
);
router.post(
  "/:organizationId/cover-photo",
  authenticateJWT,
  authorizeAccess({
    roles: ADMIN_ROLES,
    matchers: [matchParamWithAuth("organizationId", ["userId"])],
  }),
  organizationController.updateCoverPhoto
);
router.post(
  "/:organizationId/photo-album",
  authenticateJWT,
  authorizeAccess({
    roles: ADMIN_ROLES,
    matchers: [matchParamWithAuth("organizationId", ["userId"])],
  }),
  organizationController.updatePhotoAlbum
);
router.get(
  "/:organizationId/photo-album",
  authenticateJWT,
  authorizeAccess({
    roles: ADMIN_ROLES,
    matchers: [matchParamWithAuth("organizationId", ["userId"])],
  }),
  organizationController.getPhotoAlbum
);

router.get("/events/:email", organizationController.getOrganizationEvents);

export default router;