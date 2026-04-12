import { Router } from "express";
import eventController from "./event.controller.js";

const router = Router();

router.post("/", eventController.createEvent);
router.get("/", eventController.getAllEvents);
router.get("/:id", eventController.getEventById);
router.delete("/:eventId", eventController.deleteEvent);
router.get("/:id/related", eventController.getRelatedEvents);

export default router;