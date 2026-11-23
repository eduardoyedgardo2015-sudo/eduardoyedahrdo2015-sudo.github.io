# NEXUS — Plan de implementación

**Propósito:** ordenar la construcción sin implementar varias etapas simultáneamente ni convertir decisiones pendientes en supuestos. Este plan no indica que exista código para las etapas listadas.

## Reglas de ejecución

- Trabajar una etapa y sus criterios de salida antes de abrir la siguiente.
- Antes de modificar archivos funcionales, describir alcance, riesgos y pruebas.
- No cargar tarifas, horarios, capacidades o cantidades no confirmadas.
- Mantener la página y la identidad visual mientras se incorporan nuevas experiencias.
- Una función se declara implementada solo después de código, pruebas y documentación verificables.
- Seguridad, RLS, historial y concurrencia son parte de cada etapa, no trabajo opcional posterior.

## Etapa 0 — Cierre funcional y datos operativos

**Prioridad:** bloqueante.

**Trabajo:** resolver la modalidad de reserva por recurso; reglas de precio dinámico; políticas de cancelación y ausencia; retención de pago; capacidades; membresías y beneficios; reglas de clases; QR y contingencia; datos comerciales requeridos para Mercado Pago.

**Criterio de salida:** decisiones aprobadas o registradas explícitamente como no incluidas en la primera apertura. No hacen falta precios ficticios para diseñar esquema, pero no se habilita venta real sin precio/moneda y condiciones aprobadas.

## Etapa 1 — Preparación y arquitectura ejecutable

**Dependencia:** etapa 0 en cuanto a decisiones que afecten estructura.

**Trabajo:** documentar estructura del repositorio; elegir si se conserva JavaScript simple o se adopta framework, justificándolo; crear separación de entornos; definir despliegue estático; preparar Supabase en desarrollo; migraciones versionadas; verificación automática de documentación/build.

**Criterios de salida:** la página pública existente sigue funcionando; migraciones repetibles en desarrollo; no se exponen secretos; decisiones de frontend y rutas quedan registradas.

## Etapa 2 — Identidad, perfiles y permisos

**Trabajo:** registro, correo verificado, sesión, recuperación, perfil (incluida fotografía según política), términos; roles, permisos y alcance; RLS; interfaz separada para cliente y personal.

**Pruebas críticas:** cliente A no puede consultar/editar perfil del cliente B; cliente no eleva rol; personal no accede fuera de alcance; recuperación y verificación funcionan.

**Criterio de salida:** matriz de permisos probada desde API y base de datos, no solamente desde interfaz.

## Etapa 3 — Catálogo, calendario y bloqueos

**Trabajo:** sedes/edificios, catálogo aprobado de deportes y recursos, instalaciones individuales, estados, horarios, cierres y mantenimiento. No inventar cantidades. Modelar NEXUS ARENA y MULTISPORT como edificios distintos según configuración aprobada.

**Pruebas críticas:** recurso cerrado o en mantenimiento no ofrece horarios; cancha multipropósito no puede asignarse a usos incompatibles; cuatro mesas pueden administrarse individualmente una vez cargadas como datos aprobados.

**Criterio de salida:** disponibilidad derivada de reglas persistidas, con datos de desarrollo claramente no productivos.

## Etapa 4 — Tarifas y motor de reservas

**Dependencia:** etapas 2 y 3; reglas de etapa 0.

**Trabajo:** cotización; niveles de demanda bajo/normal/alto/muy alto; desglose; duraciones 30–120 en intervalos de 15; retención online; reserva presencial confirmada con pago pendiente; estados e historial; cancelación y procedimiento de demora/ausencia.

**Pruebas críticas:** dos solicitudes simultáneas por franja incompatible; expiración de retención; precio snapshot; cambios de demanda no alteran reservas confirmadas; aviso de demora impide revocación automática ciega; transiciones no autorizadas se rechazan.

**Criterio de salida:** una sola reserva puede ganar un recurso/intervalo incompatible; historial completo; reglas y estados verificables.

## Etapa 5 — Pagos y créditos

