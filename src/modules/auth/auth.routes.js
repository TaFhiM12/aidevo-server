import { Router } from "express";
import authController from "./auth.controller.js";

const router = Router();

router.post("/token", authController.getAccessToken);
router.post("/logout", authController.logout);

export default router;
