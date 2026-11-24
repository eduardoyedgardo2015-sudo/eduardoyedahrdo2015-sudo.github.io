# NEXUS — Documento Maestro de Arquitectura Firestore

**Versión:** 1.0 — Borrador técnico de diseño  
**Proyecto Firebase:** `nexus-c0671`  
**Base de datos:** Cloud Firestore — Standard  
**Región:** `southamerica-east1`  
**Estado:** Diseño documental. No autoriza la creación de colecciones, documentos, reglas ni funciones en Firebase.

---

## 1. Objetivo

Definir la arquitectura de datos de NEXUS para gestionar el complejo deportivo, sus instalaciones, reservas, socios, membresías, clases, gimnasio, pagos, créditos, accesos, personal, notificaciones y operaciones administrativas.

Este documento será la referencia técnica para implementar progresivamente el sistema.

La arquitectura debe ser escalable, segura, auditable y compatible con una aplicación web estática desarrollada con HTML, CSS y JavaScript modular, alojada inicialmente en GitHub Pages e integrada con Firebase.

**Importante:** las colecciones y estructuras descritas son el modelo propuesto. No significa que deban crearse inmediatamente ni que todos los módulos se implementen en la primera versión.

## 2. Arquitectura general

- Frontend: HTML, CSS y JavaScript modular.
- Hosting inicial: GitHub Pages.
- Autenticación: Firebase Authentication con email y contraseña.
- Base de datos: Cloud Firestore.
- Operaciones sensibles: Firebase Cloud Functions.
- Pagos online: Mercado Pago, con confirmación exclusivamente mediante backend y webhook verificado.
- Notificaciones: email como primera etapa. Resend queda como alternativa tecnológica en evaluación.
- WhatsApp: posible integración futura.

Firestore será la fuente principal de datos operativos. No utilizar `localStorage` como fuente de verdad para reservas, pagos, membresías, créditos, permisos u operaciones financieras.

El frontend nunca debe poder concederse permisos a sí mismo ni confirmar operaciones financieras sensibles.

## 3. Principios de modelado

1. Usar identificadores estables para documentos.
2. Separar los datos de autenticación de los perfiles y datos operativos.
3. Separar estados de reservas de estados de pagos.
4. Mantener registros históricos de operaciones.
5. Evitar eliminar registros financieros y operativos.
6. Utilizar transacciones o mecanismos consistentes para operaciones que afecten varios documentos.
7. Guardar snapshots de precios y condiciones al confirmar una reserva.
8. Diseñar las consultas antes de definir índices.
9. Evitar duplicaciones innecesarias y documentos excesivamente grandes.
10. No generar documentos de disponibilidad para cada horario si la disponibilidad puede calcularse de forma segura a partir de horarios, bloqueos y reservas.
11. Mantener permisos y validaciones importantes del lado del servidor.
12. No almacenar información sensible de tarjetas de pago.

## 4. Usuarios, perfiles y permisos

### 4.1 `users`

Perfil general de cada usuario registrado.

Campos propuestos:

- `uid`: identificador de Firebase Authentication.
- `firstName`: nombre.
- `lastName`: apellido.
- `email`: correo electrónico.
- `emailVerified`: estado de verificación.
- `phone`: teléfono.
- `profilePhoto`: referencia a la imagen de perfil, si se implementa.
- `accountStatus`: estado de la cuenta.
- `termsAcceptedAt`: fecha de aceptación de términos.
- `createdAt`: fecha de creación.
- `updatedAt`: última modificación.

No almacenar contraseñas en Firestore. La autenticación y las credenciales corresponden a Firebase Authentication.

### 4.2 `members`

Información específica de los socios.

Campos propuestos:

- `userId`: referencia al usuario.
- `memberNumber`: número de socio.
- `membershipStatus`: estado de la condición de socio.
- `joinedAt`: fecha de incorporación.
- `createdAt`.
- `updatedAt`.

Una persona puede tener una cuenta sin ser socio. Ser socio no debe confundirse con un rol de seguridad.

### 4.3 `employees`

Información del personal de NEXUS.

