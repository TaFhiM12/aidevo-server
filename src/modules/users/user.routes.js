import { Router } from "express";
import userController from "./user.controller.js";

const router = Router();

router.get("/uid/:uid", userController.getUserByUid);
router.get("/role/:email", userController.getUserRoleByEmail);
router.get("/:userId", userController.getUserById);
router.post("/", userController.createUser);
router.get("/", userController.getAllUsers);

export default router;