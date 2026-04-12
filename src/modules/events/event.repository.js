import { getCollections } from "../../config/collections.js";
import { toObjectId } from "../../utils/objectId.js";

const createOne = async (payload) => {
  const { eventsCollection } = getCollections();
  
  if (!eventsCollection) {
    throw new Error("Database collection not initialized");
  }
  
  try {
    const result = await eventsCollection.insertOne(payload);
    return result;
  } catch (error) {
    console.error("Database insert error:", error);
    throw new Error(`Failed to insert event: ${error.message}`);
  }
};

const findAll = async () => {
  const { eventsCollection } = getCollections();

  return eventsCollection.find().sort({ createdAt: -1 }).toArray();
};

const findById = async (eventId) => {
  const { eventsCollection } = getCollections();

  return eventsCollection.findOne({
    _id: toObjectId(eventId, "event ID"),
  });
};

const deleteById = async (eventId) => {
  const { eventsCollection } = getCollections();

  return eventsCollection.deleteOne({
    _id: toObjectId(eventId, "event ID"),
  });
};

const updateStatusById = async (eventId, status) => {
  const { eventsCollection } = getCollections();

  return eventsCollection.updateOne(
    { _id: toObjectId(eventId, "event ID") },
    {
      $set: {
        status,
        updatedAt: new Date(),
      },
    }
  );
};

const findActiveParticipation = async (eventId, studentId) => {
  const { eventParticipantsCollection } = getCollections();

  return eventParticipantsCollection.findOne({
    eventId: toObjectId(eventId, "event ID"),
    studentId,
    status: "active",
  });
};

const createParticipation = async (payload) => {
  const { eventParticipantsCollection } = getCollections();
  return eventParticipantsCollection.insertOne(payload);
};

const countActiveParticipantsByEventId = async (eventId) => {
  const { eventParticipantsCollection } = getCollections();

  return eventParticipantsCollection.countDocuments({
    eventId: toObjectId(eventId, "event ID"),
    status: "active",
  });
};

const findActiveParticipantsByEventId = async (eventId) => {
  const { eventParticipantsCollection } = getCollections();

  return eventParticipantsCollection
    .find({
      eventId: toObjectId(eventId, "event ID"),
      status: "active",
    })
    .sort({ joinedAt: -1 })
    .toArray();
};

const findActiveParticipationById = async (participantId) => {
  const { eventParticipantsCollection } = getCollections();

  return eventParticipantsCollection.findOne({
    _id: toObjectId(participantId, "participant ID"),
    status: "active",
  });
};

const removeParticipationById = async (participantId, removedBy) => {
  const { eventParticipantsCollection } = getCollections();

  return eventParticipantsCollection.updateOne(
    {
      _id: toObjectId(participantId, "participant ID"),
      status: "active",
    },
    {
      $set: {
        status: "removed",
        removedAt: new Date(),
        removedBy,
        updatedAt: new Date(),
      },
    }
  );
};

const findActiveParticipationsByStudentUid = async (studentUid) => {
  const { eventParticipantsCollection } = getCollections();

  return eventParticipantsCollection
    .find({
      studentUid,
      status: "active",
    })
    .sort({ joinedAt: -1 })
    .toArray();
};

const eventRepository = {
  createOne,
  findAll,
  findById,
  deleteById,
  updateStatusById,
  findActiveParticipation,
  createParticipation,
  countActiveParticipantsByEventId,
  findActiveParticipantsByEventId,
  findActiveParticipationById,
  removeParticipationById,
  findActiveParticipationsByStudentUid,
};

export default eventRepository;