import asyncHandler from "../../utils/asyncHandler.js";
import sendResponse from "../../utils/sendResponse.js";
import ApiError from "../../utils/ApiError.js";
import { isValidObjectId, toObjectId } from "../../utils/objectId.js";
import { getCollections } from "../../config/collections.js";
import eventService from "./event.service.js";
import recommendationService from "./event.recommendations.js";

const DEFAULT_RECOMMENDATION_LIMIT = 6;
const MAX_RECOMMENDATION_LIMIT = 20;

const parseRecommendationLimit = (value) => {
  if (value === undefined) {
    return DEFAULT_RECOMMENDATION_LIMIT;
  }

  const parsedLimit = Number.parseInt(value, 10);

  if (Number.isNaN(parsedLimit)) {
    throw new ApiError(400, "Limit must be a valid number");
  }

  if (parsedLimit < 1) {
    throw new ApiError(400, "Limit must be at least 1");
  }

  return Math.min(parsedLimit, MAX_RECOMMENDATION_LIMIT);
};

const getRequesterUid = (req) => {
  if (req.auth?.uid) {
    return req.auth.uid;
  }

  const headerUid = req.headers["x-user-uid"];
  const queryUid = req.query.requesterUid;

  if (typeof headerUid === "string" && headerUid.trim()) {
    return headerUid.trim();
  }

  if (typeof queryUid === "string" && queryUid.trim()) {
    return queryUid.trim();
  }

  return null;
};

const resolveStudentTarget = async (studentIdentifier) => {
  const { usersCollection } = getCollections();

  const queries = [{ uid: studentIdentifier }];

  if (isValidObjectId(studentIdentifier)) {
    queries.push({ _id: toObjectId(studentIdentifier, "student ID") });
  }

  for (const query of queries) {
    const student = await usersCollection.findOne(query, {
      projection: { _id: 1, uid: 1, role: 1 },
    });

    if (student) {
      return student;
    }
  }

  return null;
};

const verifyStudentRecommendationAccess = async (studentId, req) => {
  const requesterUid = getRequesterUid(req);
  const requesterQueries = [];

  if (requesterUid) {
    requesterQueries.push({ uid: requesterUid });
  }

  if (typeof req.auth?.userId === "string" && isValidObjectId(req.auth.userId)) {
    requesterQueries.push({ _id: toObjectId(req.auth.userId, "requester user ID") });
  }

  if (typeof req.auth?.email === "string" && req.auth.email.trim()) {
    requesterQueries.push({ email: req.auth.email.trim() });
  }

  if (!requesterQueries.length) {
    throw new ApiError(401, "Unauthorized request: missing requester identity");
  }

  const { usersCollection } = getCollections();
  const requester = await usersCollection.findOne(
    { $or: requesterQueries },
    { projection: { _id: 1, uid: 1, role: 1 } }
  );

  if (!requester) {
    throw new ApiError(401, "Unauthorized request: requester not found");
  }

  if (requester.role !== "student") {
    throw new ApiError(403, "Only student accounts can access student recommendations");
  }

  const targetStudent = await resolveStudentTarget(studentId);

  if (!targetStudent) {
    throw new ApiError(404, "Student not found");
  }

  const requesterMatchesTarget =
    requester._id.toString() === targetStudent._id.toString() ||
    requester.uid === targetStudent.uid;

  if (!requesterMatchesTarget) {
    throw new ApiError(403, "Forbidden: cannot access another student's recommendations");
  }
};

// const createEvent = asyncHandler(async (req, res) => {
//   const result = await eventService.createEvent(req.body);

//   return sendResponse(res, {
//     statusCode: 201,
//     success: true,
//     message: "Event created successfully",
//     data: result,
//   });
// });

const createEvent = asyncHandler(async (req, res) => {
  try {
    const result = await eventService.createEvent(req.body);

    return sendResponse(res, {
      statusCode: 201,
      success: true,
      message: "Event created successfully",
      data: result,
    });
  } catch (error) {
    console.error("Event creation error:", error);
    return sendResponse(res, {
      statusCode: error.statusCode || 500,
      success: false,
      message: error.message || "Failed to create event",
      data: null,
    });
  }
});

const getAllEvents = asyncHandler(async (req, res) => {
  const events = await eventService.getAllEvents();

  return sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Events fetched successfully",
    data: events,
  });
});

const getEventById = asyncHandler(async (req, res) => {
  const event = await eventService.getEventById(req.params.id);

  return sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Event fetched successfully",
    data: event,
  });
});

const deleteEvent = asyncHandler(async (req, res) => {
  await eventService.deleteEvent(req.params.eventId);

  return sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Event deleted successfully",
  });
});

const updateEventStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;

  const result = await eventService.updateEventStatus(
    req.params.eventId,
    status,
    req.auth
  );

  return sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Event status updated successfully",
    data: result,
  });
});

const getRelatedEvents = asyncHandler(async (req, res) => {
  const events = await eventService.getRelatedEvents(req.params.id);

  return sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Related events fetched successfully",
    data: events,
  });
});

const getEventRecommendations = asyncHandler(async (req, res) => {
  const { studentId } = req.params;
  const targetStudent = await resolveStudentTarget(studentId);

  if (!targetStudent) {
    throw new ApiError(404, "Student not found");
  }

  const limit = parseRecommendationLimit(req.query.limit);

  await verifyStudentRecommendationAccess(targetStudent.uid, req);

  const events = await recommendationService.getRecommendedEvents(targetStudent.uid, limit);

  return sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Recommended events fetched successfully",
    data: events,
  });
});

const getTrendingEvents = asyncHandler(async (req, res) => {
  const limit = parseRecommendationLimit(req.query.limit);
  const studentInterests = req.query.interests || "";

  const events = await recommendationService.getTrendingEvents(studentInterests, limit);

  return sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Trending events fetched successfully",
    data: events,
  });
});

const attendEvent = asyncHandler(async (req, res) => {
  const result = await eventService.attendEvent(req.params.eventId, req.auth);

  return sendResponse(res, {
    statusCode: 200,
    success: true,
    message: result.alreadyJoined
      ? "You are already attending this event"
      : "Attendance confirmed successfully",
    data: result,
  });
});

const getAttendanceStatus = asyncHandler(async (req, res) => {
  const result = await eventService.getAttendanceStatus(req.params.eventId, req.auth);

  return sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Attendance status fetched successfully",
    data: result,
  });
});

const getEventParticipants = asyncHandler(async (req, res) => {
  const result = await eventService.getEventParticipants(req.params.eventId, req.auth);

  return sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Event participants fetched successfully",
    data: result,
  });
});

const removeEventParticipant = asyncHandler(async (req, res) => {
  const result = await eventService.removeEventParticipant(
    req.params.eventId,
    req.params.participantId,
    req.auth
  );

  return sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Participant removed successfully",
    data: result,
  });
});

const getStudentParticipations = asyncHandler(async (req, res) => {
  const data = await eventService.getStudentParticipations(req.params.studentUid, req.auth);

  return sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Student event participations fetched successfully",
    data,
  });
});

const eventController = {
  createEvent,
  getAllEvents,
  getEventById,
  deleteEvent,
  getRelatedEvents,
  updateEventStatus,
  getEventRecommendations,
  getTrendingEvents,
  attendEvent,
  getAttendanceStatus,
  getEventParticipants,
  removeEventParticipant,
  getStudentParticipations,
};

export default eventController;