Campos propuestos:

- `userId`: referencia al usuario.
- `employeeNumber`: identificador interno.
- `position`: puesto.
- `employmentStatus`: estado laboral.
- `assignedAreas`: sectores asignados.
- `createdAt`.
- `updatedAt`.

Los datos laborales y personales deben limitarse según permisos.

### 4.4 `roles`

Definición de roles del sistema.

Roles conceptuales:

- visitante;
- cliente;
- socio o miembro;
- empleado;
- recepcionista;
- instructor;
- administrador;
- superadministrador.

No todos representan roles de seguridad. Por ejemplo, cliente y socio describen condiciones del usuario, mientras que recepcionista, administrador e instructor pueden requerir permisos operativos.

### 4.5 `permissions`

Catálogo de permisos específicos.

Ejemplos:

- consultar reservas;
- crear reservas;
- cancelar reservas;
- registrar pagos presenciales;
- gestionar socios;
- administrar instalaciones;
- gestionar clases;
- consultar informes;
- modificar configuraciones;
- gestionar personal.

### 4.6 `staffAssignments`

Asignaciones de personal, roles y alcance operativo.

Debe permitir limitar el acceso de cada empleado a determinadas instalaciones, sectores o funciones.

La autorización definitiva debe verificarse en backend. No confiar en el rol enviado por el navegador.

## 5. Edificios, instalaciones y recursos

### 5.1 `buildings`

Representa los edificios principales.

Registros conceptuales iniciales:

- NEXUS ARENA.
- NEXUS MULTISPORT.

### 5.2 `facilities`

Representa sectores, instalaciones y espacios del complejo.

NEXUS ARENA contempla:

- básquet;
- vóley;
- musculación;
- entrenamiento;
- clases grupales;
- acondicionamiento físico.

NEXUS MULTISPORT contempla:

- fútbol 5 cubierto;
- preparación física;
- recreación;
- cuatro mesas independientes de tenis de mesa.

Sectores exteriores:

- fútbol 5 exterior;
- tenis exterior;
- pádel exterior.

También existen áreas comunes como recepción, plaza central, fuente, juegos, senderos, espacios verdes, estacionamiento y cantinas.

No todas las áreas comunes necesitan ser recursos reservables.

### 5.3 `resources`

Representa cada recurso concreto que puede reservarse o administrarse.

Ejemplos conceptuales:

- cancha de fútbol 5 cubierta;
- mesa de tenis de mesa 1;
- mesa de tenis de mesa 2;
- mesa de tenis de mesa 3;
- mesa de tenis de mesa 4;
- cancha de fútbol 5 exterior;
- cancha de tenis;
- cancha de pádel.

Cada recurso podrá incluir:

- `facilityId`;
- `name`;
- `resourceType`;
- `description`;
- `bookingEnabled`;
- `operationalStatus`;
- `bookingModel`;
- `createdAt`;
- `updatedAt`.

El modelo inicial de reservas será por recurso completo. Las cuatro mesas de tenis de mesa serán cuatro recursos independientes.

El sistema debe permitir evolucionar a reservas por plazas o capacidad configurable en el futuro, sin asumir que ese modelo está habilitado actualmente.

La cantidad y configuración definitiva de instalaciones debe ser confirmada por la administración antes de publicarse.

**Pendiente:** validar la configuración física de básquet y vóley y determinar si se implementará una cancha multipropósito.

## 6. Horarios, disponibilidad y bloqueos

### 6.1 `resourceSchedules`

Horarios de funcionamiento de cada recurso.

Debe admitir configuraciones por día de la semana, excepciones y períodos especiales.

No establecer horarios definitivos hasta recibir confirmación administrativa.

### 6.2 `resourceBlocks`

Bloqueos de disponibilidad por mantenimiento, eventos, cierres, tareas operativas u otras causas.

Campos conceptuales:

- `resourceId`;
- `startAt`;
- `endAt`;
- `reason`;
- `status`;
- `createdBy`;
- `createdAt`.

### 6.3 Disponibilidad

La disponibilidad debe calcularse combinando:

