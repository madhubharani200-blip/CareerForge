/**
 * Script to initialize and verify Cloud Firestore connection for miniproject-e1acd
 */
import admin from "firebase-admin";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const serviceAccountPath = path.resolve(__dirname, "../config/serviceAccountKey.json");

if (!fs.existsSync(serviceAccountPath)) {
  console.error("❌ Service account key not found at:", serviceAccountPath);
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: "miniproject-e1acd"
});

const db = admin.firestore();

async function main() {
  console.log("🚀 Connecting to Cloud Firestore for project miniproject-e1acd...");
  
  try {
    const testDocRef = db.collection("system_status").doc("connection_check");
    await testDocRef.set({
      connected: true,
      serviceAccount: serviceAccount.client_email,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      platform: "CareerForge AI"
    });

    console.log("✅ Successfully wrote connection check document to Cloud Firestore!");

    const snap = await testDocRef.get();
    console.log("📖 Read back verification data from Firestore:", snap.data());

    // Initialize baseline user document template
    const demoUserRef = db.collection("users").doc("demo_user_seed");
    await demoUserRef.set({
      displayName: "Alex Morgan",
      email: "alex.morgan@university.edu",
      headline: "Full Stack Software Engineer & Cloud Architect",
      targetRole: "Full Stack Software Engineer",
      skills: [
        { name: "JavaScript", level: "Advanced" },
        { name: "TypeScript", level: "Intermediate" },
        { name: "React", level: "Intermediate" },
        { name: "Node.js", level: "Intermediate" },
        { name: "Cloud Firestore", level: "Intermediate" }
      ],
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    console.log("✅ Successfully initialized users collection in Cloud Firestore!");
    console.log("🎉 Cloud Firestore Database is ACTIVE, CONNECTED, and SYNCING LIVE!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Firestore connection status:", err.message);
    if (err.message.includes("NOT_FOUND") || err.message.includes("database") || err.message.includes("5 NOT_FOUND")) {
      console.log("\n💡 Action: The Firestore Database instance must be created in Firebase Console.");
      console.log("👉 Go to: https://console.firebase.google.com/project/miniproject-e1acd/firestore and click 'Create Database'.");
    }
    process.exit(1);
  }
}

main();
