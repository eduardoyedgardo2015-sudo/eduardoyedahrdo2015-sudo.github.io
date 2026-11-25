import { getApp, getApps, initializeApp } from "https://www.gstatic.com/firebasejs/13.4.0/firebase-app.js";
import { getAuth, connectAuthEmulator } from "https://www.gstatic.com/firebasejs/13.4.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/13.4.0/firebase-firestore.js";
import { getFunctions, httpsCallable, httpsCallableFromURL } from "https://www.gstatic.com/firebasejs/13.4.0/firebase-functions.js";
import { firebaseConfig } from "./config.js";

export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

const emulatorMode =
  new URLSearchParams(window.location.search).get("emulator") === "1";

if (emulatorMode) {
  connectAuthEmulator(auth, window.location.origin, {
    disableWarnings: true
  });
}

const functions = getFunctions(app, "southamerica-east1");

export function callFunction(name) {
  if (emulatorMode) {
    const endpoint = new URL(
      `/__emulator/functions/${firebaseConfig.projectId}/southamerica-east1/${name}`,
      window.location.origin
    );

    return httpsCallableFromURL(functions, endpoint.href);
  }

  return httpsCallable(functions, name);
}
