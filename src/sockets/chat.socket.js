import { ObjectId } from "mongodb";
import { getCollections } from "../config/collections.js";

const registerChatSocket = (io) => {
  io.on("connection", (socket) => {
    console.log("🔌 User connected:", socket.id);

    const { messagesCollection, conversationsCollection } = getCollections();

    socket.on("join_conversation", (conversationId) => {
      socket.join(conversationId);
      console.log(`User ${socket.id} joined: ${conversationId}`);
    });

    socket.on("leave_conversation", (conversationId) => {
      socket.leave(conversationId);
      console.log(`User ${socket.id} left: ${conversationId}`);
    });

    socket.on("send_message", async (data) => {
      try {
        const {
          conversationId,
          senderId,
          senderName,
          senderRole,
          text,
          senderPhoto,
        } = data;

        const message = {
          conversationId: new ObjectId(conversationId),
          senderId: new ObjectId(senderId),
          senderName,
          senderRole,
          senderPhoto,
          text,
          timestamp: new Date(),
          read: false,
        };

        const result = await messagesCollection.insertOne(message);
        message._id = result.insertedId;

        await conversationsCollection.updateOne(
          { _id: new ObjectId(conversationId) },
          {
            $set: {
              lastMessage: text,
              lastMessageTime: new Date(),
              updatedAt: new Date(),
              lastSenderId: new ObjectId(senderId),
            },
          },
        );

        io.to(conversationId).emit("receive_message", message);
      } catch (error) {
        console.error("❌ Message error:", error);
        socket.emit("message_error", {
          error: "Failed to send message",
        });
      }
    });

    socket.on("mark_as_read", async ({ conversationId, userId }) => {
      try {
        await messagesCollection.updateMany(
          {
            conversationId: new ObjectId(conversationId),
            senderId: { $ne: new ObjectId(userId) },
            read: false,
          },
          { $set: { read: true } },
        );

        io.to(conversationId).emit("messages_read", {
          conversationId,
          userId,
        });
      } catch (error) {
        console.error("❌ Read error:", error);
      }
    });

    socket.on("disconnect", () => {
      console.log("❌ User disconnected:", socket.id);
    });
  });
};

export default registerChatSocket;
