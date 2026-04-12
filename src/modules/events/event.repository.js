import { getCollections } from "../../config/collections.js";
import { toObjectId } from "../../utils/objectId.js";

const createOne = async (payload) => {
  const { eventsCollection } = getCollections();
  
  if (!eventsCollection) {
    throw new Error("Database collection not initialized");
  }
  
  try {
    const result = await eventsCollection.insertOne(payload);
    console.log("Database insert result:", result);
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

const eventRepository = {
  createOne,
  findAll,
  findById,
  deleteById,
};

export default eventRepository;