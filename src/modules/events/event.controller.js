import asyncHandler from "../../utils/asyncHandler.js";
import sendResponse from "../../utils/sendResponse.js";
import eventService from "./event.service.js";

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
  console.log("Received event creation request:", JSON.stringify(req.body, null, 2));
  
  try {
    const result = await eventService.createEvent(req.body);
    
    console.log("Event created successfully:", result);
    
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

const getRelatedEvents = asyncHandler(async (req, res) => {
  const events = await eventService.getRelatedEvents(req.params.id);

  return sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Related events fetched successfully",
    data: events,
  });
});

const eventController = {
  createEvent,
  getAllEvents,
  getEventById,
  deleteEvent,
  getRelatedEvents,
};

export default eventController;