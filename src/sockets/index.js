import { Server } from "socket.io";
import corsOptions from "../config/cors.js";
import registerChatSocket from "./chat.socket.js";

const initSocket = (server) => {
  const io = new Server(server, {
    cors: corsOptions,
    transports: ["websocket", "polling"],
  });

  registerChatSocket(io);
};

export default initSocket;