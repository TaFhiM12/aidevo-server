import { Server } from "socket.io";
import corsOptions from "../config/cors.js";
import registerChatSocket from "./chat.socket.js";

let ioInstance = null;

const initSocket = (server) => {
  const io = new Server(server, {
    cors: corsOptions,
    transports: ["websocket", "polling"],
  });

  ioInstance = io;

  registerChatSocket(io);
};

export const getIO = () => ioInstance;

export default initSocket;