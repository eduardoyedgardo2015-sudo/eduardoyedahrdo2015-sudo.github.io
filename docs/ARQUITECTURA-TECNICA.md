# NEXUS — Arquitectura técnica

**Estado:** arquitectura propuesta, subordinada a requisitos confirmados en `DOCUMENTO-MAESTRO.md`. Una decisión marcada PROPUESTO no es una decisión de producto aprobada.

## 1. Principios

1. PostgreSQL/Supabase es la fuente de verdad de perfiles operativos, disponibilidad, reservas, precios aplicados, pagos locales, créditos, membresías, clases, ocupación e historial.
2. El cliente web solicita operaciones; no es autoridad para confirmar disponibilidad, precio, pago, rol o acceso.
3. Operaciones críticas validan identidad, permiso, alcance, estado y reglas en backend.
4. Mantener GitHub Pages para frontend estático mientras cubra las necesidades de rutas, dominios y despliegue.
5. Preservar la identidad visual existente y separar experiencia pública de áreas autenticadas.
6. Registrar cambios financieros y operativos de manera auditable e idempotente.
7. No cargar datos productivos sin confirmación: recursos, cantidades, precios, horarios, capacidades y políticas.

## 2. Componentes y comunicación

```text
Navegador
├── Sitio público NEXUS
├── Cuenta del cliente/socio
├── Interfaz de recepción
├── Interfaz de entrenadores
└── Panel administrativo
        │ HTTPS; token de sesión de Supabase Auth
        ├── Supabase Auth: identidad, verificación y recuperación
        ├── Supabase API + RLS: acceso a filas autorizado
        ├── Supabase Storage: archivos con políticas de acceso
        └── Supabase Edge Functions: operaciones confiables
             ├── cotizar/crear/cancelar reservas
             ├── pagos y webhook Mercado Pago
             ├── créditos y membresías
             ├── sesiones de clases/lista de espera
             ├── QR, validación y eventos de acceso
             └── notificaciones
                    ├── Mercado Pago
                    └── Resend (solo si se aprueba)
        │
        └── PostgreSQL: datos transaccionales y auditoría
```

### GitHub Pages

**CONFIRMADO como decisión inicial:** conservarlo para el sitio público mientras sea compatible. También puede servir interfaces estáticas si la experiencia, las rutas y el despliegue lo permiten. No ejecuta lógica privada ni almacena secretos. Si se utiliza navegación SPA, hay que resolver rutas bajo el subdirectorio del repositorio o elegir posteriormente un dominio/hosting compatible; no cambiar el hosting como decisión implícita.

### Supabase

**CONFIRMADO como plataforma elegida:** PostgreSQL, Auth, Storage, Row Level Security (RLS) y Edge Functions. RLS limita acceso directo mediante la API. Las operaciones de negocio sensibles pasan por funciones de backend cuando la lógica, secretos, transacciones o integración externa lo requieren.

### Mercado Pago

**CONFIRMADO como proveedor de pago:** checkout online, notificaciones/webhooks y renovación automática cuando esté habilitada. La función de servidor inicia y reconcilia operaciones; el retorno del navegador no prueba aprobación.

### Resend

**EN EVALUACIÓN:** proveedor de correo transaccional. Verificar dominio, entregabilidad, costos, plantillas y separación de correo de Auth antes de adoptarlo. No es requisito que se contrate ahora.

## 3. Tecnologías: confirmadas y no impuestas

| Tecnología | Estado | Motivo/alcance |
|---|---|---|
| HTML, CSS, JavaScript del sitio | Implementado actualmente | Base institucional revisada. |
| GitHub Pages | Decisión confirmada para sitio público mientras compatible | Hosting estático; no backend. |
| Supabase/PostgreSQL/Auth/Storage/RLS/Edge Functions | Decisión confirmada | Plataforma de datos, identidad y backend elegido. |
| Mercado Pago | Decisión confirmada | Pagos y renovaciones automáticas configuradas. |
| Resend | En evaluación | Correo transaccional. |
| Framework de frontend | PROPUESTO/pendiente de selección | Elegir solo si mejora rutas, estructura, pruebas y mantenibilidad de la cuenta y panel. No se impone React/Next.js. |
| ORM, Redis, colas, proveedor de hosting adicional | No decidido | No agregar hasta que necesidades verificadas lo justifiquen. Supabase/PostgreSQL y funciones pueden cubrir el diseño inicial; evaluar luego límites y operación. |

