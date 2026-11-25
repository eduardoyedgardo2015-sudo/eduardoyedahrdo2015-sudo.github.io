import assert from "node:assert/strict";
import { createHash, randomUUID } from "node:crypto";
import { createRequire } from "node:module";
import { test } from "node:test";

const require = createRequire(import.meta.url);
const { initializeApp } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
const { FieldValue, Timestamp, getFirestore } = require("firebase-admin/firestore");
const { DURATIONS_MINUTES, DEMAND_LEVELS, localDateTimeToEpoch, lockBucketStarts } = require("../booking-domain.js");

const PROJECT_ID = "demo-nexus-test";
const FUNCTIONS_EMULATOR_HOST = process.env.NEXUS_FUNCTIONS_EMULATOR_HOST || "127.0.0.1:5001";
const DATE = "2099-12-14";
const RESOURCE_ID = "basketball";
const TIME_ZONE = "America/Argentina/Buenos_Aires";
let emulatorAuth;

function assertEmulatorEnvironment() {
  if (process.env.GCLOUD_PROJECT !== PROJECT_ID
    || !process.env.FIRESTORE_EMULATOR_HOST
    || !process.env.FIREBASE_AUTH_EMULATOR_HOST) {
    throw new Error("Esta prueba solo puede ejecutarse dentro de Firebase Emulator Suite con --project demo-nexus-test.");
  }
}

async function signInWithCustomToken(uid) {
  const customToken = await emulatorAuth.createCustomToken(uid);
  const response = await fetch(
    `http://${process.env.FIREBASE_AUTH_EMULATOR_HOST}/identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=fake-api-key`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ token: customToken, returnSecureToken: true })
    }
  );
  const data = await response.json();
  assert.equal(response.ok, true, JSON.stringify(data));
  return data.idToken;
}

