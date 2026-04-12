import asyncHandler from "../../utils/asyncHandler.js";
import sendResponse from "../../utils/sendResponse.js";
import authService from "./auth.service.js";
import env from "../../config/env.js";

const getCookieOptions = () => ({
  httpOnly: true,
  secure: env.nodeEnv === "production",
  sameSite: env.nodeEnv === "production" ? "none" : "lax",
  path: "/",
  maxAge: 7 * 24 * 60 * 60 * 1000,
});

const getAccessToken = asyncHandler(async (req, res) => {
  const result = await authService.issueAccessToken(req.body);
  res.cookie(env.jwtCookieName, result.accessToken, getCookieOptions());

  return sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Access token issued successfully",
    data: { user: result.user },
  });
});

const logout = asyncHandler(async (req, res) => {
  res.clearCookie(env.jwtCookieName, {
    httpOnly: true,
    secure: env.nodeEnv === "production",
    sameSite: env.nodeEnv === "production" ? "none" : "lax",
    path: "/",
  });

  return sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Logged out successfully",
    data: null,
  });
});

const authController = {
  getAccessToken,
  logout,
};

export default authController;
