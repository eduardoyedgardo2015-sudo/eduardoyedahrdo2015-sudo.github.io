# NEXUS repository instructions

## Purpose

This repository contains the NEXUS website and an MVP reservation system built with static JavaScript, Firebase Authentication, Cloud Firestore, and Firebase Cloud Functions.

Act as a hands-on implementation agent: inspect the relevant code and tests, implement complete fixes, run the smallest useful validation, and report untested external limitations explicitly. Do not stop at a plan or a list of recommendations.

## Read before changing code

- Check `git status` first. The worktree may contain pre-existing or in-progress changes. Preserve them and do not revert unrelated edits.
- Read the applicable sections of `docs/DOCUMENTO-MAESTRO.md`, `docs/DECISIONES-PENDIENTES.md`, `docs/PLAN-DE-IMPLEMENTACION.md`, `docs/ARQUITECTURA-TECNICA.md`, `docs/INVENTARIO-FUNCIONAL-NEXUS.md`, and `docs/ADMINISTRACION-RESERVAS.md`.
- For reservation work, also inspect `functions/index.js`, `functions/booking-domain.js`, `functions/admin-domain.js`, `js/bookings.js`, `js/admin-bookings.js`, `js/firebase/client.js`, `reservas.html`, `admin.html`, `configuracion-recursos.json`, `firestore.rules`, `firestore.indexes.json`, `firebase.json`, and `dev-server.mjs`.
- Preserve `docs/DOCUMENTO-MAESTRO-FIRESTORE.md` exactly as it is. Never edit, move, delete, or add it to a commit.
- Do not infer that a proposal is implemented or a service is configured. Use the repository vocabulary: DECIDIDO, PROPUESTO, PENDIENTE, IMPLEMENTADO, and CONFIGURADO only when supported by evidence.

## Project decisions that are mandatory

- Keep exactly these reservable resource IDs and names:
  - `basketball`: Básquet
  - `volleyball`: Vóley
  - `indoor-soccer-5`: Fútbol 5 cubierto
  - `outdoor-soccer-5`: Fútbol 5 exterior
  - `outdoor-tennis`: Tenis exterior
  - `padel`: Pádel
  - `table-tennis-1`: Tenis de mesa 1
  - `table-tennis-2`: Tenis de mesa 2
  - `table-tennis-3`: Tenis de mesa 3
  - `table-tennis-4`: Tenis de mesa 4
- Do not add badminton or a multipurpose court as reservable resources.
- Use `America/Argentina/Cordoba`; 15-minute start intervals; 30/45/60/75/90/105/120-minute durations; and ARS.
- Use the approved weekday and weekend schedules only as configuration: Monday-Friday 08:00-12:00 and 16:00-23:00, weekend 12:00-18:00.
- Demand has exactly four manual levels: `baja`, `normal`, `alta`, `muy_alta`. Never calculate demand from occupancy, popularity, reservation count, or any other automatic signal.
- Preserve the existing price rounding behavior and freeze the confirmed reservation price in its server-generated snapshot.
- Keep resource-complete reservations as the unit of reservation.

## Architecture and code conventions

- Respect the existing structure. Static browser code uses browser ES modules under `js/`; Cloud Functions use CommonJS under `functions/` and Node.js 22.
- Keep Cloud Functions in region `southamerica-east1`.
- Centralize sensitive validation and pricing in the server. Do not duplicate sensitive business rules into the frontend.
- Browser code must communicate through `js/firebase/client.js` and the existing callable wrappers. Keep emulator routing compatible with `?emulator=1`.
- Preserve public UI copy in Spanish and use clear, accessible DOM and status patterns already used in the booking and admin pages.
- Prefer existing helpers and naming patterns over abstractions or new dependencies. Do not introduce frameworks or unnecessary packages.
- Make surgical changes with a complete fix. Do not delete working behavior merely to simplify a test or implementation.

## Security and backend authority

