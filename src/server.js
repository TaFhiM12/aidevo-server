import http from "http";
import app from "./app.js";
import env from "./config/env.js";
import { connectDB } from "./config/db.js";
import initSocket from "./sockets/index.js";

const server = http.createServer(app);

async function startServer() {
  try {
    await connectDB();
    initSocket(server);

    server.listen(env.port, () => {
      console.log(`🚀 Server running on port ${env.port}`);
      console.log("💬 Socket.io server ready");
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
}

startServer();