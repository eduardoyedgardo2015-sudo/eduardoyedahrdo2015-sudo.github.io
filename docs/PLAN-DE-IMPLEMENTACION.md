# NEXUS — Plan de implementación

**Propósito:** ordenar el trabajo futuro sin convertir decisiones pendientes en supuestos. Este plan no acredita que una etapa esté implementada ni autoriza despliegues.

## Reglas de ejecución

- Trabajar por etapas y cumplir sus criterios de salida antes de continuar.
- Firebase es la plataforma **DECIDIDA**; la inicialización de su cliente existente no equivale a una función operativa ni a una configuración verificada.
- Aplicar Security Rules y autorización backend en cada etapa que maneje datos.
- Incorporar pruebas de Firebase Emulator Suite para reglas, funciones y flujos de integración.
- Diseñar consultas de Firestore e índices asociados a necesidades reales.
- Mantener auditoría, idempotencia, concurrencia y validaciones como requisitos transversales.
- No cargar precios, monedas, horarios, capacidades ni cantidades no aprobadas.
- Una función solo se marca **IMPLEMENTADO** después de verificar código y pruebas. Un servicio solo se marca **CONFIGURADO** tras verificar su configuración efectiva.

## Etapa 0 — Cierre funcional y datos operativos

**Prioridad:** bloqueante para activar operaciones reales.

**Trabajo:** cerrar reglas de precios y demanda; cancelaciones, ausencias y demoras; retenciones y vencimientos; horarios e intervalos de inicio; capacidades; políticas de membresías y clases; QR y contingencia; datos comerciales requeridos para pagos. La reserva por recurso completo está **DECIDIDA** y no es una decisión pendiente. No incluir cancha multipropósito ni bádminton como recursos reservables confirmados.

**Criterio de salida:** las decisiones necesarias para cada apertura están aprobadas o se documenta expresamente que quedan fuera de ese alcance. No se habilita venta real sin precio, moneda y condiciones aprobadas.

## Etapa 1 — Preparación Firebase y entorno de pruebas

**Trabajo futuro:** revisar la inicialización Firebase ya existente; separar entornos; definir los servicios que se habilitarán; preparar Firebase Emulator Suite; diseñar Security Rules, estructura documental y consultas; definir estrategia de despliegue estático y manejo de configuración pública/secretos.

**Criterios de salida:** cliente existente preservado; emuladores disponibles para las pruebas acordadas; reglas y funciones probadas localmente; ningún secreto en frontend. La documentación no declara configurados servicios externos.

## Etapa 2 — Identidad, perfiles y permisos

**Trabajo:** implementar registro, correo verificado, sesión, recuperación y perfil; gestionar fotografía conforme a política aprobada; definir permisos y alcances del personal. Socio es condición comercial vinculada a membresía, no rol de seguridad.

**Pruebas críticas:** cliente A no lee ni modifica los datos de cliente B; un cliente no puede otorgarse privilegios; permisos del personal respetan alcance; flujos de verificación y recuperación; pruebas de Security Rules y backend en Emulator Suite.

**Criterio de salida:** matriz de autorización probada contra reglas y operaciones backend, no solo desde la interfaz.

## Etapa 3 — Catálogo, calendario y bloqueos

**Trabajo:** cargar solo el catálogo aprobado, recursos individuales, edificios, estados operativos, horarios, cierres y mantenimiento. Las cuatro mesas de tenis de mesa son recursos independientes; no inventar cantidades adicionales. No cargar recursos conceptuales pendientes como operativos.

**Pruebas críticas:** recursos cerrados o en mantenimiento no ofrecen horarios; reglas de calendario y bloqueos; consultas respaldadas por índices necesarios y justificados.

**Criterio de salida:** disponibilidad derivada de datos aprobados, con datos de desarrollo claramente no productivos.

## Etapa 4 — Precios y motor propio de reservas

**Dependencia:** etapas 2 y 3 y reglas aprobadas en etapa 0.

**Trabajo:** cotización backend; niveles de demanda baja/normal/alta/muy alta; snapshot al confirmar; duraciones decididas de 30, 45, 60, 75, 90, 105 y 120 minutos; retenciones para pago online; reserva presencial confirmada con pago pendiente; transiciones e historial canónico `reservationEvents`; cancelación y revisión de ausencias/demoras.

