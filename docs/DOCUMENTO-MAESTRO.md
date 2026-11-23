# NEXUS — Documento maestro funcional

**Estado del documento:** requisitos funcionales consolidados. Las marcas CONFIRMADO/PENDIENTE distinguen decisiones aprobadas de asuntos aún abiertos. Este documento no certifica que las funciones estén implementadas.

## 1. Identidad, visión y objetivos

**CONFIRMADO.** NEXUS es un parque deportivo, recreativo y gastronómico: deporte, naturaleza y encuentro. Su propuesta combina actividad física, entretenimiento, gastronomía, espacios verdes y encuentro para personas de distintas edades y niveles de experiencia. No debe presentarse como solamente un gimnasio o un conjunto de canchas.

Frases de identidad contempladas: “¡Mucho más que deporte!”, “Deporte, naturaleza y encuentro” y “El lugar donde el deporte y los buenos momentos se encuentran”. La identidad visual actual debe conservarse y evolucionar sin perder personalidad.

**Objetivo funcional:** hacer posible informar sobre el complejo, atender a clientes y socios, administrar recursos y horarios, tomar reservas y pagos, gestionar membresías y clases, controlar aforo y registrar accesos con trazabilidad.

**Estado de publicación:** el sitio actual es conceptual. Un servicio se comunica como operativo únicamente cuando su disponibilidad haya sido confirmada y habilitada. Imágenes conceptuales y planes futuros no son prueba de una instalación abierta.

## 2. Estructura física y organización del parque

### NEXUS ARENA

**CONFIRMADO como parte del concepto:** edificio deportivo independiente destinado a deportes de cancha, entrenamiento y actividad física. El documento funcional identifica básquet, vóley, musculación, entrenamiento, clases grupales y acondicionamiento físico. La configuración operativa de cada actividad, recurso y horario debe administrarse sin inventar cantidades.

El Documento Maestro proporcionado describe una cancha multipropósito que puede usarse para distintos deportes en horarios diferentes. **CONFIRMADO como concepto según esa descripción; PENDIENTE** precisar su configuración operativa final, recurso reservable, dimensiones, capacidad, equipos y habilitación efectiva. El sitio actual también la presenta como concepto, no como prueba de disponibilidad operativa.

### NEXUS MULTISPORT

**CONFIRMADO como parte del concepto:** segundo edificio deportivo independiente con fútbol cinco cubierto, preparación física, áreas recreativas y cuatro mesas de tenis de mesa. Las cuatro mesas deben poder administrarse individualmente como recursos cuando corresponda.

### Instalaciones exteriores

**CONFIRMADO como catálogo funcional previsto:** fútbol cinco exterior, tenis exterior y pádel. Cada recurso tendrá disponibilidad, calendario, horarios y tarifas independientes. Las cantidades adicionales no están definidas y no se inventan.

### Áreas comunes y servicios

El complejo contempla plaza central, fuente, juegos recreativos, senderos, espacios verdes, descanso, estacionamiento, recepción y bienvenida, cantinas distribuidas estratégicamente y bebederos de agua potable. No son dispensadores.

Los espacios comunes son de libre acceso sujeto a las condiciones operativas del parque. El acceso a espacios comunes no equivale a una autorización para usar una instalación reservable o un sector restringido.

Las cantinas deberán poder identificarse como distintos puntos de servicio si se incorporan posteriormente a la plataforma. **No se confirma** venta online, inventario digital ni integración gastronómica en la primera etapa.

### Catálogo de reservas confirmado

Las categorías de recursos reservables online especificadas son: básquet, vóley, fútbol cinco cubierto, cuatro mesas de tenis de mesa, fútbol cinco exterior, tenis exterior y pádel. La base debe representar recursos individualizados cuando sea necesario. No añadir cantidades ni otras disciplinas reservables sin aprobación.

**PENDIENTE:** el sitio actual menciona bádminton como posibilidad de la cancha de ARENA, pero no figura en el catálogo de reservas confirmado. Definir si se conserva como contenido conceptual, se incorpora como disciplina reservable o se retira.

## 3. Estados de publicación, operación y disponibilidad

Separar tres conceptos:

1. **Publicación:** proyectado/conceptual o información confirmada para mostrar.
2. **Estado operativo del recurso:** activo, en mantenimiento o cerrado.
3. **Disponibilidad de horario:** libre, ocupado, bloqueado o retenido temporalmente.

Un recurso en mantenimiento o cerrado no ofrece turnos. Un bloqueo temporal no equivale a eliminar la instalación. La interfaz pública no debe anunciar como operativo un servicio que solo está planificado.

## 4. Tipos de usuarios, perfiles y cuentas

Distinguir visitantes, clientes, socios y personal autorizado. Ser socio es una condición vinculada a una membresía; no implica acceso universal a todos los sectores.

