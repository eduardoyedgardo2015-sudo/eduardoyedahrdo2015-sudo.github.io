import { createUserWithEmailAndPassword, onAuthStateChanged, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/13.4.0/firebase-auth.js";
import { auth, callFunction } from "./firebase/client.js";

const listResources = callFunction("listBookingResources");
const getAvailability = callFunction("getBookingAvailability");
const createBooking = callFunction("createBooking");
const listMyBookings = callFunction("listMyBookings");
const getMyBooking = callFunction("getMyBooking");
const $ = selector => document.querySelector(selector);

const authForm = $("#auth-form");
const authStatus = $("#auth-status");
const authModeToggle = $("#auth-mode-toggle");
const authSubmit = $("#auth-submit");
const accountPanel = $("#account-panel");
const bookingForm = $("#booking-form");
const resourceSelect = $("#resource-select");
const dateInput = $("#booking-date");
const durationSelect = $("#duration-select");
const availabilitySubmit = $("#availability-submit");
const bookingStatus = $("#booking-status");
const slotFieldset = $("#slot-fieldset");
const slotList = $("#slot-list");
const confirmationPanel = $("#booking-confirmation");
const priceText = $("#booking-price");
const confirmButton = $("#confirm-booking");
const paymentMethod = $("#payment-method");
const historyStatus = $("#history-status");
const reservationList = $("#reservation-list");
const refreshBookings = $("#refresh-bookings");
const reservationDetail = $("#reservation-detail");
const reservationDetailContent = $("#reservation-detail-content");

let creatingAccount = false;
let currentUser = null;
let currentQuote = null;
let selectedSlot = null;

const today = new Date();
dateInput.min = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

function setStatus(element, message, state = "") {
  element.textContent = message;
  element.dataset.state = state;
}

function errorMessage(error) {
  const code = error && error.code;
  if (code === "functions/unauthenticated") return "Iniciá sesión para continuar.";
  if (code === "functions/failed-precondition") return error.message || "La configuración todavía no está lista.";
  if (code === "functions/already-exists") return error.message || "El horario ya no está disponible.";
  return error && error.message ? error.message : "No se pudo completar la operación. Intentá nuevamente.";
}

function formatPrice(price) {
  const formatter = new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: price.currency
  });
  const fractionDigits = formatter.resolvedOptions().maximumFractionDigits;
  return formatter.format(price.amountMinorUnits / (10 ** fractionDigits));
}

function bookingStatusName(status) {
  return ({
    pending: "Pendiente",
    confirmed: "Pendiente",
    awaiting_payment: "Pendiente",
    in_progress: "En proceso",
    completed: "Finalizada",
    cancelled: "Cancelada",
    revoked: "Cancelada",
    no_show: "Cancelada"
  })[status] || "Estado no reconocido";
}

function clearQuote() {
  currentQuote = null;
  selectedSlot = null;
  slotList.replaceChildren();
  slotFieldset.disabled = true;
  slotFieldset.hidden = true;
  confirmationPanel.hidden = true;
}

function updateConfirmation() {
  const selected = slotList.querySelector('input[name="booking-slot"]:checked');
  selectedSlot = selected ? selected.value : null;
  confirmationPanel.hidden = !selectedSlot || !currentQuote;
  if (selectedSlot && currentQuote) {
    const slot = currentQuote.slots.find(candidate => candidate.time === selectedSlot);
    if (!slot) {
      confirmationPanel.hidden = true;
      return;
    }
    const demandLabels = { baja: "baja", normal: "normal", alta: "alta", muy_alta: "muy alta" };
    priceText.textContent = `Demanda ${demandLabels[slot.demandLevel] || slot.demandLevel} · ${slot.durationMinutes || currentQuote.durationMinutes} min · Precio informado por el servidor: ${formatPrice(slot.price)}`;
  }
}

async function loadResources() {
  resourceSelect.replaceChildren(new Option("Cargando recursos…", ""));
  resourceSelect.disabled = true;
  try {
    const response = await listResources();
    resourceSelect.replaceChildren(new Option("Seleccioná un recurso", ""));
    for (const resource of response.data.resources) {
      const label = resource.availableForBooking
        ? resource.name
        : `${resource.name} — configuración pendiente`;
      const option = new Option(label, resource.id);
      option.disabled = !resource.availableForBooking;
      resourceSelect.add(option);
    }
    durationSelect.replaceChildren(new Option("Seleccioná una duración", ""));
    for (const duration of response.data.durationsMinutes) {
      durationSelect.add(new Option(`${duration} minutos`, String(duration)));
    }
    resourceSelect.disabled = !currentUser;
    if (!response.data.resources.some(resource => resource.availableForBooking)) {
      setStatus(bookingStatus, "El catálogo está listo, pero faltan configuraciones administradas de horarios, intervalos y tarifas.");
    }
  } catch (error) {
    resourceSelect.replaceChildren(new Option("No se pudieron cargar los recursos", ""));
    setStatus(bookingStatus, errorMessage(error), "error");
  }
}

