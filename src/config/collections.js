import { getDB } from "./db.js";

export function getCollections() {
  const db = getDB();

  return {
    usersCollection: db.collection("users"),
    eventsCollection: db.collection("events"),
    conversationsCollection: db.collection("conversations"),
    messagesCollection: db.collection("messages"),
    applicationsCollection: db.collection("applications"),
    membersCollection: db.collection("members"),
  };
}