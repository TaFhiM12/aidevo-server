import { getCollections } from "../../config/collections.js";
import { toObjectId } from "../../utils/objectId.js";

const findByUid = async (uid) => {
  const { usersCollection } = getCollections();
  return usersCollection.findOne({ uid });
};

const findById = async (userId) => {
  const { usersCollection } = getCollections();
  return usersCollection.findOne({ _id: toObjectId(userId, "user ID") });
};

const findByEmail = async (email) => {
  const { usersCollection } = getCollections();
  return usersCollection.findOne({ email });
};

const updateUidById = async (userId, uid) => {
  const { usersCollection } = getCollections();
  return usersCollection.updateOne(
    { _id: toObjectId(userId, "user ID") },
    { $set: { uid } }
  );
};

const updateById = async (userId, updatePayload) => {
  const { usersCollection } = getCollections();
  return usersCollection.updateOne(
    { _id: toObjectId(userId, "user ID") },
    { $set: updatePayload }
  );
};

const findAll = async () => {
  const { usersCollection } = getCollections();
  return usersCollection.find().toArray();
};

const createOne = async (payload) => {
  const { usersCollection } = getCollections();
  return usersCollection.insertOne(payload);
};

const userRepository = {
  findByUid,
  findById,
  findByEmail,
  updateUidById,
  updateById,
  findAll,
  createOne,
};

export default userRepository;