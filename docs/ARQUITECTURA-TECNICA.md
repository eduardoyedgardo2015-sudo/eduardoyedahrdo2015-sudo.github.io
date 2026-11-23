# NEXUS — Arquitectura técnica

**Estado:** arquitectura propuesta, subordinada a los requisitos confirmados en `DOCUMENTO-MAESTRO.md`. Una decisión marcada **PROPUESTO** no es una decisión de producto aprobada.

## 1. Principios

1. PostgreSQL/Supabase es la fuente de verdad de perfiles operativos, disponibilidad, reservas, precios aplicados, pagos locales, créditos, membresías, clases, ocupación e historial.
2. El cliente web solicita operaciones; no es autoridad para confirmar disponibilidad, precio, pago, rol o acceso.
3. Las operaciones críticas validan identidad, permiso, alcance, estado y reglas en backend.
4. Mantener GitHub Pages para frontend estático mientras cubra las necesidades de rutas, dominios y despliegue.
5. Preservar la identidad visual existente y separar la experiencia pública de las áreas autenticadas.
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
        │ HTTPS; sesión de Supabase Auth
        ├── Supabase Auth: identidad, verificación y recuperación
        ├── Supabase API + RLS: acceso a filas autorizado
        ├── Supabase Storage: archivos con políticas de acceso
        └── Supabase Edge Functions: operaciones confiables
             ├── cotizar/crear/cancelar reservas
             ├── pagos y webhook de Mercado Pago
             ├── créditos y membresías
             ├── sesiones de clases/lista de espera
             ├── QR, validación y eventos de acceso
             └── notificaciones
                    ├── Mercado Pago
                    └── Resend (solo si se aprueba)
        │
        └── PostgreSQL: datos transaccionales y auditoría

GitHub Pages: publicación de interfaces estáticas
```

### GitHub Pages

**CONFIRMADO como decisión inicial:** conservarlo para el sitio público mientras sea compatible. También puede servir interfaces estáticas si la experiencia, las rutas y el despliegue lo permiten. No ejecuta lógica privada ni almacena secretos. Si se utiliza navegación SPA, hay que resolver rutas bajo el subdirectorio del repositorio o elegir posteriormente un dominio/hosting compatible; no cambiar el hosting como decisión implícita.

### Supabase

**CONFIRMADO como plataforma elegida:** PostgreSQL, Auth, Storage, Row Level Security (RLS) y Edge Functions. RLS limita el acceso directo mediante la API. Las operaciones de negocio sensibles pasan por funciones de backend cuando la lógica, los secretos, las transacciones o la integración externa lo requieren.

### Mercado Pago

**CONFIRMADO como proveedor de pago:** checkout online, notificaciones/webhooks y renovación automática cuando esté habilitada. La función de servidor inicia y reconcilia operaciones; el retorno del navegador no prueba aprobación.

### Resend

**EN EVALUACIÓN:** proveedor de correo transaccional. Verificar dominio, entregabilidad, costos, plantillas y separación del correo de Auth antes de adoptarlo.

## 3. Tecnologías: confirmadas y no impuestas

| Tecnología | Estado | Motivo/alcance |
|---|---|---|
| HTML, CSS y JavaScript del sitio | IMPLEMENTADO actualmente | Base institucional revisada. |
| GitHub Pages | CONFIRMADO para el sitio público mientras sea compatible | Hosting estático; no es backend. |
| Supabase/PostgreSQL/Auth/Storage/RLS/Edge Functions | CONFIRMADO | Plataforma elegida de datos, identidad y backend. |
| Mercado Pago | CONFIRMADO | Pagos y renovaciones automáticas configuradas cuando correspondan. |
| Resend | EN EVALUACIÓN | Correo transaccional. |
| Framework de frontend | PROPUESTO / pendiente de selección | Elegir solo si mejora rutas, estructura, pruebas y mantenibilidad de la cuenta y el panel. No se impone React ni Next.js. |
| ORM, Redis, colas o proveedor adicional de hosting | NO DECIDIDO | No agregar hasta que necesidades verificadas lo justifiquen. |

## 4. Estructura futura propuesta

La siguiente estructura es una guía, no un requisito de utilizar tecnologías determinadas:

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
│       │   │   ├── auth/
│       │   │   ├── catalog/
│       │   │   ├── reservations/
│       │   │   ├── pricing/
│       │   │   ├── payments/
│       │   │   ├── credits/
│       │   │   ├── memberships/
│       │   │   ├── classes/
│       │   │   └── access/
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
└── .github/workflows/
```

