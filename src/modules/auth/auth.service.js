import ApiError from "../../utils/ApiError.js";
import { signJwtToken } from "../../utils/jwt.js";
import userRepository from "../users/user.repository.js";

const issueAccessToken = async ({ uid, email }) => {
  if (!uid || !email) {
    throw new ApiError(400, "uid and email are required");
  }

  let user = await userRepository.findByUid(uid);

  // Backward-compatible fallback for users created before uid standardization.
  if (!user) {
    user = await userRepository.findByEmail(email);
  }

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (user.email !== email) {
    throw new ApiError(403, "User identity mismatch");
  }

  if (user.uid !== uid) {
    await userRepository.updateUidById(user._id.toString(), uid);
    user.uid = uid;
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
      photoURL: user.photoURL || "",
      organization: user.organization || null,
      organizationName:
        user.organization?.name || user.organizationName || user.name || "",
      type: user.organization?.type || user.type || "",
      roleType: user.organization?.roleType || user.roleType || "",
    },
  };
};

const authService = {
  issueAccessToken,
};

export default authService;
