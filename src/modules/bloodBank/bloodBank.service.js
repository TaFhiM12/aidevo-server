import ApiError from "../../utils/ApiError.js";
import bloodBankRepository from "./bloodBank.repository.js";

const SUPPORTED_BLOOD_GROUPS = [
  "A+",
  "A-",
  "B+",
  "B-",
  "AB+",
  "AB-",
  "O+",
  "O-",
];

const SUPPORTED_URGENCY_LEVELS = ["critical", "high", "medium"];
const DONOR_MODERATION_STATUSES = ["approved", "hidden", "pending"];
const REQUEST_STATUSES = ["active", "resolved", "hidden"];

const sanitizeText = (value) => String(value || "").trim();

const registerDonor = async (payload) => {
  const name = sanitizeText(payload.name);
  const phone = sanitizeText(payload.phone);
  const bloodGroup = sanitizeText(payload.bloodGroup).toUpperCase();
  const address = sanitizeText(payload.address);
  const note = sanitizeText(payload.note);

  const latitude = Number(payload.latitude);
  const longitude = Number(payload.longitude);

  if (!name || !phone || !bloodGroup || !address) {
    throw new ApiError(400, "Name, phone, blood group, and address are required");
  }

  if (!SUPPORTED_BLOOD_GROUPS.includes(bloodGroup)) {
    throw new ApiError(400, "Invalid blood group");
  }

  if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
    throw new ApiError(400, "Valid latitude and longitude are required");
  }

  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    throw new ApiError(400, "Latitude or longitude is out of valid range");
  }

  const donor = {
    name,
    phone,
    bloodGroup,
    address,
    note,
    location: {
      type: "Point",
      coordinates: [longitude, latitude],
    },
    latitude,
    longitude,
    isActive: true,
    status: "approved",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const result = await bloodBankRepository.createDonor(donor);

  return {
    donorId: result.insertedId,
  };
};

const getPublicDonors = async (limit = 20) => {
  const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 50);
  const donors = await bloodBankRepository.getRecentDonors(safeLimit, "approved");

  return donors.map((donor) => ({
    _id: donor._id,
    name: donor.name,
    bloodGroup: donor.bloodGroup,
    address: donor.address,
    latitude: donor.latitude,
    longitude: donor.longitude,
    createdAt: donor.createdAt,
    // Show partial number publicly for privacy.
    phoneMasked: donor.phone?.length > 4 ? `${"*".repeat(Math.max(donor.phone.length - 4, 0))}${donor.phone.slice(-4)}` : donor.phone,
  }));
};

const createUrgentRequest = async (payload) => {
  const patientName = sanitizeText(payload.patientName);
  const phone = sanitizeText(payload.phone);
  const bloodGroup = sanitizeText(payload.bloodGroup).toUpperCase();
  const hospitalAddress = sanitizeText(payload.hospitalAddress);
  const note = sanitizeText(payload.note);
  const urgencyLevel = sanitizeText(payload.urgencyLevel).toLowerCase() || "high";

  const latitude = Number(payload.latitude);
  const longitude = Number(payload.longitude);

  if (!patientName || !phone || !bloodGroup || !hospitalAddress) {
    throw new ApiError(400, "Patient name, phone, blood group, and hospital address are required");
  }

  if (!SUPPORTED_BLOOD_GROUPS.includes(bloodGroup)) {
    throw new ApiError(400, "Invalid blood group");
  }

  if (!SUPPORTED_URGENCY_LEVELS.includes(urgencyLevel)) {
    throw new ApiError(400, "Invalid urgency level");
  }

  if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
    throw new ApiError(400, "Valid latitude and longitude are required");
  }

  const request = {
    patientName,
    phone,
    bloodGroup,
    hospitalAddress,
    note,
    urgencyLevel,
    latitude,
    longitude,
    status: "active",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const result = await bloodBankRepository.createUrgentRequest(request);

  return {
    requestId: result.insertedId,
  };
};

const getPublicUrgentRequests = async (limit = 20) => {
  const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 50);
  const requests = await bloodBankRepository.getRecentUrgentRequests(safeLimit, ["active"]);

  return requests.map((request) => ({
    _id: request._id,
    patientName: request.patientName,
    bloodGroup: request.bloodGroup,
    hospitalAddress: request.hospitalAddress,
    note: request.note,
    urgencyLevel: request.urgencyLevel,
    latitude: request.latitude,
    longitude: request.longitude,
    createdAt: request.createdAt,
    phone: request.phone,
    phoneMasked:
      request.phone?.length > 4
        ? `${"*".repeat(Math.max(request.phone.length - 4, 0))}${request.phone.slice(-4)}`
        : request.phone,
  }));
};

const getAdminModerationQueue = async () => {
  const [pendingDonors, urgentRequests] = await Promise.all([
    bloodBankRepository.getRecentDonors(50, "pending"),
    bloodBankRepository.getRecentUrgentRequests(50, ["active"]),
  ]);

  return {
    pendingDonors,
    urgentRequests,
  };
};

const moderateDonor = async (donorId, status, moderatorAuth) => {
  if (!DONOR_MODERATION_STATUSES.includes(status)) {
    throw new ApiError(400, "Invalid donor moderation status");
  }

  const result = await bloodBankRepository.updateDonorStatusById(donorId, status, {
    uid: moderatorAuth?.uid || "",
    role: moderatorAuth?.role || "",
  });

  if (!result.matchedCount) {
    throw new ApiError(404, "Donor entry not found");
  }

  return null;
};

const moderateUrgentRequest = async (requestId, status, moderatorAuth) => {
  if (!REQUEST_STATUSES.includes(status)) {
    throw new ApiError(400, "Invalid urgent request status");
  }

  const result = await bloodBankRepository.updateUrgentRequestStatusById(requestId, status, {
    uid: moderatorAuth?.uid || "",
    role: moderatorAuth?.role || "",
  });

  if (!result.matchedCount) {
    throw new ApiError(404, "Urgent request not found");
  }

  return null;
};

const bloodBankService = {
  registerDonor,
  getPublicDonors,
  createUrgentRequest,
  getPublicUrgentRequests,
  getAdminModerationQueue,
  moderateDonor,
  moderateUrgentRequest,
};

export default bloodBankService;
