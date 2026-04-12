import { Router } from "express";
import paymentController from "./payment.controller.js";
import {
  authenticateJWT,
  authorizeAccess,
  matchEmailParamWithAuth,
  matchParamWithAuth,
} from "../../middleware/authenticateJWT.js";

const router = Router();
const ADMIN_ROLES = ["super-admin", "superAdmin"];

router.post(
  "/checkout",
  authenticateJWT,
  authorizeAccess({ roles: ["student", ...ADMIN_ROLES] }),
  paymentController.checkoutPayment
);

router.post(
  "/demo",
  authenticateJWT,
  authorizeAccess({ roles: ["student", ...ADMIN_ROLES] }),
  paymentController.checkoutPayment
);

router.get(
  "/student/:uid",
  authenticateJWT,
  authorizeAccess({
    roles: ADMIN_ROLES,
    matchers: [matchParamWithAuth("uid", ["uid"])],
  }),
  paymentController.getStudentPayments
);

router.get(
  "/organization/:organizationEmail",
  authenticateJWT,
  authorizeAccess({
    roles: ["organization", ...ADMIN_ROLES],
    matchers: [matchEmailParamWithAuth("organizationEmail")],
  }),
  paymentController.getOrganizationPayments
);

export default router;