## 4. Estructura futura propuesta

La siguiente estructura es una guía, no un requisito de usar tecnologías determinadas:

```text
nexus/
├── apps/
│   └── web/
│       ├── public/assets/
│       ├── src/
│       │   ├── public-site/
│       │   ├── account/
│       │   ├── reception/
│       │   ├── trainers/
│       │   ├── admin/
│       │   ├── components/
│       │   ├── features/
│       │   │   ├── auth/ catalog/ reservations/ pricing/
│       │   │   ├── payments/ credits/ memberships/ classes/ access/
│       │   ├── lib/supabase/
│       │   └── styles/
│       └── tests/
├── supabase/
│   ├── config.toml
│   ├── migrations/
│   ├── functions/
│   │   ├── quote-reservation/
│   │   ├── create-reservation/
│   │   ├── cancel-reservation/
│   │   ├── create-payment/
│   │   ├── mercadopago-webhook/
│   │   ├── apply-credit/
│   │   ├── create-access-token/
│   │   ├── validate-access/
│   │   └── send-notification/
│   └── seed/
├── docs/
├── .github/workflows/
└── README.md
```

Las funciones se nombran por responsabilidad. Separar funciones adicionales solo cuando aporte aislamiento o mantenibilidad. Las migraciones guardan el historial reproducible del esquema. Seeds, de existir, serán de desarrollo y claramente no representarán precios/horarios reales.

## 5. Modelo relacional propuesto

Tipos concretos de PostgreSQL, nombres finales, enumeraciones y políticas deben definirse en migraciones revisadas. IDs UUID son una **propuesta técnica**, no una condición funcional. Fechas se almacenan en UTC; la zona horaria oficial queda pendiente.

### Organización e identidad

- `organizations`: identidad organizativa y estado; permite agrupar una o varias sedes sin asumir cuántas existen.
- `venues`: organización, nombre, dirección confirmada, zona horaria, estado.
- `profiles`: 1:1 con `auth.users`; nombre, apellido, teléfono, ruta de fotografía opcional/configurable, aceptación de términos, número de socio opcional y estado. No duplica contraseña.
- `roles`, `permissions`, `role_permissions`: catálogo de roles, acciones y mapa de permisos.
- `user_roles`: usuario/rol y alcance (sede u organización), concedido por y fecha. Asegura que un rol no se aplique fuera de su ámbito.

### Edificios, recursos y calendario

- `buildings`: sede, nombre, estado.
- `facilities`: edificio, nombre, tipo, estado activo/mantenimiento/cerrado, capacidad si se define, si admite reserva y política de acceso.
- `sports`: disciplinas aprobadas.
- `facility_sports`: relación muchos-a-muchos recurso/deporte y configuración; permite actividades por franjas sin duplicar la instalación.
- `availability_templates`: recurso, día/periodo, intervalos y vigencia; reglas recurrentes.
- `schedule_blocks`: recurso, inicio/fin, motivo, actor; cierres y mantenimiento.
- `booking_policies`: recurso, duraciones permitidas, anticipación, reglas y vigencia. Debe permitir las duraciones confirmadas de 30–120 minutos cada 15, sin inventar ventanas horarias.
- `access_policies`: ámbito, requisito de membresía/reserva, política de capacidad y condiciones. No presumir acceso a todo el parque.

### Precio y reservas

