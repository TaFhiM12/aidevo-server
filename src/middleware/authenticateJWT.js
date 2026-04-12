import ApiError from "../utils/ApiError.js";
import { verifyJwtToken } from "../utils/jwt.js";
import env from "../config/env.js";

const getTokenFromRequest = (req) => {
  const cookieToken = req.cookies?.[env.jwtCookieName];
  if (cookieToken) {
    return cookieToken;
  }

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.split(" ")[1];
  }

  return null;
};

export const authenticateJWT = (req, res, next) => {
  const token = getTokenFromRequest(req);

  if (!token) {
    return next(new ApiError(401, "Unauthorized: access token is missing"));
  }

  try {
    const decoded = verifyJwtToken(token);
    req.auth = decoded;
    return next();
  } catch (error) {
    return next(new ApiError(401, "Unauthorized: invalid or expired token"));
  }
};

export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.auth) {
      return next(new ApiError(401, "Unauthorized"));
    }

    if (roles.includes(req.auth.role)) {
      return next();
    }

    return next(new ApiError(403, "Forbidden: insufficient permissions"));
  };
};

export const matchParamWithAuth = (paramName, authFields = ["uid", "userId"]) => {
  return (req) => {
    const paramValue = req.params[paramName];

    if (!paramValue) {
      return false;
    }

    return authFields.some((field) => String(req.auth?.[field] || "") === String(paramValue));
  };
};

export const matchEmailParamWithAuth = (paramName) => {
  return (req) => String(req.params[paramName] || "") === String(req.auth?.email || "");
};

export const authorizeAccess = ({ roles = [], matchers = [] } = {}) => {
  return (req, res, next) => {
    if (!req.auth) {
      return next(new ApiError(401, "Unauthorized"));
    }

    const hasRoleAccess = roles.includes(req.auth.role);
    const hasMatcherAccess = matchers.some((matcher) => matcher(req));

    if (hasRoleAccess || hasMatcherAccess) {
      return next();
    }

    return next(new ApiError(403, "Forbidden: access denied"));
  };
};