- horarios del recurso;
- bloqueos vigentes;
- reservas confirmadas;
- retenciones temporales de pago;
- reglas de duración y separación horaria.

No se debe crear una colección con un documento por cada intervalo de disponibilidad sin una justificación técnica concreta.

La comprobación y creación de una reserva deben ser operaciones seguras del backend para evitar reservas superpuestas.

### 6.4 Duraciones

Duraciones configurables previstas:

- 30 minutos;
- 45 minutos;
- 60 minutos;
- 75 minutos;
- 90 minutos;
- 105 minutos;
- 120 minutos.

La grilla horaria debe poder configurarse por recurso.

**Pendiente:** definir anclaje de horarios, márgenes entre turnos y reglas de superposición.

## 7. Reservas

### 7.1 `reservations`

Documento principal de cada reserva.

Campos propuestos:

- `userId`;
- `resourceId`;
- `startAt`;
- `endAt`;
- `durationMinutes`;
- `reservationStatus`;
- `paymentStatus`;
- `paymentMethod`;
- `pricingSnapshot`;
- `cancellationPolicySnapshot`;
- `createdAt`;
- `updatedAt`;
- `confirmedAt`;
- `cancelledAt`;
- `cancelReason`.

Los snapshots deben conservar las condiciones económicas y las políticas aplicables cuando se confirmó la reserva.

### 7.2 Estados de reserva

Estados conceptuales:

- `awaiting_payment`: esperando pago.
- `confirmed`: confirmada.
- `in_progress`: en curso.
- `completed`: finalizada.
- `cancelled`: cancelada.
- `revoked`: revocada.
- `no_show`: ausencia registrada.

### 7.3 `reservationEvents`

Historial de acontecimientos de cada reserva.

Debe permitir reconstruir cambios de estado, responsables, fechas y motivos.

Los eventos históricos no deben modificarse ni eliminarse desde el flujo habitual.

### 7.4 `reservationHolds`

Retenciones temporales de disponibilidad durante el proceso de pago online.

Deben incluir vencimiento y estado. La retención debe expirar de forma controlada si no se recibe un pago válido.

La creación de una retención y la prevención de conflictos deben gestionarse en backend.

### 7.5 Reglas de pago

**Mercado Pago:**

- La reserva puede quedar temporalmente retenida mientras se espera el pago.
- El retorno del navegador no confirma el pago.
- La confirmación depende exclusivamente de una notificación verificada por backend.
- Si la retención vence sin pago válido, se libera la disponibilidad.

**Pago presencial:**

- La reserva se confirma automáticamente.
- El pago queda pendiente.
- Un empleado autorizado registra el cobro.
- No se cancela automáticamente una reserva presencial por no haber registrado el pago.

Los medios de pago presenciales quedan pendientes de definición.

## 8. Pagos y registros financieros

### 8.1 `payments`

Registro principal de operaciones de pago.

Debe relacionarse con usuario, reserva o membresía según corresponda.

Campos conceptuales:

- `userId`;
- `reservationId`;
- `membershipId`;
- `amount`;
- `currency`;
- `paymentMethod`;
- `paymentStatus`;
- `provider`;
- `providerReference`;
- `createdAt`;
- `updatedAt`;
- `paidAt`.

No guardar datos de tarjetas ni credenciales de pago.

### 8.2 `paymentEvents`

Historial inmutable de cambios y notificaciones de pago.

Debe permitir identificar el origen de cada cambio y evitar procesar dos veces el mismo evento externo.

### 8.3 `financialAdjustments`

Registro de ajustes financieros realizados por personal autorizado.

Debe guardar motivo, responsable, importe, fecha y referencia a la operación original.

No permitir modificaciones financieras silenciosas.

## 9. Créditos

### 9.1 `credits`

Registro o cuenta de créditos asociados a un usuario.

El saldo debe derivarse de movimientos, no ser la única fuente de verdad.

### 9.2 `creditTransactions`

Libro de movimientos de créditos.

Cada movimiento debe registrar:

