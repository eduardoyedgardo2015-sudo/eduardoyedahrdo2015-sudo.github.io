import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/13.4.0/firebase-auth.js";
import { auth, callFunction } from "./firebase/client.js";

const listResources = callFunction("listBookingResources");
const getAdminResource = callFunction("getAdminBookingResource");
const saveResource = callFunction("saveAdminBookingResource");
const saveAssignment = callFunction("saveDemandAssignment");
const deactivateAssignment = callFunction("deactivateDemandAssignment");
const saveBlock = callFunction("saveResourceBlock");
const setBlockActive = callFunction("setResourceBlockActive");
const listAdminBookings = callFunction("listAdminBookings");
const getAdminBooking = callFunction("getAdminBooking");
const setAdminBookingStatus = callFunction("setAdminBookingStatus");
const markAdminBookingPaid = callFunction("markAdminBookingPaid");
const deleteAdminBooking = callFunction("deleteAdminBooking");
const durations = [30, 45, 60, 75, 90, 105, 120];
const levels = [
  { id: "baja", name: "Baja" },
  { id: "normal", name: "Normal" },
  { id: "alta", name: "Alta" },
  { id: "muy_alta", name: "Muy alta" }
];
const weekdays = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const $ = selector => document.querySelector(selector);

function formatPrice(price) {
  if (!price || typeof price.amountMinorUnits !== "number"
      || typeof price.currency !== "string") {
    return "Importe no disponible";
  }

  const formatter = new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: price.currency
  });

  const fractionDigits = formatter.resolvedOptions().maximumFractionDigits;
  return formatter.format(price.amountMinorUnits / (10 ** fractionDigits));
}

const authForm = $("#admin-auth-form");
const authStatus = $("#admin-auth-status");
const adminWorkspace = $("#admin-workspace");
const resourceSelect = $("#admin-resource-select");
const configStatus = $("#configuration-status");
const weeklySchedule = $("#weekly-schedule");
const exceptionList = $("#exception-list");
const pricingGrid = $("#pricing-grid");
const demandList = $("#demand-list");
const blockList = $("#block-list");
const adminBookingsDate = $("#admin-bookings-date");
const adminBookingsResource = $("#admin-bookings-resource");
const adminBookingsList = $("#admin-bookings-list");
const adminBookingDetail = $("#admin-booking-detail");
const adminBookingDetailContent = $("#admin-booking-detail-content");
const adminBookingDetailActions = $("#admin-booking-detail-actions");

let currentUser = null;
let resources = [];
let selectedResourceId = null;
let currentConfig = null;
let assignments = [];
let blocks = [];
let exceptionDraft = {};
let adminBookingsPageToken = null;
let adminBookingsCache = [];
let showingBookingHistory = false;
let selectedAdminBookingId = null;

const today = new Date();
adminBookingsDate.value = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

function setStatus(element, message, state = "") {
  element.textContent = message;
  element.dataset.state = state;
}

function errorText(error) {
  if (error?.code === "functions/permission-denied") {
    return "Esta cuenta no tiene el permiso administrativo asignado por el servidor.";
  }
  if (error?.code === "functions/unauthenticated") return "La sesión venció. Iniciá sesión nuevamente.";
  return error?.message || "No se pudo completar la operación. Intentá nuevamente.";
}

async function callAdmin(callable, data) {
  if (!currentUser) throw new Error("Iniciá sesión para continuar.");
  await currentUser.getIdToken(true);
  return callable(data);
}