**Pruebas críticas:** dos solicitudes simultáneas incompatibles; expiración y conciliación de retención; precio congelado; reintentos idempotentes; aviso de demora y revisión antes de cualquier revocación; transiciones no autorizadas rechazadas. Las pruebas deben usar Emulator Suite y el mecanismo de concurrencia elegido.

**Criterio de salida:** no se confirman reservas incompatibles; cada transición tiene estado anterior/nuevo, fecha, actor, motivo e información relevante; el historial no está duplicado.

## Etapa 5 — Pagos y créditos

**Dependencia:** etapa 4 y configuración comercial de Mercado Pago.

**Trabajo:** crear checkout desde backend; verificar webhooks; registrar pagos presenciales por personal autorizado; conciliar eventos; emitir y consumir créditos por movimientos auditables. La cancelación elegible de reserva pagada genera crédito, no reembolso automático.

**Pruebas críticas:** webhooks repetidos, tardíos y fuera de orden; pago fallido; pago luego de vencer una retención; consumo parcial; vencimiento y ajustes con permiso/motivo; ningún pago o crédito duplicado. Usar sandbox de Mercado Pago antes de considerar producción.

**Criterio de salida:** solo backend confirma pagos; la conciliación recupera efectos incompletos sin duplicarlos.

## Etapa 6 — Membresías y renovaciones

**Trabajo:** implementar planes conceptuales decididos (NEXUS MUSCULACIÓN, NEXUS FITNESS, NEXUS COMBINADO y NEXUS FULL), estado, vigencias y renovaciones manuales o automáticas según se apruebe cada plan. Períodos, precios, beneficios y reglas comerciales continúan pendientes.

**Pruebas críticas:** vigencia y acceso derivados del estado verificado; renovación manual; renovación automática habilitada y validada por proveedor; fallos y reintentos; cambios sin alterar el historial.

**Criterio de salida:** derechos y estado de membresía son reproducibles desde datos e historial.

## Etapa 7 — Clases grupales

**Trabajo:** definir clases, sesiones, instructores, capacidad, inscripciones, asistencia, listas de espera y elegibilidad. Aplicar reglas comerciales aprobadas para límites y pago individual.

**Pruebas críticas:** concurrencia al último cupo; inscripciones duplicadas; límites por plan; cancelación y ajuste de uso conforme a política; asignación idempotente de lista de espera.

**Criterio de salida:** cupos y uso de beneficios consistentes bajo reintentos y solicitudes concurrentes.

## Etapa 8 — QR y control de acceso

**Trabajo:** QR temporal validado en backend, alcance aprobado, alternativa manual para personal, registro de entrada/salida, control de ocupación, capacidad del gimnasio, alertas y lista de espera. No confundir ingreso al gimnasio con acceso general al parque.

**Pruebas críticas:** QR vencido, reutilizado, con alcance incorrecto o usuario no habilitado; capacidad completa; registro manual auditado; salida y reconciliación; alertas por permanencia/salida faltante. No liberar plazas automáticamente por falta de salida.

**Criterio de salida:** validación backend, alternativa manual y procedimiento de contingencia aprobado. No revocar automáticamente reservas por ausencia.

## Etapa 9 — Paneles y comunicaciones

**Trabajo:** interfaces según permisos para cliente, recepción, instructores y administración; notificaciones por correo; seleccionar Resend solo tras evaluar y aprobarlo.

**Pruebas críticas:** autorización por alcance; accesibilidad y experiencia móvil; reintentos sin notificaciones duplicadas; errores del proveedor visibles al personal autorizado.

**Criterio de salida:** personal completa flujos documentados sin acceder a funciones ajenas a su alcance.

## Etapa 10 — Preparación operativa

**Trabajo:** pruebas de extremo a extremo, privacidad, seguridad, concurrencia y pagos; revisión de datos públicos; backups y restauración; monitoreo, capacitación y procedimientos de recepción/incidentes.

**Criterio de salida:** responsable del negocio aprueba la apertura; operaciones críticas y recuperación están probadas; servicios necesarios aparecen **CONFIGURADOS** solo con evidencia; el contenido público no presenta como disponible algo no confirmado.

## Estado del plan

Todas las etapas funcionales descritas son futuras. La única pieza Firebase observada en el código es la inicialización del cliente; no acredita funciones operativas. No se declaran etapas completadas ni servicios de producción configurados.
