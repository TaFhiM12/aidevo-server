import { Router } from "express";
import notificationController from "./notification.controller.js";
import {
  authenticateJWT,
  authorizeAccess,
  matchParamWithAuth,
} from "../../middleware/authenticateJWT.js";

const router = Router();

const ADMIN_ROLES = ["super-admin", "superAdmin"];

router.get(
  "/me/:uid",
  authenticateJWT,
  authorizeAccess({
    roles: ADMIN_ROLES,
    matchers: [matchParamWithAuth("uid", ["uid"])],
  }),
  notificationController.getMyNotifications
);

router.patch(
  "/:notificationId/read",
  authenticateJWT,
  notificationController.markAsRead
);

router.patch(
  "/read-all/:uid",
  authenticateJWT,
  authorizeAccess({
    roles: ADMIN_ROLES,
    matchers: [matchParamWithAuth("uid", ["uid"])],
  }),
  notificationController.markAllAsRead
);

export default router;
