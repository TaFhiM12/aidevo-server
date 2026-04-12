import { Router } from "express";
import studentController from "./student.controller.js";

const router = Router();

router.get("/", studentController.getAllStudents);
router.get("/:studentId/applications", studentController.getApplicationsForStudent);
router.get("/:studentId/organizations", studentController.getStudentOrganizations);
router.patch("/:studentId/field", studentController.updateStudentField);
router.put("/:studentId/profile", studentController.updateStudentProfile);

export default router;