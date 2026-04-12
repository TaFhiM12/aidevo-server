import { getCollections } from "../../config/collections.js";

const ensureUniqueEmailIndex = async () => {
  const { newsletterSubscribersCollection } = getCollections();
  await newsletterSubscribersCollection.createIndex({ email: 1 }, { unique: true });
};

const upsertSubscriptionByEmail = async (email) => {
  const { newsletterSubscribersCollection } = getCollections();

  return newsletterSubscribersCollection.updateOne(
    { email },
    {
      $set: {
        email,
        status: "active",
        updatedAt: new Date(),
      },
      $setOnInsert: {
        createdAt: new Date(),
        subscribedAt: new Date(),
      },
    },
    { upsert: true }
  );
};

const findByEmail = async (email) => {
  const { newsletterSubscribersCollection } = getCollections();

  return newsletterSubscribersCollection.findOne({ email });
};

const findActiveSubscriberEmails = async () => {
  const { newsletterSubscribersCollection } = getCollections();

  const subscribers = await newsletterSubscribersCollection
    .find(
      { status: "active" },
      {
        projection: {
          _id: 0,
          email: 1,
        },
      }
    )
    .toArray();

  return subscribers.map((subscriber) => subscriber.email).filter(Boolean);
};

const newsletterRepository = {
  ensureUniqueEmailIndex,
  upsertSubscriptionByEmail,
  findByEmail,
  findActiveSubscriberEmails,
};

export default newsletterRepository;
