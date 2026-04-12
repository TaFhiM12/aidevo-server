import ApiError from "../../utils/ApiError.js";
import { getCollections } from "../../config/collections.js";
import { toObjectId } from "../../utils/objectId.js";
import userRepository from "../users/user.repository.js";
import paymentRepository from "./payment.repository.js";

const processPayment = async ({ eventId, amount, cardLast4 }, auth) => {
  if (!eventId) {
    throw new ApiError(400, "eventId is required");
  }

  if (!amount || Number(amount) <= 0) {
    throw new ApiError(400, "amount must be greater than 0");
  }

  const requester = await userRepository.findByUid(auth?.uid);
  if (!requester || requester.role !== "student") {
    throw new ApiError(403, "Only student accounts can make event payments");
  }

  const { eventsCollection } = getCollections();
  const event = await eventsCollection.findOne({
    _id: toObjectId(eventId, "event ID"),
  });

  if (!event) {
    throw new ApiError(404, "Event not found");
  }

  const eventFee = Number(event.fee || 0);
  if (eventFee <= 0) {
    throw new ApiError(400, "This event does not require payment");
  }

  if (Number(amount) < eventFee) {
    throw new ApiError(400, "Insufficient payment amount");
  }

  const payment = {
    studentUid: requester.uid,
    studentEmail: requester.email,
    studentName: requester.name,
    organizationEmail: event.organizationEmail,
    organizationName: event.organization || "",
    eventId: event._id.toString(),
    eventTitle: event.title,
    amount: Number(amount),
    currency: "BDT",
    method: "card",
    cardLast4: cardLast4 || "0000",
    status: "succeeded",
    transactionId: `txn_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    paidAt: new Date(),
  };

  const result = await paymentRepository.createOne(payment);

  return {
    paymentId: result.insertedId,
    transactionId: payment.transactionId,
    status: payment.status,
  };
};

const getStudentPayments = async (studentUid) => {
  return paymentRepository.findByStudentUid(studentUid);
};

const getOrganizationPayments = async (organizationEmail) => {
  return paymentRepository.findByOrganizationEmail(organizationEmail);
};

const paymentService = {
  processPayment,
  getStudentPayments,
  getOrganizationPayments,
};

export default paymentService;
