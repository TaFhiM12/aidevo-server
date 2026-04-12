import { Router } from "express";
import studentController from "./student.controller.js";
import {
	authenticateJWT,
	authorizeAccess,
	matchParamWithAuth,
} from "../../middleware/authenticateJWT.js";

const router = Router();

const ADMIN_ROLES = ["super-admin", "superAdmin"];

router.get("/", authenticateJWT, authorizeAccess({ roles: ADMIN_ROLES }), studentController.getAllStudents);
router.get(
	"/:studentId/applications",
	authenticateJWT,
	authorizeAccess({
		roles: [...ADMIN_ROLES, "organization"],
		matchers: [matchParamWithAuth("studentId", ["uid", "userId"])],
	}),
	studentController.getApplicationsForStudent
);
router.get(
	"/:studentId/organizations",
	authenticateJWT,
	authorizeAccess({
		roles: ADMIN_ROLES,
		matchers: [matchParamWithAuth("studentId", ["userId"])],
	}),
	studentController.getStudentOrganizations
);
router.patch(
	"/:studentId/field",
	authenticateJWT,
	authorizeAccess({
		roles: ADMIN_ROLES,
		matchers: [matchParamWithAuth("studentId", ["userId"])],
	}),
	studentController.updateStudentField
);
router.put(
	"/:studentId/profile",
	authenticateJWT,
	authorizeAccess({
		roles: ADMIN_ROLES,
		matchers: [matchParamWithAuth("studentId", ["userId"])],
	}),
	studentController.updateStudentProfile
);

export default router;