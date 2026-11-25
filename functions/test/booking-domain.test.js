const test = require("node:test");
const assert = require("node:assert/strict");
const {
  DEMAND_LEVELS,
  DURATIONS_MINUTES,
  isBookingStatusTransitionAllowed,
  findDemandAssignment,
  getConfigurationProblem,
  getPrice,
  hasDemandAssignmentOverlap,
  isReservationHoldingSlot,
  localDateTimeToEpoch,
  lockBucketStarts,
  normalizeBookingStatus,
  overlaps,
  scheduledSlots
} = require("../booking-domain");
const { amountToMinorUnits, hasAdminClaim } = require("../admin-domain");

const validConfig = {
  enabled: true,
  conflictGroupId: "court-a",
  timeZone: "America/Argentina/Buenos_Aires",
  startIntervalMinutes: 30,
  weeklySchedule: Object.fromEntries(
    Array.from({ length: 7 }, (_, day) => [
      String(day),
      day === 1 ? [{ start: "09:00", end: "11:00" }] : []
    ])
  ),
  priceByDemandLevel: Object.fromEntries(DEMAND_LEVELS.map((level, levelIndex) => [
    level,
    Object.fromEntries(DURATIONS_MINUTES.map(duration => [
      duration,
      { amountMinorUnits: levelIndex * 1000 + duration, currency: "ARS" }
    ]))
  ]))
};

test("resources are unavailable until enabled with a complete timezone, interval, and weekly schedule", () => {
  assert.equal(getConfigurationProblem(null), "Configuración pendiente");
  assert.equal(getConfigurationProblem({ ...validConfig, enabled: false }), "Configuración pendiente");
  assert.match(getConfigurationProblem({
    ...validConfig,
    weeklySchedule: { "1": [{ start: "09:00", end: "11:00" }] }
  }), /todos los días/);
  assert.equal(getConfigurationProblem(validConfig), null);
});

test("availability uses configured local opening hours, intervals, and date exceptions", () => {
  const slots = scheduledSlots({
    date: "2026-11-30",
    durationMinutes: 60,
    config: validConfig,
    nowMillis: Date.parse("2026-11-29T00:00:00Z")
  });
  assert.deepEqual(slots.map(slot => slot.time), ["09:00", "09:30", "10:00"]);
  assert.equal(new Date(slots[0].startAt).toISOString(), "2026-11-30T12:00:00.000Z");
  const changedConfig = {
    ...validConfig,
    startIntervalMinutes: 60,
    dateExceptions: { "2026-11-30": { windows: [{ start: "13:00", end: "14:00" }] } }
  };
  assert.deepEqual(scheduledSlots({
    date: "2026-11-30",
    durationMinutes: 30,
    config: changedConfig,
    nowMillis: Date.parse("2026-11-29T00:00:00Z")
  }).map(slot => slot.time), ["13:00"]);
  assert.deepEqual(scheduledSlots({
    date: "2026-11-30",
    durationMinutes: 30,
    config: { ...changedConfig, dateExceptions: { "2026-11-30": { closed: true } } },
    nowMillis: Date.parse("2026-11-29T00:00:00Z")
  }), []);
  assert.match(getConfigurationProblem({
    ...validConfig,
    dateExceptions: { "2026-11-30": { windows: [] } }
  }), /excepción/);
  assert.throws(() => scheduledSlots({
    date: "2026-11-30",
    durationMinutes: 20,
    config: validConfig,
    nowMillis: 0
  }), /duración/);
});

test("manual demand assignments support exactly the four configured levels", () => {
  const start = Date.parse("2026-11-30T12:00:00Z");
  const end = start + 60 * 60 * 1000;
  for (const level of DEMAND_LEVELS) {
    const assignment = {
      id: level,
      active: true,
      level,
      startAtMillis: start,
      endAtMillis: end
    };
    assert.equal(findDemandAssignment([assignment], start, end).level, level);
  }
  assert.deepEqual(DEMAND_LEVELS, ["baja", "normal", "alta", "muy_alta"]);
});

test("every supported duration has its own manual price and incomplete prices are not offered", () => {
  for (const level of DEMAND_LEVELS) {
    for (const duration of DURATIONS_MINUTES) {
      assert.deepEqual(getPrice(validConfig, level, duration), {
        amountMinorUnits: DEMAND_LEVELS.indexOf(level) * 1000 + duration,
        currency: "ARS"
      });
    }
  }
  const partialConfig = {
    ...validConfig,
    priceByDemandLevel: { normal: { 60: { amountMinorUnits: 0, currency: "ARS" } } }
  };
  assert.deepEqual(getPrice(partialConfig, "normal", 60), { amountMinorUnits: 0, currency: "ARS" });
  assert.equal(getPrice(partialConfig, "alta", 60), null);
  assert.equal(getPrice(partialConfig, "normal", 45), null);
  assert.equal(findDemandAssignment([], 100, 200), null);
});