Las funciones se nombran por responsabilidad. Separar funciones adicionales solo cuando aporte aislamiento o mantenibilidad. Las migraciones guardan el historial reproducible del esquema. Los seeds, si existen, serán de desarrollo y estarán claramente marcados como datos no productivos; nunca representarán precios u horarios reales.

## 5. Modelo relacional propuesto

Los nombres finales, tipos concretos de PostgreSQL, enumeraciones y políticas deben definirse en migraciones revisadas. Los UUID son una propuesta técnica, no una condición funcional. Las fechas se almacenan en UTC; la zona horaria oficial queda pendiente.

### Organización e identidad

- `organizations`: identidad organizativa y estado; permite agrupar una o varias sedes sin asumir cuántas existen.
- `venues`: organización, nombre, dirección confirmada, zona horaria y estado.
- `profiles`: relación 1:1 con `auth.users`; nombre, apellido, teléfono, fotografía de perfil, aceptación de términos, número de socio opcional y estado. No duplica contraseñas.
- `roles`, `permissions`, `role_permissions`: catálogo de roles, acciones y relación de permisos.
- `user_roles`: usuario, rol y alcance (sede u organización), quién lo concedió y fecha. Asegura que un rol no se aplique fuera de su ámbito.

### Edificios, recursos y calendario

- `buildings`: sede, nombre y estado.
- `facilities`: edificio, nombre, tipo, estado activo/mantenimiento/cerrado, capacidad si se define, si admite reserva y política de acceso.
- `sports`: disciplinas aprobadas.
- `facility_sports`: relación muchos-a-muchos recurso/deporte y configuración; permite actividades por franjas sin duplicar la instalación.
- `availability_templates`: recurso, día/periodo, intervalos y vigencia; reglas recurrentes.
- `schedule_blocks`: recurso, inicio/fin, motivo y actor; cierres y mantenimiento.
- `booking_policies`: recurso, duraciones permitidas, anticipación y reglas. Debe permitir las duraciones confirmadas de 30–120 minutos cada 15, sin inventar ventanas horarias.
- `access_policies`: ámbito, requisito de membresía/reserva, política de capacidad y condiciones. No presume acceso a todo el parque.

### Precio y reservas

- `pricing_rules`: recurso/ámbito, base, moneda, límites, descuentos/recargos/porcentajes, condiciones, niveles de demanda y vigencia. No almacenar ejemplos como tarifas reales.
- `demand_snapshots` o registro equivalente: señales de ocupación/demanda y momento utilizados; opcionalmente materializado para explicar una cotización, sin sustituir reglas.
- `price_quotes`: usuario, recurso, franja, duración, importe/moneda, desglose, versión de regla y caducidad; conserva lo mostrado durante el proceso.
- `reservations`: usuario, código único, estado, método de pago, importe/moneda y retención; entidad principal de la reserva.
- `reservation_items`: recurso, comienzo/fin, duración, importe aplicado y copia de cotización; conserva el precio confirmado.
- `reservation_participants`: participantes cuando el modelo aprobado requiera identificarlos.
- `reservation_status_history`: estado anterior/nuevo, fecha, actor y motivo.
- `delay_notices`: reserva, autor, hora, demora comunicada y revisión; da soporte al procedimiento de ausencias.

