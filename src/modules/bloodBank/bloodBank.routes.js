import { Router } from "express";
import bloodBankController from "./bloodBank.controller.js";
import {
	authenticateJWT,
	authorizeAccess,
} from "../../middleware/authenticateJWT.js";

const router = Router();

const ADMIN_ROLES = ["super-admin", "superAdmin"];

router.get("/donors", bloodBankController.getPublicDonors);
router.post("/donors", bloodBankController.registerDonor);
router.get("/requests", bloodBankController.getPublicUrgentRequests);
router.post("/requests", bloodBankController.createUrgentRequest);

router.get(
	"/admin/queue",
	authenticateJWT,
	authorizeAccess({ roles: ADMIN_ROLES }),
	bloodBankController.getAdminModerationQueue
);
router.patch(
	"/admin/donors/:donorId/status",
	authenticateJWT,
	authorizeAccess({ roles: ADMIN_ROLES }),
	bloodBankController.moderateDonor
);
router.patch(
	"/admin/requests/:requestId/status",
	authenticateJWT,
	authorizeAccess({ roles: ADMIN_ROLES }),
	bloodBankController.moderateUrgentRequest
);

export default router;