test("overlapping demand periods are rejected while adjacent periods are allowed", () => {
  const period = {
    id: "one",
    active: true,
    startAtMillis: 100,
    endAtMillis: 200
  };
  assert.equal(hasDemandAssignmentOverlap([period], 150, 250), true);
  assert.equal(hasDemandAssignmentOverlap([period], 200, 300), false);
  assert.equal(hasDemandAssignmentOverlap([period], 150, 250, "one"), false);
});

test("date-time conversion rejects ambiguous and nonexistent daylight-saving local times", () => {
  assert.throws(
    () => localDateTimeToEpoch("2026-03-08", "02:30", "America/New_York"),
    /no existe/
  );
  assert.throws(
    () => localDateTimeToEpoch("2026-11-01", "01:30", "America/New_York"),
    /ambiguo/
  );
});

test("only a server-issued boolean admin custom claim authorizes administration", () => {
  assert.equal(hasAdminClaim(null), false);
  assert.equal(hasAdminClaim({ uid: "customer", token: {} }), false);
  assert.equal(hasAdminClaim({ uid: "customer", token: { admin: "true" } }), false);
  assert.equal(hasAdminClaim({ uid: "admin", token: { admin: true } }), true);
});

test("legacy reservation states normalize without erasing their stored meanings", () => {
  assert.equal(normalizeBookingStatus("confirmed"), "pending");
  assert.equal(normalizeBookingStatus("awaiting_payment"), "pending");
  assert.equal(normalizeBookingStatus("revoked"), "cancelled");
  assert.equal(normalizeBookingStatus("no_show"), "cancelled");
  assert.equal(normalizeBookingStatus("unrecognized"), "unknown");
  assert.equal(isReservationHoldingSlot("confirmed"), true);
  assert.equal(isReservationHoldingSlot("pending"), true);
  assert.equal(isReservationHoldingSlot("in_progress"), true);
  assert.equal(isReservationHoldingSlot("completed"), false);
  assert.equal(isReservationHoldingSlot("cancelled"), false);
});

test("booking status transitions reject reopening finalized reservations", () => {
  assert.equal(isBookingStatusTransitionAllowed("confirmed", "in_progress"), true);
  assert.equal(isBookingStatusTransitionAllowed("pending", "in_progress"), true);
  assert.equal(isBookingStatusTransitionAllowed("in_progress", "completed"), true);
  assert.equal(isBookingStatusTransitionAllowed("pending", "cancelled"), true);
  assert.equal(isBookingStatusTransitionAllowed("in_progress", "cancelled"), true);
  assert.equal(isBookingStatusTransitionAllowed("pending", "completed"), false);
  assert.equal(isBookingStatusTransitionAllowed("completed", "in_progress"), false);
  assert.equal(isBookingStatusTransitionAllowed("cancelled", "pending"), false);
});

test("configured currency precision is converted exactly without floating-point pricing", () => {
  assert.equal(amountToMinorUnits("123.45", "ARS"), 12345);
  assert.equal(amountToMinorUnits("123", "JPY"), 123);
  assert.throws(() => amountToMinorUnits("1.234", "ARS"), /decimales/);
  assert.throws(() => amountToMinorUnits("-1", "ARS"), /decimal válido/);
});

test("15-minute lock buckets cover occupied intervals and prevent overlapping reservations", () => {
  const start = Date.parse("2026-11-30T12:14:00Z");
  const end = Date.parse("2026-11-30T12:44:00Z");
  assert.deepEqual(
    lockBucketStarts(start, end).map(value => new Date(value).toISOString()),
    ["2026-11-30T12:00:00.000Z", "2026-11-30T12:15:00.000Z", "2026-11-30T12:30:00.000Z"]
  );
  assert.equal(overlaps(start, end, end, end + 60_000), false);
  assert.equal(overlaps(start, end, end - 60_000, end + 60_000), true);
});

test("all supported overlapping booking durations share an atomic lock bucket", () => {
  for (let startMinute = 0; startMinute < 60; startMinute += 1) {
    for (const firstDuration of DURATIONS_MINUTES) {
      for (const secondDuration of DURATIONS_MINUTES) {
        for (let offset = -secondDuration + 1; offset < firstDuration; offset += 1) {
          const firstStart = startMinute * 60_000;
          const firstEnd = firstStart + firstDuration * 60_000;
          const secondStart = firstStart + offset * 60_000;
          const secondEnd = secondStart + secondDuration * 60_000;
          const firstLocks = new Set(lockBucketStarts(firstStart, firstEnd));
          const secondLocks = lockBucketStarts(secondStart, secondEnd);
          assert.ok(secondLocks.some(bucket => firstLocks.has(bucket)));
        }
      }
    }
  }
});
