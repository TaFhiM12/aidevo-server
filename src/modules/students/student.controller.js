import asyncHandler from "../../utils/asyncHandler.js";
import sendResponse from "../../utils/sendResponse.js";
import studentService from "./student.service.js";

const getAllStudents = asyncHandler(async (req, res) => {
  const students = await studentService.getAllStudents();

  return sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Students fetched successfully",
    data: students,
  });
});

const updateStudentField = asyncHandler(async (req, res) => {
  const { field, value } = req.body;

  const student = await studentService.updateStudentField(
    req.params.studentId,
    field,
    value
  );

  return sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Field updated successfully",
    data: student,
  });
});

const updateStudentProfile = asyncHandler(async (req, res) => {
  const student = await studentService.updateStudentProfile(
    req.params.studentId,
    req.body
  );

  return sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Profile updated successfully",
    data: student,
  });
});

const getStudentOrganizations = asyncHandler(async (req, res) => {
  const organizations = await studentService.getStudentOrganizations(
    req.params.studentId,
    req.query.search
  );

  return sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Student organizations fetched successfully",
    data: organizations,
  });
});

const getApplicationsForStudent = asyncHandler(async (req, res) => {
  const applications = await studentService.getApplicationsForStudent(
    req.params.studentId
  );

  return sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Student applications fetched successfully",
    data: applications,
  });
});

const studentController = {
  getAllStudents,
  updateStudentField,
  updateStudentProfile,
  getStudentOrganizations,
  getApplicationsForStudent,
};

export default studentController;