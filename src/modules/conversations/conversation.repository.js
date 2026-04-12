import { ObjectId } from "mongodb";
import { getCollections } from "../../config/collections.js";
import { toObjectId } from "../../utils/objectId.js";

const findUserById = async (userId) => {
  const { usersCollection } = getCollections();

  return usersCollection.findOne({
    _id: toObjectId(userId, "user ID"),
  });
};

const findUserByUid = async (uid) => {
  const { usersCollection } = getCollections();

  return usersCollection.findOne({ uid });
};

const findConversationByParticipants = async (participantAId, participantBId) => {
  const { conversationsCollection } = getCollections();

  return conversationsCollection.findOne({
    participantIds: {
      $all: [
        new ObjectId(participantAId),
        new ObjectId(participantBId),
      ],
    },
  });
};

const createConversation = async (payload) => {
  const { conversationsCollection } = getCollections();
  return conversationsCollection.insertOne(payload);
};

const findConversationsByUserObjectId = async (userObjectId) => {
  const { conversationsCollection } = getCollections();

  return conversationsCollection
    .find({
      participantIds: userObjectId,
    })
    .sort({ lastMessageTime: -1 })
    .toArray();
};

const countUnreadMessages = async (conversationId, userObjectId) => {
  const { messagesCollection } = getCollections();

  return messagesCollection.countDocuments({
    conversationId,
    senderId: { $ne: userObjectId },
    read: false,
  });
};

const findMessagesByConversationId = async (
  conversationId,
  page = 1,
  limit = 50
) => {
  const { messagesCollection } = getCollections();

  const numericPage = Number(page) || 1;
  const numericLimit = Number(limit) || 50;

  return messagesCollection
    .find({
      conversationId: toObjectId(conversationId, "conversation ID"),
    })
    .sort({ timestamp: -1 })
    .skip((numericPage - 1) * numericLimit)
    .limit(numericLimit)
    .toArray();
};

const conversationRepository = {
  findUserById,
  findUserByUid,
  findConversationByParticipants,
  createConversation,
  findConversationsByUserObjectId,
  countUnreadMessages,
  findMessagesByConversationId,
};

export default conversationRepository;