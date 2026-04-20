import asyncHandler from "../../utils/asyncHandler.js";
import sendResponse from "../../utils/sendResponse.js";
import userService from "./user.service.js";

const getUserByUid = asyncHandler(async (req, res) => {
  const user = await userService.getUserByUid(req.params.uid);

  return sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "User fetched successfully",
    data: user,
  });
});

const getUserById = asyncHandler(async (req, res) => {
  const user = await userService.getUserById(req.params.userId);

  return sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "User fetched successfully",
    data: user,
  });
});

const getUserRoleByEmail = asyncHandler(async (req, res) => {
  const userInfo = await userService.getUserRoleByEmail(req.params.email);

  return sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "User role fetched successfully",
    data: userInfo,
  });
});

const createUser = asyncHandler(async (req, res) => {
  const result = await userService.createUser(req.body);

  return sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "User created successfully",
    data: result,
  });
});

const updateUserRole = asyncHandler(async (req, res) => {
  const updatedUser = await userService.updateUserRole(
    req.params.userId,
    req.body.role,
    req.auth
  );

  return sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "User role updated successfully",
    data: updatedUser,
  });
});

const getDashboardStatsByUid = asyncHandler(async (req, res) => {
  const data = await userService.getDashboardStatsByUid(req.params.uid);

  return sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Dashboard statistics fetched successfully",
    data,
  });
});

const getDashboardOverviewByUid = asyncHandler(async (req, res) => {
  const data = await userService.getDashboardOverviewByUid(req.params.uid);

  return sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Dashboard overview fetched successfully",
    data,
  });
});

const getAllUsers = asyncHandler(async (req, res) => {
  const users = await userService.getAllUsers();

  return sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Users fetched successfully",
    data: users,
  });
});

const userController = {
  getUserByUid,
  getUserById,
  getUserRoleByEmail,
  updateUserRole,
  getDashboardStatsByUid,
  getDashboardOverviewByUid,
  createUser,
  getAllUsers,
};

export default userController;