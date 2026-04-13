import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import corsOptions from "./config/cors.js";
import notFound from "./middleware/notFound.js";
import errorHandler from "./middleware/errorHandler.js";

import userRoutes from "./modules/users/user.routes.js";
import authRoutes from "./modules/auth/auth.routes.js";
import applicationRoutes from "./modules/applications/application.routes.js";
import organizationRoutes from "./modules/organizations/organization.routes.js";
import studentRoutes from "./modules/students/student.routes.js";
import conversationRoutes from "./modules/conversations/conversation.routes.js";
import eventRoutes from "./modules/events/event.routes.js";
import notificationRoutes from "./modules/notifications/notification.routes.js";
import paymentRoutes from "./modules/payments/payment.routes.js";
import bloodBankRoutes from "./modules/bloodBank/bloodBank.routes.js";
import newsletterRoutes from "./modules/newsletter/newsletter.routes.js";
// import { http } from 'http';

const app = express();

app.use(cors({
  origin: [
    "http://localhost:5173",
    "https://aidevo.web.app"
  ],
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

app.get("/", (req, res) => {
  res.send("Aidevo API is running!");
});

app.use("/users", userRoutes);
app.use("/auth", authRoutes);
app.use("/applications", applicationRoutes);
app.use("/organizations", organizationRoutes);
app.use("/students", studentRoutes);
app.use("/conversations", conversationRoutes);
app.use("/events", eventRoutes);
app.use("/notifications", notificationRoutes);
app.use("/payments", paymentRoutes);
app.use("/blood-bank", bloodBankRoutes);
app.use("/newsletter", newsletterRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;