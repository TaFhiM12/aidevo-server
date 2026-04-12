import ApiError from "../../utils/ApiError.js";
import notificationRepository from "./notification.repository.js";
import { getIO } from "../../sockets/index.js";

const createNotification = async ({
  recipientUid,
  type,
  title,
  message,
  actorUid = "",
  actorName = "",
  meta = {},
}) => {
  if (!recipientUid) {
    throw new ApiError(400, "recipientUid is required");
  }

  const payload = {
    recipientUid,
    type,
    title,
    message,
    actorUid,
    actorName,
    meta,
    read: false,
    createdAt: new Date(),
  };

  const result = await notificationRepository.createOne(payload);
  const notification = {
    ...payload,
    _id: result.insertedId,
  };

  const io = getIO();
  if (io) {
    io.to(`user:${recipientUid}`).emit("receive_notification", notification);
  }

  return notification;
};

const getMyNotifications = async (recipientUid, page, limit) => {
  const [notifications, unreadCount] = await Promise.all([
    notificationRepository.findByRecipientUid(recipientUid, page, limit),
    notificationRepository.countUnreadByRecipientUid(recipientUid),
  ]);

  return {
    notifications,
    unreadCount,
  };
};

const markAsRead = async (notificationId, recipientUid) => {
  const result = await notificationRepository.markAsReadById(notificationId, recipientUid);

  if (!result.matchedCount) {
    throw new ApiError(404, "Notification not found");
  }

  return null;
};

const markAllAsRead = async (recipientUid) => {
  await notificationRepository.markAllAsReadByRecipientUid(recipientUid);
  return null;
};

const notificationService = {
  createNotification,
  getMyNotifications,
  markAsRead,
  markAllAsRead,
};

export default notificationService;
