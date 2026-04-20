import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { connectDB } from "../config/db.js";
import { getCollections } from "../config/collections.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const readEnvFile = (filePath) => {
  if (!fs.existsSync(filePath)) {
    return {};
  }

  const parsed = dotenv.parse(fs.readFileSync(filePath));
  return parsed || {};
};

const clientEnv = readEnvFile(path.resolve(__dirname, "../../..", "aidevo-client/.env.local"));

const getFirebaseApiKey = () =>
  process.env.FIREBASE_WEB_API_KEY ||
  process.env.VITE_FIREBASE_API_KEY ||
  clientEnv.VITE_FIREBASE_API_KEY ||
  "";

const email = process.env.SEED_SUPER_ADMIN_EMAIL || "superadmin@aidevo.dev";
const password = process.env.SEED_SUPER_ADMIN_PASSWORD || "Aidevo@Super2026!";
const displayName = process.env.SEED_SUPER_ADMIN_NAME || "Super Admin";
const firebaseApiKey = getFirebaseApiKey();

if (!firebaseApiKey) {
  throw new Error(
    "Firebase API key is missing. Set FIREBASE_WEB_API_KEY or VITE_FIREBASE_API_KEY before running the seed."
  );
}

const createFirebaseUser = async () => {
  const signUpResponse = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${firebaseApiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        password,
        displayName,
        returnSecureToken: true,
      }),
    }
  );

  const payload = await signUpResponse.json();

  if (signUpResponse.ok) {
    return payload.localId;
  }

  if (payload?.error?.message === "EMAIL_EXISTS") {
    const signInResponse = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${firebaseApiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          returnSecureToken: true,
        }),
      }
    );

    const signInPayload = await signInResponse.json();

    if (!signInResponse.ok) {
      throw new Error(signInPayload?.error?.message || "Failed to sign in existing Firebase user");
    }

    return signInPayload.localId;
  }

  throw new Error(payload?.error?.message || "Failed to create Firebase super admin user");
};

const seedSuperAdmin = async () => {
  await connectDB();
  const { usersCollection } = getCollections();

  const uid = await createFirebaseUser();
  const now = new Date();

  const updateResult = await usersCollection.updateOne(
    { email },
    {
      $set: {
        uid,
        email,
        name: displayName,
        role: "super-admin",
        photoURL: "",
        updatedAt: now,
      },
      $setOnInsert: {
        createdAt: now,
      },
    },
    { upsert: true }
  );

  console.log("Super admin seed complete:");
  console.log(`Email: ${email}`);
  console.log(`Password: ${password}`);
  console.log(`UID: ${uid}`);
  console.log(`Mongo upserted: ${updateResult.upsertedCount > 0}`);
};

seedSuperAdmin().catch((error) => {
  console.error("Super admin seed failed:", error);
  process.exitCode = 1;
});