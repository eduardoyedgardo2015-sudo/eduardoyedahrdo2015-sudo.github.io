import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createInterface } from "node:readline/promises";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PROJECT = "nexus-c0671";
const REGION = "southamerica-east1";
const AUTH_URL = "http://127.0.0.1:9099";
const FUNCTIONS_URL = "http://127.0.0.1:5001";

const LEVELS = ["baja", "normal", "alta", "muy_alta"];
const DURATIONS = [30, 45, 60, 75, 90, 105, 120];

const RESOURCE_IDS = [
  "basketball",
  "volleyball",
  "indoor-soccer-5",
  "outdoor-soccer-5",
  "outdoor-tennis",
  "padel",
  "table-tennis-1",
  "table-tennis-2",
  "table-tennis-3",
  "table-tennis-4"
];

const mode = process.argv.includes("--apply") ? "apply" : "check";
const file = path.join(ROOT, "configuracion-recursos.json");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function validDateTime(value) {
  if (typeof value !== "string") return false;

  const match = value.match(
    /^(\d{4}-\d{2}-\d{2})T([01]\d|2[0-3]):[0-5]\d$/
  );

  if (!match) return false;

  const date = new Date(`${match[1]}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime())
    && date.toISOString().slice(0, 10) === match[1];
}

function validateWindows(windows, label) {
  assert(Array.isArray(windows), `${label}: debe ser una lista.`);

  let previousEnd = -1;

  for (const window of windows) {
    assert(window && typeof window === "object", `${label}: franja inválida.`);

    const parse = value => {
      const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(value || "");
      assert(match, `${label}: horario inválido: ${value}`);
      return Number(match[1]) * 60 + Number(match[2]);
    };

    const start = parse(window.start);
    const end = parse(window.end);

    assert(start < end, `${label}: el inicio debe ser anterior al final.`);
    assert(start >= previousEnd, `${label}: hay franjas superpuestas o desordenadas.`);

    previousEnd = end;
  }
}

function validateResource(resource) {
  const errors = [];
  const label = resource.id;

  try {
    assert(resource && typeof resource === "object", "Recurso inválido.");
    assert(typeof resource.apply === "boolean", "apply debe ser true o false.");

    const c = resource.config;
    assert(c && typeof c === "object", "Falta config.");
    assert(typeof c.enabled === "boolean", "enabled debe ser booleano.");
    assert(typeof c.timeZone === "string", "timeZone debe ser texto.");

    if (c.timeZone) {
      new Intl.DateTimeFormat("en", { timeZone: c.timeZone });
    }

    assert(
      c.startIntervalMinutes === null
        || (Number.isInteger(c.startIntervalMinutes) && c.startIntervalMinutes > 0),
      "Intervalo de inicio inválido."
    );

    assert(c.weeklySchedule && typeof c.weeklySchedule === "object",
      "Falta weeklySchedule.");

    let hasSchedule = false;

    for (let day = 0; day < 7; day++) {
      const windows = c.weeklySchedule[String(day)];
      validateWindows(windows, `${label}, día ${day}`);
      if (windows.length > 0) hasSchedule = true;
    }

    const exceptions = c.dateExceptions || {};
    assert(typeof exceptions === "object" && !Array.isArray(exceptions),
      "dateExceptions debe ser un objeto.");

    for (const [date, exception] of Object.entries(exceptions)) {
      assert(validDateTime(`${date}T00:00`), `Fecha de excepción inválida: ${date}`);
      assert(exception && typeof exception === "object", `Excepción inválida: ${date}`);

      if (exception.closed !== true) {
        validateWindows(exception.windows, `${label}, excepción ${date}`);
        assert(exception.windows.length > 0, `Faltan horarios en la excepción ${date}.`);
      }
    }

    assert(typeof c.currency === "string", "currency debe ser texto.");

    const priceAmounts = c.priceAmounts;
    assert(priceAmounts && typeof priceAmounts === "object", "Falta priceAmounts.");

    let filledPrices = 0;

    for (const level of LEVELS) {
      assert(priceAmounts[level] && typeof priceAmounts[level] === "object",
        `Falta el nivel ${level}.`);

      for (const duration of DURATIONS) {
        const amount = priceAmounts[level][String(duration)];

        assert(typeof amount === "string", `Importe inválido: ${level}/${duration}.`);

        if (amount === "") continue;

        assert(
          /^(?:0|[1-9]\d*)(?:\.\d+)?$/.test(amount),
          `Importe inválido: ${level}/${duration}.`
        );

        assert(c.currency.length === 3, "Falta la moneda para los importes.");

        const digits = new Intl.NumberFormat("en", {
          style: "currency",
          currency: c.currency
        }).resolvedOptions().maximumFractionDigits;

        const decimals = amount.split(".")[1]?.length || 0;

        assert(decimals <= digits,
          `${level}/${duration}: demasiados decimales para ${c.currency}.`);

        filledPrices++;
      }
    }

    if (c.currency) {
      assert(/^[A-Z]{3}$/.test(c.currency), "Código de moneda inválido.");
      new Intl.NumberFormat("en", { style: "currency", currency: c.currency });
    }

    if (c.enabled) {
      assert(c.timeZone !== "", "Un recurso habilitado necesita zona horaria.");
      assert(Number.isInteger(c.startIntervalMinutes) && c.startIntervalMinutes > 0,
        "Un recurso habilitado necesita intervalo.");
      assert(hasSchedule, "Un recurso habilitado necesita horarios.");
      assert(c.currency !== "", "Un recurso habilitado necesita moneda.");
      assert(filledPrices === 28, `Faltan tarifas: ${filledPrices}/28.`);
    }

    assert(Array.isArray(resource.demandAssignments),
      "demandAssignments debe ser una lista.");
    assert(Array.isArray(resource.blocks), "blocks debe ser una lista.");

    if (resource.demandAssignments.length || resource.blocks.length) {
      assert(c.timeZone !== "", "Las asignaciones y bloqueos requieren zona horaria.");
    }

    const assignmentKeys = new Set();

    for (const item of resource.demandAssignments) {
      assert(LEVELS.includes(item.level), "Nivel de demanda inválido.");
      assert(validDateTime(item.startLocal), "Inicio de demanda inválido.");
      assert(validDateTime(item.endLocal), "Final de demanda inválido.");
      assert(item.startLocal < item.endLocal, "Período de demanda invertido.");

      const key = `${item.startLocal}|${item.endLocal}`;
      assert(!assignmentKeys.has(key), "Hay asignaciones duplicadas en el archivo.");
      assignmentKeys.add(key);
    }

    const blockKeys = new Set();

    for (const item of resource.blocks) {
      assert(["mantenimiento", "evento"].includes(item.type),
        "Tipo de bloqueo inválido.");
      assert(typeof item.reason === "string" && item.reason.trim().length >= 2,
        "El motivo del bloqueo es obligatorio.");
      assert(item.reason.trim().length <= 500, "El motivo supera 500 caracteres.");
      assert(validDateTime(item.startLocal), "Inicio del bloqueo inválido.");
      assert(validDateTime(item.endLocal), "Final del bloqueo inválido.");
      assert(item.startLocal < item.endLocal, "Período de bloqueo invertido.");

      const key = `${item.type}|${item.startLocal}|${item.endLocal}`;
      assert(!blockKeys.has(key), "Hay bloqueos duplicados en el archivo.");
      blockKeys.add(key);
    }

    return {
      ok: true,
      errors,
      filledPrices,
      hasSchedule,
      assignments: resource.demandAssignments.length,
      blocks: resource.blocks.length
    };
  } catch (error) {
    errors.push(error.message);
    return { ok: false, errors };
  }
}

function loadConfiguration() {
  assert(fs.existsSync(file), "No existe configuracion-recursos.json.");

  const config = JSON.parse(fs.readFileSync(file, "utf8"));

  assert(config.version === 1, "Versión de configuración desconocida.");
  assert(config.projectId === PROJECT, "El proyecto no coincide con NEXUS.");
  assert(config.region === REGION, "La región no coincide con NEXUS.");
  assert(Array.isArray(config.resources), "Falta la lista de recursos.");
  assert(config.resources.length === RESOURCE_IDS.length, "Se esperan exactamente 10 recursos.");

  const ids = config.resources.map(resource => resource.id);

  assert(new Set(ids).size === ids.length, "Hay IDs de recursos duplicados.");

  for (const id of RESOURCE_IDS) {
    assert(ids.includes(id), `Falta el recurso ${id}.`);
  }

  return config;
}

function getApiKey() {
  const source = fs.readFileSync(path.join(ROOT, "js/firebase/config.js"), "utf8");
  const match = source.match(/apiKey:\s*["']([^"']+)["']/);

  assert(match, "No se pudo leer apiKey desde js/firebase/config.js.");
  return match[1];
}

async function callAuth(email, password, apiKey) {
  const response = await fetch(
    `${AUTH_URL}/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${encodeURIComponent(apiKey)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        password,
        returnSecureToken: true
      })
    }
  );

  const result = await response.json();

  if (!response.ok || !result.idToken) {
    throw new Error(result.error?.message || "No se pudo iniciar sesión en el emulador.");
  }

  return result.idToken;
}

