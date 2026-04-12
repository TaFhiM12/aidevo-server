import ApiError from "../../utils/ApiError.js";
import studentRepository from "./student.repository.js";
import applicationService from "../applications/application.service.js";

const getAllStudents = async () => {
  return studentRepository.findAllActive();
};

const updateStudentField = async (studentId, field, value) => {
  const existingStudent = await studentRepository.findById(studentId);

  if (!existingStudent) {
    throw new ApiError(404, "Student not found");
  }

  const updatePath = {};

  if (field.startsWith("student.")) {
    const nestedField = field.replace("student.", "");
    updatePath[`student.${nestedField}`] = value;
  } else {
    updatePath[field] = value;
  }

  await studentRepository.updateById(studentId, updatePath);

  return studentRepository.findById(studentId);
};

const updateStudentProfile = async (studentId, updateData) => {
  const existingStudent = await studentRepository.findById(studentId);

  if (!existingStudent) {
    throw new ApiError(404, "Student not found");
  }

  const updateFields = {};

  if (updateData.student) {
    updateFields.student = {
      ...existingStudent.student,
      ...updateData.student,
    };
  }

  if (updateData.name) {
    updateFields.name = updateData.name;
  }

  if (updateData.photoURL) {
    updateFields.photoURL = updateData.photoURL;
  }

  await studentRepository.updateById(studentId, updateFields);

  return studentRepository.findById(studentId);
};

const getStudentOrganizations = async (studentId, search) => {
  const existingStudent = await studentRepository.findById(studentId);

  if (!existingStudent) {
    throw new ApiError(404, "Student not found");
  }

  const memberships = await studentRepository.findOrganizationsByStudentId(
    studentId,
    search
  );

  return memberships.map((member) => ({
    _id: member._id,
    organizationId: member.organizationId,
    organizationName: member.organizationName,
    organizationEmail: member.organizationEmail,
    organizationPhoto: member.organizationPhoto,
    organizationInfo: member.organizationInfo,
    joinedAt: member.joinedAt,
    role: member.role,
    status: member.status,
  }));
};

const getApplicationsForStudent = async (studentUid) => {
  return applicationService.getApplicationsForStudent(studentUid);
};

const studentService = {
  getAllStudents,
  updateStudentField,
  updateStudentProfile,
  getStudentOrganizations,
  getApplicationsForStudent,
};

export default studentService;