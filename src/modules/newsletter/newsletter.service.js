import ApiError from "../../utils/ApiError.js";
import newsletterRepository from "./newsletter.repository.js";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

let indexInitPromise = null;

const ensureIndexInitialized = async () => {
  if (!indexInitPromise) {
    indexInitPromise = newsletterRepository
      .ensureUniqueEmailIndex()
      .catch((error) => {
        indexInitPromise = null;
        throw error;
      });
  }

  return indexInitPromise;
};

const normalizeEmail = (email) => String(email || "").trim().toLowerCase();

const subscribeEmail = async (rawEmail) => {
  const email = normalizeEmail(rawEmail);

  if (!email) {
    throw new ApiError(400, "Email is required");
  }

  if (!EMAIL_REGEX.test(email)) {
    throw new ApiError(400, "Please provide a valid email address");
  }

  await ensureIndexInitialized();

  const existingSubscriber = await newsletterRepository.findByEmail(email);
  const result = await newsletterRepository.upsertSubscriptionByEmail(email);

  const alreadySubscribed = Boolean(existingSubscriber && existingSubscriber.status === "active");

  return {
    email,
    alreadySubscribed,
    isNewSubscriber: Boolean(result.upsertedId),
  };
};

const getActiveSubscriberEmails = async () => {
  await ensureIndexInitialized();
  return newsletterRepository.findActiveSubscriberEmails();
};

const newsletterService = {
  subscribeEmail,
  getActiveSubscriberEmails,
};

export default newsletterService;