El perfil contempla nombre, apellido, correo verificado, teléfono, contraseña administrada por el proveedor de autenticación, aceptación de términos, fotografía de perfil y número de socio cuando corresponda.

**PENDIENTE:** obligatoriedad de fotografía, formatos/tamaño, visibilidad, proceso de actualización y retención. No excluirla del modelo de requisitos.

Cada cliente podrá actualizar los campos permitidos, recuperar contraseña, iniciar/cerrar sesión y consultar sus propios datos, reservas, pagos, membresías, vencimientos, créditos, clases, historial de actividades y accesos. Podrá mostrar QR personal dinámico cuando corresponda. No se incluye una descarga independiente de credencial digital.

Los clientes solo pueden consultar su propia información. La atención presencial puede consultar lo estrictamente necesario según rol.

## 5. Registro, autenticación y seguridad de cuentas

**CONFIRMADO:** autenticación, recuperación de contraseña y verificación de correo forman parte de los requisitos. Supabase Auth es la plataforma decidida para autenticación.

El frontend presenta flujos de registro, inicio/cierre de sesión, verificación y recuperación, pero autorización y acceso a los datos se validan en backend y base de datos. El cliente no puede otorgarse roles ni modificar pagos, precios, créditos o estado de reserva por una petición del navegador.

## 6. Reservas y calendario

### Recursos y atributos configurables

Cada instalación debe admitir nombre, deporte, edificio/sector, estado operativo, horario, capacidad, duraciones permitidas, precio/reglas, disponibilidad, anticipación máxima, cierres especiales y bloqueos de mantenimiento. El sistema no precarga valores desconocidos.

### Flujo del cliente

1. Elegir deporte o actividad, recurso y fecha.
2. Consultar horarios reales del backend.
3. Elegir hora y duración permitida.
4. Consultar precio y reglas aplicables.
5. Completar/verificar perfil y seleccionar pago.
6. Confirmar la reserva.
7. Recibir comprobante o código de reserva y notificación configurada.

Duraciones funcionales confirmadas: 30, 45, 60, 75, 90, 105 y 120 minutos. El precio se calcula según duración y reglas del recurso. Los intervalos de inicio, márgenes entre turnos y reglas de redondeo quedan pendientes si no se derivan de una política configurada.

La disponibilidad debe provenir de la base de datos. No mostrar como disponible un horario ocupado, bloqueado o retenido. El backend y PostgreSQL son la autoridad final; la interfaz no garantiza disponibilidad hasta completar la transacción.

### Estados de reserva

Estados funcionales requeridos:

- **Esperando pago:** retención temporal de un horario mientras se completa pago online; no es una reserva confirmada.
- **Confirmada:** reserva aceptada. El pago puede estar pendiente si se eligió pago presencial.
- **En curso:** actividad dentro de su periodo operativo.
- **Finalizada:** actividad terminada.
- **Cancelada:** cancelación registrada sin borrar el historial.
- **Revocada:** reserva retirada por personal/proceso autorizado, con motivo y trazabilidad.
- **Ausente:** inasistencia registrada conforme al procedimiento de revisión.

Los cambios de estado conservan estado anterior/nuevo, fecha/hora, actor y motivo cuando corresponda. Las transiciones permitidas y su autoridad se validan en backend.

### Confirmación según pago

- **Presencial:** al completar correctamente el proceso, la reserva queda confirmada y el pago queda pendiente. Personal autorizado registra el cobro.
- **Online:** el horario queda retenido durante un plazo configurable. Mercado Pago confirma el pago mediante comunicación segura validada en backend. Si no se completa dentro del plazo, expira la retención y se libera disponibilidad.
- Precio definitivo transparente antes de confirmar y congelado al confirmar. En un checkout temporal, el importe cotizado se conserva mientras la retención sea válida.

### Concurrencia

La confirmación final debe protegerse mediante transacciones y restricciones de base de datos contra dos reservas incompatibles del mismo recurso. Se verifican nuevamente disponibilidad, bloqueos, retenciones, duración y precio en el servidor. La disponibilidad que vio el navegador puede quedar obsoleta.

### Ausencias y demoras

- Tolerancia máxima: 30 minutos desde el inicio.
- Revisión prevista a los 15 minutos.
- Posibilidad de revocar a los 30 minutos.
- Registrar avisos de demora del cliente.
- Considerar excepciones y exigir revisión por personal autorizado.

No revocar automáticamente ni liberar el horario ignorando un aviso de demora o una excepción. El procedimiento debe guardar aviso, revisiones y decisión. **PENDIENTE:** autoridad exacta y política para horas de ocupación perdidas o cobros ante ausencia.

## 7. Tarifas dinámicas

Niveles confirmados: **demanda baja, demanda normal, demanda alta y demanda muy alta**. El cálculo podrá considerar ocupación, día, horario, temporada, demanda y reglas particulares del recurso.