- usuario;
- importe;
- tipo de movimiento;
- operación de origen;
- fecha;
- vencimiento, cuando corresponda;
- responsable o proceso que lo generó;
- referencia a la reserva o transacción relacionada.

### 9.3 Reglas de créditos

Cuando una reserva efectivamente pagada se cancela y corresponde un crédito:

- registrar la cancelación;
- generar un único crédito por el importe efectivamente abonado;
- relacionar el crédito con la operación original;
- realizar las operaciones de manera consistente;
- impedir créditos duplicados.

No generar créditos por pagos pendientes o fallidos.

El crédito puede utilizarse total o parcialmente en futuras reservas.

No asumir que puede aplicarse a membresías.

La vigencia de los créditos será configurable.

No realizar devoluciones automáticas de dinero como consecuencia de una cancelación.

## 10. Precios y políticas de cancelación

### 10.1 `pricingRules`

Reglas de precios por recurso y duración.

Se contemplan dos modelos:

1. Tarifa proporcional por unidad de tiempo.
2. Precio fijo según duración seleccionada.

Se contemplan niveles dinámicos de demanda:

- baja;
- normal;
- alta;
- muy alta.

La fórmula, importes, porcentajes, períodos y criterios de demanda quedan pendientes.

El precio final debe guardarse como snapshot en la reserva confirmada.

### 10.2 `cancellationPolicies`

Políticas generales y excepciones configurables.

Deben contemplar plazos, condiciones, posibles penalizaciones y excepciones por tipo de recurso o reserva.

Los plazos y penalizaciones no están definidos todavía.

La política deberá ser aceptada explícitamente por el usuario antes de confirmar la reserva.

## 11. Membresías y planes

### 11.1 `membershipPlans`

Catálogo de planes propuestos:

- NEXUS MUSCULACIÓN.
- NEXUS FITNESS.
- NEXUS COMBINADO.
- NEXUS FULL.

Períodos posibles:

- mensual;
- trimestral;
- semestral;
- anual.

Cada plan deberá definir beneficios, restricciones, precio, vigencia y condiciones de renovación.

Precios y beneficios definitivos pendientes.

### 11.2 `memberships`

Instancias de membresía contratadas por usuarios.

Debe contener usuario, plan, período, estado, fechas de vigencia y configuración de renovación.

### 11.3 `membershipPayments`

Registro de pagos vinculados a membresías.

### 11.4 `membershipEvents`

Historial de altas, renovaciones, cambios, suspensiones y bajas.

La renovación podrá ser manual o automática según el plan y las decisiones comerciales definitivas.

## 12. Clases y actividades grupales

### 12.1 `classes`

Catálogo y programación de clases.

Campos conceptuales:

- nombre;
- descripción;
- instructor;
- fecha;
- hora;
- duración;
- instalación;
- capacidad;
- plazas disponibles;
- modalidad de acceso;
- estado.

### 12.2 `classEnrollments`

Inscripciones de usuarios a clases.

Debe registrar el método de acceso, la condición de membresía o compra individual, el estado de la inscripción y los movimientos de plazas o créditos que correspondan.

### 12.3 `classWaitlists`

Listas de espera para clases completas.

### 12.4 `classEvents`

Historial de cambios e inscripciones relevantes.

Los socios podrán acceder cuando su plan lo permita. También se contempla compra individual y planes con límites semanales, mensuales o ilimitados.

La plaza se descuenta al inscribirse y se restaura según la política aplicable.

**Pendiente:** definir cancelación tardía, ausencias, vencimiento de ofertas de lista de espera y reglas de restauración.

## 13. Gimnasio y control de acceso

### 13.1 `gymConfiguration`

Configuración del gimnasio:

- capacidad máxima;
- reglas de ingreso;
- horarios;
- parámetros de control;
- configuración de alertas.

La capacidad todavía no está definida.

### 13.2 `gymOccupancy`

Registro o estado operativo de ocupación.

Debe permitir conocer entradas, salidas y ocupación actual de manera consistente.

### 13.3 `accessCredentials`

Credenciales de acceso asociadas a usuarios.

Se contempla QR dinámico temporal y una alternativa de identificación.

