import jwt from "jsonwebtoken";
import env from "../config/env.js";
import ApiError from "./ApiError.js";

export const signJwtToken = (payload) => {
  if (!env.jwtSecret) {
    throw new ApiError(500, "JWT secret is not configured");
  }

  return jwt.sign(payload, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  });
};

export const verifyJwtToken = (token) => {
  if (!env.jwtSecret) {
    throw new ApiError(500, "JWT secret is not configured");
  }

  return jwt.verify(token, env.jwtSecret);
};