Administración podrá configurar precio base, límites mínimo/máximo, descuentos, recargos, porcentajes, condiciones y vigencias. Se debe conservar el desglose/reglas aplicadas a la cotización y al precio final. El cliente ve el precio antes de confirmar. Una reserva confirmada conserva su precio aunque las reglas cambien después.

**PENDIENTE:** valores, moneda, algoritmo y pesos de factores, cálculo de ocupación, límites por recurso, redondeo y tratamiento de cotizaciones simultáneas. Ningún ejemplo numérico se considera tarifa real.

## 8. Pagos

Métodos confirmados: pago presencial y pago online con Mercado Pago.

Estados: pendiente, pagado, fallido y reembolsado si se habilitan devoluciones. Registrar proveedor, referencia externa, importe, moneda, asociación a reserva/membresía y eventos. El navegador no puede declarar un pago aprobado.

Pagos presenciales se registran por personal autenticado con actor y fecha. Los pagos online se crean desde backend y se reconcilian mediante webhook autenticado/verificado. Reintentos no deben duplicar pagos ni confirmar varias veces la misma reserva.

Renovaciones automáticas de membresías usarán Mercado Pago si el plan y la configuración lo habilitan y se cumplen sus condiciones.

## 9. Cancelaciones, revocaciones y créditos

El cliente podrá cancelar desde su cuenta; personal autorizado podrá cancelar o revocar de acuerdo con permisos. Se conserva el registro y la historia de estados.

Cuando el cliente cancela una reserva ya pagada, el importe se convierte en crédito para futuras reservas, no en devolución automática. La política de cancelación por NEXUS, cierres y excepciones especiales no está resuelta.

La billetera contempla importe disponible, origen, vencimiento, fecha, utilización total/parcial y movimientos. La fuente de verdad es un libro mayor de movimientos, no un saldo editable sin trazabilidad. Los ajustes manuales requieren permiso, motivo y actor. El vencimiento configurado al emitir un crédito no cambia retroactivamente si la política general se modifica. No se presume que los créditos paguen membresías.

## 10. Membresías, planes y renovaciones

El sistema de membresías es distinto del alquiler de recursos, aunque integrado a la misma cuenta. Nombres propuestos configurables: NEXUS MUSCULACIÓN, NEXUS FITNESS, NEXUS COMBINADO y NEXUS FULL. Son propuestas de catálogo, no confirmación de precios o beneficios.

Administración configura nombre, descripción, precio, beneficios, duración, actividades incluidas, límites, renovación y disponibilidad. Duraciones: mensual, trimestral, semestral y anual. Deben soportarse renovación manual y automática por plan. El sistema registra vencimientos, renovaciones, pagos y estados.

**PENDIENTE:** beneficios exactos, precio y moneda, pausa/baja, prorrateo, intentos fallidos, cambio de plan y consentimiento de cobro recurrente.

## 11. Clases grupales, límites y asistencia

Cada definición de clase podrá configurar nombre, descripción, instructor, día/hora, duración, instalación, capacidad, estado, inscripciones, lista de espera y asistencia. Las sesiones concretas tienen fecha/hora y cupo.

Planes pueden incluir clases ilimitadas, límite semanal o límite mensual. El sistema descuenta el uso al inscribirse y lo ajusta si la inscripción se cancela conforme a políticas. Se permiten clases individuales pagadas sin membresía.

La inscripción debe validar sesión activa, cupo, elegibilidad, límites del plan y pago/crédito aplicable. La asistencia la registra entrenador o personal autorizado.

**PENDIENTE:** cancelación tardía, ausencia, restablecimiento de uso, prioridad/tiempo de lista de espera, forma de cobro individual y límites exactos por plan.

## 12. Gimnasio, QR, entradas, salidas y ocupación

### Acceso al gimnasio

**CONFIRMADO:** socio con membresía activa habilitada accede sin obligación de reservar. La reserva es opcional, permite controlar capacidad y asegurar disponibilidad. La capacidad máxima es configurable; al alcanzarse se bloquean nuevos ingresos y se ofrece lista de espera. No asumir que una autorización de gimnasio habilita todo el parque.

### QR

QR dinámico y temporal como método principal; backend verifica identidad/estado de membresía o reserva según el alcance concreto. No expone datos personales, no es credencial permanente y no se reutiliza indebidamente. Personal autorizado puede buscar al socio y registrar manualmente cuando el QR no pueda utilizarse.

**PENDIENTE:** alcance de cada token (gimnasio, instalación, reserva u otro sector), periodo de validez/rotación, regla de un solo uso, equipos de lectura y procedimiento sin conexión. No conceder automáticamente acceso a todo el complejo.

### Entrada, salida y ocupación

