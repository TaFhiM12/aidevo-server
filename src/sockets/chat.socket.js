import { ObjectId } from "mongodb";
import { getCollections } from "../config/collections.js";
import notificationService from "../modules/notifications/notification.service.js";

const onlineUsers = new Map();

const broadcastUserStatus = (io, uid, online) => {
  io.emit("user_status_changed", { uid, online });
};

const markUndeliveredMessagesForRecipient = async (io, recipientUid) => {
  if (!recipientUid) return;

  const { messagesCollection } = getCollections();
  const undeliveredMessages = await messagesCollection
    .find(
      {
        recipientUid,
        delivered: { $ne: true },
      },
      {
        projection: {
          _id: 1,
          conversationId: 1,
          senderUid: 1,
        },
      }
    )
    .toArray();

  if (!undeliveredMessages.length) {
    return;
  }

  const now = new Date();
  await messagesCollection.updateMany(
    {
      _id: { $in: undeliveredMessages.map((message) => message._id) },
    },
    {
      $set: {
        delivered: true,
        deliveredAt: now,
      },
    }
  );

  undeliveredMessages.forEach((message) => {
    const payload = {
      messageId: String(message._id),
      conversationId: String(message.conversationId),
      delivered: true,
      deliveredAt: now,
      recipientUid,
    };

    io.to(String(message.conversationId)).emit("message_delivery_updated", payload);

    if (message.senderUid) {
      io.to(`user:${message.senderUid}`).emit("message_delivery_updated", payload);
    }
  });
};

const registerChatSocket = (io) => {
  io.on("connection", (socket) => {
    const { messagesCollection, conversationsCollection } = getCollections();

    socket.on("register_user", (uid) => {
      if (!uid) return;

      socket.data.uid = uid;
      socket.join(`user:${uid}`);

      if (!onlineUsers.has(uid)) {
        onlineUsers.set(uid, new Set());
      }

      onlineUsers.get(uid).add(socket.id);
      broadcastUserStatus(io, uid, true);

      markUndeliveredMessagesForRecipient(io, uid).catch((error) => {
        console.error("❌ Delivery sync error:", error);
      });
    });

    socket.on("get_online_users", () => {
      socket.emit("online_users", Array.from(onlineUsers.keys()));
    });

    socket.on("join_conversation", (conversationId) => {
      socket.join(conversationId);
    });

    socket.on("leave_conversation", (conversationId) => {
      socket.leave(conversationId);
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
          attachment,
          senderUid,
        } = data;

        const safeAttachment = attachment && attachment.url
          ? {
              url: attachment.url,
              type: attachment.type || "file",
              name: attachment.name || "attachment",
              size: Number(attachment.size) || 0,
            }
          : null;

        const normalizedText = String(text || "").trim();

        const conversation = await conversationsCollection.findOne(
          { _id: new ObjectId(conversationId) },
          { projection: { participants: 1 } }
        );

        const recipient = conversation?.participants?.find(
          (participant) => String(participant.userId) !== String(senderId)
        );
        const recipientUid = recipient?.uid || "";
        const recipientOnline = Boolean(recipientUid && onlineUsers.has(recipientUid));
        const now = new Date();

        const message = {
          conversationId: new ObjectId(conversationId),
          senderId: new ObjectId(senderId),
          senderUid: senderUid || socket.data.uid || "",
          recipientUid,
          senderName,
          senderRole,
          senderPhoto,
          text: normalizedText,
          attachment: safeAttachment,
          timestamp: now,
          read: false,
          delivered: recipientOnline,
          deliveredAt: recipientOnline ? now : null,
        };

        const result = await messagesCollection.insertOne(message);
        message._id = result.insertedId;

        const lastMessagePreview = normalizedText || (safeAttachment ? `Attachment: ${safeAttachment.name}` : "");

        await conversationsCollection.updateOne(
          { _id: new ObjectId(conversationId) },
          {
            $set: {
              lastMessage: lastMessagePreview,
              lastMessageTime: now,
              updatedAt: now,
              lastSenderId: new ObjectId(senderId),
            },
          },
        );

        io.to(conversationId).emit("receive_message", message);

        if (recipient?.userId) {
          const { usersCollection } = getCollections();
          const recipientUser = await usersCollection.findOne(
            { _id: new ObjectId(recipient.userId) },
            { projection: { uid: 1 } }
          );

          if (recipientUser?.uid) {
            await notificationService.createNotification({
              recipientUid: recipientUser.uid,
              type: "chat_message",
              title: `New message from ${senderName}`,
              message: lastMessagePreview || "You received a new message",
              actorName: senderName,
              meta: {
                conversationId,
                senderId,
                senderRole,
              },
            });
          }
        }
      } catch (error) {
        console.error("❌ Message error:", error);
        socket.emit("message_error", {
          error: "Failed to send message",
        });
      }
    });

    socket.on("typing_start", ({ conversationId, userId, userName }) => {
      socket.to(conversationId).emit("typing_started", {
        conversationId,
        userId,
        userName,
      });
    });

    socket.on("typing_stop", ({ conversationId, userId }) => {
      socket.to(conversationId).emit("typing_stopped", {
        conversationId,
        userId,
      });
    });

    socket.on("mark_as_read", async ({ conversationId, userId }) => {
      try {
        await messagesCollection.updateMany(
          {
            conversationId: new ObjectId(conversationId),
            senderId: { $ne: new ObjectId(userId) },
            read: false,
          },
          {
            $set: {
              read: true,
              readAt: new Date(),
              delivered: true,
              deliveredAt: new Date(),
            },
          },
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
      const uid = socket.data.uid;

      if (uid && onlineUsers.has(uid)) {
        const sockets = onlineUsers.get(uid);
        sockets.delete(socket.id);

        if (sockets.size === 0) {
          onlineUsers.delete(uid);
          broadcastUserStatus(io, uid, false);
        }
      }

    });
  });
};

export default registerChatSocket;
