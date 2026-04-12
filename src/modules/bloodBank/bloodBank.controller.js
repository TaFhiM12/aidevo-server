import asyncHandler from "../../utils/asyncHandler.js";
import sendResponse from "../../utils/sendResponse.js";
import bloodBankService from "./bloodBank.service.js";

const registerDonor = asyncHandler(async (req, res) => {
  const result = await bloodBankService.registerDonor(req.body);

  return sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Blood donor info submitted and published successfully",
    data: result,
  });
});

const getPublicDonors = asyncHandler(async (req, res) => {
  const donors = await bloodBankService.getPublicDonors(req.query.limit);

  return sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Blood donors fetched successfully",
    data: donors,
  });
});

const createUrgentRequest = asyncHandler(async (req, res) => {
  const result = await bloodBankService.createUrgentRequest(req.body);

  return sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Urgent blood request submitted successfully",
    data: result,
  });
});

const getPublicUrgentRequests = asyncHandler(async (req, res) => {
  const requests = await bloodBankService.getPublicUrgentRequests(req.query.limit);

  return sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Urgent blood requests fetched successfully",
    data: requests,
  });
});

const getAdminModerationQueue = asyncHandler(async (req, res) => {
  const data = await bloodBankService.getAdminModerationQueue();

  return sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Blood bank moderation queue fetched successfully",
    data,
  });
});

const moderateDonor = asyncHandler(async (req, res) => {
  await bloodBankService.moderateDonor(req.params.donorId, req.body.status, req.auth);

  return sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Donor moderation status updated",
    data: null,
  });
});

const moderateUrgentRequest = asyncHandler(async (req, res) => {
  await bloodBankService.moderateUrgentRequest(
    req.params.requestId,
    req.body.status,
    req.auth
  );

  return sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Urgent request moderation status updated",
    data: null,
  });
});

const bloodBankController = {
  registerDonor,
  getPublicDonors,
  createUrgentRequest,
  getPublicUrgentRequests,
  getAdminModerationQueue,
  moderateDonor,
  moderateUrgentRequest,
};

export default bloodBankController;