function addReservationRow(reservation) {
  const row = document.createElement("article");
  row.className = "reservation-row";
  const description = document.createElement("p");
  const date = new Date(reservation.startAt);
  description.textContent = `${reservation.resourceName} · ${date.toLocaleString("es-AR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: reservation.timeZone
  })}`;
  const metadata = document.createElement("small");
  const demand = reservation.price.demandLevel
    ? ` · demanda ${reservation.price.demandLevel.replace("_", " ")}`
    : "";
  const paymentStatus = reservation.payment?.status === "paid" ? "Pagada" : "Pendiente de pago";
  metadata.textContent = `${reservation.durationMinutes} min · ${formatPrice(reservation.price)}${demand} · ${bookingStatusName(reservation.status)} · ${paymentStatus}`;
  description.append(metadata);
  const detailsButton = document.createElement("button");
  detailsButton.type = "button";
  detailsButton.textContent = "Ver eventos";
  detailsButton.addEventListener("click", () => showReservation(reservation.id, detailsButton));
  row.append(description, detailsButton);
  reservationList.append(row);
}

async function loadReservations() {
  if (!currentUser) return;
  const requestedBy = currentUser.uid;
  refreshBookings.disabled = true;
  setStatus(historyStatus, "Consultando tus reservas…");
  reservationList.replaceChildren();
  reservationDetail.hidden = true;
  try {
    const response = await listMyBookings();
    if (!currentUser || currentUser.uid !== requestedBy) return;
    if (response.data.reservations.length === 0) {
      setStatus(historyStatus, "Todavía no tenés reservas.");
      return;
    }
    setStatus(historyStatus, "");
    response.data.reservations.forEach(addReservationRow);
  } catch (error) {
    setStatus(historyStatus, errorMessage(error), "error");
  } finally {
    refreshBookings.disabled = !currentUser;
  }
}

async function showReservation(reservationId, button) {
  const requestedBy = currentUser && currentUser.uid;
  if (!requestedBy) return;
  button.disabled = true;
  reservationDetail.hidden = false;
  reservationDetailContent.textContent = "Consultando detalle…";
  try {
    const response = await getMyBooking({ reservationId });
    if (!currentUser || currentUser.uid !== requestedBy) return;
    const list = document.createElement("ul");
    list.className = "reservation-events";
    for (const event of response.data.events) {
      const item = document.createElement("li");
      const date = new Date(event.createdAt).toLocaleString("es-AR", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: response.data.reservation.timeZone
      });
      item.textContent = `${date} · ${event.type}: ${event.fromStatus ? bookingStatusName(event.fromStatus) : "—"} → ${bookingStatusName(event.toStatus)}`;
      if (event.reason) item.textContent += ` · ${event.reason}`;
      list.append(item);
    }
    reservationDetailContent.replaceChildren(list);
  } catch (error) {
    reservationDetailContent.textContent = errorMessage(error);
  } finally {
    button.disabled = false;
  }
}

authForm.addEventListener("submit", async event => {
  event.preventDefault();
  authSubmit.disabled = true;
  setStatus(authStatus, creatingAccount ? "Creando cuenta…" : "Iniciando sesión…");
  try {
    const email = $("#auth-email").value.trim();
    const password = $("#auth-password").value;
    if (creatingAccount) {
      await createUserWithEmailAndPassword(auth, email, password);
    } else {
      await signInWithEmailAndPassword(auth, email, password);
    }
    setStatus(authStatus, "");
  } catch (error) {
    setStatus(authStatus, errorMessage(error), "error");
  } finally {
    authSubmit.disabled = false;
  }
});

authModeToggle.addEventListener("click", () => {
  creatingAccount = !creatingAccount;
  authSubmit.textContent = creatingAccount ? "Crear cuenta" : "Iniciar sesión";
  authModeToggle.textContent = creatingAccount ? "Ya tengo una cuenta" : "Crear cuenta";
  $("#auth-password").autocomplete = creatingAccount ? "new-password" : "current-password";
  setStatus(authStatus, "");
});

$("#sign-out").addEventListener("click", async () => {
  try {
    await signOut(auth);
  } catch (error) {
    setStatus(authStatus, errorMessage(error), "error");
  }
});

