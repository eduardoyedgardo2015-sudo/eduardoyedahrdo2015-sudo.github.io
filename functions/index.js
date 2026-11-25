const { createHash, randomUUID } = require("node:crypto");
const { initializeApp } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
const { getFirestore, FieldValue, Timestamp } = require("firebase-admin/firestore");
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const {
  amountToMinorUnits,
  hasAdminClaim,
  minorUnitsToDecimalString
} = require("./admin-domain");
const {
  DEMAND_LEVELS,
  DURATIONS_MINUTES,
  BOOKING_STATUSES,
  MAX_DURATION_MINUTES,
  RESOURCES,
  findDemandAssignment,
  getConfigurationProblem,
  getPrice,
  hasDemandAssignmentOverlap,
  isBookingStatusTransitionAllowed,
  isReservationHoldingSlot,
  localDayBounds,
  localDateTimeToEpoch,
  lockBucketStarts,
  overlaps,
  normalizeBookingStatus,
  parseDate,
  parseTime,
  scheduledSlots,
  validateRequestedSlot
} = require("./booking-domain");

initializeApp();
const db = getFirestore();
const REGION = "southamerica-east1";
const RESOURCE_CONFIGS = "resourceBookingConfig";
const RESERVATIONS = "reservations";
const BLOCKS = "resourceBlocks";
const LOCKS = "reservationLocks";
const EVENTS = "reservationEvents";
const DEMAND_ASSIGNMENTS = "demandAssignments";
const ADMIN_AUDIT = "bookingConfigurationAudit";
const ADMIN_BOOKING_PAGE_SIZE = 25;
const ADMIN_BOOKING_SCAN_SIZE = 100;
const ADMIN_BOOKING_MAX_SCAN = 500;

function requireAuth(request) {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Iniciá sesión para continuar.");
  }
  return request.auth.uid;
}

function requireAdmin(request) {
  if (!request.auth) throw new HttpsError("unauthenticated", "Iniciá sesión para continuar.");
  if (!hasAdminClaim(request.auth)) {
    throw new HttpsError("permission-denied", "No tenés permisos para administrar las reservas.");
  }
  return request.auth.uid;
}

function getResource(resourceId) {
  const resource = RESOURCES.find(item => item.id === resourceId);
  if (!resource) throw new HttpsError("invalid-argument", "El recurso solicitado no existe.");
  return resource;
}

async function loadConfiguration(resourceId) {
  const snapshot = await db.collection(RESOURCE_CONFIGS).doc(resourceId).get();
  const config = snapshot.exists ? snapshot.data() : null;
  const problem = getConfigurationProblem(config);
  if (problem) {
    throw new HttpsError("failed-precondition", `${problem} para este recurso.`);
  }
  return config;
}

function firestoreError(error) {
  if (error instanceof HttpsError) return error;
  if (error instanceof Error && /fecha|horario|duración|zona horaria|configuración/i.test(error.message)) {
    return new HttpsError("failed-precondition", error.message);
  }
  console.error("NEXUS booking operation failed", error);
  return new HttpsError("internal", "No se pudo completar la operación de reservas.");
}

function createAvailabilityQuery(collection, conflictGroupId, lowerBound, upperBound, statusFilter) {
  let query = collection.where("conflictGroupId", "==", conflictGroupId);
  if (statusFilter) query = query.where(statusFilter.field, "==", statusFilter.value);
  return query
    .where("startAt", ">=", Timestamp.fromMillis(lowerBound))
    .where("startAt", "<", Timestamp.fromMillis(upperBound));
}



function createBlockQuery(conflictGroupId, upperBound) {
  return db.collection(BLOCKS)
    .where("conflictGroupId", "==", conflictGroupId)
    .where("active", "==", true)
    .where("startAt", "<", Timestamp.fromMillis(upperBound));
}

function createDemandQuery(resourceId, startAt, endAt) {
  return db.collection(DEMAND_ASSIGNMENTS)
    .where("resourceId", "==", resourceId)
    .where("active", "==", true)
    .where("startAt", "<", Timestamp.fromMillis(endAt))
    .where("endAt", ">", Timestamp.fromMillis(startAt));
}

function demandAssignmentsFromSnapshot(snapshot) {
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    startAtMillis: doc.get("startAt").toMillis(),
    endAtMillis: doc.get("endAt").toMillis()
  }));
}

function resourceBookingResponse(resource, config) {
  const problem = getConfigurationProblem(config);
  const hasAnyPrice = DEMAND_LEVELS.some(level =>
    DURATIONS_MINUTES.some(duration => getPrice(config, level, duration))
  );
  return {
    id: resource.id,
    name: resource.name,
    availableForBooking: !problem && hasAnyPrice,
    configurationStatus: problem || !hasAnyPrice ? "pending" : "ready"
  };
}

function localDateTime(value, timeZone) {
  if (typeof value !== "string" || !/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})$/.test(value)) {
    throw new HttpsError("invalid-argument", "La fecha y hora deben estar completas.");
  }
  const [, date, time] = value.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})$/);
  try {
    return {
      date,
      time,
      millis: localDateTimeToEpoch(date, time, timeZone)
    };
  } catch (error) {
    throw new HttpsError("invalid-argument", error.message);
  }
}

function serializePeriod(doc) {
  const data = doc.data();
  return {
    id: doc.id,
    active: data.active === true,
    startAt: data.startAt.toDate().toISOString(),
    endAt: data.endAt.toDate().toISOString(),
    ...(data.resourceId ? { resourceId: data.resourceId } : {}),
    ...(data.level ? { level: data.level } : {}),
    ...(data.type ? { type: data.type } : {}),
    ...(data.reason ? { reason: data.reason } : {}),
    ...(data.startLocal ? { startLocal: data.startLocal } : {}),
    ...(data.endLocal ? { endLocal: data.endLocal } : {}),
    ...(data.timeZone ? { timeZone: data.timeZone } : {})
  };
}

function paymentStatus(data) {
  return data.payment && data.payment.status === "paid" ? "paid" : "pending";
}

function isHistoricalReservation(data) {
  const status = normalizeBookingStatus(data.status);
  return (data.deletedAt !== undefined && data.deletedAt !== null)
    || status === "completed"
    || status === "cancelled";
}