### 13.4 `accessEvents`

Historial de entradas y salidas.

Debe registrar método de identificación, usuario, fecha, resultado y empleado responsable cuando corresponda.

### 13.5 `gymWaitlist`

Lista de espera cuando el gimnasio alcance su capacidad máxima.

### 13.6 Reglas del gimnasio

- El acceso es gratuito para socios con membresía activa y válida que incluya el gimnasio.
- La reserva de acceso será opcional.
- Al completarse el aforo, se bloquean nuevos ingresos y se ofrece lista de espera.
- La salida puede registrarse mediante QR principal o registro manual alternativo.
- La consulta manual de identidad debe estar disponible para personal autorizado.
- Los registros manuales deben quedar auditados.
- La ocupación debe actualizarse en tiempo real.
- Deben existir alertas por estancias prolongadas o falta de registro de salida.
- No liberar automáticamente una plaza por falta de salida sin revisión.

**Pendiente:** alcance offline, duración y renovación del QR y reglas precisas de capacidad.

## 14. Notificaciones

### 14.1 `notifications`

Notificaciones destinadas a usuarios o personal.

### 14.2 `notificationTemplates`

Plantillas de mensajes por tipo de acontecimiento.

### 14.3 `notificationEvents`

Registro de intentos, resultados y errores de envío.

Primera etapa: email.

Resend queda en evaluación.

WhatsApp se contempla para una etapa futura.

## 15. Auditoría y configuración

### 15.1 `auditLogs`

Registro de acciones relevantes del sistema.

Debe permitir identificar:

- actor;
- acción;
- recurso afectado;
- fecha;
- resultado;
- motivo;
- referencia de la operación.

Debe protegerse contra modificaciones no autorizadas.

### 15.2 `systemSettings`

Configuraciones generales de NEXUS.

Solo administradores autorizados podrán gestionar configuraciones según el alcance de sus permisos.

### 15.3 `operationalReports`

Informes operativos derivados de los registros principales.

No utilizar esta colección para sustituir los datos originales ni como fuente única de operaciones financieras.

## 16. Relaciones principales

- `users` se relaciona con `members`, `employees`, `reservations`, `payments`, `memberships`, `credits` y `classEnrollments`.
- `buildings` contiene o agrupa `facilities`.
- `facilities` contiene o agrupa `resources`.
- `resources` se relaciona con `resourceSchedules`, `resourceBlocks` y `reservations`.
- `reservations` se relaciona con `reservationEvents`, `reservationHolds`, `payments` y `creditTransactions`.
- `membershipPlans` se relaciona con `memberships`.
- `memberships` se relaciona con `membershipPayments` y `membershipEvents`.
- `classes` se relaciona con `classEnrollments`, `classWaitlists` y `classEvents`.
- `accessCredentials` se relaciona con usuarios y `accessEvents`.
- `auditLogs` registra operaciones relevantes de los distintos módulos.

Las referencias entre documentos deben utilizar identificadores estables. Firestore no aplica relaciones ni integridad referencial como una base de datos SQL; las validaciones deben implementarse en la lógica del sistema.

## 17. Seguridad de Firestore

La base de datos se encuentra actualmente en modo de producción con reglas que deniegan todas las lecturas y escrituras.

**No abrir las reglas globalmente ni utilizar `allow read, write: if true`.**

El modelo definitivo de seguridad deberá garantizar:

- los usuarios solo pueden acceder a sus propios datos cuando corresponda;
- los roles y permisos se verifican del lado del servidor;
- las operaciones administrativas se limitan según permisos;
- el cliente no puede modificar pagos para declararlos pagados;
- el cliente no puede crear créditos por sí mismo;
- el cliente no puede confirmar reservas sin validación del backend;
- el cliente no puede modificar registros históricos financieros;
- las operaciones de acceso al gimnasio se validan y auditan;
- los datos personales se protegen según el alcance de cada rol.

Las operaciones críticas deben implementarse con Cloud Functions y validaciones del servidor.

El diseño final de reglas deberá contemplar cada colección y cada tipo de operación antes de habilitar acceso.

