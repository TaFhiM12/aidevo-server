import { getCollections } from "../../config/collections.js";

const createOne = async (payload) => {
  const { paymentsCollection } = getCollections();
  return paymentsCollection.insertOne(payload);
};

const findByStudentUid = async (studentUid) => {
  const { paymentsCollection } = getCollections();
  return paymentsCollection
    .find({ studentUid })
    .sort({ paidAt: -1 })
    .toArray();
};

const findByOrganizationEmail = async (organizationEmail) => {
  const { paymentsCollection } = getCollections();
  return paymentsCollection
    .find({ organizationEmail })
    .sort({ paidAt: -1 })
    .toArray();
};

const paymentRepository = {
  createOne,
  findByStudentUid,
  findByOrganizationEmail,
};

export default paymentRepository;
