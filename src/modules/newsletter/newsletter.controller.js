import asyncHandler from "../../utils/asyncHandler.js";
import sendResponse from "../../utils/sendResponse.js";
import newsletterService from "./newsletter.service.js";

const subscribe = asyncHandler(async (req, res) => {
  const result = await newsletterService.subscribeEmail(req.body?.email);

  return sendResponse(res, {
    statusCode: 201,
    success: true,
    message: result.alreadySubscribed
      ? "This email is already subscribed"
      : "You are subscribed. We will email you about newly published events.",
    data: result,
  });
});

const newsletterController = {
  subscribe,
};

export default newsletterController;
