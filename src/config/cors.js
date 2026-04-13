import env from "./env.js";

const normalizeOrigin = (value) => String(value || "").trim().replace(/\/+$/, "").toLowerCase();

const allowedOrigins = new Set((env.clientUrls || []).map(normalizeOrigin).filter(Boolean));

const corsOptions = {
  origin(origin, callback) {
    if (!origin) {
      return callback(null, true);
    }

    const normalizedOrigin = normalizeOrigin(origin);

    if (allowedOrigins.has(normalizedOrigin)) {
      return callback(null, true);
    }

    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-User-Uid",
    "X-Requested-With",
    "Accept",
  ],
  credentials: true,
};

export default corsOptions;