- Authentication identifies a user; a custom claim is required for administration. The server must issue and verify admin authorization and must never accept role or price data supplied to grant privileges.
- Keep Firestore deny-by-default. Direct client writes must remain denied unless a reviewed rules change explicitly permits safe reads or writes.
- Validate every callable parameter in the backend. Never trust browser availability, resource, duration, or price.
- Use Firebase Admin and transactions for sensitive operations. Revalidate configuration, price, demand, schedule, exceptions, blocks, conflicts, and existing reservations on the server.
- Prevent overlapping reservations transactionally. Preserve idempotent request handling and 15-minute lock buckets or another documented atomic strategy.
- Never expose names, contact details, payment details, or private reservation data belonging to another user.
- Keep a single canonical status event history and separate general audit records.
- Never create public role-assignment functions or automatically create production administrators.
- Do not store secrets or Mercado Pago credentials in browser code or committed files.

## Availability and reservations

- Public availability must distinguish `available`, `occupied`, `blocked`, `no_demand_assignment`, and `no_price`, or an equivalent safe public state. Do not expose private third-party booking data.
- Never offer disabled or incompletely configured resources.
- Validate past dates, operation windows, date exceptions, 15-minute starts, durations, complete demand coverage, complete prices, active blocks, and overlaps.
- Return useful customer-facing explanations instead of raw Firebase or technical errors.
- Require authentication to create and inspect personal reservations. Every personal lookup must verify ownership in the backend.
- Preserve reservation snapshots and history when configuration or demand changes.
- Do not invent cancellation or revocation policies where the project documents them as pending.

## Administration

- Keep administration behind server-enforced authorization; the UI is not a security boundary.
- Support resource configuration, weekly schedules, date exceptions, intervals, prices, manual demand, blocks, reservation management, and audit where the relevant feature is in scope.
- Prevent overlapping active demand periods and allow adjacent periods.
- Prevent an active timezone change when active demand assignments exist unless the assignments are deactivated safely.
- Do not alter or delete existing reservations automatically when creating or changing a block.
- Record actor, action, affected resource, document, and timestamp for important administrative operations.
- Audit configuration changes and reservation transitions. Do not duplicate the canonical reservation event history.

## Frontend behavior

- Keep public and admin experiences responsive and accessible: semantic labels, keyboard navigation, visible loading/error states, no fake success, and coherent Spanish copy.
- Public pages must not expose administrative controls or technical Firebase implementation details.
- Disable unavailable options and show clear empty/incomplete states.
- Re-check availability after date, resource, or duration changes.
- Make available, occupied, blocked, and unavailable states visually distinct.
- Never announce a reservation or payment as approved unless a verified backend operation confirms it.

## Payments

- Mercado Pago is the only approved online provider, but production credentials and configuration may be absent.
- Keep payment implementation behind the backend, verify official webhook data, validate amount/reference in server code, and make reconciliation idempotent.
- Browser responses or redirects must never confirm a payment.
- Preserve the existing in-person payment method while it is the only enabled method.
- Use mocks/tests and document missing credentials or sandbox requirements. Do not simulate real approval or activate billing.

## Testing and validation

- Add or update focused tests for behavior changed by the implementation.
- The existing function test command is `cd functions && npm test`.
- Run tests in the emulator for backend and rule changes when tooling is available.
- Test concurrency, idempotency, ownership, admin authorization, schedule exceptions, overlap, price, duration, and configuration completeness for reservation changes.
- When validating UI behavior, use the local server and emulator URLs:
  - public: `http://localhost:8001/reservas.html?emulator=1`
  - admin: `http://localhost:8001/admin.html?emulator=1`
- Project ID: `nexus-c0671`. Region: `southamerica-east1`.
- Emulator ports come from `firebase.json`: Auth 9099, Functions 5001, Firestore 8080, and Emulator UI.
- A test is not passed unless it actually executed. Report external limitations precisely.

## Local operations and prohibited actions

- Start the emulators with a non-deploying local command, for example:
  `firebase emulators:start --only auth,functions,firestore,ui --project nexus-c0671`
- Start the local web proxy from the repository root with:
  `node dev-server.mjs`
- Never run `firebase deploy`, publish functions or rules, modify production Firebase services, change production permissions, create or activate billing, confirm real payments, or expose credentials.
- Do not modify `.env`, credential files, or production configuration. `.env` and credential material are not suitable for this repository.
- Do not commit or push unless the user explicitly asks. Leave changes prepared for review.

## Documentation and delivery

- Update directly relevant documentation for implemented behavior, emulator steps, external pending requirements, tests, or operational caveats.
- Do not rewrite the master documents to make pending decisions look resolved.
- When completing substantial work, summarize modified files, implemented behavior, tests run and results, and unresolved external requirements.