- `pricing_rules`: recurso/ámbito, base, moneda, límites, descuentos/recargos/porcentajes, condiciones, niveles de demanda y vigencia. No almacenar ejemplos como tarifas reales.
- `demand_snapshots` o registro equivalente: señales de ocupación/demanda y momento usados; opcionalmente materializado para explicar una cotización, sin sustituir reglas.
- `price_quotes`: usuario/recurso/franja/duración, importe/moneda/desglose, versión de regla y caducidad; conserva lo mostrado durante el proceso.
- `reservations`: usuario, código único, estado, método de pago, importe/moneda y retención; entidad principal de la reserva.
- `reservation_items`: recurso, comienzo/fin, duración, importe aplicado y copia de cotización; conserva el precio confirmado.
- `reservation_participants`: participantes cuando el modelo aprobado requiera identificar personas.
- `reservation_status_history`: estado anterior/nuevo, fecha, actor y motivo.
- `delay_notices`: reserva, autor, hora, demora comunicada y revisión; da soporte al procedimiento de ausencias.

Restricciones/transacciones deben impedir solapamientos incompatibles del mismo recurso. Hay que decidir por recurso si la unidad es reserva completa o plazas/personas. El mecanismo específico (p. ej. restricción de rangos de PostgreSQL o bloqueo transaccional equivalente) se valida en pruebas de concurrencia.

### Pagos, créditos y devoluciones

- `payments`: usuario, reserva o membresía, proveedor, referencia externa, método, importe/moneda y estado.
- `payment_events`: proveedor e ID de evento único, pago, tipo, fecha de procesamiento y referencia al mínimo de payload necesario. No almacenar datos innecesarios.
- `refunds`: pago, importe, motivo, estado y referencia de proveedor, solo si devoluciones se habilitan.
- `credit_accounts`: cuenta del cliente.
- `credit_ledger`: entradas de emisión, consumo, reversión/ajuste, origen, reserva, importe, vencimiento, actor y motivo. Saldo derivado de movimientos; no se borra un movimiento ya aplicado.

### Membresías, clases y límites

- `membership_plans`: nombre, descripción, importe/moneda cuando se definan, duración, modo de renovación y estado.
- `membership_plan_benefits`: actividades incluidas, acceso a sectores y modalidad ilimitada/semanal/mensual con parámetros definidos.
- `memberships`: usuario, plan, estado, vigencia, renovación y referencias de pago/proveedor.
- `classes`: actividad, descripción, deporte, instructor, instalación y estado.
- `class_sessions`: clase, inicio/fin, capacidad y estado.
- `class_enrollments`: sesión, cliente, estado, fuente de derecho/pago y timestamps. Restricción que impida inscripciones duplicadas activas.
- `class_usage_ledger`: uso, restitución o ajuste de cupo de clase por membresía/periodo; permite auditar límites semanales/mensuales.
- `class_attendance`: inscripción, resultado, actor y fecha.
- `waitlist_entries`: tipo (clase/gimnasio), recurso/sesión, usuario, posición/criterio, estado y expiración de oferta. Lista de espera de gimnasio confirmada; clases contempladas; no se presupone lista general de canchas.

### Acceso y operación

- `access_tokens`: usuario, hash/token verificable, alcance, emisión, expiración, uso/revocación. QR temporal, no credencial permanente con PII.
- `access_events`: socio, recurso/ámbito, reserva/membresía relacionada, evento de entrada/salida/rechazo, método QR/manual, resultado, personal responsable y fecha.
- `occupancy_state`: proyección opcional de ocupación actual/versionada, reconciliable con eventos. No reemplaza historial de entradas/salidas.
- `notifications`: destinatario, canal, tipo, estado, referencia del proveedor, programación, intentos.
- `notification_rules`: tipo de aviso, activación, anticipación y condiciones configurables.
- `audit_logs`: actor, acción, entidad, referencia, motivo y datos mínimos para reconstruir el cambio.
- `idempotency_keys`: clave, usuario/operación, hash de solicitud, referencia de resultado y vencimiento; evita efectos duplicados.

### Relaciones principales

`organizations → venues → buildings → facilities`; `facilities ↔ sports`; `facilities → availability_templates/schedule_blocks/pricing_rules`; `profiles → reservations/memberships/credit_accounts/access_events`; `reservations → reservation_items → facilities`; `reservations → payments/payment_events/status_history`; `membership_plans → benefits → memberships → class_usage`; `classes → class_sessions → enrollments → attendance`; `profiles → roles → permissions`; acceso enlaza perfil con derecho de reserva/membresía y recurso autorizado.