async function callFunction(name, data, idToken) {
  const url = `${FUNCTIONS_URL}/${PROJECT}/${REGION}/${name}`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${idToken}`
    },
    body: JSON.stringify({ data })
  });

  const result = await response.json();

  if (!response.ok || result.error) {
    throw new Error(
      `${name}: ${result.error?.message || `HTTP ${response.status}`}`
    );
  }

  return result.result;
}

async function askHidden(prompt) {
  if (!process.stdin.isTTY || !process.stdin.setRawMode) {
    throw new Error("Se necesita una terminal interactiva para ingresar la contraseña.");
  }

  return new Promise((resolve, reject) => {
    const input = process.stdin;
    const previousRawMode = input.isRaw;
    let value = "";

    process.stdout.write(prompt);
    input.setRawMode(true);
    input.resume();

    function cleanup() {
      input.removeListener("data", onData);
      input.setRawMode(previousRawMode || false);
      process.stdout.write("\n");
    }

    function onData(buffer) {
      for (const char of buffer.toString("utf8")) {
        if (char === "\u0003") {
          cleanup();
          reject(new Error("Operación cancelada."));
          return;
        }

        if (char === "\r" || char === "\n") {
          cleanup();
          resolve(value);
          return;
        }

        if (char === "\u007f" || char === "\b") {
          value = value.slice(0, -1);
        } else {
          value += char;
        }
      }
    }

    input.on("data", onData);
  });
}

async function main() {
  const config = loadConfiguration();
  const selected = config.resources.filter(resource => resource.apply === true);

  console.log("\nNEXUS — CARGADOR DE CONFIGURACIÓN");
  console.log("Proyecto:", PROJECT);
  console.log("Modo:", mode === "apply" ? "APLICACIÓN LOCAL" : "VALIDACIÓN");
  console.log("----------------------------------------");

  let failures = 0;

  for (const resource of config.resources) {
    const result = validateResource(resource);

    if (!result.ok) {
      failures++;
      console.log(`ERROR ${resource.id}: ${result.errors.join(" | ")}`);
    } else if (resource.apply) {
      console.log(
        `SELECCIONADO ${resource.name}: ${result.filledPrices}/28 tarifas, ` +
        `${result.assignments} asignaciones, ${result.blocks} bloqueos.`
      );
    } else {
      console.log(`PENDIENTE ${resource.name}: apply=false.`);
    }
  }

  if (failures) {
    throw new Error(`Hay ${failures} recursos con errores. No se aplicó nada.`);
  }

  if (mode === "check") {
    console.log("\nValidación terminada. No se modificó ningún dato.");
    console.log("Para aplicar, revisá los datos y usá --apply.");
    return;
  }

  if (selected.length === 0) {
    console.log("\nNo hay recursos seleccionados. Ningún dato fue modificado.");
    console.log("Cambiá apply a true solamente en los recursos que quieras cargar.");
    return;
  }

  const readline = createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const email = (await readline.question(
    "Correo del administrador local [eduardoyedgardo2015@gmail.com]: "
  )).trim() || "eduardoyedgardo2015@gmail.com";

  const confirmation = await readline.question(
    `Vas a modificar ${selected.length} recursos del EMULADOR LOCAL. Escribí APLICAR para continuar: `
  );

  readline.close();

  if (confirmation !== "APLICAR") {
    console.log("Cancelado. No se modificó nada.");
    return;
  }

  const password = await askHidden("Contraseña del usuario de prueba: ");

  try {
    const idToken = await callAuth(email, password, getApiKey());

    console.log("\nAutenticación local correcta.");

    for (const resource of selected) {
      console.log(`\nGuardando ${resource.name}...`);

      await callFunction("saveAdminBookingResource", {
        resourceId: resource.id,
        config: resource.config
      }, idToken);

      let detail = await callFunction(
        "getAdminBookingResource",
        { resourceId: resource.id },
        idToken
      );

      for (const assignment of resource.demandAssignments) {
        const matches = detail.assignments.filter(item =>
          item.startLocal === assignment.startLocal
          && item.endLocal === assignment.endLocal
        );

        if (matches.length > 1) {
          throw new Error(`Asignación duplicada existente en ${resource.name}.`);
        }

        const data = { resourceId: resource.id, ...assignment };

        if (matches.length === 1) {
          data.assignmentId = matches[0].id;
        }

        const saved = await callFunction("saveDemandAssignment", data, idToken);

        detail.assignments.push({
          id: saved.assignmentId,
          startLocal: assignment.startLocal,
          endLocal: assignment.endLocal
        });

        console.log("  Asignación de demanda guardada.");
      }

      for (const block of resource.blocks) {
        const matches = detail.blocks.filter(item =>
          item.type === block.type
          && item.startLocal === block.startLocal
          && item.endLocal === block.endLocal
        );

        if (matches.length > 1) {
          throw new Error(`Bloqueo duplicado existente en ${resource.name}.`);
        }

        const data = { resourceId: resource.id, ...block };

        if (matches.length === 1) {
          data.blockId = matches[0].id;
        }

        const saved = await callFunction("saveResourceBlock", data, idToken);

        detail.blocks.push({
          id: saved.blockId,
          type: block.type,
          startLocal: block.startLocal,
          endLocal: block.endLocal
        });

        console.log("  Bloqueo guardado.");
      }

      console.log(`  ${resource.name}: terminado.`);
    }

    const summary = await callFunction("listBookingResources", {}, idToken);

    console.log("\nRESULTADO FINAL");
    for (const item of summary.resources) {
      console.log(
        `${item.name}: ${item.configurationStatus} — reservas ${item.availableForBooking ? "habilitadas" : "deshabilitadas"}`
      );
    }

    console.log("\nCarga local terminada correctamente.");
  } finally {
    // No se guarda la contraseña en archivos.
  }
}

main().catch(error => {
  console.error("\nERROR:", error.message);
  process.exitCode = 1;
});
