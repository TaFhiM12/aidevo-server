import { getDB } from "./db.js";

export function getCollections() {
  const db = getDB();

  return {
    usersCollection: db.collection("users"),
    eventsCollection: db.collection("events"),
    conversationsCollection: db.collection("conversations"),
    messagesCollection: db.collection("messages"),
    applicationsCollection: db.collection("applications"),
    eventParticipantsCollection: db.collection("eventParticipants"),
    membersCollection: db.collection("members"),
    notificationsCollection: db.collection("notifications"),
    paymentsCollection: db.collection("payments"),
    bloodDonorsCollection: db.collection("bloodDonors"),
    bloodRequestsCollection: db.collection("bloodRequests"),
    newsletterSubscribersCollection: db.collection("newsletterSubscribers"),
  };
}