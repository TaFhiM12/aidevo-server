import { ObjectId } from "mongodb";
import { getCollections } from "../../config/collections.js";
import { toObjectId } from "../../utils/objectId.js";

const findOneById = async (applicationId) => {
  const { applicationsCollection } = getCollections();

  return applicationsCollection.findOne({
    _id: toObjectId(applicationId, "application ID"),
  });
};

const findExistingActiveApplication = async (studentId, organizationId) => {
  const { applicationsCollection } = getCollections();

  return applicationsCollection.findOne({
    studentId,
    organizationId,
    status: { $in: ["pending", "approved"] },
  });
};

const createOne = async (payload) => {
  const { applicationsCollection } = getCollections();
  return applicationsCollection.insertOne(payload);
};

const updateStatusById = async (applicationId, updateData) => {
  const { applicationsCollection } = getCollections();

  return applicationsCollection.updateOne(
    { _id: toObjectId(applicationId, "application ID") },
    { $set: updateData }
  );
};

const deleteOneById = async (applicationId) => {
  const { applicationsCollection } = getCollections();

  return applicationsCollection.deleteOne({
    _id: toObjectId(applicationId, "application ID"),
  });
};

const findByOrganizationId = async (organizationId, status) => {
  const { applicationsCollection } = getCollections();

  const query = { organizationId };

  if (status && status !== "all") {
    query.status = status;
  }

  return applicationsCollection.find(query).sort({ appliedAt: -1 }).toArray();
};

const findByStudentId = async (studentId) => {
  const { applicationsCollection } = getCollections();

  return applicationsCollection
    .find({ studentId })
    .sort({ appliedAt: -1 })
    .toArray();
};

const insertMemberIfNotExists = async (memberData) => {
  const { membersCollection } = getCollections();

  const existingMember = await membersCollection.findOne({
    studentId: memberData.studentId,
    organizationId: memberData.organizationId,
  });

  if (existingMember) {
    return { inserted: false, existingMember };
  }

  const result = await membersCollection.insertOne(memberData);
  return { inserted: true, result };
};

const incrementOrganizationMembershipCount = async (organizationId, value) => {
  const { usersCollection } = getCollections();

  return usersCollection.updateOne(
    { _id: new ObjectId(organizationId) },
    { $inc: { "organization.membershipCount": value } }
  );
};

const deleteMember = async (studentId, organizationId) => {
  const { membersCollection } = getCollections();

  return membersCollection.deleteOne({
    studentId,
    organizationId,
  });
};

const applicationRepository = {
  findOneById,
  findExistingActiveApplication,
  createOne,
  updateStatusById,
  deleteOneById,
  findByOrganizationId,
  findByStudentId,
  insertMemberIfNotExists,
  incrementOrganizationMembershipCount,
  deleteMember,
};

export default applicationRepository;