async function callFunction(name, data, token) {
  const response = await fetch(
    `http://${FUNCTIONS_EMULATOR_HOST}/${PROJECT_ID}/southamerica-east1/${name}`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(token ? { authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify({ data })
    }
  );
  const result = await response.json();
  if (!response.ok || result.error) {
    const error = new Error(result.error?.message || `Callable ${name} returned HTTP ${response.status}`);
    error.code = result.error?.status;
    throw error;
  }
  return result.result;
}

async function callFirestoreRest(path, token, options = {}) {
  return fetch(
    `http://${process.env.FIRESTORE_EMULATOR_HOST}/v1/projects/${PROJECT_ID}/databases/(default)/documents/${path}`,
    {
      ...options,
      headers: {
        authorization: `Bearer ${token}`,
        ...(options.headers || {})
      }
    }
  );
}

function millis(date, time) {
  return localDateTimeToEpoch(date, time, TIME_ZONE);
}

function lockId(conflictGroupId, bucketStart) {
  const groupKey = createHash("sha256").update(conflictGroupId).digest("hex").slice(0, 20);
  return `${groupKey}_${Math.floor(bucketStart / 60000)}`;
}

test("Firebase emulator booking flow: availability, locks, concurrency, admin, idempotency, privacy", async () => {
  assertEmulatorEnvironment();
  const app = initializeApp({ projectId: PROJECT_ID }, "nexus-booking-integration");
  const auth = getAuth(app);
  emulatorAuth = auth;
  const db = getFirestore(app);
  const adminUid = `admin-${randomUUID()}`;
  const customerUid = `customer-${randomUUID()}`;
  const otherCustomerUid = `other-${randomUUID()}`;
  await Promise.all([
    auth.createUser({ uid: adminUid, email: `${adminUid}@example.test` }),
    auth.createUser({ uid: customerUid, email: `${customerUid}@example.test` }),
    auth.createUser({ uid: otherCustomerUid, email: `${otherCustomerUid}@example.test` })
  ]);
  await auth.setCustomUserClaims(adminUid, { admin: true });

  const amounts = Object.fromEntries(DEMAND_LEVELS.map((level, index) => [
    level,
    Object.fromEntries(DURATIONS_MINUTES.map(duration => [
      duration,
      { amountMinorUnits: (index + 1) * 10000 + duration, currency: "ARS" }
    ]))
  ]));
  const startOfDay = millis(DATE, "00:00");
  const endOfDay = millis("2099-12-15", "00:00");
  const reservationStart = millis(DATE, "09:00");
  const reservationEnd = millis(DATE, "09:30");
  const blockStart = millis(DATE, "10:00");
  const blockEnd = millis(DATE, "10:30");
  const config = {
    enabled: true,
    conflictGroupId: "nexus-emulator-court",
    timeZone: TIME_ZONE,
    startIntervalMinutes: 30,
    weeklySchedule: Object.fromEntries(Array.from({ length: 7 }, (_, day) => [
      String(day),
      day === new Date(`${DATE}T00:00:00.000Z`).getUTCDay()
        ? [{ start: "09:00", end: "13:00" }]
        : []
    ])),
    dateExceptions: {},
    priceByDemandLevel: amounts
  };
  await db.collection("resourceBookingConfig").doc(RESOURCE_ID).set(config);
  await db.collection("demandAssignments").doc("integration-demand").set({
    resourceId: RESOURCE_ID,
    level: "normal",
    startAt: Timestamp.fromMillis(startOfDay),
    endAt: Timestamp.fromMillis(endOfDay),
    active: true
  });
  await db.collection("resourceBlocks").doc("integration-block").set({
    resourceId: RESOURCE_ID,
    conflictGroupId: config.conflictGroupId,
    type: "mantenimiento",
    reason: "Bloqueo de prueba",
    startAt: Timestamp.fromMillis(blockStart),
    endAt: Timestamp.fromMillis(blockEnd),
    active: true
  });
  await db.collection("reservations").doc("integration-confirmed").set({
    userId: adminUid,
    resourceId: RESOURCE_ID,
    resourceName: "Básquet",
    conflictGroupId: config.conflictGroupId,
    startAt: Timestamp.fromMillis(reservationStart),
    endAt: Timestamp.fromMillis(reservationEnd),
    timeZone: TIME_ZONE,
    durationMinutes: 30,
    status: "confirmed",
    payment: { method: "in_person", status: "pending" },
    priceSnapshot: { amountMinorUnits: 1030, currency: "ARS", demandLevel: "normal" },
    createdAt: FieldValue.serverTimestamp()
  });

  const adminToken = await signInWithCustomToken(adminUid);
  const customerToken = await signInWithCustomToken(customerUid);
  const otherCustomerToken = await signInWithCustomToken(otherCustomerUid);
  const initial = await callFunction("getBookingAvailability", {
    resourceId: RESOURCE_ID,
    date: DATE,
    durationMinutes: 30
  }, customerToken);
  const statusAt = time => initial.slots.find(slot => slot.time === time)?.status;
  assert.equal(statusAt("09:00"), "reserved");
  assert.equal(statusAt("10:00"), "blocked");
  assert.equal(statusAt("11:00"), "available");
  assert.ok(initial.slots.every(slot => !("userId" in slot) && !("reservationId" in slot)));
  assert.deepEqual(initial.slots.find(slot => slot.time === "09:00").price, undefined);
  await callFunction("setAdminBookingStatus", {
    reservationId: "integration-confirmed",
    status: "in_progress",
    reason: "Validación de estado legado"
  }, adminToken);
  const legacyDetail = await callFunction("getAdminBooking", {
    reservationId: "integration-confirmed"
  }, adminToken);
  assert.equal(legacyDetail.reservation.status, "in_progress");
  assert.equal(legacyDetail.reservation.legacyStatus, "confirmed");
  assert.equal(legacyDetail.events[0].fromStatus, "confirmed");

  await assert.rejects(
    callFunction("getAdminBookingResource", { resourceId: RESOURCE_ID }, customerToken),
    error => error.code === "PERMISSION_DENIED"
  );
  await callFunction("setResourceBlockActive", {
    resourceId: RESOURCE_ID,
    blockId: "integration-block",
    active: false
  }, adminToken);
  let afterUnblock = await callFunction("getBookingAvailability", {
    resourceId: RESOURCE_ID,
    date: DATE,
    durationMinutes: 30
  }, customerToken);
  assert.equal(afterUnblock.slots.find(slot => slot.time === "10:00").status, "available");
  await callFunction("setResourceBlockActive", {
    resourceId: RESOURCE_ID,
    blockId: "integration-block",
    active: true
  }, adminToken);

  const staleStart = millis(DATE, "11:00");
  for (const bucket of lockBucketStarts(staleStart, staleStart + 30 * 60 * 1000)) {
    await db.collection("reservationLocks").doc(lockId(config.conflictGroupId, bucket)).set({
      reservationId: "deleted-reservation",
      conflictGroupId: config.conflictGroupId
    });
  }
  const initialRequestId = randomUUID();
  const created = await callFunction("createBooking", {
    resourceId: RESOURCE_ID,
    date: DATE,
    time: "11:00",
    durationMinutes: 30,
    paymentMethod: "in_person",
    requestId: initialRequestId
  }, customerToken);
  assert.equal(created.status, "pending");
  assert.equal((await callFirestoreRest(`reservations/${created.reservationId}`, customerToken)).status, 403);
  assert.equal((await callFirestoreRest(`reservations/${created.reservationId}?updateMask.fieldPaths=status`, customerToken, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ fields: { status: { stringValue: "cancelled" } } })
  })).status, 403);
  await assert.rejects(
    callFunction("createBooking", {
      resourceId: RESOURCE_ID,
      date: DATE,
      time: "11:00",
      durationMinutes: 30,
      paymentMethod: "in_person",
      requestId: randomUUID()
    }, customerToken),
    error => error.code === "ALREADY_EXISTS"
  );
  const mine = await callFunction("listMyBookings", {}, customerToken);
  assert.deepEqual(mine.reservations.map(reservation => reservation.id), [created.reservationId]);
  const privateDetail = await callFunction("getMyBooking", { reservationId: created.reservationId }, customerToken);
  assert.equal(privateDetail.reservation.id, created.reservationId);
  await assert.rejects(
    callFunction("getMyBooking", { reservationId: created.reservationId }, otherCustomerToken),
    error => error.code === "NOT_FOUND"
  );
  assert.deepEqual(
    (await callFunction("listMyBookings", {}, otherCustomerToken)).reservations,
    []
  );

  const adminList = await callFunction("listAdminBookings", {
    resourceId: RESOURCE_ID,
    date: DATE
  }, adminToken);
  assert.ok(adminList.reservations.some(reservation => reservation.id === created.reservationId));
  const listedReservation = adminList.reservations.find(reservation => reservation.id === created.reservationId);
  assert.equal("userId" in listedReservation, false);
  assert.equal(listedReservation.customer.uid, customerUid);
  assert.equal(listedReservation.customer.email, `${customerUid}@example.test`);
  const createdPrice = listedReservation.price.amountMinorUnits;
  const searchResult = await callFunction("listAdminBookings", {
    searchId: created.reservationId,
    history: false
  }, adminToken);
  assert.deepEqual(searchResult.reservations.map(reservation => reservation.id), [created.reservationId]);
  await Promise.all([
    assert.rejects(
      callFunction("setAdminBookingStatus", {
        reservationId: created.reservationId,
        status: "in_progress",
        reason: "El cliente no debe operar estados"
      }, customerToken),
      error => error.code === "PERMISSION_DENIED"
    ),
    assert.rejects(
      callFunction("markAdminBookingPaid", { reservationId: created.reservationId }, customerToken),
      error => error.code === "PERMISSION_DENIED"
    ),
    assert.rejects(
      callFunction("deleteAdminBooking", {
        reservationId: created.reservationId,
        reason: "El cliente no debe cancelar desde administración"
      }, customerToken),
      error => error.code === "PERMISSION_DENIED"
    )
  ]);
  await assert.rejects(
    callFunction("setAdminBookingStatus", {
      reservationId: created.reservationId,
      status: "completed",
      reason: "No se puede omitir el inicio"
    }, adminToken),
    error => error.code === "FAILED_PRECONDITION"
  );
  const started = await callFunction("setAdminBookingStatus", {
    reservationId: created.reservationId,
    status: "in_progress",
    reason: "Inicio de prueba"
  }, adminToken);
  assert.equal(started.changed, true);
  const statusChange = await callFunction("setAdminBookingStatus", {
    reservationId: created.reservationId,
    status: "completed",
    reason: "Finalización de prueba"
  }, adminToken);
  assert.equal(statusChange.changed, true);
  const completedDetails = await callFunction("getAdminBooking", {
    reservationId: created.reservationId
  }, adminToken);
  assert.equal(completedDetails.events.length, 3);
  assert.equal(completedDetails.reservation.price.amountMinorUnits, createdPrice);
  assert.equal((await callFunction("setAdminBookingStatus", {
    reservationId: created.reservationId,
    status: "completed",
    reason: "Reintento idempotente"
  }, adminToken)).changed, false);
  assert.equal((await callFunction("getAdminBooking", {
    reservationId: created.reservationId
  }, adminToken)).events.length, 3);
  await assert.rejects(
    callFunction("setAdminBookingStatus", {
      reservationId: created.reservationId,
      status: "cancelled",
      reason: "Política aún no aprobada"
    }, adminToken),
    error => error.code === "INVALID_ARGUMENT"
  );
  const repeatedRequest = await callFunction("createBooking", {
    resourceId: RESOURCE_ID,
    date: DATE,
    time: "11:00",
    durationMinutes: 30,
    paymentMethod: "in_person",
    requestId: initialRequestId
  }, customerToken);
  assert.equal(repeatedRequest.reservationId, created.reservationId);
  assert.equal(repeatedRequest.repeated, true);
  assert.equal(repeatedRequest.status, "completed");
  const completedLock = await db.collection("reservationLocks")
    .where("reservationId", "==", created.reservationId)
    .get();
  assert.equal(completedLock.empty, true);

  const secondRequestId = randomUUID();
  const reopened = await callFunction("createBooking", {
    resourceId: RESOURCE_ID,
    date: DATE,
    time: "11:00",
    durationMinutes: 30,
    paymentMethod: "in_person",
    requestId: secondRequestId
  }, customerToken);
  assert.notEqual(reopened.reservationId, created.reservationId);

  const beforePayment = (await callFunction("getAdminBooking", {
    reservationId: reopened.reservationId
  }, adminToken)).reservation;
  const paymentResult = await callFunction("markAdminBookingPaid", {
    reservationId: reopened.reservationId
  }, adminToken);
  assert.equal(paymentResult.changed, true);
  assert.deepEqual(await callFunction("markAdminBookingPaid", {
    reservationId: reopened.reservationId
  }, adminToken), { changed: false, paymentStatus: "paid" });
  const paidDetail = await callFunction("getAdminBooking", {
    reservationId: reopened.reservationId
  }, adminToken);
  assert.equal(paidDetail.reservation.payment.status, "paid");
  assert.equal(paidDetail.reservation.payment.confirmationType, "manual_admin");
  assert.equal(paidDetail.reservation.payment.manualConfirmedBy, adminUid);
  assert.ok(Number.isFinite(Date.parse(paidDetail.reservation.payment.manualConfirmedAt)));
  assert.equal(paidDetail.reservation.price.amountMinorUnits, beforePayment.price.amountMinorUnits);
  assert.equal(paidDetail.events.filter(event => event.type === "payment_marked_paid").length, 1);
  const deleteResult = await callFunction("deleteAdminBooking", {
    reservationId: reopened.reservationId,
    reason: "Cancelación administrativa de prueba"
  }, adminToken);
  assert.equal(deleteResult.changed, true);
  assert.deepEqual(await callFunction("deleteAdminBooking", {
    reservationId: reopened.reservationId,
    reason: "Reintento de cancelación"
  }, adminToken), { changed: false, status: "cancelled" });
  const deletedDetail = await callFunction("getAdminBooking", {
    reservationId: reopened.reservationId
  }, adminToken);
  assert.equal(deletedDetail.reservation.status, "cancelled");
  assert.equal(deletedDetail.reservation.deletedBy, adminUid);
  assert.equal(deletedDetail.reservation.deletionReason, "Cancelación administrativa de prueba");
  assert.equal(deletedDetail.reservation.payment.status, "paid");
  assert.equal(deletedDetail.reservation.price.amountMinorUnits, beforePayment.price.amountMinorUnits);
  assert.equal(deletedDetail.events.filter(event => event.type === "reservation_soft_deleted").length, 1);
  const auditEvents = await db.collection("bookingConfigurationAudit")
    .where("documentId", "==", reopened.reservationId)
    .get();
  assert.ok(auditEvents.docs.some(event => event.get("action") === "reservation_payment_marked_paid"
    && event.get("actorId") === adminUid));
  assert.ok(auditEvents.docs.some(event => event.get("action") === "reservation_soft_deleted"
    && event.get("actorId") === adminUid));
  assert.equal((await db.collection("reservationLocks")
    .where("reservationId", "==", reopened.reservationId)
    .get()).empty, true);
  const historyList = await callFunction("listAdminBookings", {
    resourceId: RESOURCE_ID,
    date: DATE,
    history: true
  }, adminToken);
  assert.ok(historyList.reservations.some(reservation => reservation.id === reopened.reservationId));
  const activeList = await callFunction("listAdminBookings", {
    resourceId: RESOURCE_ID,
    date: DATE,
    history: false
  }, adminToken);
  assert.equal(activeList.reservations.some(reservation => reservation.id === reopened.reservationId), false);
  const released = await callFunction("getBookingAvailability", {
    resourceId: RESOURCE_ID,
    date: DATE,
    durationMinutes: 30
  }, customerToken);
  assert.equal(released.slots.find(slot => slot.time === "11:00").status, "available");
  const afterDeleteRequest = randomUUID();
  const afterDeleteBooking = await callFunction("createBooking", {
    resourceId: RESOURCE_ID,
    date: DATE,
    time: "11:00",
    durationMinutes: 30,
    paymentMethod: "in_person",
    requestId: afterDeleteRequest
  }, customerToken);
  assert.equal(afterDeleteBooking.status, "pending");

  const competingRequests = await Promise.allSettled([randomUUID(), randomUUID()].map(requestId =>
    callFunction("createBooking", {
      resourceId: RESOURCE_ID,
      date: DATE,
      time: "12:00",
      durationMinutes: 30,
      paymentMethod: "in_person",
      requestId
    }, customerToken)
  ));
  assert.equal(competingRequests.filter(result => result.status === "fulfilled").length, 1);
  const rejected = competingRequests.find(result => result.status === "rejected");
  assert.equal(rejected.reason.code, "ALREADY_EXISTS");
  const refreshed = await callFunction("getBookingAvailability", {
    resourceId: RESOURCE_ID,
    date: DATE,
    durationMinutes: 30
  }, customerToken);
  const refreshedStatusAt = time => refreshed.slots.find(slot => slot.time === time)?.status;
  assert.equal(refreshedStatusAt("09:00"), "reserved");
  assert.equal(refreshedStatusAt("10:00"), "blocked");
  assert.equal(refreshedStatusAt("11:00"), "reserved");
  assert.equal(refreshedStatusAt("12:00"), "reserved");

  await app.delete();
});
