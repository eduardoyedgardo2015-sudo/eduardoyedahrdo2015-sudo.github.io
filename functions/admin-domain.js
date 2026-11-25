function hasAdminClaim(auth) {
  return Boolean(auth && auth.token && auth.token.admin === true);
}

function amountToMinorUnits(value, currency) {
  if (typeof value !== "string" || !/^\d+(?:\.\d+)?$/.test(value)) {
    throw new Error("Cada importe debe ser un número decimal válido.");
  }
  if (typeof currency !== "string" || !/^[A-Z]{3}$/.test(currency)) {
    throw new Error("La moneda debe ser un código ISO 4217 de tres letras en mayúsculas.");
  }
  let fractionDigits;
  try {
    fractionDigits = new Intl.NumberFormat("en", { style: "currency", currency }).resolvedOptions().maximumFractionDigits;
  } catch {
    throw new Error("La moneda seleccionada no es válida.");
  }
  const [whole, fraction = ""] = value.split(".");
  if (fraction.length > fractionDigits) {
    throw new Error(`La moneda admite hasta ${fractionDigits} decimales.`);
  }
  const minorUnits = BigInt(whole) * (10n ** BigInt(fractionDigits))
    + BigInt((fraction + "0".repeat(fractionDigits)).slice(0, fractionDigits) || "0");
  if (minorUnits > BigInt(Number.MAX_SAFE_INTEGER)) {
    throw new Error("El importe supera el máximo permitido.");
  }
  return Number(minorUnits);
}

function minorUnitsToDecimalString(amountMinorUnits, currency) {
  const fractionDigits = new Intl.NumberFormat("en", {
    style: "currency",
    currency
  }).resolvedOptions().maximumFractionDigits;
  const amount = BigInt(amountMinorUnits);
  if (fractionDigits === 0) return amount.toString();
  const scale = 10n ** BigInt(fractionDigits);
  const whole = (amount / scale).toString();
  const fraction = (amount % scale).toString().padStart(fractionDigits, "0").replace(/0+$/, "");
  return fraction ? `${whole}.${fraction}` : whole;
}

module.exports = { amountToMinorUnits, hasAdminClaim, minorUnitsToDecimalString };