Registrar socio, fecha/hora, método, resultado y responsable de intervención manual. QR es el método principal; personal puede registrar ingreso/salida manual. La ocupación se actualiza a partir de eventos verificables. El estado operativo debe reconciliarse ante entradas/salidas incompletas.

Alertar sobre permanencias anormalmente largas o salidas faltantes. No liberar una plaza automáticamente por duración: requiere procedimiento de revisión. Si se alcanza capacidad, impedir nuevos ingresos y gestionar lista de espera sin asignar una plaza dos veces.

### Listas de espera

- Gimnasio: **confirmada** al alcanzar capacidad.
- Clases grupales: deben contemplar lista de espera según la funcionalidad prevista.
- Canchas: no se aprobó una lista de espera general; no implementarla como requisito confirmado.

El criterio, tiempo de oferta, notificación, expiración y asignación atómica requieren reglas. Una plaza ofrecida no se considera ocupada por dos personas concurrentemente.

## 13. Recepción y atención presencial

Recepción podrá consultar información, identificar reservas, acreditar/registrar pago presencial, informar actividades, orientar y resolver problemas de cuenta/acceso según sus permisos. Debe distinguir visitantes, clientes con reservas, socios con membresía y personal autorizado. Los espacios comunes no se confunden con instalaciones que requieren reserva o derecho específico.

Las acciones manuales se autentican, limitan por rol y registran actor, hora, resultado y motivo cuando corresponda.

## 14. Panel administrativo y experiencias

Panel privado, protegido por autenticación y autorización real. Módulos previstos:

- Dashboard de reservas, ocupación, pagos, membresías, clases y alertas.
- Clientes y consultas operativas limitadas.
- Calendario, reservas manuales, cancelación, revocación, ausencias e historial.
- Instalaciones, deportes, horarios, bloqueos, estado y disponibilidad.
- Tarifas dinámicas, condiciones y precios aplicados.
- Planes, socios, vencimientos, renovaciones y beneficios.
- Clases, instructores, cupos, inscripciones, listas y asistencia.
- Pagos, registro presencial, créditos y conciliación.
- QR, ingresos/salidas, ocupación, registros manuales y listas de espera.
- Configuración de políticas, notificaciones, permisos e informes.

Las experiencias se separan: sitio público; cuenta del cliente; área de socio; interfaz de recepción; panel administrativo; interfaz de entrenadores. Comparten identidad visual y componentes pertinentes, no permisos ni navegación indiscriminada.

## 15. Notificaciones

Correo electrónico es el canal inicial. Resend está en evaluación, no seleccionado definitivamente. Deben contemplarse registro/verificación, reserva, pago, fallo, cancelación, crédito, recordatorios, vencimiento de membresía, clases, cambios de actividad y lista de espera. Avisos a administración pueden incluir reservas, pagos, cancelaciones, ausencias, créditos, demanda e incidentes.

La configuración de notificaciones contempla activar/desactivar, anticipación, tipo de actividad y condiciones. WhatsApp es una posible incorporación posterior, no un servicio inicial confirmado.

## 16. Historial y auditoría

Conservar historiales de reservas y sus estados, pagos/eventos, créditos, membresías/renovaciones, inscripciones, asistencias, accesos, cambios de tarifas y permisos. Cada operación sensible debe identificar actor, fecha y motivo. Corregir mediante nuevos movimientos/estados compensatorios, no borrando registros originales.

## 17. Diseño, accesibilidad y experiencia

Mantener identidad, logotipo, lenguaje y diseño actual cuando sea técnicamente viable. La futura aplicación será responsive, clara y accesible; acciones importantes presentan estados, confirmaciones y errores comprensibles. La recepción y el entrenamiento requieren flujos de operación simples y diferenciados. No mezclar administración con la navegación pública.

## 18. Qué está implementado hoy y qué no

**IMPLEMENTADO en el repositorio revisado:** página institucional estática en español; secciones conceptuales del complejo; CSS responsive; menú móvil; modal informativo de reservas; configuración vacía para enlace externo, WhatsApp, Instagram, dirección y horarios; imágenes conceptuales.

**NO IMPLEMENTADO:** registro, autenticación, perfiles persistidos, base de datos, motor propio de reservas, calendarios reales, tarifas dinámicas, pagos presenciales u online, webhooks, créditos, membresías, renovación, clases con inscripciones, asistencia, QR, aforo, listas de espera, panel privado, permisos, correo transaccional, auditoría operativa y pruebas de esas funciones.

El sitio menciona Calenda como enlace futuro; el requisito confirmado actual es un motor propio. No se considera implementado.

## 19. Criterio de aceptación funcional transversal

Una función se considera implementada solo después de comprobarla en código y pruebas, incluyendo permisos, errores, persistencia, historial y comportamiento concurrente relevante. Contenido de una página, una maqueta o una propuesta técnica no prueba que exista capacidad operativa.
