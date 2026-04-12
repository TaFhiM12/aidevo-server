import { getCollections } from "../../config/collections.js";
import { toObjectId } from "../../utils/objectId.js";

const findAllActive = async () => {
  const { usersCollection } = getCollections();

  return usersCollection
    .find({
      role: "organization",
      "organization.status": "active",
    })
    .project({
      name: 1,
      email: 1,
      photoURL: 1,
      uid: 1,
      "organization.name": 1,
      "organization.type": 1,
      "organization.campus": 1,
      "organization.tagline": 1,
      "organization.mission": 1,
      "organization.website": 1,
      "organization.phone": 1,
      "organization.membershipCount": 1,
      "organization.coverPhoto": 1,
      "organization.photoAlbum": 1,
    })
    .toArray();
};

const findById = async (organizationId) => {
  const { usersCollection } = getCollections();

  return usersCollection.findOne({
    _id: toObjectId(organizationId, "organization ID"),
    role: "organization",
  });
};

const findByEmail = async (email) => {
  const { usersCollection } = getCollections();

  return usersCollection.findOne({
    email,
    role: "organization",
  });
};

const updateById = async (organizationId, updateData) => {
  const { usersCollection } = getCollections();

  return usersCollection.updateOne(
    {
      _id: toObjectId(organizationId, "organization ID"),
      role: "organization",
    },
    {
      $set: updateData,
    }
  );
};

const findMembersByOrganizationId = async (organizationId, search) => {
  const { membersCollection } = getCollections();

  const query = {
    organizationId,
    status: "active",
  };

  if (search) {
    query.$or = [
      { studentName: { $regex: search, $options: "i" } },
      { studentEmail: { $regex: search, $options: "i" } },
      { "studentInfo.studentId": { $regex: search, $options: "i" } },
      { "studentInfo.department": { $regex: search, $options: "i" } },
    ];
  }

  return membersCollection.find(query).sort({ joinedAt: -1 }).toArray();
};

const findEventsByOrganizationEmail = async (email) => {
  const { eventsCollection } = getCollections();

  return eventsCollection
    .find({ organizationEmail: email })
    .sort({ createdAt: -1 })
    .toArray();
};

const findPhotoAlbumById = async (organizationId) => {
  const { usersCollection } = getCollections();

  return usersCollection.findOne(
    {
      _id: toObjectId(organizationId, "organization ID"),
      role: "organization",
    },
    {
      projection: {
        "organization.photoAlbum": 1,
      },
    }
  );
};

const organizationRepository = {
  findAllActive,
  findById,
  findByEmail,
  updateById,
  findMembersByOrganizationId,
  findEventsByOrganizationEmail,
  findPhotoAlbumById,
};

export default organizationRepository;