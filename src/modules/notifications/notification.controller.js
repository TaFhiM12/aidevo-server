import asyncHandler from "../../utils/asyncHandler.js";
import sendResponse from "../../utils/sendResponse.js";
import notificationService from "./notification.service.js";

const getMyNotifications = asyncHandler(async (req, res) => {
  const { uid } = req.params;
  const { page = 1, limit = 20 } = req.query;

  const data = await notificationService.getMyNotifications(uid, page, limit);

  return sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Notifications fetched successfully",
    data,
  });
});

const markAsRead = asyncHandler(async (req, res) => {
  const { notificationId } = req.params;
  const uid = req.auth?.uid;

  await notificationService.markAsRead(notificationId, uid);

  return sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Notification marked as read",
    data: null,
  });
});

const markAllAsRead = asyncHandler(async (req, res) => {
  const { uid } = req.params;

  await notificationService.markAllAsRead(uid);

  return sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "All notifications marked as read",
    data: null,
  });
});

const notificationController = {
  getMyNotifications,
  markAsRead,
  markAllAsRead,
};

export default notificationController;
