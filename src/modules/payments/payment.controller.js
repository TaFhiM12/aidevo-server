import asyncHandler from "../../utils/asyncHandler.js";
import sendResponse from "../../utils/sendResponse.js";
import paymentService from "./payment.service.js";

const checkoutPayment = asyncHandler(async (req, res) => {
  const result = await paymentService.processPayment(req.body, req.auth);

  return sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Payment completed successfully",
    data: result,
  });
});

const getStudentPayments = asyncHandler(async (req, res) => {
  const payments = await paymentService.getStudentPayments(req.params.uid);

  return sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Student payments fetched successfully",
    data: payments,
  });
});

const getOrganizationPayments = asyncHandler(async (req, res) => {
  const payments = await paymentService.getOrganizationPayments(req.params.organizationEmail);

  return sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Organization payments fetched successfully",
    data: payments,
  });
});

const paymentController = {
  checkoutPayment,
  getStudentPayments,
  getOrganizationPayments,
};

export default paymentController;