Las restricciones y transacciones deben impedir solapamientos incompatibles del mismo recurso. Hay que decidir por recurso si la unidad es una reserva completa o plazas/personas. El mecanismo específico (por ejemplo, restricción de rangos de PostgreSQL o bloqueo transaccional equivalente) se valida en pruebas de concurrencia.

### Pagos, créditos y devoluciones

- `payments`: usuario, reserva o membresía, proveedor, referencia externa, método, importe/moneda y estado.
- `payment_events`: proveedor e ID de evento único, pago, tipo, fecha de procesamiento y referencia al mínimo de payload necesario.
- `refunds`: pago, importe, motivo, estado y referencia del proveedor, solo si se habilitan devoluciones.
- `credit_accounts`: cuenta del cliente.
- `credit_ledger`: entradas de emisión, consumo, reversión/ajuste, origen, reserva, importe, vencimiento, actor y motivo. El saldo se deriva de movimientos; no se borra un movimiento ya aplicado.

### Membresías, clases y límites

- `membership_plans`: nombre, descripción, importe/moneda cuando se definan, duración, modo de renovación y estado.
- `membership_plan_benefits`: actividades incluidas, acceso a sectores y modalidad ilimitada/semanal/mensual con parámetros definidos.
- `memberships`: usuario, plan, estado, vigencia, renovación y referencias de pago/proveedor.
- `classes`: actividad, descripción, deporte, instructor, instalación y estado.
- `class_sessions`: clase, inicio/fin, capacidad y estado.
- `class_enrollments`: sesión, cliente, estado, fuente del derecho/pago y fechas. Restricción que impida inscripciones duplicadas activas.
- `class_usage_ledger`: uso, restitución o ajuste de cupo de clase por membresía/periodo; permite auditar límites semanales/mensuales.
- `class_attendance`: inscripción, resultado, actor y fecha.
- `waitlist_entries`: tipo (clase/gimnasio), recurso/sesión, usuario, posición/criterio, estado y expiración de oferta. La lista de espera del gimnasio está confirmada; las clases la contemplan; no se presume una lista general de canchas.

### Acceso y operación

- `access_tokens`: usuario, hash/token verificable, alcance, emisión, expiración, uso y revocación. QR temporal, no credencial permanente con datos personales.
- `access_events`: socio, recurso/ámbito, reserva/membresía relacionada, evento de entrada/salida/rechazo, método QR/manual, resultado, personal responsable y fecha.
- `occupancy_state`: proyección opcional de ocupación actual/versionada, reconciliable con eventos. No reemplaza el historial de entradas/salidas.
- `notifications`: destinatario, canal, tipo, estado, referencia del proveedor, programación e intentos.
- `notification_rules`: tipo de aviso, activación, anticipación y condiciones configurables.
- `audit_logs`: actor, acción, entidad, referencia, motivo y datos mínimos para reconstruir el cambio.
- `idempotency_keys`: clave, usuario/operación, hash de solicitud, referencia de resultado y vencimiento; evita efectos duplicados.

### Relaciones principales

`organizations` → `venues` → `buildings` → `facilities`; `facilities` ↔ `sports`; `facilities` → `availability_templates`, `schedule_blocks` y `pricing_rules`; `profiles` → `reservations`, `memberships`, `credit_accounts` y `access_events`; `reservations` → `reservation_items` → `facilities`; `reservations` → `payments`, `payment_events` e historial de estados; `membership_plans` → beneficios → `memberships` → uso de clases; `classes` → `class_sessions` → `class_enrollments` → asistencia; el acceso enlaza perfil con derecho de reserva/membresía y recurso autorizado.

## 6. Estados y transacciones

### Reservas

Los estados funcionales son `awaiting_payment`, `confirmed`, `in_progress`, `completed`, `cancelled`, `revoked` y `absent` (con sus etiquetas en español). `awaiting_payment` es temporal y no equivale a `confirmed`. El pago presencial puede tener reserva `confirmed` y pago `pending`.