## 18. Transacciones y consistencia

Las operaciones que deben tratarse de forma atómica o con mecanismos de idempotencia incluyen:

- creación de reservas y comprobación de disponibilidad;
- creación y vencimiento de retenciones;
- confirmación de pagos;
- liberación de disponibilidad;
- cancelación y generación de créditos;
- consumo parcial o total de créditos;
- inscripción y liberación de plazas en clases;
- registro de entradas y salidas del gimnasio;
- actualización de ocupación.

Los webhooks externos deben ser idempotentes: recibir dos veces la misma notificación no debe duplicar pagos, créditos ni confirmaciones.

## 19. Índices y consultas

No crear índices indiscriminadamente.

Antes de definir índices compuestos se deben documentar las consultas reales de cada módulo.

Consultas previstas:

- reservas de un usuario;
- reservas de un recurso en un período;
- reservas por estado;
- reservas por fecha y recurso;
- pagos por usuario y estado;
- movimientos de créditos por usuario;
- membresías activas por usuario;
- clases por fecha e instalación;
- inscripciones por clase;
- ocupación del gimnasio;
- eventos de acceso por usuario y fecha;
- operaciones por empleado;
- registros de auditoría por actor, fecha y tipo.

Los índices necesarios deberán documentarse junto con las consultas que los justifican.

## 20. Estrategia de implementación

Implementar por etapas, con pruebas y revisión antes de avanzar.

**Etapa 1 — Base técnica**

- Firebase inicializado.
- Authentication.
- Estructura de perfiles.
- Primer diseño de seguridad.

**Etapa 2 — Instalaciones y disponibilidad**

- edificios;
- instalaciones;
- recursos;
- horarios;
- bloqueos;
- cálculo de disponibilidad.

**Etapa 3 — Reservas**

- creación;
- validación;
- estados;
- retenciones;
- cancelaciones;
- historial.

**Etapa 4 — Pagos y créditos**

- Mercado Pago;
- webhooks;
- pagos presenciales;
- créditos;
- ajustes auditados.

**Etapa 5 — Socios y membresías**

- planes;
- altas;
- vigencias;
- renovaciones;
- beneficios.

**Etapa 6 — Clases**

- programación;
- inscripciones;
- capacidad;
- listas de espera.

**Etapa 7 — Gimnasio**

- acceso;
- QR;
- ocupación;
- salidas;
- listas de espera;
- alertas.

**Etapa 8 — Administración**

- personal;
- roles;
- permisos;
- notificaciones;
- informes;
- auditoría.

Cada etapa requiere pruebas funcionales, de seguridad y de consistencia.

## 21. Decisiones pendientes

No inventar ni fijar valores para los siguientes puntos:

- cantidad y configuración definitiva de instalaciones;
- configuración física de básquet y vóley;
- posible cancha multipropósito;
- horarios de funcionamiento;
- capacidades de instalaciones;
- capacidad máxima del gimnasio;
- precios, porcentajes y fórmula de demanda;
- medios de pago presenciales;
- política de cancelación;
- plazos y penalizaciones;
- vigencia de créditos;
- beneficios y precios de membresías;
- condiciones de renovación;
- reglas de cancelación tardía y ausencias en clases;
- alcance offline del sistema de acceso;
- duración y renovación del QR;
- márgenes y anclaje de horarios;
- proveedor definitivo de email;
- fecha de apertura y disponibilidad real de las instalaciones.

Estos valores deben quedar configurables o identificados como pendientes, nunca completarse mediante suposiciones.

## 22. Restricciones de esta especificación

Este documento describe arquitectura y diseño. No autoriza por sí solo:

- crear colecciones en Firebase;
- crear documentos de prueba;
- modificar reglas de Firestore;
- publicar índices;
- crear Cloud Functions;
- habilitar operaciones de escritura;
- modificar datos reales;
- desplegar el proyecto;
- fusionar ramas;
- publicar cambios en `main`.

Toda implementación deberá ser autorizada por separado.

---

**Fin del Documento Maestro de Arquitectura Firestore — NEXUS.**