## 6. Estados y transacciones

### Reservas

`awaiting_payment`, `confirmed`, `in_progress`, `completed`, `cancelled`, `revoked`, `absent` representan requisitos de negocio; nombres internos pueden traducirse sin alterar sus significados. `awaiting_payment` es temporal y no equivale a `confirmed`. El pago presencial puede tener reserva `confirmed` y pago `pending`.

### Pagos

Estados funcionales: pendiente, pagado, fallido y reembolsado cuando corresponda. Mantener eventos externos y transiciones auditables.

### Transacciones obligatorias

- Reserva: validar disponibilidad y crear reserva/retención como una única operación consistente.
- Consumo de crédito: comprobar saldo/vencimiento y registrar asiento junto a la reserva.
- Clase: comprobar elegibilidad, límite y cupo antes de inscripción/consumo.
- Acceso: comprobar derecho y capacidad antes de registrar entrada.
- Lista: asignar plaza a una única persona bajo concurrencia.
- Pago: procesar webhooks idempotentemente y reconciliar efectos parciales.

## 7. Seguridad y protección de información

- HTTPS; verificación de correo y recuperación de cuenta.
- RLS habilitada en tablas accesibles mediante API; política de denegación por defecto y acceso mínimo.
- Cliente accede a sus datos, salvo operaciones autorizadas para personal.
- Roles y alcance comprobados en backend, no solo en botones/rutas.
- `service_role`, secretos Mercado Pago y otros tokens privados únicamente en entorno seguro de funciones; nunca en JavaScript, GitHub Pages o repositorio.
- Funciones validan identidad, permiso, entrada, estado y reglas.
- Webhooks Mercado Pago autenticados/verificados y reconciliados contra proveedor.
- Claves únicas e idempotencia para operaciones de pago y eventos.
- QR temporal, limitado a un ámbito explícito, validado online por backend.
- MFA recomendado para personal administrativo; Documento Maestro lo exige como recomendación operativa, pendiente definir obligatoriedad final.
- Control de frecuencia, errores que no revelen PII, auditoría, backups y ensayo de restauración.
- Storage privado para datos restringidos; perfil público no debe exponer fotos o documentos sin política.
- Minimización, consentimiento, retención, exportación y borrado conforme a legislación aplicable, jurisdicción aún no definida.

## 8. Integraciones

- **Mercado Pago (confirmado):** pagos online y renovaciones automáticas habilitadas; webhooks verificados por backend. Pendientes país, moneda, cuenta, medios y términos de recurrencia.
- **Resend (evaluación):** correo de aplicación; evaluar entregabilidad, dominio, costos y relación con correos de Auth.
- **Supabase (confirmado):** Auth, DB, RLS, Storage, Edge Functions. Definir proyectos/entornos, copias, cuotas y políticas.
- **GitHub Pages (confirmado para público mientras compatible):** publicación estática. Evitar cualquier secreto en el contenido público.
- **WhatsApp:** opción futura; no integrar por defecto.
- No se decide un proveedor adicional de colas, cache, analytics o hosting. Incorporarlo solo si límites medidos lo justifican.

## 9. Despliegue, pruebas y mantenimiento

Separar desarrollo, pruebas y producción en configuración/proyectos apropiados. Versionar migraciones y revisar cambios de RLS antes de producción. Desplegar frontend estático mediante CI validando rutas, assets y variables públicas. Guardar secretos en configuración segura del backend.

Pruebas necesarias: políticas de acceso por rol y aislamiento de clientes; transacciones y reservas simultáneas; duraciones y solapamientos; snapshot de precio; pagos y webhook repetido/fallido; créditos parcial/vencido; renovación; límites/cupos/listas; QR caducado/reutilizado/alcance incorrecto; entradas/salidas y reconciliación; responsive/accesibilidad; restauración de backup.

Monitorear fallos de pagos, webhooks, correo, reserva y acceso; establecer responsables y procedimientos de recuperación antes de apertura. No declarar listo un entorno de producción sin validar privacidad, backups, restauración y capacitación.
