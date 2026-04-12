import ApiError from "../../utils/ApiError.js";
import { signJwtToken } from "../../utils/jwt.js";
import userRepository from "../users/user.repository.js";

const issueAccessToken = async ({ uid, email }) => {
  if (!uid || !email) {
    throw new ApiError(400, "uid and email are required");
  }

  const user = await userRepository.findByUid(uid);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (user.email !== email) {
    throw new ApiError(403, "User identity mismatch");
  }

  const token = signJwtToken({
    userId: user._id.toString(),
    uid: user.uid,
    email: user.email,
    role: user.role,
  });

  return {
    accessToken: token,
    user: {
      _id: user._id.toString(),
      uid: user.uid,
      email: user.email,
      role: user.role,
      name: user.name,
    },
  };
};

const authService = {
  issueAccessToken,
};

export default authService;