**Dependencia:** etapa 4 y configuración comercial de Mercado Pago.

**Trabajo:** creación de checkout por función backend; webhook verificado; registro de pagos presenciales; estados; idempotencia; conciliación; crédito por cancelación pagada del cliente; vencimientos y uso parcial.

**Pruebas críticas:** webhook repetido, tardío y fuera de orden; pago fallido; retención vencida; crédito parcial; vencimiento; ajuste manual con permiso/motivo; no duplicar pago ni crédito.

**Criterio de salida:** pruebas de sandbox y recuperación de fallas aprobadas; el retorno del navegador no aprueba pagos.

## Etapa 6 — Membresías y renovaciones

**Trabajo:** catálogo editable de planes, beneficios, suscripciones, vigencia, estado, renovación manual y opción automática mediante Mercado Pago.

**Pruebas críticas:** membresía no activa sin pago requerido; expiración; renovación automática verificada; renovación manual; falla; cambio de plan sin alterar operaciones históricas; acceso según beneficio.

**Criterio de salida:** estado de membresía y derecho de acceso reproducibles desde datos e historial.

## Etapa 7 — Clases grupales

**Trabajo:** clases, sesiones, instructores, horarios, instalaciones, capacidad, pago individual, derecho por membresía, límites ilimitados/semanales/mensuales, inscripciones, lista de espera y asistencia.

**Pruebas críticas:** concurrencia al último cupo; inscripción duplicada; sobreconsumo semanal/mensual; cancelación y ajuste de uso de acuerdo con regla aprobada; asignación de lista sin duplicar plaza.

**Criterio de salida:** cupos y uso de beneficios consistentes bajo reintentos y solicitudes concurrentes.

## Etapa 8 — QR y control de acceso

**Trabajo:** QR temporal, validación backend, alcance explícito, método manual, eventos entrada/salida, ocupación, capacidad del gimnasio, lista de espera, alertas por permanencia/salida faltante.

**Pruebas críticas:** QR vencido, reutilizado, para otro ámbito o socio inhabilitado; capacidad completa; registro manual auditado; salida y reconciliación; no liberar automáticamente por permanencia prolongada.

**Criterio de salida:** validación online y alternativa manual, aforo transaccional y procedimiento de contingencia aprobado.

## Etapa 9 — Paneles y comunicaciones

**Trabajo:** dashboard y módulos por rol para recepción, entrenadores y administradores; notificaciones por correo; Resend solo si se selecciona; reglas de anticipación y eventos.

**Pruebas críticas:** alcance por rol; accesibilidad/usabilidad móvil; reintentos de correo; no enviar notificación duplicada sin política; errores de proveedor visibles al personal autorizado.

**Criterio de salida:** personal puede completar flujos de trabajo documentados sin acceder a funciones ajenas a su rol.

## Etapa 10 — Preparación de apertura y mantenimiento

**Trabajo:** pruebas de extremo a extremo; seguridad; pruebas de concurrencia y pagos; revisión de datos publicados; backups/restauración; monitoreo; capacitación; manual de recepción y emergencias; soporte.

**Criterio de salida:** aprobación del responsable del negocio, operaciones críticas probadas, recuperación ensayada, secretos rotables, contenido público actualizado sin presentar servicios no disponibles como operativos.

## Priorización transversal

1. Privacidad, autorización, RLS, auditoría e idempotencia.
2. Disponibilidad y consistencia del motor de reservas.
3. Pago verificable y conciliación.
4. Membresías, clases y sus derechos de uso.
5. Acceso, aforo, entradas/salidas y listas confirmadas.
6. Experiencia visual, notificaciones, informes y mejoras operativas, manteniendo accesibilidad en todas las etapas.

La prioridad no elimina funciones del alcance; define dependencias para reducir riesgo.

## Registro de estado

Este plan describe trabajo futuro. A la fecha de revisión documental, no hay etapas funcionales de la plataforma implementadas en el repositorio. Registrar en cambios futuros: etapa, PR/commit, archivos, decisiones, pruebas, limitaciones y pendientes.
