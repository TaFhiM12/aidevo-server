import asyncHandler from "../../utils/asyncHandler.js";
import sendResponse from "../../utils/sendResponse.js";
import conversationService from "./conversation.service.js";

const createOrGetConversation = asyncHandler(async (req, res) => {
  const { participantAId, participantBId } = req.body;

  const conversation = await conversationService.createOrGetConversation(
    participantAId,
    participantBId
  );

  return sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Conversation fetched successfully",
    data: conversation,
  });
});

const getUserConversations = asyncHandler(async (req, res) => {
  const conversations = await conversationService.getUserConversations(
    req.params.userUid
  );

  return sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Conversations fetched successfully",
    data: conversations,
  });
});

const getConversationMessages = asyncHandler(async (req, res) => {
  const { conversationId } = req.params;
  const { page = 1, limit = 50 } = req.query;

  const messages = await conversationService.getConversationMessages(
    conversationId,
    page,
    limit
  );

  return sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Messages fetched successfully",
    data: messages,
  });
});

const conversationController = {
  createOrGetConversation,
  getUserConversations,
  getConversationMessages,
};

export default conversationController;