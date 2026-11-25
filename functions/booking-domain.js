const DURATIONS_MINUTES = Object.freeze([30, 45, 60, 75, 90, 105, 120]);
const DEMAND_LEVELS = Object.freeze(["baja", "normal", "alta", "muy_alta"]);
const MAX_DURATION_MINUTES = 120;
const LOCK_BUCKET_MINUTES = 15;
const BOOKING_STATUSES = Object.freeze(["pending", "in_progress", "completed", "cancelled"]);
const TERMINAL_BOOKING_STATUSES = Object.freeze(["completed", "cancelled"]);
const NON_RESERVING_STATUSES = Object.freeze(["completed", "cancelled", "revoked", "no_show"]);

const RESOURCES = Object.freeze([
  { id: "basketball", name: "Básquet" },
  { id: "volleyball", name: "Vóley" },
  { id: "indoor-soccer-5", name: "Fútbol 5 cubierto" },
  { id: "outdoor-soccer-5", name: "Fútbol 5 exterior" },
  { id: "outdoor-tennis", name: "Tenis exterior" },
  { id: "padel", name: "Pádel" },
  { id: "table-tennis-1", name: "Tenis de mesa 1" },
  { id: "table-tennis-2", name: "Tenis de mesa 2" },
  { id: "table-tennis-3", name: "Tenis de mesa 3" },
  { id: "table-tennis-4", name: "Tenis de mesa 4" }
]);