function reservationForAdmin(doc, customer) {
  const data = doc.data();
  const price = data.priceSnapshot || {};
  const legacyStatus = data.legacyStatus
    || (BOOKING_STATUSES.includes(data.status) ? null : data.status);
  return {
    id: doc.id,
    customer,
    resourceId: data.resourceId,
    resourceName: data.resourceName,
    startAt: data.startAt.toDate().toISOString(),
    endAt: data.endAt.toDate().toISOString(),
    timeZone: data.timeZone,
    durationMinutes: data.durationMinutes,
    status: normalizeBookingStatus(data.status),
    ...(legacyStatus ? { legacyStatus } : {}),
    deletedAt: data.deletedAt ? data.deletedAt.toDate().toISOString() : null,
    deletedBy: data.deletedBy || null,
    deletionReason: data.deletionReason || null,
    createdAt: data.createdAt ? data.createdAt.toDate().toISOString() : null,
    payment: {
      method: data.payment && data.payment.method || "unknown",
      status: paymentStatus(data),
      confirmationType: data.payment && data.payment.confirmationType || null,
      manualConfirmedAt: data.payment && data.payment.manualConfirmedAt
        ? data.payment.manualConfirmedAt.toDate().toISOString()
        : null,
      manualConfirmedBy: data.payment && data.payment.manualConfirmedBy || null
    },
    price: {
      amountMinorUnits: Number.isSafeInteger(price.amountMinorUnits) ? price.amountMinorUnits : null,
      currency: typeof price.currency === "string" ? price.currency : "",
      demandLevel: price.demandLevel || null
    }
  };
}

function reservationForClient(doc) {
  const data = doc.data();
  const priceSnapshot = data.priceSnapshot;
  return {
    id: doc.id,
    resourceId: data.resourceId,
    resourceName: data.resourceName,
    startAt: data.startAt.toDate().toISOString(),
    endAt: data.endAt.toDate().toISOString(),
    timeZone: data.timeZone,
    durationMinutes: data.durationMinutes,
    status: normalizeBookingStatus(data.status),
    payment: {
      method: data.payment && data.payment.method || "unknown",
      status: paymentStatus(data),
      ...(data.payment && data.payment.manualConfirmedAt
        ? { paidAt: data.payment.manualConfirmedAt.toDate().toISOString() }
        : {})
    },
    price: {
      amountMinorUnits: priceSnapshot.amountMinorUnits,
      currency: priceSnapshot.currency,
      ...(priceSnapshot.demandLevel ? { demandLevel: priceSnapshot.demandLevel } : {}),
      ...(Number.isInteger(priceSnapshot.durationMinutes) ? { durationMinutes: priceSnapshot.durationMinutes } : {}),
      ...(priceSnapshot.resourceId ? { resourceId: priceSnapshot.resourceId } : {}),
      ...(priceSnapshot.resourceName ? { resourceName: priceSnapshot.resourceName } : {})
    }
  };
}

function reservationEvent(doc) {
  return {
    type: doc.get("type"),
    fromStatus: doc.get("fromStatus") || null,
    toStatus: doc.get("toStatus") || null,
    fromPaymentStatus: doc.get("fromPaymentStatus") || null,
    toPaymentStatus: doc.get("toPaymentStatus") || null,
    actorId: doc.get("actorId") || null,
    reason: doc.get("reason") || null,
    createdAt: doc.get("createdAt").toDate().toISOString()
  };
}

async function customerDetailsFor(uids) {
  const uniqueUids = [...new Set(uids.filter(uid => typeof uid === "string" && uid.length > 0))];
  if (uniqueUids.length === 0) return new Map();
  const { users } = await getAuth().getUsers(uniqueUids.map(uid => ({ uid })));
  return new Map(users.map(user => [user.uid, {
    uid: user.uid,
    name: user.displayName || "",
    email: user.email || ""
  }]));
}

function serializeAdminReservations(docs, customers) {
  return docs.map(doc => {
    const uid = doc.get("userId");
    const customer = customers.get(uid) || { uid: uid || "", name: "", email: "" };
    return reservationForAdmin(doc, customer);
  });
}

function addAdminAudit(transaction, uid, action, resourceId, documentId) {
  transaction.create(db.collection(ADMIN_AUDIT).doc(), {
    actorId: uid,
    action,
    resourceId,
    documentId,
    createdAt: FieldValue.serverTimestamp()
  });
}

function bumpBookingConfigRevision(transaction, resourceRef, config) {
  const revision = Number.isSafeInteger(config.bookingConfigRevision) ? config.bookingConfigRevision : 0;
  transaction.update(resourceRef, {
    bookingConfigRevision: revision + 1,
    updatedAt: FieldValue.serverTimestamp()
  });
}

function validateWindows(windows, label) {
  if (!Array.isArray(windows)) throw new HttpsError("invalid-argument", `${label}: se esperaba una lista de franjas.`);
  let previousEnd = -1;
  for (const window of windows) {
    if (!window || typeof window !== "object") {
      throw new HttpsError("invalid-argument", `${label}: hay una franja inválida.`);
    }
    let start;
    let end;
    try {
      start = parseTime(window.start);
      end = parseTime(window.end);
    } catch (error) {
      throw new HttpsError("invalid-argument", error.message);
    }
    if (start >= end || start < previousEnd) {
      throw new HttpsError("invalid-argument", `${label}: las franjas se superponen o tienen un orden inválido.`);
    }
    previousEnd = end;
  }
}

