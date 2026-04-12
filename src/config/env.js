import dotenv from "dotenv";

dotenv.config();

const env = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || "development",
  dbUser: process.env.DB_USER,
  dbPassword: process.env.DB_PASSWORD,
  dbName: process.env.DB_NAME || "aidevo",
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  jwtCookieName: process.env.JWT_COOKIE_NAME || "accessToken",
  clientUrls: process.env.CLIENT_URLS
    ? process.env.CLIENT_URLS.split(",").map((url) => url.trim())
    : [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
      ],
  publicAppUrl: process.env.PUBLIC_APP_URL || "http://localhost:5173",
  smtpHost: process.env.SMTP_HOST,
  smtpPort: process.env.SMTP_PORT,
  smtpUser: process.env.SMTP_USER,
  smtpPass: process.env.SMTP_PASS,
  smtpFrom: process.env.SMTP_FROM,
  smtpSecure: process.env.SMTP_SECURE || "false",
};

export default env;