function createElement(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

function renderWindow(day, window = { start: "", end: "" }) {
  const row = createElement("div", "weekly-window");
  const start = document.createElement("input");
  start.type = "time";
  start.value = window.start || "";
  start.dataset.start = "";
  start.setAttribute("aria-label", `Inicio de franja, ${weekdays[Number(day)]}`);
  const end = document.createElement("input");
  end.type = "time";
  end.value = window.end || "";
  end.dataset.end = "";
  end.setAttribute("aria-label", `Fin de franja, ${weekdays[Number(day)]}`);
  const remove = createElement("button", "", "Quitar franja");
  remove.type = "button";
  remove.addEventListener("click", () => row.remove());
  row.append(start, end, remove);
  return row;
}

function renderWeeklySchedule(schedule = {}) {
  weeklySchedule.replaceChildren();
  for (let day = 0; day < 7; day += 1) {
    const key = String(day);
    const section = createElement("section", "weekly-day");
    section.dataset.day = key;
    const heading = createElement("div", "weekly-day-heading");
    heading.append(createElement("span", "", weekdays[day]));
    const add = createElement("button", "", "Agregar franja");
    add.type = "button";
    add.addEventListener("click", () => section.querySelector(".weekly-windows").append(renderWindow(key)));
    heading.append(add);
    const windows = createElement("div", "weekly-windows");
    for (const window of schedule[key] || []) windows.append(renderWindow(key, window));
    section.append(heading, windows);
    weeklySchedule.append(section);
  }
}

function renderPricing(priceAmounts = {}) {
  const table = createElement("table", "pricing-grid");
  const head = document.createElement("thead");
  const headerRow = document.createElement("tr");
  headerRow.append(createElement("th", "", "Nivel"));
  for (const duration of durations) headerRow.append(createElement("th", "", `${duration} min`));
  head.append(headerRow);
  const body = document.createElement("tbody");
  for (const level of levels) {
    const row = document.createElement("tr");
    row.append(createElement("td", "", level.name));
    for (const duration of durations) {
      const cell = document.createElement("td");
      const input = document.createElement("input");
      input.type = "text";
      input.inputMode = "decimal";
      input.autocomplete = "off";
      input.dataset.level = level.id;
      input.dataset.duration = String(duration);
      input.value = priceAmounts[level.id]?.[duration] ?? "";
      input.setAttribute("aria-label", `Importe ${level.name}, ${duration} minutos`);
      cell.append(input);
      row.append(cell);
    }
    body.append(row);
  }
  table.append(head, body);
  pricingGrid.replaceChildren(table);
}

function renderExceptions() {
  exceptionList.replaceChildren();
  const entries = Object.entries(exceptionDraft).sort(([first], [second]) => first.localeCompare(second));
  if (entries.length === 0) {
    exceptionList.append(createElement("p", "admin-empty", "No hay excepciones de fechas configuradas."));
    return;
  }
  for (const [date, exception] of entries) {
    const row = createElement("div", "admin-record exception-record");
    const description = exception.closed
      ? `${date} · Cerrado`
      : `${date} · ${(exception.windows || []).map(window => `${window.start}-${window.end}`).join(", ") || "Sin franjas"}`;
    row.append(createElement("span", "admin-record-copy", description));
    const remove = createElement("button", "", "Quitar");
    remove.type = "button";
    remove.addEventListener("click", () => {
      delete exceptionDraft[date];
      renderExceptions();
    });
    row.append(remove);
    exceptionList.append(row);
  }
}

function renderCompleteness(data) {
  const issues = [];
  if (data.configurationStatus) issues.push(data.configurationStatus);
  const matrix = data.config?.priceAmounts || {};
  const missingPrices = levels.reduce((missing, level) =>
    missing + durations.filter(duration => matrix[level.id]?.[duration] === undefined || matrix[level.id]?.[duration] === "").length, 0);
  if (missingPrices > 0) issues.push(`Faltan ${missingPrices} de los ${levels.length * durations.length} importes de la matriz.`);
  const activeAssignments = data.assignments.filter(assignment => assignment.active === true).length;
  if (activeAssignments === 0) issues.push("No hay períodos activos con nivel de demanda manual.");
  if (issues.length > 0) {
    configStatus.dataset.state = "incomplete";
    configStatus.replaceChildren(...issues.map(issue => createElement("span", "", `• ${issue}`)));
    return;
  }
  configStatus.dataset.state = "ready";
  configStatus.textContent = "Configuración base completa. Solo se ofrecerán franjas cubiertas por horarios, asignaciones manuales y precios válidos.";
}

function renderAssignments() {
  demandList.replaceChildren();
  if (assignments.length === 0) {
    demandList.append(createElement("p", "admin-empty", "Todavía no hay asignaciones de demanda."));
    return;
  }
  const names = Object.fromEntries(levels.map(level => [level.id, level.name]));
  for (const assignment of assignments) {
    const row = createElement("article", "admin-record");
    const state = assignment.active ? "Activa" : "Inactiva";
    const copy = createElement("div", "admin-record-copy");
    copy.append(
      createElement("strong", "", `${names[assignment.level] || "Nivel no válido"} · ${state}`),
      createElement("small", "", `${assignment.startLocal || assignment.startAt} → ${assignment.endLocal || assignment.endAt} · ${assignment.timeZone || "zona horaria no registrada"}`)
    );
    row.append(copy);
    const actions = createElement("div", "admin-record-actions");
    if (assignment.active) {
      const edit = createElement("button", "", "Editar");
      edit.type = "button";
      edit.addEventListener("click", () => {
        $("#demand-assignment-id").value = assignment.id;
        $("#demand-start").value = assignment.startLocal || "";
        $("#demand-end").value = assignment.endLocal || "";
        $("#demand-level").value = assignment.level;
        $("#save-demand").textContent = "Guardar cambios";
        $("#cancel-demand-edit").hidden = false;
        $("#demand-start").focus();
      });
      const deactivate = createElement("button", "danger", "Desactivar");
      deactivate.type = "button";
      deactivate.addEventListener("click", () => void runAction(
        $("#demand-status"),
        "Desactivando asignación…",
        async () => {
          await callAdmin(deactivateAssignment, { assignmentId: assignment.id });
          await loadResource(selectedResourceId, true);
        }
      ));
      actions.append(edit, deactivate);
    }
    row.append(actions);
    demandList.append(row);
  }
}

function renderBlocks() {
  blockList.replaceChildren();
  if (blocks.length === 0) {
    blockList.append(createElement("p", "admin-empty", "Todavía no hay bloqueos registrados."));
    return;
  }
  for (const block of blocks) {
    const row = createElement("article", "admin-record");
    const copy = createElement("div", "admin-record-copy");
    copy.append(
      createElement("strong", "", `${block.type === "evento" ? "Evento" : "Mantenimiento"} · ${block.active ? "Activo" : "Inactivo"}`),
      createElement("small", "", `${block.startLocal || block.startAt} → ${block.endLocal || block.endAt} · ${block.timeZone || "zona horaria no registrada"} · ${block.reason}`)
    );
    const actions = createElement("div", "admin-record-actions");
    const edit = createElement("button", "", "Editar");
    edit.type = "button";
    edit.addEventListener("click", () => {
      $("#block-id").value = block.id;
      $("#block-type").value = block.type;
      $("#block-start").value = block.startLocal || "";
      $("#block-end").value = block.endLocal || "";
      $("#block-reason").value = block.reason || "";
      $("#save-block").textContent = "Guardar cambios";
      $("#cancel-block-edit").hidden = false;
      $("#block-start").focus();
    });
    const toggle = createElement("button", block.active ? "danger" : "", block.active ? "Desactivar" : "Activar");
    toggle.type = "button";
    toggle.addEventListener("click", () => void runAction(
      $("#block-status"),
      block.active ? "Desactivando bloqueo…" : "Activando bloqueo…",
      async () => {
        await callAdmin(setBlockActive, {
          resourceId: selectedResourceId,
          blockId: block.id,
          active: !block.active
        });
        await loadResource(selectedResourceId, true);
      }
    ));
    actions.append(edit, toggle);
    row.append(copy, actions);
    blockList.append(row);
  }
}

function statusName(status) {
  return ({
    pending: "Pendiente",
    confirmed: "Confirmada",
    awaiting_payment: "Pendiente",
    in_progress: "En proceso",
    completed: "Finalizada",
    cancelled: "Cancelada",
    revoked: "Revocada",
    no_show: "Ausente",
    unknown: "No reconocido"
  })[status] || "No reconocido";
}

function paymentStatusName(status) {
  return status === "paid" ? "Pagada" : "Pendiente de pago";
}

function localDateTime(value, timeZone, options) {
  return new Date(value).toLocaleString("es-AR", { ...options, timeZone });
}

function statusBadge(status, kind) {
  const badge = createElement("span", `admin-state-badge admin-state-${kind}-${status}`, kind === "payment"
    ? paymentStatusName(status)
    : statusName(status));
  return badge;
}

function renderAdminBookings(reservations) {
  adminBookingsList.replaceChildren();
  if (reservations.length === 0) {
    const empty = document.createElement("tr");
    const cell = createElement("td", "admin-empty", `No hay reservas para estos filtros${showingBookingHistory ? " en el historial" : ""}.`);
    cell.colSpan = 11;
    empty.append(cell);
    adminBookingsList.append(empty);
    return;
  }
  for (const reservation of reservations) {
    const row = document.createElement("tr");
    const customer = reservation.customer || {};
    const id = createElement("td", "admin-booking-id", reservation.id);
    const customerCell = document.createElement("td");
    customerCell.append(
      createElement("strong", "", customer.name || "Cliente"),
      createElement("small", "", `${customer.email || "Sin correo"} · UID ${customer.uid || "no disponible"}`)
    );
    const resource = createElement("td", "", reservation.resourceName || reservation.resourceId || "Recurso desconocido");
    const date = createElement("td", "", localDateTime(reservation.startAt, reservation.timeZone, { dateStyle: "medium" }));
    const start = createElement("td", "", localDateTime(reservation.startAt, reservation.timeZone, { timeStyle: "short" }));
    const end = createElement("td", "", localDateTime(reservation.endAt, reservation.timeZone, { timeStyle: "short" }));
    const duration = createElement("td", "", `${reservation.durationMinutes} min`);
    const price = createElement("td", "", formatPrice(reservation.price));
    const bookingState = document.createElement("td");
    bookingState.append(statusBadge(reservation.status, "booking"));
    const paymentState = document.createElement("td");
    paymentState.append(statusBadge(reservation.payment.status, "payment"));
    const actions = document.createElement("td");
    const details = createElement("button", "admin-booking-detail-button", "Ver detalle");
    details.type = "button";
    details.addEventListener("click", () => void showAdminBooking(reservation.id));
    actions.append(details);
    row.append(id, customerCell, resource, date, start, end, duration, price, bookingState, paymentState, actions);
    adminBookingsList.append(row);
  }
}

function renderAdminBookingDetail(response) {
  const reservation = response.reservation;
  const payment = reservation.payment;
  const customer = reservation.customer || {};
  const detail = document.createElement("dl");
  detail.className = "admin-booking-detail-grid";
  const entries = [
    ["Identificador", reservation.id],
    ["Cliente", customer.name || "Nombre no disponible"],
    ["Correo", customer.email || "No disponible"],
    ["UID del cliente", customer.uid || "No disponible"],
    ["Recurso", reservation.resourceName || reservation.resourceId],
    ["Fecha", localDateTime(reservation.startAt, reservation.timeZone, { dateStyle: "full" })],
    ["Horario", `${localDateTime(reservation.startAt, reservation.timeZone, { timeStyle: "short" })}–${localDateTime(reservation.endAt, reservation.timeZone, { timeStyle: "short" })}`],
    ["Duración", `${reservation.durationMinutes} minutos`],
    ["Importe congelado", formatPrice(reservation.price)],
    ["Estado de reserva", statusName(reservation.status)],
    ["Estado de pago", paymentStatusName(payment.status)],
    ["Medio registrado", payment.method === "mercado_pago" ? "Mercado Pago" : payment.method === "in_person" ? "Presencial" : payment.method],
    ["Creada", reservation.createdAt
      ? localDateTime(reservation.createdAt, reservation.timeZone, { dateStyle: "medium", timeStyle: "short" })
      : "No disponible"]
  ];
  if (reservation.legacyStatus) entries.push(["Estado almacenado anterior", reservation.legacyStatus]);
  if (payment.status === "paid") {
    entries.push(
      ["Confirmación del pago", payment.confirmationType === "manual_admin" ? "Registro manual de administración" : "Registrado"],
      ["Fecha de confirmación", payment.manualConfirmedAt
        ? localDateTime(payment.manualConfirmedAt, reservation.timeZone, { dateStyle: "medium", timeStyle: "short" })
        : "No disponible"],
      ["UID del administrador", payment.manualConfirmedBy || "No disponible"]
    );
  }
  if (reservation.deletedAt) {
    entries.push(
      ["Eliminación lógica", localDateTime(reservation.deletedAt, reservation.timeZone, { dateStyle: "medium", timeStyle: "short" })],
      ["UID del administrador que canceló", reservation.deletedBy || "No disponible"],
      ["Motivo de cancelación", reservation.deletionReason || "No informado"]
    );
  }
  for (const [label, value] of entries) {
    detail.append(createElement("dt", "", label), createElement("dd", "", String(value ?? "No disponible")));
  }

  const events = createElement("ul", "reservation-events");
  for (const event of response.events) {
    const item = document.createElement("li");
    const at = localDateTime(event.createdAt, reservation.timeZone, { dateStyle: "medium", timeStyle: "short" });
    const transition = event.fromPaymentStatus || event.toPaymentStatus
      ? `${event.fromPaymentStatus || "—"} → ${event.toPaymentStatus || "—"}`
      : `${event.fromStatus ? statusName(event.fromStatus) : "—"} → ${statusName(event.toStatus)}`;
    item.textContent = `${at} · ${event.type}: ${transition}${event.reason ? ` · ${event.reason}` : ""}${event.actorId ? ` · UID ${event.actorId}` : ""}`;
    events.append(item);
  }
  const content = document.createElement("div");
  content.append(detail, createElement("h4", "", "Historial de cambios"), events);
  adminBookingDetailContent.replaceChildren(content);
  renderAdminBookingActions(reservation);
}

function renderAdminBookingActions(reservation) {
  adminBookingDetailActions.replaceChildren();
  const actions = [];
  if (reservation.status === "pending") actions.push(["in_progress", "Iniciar reserva"]);
  if (reservation.status === "in_progress") actions.push(["completed", "Marcar finalizada"]);
  for (const [status, label] of actions) {
    const button = createElement("button", status === "completed" ? "button button-primary danger" : "button button-primary", label);
    button.type = "button";
    button.addEventListener("click", () => void changeBookingStatus(reservation, status));
    adminBookingDetailActions.append(button);
  }
  if (reservation.payment.status === "pending" && reservation.payment.method === "in_person") {
    const paid = createElement("button", "button button-primary", "Marcar como pagada");
    paid.type = "button";
    paid.addEventListener("click", () => void confirmManualPayment(reservation));
    adminBookingDetailActions.append(paid);
  }
  if (reservation.status === "pending" || reservation.status === "in_progress"
    || (reservation.status === "cancelled" && !reservation.deletedAt)) {
    const remove = createElement("button", "button button-ghost danger", "Eliminar reserva");
    remove.type = "button";
    remove.addEventListener("click", () => void confirmLogicalDelete(reservation));
    adminBookingDetailActions.append(remove);
  }
}

async function changeBookingStatus(reservation, status) {
  const nextStatusName = statusName(status);
  if (!window.confirm(`¿Confirmás el cambio de la reserva ${reservation.id} a «${nextStatusName}»?`)) return;
  const reason = window.prompt("Motivo para el historial de auditoría:");
  if (reason === null || reason.trim().length < 2) return;
  await runAction($("#admin-bookings-status"), "Actualizando estado…", async () => {
    await callAdmin(setAdminBookingStatus, { reservationId: reservation.id, status, reason: reason.trim() });
    await loadAdminBookings({ propagateError: true });
    await showAdminBooking(reservation.id);
  });
}

async function confirmManualPayment(reservation) {
  if (!window.confirm(`¿Confirmás que el pago presencial de ${formatPrice(reservation.price)} fue recibido? No se registrará un cobro mediante Mercado Pago.`)) return;
  await runAction($("#admin-bookings-status"), "Registrando pago manual…", async () => {
    await callAdmin(markAdminBookingPaid, { reservationId: reservation.id });
    await loadAdminBookings({ propagateError: true });
    await showAdminBooking(reservation.id);
  });
}

async function confirmLogicalDelete(reservation) {
  if (!window.confirm(`¿Eliminar lógicamente la reserva ${reservation.id}? Se marcará cancelada, se conservará su historial financiero y se liberará el horario.`)) return;
  const reason = window.prompt("Motivo de cancelación para el historial:");
  if (reason === null || reason.trim().length < 2) return;
  await runAction($("#admin-bookings-status"), "Cancelando reserva y liberando el horario…", async () => {
    await callAdmin(deleteAdminBooking, { reservationId: reservation.id, reason: reason.trim() });
    await loadAdminBookings({ propagateError: true });
    selectedAdminBookingId = null;
    adminBookingDetail.hidden = true;
  });
}

async function loadAdminBookings({ append = false, propagateError = false } = {}) {
  if (!currentUser) return;
  const requestedBy = currentUser.uid;
  const filters = {
    date: adminBookingsDate.value,
    resourceId: adminBookingsResource.value,
    bookingStatus: $("#admin-bookings-state").value,
    paymentStatus: $("#admin-bookings-payment").value,
    customer: $("#admin-bookings-customer").value.trim(),
    searchId: $("#admin-bookings-search").value.trim(),
    history: showingBookingHistory
  };
  const filterKey = JSON.stringify(filters);
  if (!append) {
    adminBookingsPageToken = null;
    adminBookingsCache = [];
  }
  $("#load-admin-bookings").disabled = true;
  $("#load-more-admin-bookings").disabled = true;
  setStatus($("#admin-bookings-status"), "Consultando reservas…");
  if (!append) adminBookingsList.replaceChildren();
  try {
    const response = await callAdmin(listAdminBookings, {
      ...filters,
      ...(append && adminBookingsPageToken ? { pageToken: adminBookingsPageToken } : {})
    });
    if (!currentUser
      || currentUser.uid !== requestedBy
      || JSON.stringify({
        date: adminBookingsDate.value,
        resourceId: adminBookingsResource.value,
        bookingStatus: $("#admin-bookings-state").value,
        paymentStatus: $("#admin-bookings-payment").value,
        customer: $("#admin-bookings-customer").value.trim(),
        searchId: $("#admin-bookings-search").value.trim(),
        history: showingBookingHistory
      }) !== filterKey) return;
    adminBookingsCache = append
      ? [...adminBookingsCache, ...response.data.reservations]
      : response.data.reservations;
    adminBookingsPageToken = response.data.nextPageToken;
    renderAdminBookings(adminBookingsCache);
    $("#load-more-admin-bookings").hidden = !adminBookingsPageToken;
    setStatus($("#admin-bookings-status"), `${adminBookingsCache.length} reservas cargadas${adminBookingsPageToken ? "; hay más resultados." : "."}`);
  } catch (error) {
    setStatus($("#admin-bookings-status"), errorText(error), "error");
    if (propagateError) throw error;
  } finally {
    $("#load-admin-bookings").disabled = !currentUser;
    $("#load-more-admin-bookings").disabled = !currentUser;
  }
}

async function showAdminBooking(reservationId) {
  const requestedBy = currentUser && currentUser.uid;
  if (!requestedBy) return;
  selectedAdminBookingId = reservationId;
  adminBookingDetail.hidden = false;
  adminBookingDetailContent.textContent = "Consultando detalle…";
  adminBookingDetailActions.replaceChildren();
  try {
    const response = await callAdmin(getAdminBooking, { reservationId });
    if (!currentUser || currentUser.uid !== requestedBy || selectedAdminBookingId !== reservationId) return;
    renderAdminBookingDetail(response.data);
  } catch (error) {
    adminBookingDetailContent.textContent = errorText(error);
  }
}

function displayConfig(config) {
  const source = config || {};
  $("#resource-enabled").checked = source.enabled === true;
  $("#resource-time-zone").value = source.timeZone || "";
  $("#resource-interval").value = source.startIntervalMinutes ?? "";
  $("#price-currency").value = source.currency || "";
  exceptionDraft = structuredClone(source.dateExceptions || {});
  renderWeeklySchedule(source.weeklySchedule || {});
  renderExceptions();
  renderPricing(source.priceAmounts || {});
}

async function loadResource(resourceId, propagateError = false) {
  selectedResourceId = resourceId;
  $("#resource-config-status").textContent = "";
  setStatus($("#demand-status"), "");
  setStatus($("#block-status"), "");
  try {
    const response = await callAdmin(getAdminResource, { resourceId });
    if (selectedResourceId !== resourceId) return;
    currentConfig = response.data.config;
    assignments = response.data.assignments;
    blocks = response.data.blocks;
    displayConfig(currentConfig);
    renderCompleteness(response.data);
    renderAssignments();
    renderBlocks();
    adminWorkspace.hidden = false;
  } catch (error) {
    adminWorkspace.hidden = true;
    setStatus(authStatus, errorText(error), "error");
    if (propagateError) throw error;
  }
}

async function loadResourceCatalog() {
  const response = await listResources();
  resources = response.data.resources;
  resourceSelect.replaceChildren();
  adminBookingsResource.replaceChildren(new Option("Todos los recursos", ""));
  for (const resource of resources) {
    resourceSelect.add(new Option(resource.name, resource.id));
    adminBookingsResource.add(new Option(resource.name, resource.id));
  }
  if (resources.length === 0) {
    throw new Error("No hay recursos disponibles en el catálogo del servidor.");
  }
  const selected = resources.some(resource => resource.id === selectedResourceId)
    ? selectedResourceId
    : resources[0].id;
  resourceSelect.value = selected;
  await loadResource(selected, true);
}

async function runAction(statusElement, pendingMessage, action) {
  setStatus(statusElement, pendingMessage);
  try {
    await action();
    setStatus(statusElement, "Cambios guardados.", "success");
  } catch (error) {
    setStatus(statusElement, errorText(error), "error");
  }
}

function readWeeklySchedule() {
  const schedule = {};
  for (const daySection of weeklySchedule.querySelectorAll(".weekly-day")) {
    const day = daySection.dataset.day;
    schedule[day] = [...daySection.querySelectorAll(".weekly-window")].map(row => ({
      start: row.querySelector("[data-start]").value,
      end: row.querySelector("[data-end]").value
    })).sort((first, second) => first.start.localeCompare(second.start));
  }
  return schedule;
}

function readPriceAmounts() {
  const amounts = Object.fromEntries(levels.map(level => [level.id, {}]));
  for (const input of pricingGrid.querySelectorAll("input[data-level]")) {
    if (input.value.trim() !== "") {
      amounts[input.dataset.level][input.dataset.duration] = input.value.trim();
    }
  }
  return amounts;
}

$("#admin-auth-form").addEventListener("submit", async event => {
  event.preventDefault();
  $("#admin-sign-in").disabled = true;
  setStatus(authStatus, "Verificando credenciales…");
  try {
    await signInWithEmailAndPassword(auth, $("#admin-email").value.trim(), $("#admin-password").value);
    setStatus(authStatus, "Comprobando permisos administrativos…");
  } catch (error) {
    setStatus(authStatus, errorText(error), "error");
  } finally {
    $("#admin-sign-in").disabled = false;
  }
});

$("#admin-sign-out").addEventListener("click", async () => {
  try {
    await signOut(auth);
  } catch (error) {
    setStatus(authStatus, errorText(error), "error");
  }
});

onAuthStateChanged(auth, async user => {
  currentUser = user;
  authForm.hidden = Boolean(user);
  $("#admin-session-panel").hidden = !user;
  adminWorkspace.hidden = true;
  if (!user) {
    setStatus(authStatus, "Iniciá sesión con una cuenta autorizada.");
    resources = [];
    selectedResourceId = null;
    adminBookingsPageToken = null;
    adminBookingsCache = [];
    adminBookingsList.replaceChildren();
    adminBookingDetail.hidden = true;
    adminBookingDetailContent.replaceChildren();
    adminBookingDetailActions.replaceChildren();
    $("#load-more-admin-bookings").hidden = true;
    return;
  }
  $("#admin-session-email").textContent = user.email || "Sesión iniciada";
  setStatus(authStatus, "Comprobando permisos administrativos…");
  try {
    await user.getIdToken(true);
    await loadResourceCatalog();
    setStatus(authStatus, `Sesión autorizada: ${user.email || "personal NEXUS"}.`, "success");
  } catch (error) {
    setStatus(authStatus, errorText(error), "error");
  }
});

resourceSelect.addEventListener("change", () => {
  adminBookingsPageToken = null;
  adminBookingsCache = [];
  adminBookingsList.replaceChildren();
  $("#load-more-admin-bookings").hidden = true;
  adminBookingDetail.hidden = true;
  setStatus($("#admin-bookings-status"), "");
  void loadResource(resourceSelect.value);
});

$("#resource-config-form").addEventListener("submit", async event => {
  event.preventDefault();
  const intervalValue = $("#resource-interval").value;
  const config = {
    enabled: $("#resource-enabled").checked,
    timeZone: $("#resource-time-zone").value.trim(),
    startIntervalMinutes: intervalValue === "" ? null : Number(intervalValue),
    weeklySchedule: readWeeklySchedule(),
    dateExceptions: exceptionDraft,
    currency: $("#price-currency").value.trim().toUpperCase(),
    priceAmounts: readPriceAmounts()
  };
  await runAction($("#resource-config-status"), "Guardando configuración…", async () => {
    $("#save-resource-config").disabled = true;
    try {
      await callAdmin(saveResource, { resourceId: selectedResourceId, config });
      await loadResource(selectedResourceId, true);
    } finally {
      $("#save-resource-config").disabled = false;
    }
  });
});

$("#save-exception").addEventListener("click", () => {
  const date = $("#exception-date").value;
  if (!date) {
    setStatus($("#resource-config-status"), "Seleccioná la fecha de la excepción.", "error");
    return;
  }
  const closed = $("#exception-closed").checked;
  const lines = $("#exception-windows").value.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
  const windows = [];
  if (!closed && lines.length === 0) {
    setStatus($("#resource-config-status"), "Indicá al menos una franja o marcá la fecha como cerrada.", "error");
    return;
  }
  if (!closed) {
    for (const line of lines) {
      const match = line.match(/^([0-2]\d:[0-5]\d)-([0-2]\d:[0-5]\d)$/);
      if (!match) {
        setStatus($("#resource-config-status"), "Usá el formato HH:MM-HH:MM, una franja por línea.", "error");
        return;
      }
      windows.push({ start: match[1], end: match[2] });
    }
  }
  exceptionDraft[date] = closed ? { closed: true } : { windows };
  renderExceptions();
  $("#exception-date").value = "";
  $("#exception-closed").checked = false;
  $("#exception-windows").value = "";
  setStatus($("#resource-config-status"), "Excepción lista; guardá la configuración del recurso para aplicarla.");
});

$("#demand-form").addEventListener("submit", async event => {
  event.preventDefault();
  const assignmentId = $("#demand-assignment-id").value;
  const data = {
    resourceId: selectedResourceId,
    startLocal: $("#demand-start").value,
    endLocal: $("#demand-end").value,
    level: $("#demand-level").value
  };
  if (assignmentId) data.assignmentId = assignmentId;
  await runAction($("#demand-status"), "Guardando asignación manual…", async () => {
    $("#save-demand").disabled = true;
    try {
      await callAdmin(saveAssignment, data);
      $("#demand-form").reset();
      $("#demand-assignment-id").value = "";
      $("#save-demand").textContent = "Guardar asignación";
      $("#cancel-demand-edit").hidden = true;
      await loadResource(selectedResourceId, true);
    } finally {
      $("#save-demand").disabled = false;
    }
  });
});

$("#cancel-demand-edit").addEventListener("click", () => {
  $("#demand-form").reset();
  $("#demand-assignment-id").value = "";
  $("#save-demand").textContent = "Guardar asignación";
  $("#cancel-demand-edit").hidden = true;
});

$("#block-form").addEventListener("submit", async event => {
  event.preventDefault();
  const blockId = $("#block-id").value;
  const data = {
    resourceId: selectedResourceId,
    ...(blockId ? { blockId } : {}),
    type: $("#block-type").value,
    startLocal: $("#block-start").value,
    endLocal: $("#block-end").value,
    reason: $("#block-reason").value.trim()
  };
  await runAction($("#block-status"), "Guardando bloqueo…", async () => {
    $("#save-block").disabled = true;
    try {
      await callAdmin(saveBlock, data);
      $("#block-form").reset();
      $("#block-id").value = "";
      $("#save-block").textContent = "Crear bloqueo";
      $("#cancel-block-edit").hidden = true;
      await loadResource(selectedResourceId, true);
    } finally {
      $("#save-block").disabled = false;
    }
  });
});

$("#cancel-block-edit").addEventListener("click", () => {
  $("#block-form").reset();
  $("#block-id").value = "";
  $("#save-block").textContent = "Crear bloqueo";
  $("#cancel-block-edit").hidden = true;
});

$("#admin-bookings-form").addEventListener("submit", event => {
  event.preventDefault();
  void loadAdminBookings();
});

$("#load-more-admin-bookings").addEventListener("click", () => {
  if (adminBookingsPageToken) void loadAdminBookings({ append: true });
});

$("#show-active-bookings").addEventListener("click", () => {
  showingBookingHistory = false;
  $("#show-active-bookings").setAttribute("aria-pressed", "true");
  $("#show-booking-history").setAttribute("aria-pressed", "false");
  $("#admin-bookings-state").value = "";
  selectedAdminBookingId = null;
  adminBookingDetail.hidden = true;
  void loadAdminBookings();
});

$("#show-booking-history").addEventListener("click", () => {
  showingBookingHistory = true;
  $("#show-active-bookings").setAttribute("aria-pressed", "false");
  $("#show-booking-history").setAttribute("aria-pressed", "true");
  $("#admin-bookings-state").value = "";
  selectedAdminBookingId = null;
  adminBookingDetail.hidden = true;
  void loadAdminBookings();
});

$("#clear-admin-bookings-filters").addEventListener("click", () => {
  $("#admin-bookings-form").reset();
  $("#admin-bookings-state").value = "";
  $("#admin-bookings-payment").value = "";
  adminBookingsDate.value = "";
  adminBookingsResource.value = "";
  void loadAdminBookings();
});