function normalizeResourceConfiguration(data, resourceId, existing) {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new HttpsError("invalid-argument", "La configuración enviada no es válida.");
  }
  if (typeof data.enabled !== "boolean" || typeof data.timeZone !== "string") {
    throw new HttpsError("invalid-argument", "Indicá el estado del recurso y su zona horaria.");
  }
  if (data.timeZone) {
    try {
      new Intl.DateTimeFormat("en", { timeZone: data.timeZone });
    } catch {
      throw new HttpsError("invalid-argument", "La zona horaria no es válida.");
    }
  }
  if (data.startIntervalMinutes !== null
    && (!Number.isInteger(data.startIntervalMinutes) || data.startIntervalMinutes < 1)) {
    throw new HttpsError("invalid-argument", "El intervalo de inicio debe ser un número entero positivo.");
  }
  if (!data.weeklySchedule || typeof data.weeklySchedule !== "object" || Array.isArray(data.weeklySchedule)) {
    throw new HttpsError("invalid-argument", "Configurá una lista de franjas para cada día.");
  }
  for (let day = 0; day < 7; day += 1) {
    validateWindows(data.weeklySchedule[String(day)], `Día ${day}`);
  }
  const dateExceptions = data.dateExceptions || {};
  if (typeof dateExceptions !== "object" || Array.isArray(dateExceptions)) {
    throw new HttpsError("invalid-argument", "Las excepciones de fechas no son válidas.");
  }
  for (const [date, exception] of Object.entries(dateExceptions)) {
    try {
      parseDate(date);
    } catch (error) {
      throw new HttpsError("invalid-argument", error.message);
    }
    if (!exception || typeof exception !== "object" || Array.isArray(exception)) {
      throw new HttpsError("invalid-argument", `La excepción ${date} no es válida.`);
    }
    if (exception.closed !== true) {
      validateWindows(exception.windows, `Excepción ${date}`);
      if (exception.windows.length === 0) {
        throw new HttpsError("invalid-argument", `La excepción ${date} requiere horarios o el estado de cierre.`);
      }
    }
  }

  const currency = data.currency || "";
  if (currency && !/^[A-Z]{3}$/.test(currency)) {
    throw new HttpsError("invalid-argument", "La moneda debe ser un código ISO 4217 de tres letras en mayúsculas.");
  }
  if (currency) {
    try {
      new Intl.NumberFormat("en", { style: "currency", currency });
    } catch {
      throw new HttpsError("invalid-argument", "La moneda seleccionada no es válida.");
    }
  }
  const priceAmounts = data.priceAmounts || {};
  const priceByDemandLevel = {};
  for (const level of DEMAND_LEVELS) {
    const levelAmounts = priceAmounts[level] || {};
    priceByDemandLevel[level] = {};
    for (const duration of DURATIONS_MINUTES) {
      const amount = levelAmounts[String(duration)];
      if (amount === undefined || amount === "") continue;
      if (!currency) throw new HttpsError("invalid-argument", "Seleccioná la moneda antes de guardar importes.");
      try {
        priceByDemandLevel[level][duration] = {
          amountMinorUnits: amountToMinorUnits(amount, currency),
          currency
        };
      } catch (error) {
        throw new HttpsError("invalid-argument", `${level}, ${duration} min: ${error.message}`);
      }
    }
  }
  const config = {
    enabled: data.enabled,
    conflictGroupId: existing && existing.conflictGroupId || resourceId,
    timeZone: data.timeZone,
    startIntervalMinutes: data.startIntervalMinutes,
    weeklySchedule: data.weeklySchedule,
    dateExceptions,
    currency,
    priceByDemandLevel,
    bookingConfigRevision: (existing && Number.isSafeInteger(existing.bookingConfigRevision)
      ? existing.bookingConfigRevision
      : 0) + 1
  };
  if (config.enabled) {
    const problem = getConfigurationProblem(config);
    if (problem) throw new HttpsError("failed-precondition", `${problem}.`);
  }
  return config;
}

exports.listBookingResources = onCall({ region: REGION }, async () => {
  const snapshots = await Promise.all(
    RESOURCES.map(resource => db.collection(RESOURCE_CONFIGS).doc(resource.id).get())
  );
  return {
    resources: RESOURCES.map((resource, index) =>
      resourceBookingResponse(resource, snapshots[index].exists ? snapshots[index].data() : null)
    ),
    durationsMinutes: DURATIONS_MINUTES
  };
});

exports.getAdminBookingResource = onCall({ region: REGION }, async request => {
  requireAdmin(request);
  const resource = getResource(request.data && request.data.resourceId);
  const [configSnapshot, assignmentsSnapshot, blocksSnapshot] = await Promise.all([
    db.collection(RESOURCE_CONFIGS).doc(resource.id).get(),
    db.collection(DEMAND_ASSIGNMENTS).where("resourceId", "==", resource.id).get(),
    db.collection(BLOCKS).where("resourceId", "==", resource.id).get()
  ]);
  const storedConfig = configSnapshot.exists ? configSnapshot.data() : null;
  const priceAmounts = {};
  if (storedConfig) {
    for (const level of DEMAND_LEVELS) {
      priceAmounts[level] = {};
      for (const duration of DURATIONS_MINUTES) {
        const price = getPrice(storedConfig, level, duration);
        if (price) {
          priceAmounts[level][duration] = minorUnitsToDecimalString(price.amountMinorUnits, price.currency);
        }
      }
    }
  }
  const config = storedConfig ? {
    enabled: storedConfig.enabled === true,
    timeZone: storedConfig.timeZone || "",
    startIntervalMinutes: Number.isInteger(storedConfig.startIntervalMinutes)
      ? storedConfig.startIntervalMinutes
      : null,
    weeklySchedule: storedConfig.weeklySchedule || Object.fromEntries(
      Array.from({ length: 7 }, (_, day) => [String(day), []])
    ),
    dateExceptions: storedConfig.dateExceptions || {},
    currency: storedConfig.currency || "",
    priceAmounts
  } : null;
  return {
    resource,
    config,
    configurationStatus: getConfigurationProblem(storedConfig),
    assignments: assignmentsSnapshot.docs.map(serializePeriod),
    blocks: blocksSnapshot.docs.map(serializePeriod)
  };
});

exports.saveAdminBookingResource = onCall({ region: REGION }, async request => {
  const uid = requireAdmin(request);
  const resource = getResource(request.data && request.data.resourceId);
  const resourceRef = db.collection(RESOURCE_CONFIGS).doc(resource.id);
  const config = request.data && request.data.config;
  await db.runTransaction(async transaction => {
    const snapshot = await transaction.get(resourceRef);
    const existing = snapshot.exists ? snapshot.data() : null;
    const normalized = normalizeResourceConfiguration(config, resource.id, existing);
    if (existing && existing.timeZone && existing.timeZone !== normalized.timeZone) {
      const activeAssignments = await transaction.get(db.collection(DEMAND_ASSIGNMENTS)
        .where("resourceId", "==", resource.id)
        .where("active", "==", true));
      if (!activeAssignments.empty) {
        throw new HttpsError(
          "failed-precondition",
          "Desactivá las asignaciones manuales activas antes de cambiar la zona horaria."
        );
      }
    }
    transaction.set(resourceRef, {
      ...normalized,
      createdAt: existing && existing.createdAt
        ? existing.createdAt
        : FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: uid
    });
    addAdminAudit(transaction, uid, "resource_configuration_updated", resource.id, resource.id);
  });
  return { saved: true };
});