function parseDate(date) {
  if (typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new Error("La fecha debe tener el formato AAAA-MM-DD.");
  }
  const parsed = new Date(`${date}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date) {
    throw new Error("La fecha seleccionada no es válida.");
  }
  return parsed;
}

function parseTime(time) {
  if (typeof time !== "string" || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) {
    throw new Error("El horario seleccionado no es válido.");
  }
  const [hour, minute] = time.split(":").map(Number);
  return hour * 60 + minute;
}

function dateTimeParts(epochMillis, timeZone) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    calendar: "iso8601",
    numberingSystem: "latn",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23"
  });
  const parts = Object.fromEntries(
    formatter.formatToParts(new Date(epochMillis))
      .filter(part => part.type !== "literal")
      .map(part => [part.type, Number(part.value)])
  );
  return {
    year: parts.year,
    month: parts.month,
    day: parts.day,
    hour: parts.hour,
    minute: parts.minute
  };
}

function sameLocalTime(parts, date, time) {
  return parts.year === Number(date.slice(0, 4))
    && parts.month === Number(date.slice(5, 7))
    && parts.day === Number(date.slice(8, 10))
    && parts.hour === Number(time.slice(0, 2))
    && parts.minute === Number(time.slice(3, 5));
}

function localDateTimeToEpoch(date, time, timeZone) {
  parseDate(date);
  parseTime(time);
  const target = Date.UTC(
    Number(date.slice(0, 4)),
    Number(date.slice(5, 7)) - 1,
    Number(date.slice(8, 10)),
    Number(time.slice(0, 2)),
    Number(time.slice(3, 5))
  );
  const offsets = new Set();
  for (const hours of [-48, -24, 0, 24, 48]) {
    const sample = target + hours * 60 * 60 * 1000;
    const parts = dateTimeParts(sample, timeZone);
    const wallClock = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute);
    offsets.add(wallClock - sample);
  }
  const matches = [...offsets]
    .map(offset => target - offset)
    .filter(candidate => sameLocalTime(dateTimeParts(candidate, timeZone), date, time));
  const uniqueMatches = [...new Set(matches)];
  if (uniqueMatches.length === 0) {
    throw new Error("Ese horario no existe en la zona horaria configurada.");
  }
  if (uniqueMatches.length > 1) {
    throw new Error("Ese horario es ambiguo por el cambio de hora y no puede reservarse.");
  }
  return uniqueMatches[0];
}

function addCalendarDays(date, days) {
  const parsed = parseDate(date);
  parsed.setUTCDate(parsed.getUTCDate() + days);
  return parsed.toISOString().slice(0, 10);
}

function localDayBounds(date, timeZone) {
  return {
    start: localDateTimeToEpoch(date, "00:00", timeZone),
    end: localDateTimeToEpoch(addCalendarDays(date, 1), "00:00", timeZone)
  };
}

function overlaps(startA, endA, startB, endB) {
  return startA < endB && startB < endA;
}

function normalizeBookingStatus(status) {
  if (status === "confirmed" || status === "awaiting_payment") return "pending";
  if (status === "revoked" || status === "no_show") return "cancelled";
  return BOOKING_STATUSES.includes(status) ? status : "unknown";
}

function isBookingStatusTransitionAllowed(currentStatus, nextStatus) {
  const current = normalizeBookingStatus(currentStatus);
  if (nextStatus === "in_progress") return current === "pending";
  if (nextStatus === "completed") return current === "in_progress";
  if (nextStatus === "cancelled") return current === "pending" || current === "in_progress";
  return false;
}

function isReservationHoldingSlot(status) {
  return !NON_RESERVING_STATUSES.includes(status);
}

function validScheduleWindows(windows) {
  if (!Array.isArray(windows)) return false;
  let previousEnd = -1;
  for (const window of windows) {
    try {
      if (typeof window !== "object" || window === null) return false;
      const start = parseTime(window.start);
      const end = parseTime(window.end);
      if (start >= end || start < previousEnd) return false;
      previousEnd = end;
    } catch {
      return false;
    }
  }
  return true;
}

function lockBucketStarts(startMillis, endMillis) {
  const bucketMillis = LOCK_BUCKET_MINUTES * 60 * 1000;
  const first = Math.floor(startMillis / bucketMillis);
  const last = Math.floor((endMillis - 1) / bucketMillis);
  return Array.from({ length: last - first + 1 }, (_, index) => (first + index) * bucketMillis);
}

function getConfigurationProblem(config) {
  if (!config || config.enabled !== true) return "Configuración pendiente";
  if (typeof config.conflictGroupId !== "string" || !config.conflictGroupId.trim()) {
    return "Falta el grupo de conflicto";
  }
  if (typeof config.timeZone !== "string" || !config.timeZone.trim()) return "Falta la zona horaria";
  try {
    new Intl.DateTimeFormat("en", { timeZone: config.timeZone });
  } catch {
    return "La zona horaria no es válida";
  }
  if (!Number.isInteger(config.startIntervalMinutes) || config.startIntervalMinutes < 1) {
    return "Falta el intervalo de inicio";
  }
  if (!config.weeklySchedule || typeof config.weeklySchedule !== "object") {
    return "Faltan los horarios";
  }
  for (let day = 0; day < 7; day += 1) {
    if (!Array.isArray(config.weeklySchedule[String(day)])) return "Faltan horarios configurados para todos los días";
  }
  let hasSchedule = false;
  for (const [day, windows] of Object.entries(config.weeklySchedule)) {
    if (!/^[0-6]$/.test(day) || !Array.isArray(windows)) return "Hay una configuración de horarios inválida";
    if (!validScheduleWindows(windows)) return "Hay horarios superpuestos o inválidos";
    if (windows.length > 0) hasSchedule = true;
  }
  if (!hasSchedule) return "Faltan los horarios";
  if (config.dateExceptions !== undefined) {
    if (!config.dateExceptions || typeof config.dateExceptions !== "object" || Array.isArray(config.dateExceptions)) {
      return "Hay excepciones de fechas inválidas";
    }
    for (const [date, exception] of Object.entries(config.dateExceptions)) {
      try {
        parseDate(date);
      } catch {
        return "Hay excepciones de fechas inválidas";
      }
      if (!exception || typeof exception !== "object" || Array.isArray(exception)) {
        return "Hay excepciones de fechas inválidas";
      }
      if (exception.closed === true) continue;
      if (!validScheduleWindows(exception.windows) || exception.windows.length === 0) {
        return "Hay horarios de excepción inválidos";
      }
    }
  }
  return null;
}

function getPrice(config, demandLevel, durationMinutes) {
  if (!DEMAND_LEVELS.includes(demandLevel) || !DURATIONS_MINUTES.includes(durationMinutes)) return null;
  const price = config && config.priceByDemandLevel
    && config.priceByDemandLevel[demandLevel]
    && config.priceByDemandLevel[demandLevel][durationMinutes];
  if (!price
    || !Number.isSafeInteger(price.amountMinorUnits)
    || price.amountMinorUnits < 0
    || typeof price.currency !== "string"
    || !/^[A-Z]{3}$/.test(price.currency)) return null;
  return { amountMinorUnits: price.amountMinorUnits, currency: price.currency };
}

function findDemandAssignment(assignments, startAt, endAt) {
  const matches = assignments.filter(assignment =>
    assignment.active === true
    && assignment.startAtMillis <= startAt
    && assignment.endAtMillis >= endAt
  );
  return matches.length === 1 ? matches[0] : null;
}

function hasDemandAssignmentOverlap(assignments, startAt, endAt, excludedId = null) {
  return assignments.some(assignment =>
    assignment.active === true
    && assignment.id !== excludedId
    && overlaps(startAt, endAt, assignment.startAtMillis, assignment.endAtMillis)
  );
}

function scheduledSlots({ date, durationMinutes, config, nowMillis = Date.now() }) {
  parseDate(date);
  if (!DURATIONS_MINUTES.includes(durationMinutes)) {
    throw new Error("La duración seleccionada no está permitida.");
  }
  const problem = getConfigurationProblem(config);
  if (problem) throw new Error(problem);

  const exception = config.dateExceptions && config.dateExceptions[date];
  if (exception && exception.closed === true) return [];
  const weekday = parseDate(date).getUTCDay();
  const windows = exception ? exception.windows : config.weeklySchedule[String(weekday)] || [];
  const slots = [];
  for (const window of windows) {
    const windowStart = parseTime(window.start);
    const windowEnd = parseTime(window.end);
    if (windowEnd <= windowStart) throw new Error("Hay un horario de apertura inválido.");
    for (let minute = windowStart; minute + durationMinutes <= windowEnd; minute += config.startIntervalMinutes) {
      const time = `${String(Math.floor(minute / 60)).padStart(2, "0")}:${String(minute % 60).padStart(2, "0")}`;
      const endMinute = minute + durationMinutes;
      const endTime = `${String(Math.floor(endMinute / 60)).padStart(2, "0")}:${String(endMinute % 60).padStart(2, "0")}`;
      const startAt = localDateTimeToEpoch(date, time, config.timeZone);
      const endAt = localDateTimeToEpoch(date, endTime, config.timeZone);
      if (startAt > nowMillis) slots.push({ time, startAt, endAt });
    }
  }
  return slots;
}

function validateRequestedSlot({ date, time, durationMinutes, config, nowMillis = Date.now() }) {
  const requestedStart = localDateTimeToEpoch(date, time, config.timeZone);
  const slot = scheduledSlots({ date, durationMinutes, config, nowMillis })
    .find(candidate => candidate.startAt === requestedStart);
  if (!slot) throw new Error("El horario ya no es válido según la configuración actual.");
  return slot;
}

module.exports = {
  DEMAND_LEVELS,
  DURATIONS_MINUTES,
  BOOKING_STATUSES,
  LOCK_BUCKET_MINUTES,
  MAX_DURATION_MINUTES,
  NON_RESERVING_STATUSES,
  RESOURCES,
  TERMINAL_BOOKING_STATUSES,
  addCalendarDays,
  getConfigurationProblem,
  getPrice,
  findDemandAssignment,
  hasDemandAssignmentOverlap,
  isBookingStatusTransitionAllowed,
  isReservationHoldingSlot,
  normalizeBookingStatus,
  localDateTimeToEpoch,
  localDayBounds,
  lockBucketStarts,
  overlaps,
  parseDate,
  parseTime,
  scheduledSlots,
  validateRequestedSlot
};
