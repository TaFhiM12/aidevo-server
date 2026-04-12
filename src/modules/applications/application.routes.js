import { Router } from "express";
import applicationController from "./application.controller.js";
import {
  authenticateJWT,
  authorizeAccess,
} from "../../middleware/authenticateJWT.js";

const router = Router();

router.post(
  "/",
  authenticateJWT,
  authorizeAccess({ roles: ["student", "super-admin", "superAdmin"] }),
  applicationController.submitApplication
);
router.patch(
  "/:applicationId/status",
  authenticateJWT,
  authorizeAccess({ roles: ["organization", "super-admin", "superAdmin"] }),
  applicationController.updateApplicationStatus
);
router.delete(
  "/:applicationId",
  authenticateJWT,
  authorizeAccess({ roles: ["student", "organization", "super-admin", "superAdmin"] }),
  applicationController.deleteApplication
);

export default router;