exports.saveDemandAssignment = onCall({ region: REGION }, async request => {
  const uid = requireAdmin(request);
  const data = request.data || {};
  const resource = getResource(data.resourceId);
  if (!DEMAND_LEVELS.includes(data.level)) {
    throw new HttpsError("invalid-argument", "Seleccioná uno de los cuatro niveles de demanda.");
  }
  const assignmentId = typeof data.assignmentId === "string" && /^[A-Za-z0-9_-]{1,128}$/.test(data.assignmentId)
    ? data.assignmentId
    : null;
  if (data.assignmentId && !assignmentId) {
    throw new HttpsError("invalid-argument", "La asignación solicitada no es válida.");
  }
  const assignmentRef = assignmentId
    ? db.collection(DEMAND_ASSIGNMENTS).doc(assignmentId)
    : db.collection(DEMAND_ASSIGNMENTS).doc();
  const resourceRef = db.collection(RESOURCE_CONFIGS).doc(resource.id);
  let savedId = assignmentRef.id;
  await db.runTransaction(async transaction => {
    const [configSnapshot, priorSnapshot] = await Promise.all([
      transaction.get(resourceRef),
      transaction.get(assignmentRef)
    ]);
    const config = configSnapshot.exists ? configSnapshot.data() : null;
    if (!config || typeof config.timeZone !== "string" || !config.timeZone) {
      throw new HttpsError("failed-precondition", "Configurá una zona horaria antes de asignar demanda.");
    }
    const start = localDateTime(data.startLocal, config.timeZone);
    const end = localDateTime(data.endLocal, config.timeZone);
    if (start.millis >= end.millis) {
      throw new HttpsError("invalid-argument", "El final del período debe ser posterior al inicio.");
    }
    if (assignmentId && (!priorSnapshot.exists || priorSnapshot.get("resourceId") !== resource.id)) {
      throw new HttpsError("not-found", "No se encontró la asignación para este recurso.");
    }
    const assignmentsSnapshot = await transaction.get(
      createDemandQuery(resource.id, start.millis, end.millis)
    );
    const assignments = demandAssignmentsFromSnapshot(assignmentsSnapshot)
      .filter(assignment => assignmentId !== assignment.id);
    if (hasDemandAssignmentOverlap(assignments, start.millis, end.millis)) {
      throw new HttpsError("already-exists", "El período se superpone con otra asignación activa del recurso.");
    }
    transaction.set(assignmentRef, {
      resourceId: resource.id,
      level: data.level,
      startAt: Timestamp.fromMillis(start.millis),
      endAt: Timestamp.fromMillis(end.millis),
      startLocal: data.startLocal,
      endLocal: data.endLocal,
      timeZone: config.timeZone,
      active: true,
      createdAt: priorSnapshot.exists && priorSnapshot.get("createdAt")
        ? priorSnapshot.get("createdAt")
        : FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: uid
    });
    bumpBookingConfigRevision(transaction, resourceRef, config);
    addAdminAudit(transaction, uid, assignmentId ? "demand_assignment_updated" : "demand_assignment_created", resource.id, assignmentRef.id);
    savedId = assignmentRef.id;
  });
  return { saved: true, assignmentId: savedId };
});

exports.deactivateDemandAssignment = onCall({ region: REGION }, async request => {
  const uid = requireAdmin(request);
  const assignmentId = request.data && request.data.assignmentId;
  if (typeof assignmentId !== "string" || !/^[A-Za-z0-9_-]{1,128}$/.test(assignmentId)) {
    throw new HttpsError("invalid-argument", "La asignación solicitada no es válida.");
  }
  const assignmentRef = db.collection(DEMAND_ASSIGNMENTS).doc(assignmentId);
  await db.runTransaction(async transaction => {
    const snapshot = await transaction.get(assignmentRef);
    if (!snapshot.exists) throw new HttpsError("not-found", "No se encontró la asignación.");
    const resourceId = snapshot.get("resourceId");
    const resourceRef = db.collection(RESOURCE_CONFIGS).doc(resourceId);
    const configSnapshot = await transaction.get(resourceRef);
    if (!configSnapshot.exists) throw new HttpsError("failed-precondition", "No se encontró la configuración del recurso.");
    transaction.update(assignmentRef, {
      active: false,
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: uid
    });
    bumpBookingConfigRevision(transaction, resourceRef, configSnapshot.data());
    addAdminAudit(transaction, uid, "demand_assignment_deactivated", resourceId, assignmentId);
  });
  return { saved: true };
});

exports.saveResourceBlock = onCall({ region: REGION }, async request => {
  const uid = requireAdmin(request);
  const data = request.data || {};
  const resource = getResource(data.resourceId);
  if (!["mantenimiento", "evento"].includes(data.type)
    || typeof data.reason !== "string"
    || data.reason.trim().length < 2
    || data.reason.trim().length > 500) {
    throw new HttpsError("invalid-argument", "Indicá si es mantenimiento o evento y un motivo de hasta 500 caracteres.");
  }
  if (data.blockId && (typeof data.blockId !== "string" || !/^[A-Za-z0-9_-]{1,128}$/.test(data.blockId))) {
    throw new HttpsError("invalid-argument", "El bloqueo solicitado no es válido.");
  }
  const blockRef = typeof data.blockId === "string" && /^[A-Za-z0-9_-]{1,128}$/.test(data.blockId)
    ? db.collection(BLOCKS).doc(data.blockId)
    : db.collection(BLOCKS).doc();
  const resourceRef = db.collection(RESOURCE_CONFIGS).doc(resource.id);
  await db.runTransaction(async transaction => {
    const [configSnapshot, existingSnapshot] = await Promise.all([
      transaction.get(resourceRef),
      transaction.get(blockRef)
    ]);
    const config = configSnapshot.exists ? configSnapshot.data() : null;
    if (!config || typeof config.timeZone !== "string" || !config.timeZone) {
      throw new HttpsError("failed-precondition", "Configurá una zona horaria antes de crear bloqueos.");
    }
    const start = localDateTime(data.startLocal, config.timeZone);
    const end = localDateTime(data.endLocal, config.timeZone);
    if (start.millis >= end.millis) {
      throw new HttpsError("invalid-argument", "El final del bloqueo debe ser posterior al inicio.");
    }
    if (data.blockId && (!existingSnapshot.exists || existingSnapshot.get("resourceId") !== resource.id)) {
      throw new HttpsError("not-found", "No se encontró el bloqueo para este recurso.");
    }
    transaction.set(blockRef, {
      resourceId: resource.id,
      conflictGroupId: config.conflictGroupId || resource.id,
      type: data.type,
      reason: data.reason.trim(),
      startAt: Timestamp.fromMillis(start.millis),
      endAt: Timestamp.fromMillis(end.millis),
      startLocal: data.startLocal,
      endLocal: data.endLocal,
      timeZone: config.timeZone,
      active: existingSnapshot.exists ? existingSnapshot.get("active") === true : true,
      createdAt: existingSnapshot.exists && existingSnapshot.get("createdAt")
        ? existingSnapshot.get("createdAt")
        : FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: uid
    });
    bumpBookingConfigRevision(transaction, resourceRef, config);
    addAdminAudit(transaction, uid, data.blockId ? "resource_block_updated" : "resource_block_created", resource.id, blockRef.id);
  });
  return { saved: true, blockId: blockRef.id };
});

