import { Router } from "express";
import applicationController from "./application.controller.js";

const router = Router();

router.post("/", applicationController.submitApplication);
router.patch(
  "/:applicationId/status",
  applicationController.updateApplicationStatus
);
router.delete("/:applicationId", applicationController.deleteApplication);

export default router;