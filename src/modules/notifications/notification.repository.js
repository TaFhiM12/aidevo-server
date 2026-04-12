import { ObjectId } from "mongodb";
import { getCollections } from "../../config/collections.js";
import { toObjectId } from "../../utils/objectId.js";

const createOne = async (payload) => {
  const { notificationsCollection } = getCollections();
  return notificationsCollection.insertOne(payload);
};

const findByRecipientUid = async (recipientUid, page = 1, limit = 20) => {
  const { notificationsCollection } = getCollections();

  const numericPage = Number(page) || 1;
  const numericLimit = Number(limit) || 20;

  return notificationsCollection
    .find({ recipientUid })
    .sort({ createdAt: -1 })
    .skip((numericPage - 1) * numericLimit)
    .limit(numericLimit)
    .toArray();
};

const countUnreadByRecipientUid = async (recipientUid) => {
  const { notificationsCollection } = getCollections();
  return notificationsCollection.countDocuments({ recipientUid, read: false });
};

const markAsReadById = async (notificationId, recipientUid) => {
  const { notificationsCollection } = getCollections();

  return notificationsCollection.updateOne(
    {
      _id: toObjectId(notificationId, "notification ID"),
      recipientUid,
    },
    {
      $set: {
        read: true,
        readAt: new Date(),
      },
    }
  );
};

const markAllAsReadByRecipientUid = async (recipientUid) => {
  const { notificationsCollection } = getCollections();

  return notificationsCollection.updateMany(
    {
      recipientUid,
      read: false,
    },
    {
      $set: {
        read: true,
        readAt: new Date(),
      },
    }
  );
};

const deleteByUserUid = async (recipientUid) => {
  const { notificationsCollection } = getCollections();
  return notificationsCollection.deleteMany({ recipientUid });
};

const notificationRepository = {
  createOne,
  findByRecipientUid,
  countUnreadByRecipientUid,
  markAsReadById,
  markAllAsReadByRecipientUid,
  deleteByUserUid,
};

export default notificationRepository;