onAuthStateChanged(auth, user => {
  currentUser = user;
  authForm.hidden = Boolean(user);
  accountPanel.hidden = !user;
  bookingForm.querySelectorAll("button, select, input").forEach(control => {
    control.disabled = !user;
  });
  $("#signed-in-email").textContent = user ? user.email || "Sesión iniciada" : "";
  refreshBookings.disabled = !user;
  reservationList.replaceChildren();
  reservationDetail.hidden = true;
  reservationDetailContent.replaceChildren();
  if (user) {
    setStatus(authStatus, "");
    loadReservations();
    loadResources();
  } else {
    clearQuote();
    reservationList.replaceChildren();
    setStatus(historyStatus, "Iniciá sesión para consultar tus reservas.");
    void loadResources();
  }
});

for (const control of [resourceSelect, dateInput, durationSelect]) {
  control.addEventListener("change", () => {
    clearQuote();
    setStatus(bookingStatus, "");
  });
}

bookingForm.addEventListener("submit", async event => {
  event.preventDefault();
  if (!currentUser) {
    setStatus(bookingStatus, "Iniciá sesión para consultar disponibilidad.", "error");
    return;
  }
  const requestedBy = currentUser.uid;
  const selection = {
    resourceId: resourceSelect.value,
    date: dateInput.value,
    durationMinutes: Number(durationSelect.value)
  };
  clearQuote();
  availabilitySubmit.disabled = true;
  for (const control of [resourceSelect, dateInput, durationSelect]) {
    control.disabled = true;
  }
  setStatus(bookingStatus, "Consultando disponibilidad y precio en el servidor…");
  try {
    const response = await getAvailability(selection);
    if (!currentUser || currentUser.uid !== requestedBy) return;
    currentQuote = response.data;
    slotFieldset.hidden = false;
    slotFieldset.disabled = false;
    if (currentQuote.slots.length === 0) {
      setStatus(bookingStatus, "No hay horarios disponibles para esa fecha y duración.");
      return;
    }
    let availableCount = 0;
    for (const slot of currentQuote.slots) {
      const label = document.createElement("label");
      label.className = `slot-option slot-${slot.status}`;
      const radio = document.createElement("input");
      radio.type = "radio";
      radio.name = "booking-slot";
      radio.value = slot.time;
      radio.disabled = slot.status !== "available";
      radio.addEventListener("change", updateConfirmation);
      const text = document.createElement("span");
      const demandLabels = { baja: "baja", normal: "normal", alta: "alta", muy_alta: "muy alta" };
      const stateLabels = {
        reserved: "ocupado por reserva",
        blocked: "bloqueado / fuera de servicio",
        unavailable: "no disponible"
      };
      if (slot.status === "available") {
        availableCount += 1;
        text.textContent = `${slot.time} · ${demandLabels[slot.demandLevel] || slot.demandLevel} · ${formatPrice(slot.price)} · disponible`;
      } else {
        text.textContent = `${slot.time} · ${stateLabels[slot.status] || "no disponible"}`;
      }
      label.append(radio, text);
      slotList.append(label);
    }
    setStatus(
      bookingStatus,
      availableCount > 0
        ? `${availableCount} horarios disponibles. Los ocupados y bloqueados no se pueden seleccionar; la confirmación volverá a validar el horario.`
        : "No hay horarios disponibles para esa fecha y duración; los ocupados y bloqueados se muestran como referencia."
    );
  } catch (error) {
    setStatus(bookingStatus, errorMessage(error), "error");
  } finally {
    availabilitySubmit.disabled = !currentUser;
    for (const control of [resourceSelect, dateInput, durationSelect]) {
      control.disabled = !currentUser;
    }
  }
});

confirmButton.addEventListener("click", async () => {
  if (!currentUser || !currentQuote || !selectedSlot) return;
  if (paymentMethod.value !== "in_person") {
    setStatus(bookingStatus, "Ese medio de pago todavía no está habilitado.", "error");
    return;
  }
  confirmButton.disabled = true;
  setStatus(bookingStatus, "Confirmando disponibilidad y precio en el servidor…");
  try {
    const response = await createBooking({
      resourceId: resourceSelect.value,
      date: dateInput.value,
      time: selectedSlot,
      durationMinutes: Number(durationSelect.value),
      paymentMethod: "in_person",
      requestId: crypto.randomUUID()
    });
    setStatus(bookingStatus, `Reserva confirmada. Código: ${response.data.reservationId}. El pago presencial queda pendiente de registración.`, "success");
    clearQuote();
    await loadReservations();
  } catch (error) {
    const availabilityChanged = error?.code === "functions/already-exists"
      || error?.code === "functions/failed-precondition";
    if (availabilityChanged) {
      clearQuote();
    }
    setStatus(
      bookingStatus,
      `${errorMessage(error)}${availabilityChanged ? " Consultá nuevamente la disponibilidad." : ""}`,
      "error"
    );
  } finally {
    confirmButton.disabled = false;
  }
});

refreshBookings.addEventListener("click", loadReservations);
