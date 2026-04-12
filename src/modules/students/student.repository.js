import { getCollections } from "../../config/collections.js";
import { toObjectId } from "../../utils/objectId.js";

const findAllActive = async () => {
  const { usersCollection } = getCollections();

  return usersCollection
    .find({
      role: "student",
      "student.status": "active",
    })
    .project({
      name: 1,
      email: 1,
      photoURL: 1,
      uid: 1,
      "student.studentId": 1,
      "student.department": 1,
      "student.session": 1,
    })
    .toArray();
};

const findById = async (studentId) => {
  const { usersCollection } = getCollections();

  return usersCollection.findOne({
    _id: toObjectId(studentId, "student ID"),
    role: "student",
  });
};

const updateById = async (studentId, updateData) => {
  const { usersCollection } = getCollections();

  return usersCollection.updateOne(
    {
      _id: toObjectId(studentId, "student ID"),
      role: "student",
    },
    {
      $set: updateData,
    }
  );
};

const findOrganizationsByStudentId = async (studentId, search) => {
  const { membersCollection } = getCollections();

  const query = {
    studentId,
    status: "active",
  };

  if (search) {
    query.$or = [
      { organizationName: { $regex: search, $options: "i" } },
      { organizationEmail: { $regex: search, $options: "i" } },
      { "organizationInfo.type": { $regex: search, $options: "i" } },
    ];
  }

  return membersCollection.find(query).sort({ joinedAt: -1 }).toArray();
};

const studentRepository = {
  findAllActive,
  findById,
  updateById,
  findOrganizationsByStudentId,
};

export default studentRepository;