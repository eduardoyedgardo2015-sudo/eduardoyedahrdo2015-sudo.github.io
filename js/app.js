import { app, auth, db } from "./firebase/client.js";

// Stage 1 only: initialize Firebase clients without starting auth flows or data access.
console.info("NEXUS Firebase initialized", {
  appName: app.name,
  projectId: app.options.projectId,
  authenticationReady: Boolean(auth),
  firestoreReady: Boolean(db)
});
