import ApiError from "../../utils/ApiError.js";
import eventRepository from "./event.repository.js";
import userRepository from "../users/user.repository.js";
import notificationService from "../notifications/notification.service.js";
import { getCollections } from "../../config/collections.js";
import newsletterService from "../newsletter/newsletter.service.js";
import newsletterMailer from "../../utils/email/newsletterMailer.js";

const notifySubscribersAboutPublishedEvent = async (event) => {
  const subscriberEmails = await newsletterService.getActiveSubscriberEmails();

  if (!subscriberEmails.length) {
    return;
  }

  const sendResults = await Promise.allSettled(
    subscriberEmails.map((recipientEmail) =>
      newsletterMailer.sendEventPublishedEmail({ recipientEmail, event })
    )
  );

  const deliveredCount = sendResults.filter(
    (result) => result.status === "fulfilled" && result.value?.sent
  ).length;

  const failedCount = sendResults.length - deliveredCount;

  console.log(
    `[newsletter] publish notice completed. delivered=${deliveredCount} failed=${failedCount}`
  );
};

const schedulePublishedEventNotification = (event) => {
  Promise.resolve()
    .then(() => notifySubscribersAboutPublishedEvent(event))
    .catch((error) => {
      console.error("[newsletter] failed to notify subscribers:", error);
    });
};

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

  const pricingType = payload.pricingType === "paid" ? "paid" : "free";
  const feeValue = Number.parseFloat(payload.fee || "0");

  if (pricingType === "paid") {
    if (Number.isNaN(feeValue) || feeValue <= 0) {
      throw new ApiError(400, "Paid events must include a valid fee greater than 0");
    }

    if (!payload.paymentDeadline) {
      throw new ApiError(400, "Payment deadline is required for paid events");
    }

    if (new Date(payload.paymentDeadline) > new Date(payload.startAt)) {
      throw new ApiError(400, "Payment deadline must be before event start");
    }
  }

  // Prepare event document
  const event = {
    ...payload,
    createdAt: new Date(),
    updatedAt: new Date(),
    status: "active",
    maxCapacity: payload.maxCapacity ? parseInt(payload.maxCapacity) : null,
    pricingType,
    fee: pricingType === "paid" ? String(feeValue) : "0",
    paymentDeadline: pricingType === "paid" ? payload.paymentDeadline : null,
    refundPolicy: pricingType === "paid" ? payload.refundPolicy || "No refunds after confirmation." : "",
    paymentInstructions: pricingType === "paid" ? payload.paymentInstructions || "" : "",
    scholarshipSeats:
      pricingType === "paid" && payload.scholarshipSeats
        ? parseInt(payload.scholarshipSeats)
        : 0,
    registrationRequired: payload.registrationRequired !== false,
  };

  // Remove undefined values
  Object.keys(event).forEach(key => {
    if (event[key] === undefined) {
      delete event[key];
    }
  });

  const result = await eventRepository.createOne(event);

  if (!result.insertedId) {
    throw new ApiError(500, "Failed to save event to database");
  }

  if (event.status === "active") {
    schedulePublishedEventNotification({ ...event, _id: result.insertedId });
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

const VALID_EVENT_STATUSES = ["active", "cancelled", "completed", "draft"];

const isAdminRole = (role) => role === "super-admin" || role === "superAdmin";

const resolveRequester = async (requesterAuth) => {
  const requester = await userRepository.findByUid(requesterAuth?.uid);

  if (!requester) {
    throw new ApiError(401, "Unauthorized requester");
  }

  return requester;
};

const assertOrgCanManageEvent = async (eventId, requesterAuth) => {
  const [event, requester] = await Promise.all([
    eventRepository.findById(eventId),
    resolveRequester(requesterAuth),
  ]);

  if (!event) {
    throw new ApiError(404, "Event not found");
  }

  const isOwnerOrg =
    requester.role === "organization" &&
    requester.email &&
    event.organizationEmail &&
    requester.email === event.organizationEmail;

  if (!isAdminRole(requester.role) && !isOwnerOrg) {
    throw new ApiError(403, "You are not allowed to manage this event");
  }

  return { event, requester };
};

const updateEventStatus = async (eventId, status, requesterAuth) => {
  if (!VALID_EVENT_STATUSES.includes(status)) {
    throw new ApiError(400, "Invalid event status");
  }

  const { event } = await assertOrgCanManageEvent(eventId, requesterAuth);

  await eventRepository.updateStatusById(eventId, status);

  if (event.status !== "active" && status === "active") {
    schedulePublishedEventNotification({ ...event, _id: eventId, status: "active" });
  }

  return {
    eventId,
    status,
  };
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

const attendEvent = async (eventId, requesterAuth) => {
  const [event, requester] = await Promise.all([
    eventRepository.findById(eventId),
    resolveRequester(requesterAuth),
  ]);

  if (!event) {
    throw new ApiError(404, "Event not found");
  }

  if (requester.role !== "student" && !isAdminRole(requester.role)) {
    throw new ApiError(403, "Only student accounts can attend events");
  }

  if (event.status && event.status !== "active") {
    throw new ApiError(400, "This event is not currently accepting attendance");
  }

  const now = Date.now();
  if (event.endAt && new Date(event.endAt).getTime() < now) {
    throw new ApiError(400, "This event has already ended");
  }

  if (event.registrationRequired && event.registrationDeadline) {
    if (new Date(event.registrationDeadline).getTime() < now) {
      throw new ApiError(400, "Registration deadline has passed");
    }
  }

  const studentId = requester._id.toString();
  const existing = await eventRepository.findActiveParticipation(eventId, studentId);
  if (existing) {
    return {
      participantId: existing._id,
      alreadyJoined: true,
      joinedAt: existing.joinedAt,
    };
  }

  const maxCapacity = Number(event.maxCapacity || 0);
  if (maxCapacity > 0) {
    const currentCount = await eventRepository.countActiveParticipantsByEventId(eventId);
    if (currentCount >= maxCapacity) {
      throw new ApiError(400, "Event capacity is full");
    }
  }

  const requiresPayment = Number(event.fee || 0) > 0;
  if (requiresPayment) {
    const { paymentsCollection } = getCollections();
    const payment = await paymentsCollection.findOne({
      studentUid: requester.uid,
      eventId: event._id.toString(),
      status: "succeeded",
    });

    if (!payment) {
      throw new ApiError(400, "Payment is required before attending this event");
    }
  }

  const participation = {
    eventId: event._id,
    eventTitle: event.title,
    eventStartAt: event.startAt,
    eventEndAt: event.endAt,
    eventLocation: event.location,
    eventFee: Number(event.fee || 0),
    eventCover: event.cover || "",
    organizationEmail: event.organizationEmail || "",
    organizationName: event.organization || "",
    studentId,
    studentUid: requester.uid,
    studentName: requester.name || "",
    studentEmail: requester.email || "",
    studentPhoto: requester.photoURL || "",
    studentDepartment: requester.student?.department || "",
    status: "active",
    joinedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const result = await eventRepository.createParticipation(participation);
  const orgUser = event.organizationEmail
    ? await userRepository.findByEmail(event.organizationEmail)
    : null;

  if (orgUser?.uid) {
    await notificationService.createNotification({
      recipientUid: orgUser.uid,
      type: "event_participation_added",
      title: "New Event Participant",
      message: `${requester.name || "A student"} joined ${event.title}.`,
      actorUid: requester.uid,
      actorName: requester.name || "Student",
      meta: {
        eventId: event._id.toString(),
        participantId: result.insertedId.toString(),
      },
    });
  }

  await notificationService.createNotification({
    recipientUid: requester.uid,
    type: "event_participation_confirmed",
    title: "Attendance Confirmed",
    message: `You are now attending ${event.title}.`,
    actorUid: orgUser?.uid || "",
    actorName: event.organization || "Organization",
    meta: {
      eventId: event._id.toString(),
      participantId: result.insertedId.toString(),
    },
  });

  return {
    participantId: result.insertedId,
    alreadyJoined: false,
    joinedAt: participation.joinedAt,
  };
};

const getAttendanceStatus = async (eventId, requesterAuth) => {
  const requester = await resolveRequester(requesterAuth);
  const event = await eventRepository.findById(eventId);

  if (!event) {
    throw new ApiError(404, "Event not found");
  }

  if (requester.role !== "student" && !isAdminRole(requester.role)) {
    return { isAttending: false, participantId: null, joinedAt: null };
  }

  const participation = await eventRepository.findActiveParticipation(
    eventId,
    requester._id.toString()
  );

  return {
    isAttending: Boolean(participation),
    participantId: participation?._id || null,
    joinedAt: participation?.joinedAt || null,
  };
};

const getEventParticipants = async (eventId, requesterAuth) => {
  const { event } = await assertOrgCanManageEvent(eventId, requesterAuth);
  const participants = await eventRepository.findActiveParticipantsByEventId(eventId);

  return {
    eventId: event._id,
    eventTitle: event.title,
    participants,
    totalParticipants: participants.length,
  };
};

const removeEventParticipant = async (eventId, participantId, requesterAuth) => {
  const { event, requester } = await assertOrgCanManageEvent(eventId, requesterAuth);

  const participation = await eventRepository.findActiveParticipationById(participantId);
  if (!participation || String(participation.eventId) !== String(event._id)) {
    throw new ApiError(404, "Participant record not found for this event");
  }

  await eventRepository.removeParticipationById(participantId, {
    uid: requester.uid || "",
    role: requester.role || "",
    name: requester.name || "",
  });

  if (participation.studentUid) {
    await notificationService.createNotification({
      recipientUid: participation.studentUid,
      type: "event_participation_removed",
      title: "Attendance Removed",
      message: `Your attendance was removed from ${event.title}.`,
      actorUid: requester.uid || "",
      actorName: requester.name || event.organization || "Organization",
      meta: {
        eventId: event._id.toString(),
        participantId,
      },
    });
  }

  return { success: true };
};

const getStudentParticipations = async (studentUid, requesterAuth) => {
  const requester = await resolveRequester(requesterAuth);

  if (
    requester.uid !== studentUid &&
    requester.role !== "organization" &&
    !isAdminRole(requester.role)
  ) {
    throw new ApiError(403, "Forbidden: cannot access another student's event participations");
  }

  const participations = await eventRepository.findActiveParticipationsByStudentUid(studentUid);
  return participations;
};

const eventService = {
  createEvent,
  getAllEvents,
  getEventById,
  getRelatedEvents,
  deleteEvent,
  updateEventStatus,
  attendEvent,
  getAttendanceStatus,
  getEventParticipants,
  removeEventParticipant,
  getStudentParticipations,
};

export default eventService;