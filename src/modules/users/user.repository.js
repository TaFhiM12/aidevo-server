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
  findAll,
  createOne,
};

export default userRepository;