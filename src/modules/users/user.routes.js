import { Router } from "express";
import userController from "./user.controller.js";
import {
	authenticateJWT,
	authorizeAccess,
	matchEmailParamWithAuth,
	matchParamWithAuth,
} from "../../middleware/authenticateJWT.js";

const router = Router();

const ADMIN_ROLES = ["super-admin", "superAdmin"];

router.post("/", userController.createUser);
router.get(
	"/dashboard-overview/:uid",
	authenticateJWT,
	authorizeAccess({
		roles: ADMIN_ROLES,
		matchers: [matchParamWithAuth("uid", ["uid"])],
	}),
	userController.getDashboardOverviewByUid
);
router.get(
	"/dashboard-stats/:uid",
	authenticateJWT,
	authorizeAccess({
		roles: ADMIN_ROLES,
		matchers: [matchParamWithAuth("uid", ["uid"])],
	}),
	userController.getDashboardStatsByUid
);
router.get(
	"/uid/:uid",
	authenticateJWT,
	authorizeAccess({
		roles: ADMIN_ROLES,
		matchers: [matchParamWithAuth("uid", ["uid"])],
	}),
	userController.getUserByUid
);
router.get(
	"/role/:email",
	authenticateJWT,
	authorizeAccess({
		roles: ADMIN_ROLES,
		matchers: [matchEmailParamWithAuth("email")],
	}),
	userController.getUserRoleByEmail
);
router.get(
	"/:userId",
	authenticateJWT,
	authorizeAccess({
		roles: ADMIN_ROLES,
		matchers: [matchParamWithAuth("userId", ["userId"])],
	}),
	userController.getUserById
);
router.get("/", authenticateJWT, authorizeAccess({ roles: ADMIN_ROLES }), userController.getAllUsers);

export default router;