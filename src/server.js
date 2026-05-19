import http from "http";
import app from "./app.js";
import env from "./config/env.js";
import { connectDB } from "./config/db.js";
import { initSocket } from "./sockets/index.js";

let isConnected = false;

async function startServer() {
  if (!isConnected) {
    await connectDB();
    isConnected = true;
  }

  return app;
}

// For local development
if (process.env.NODE_ENV !== "production") {
  const server = http.createServer(app);

  startServer()
    .then(() => {
      initSocket(server);
      server.listen(env.port, () => {
        console.log(`Server running on port ${env.port}`);
      });
    })
    .catch((error) => {
      console.error("❌ Failed to start server:", error);
      process.exit(1);
    });
}

// For Vercel
export default async function handler(req, res) {
  await startServer();
  return app(req, res);
}