exports.setResourceBlockActive = onCall({ region: REGION }, async request => {
  const uid = requireAdmin(request);
  const data = request.data || {};
  const resource = getResource(data.resourceId);
  if (typeof data.blockId !== "string" || !/^[A-Za-z0-9_-]{1,128}$/.test(data.blockId)
    || typeof data.active !== "boolean") {
    throw new HttpsError("invalid-argument", "El bloqueo solicitado no es válido.");
  }
  const blockRef = db.collection(BLOCKS).doc(data.blockId);
  const resourceRef = db.collection(RESOURCE_CONFIGS).doc(resource.id);
  await db.runTransaction(async transaction => {
    const [snapshot, configSnapshot] = await Promise.all([
      transaction.get(blockRef),
      transaction.get(resourceRef)
    ]);
    if (!snapshot.exists || snapshot.get("resourceId") !== resource.id) {
      throw new HttpsError("not-found", "No se encontró el bloqueo para este recurso.");
    }
    if (!configSnapshot.exists) throw new HttpsError("failed-precondition", "No se encontró la configuración del recurso.");
    if (snapshot.get("active") === data.active) return;
    transaction.update(blockRef, {
      active: data.active,
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: uid
    });
    bumpBookingConfigRevision(transaction, resourceRef, configSnapshot.data());
    addAdminAudit(transaction, uid, data.active ? "resource_block_activated" : "resource_block_deactivated", resource.id, data.blockId);
  });
  return { saved: true };
});

exports.getBookingAvailability = onCall({ region: REGION }, async request => {
  try {
    const { resourceId, date, durationMinutes } = request.data || {};
    const resource = getResource(resourceId);
    parseDate(date);
    const config = await loadConfiguration(resource.id);
    if (!DURATIONS_MINUTES.includes(durationMinutes)) {
      throw new HttpsError("invalid-argument", "La duración seleccionada no está permitida.");
    }

    const day = localDayBounds(date, config.timeZone);
    const earliest = day.start - MAX_DURATION_MINUTES * 60 * 1000;
    const [reservations, blocks, assignments] = await Promise.all([
      createAvailabilityQuery(
        db.collection(RESERVATIONS),
        config.conflictGroupId,
        earliest,
        day.end,
        null
      ).get(),
      createBlockQuery(config.conflictGroupId, day.end).get(),
      createDemandQuery(resource.id, day.start, day.end).get()
    ]);

    const reservedIntervals = reservations.docs
      .map(doc => doc.data())
      .filter(reservation => isReservationHoldingSlot(reservation.status));
    const blockedIntervals = blocks.docs.map(doc => doc.data());
    const demandAssignments = demandAssignmentsFromSnapshot(assignments);
    const slots = scheduledSlots({ date, durationMinutes, config }).map(slot => {
      const occupied = reservedIntervals.some(reservation =>
        overlaps(slot.startAt, slot.endAt, reservation.startAt.toMillis(), reservation.endAt.toMillis())
      );
      const blocked = blockedIntervals.some(block =>
        overlaps(slot.startAt, slot.endAt, block.startAt.toMillis(), block.endAt.toMillis())
      );
      if (occupied) return { ...slot, status: "reserved" };
      if (blocked) return { ...slot, status: "blocked" };
      const assignment = findDemandAssignment(demandAssignments, slot.startAt, slot.endAt);
      if (!assignment) return { ...slot, status: "unavailable" };
      const price = getPrice(config, assignment.level, durationMinutes);
      if (!price) return { ...slot, status: "unavailable" };
      return { ...slot, status: "available", demandLevel: assignment.level, price };
    });
    return {
      resource: { id: resource.id, name: resource.name },
      date,
      durationMinutes,
      slots: slots.map(slot => ({
        time: slot.time,
        startAt: new Date(slot.startAt).toISOString(),
        endAt: new Date(slot.endAt).toISOString(),
        status: slot.status,
        ...(slot.status === "available" ? {
          demandLevel: slot.demandLevel,
          price: slot.price
        } : {})
      }))
    };
  } catch (error) {
    throw firestoreError(error);
  }
});

function reservationLockId(conflictGroupId, bucketStart) {
  const groupKey = createHash("sha256").update(conflictGroupId).digest("hex").slice(0, 20);
  return `${groupKey}_${Math.floor(bucketStart / 60000)}`;
}

function requestIdFromData(value) {
  if (typeof value !== "string"
    || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)) {
    throw new HttpsError("invalid-argument", "La solicitud de reserva no es válida.");
  }
  return value;
}

