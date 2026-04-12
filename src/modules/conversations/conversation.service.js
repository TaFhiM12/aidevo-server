import { ObjectId } from "mongodb";
import ApiError from "../../utils/ApiError.js";
import conversationRepository from "./conversation.repository.js";
import notificationService from "../notifications/notification.service.js";

const buildParticipant = (user) => {
  const role = user.role;

  if (role === "student") {
    return {
      userId: user._id,
      uid: user.uid || "",
      role: "student",
      name: user.name,
      photo: user.photoURL || "",
      meta: {
        studentId: user.student?.studentId || "",
        department: user.student?.department || "",
        session: user.student?.session || "",
      },
    };
  }

  if (role === "organization") {
    return {
      userId: user._id,
      uid: user.uid || "",
      role: "organization",
      name: user.organization?.name || user.name,
      photo: user.photoURL || "",
      meta: {
        type: user.organization?.type || "",
        campus: user.organization?.campus || "",
        email: user.email || "",
      },
    };
  }

  return {
    userId: user._id,
    uid: user.uid || "",
    role: role || "user",
    name: user.name || "Unknown",
    photo: user.photoURL || "",
    meta: {},
  };
};

const createOrGetConversation = async (participantAId, participantBId) => {
  if (!participantAId || !participantBId) {
    throw new ApiError(400, "Both participant IDs are required");
  }

  if (participantAId === participantBId) {
    throw new ApiError(400, "Cannot create conversation with the same user");
  }

  const participantA = await conversationRepository.findUserById(participantAId);
  const participantB = await conversationRepository.findUserById(participantBId);

  if (!participantA || !participantB) {
    throw new ApiError(404, "One or both participants not found");
  }

  let conversation = await conversationRepository.findConversationByParticipants(
    participantAId,
    participantBId
  );

  if (!conversation) {
    const participantAData = buildParticipant(participantA);
    const participantBData = buildParticipant(participantB);

    const newConversation = {
      participantIds: [
        new ObjectId(participantAId),
        new ObjectId(participantBId),
      ],
      participants: [participantAData, participantBData],
      lastMessage: "",
      lastMessageTime: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await conversationRepository.createConversation(newConversation);

    conversation = {
      ...newConversation,
      _id: result.insertedId,
    };

    if (participantA.uid && participantB.uid) {
      await notificationService.createNotification({
        recipientUid: participantB.uid,
        type: "conversation_started",
        title: "New conversation started",
        message: `${participantAData.name} started a conversation with you.`,
        actorUid: participantA.uid,
        actorName: participantAData.name,
        meta: {
          conversationId: result.insertedId,
        },
      });
    }
  }

  return conversation;
};

const getUserConversations = async (userUid) => {
  const user = await conversationRepository.findUserByUid(userUid);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const conversations =
    await conversationRepository.findConversationsByUserObjectId(user._id);

  const conversationsWithUnread = await Promise.all(
    conversations.map(async (conversation) => {
      const unreadCount = await conversationRepository.countUnreadMessages(
        conversation._id,
        user._id
      );

      return {
        ...conversation,
        unreadCount,
      };
    })
  );

  return conversationsWithUnread;
};

const getConversationMessages = async (conversationId, page, limit) => {
  const messages = await conversationRepository.findMessagesByConversationId(
    conversationId,
    page,
    limit
  );

  return messages.reverse();
};

const conversationService = {
  createOrGetConversation,
  getUserConversations,
  getConversationMessages,
};

export default conversationService;