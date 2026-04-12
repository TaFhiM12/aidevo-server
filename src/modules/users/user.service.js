import ApiError from "../../utils/ApiError.js";
import userRepository from "./user.repository.js";

const getUserByUid = async (uid) => {
  const user = await userRepository.findByUid(uid);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return user;
};

const getUserById = async (userId) => {
  const user = await userRepository.findById(userId);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return user;
};

const getUserRoleByEmail = async (email) => {
  const user = await userRepository.findByEmail(email);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const userInfo = {
    _id: user._id.toString(),
    role: user.role,
    name: user.name,
    email: user.email,
    photoURL: user.photoURL,
    uid: user.uid,
  };

  if (user.role === "organization") {
    userInfo.organizationId = user._id.toString();
    userInfo.organizationName = user.organization?.name || "";
    userInfo.type = user.organization?.type || "";
  }

  if (user.role === "student") {
    userInfo.studentId = user._id.toString();
    userInfo.department = user.student?.department || "";
    userInfo.session = user.student?.session || "";
    userInfo.studentNumber = user.student?.studentId || "";
    userInfo.interests = user.student?.interests || "";
  }

  return userInfo;
};

const createUser = async (payload) => {
  const existing = await userRepository.findByEmail(payload.email);

  if (existing) {
    throw new ApiError(400, "User already exists");
  }

  const result = await userRepository.createOne(payload);

  return {
    userId: result.insertedId,
  };
};

const getAllUsers = async () => {
  return userRepository.findAll();
};

const userService = {
  getUserByUid,
  getUserById,
  getUserRoleByEmail,
  createUser,
  getAllUsers,
};

export default userService;