exports.createBooking = onCall({ region: REGION }, async request => {
  const uid = requireAuth(request);
  try {
    const { resourceId, date, time, durationMinutes, paymentMethod } = request.data || {};
    const requestId = requestIdFromData(request.data && request.data.requestId);
    const resource = getResource(resourceId);
    parseDate(date);
    if (paymentMethod !== "in_person") {
      throw new HttpsError("failed-precondition", "Solo está habilitada la confirmación con pago presencial.");
    }
    if (!DURATIONS_MINUTES.includes(durationMinutes)) {
      throw new HttpsError("invalid-argument", "La duración seleccionada no está permitida.");
    }

    const reservationRef = db.collection(RESERVATIONS).doc();
    const eventRef = db.collection(EVENTS).doc();
    const idempotencyRef = db.collection("bookingRequests").doc(`${uid}_${requestId}`);
    const configRef = db.collection(RESOURCE_CONFIGS).doc(resource.id);

    const result = await db.runTransaction(async transaction => {
      const priorRequest = await transaction.get(idempotencyRef);
      if (priorRequest.exists) {
        const existingReservationId = priorRequest.get("reservationId");
        const existingReservation = await transaction.get(db.collection(RESERVATIONS).doc(existingReservationId));
        if (!existingReservation.exists) {
          throw new HttpsError("internal", "La clave de idempotencia apunta a una reserva inexistente.");
        }
        return {
          reservationId: existingReservationId,
          status: existingReservation.get("status"),
          repeated: true
        };
      }

      const configSnapshot = await transaction.get(configRef);
      const config = configSnapshot.exists ? configSnapshot.data() : null;
      const problem = getConfigurationProblem(config);
      if (problem) throw new HttpsError("failed-precondition", `${problem} para este recurso.`);

      const slot = validateRequestedSlot({ date, time, durationMinutes, config });
      const bucketStarts = lockBucketStarts(slot.startAt, slot.endAt);
      const lockRefs = bucketStarts.map(bucket =>
        db.collection(LOCKS).doc(reservationLockId(config.conflictGroupId, bucket))
      );
      const earliest = slot.startAt - MAX_DURATION_MINUTES * 60 * 1000;
      const [lockSnapshots, conflictingReservations, conflictingBlocks, assignmentSnapshot] = await Promise.all([
        transaction.getAll(...lockRefs),
        transaction.get(createAvailabilityQuery(
          db.collection(RESERVATIONS),
          config.conflictGroupId,
          earliest,
          slot.endAt,
          null
        )),
        transaction.get(createBlockQuery(config.conflictGroupId, slot.endAt)),
        transaction.get(createDemandQuery(resource.id, slot.startAt, slot.endAt))
      ]);

      const lockReservationIds = [...new Set(lockSnapshots
        .filter(snapshot => snapshot.exists)
        .map(snapshot => snapshot.get("reservationId"))
        .filter(reservationId => typeof reservationId === "string"))];
      const lockReservationRefs = lockReservationIds.map(reservationId =>
        db.collection(RESERVATIONS).doc(reservationId)
      );
      const lockReservationSnapshots = lockReservationRefs.length > 0
        ? await transaction.getAll(...lockReservationRefs)
        : [];
      const lockReservationById = new Map(lockReservationSnapshots.map(snapshot => [snapshot.id, snapshot]));
      const hasActiveLock = lockSnapshots.some(snapshot => {
        if (!snapshot.exists) return false;
        const reservationId = snapshot.get("reservationId");
        const reservation = typeof reservationId === "string"
          ? lockReservationById.get(reservationId)
          : null;
        return reservation && reservation.exists
          && isReservationHoldingSlot(reservation.get("status"))
          && overlaps(
            slot.startAt,
            slot.endAt,
            reservation.get("startAt").toMillis(),
            reservation.get("endAt").toMillis()
          );
      });
      if (hasActiveLock) {
        throw new HttpsError("already-exists", "Ese horario acaba de ser reservado. Consultá disponibilidad nuevamente.");
      }
      if (conflictingReservations.docs.some(doc => {
        const existing = doc.data();
        return isReservationHoldingSlot(existing.status)
          && overlaps(slot.startAt, slot.endAt, existing.startAt.toMillis(), existing.endAt.toMillis());
      })) {
        throw new HttpsError("already-exists", "Ese horario ya no está disponible.");
      }
      if (conflictingBlocks.docs.some(doc => {
        const block = doc.data();
        return overlaps(slot.startAt, slot.endAt, block.startAt.toMillis(), block.endAt.toMillis());
      })) {
        throw new HttpsError("failed-precondition", "El recurso tiene un bloqueo operativo en ese horario.");
      }

      const assignment = findDemandAssignment(
        demandAssignmentsFromSnapshot(assignmentSnapshot),
        slot.startAt,
        slot.endAt
      );
      if (!assignment) {
        throw new HttpsError("failed-precondition", "Ese horario no tiene un nivel de demanda manual asignado.");
      }
      const price = getPrice(config, assignment.level, durationMinutes);
      if (!price) {
        throw new HttpsError("failed-precondition", "Falta el precio configurado para ese nivel y duración.");
      }
      const priceSnapshot = {
        amountMinorUnits: price.amountMinorUnits,
        currency: price.currency,
        demandLevel: assignment.level,
        durationMinutes,
        resourceId: resource.id,
        resourceName: resource.name,
        appliedAt: FieldValue.serverTimestamp()
      };
      transaction.create(reservationRef, {
        userId: uid,
        resourceId: resource.id,
        resourceName: resource.name,
        conflictGroupId: config.conflictGroupId,
        startAt: Timestamp.fromMillis(slot.startAt),
        endAt: Timestamp.fromMillis(slot.endAt),
        timeZone: config.timeZone,
        durationMinutes,
        status: "pending",
        payment: { method: "in_person", status: "pending" },
        priceSnapshot,
        createdAt: FieldValue.serverTimestamp(),
        confirmedAt: FieldValue.serverTimestamp()
      });
      for (const lockRef of lockRefs) {
        transaction.set(lockRef, {
          reservationId: reservationRef.id,
          conflictGroupId: config.conflictGroupId,
          createdAt: FieldValue.serverTimestamp()
        });
      }
      transaction.create(eventRef, {
        reservationId: reservationRef.id,
        type: "created",
        fromStatus: null,
        toStatus: "pending",
        actorId: uid,
        reason: "Reserva creada; pago presencial pendiente de registración.",
        createdAt: FieldValue.serverTimestamp()
      });
      transaction.create(idempotencyRef, {
        reservationId: reservationRef.id,
        createdAt: FieldValue.serverTimestamp()
      });
      return { reservationId: reservationRef.id, repeated: false };
    });

    return { ...result, paymentMethod: "in_person", status: normalizeBookingStatus(result.status || "pending") };
  } catch (error) {
    throw firestoreError(error);
  }
});

exports.listMyBookings = onCall({ region: REGION }, async request => {
  const uid = requireAuth(request);
  const snapshot = await db.collection(RESERVATIONS)
    .where("userId", "==", uid)
    .orderBy("createdAt", "desc")
    .limit(25)
    .get();
  return { reservations: snapshot.docs.map(reservationForClient) };
});

exports.getMyBooking = onCall({ region: REGION }, async request => {
  const uid = requireAuth(request);
  const reservationId = request.data && request.data.reservationId;
  if (typeof reservationId !== "string" || !/^[A-Za-z0-9_-]{1,128}$/.test(reservationId)) {
    throw new HttpsError("invalid-argument", "La reserva solicitada no es válida.");
  }
  const snapshot = await db.collection(RESERVATIONS).doc(reservationId).get();
  if (!snapshot.exists || snapshot.get("userId") !== uid) {
    throw new HttpsError("not-found", "No se encontró esa reserva.");
  }
  const events = await db.collection(EVENTS)
    .where("reservationId", "==", reservationId)
    .orderBy("createdAt", "asc")
    .get();
  return {
    reservation: reservationForClient(snapshot),
    events: events.docs.map(doc => ({
      type: doc.get("type"),
      fromStatus: doc.get("fromStatus"),
      toStatus: doc.get("toStatus"),
      reason: doc.get("reason"),
      createdAt: doc.get("createdAt").toDate().toISOString()
    }))
  };
});

