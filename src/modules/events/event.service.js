import ApiError from "../../utils/ApiError.js";
import eventRepository from "./event.repository.js";

// const REQUIRED_SPECIAL_FIELDS = {
//   Association: ["eventType"],
//   Club: ["eventFormat"],
//   "Social Service": ["serviceType"],
// };

// const createEvent = async (payload) => {
//   if (!payload.title || !payload.shortDesc || !payload.location) {
//     throw new ApiError(400, "Missing required common event fields");
//   }

//   if (!payload.organization || !payload.organizationEmail) {
//     throw new ApiError(400, "Organization information is required");
//   }

//   const requiredDynamicFields =
//     REQUIRED_SPECIAL_FIELDS[payload.organizationType] || [];

//   for (const field of requiredDynamicFields) {
//     if (!payload.specialRequirements?.[field]) {
//       throw new ApiError(
//         400,
//         `Missing required special field: ${field}`
//       );
//     }
//   }

//   const event = {
//     ...payload,
//     createdAt: new Date(),
//     updatedAt: new Date(),
//     status: "active",
//   };

//   const result = await eventRepository.createOne(event);

//   return {
//     eventId: result.insertedId,
//   };
// };

const REQUIRED_SPECIAL_FIELDS = {
  Association: ["eventType"],
  Club: ["eventFormat"],
  "Social Service": ["serviceType"],
  "Computer Science and Engineering": ["eventType"],
  "Electrical and Electronic Engineering": ["eventType"],
  "Robotics Club": ["competitionType"],
  "Programming Club": ["contestType"],
  "Blood Bank": ["bloodDriveType"],
  "Unnotomomoshir": ["serviceType"],
  "Sylhet Association": ["eventType"],
  "Dhaka Association": ["eventType"],
  "Sports Club": ["sportType"],
  "Cultural Club": ["programType"],
};

const createEvent = async (payload) => {
  // Validate required common fields
  const requiredFields = ["title", "shortDesc", "location", "startAt", "endAt", "organization", "organizationEmail"];
  
  for (const field of requiredFields) {
    if (!payload[field]) {
      throw new ApiError(400, `Missing required field: ${field}`);
    }
  }

  // Validate dates
  if (new Date(payload.endAt) <= new Date(payload.startAt)) {
    throw new ApiError(400, "End time must be after start time");
  }

  // Validate organization type
  if (!payload.organizationType) {
    throw new ApiError(400, "Organization type is required");
  }

  // Validate special requirements based on organization type
  const requiredDynamicFields = REQUIRED_SPECIAL_FIELDS[payload.organizationType] || [];
  
  for (const field of requiredDynamicFields) {
    if (!payload.specialRequirements?.[field]) {
      throw new ApiError(400, `Missing required special field: ${field} for ${payload.organizationType}`);
    }
  }

  // Prepare event document
  const event = {
    ...payload,
    createdAt: new Date(),
    updatedAt: new Date(),
    status: "active",
    maxCapacity: payload.maxCapacity ? parseInt(payload.maxCapacity) : null,
    fee: payload.fee || "0",
    registrationRequired: payload.registrationRequired !== false,
  };

  // Remove undefined values
  Object.keys(event).forEach(key => {
    if (event[key] === undefined) {
      delete event[key];
    }
  });

  console.log("Saving event to database:", event);

  const result = await eventRepository.createOne(event);

  if (!result.insertedId) {
    throw new ApiError(500, "Failed to save event to database");
  }

  return {
    eventId: result.insertedId,
    message: "Event created successfully",
  };
};

const getAllEvents = async () => {
  return eventRepository.findAll();
};

const getEventById = async (eventId) => {
  const event = await eventRepository.findById(eventId);

  if (!event) {
    throw new ApiError(404, "Event not found");
  }

  return event;
};

const deleteEvent = async (eventId) => {
  const event = await eventRepository.findById(eventId);

  if (!event) {
    throw new ApiError(404, "Event not found");
  }

  await eventRepository.deleteById(eventId);

  return null;
};

const getRelatedEvents = async (eventId) => {
  const event = await eventRepository.findById(eventId);

  if (!event) {
    throw new ApiError(404, "Event not found");
  }

  const events = await eventRepository.findAll();

  return events
    .filter(
      (e) => e._id.toString() !== eventId && e.category === event.category
    )
    .slice(0, 4);
};

const eventService = {
  createEvent,
  getAllEvents,
  getEventById,
  getRelatedEvents,
  deleteEvent,
};

export default eventService;