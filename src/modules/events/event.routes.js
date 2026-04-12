import { Router } from "express";
import eventController from "./event.controller.js";
import {
	authenticateJWT,
	authorizeAccess,
	matchParamWithAuth,
} from "../../middleware/authenticateJWT.js";

const router = Router();

router.post(
	"/",
	authenticateJWT,
	authorizeAccess({ roles: ["organization", "super-admin", "superAdmin"] }),
	eventController.createEvent
);
router.get("/trending", eventController.getTrendingEvents);
router.get(
	"/student/:studentUid/participations",
	authenticateJWT,
	authorizeAccess({
		roles: ["organization", "super-admin", "superAdmin"],
		matchers: [matchParamWithAuth("studentUid", ["uid"])],
	}),
	eventController.getStudentParticipations
);
router.get(
	"/recommendations/:studentId",
	authenticateJWT,
	authorizeAccess({ roles: ["student", "super-admin", "superAdmin"] }),
	eventController.getEventRecommendations
);
router.get("/", eventController.getAllEvents);
router.get("/:id/related", eventController.getRelatedEvents);
router.post(
	"/:eventId/attend",
	authenticateJWT,
	authorizeAccess({ roles: ["student", "super-admin", "superAdmin"] }),
	eventController.attendEvent
);
router.get(
	"/:eventId/attendance-status",
	authenticateJWT,
	authorizeAccess({ roles: ["student", "super-admin", "superAdmin"] }),
	eventController.getAttendanceStatus
);
router.get(
	"/:eventId/participants",
	authenticateJWT,
	authorizeAccess({ roles: ["organization", "super-admin", "superAdmin"] }),
	eventController.getEventParticipants
);
router.delete(
	"/:eventId/participants/:participantId",
	authenticateJWT,
	authorizeAccess({ roles: ["organization", "super-admin", "superAdmin"] }),
	eventController.removeEventParticipant
);
router.get("/:id", eventController.getEventById);
router.patch(
	"/:eventId/status",
	authenticateJWT,
	authorizeAccess({ roles: ["organization", "super-admin", "superAdmin"] }),
	eventController.updateEventStatus
);
router.delete(
	"/:eventId",
	authenticateJWT,
	authorizeAccess({ roles: ["organization", "super-admin", "superAdmin"] }),
	eventController.deleteEvent
);

export default router;