function localDateForReservation(data) {
  const timeZone = typeof data.timeZone === "string" && data.timeZone ? data.timeZone : "UTC";
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    calendar: "iso8601",
    numberingSystem: "latn",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(data.startAt.toDate());
  const values = Object.fromEntries(parts
    .filter(part => part.type !== "literal")
    .map(part => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

async function resolveCustomerUid(value) {
  if (typeof value !== "string" || value.trim().length === 0) return null;
  const identifier = value.trim();
  if (identifier.length > 320 || identifier.includes("/")) {
    throw new HttpsError("invalid-argument", "El cliente debe identificarse por UID o correo electrónico.");
  }
  if (!identifier.includes("@")) return identifier;
  try {
    return (await getAuth().getUserByEmail(identifier)).uid;
  } catch (error) {
    if (error && error.code === "auth/user-not-found") return "";
    throw error;
  }
}

function matchesAdminBookingFilters(doc, filters) {
  const data = doc.data();
  if (filters.resourceId && data.resourceId !== filters.resourceId) return false;
  if (filters.date && localDateForReservation(data) !== filters.date) return false;
  if (filters.customerUid && data.userId !== filters.customerUid) return false;
  if (filters.bookingStatus && normalizeBookingStatus(data.status) !== filters.bookingStatus) return false;
  if (filters.paymentStatus && paymentStatus(data) !== filters.paymentStatus) return false;
  if (filters.history !== isHistoricalReservation(data)) return false;
  return true;
}

exports.listAdminBookings = onCall({ region: REGION }, async request => {
  requireAdmin(request);
  const data = request.data || {};
  const resourceId = typeof data.resourceId === "string" && data.resourceId ? data.resourceId : null;
  const resource = resourceId ? getResource(resourceId) : null;
  const date = data.date === undefined || data.date === "" ? null : data.date;
  if (date !== null) {
    try {
      parseDate(date);
    } catch (error) {
      throw new HttpsError("invalid-argument", error.message);
    }
  }
  if (data.history !== undefined && typeof data.history !== "boolean") {
    throw new HttpsError("invalid-argument", "El tipo de listado solicitado no es válido.");
  }
  const history = data.history === true;
  const bookingStatus = data.bookingStatus || null;
  const selectedPaymentStatus = data.paymentStatus || null;
  if (bookingStatus && !BOOKING_STATUSES.includes(bookingStatus)) {
    throw new HttpsError("invalid-argument", "El estado de reserva solicitado no es válido.");
  }
  if (selectedPaymentStatus && !["pending", "paid"].includes(selectedPaymentStatus)) {
    throw new HttpsError("invalid-argument", "El estado de pago solicitado no es válido.");
  }
  const customerUid = await resolveCustomerUid(data.customer);
  const searchId = typeof data.searchId === "string" ? data.searchId.trim() : "";
  if (searchId && !/^[A-Za-z0-9_-]{1,128}$/.test(searchId)) {
    throw new HttpsError("invalid-argument", "El identificador de reserva no es válido.");
  }
  const pageToken = data.pageToken;
  if (pageToken !== undefined && (searchId || typeof pageToken !== "string"
    || !/^[A-Za-z0-9_-]{1,128}$/.test(pageToken))) {
    throw new HttpsError("invalid-argument", "El cursor de consulta no es válido.");
  }

  let resourceConfig = null;
  if (resource) {
    const configSnapshot = await db.collection(RESOURCE_CONFIGS).doc(resource.id).get();
    resourceConfig = configSnapshot.exists ? configSnapshot.data() : null;
  }
  if (resource && (!resourceConfig
    || typeof resourceConfig.conflictGroupId !== "string"
    || !resourceConfig.conflictGroupId)) {
    throw new HttpsError("failed-precondition", "El recurso no tiene un grupo de conflicto configurado.");
  }

  let bounds = null;
  if (date) {
    if (resourceConfig && typeof resourceConfig.timeZone === "string" && resourceConfig.timeZone) {
      bounds = localDayBounds(date, resourceConfig.timeZone);
    } else {
      const utcDayStart = Date.parse(`${date}T00:00:00.000Z`);
      bounds = { start: utcDayStart - 24 * 60 * 60 * 1000, end: utcDayStart + 48 * 60 * 60 * 1000 };
    }
  }

  const filters = {
    resourceId,
    date,
    customerUid,
    bookingStatus,
    paymentStatus: selectedPaymentStatus,
    history
  };
  let matchingDocs = [];
  let nextPageToken = null;
  if (customerUid === "") {
    return { reservations: [], nextPageToken: null };
  }

  if (searchId) {
    const snapshot = await db.collection(RESERVATIONS).doc(searchId).get();
    if (snapshot.exists && matchesAdminBookingFilters(snapshot, filters)) matchingDocs = [snapshot];
  } else {
    let query = db.collection(RESERVATIONS);
    if (customerUid) query = query.where("userId", "==", customerUid);
    else if (resourceConfig) query = query.where("conflictGroupId", "==", resourceConfig.conflictGroupId);
    if (bounds) {
      query = query
        .where("startAt", ">=", Timestamp.fromMillis(bounds.start))
        .where("startAt", "<", Timestamp.fromMillis(bounds.end));
    }
    query = query.orderBy("startAt", "desc");

    let cursor = null;
    if (pageToken) {
      cursor = await db.collection(RESERVATIONS).doc(pageToken).get();
      if (!cursor.exists
        || (customerUid && cursor.get("userId") !== customerUid)
        || (resourceConfig && !customerUid && cursor.get("conflictGroupId") !== resourceConfig.conflictGroupId)
        || (bounds && (cursor.get("startAt").toMillis() < bounds.start
          || cursor.get("startAt").toMillis() >= bounds.end))) {
        throw new HttpsError("invalid-argument", "El cursor no pertenece a esta consulta.");
      }
    }
    let scanned = 0;
    let exhausted = false;
    while (matchingDocs.length < ADMIN_BOOKING_PAGE_SIZE && scanned < ADMIN_BOOKING_MAX_SCAN) {
      let pageQuery = query.limit(ADMIN_BOOKING_SCAN_SIZE);
      if (cursor) pageQuery = pageQuery.startAfter(cursor);
      const snapshot = await pageQuery.get();
      if (snapshot.empty) {
        exhausted = true;
        break;
      }
      for (const doc of snapshot.docs) {
        cursor = doc;
        scanned += 1;
        if (matchesAdminBookingFilters(doc, filters)) matchingDocs.push(doc);
        if (matchingDocs.length === ADMIN_BOOKING_PAGE_SIZE) break;
      }
      if (matchingDocs.length === ADMIN_BOOKING_PAGE_SIZE) {
        nextPageToken = cursor.id;
        break;
      }
      if (snapshot.size < ADMIN_BOOKING_SCAN_SIZE) {
        exhausted = true;
        break;
      }
    }
    if (!exhausted && matchingDocs.length < ADMIN_BOOKING_PAGE_SIZE && cursor) {
      nextPageToken = cursor.id;
    }
  }

  const customers = await customerDetailsFor(matchingDocs.map(doc => doc.get("userId")));
  return {
    reservations: serializeAdminReservations(matchingDocs, customers),
    nextPageToken
  };
});

exports.getAdminBooking = onCall({ region: REGION }, async request => {
  requireAdmin(request);
  const reservationId = request.data && request.data.reservationId;
  if (typeof reservationId !== "string" || !/^[A-Za-z0-9_-]{1,128}$/.test(reservationId)) {
    throw new HttpsError("invalid-argument", "La reserva solicitada no es válida.");
  }
  const snapshot = await db.collection(RESERVATIONS).doc(reservationId).get();
  if (!snapshot.exists) throw new HttpsError("not-found", "No se encontró esa reserva.");
  const events = await db.collection(EVENTS)
    .where("reservationId", "==", reservationId)
    .orderBy("createdAt", "asc")
    .get();
  const customers = await customerDetailsFor([snapshot.get("userId")]);
  return {
    reservation: reservationForAdmin(snapshot, customers.get(snapshot.get("userId")) || {
      uid: snapshot.get("userId") || "",
      name: "",
      email: ""
    }),
    events: events.docs.map(reservationEvent)
  };
});

exports.setAdminBookingStatus = onCall({ region: REGION }, async request => {
  const uid = requireAdmin(request);
  const { reservationId, status, reason } = request.data || {};
  if (typeof reservationId !== "string" || !/^[A-Za-z0-9_-]{1,128}$/.test(reservationId)
    || !["in_progress", "completed"].includes(status)
    || typeof reason !== "string" || reason.trim().length < 2 || reason.trim().length > 500) {
    throw new HttpsError("invalid-argument", "Indicá una reserva, un estado operativo y un motivo de hasta 500 caracteres.");
  }
  const reservationRef = db.collection(RESERVATIONS).doc(reservationId);
  const eventRef = db.collection(EVENTS).doc();
  const result = await db.runTransaction(async transaction => {
    const reservationSnapshot = await transaction.get(reservationRef);
    if (!reservationSnapshot.exists) throw new HttpsError("not-found", "No se encontró esa reserva.");
    const currentStatus = reservationSnapshot.get("status");
    const currentCanonicalStatus = normalizeBookingStatus(currentStatus);
    if (currentCanonicalStatus === status) return { changed: false, status };
    if (!isBookingStatusTransitionAllowed(currentStatus, status)) {
      throw new HttpsError("failed-precondition", "La transición de estado solicitada no está permitida.");
    }
    const lockQuery = db.collection(LOCKS).where("reservationId", "==", reservationId);
    const locks = status === "completed" ? await transaction.get(lockQuery) : null;
    transaction.update(reservationRef, {
      status,
      ...(!BOOKING_STATUSES.includes(currentStatus) && !reservationSnapshot.get("legacyStatus")
        ? { legacyStatus: currentStatus || "unknown" }
        : {}),
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: uid
    });
    transaction.create(eventRef, {
      reservationId,
      type: "status_changed",
      fromStatus: currentStatus,
      toStatus: status,
      actorId: uid,
      reason: reason.trim(),
      createdAt: FieldValue.serverTimestamp()
    });
    if (locks) locks.docs.forEach(lock => transaction.delete(lock.ref));
    addAdminAudit(transaction, uid, "reservation_status_changed", reservationSnapshot.get("resourceId"), reservationId);
    return { changed: true, status };
  });
  return result;
});

exports.markAdminBookingPaid = onCall({ region: REGION }, async request => {
  const uid = requireAdmin(request);
  const reservationId = request.data && request.data.reservationId;
  if (typeof reservationId !== "string" || !/^[A-Za-z0-9_-]{1,128}$/.test(reservationId)) {
    throw new HttpsError("invalid-argument", "La reserva solicitada no es válida.");
  }
  const reservationRef = db.collection(RESERVATIONS).doc(reservationId);
  const eventRef = db.collection(EVENTS).doc();
  return db.runTransaction(async transaction => {
    const snapshot = await transaction.get(reservationRef);
    if (!snapshot.exists) throw new HttpsError("not-found", "No se encontró esa reserva.");
    const payment = snapshot.get("payment") || {};
    if (payment.status === "paid") return { changed: false, paymentStatus: "paid" };
    if (payment.method !== "in_person") {
      throw new HttpsError(
        "failed-precondition",
        "Solo se puede registrar manualmente un pago presencial. Los pagos online requieren verificación del proveedor."
      );
    }
    const resourceId = snapshot.get("resourceId");
    transaction.update(reservationRef, {
      payment: {
        ...payment,
        status: "paid",
        confirmationType: "manual_admin",
        manualConfirmedAt: FieldValue.serverTimestamp(),
        manualConfirmedBy: uid
      },
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: uid
    });
    transaction.create(eventRef, {
      reservationId,
      type: "payment_marked_paid",
      fromPaymentStatus: payment.status || "pending",
      toPaymentStatus: "paid",
      actorId: uid,
      reason: "Pago presencial registrado manualmente por administración; no implica un cobro mediante Mercado Pago.",
      createdAt: FieldValue.serverTimestamp()
    });
    addAdminAudit(transaction, uid, "reservation_payment_marked_paid", resourceId, reservationId);
    return { changed: true, paymentStatus: "paid" };
  });
});

exports.deleteAdminBooking = onCall({ region: REGION }, async request => {
  const uid = requireAdmin(request);
  const { reservationId, reason } = request.data || {};
  if (typeof reservationId !== "string" || !/^[A-Za-z0-9_-]{1,128}$/.test(reservationId)
    || typeof reason !== "string" || reason.trim().length < 2 || reason.trim().length > 500) {
    throw new HttpsError("invalid-argument", "Indicá la reserva y un motivo de eliminación de hasta 500 caracteres.");
  }
  const reservationRef = db.collection(RESERVATIONS).doc(reservationId);
  const eventRef = db.collection(EVENTS).doc();
  return db.runTransaction(async transaction => {
    const snapshot = await transaction.get(reservationRef);
    if (!snapshot.exists) throw new HttpsError("not-found", "No se encontró esa reserva.");
    if (snapshot.get("deletedAt")) return { changed: false, status: "cancelled" };
    const currentStatus = snapshot.get("status");
    const canonicalStatus = normalizeBookingStatus(currentStatus);
    if (canonicalStatus === "completed" || canonicalStatus === "unknown") {
      throw new HttpsError("failed-precondition", "No se puede cancelar una reserva finalizada o con un estado no reconocido.");
    }
    if (canonicalStatus !== "cancelled" && !isBookingStatusTransitionAllowed(currentStatus, "cancelled")) {
      throw new HttpsError("failed-precondition", "La transición a cancelada no está permitida.");
    }
    const locks = await transaction.get(db.collection(LOCKS).where("reservationId", "==", reservationId));
    const resourceId = snapshot.get("resourceId");
    transaction.update(reservationRef, {
      status: "cancelled",
      ...(BOOKING_STATUSES.includes(currentStatus) ? {} : { legacyStatus: currentStatus || "unknown" }),
      deletedAt: FieldValue.serverTimestamp(),
      deletedBy: uid,
      deletionReason: reason.trim(),
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: uid
    });
    transaction.create(eventRef, {
      reservationId,
      type: "reservation_soft_deleted",
      fromStatus: currentStatus || null,
      toStatus: "cancelled",
      actorId: uid,
      reason: reason.trim(),
      createdAt: FieldValue.serverTimestamp()
    });
    locks.docs.forEach(lock => transaction.delete(lock.ref));
    addAdminAudit(transaction, uid, "reservation_soft_deleted", resourceId, reservationId);
    return { changed: true, status: "cancelled" };
  });
});
