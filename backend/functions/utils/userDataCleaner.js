import { getDb, getFirebaseAdmin } from "./dataService.js";

/**
 * Delete a collection and all its subdocuments in batches
 */
async function deleteCollection(collectionRef, batchSize = 100) {
  const db = getDb();
  const query = collectionRef.limit(batchSize);

  return new Promise((resolve, reject) => {
    deleteQueryBatch(db, query, resolve).catch(reject);
  });
}

async function deleteQueryBatch(db, query, resolve) {
  const snapshot = await query.get();

  const batchSize = snapshot.size;
  if (batchSize === 0) {
    resolve();
    return;
  }

  const batch = db.batch();
  snapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });
  await batch.commit();

  process.nextTick(() => {
    deleteQueryBatch(db, query, resolve);
  });
}

/**
 * Delete all subcollections and the user profile document for GDPR compliance
 */
export async function deleteUserAccountData(uid) {
  const db = getDb();
  const admin = getFirebaseAdmin();
  const userRef = db.collection("users").doc(uid);

  const subcollections = [
    "resumes",
    "portfolios",
    "careerRecommendations",
    "skillGapReports",
    "learningRoadmaps",
    "resumeScans",
    "agentRuns"
  ];

  for (const sub of subcollections) {
    await deleteCollection(userRef.collection(sub));
  }

  // Delete top-level profile document
  await userRef.delete();

  // Also remove Firebase Auth user record if possible
  try {
    await admin.auth().deleteUser(uid);
  } catch (err) {
    console.warn(`[UserDataCleaner] Could not delete Auth user ${uid}: ${err.message}`);
  }

  return { success: true, message: `All data for user ${uid} permanently deleted.` };
}