### Pagos

Estados funcionales: pendiente, pagado, fallido y reembolsado cuando corresponda. Mantener eventos externos y transiciones auditables.

### Transacciones obligatorias

- **Reserva:** validar disponibilidad y crear reserva/retención como una única operación consistente.
- **Consumo de crédito:** comprobar saldo/vencimiento y registrar el asiento junto a la reserva.
- **Clase:** comprobar elegibilidad, límite y cupo antes de la inscripción/consumo.
- **Acceso:** comprobar derecho y capacidad antes de registrar entrada.
- **Lista:** asignar plaza a una única persona bajo concurrencia.
- **Pago:** procesar webhooks idempotentemente y reconciliar efectos parciales.

## 7. Seguridad y protección de información

- HTTPS en todos los entornos.
- Verificación de correo y recuperación de cuenta.
- RLS habilitada en tablas accesibles mediante API; política de denegación por defecto y acceso mínimo.
- El cliente accede a sus datos, salvo operaciones autorizadas para personal.
- Roles y alcance comprobados en backend, no solo en botones/rutas.
- `service_role`, secretos de Mercado Pago y otros tokens privados únicamente en el entorno seguro de funciones; nunca en JavaScript, GitHub Pages o el repositorio.
- Las funciones validan identidad, permiso, entrada, estado y reglas.
- Webhooks de Mercado Pago autenticados/verificados y reconciliados contra el proveedor.
- Claves únicas e idempotencia para operaciones de pago y eventos.
- QR temporal, limitado a un ámbito explícito, validado online por backend.
- MFA para administradores y superadministradores recomendado; definir su obligatoriedad operativa antes de producción.
- Control de frecuencia, errores que no revelen datos personales, auditoría, copias de seguridad y ensayo de restauración.
- Storage privado para datos restringidos; fotos de perfil no deben exponerse sin política de acceso.
- Minimización, consentimiento, retención, exportación y borrado conforme a legislación aplicable; jurisdicción y política definitiva pendientes.

## 8. Integraciones

- **Mercado Pago (confirmado):** pagos online y renovaciones automáticas habilitadas cuando correspondan; webhooks verificados por backend. Pendientes país, moneda, cuenta, medios y términos de recurrencia.
- **Resend (en evaluación):** correo de aplicación; evaluar entregabilidad, dominio, costos y relación con correos de Auth.
- **Supabase (confirmado):** Auth, base de datos, RLS, Storage y Edge Functions. Definir proyectos/entornos, copias, cuotas y políticas.
- **GitHub Pages (confirmado para el sitio público mientras sea compatible):** publicación estática. Evitar secretos en el contenido público.
- **WhatsApp:** opción futura; no integrar por defecto.

No se decide un proveedor adicional de colas, caché, analítica o hosting. Incorporarlo solo si los límites medidos lo justifican.

## 9. Despliegue, pruebas y mantenimiento

Separar desarrollo, pruebas y producción en configuraciones/proyectos apropiados. Versionar migraciones y revisar cambios de RLS antes de producción. Desplegar frontend estático mediante CI validando rutas, recursos y variables públicas. Guardar secretos en configuración segura del backend.

Pruebas necesarias:

- Políticas de acceso por rol y aislamiento de clientes.
- Transacciones y reservas simultáneas.
- Duraciones y solapamientos.
- Snapshot de precio.
- Pagos y webhooks repetidos/fallidos.
- Créditos parciales/vencidos.
- Renovaciones.
- Límites, cupos y listas.
- QR caducado, reutilizado o con alcance incorrecto.
- Entradas/salidas y reconciliación.
- Diseño responsive y accesibilidad.
- Restauración de copias de seguridad.

Monitorear fallos de pagos, webhooks, correo, reservas y acceso; establecer responsables y procedimientos de recuperación antes de la apertura. No declarar listo un entorno de producción sin validar privacidad, copias de seguridad, restauración y capacitación.
