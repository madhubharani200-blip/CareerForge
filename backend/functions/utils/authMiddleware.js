import admin from "firebase-admin";

/**
 * Initialize Firebase Admin singleton if not already initialized
 */
export function getFirebaseAdmin() {
  if (!admin.apps.length) {
    admin.initializeApp();
  }
  return admin;
}

/**
 * Verifies the incoming Authorization header (Bearer token) or Callable request auth context.
 * Returns the verified user record with uid.
 */
export async function authenticateRequest(req) {
  const adminApp = getFirebaseAdmin();

  // If this is a Callable function context
  if (req?.auth?.uid) {
    return { uid: req.auth.uid, email: req.auth.token?.email || "" };
  }

  // Extract from HTTP Authorization header
  const authHeader = req.headers?.authorization || req.headers?.Authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    // In local demo / test bypass mode if enabled
    if (process.env.ALLOW_ANONYMOUS_DEV === "true" && req.headers?.["x-dev-uid"]) {
      return { uid: req.headers["x-dev-uid"], email: "dev@example.com" };
    }
    throw new Error("Unauthorized: Missing or invalid Authorization header");
  }

  const idToken = authHeader.split("Bearer ")[1].trim();

  try {
    const decodedToken = await adminApp.auth().verifyIdToken(idToken);
    return {
      uid: decodedToken.uid,
      email: decodedToken.email || ""
    };
  } catch (error) {
    throw new Error(`Unauthorized: Invalid token (${error.message})`);
  }
}
