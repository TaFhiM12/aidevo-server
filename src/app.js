import express from "express";
import cors from "cors";
import corsOptions from "./config/cors.js";
import notFound from "./middleware/notFound.js";
import errorHandler from "./middleware/errorHandler.js";

import userRoutes from "./modules/users/user.routes.js";
import applicationRoutes from "./modules/applications/application.routes.js";
import organizationRoutes from "./modules/organizations/organization.routes.js";
import studentRoutes from "./modules/students/student.routes.js";
import conversationRoutes from "./modules/conversations/conversation.routes.js";
import eventRoutes from "./modules/events/event.routes.js";

const app = express();

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:3000",
      "http://127.0.0.1:5173",
      "https://your-frontend-domain.com",
    ],
    credentials: true,
  })
);
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Aidevo API is running!");
});

app.use("/users", userRoutes);
app.use("/applications", applicationRoutes);
app.use("/organizations", organizationRoutes);
app.use("/students", studentRoutes);
app.use("/conversations", conversationRoutes);
app.use("/events", eventRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;