import { getCollections } from "../../config/collections.js";
import { toObjectId } from "../../utils/objectId.js";

const createDonor = async (payload) => {
  const { bloodDonorsCollection } = getCollections();
  return bloodDonorsCollection.insertOne(payload);
};

const getRecentDonors = async (limit = 20, status = "approved") => {
  const { bloodDonorsCollection } = getCollections();

  return bloodDonorsCollection
    .find({
      isActive: true,
      status,
    })
    .sort({ createdAt: -1 })
    .limit(limit)
    .toArray();
};

const updateDonorStatusById = async (donorId, status, moderatedBy = {}) => {
  const { bloodDonorsCollection } = getCollections();

  return bloodDonorsCollection.updateOne(
    { _id: toObjectId(donorId, "donor ID") },
    {
      $set: {
        status,
        updatedAt: new Date(),
        moderatedBy,
      },
    }
  );
};

const createUrgentRequest = async (payload) => {
  const { bloodRequestsCollection } = getCollections();
  return bloodRequestsCollection.insertOne(payload);
};

const getRecentUrgentRequests = async (limit = 20, statuses = ["active"]) => {
  const { bloodRequestsCollection } = getCollections();

  return bloodRequestsCollection
    .find({ status: { $in: statuses } })
    .sort({ createdAt: -1 })
    .limit(limit)
    .toArray();
};

const updateUrgentRequestStatusById = async (requestId, status, moderatedBy = {}) => {
  const { bloodRequestsCollection } = getCollections();

  return bloodRequestsCollection.updateOne(
    { _id: toObjectId(requestId, "request ID") },
    {
      $set: {
        status,
        updatedAt: new Date(),
        moderatedBy,
      },
    }
  );
};

const bloodBankRepository = {
  createDonor,
  getRecentDonors,
  updateDonorStatusById,
  createUrgentRequest,
  getRecentUrgentRequests,
  updateUrgentRequestStatusById,
};

export default bloodBankRepository;
