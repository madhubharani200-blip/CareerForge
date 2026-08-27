/**
 * AUTONOMOUS CAREER AGENT API WRAPPER
 */

import { callBackendApi } from "./client.js";
import { db } from "../firebase-config.js";
import { collection, getDocs, query, orderBy, limit, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

/**
 * Trigger the autonomous multi-step Career Agent
 */
export async function triggerCareerAgent(payloadOrUid, triggerSource = "on_demand_ui") {
  const payload = typeof payloadOrUid === "object" ? payloadOrUid : { uid: payloadOrUid, triggerSource };
  
  const result = await callBackendApi("agent/run", payload);

  const uid = payload.uid;
  if (uid && result) {
    // Save to local agent run history cache
    const key = `agent_runs_${uid}`;
    const runs = JSON.parse(localStorage.getItem(key) || "[]");
    runs.unshift(result);
    localStorage.setItem(key, JSON.stringify(runs.slice(0, 15)));
    localStorage.setItem(`latest_agent_run_${uid}`, JSON.stringify(result));

    // Save to Firestore if available
    try {
      if (db) {
        await addDoc(collection(db, "users", uid, "agentRuns"), {
          ...result,
          createdAt: serverTimestamp()
        });
      }
    } catch (e) {
      console.warn("[Agent API] Firestore save note:", e.message);
    }
  }

  return result;
}

export const triggerAgentRun = triggerCareerAgent;

/**
 * Get latest agent run snapshot
 */
export async function getLatestAgentRun(uid) {
  const cached = localStorage.getItem(`latest_agent_run_${uid}`);
  if (cached) {
    try { return JSON.parse(cached); } catch {}
  }

  try {
    if (db && uid) {
      const runsRef = collection(db, "users", uid, "agentRuns");
      const q = query(runsRef, orderBy("timestamp", "desc"), limit(1));
      const snap = await getDocs(q);
      if (!snap.empty) {
        return { id: snap.docs[0].id, ...snap.docs[0].data() };
      }
    }
  } catch (err) {
    console.warn("[Agent API] Firestore getLatestRun notice:", err.message);
  }

  return null;
}

/**
 * Get full agent runs history
 */
export async function getAgentRunHistory(uid) {
  const localRuns = JSON.parse(localStorage.getItem(`agent_runs_${uid}`) || "[]");

  try {
    if (db && uid) {
      const runsRef = collection(db, "users", uid, "agentRuns");
      const q = query(runsRef, orderBy("createdAt", "desc"), limit(10));
      const snap = await getDocs(q);
      if (!snap.empty) {
        return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      }
    }
  } catch (err) {
    console.warn("[Agent API] Firestore history notice:", err.message);
  }

  return localRuns;
}
