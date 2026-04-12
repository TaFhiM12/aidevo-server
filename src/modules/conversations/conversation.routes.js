import { Router } from "express";
import conversationController from "./conversation.controller.js";

const router = Router();

router.post("/", conversationController.createOrGetConversation);
router.get("/:conversationId/messages", conversationController.getConversationMessages);
router.get("/user/:userUid", conversationController.getUserConversations);

export default router;