# NEXUS — Documento maestro funcional

**Estado:** autoridad funcional de NEXUS. Este documento distingue **DECIDIDO**, **PROPUESTO**, **PENDIENTE**, **IMPLEMENTADO** y **CONFIGURADO**. Una propuesta no es una decisión aprobada; documentar una función no demuestra que esté implementada ni que un servicio esté configurado.

## 1. Identidad, visión y objetivos

**DECIDIDO.** NEXUS es un complejo deportivo, recreativo, natural y gastronómico: deporte, naturaleza y encuentro. Su propuesta combina actividad física, entretenimiento, gastronomía, espacios verdes y encuentro para personas de distintas edades y niveles de experiencia. No debe presentarse como solamente un gimnasio o un conjunto de canchas.

Frases de identidad contempladas: «¡Mucho más que deporte!» y «Deporte, naturaleza y encuentro». La identidad visual actual debe conservarse y evolucionar sin perder personalidad.

**Objetivo funcional:** informar sobre el complejo, atender a clientes y socios, administrar recursos y horarios, gestionar reservas y pagos, gestionar membresías y clases, controlar aforo y registrar accesos con trazabilidad.

**Estado de publicación:** el sitio actual es conceptual. Un servicio se comunica como operativo únicamente cuando su disponibilidad haya sido confirmada y habilitada por una persona autorizada. Las imágenes conceptuales y los planes futuros no prueban que una instalación esté abierta.

## 2. Estructura física y organización del parque

### NEXUS ARENA

**DECIDIDO como parte del concepto:** edificio deportivo independiente. El catálogo de recursos reservables incluye básquet y vóley. Musculación, entrenamiento y clases grupales son actividades contempladas, no recursos reservables adicionales confirmados. La configuración operativa debe administrarse sin inventar cantidades.

**PENDIENTE:** la existencia y configuración de una cancha multipropósito no están aprobadas. No es un recurso reservable confirmado y no se debe cargar como tal.

### NEXUS MULTISPORT

**DECIDIDO como parte del concepto:** segundo edificio deportivo independiente con fútbol cinco cubierto, preparación física, áreas recreativas y cuatro mesas de tenis de mesa. Las cuatro mesas son recursos individuales e independientes.

### Instalaciones exteriores

**DECIDIDO como catálogo funcional:** fútbol cinco exterior, tenis exterior y pádel. Cada recurso tendrá disponibilidad, calendario, horarios y tarifas independientes. Las cantidades adicionales no están definidas y no se inventan.

### Áreas comunes y servicios

El complejo contempla plaza central, fuente, juegos recreativos, senderos, espacios verdes, descanso, estacionamiento, recepción y bienvenida, varias cantinas distribuidas estratégicamente y bebederos de agua potable. Los puntos de hidratación son bebederos de agua potable, no dispensadores.

Los espacios comunes son de libre acceso sujeto a las condiciones operativas del parque. El acceso a espacios comunes no equivale a una autorización para usar una instalación reservable o un sector restringido.

Las cantinas deberán poder identificarse como distintos puntos de servicio si se incorporan a la plataforma. La venta online, el inventario digital y la integración gastronómica en la primera etapa no están decididos.

### Catálogo de reservas decidido

Los recursos reservables decididos son:

- Básquet.
- Vóley.
- Fútbol cinco cubierto.
- Cuatro mesas de tenis de mesa.
- Fútbol cinco exterior.
- Tenis exterior.
- Pádel.

La base debe representar recursos individualizados cuando sea necesario. No añadir cantidades ni otras disciplinas reservables sin aprobación.

**PENDIENTE:** si se conserva bádminton como contenido conceptual del sitio. No forma parte del catálogo de recursos reservables decidido.

## 3. Estados de publicación, operación y disponibilidad

Separar tres conceptos:

1. **Publicación:** proyectado/conceptual o información confirmada para mostrar.
2. **Estado operativo del recurso:** activo, en mantenimiento o cerrado.
3. **Disponibilidad de horario:** libre, ocupado, bloqueado o retenido temporalmente.

Un recurso en mantenimiento o cerrado no ofrece turnos. Un bloqueo temporal no equivale a eliminar la instalación. La interfaz pública no debe anunciar como operativo un servicio que solo está planificado.

## 4. Tipos de usuarios, perfiles y cuentas

Distinguir visitantes, clientes, socios y personal autorizado. Ser socio es una condición vinculada a una membresía; no implica acceso universal a todos los sectores. «Socio» no necesita ser un rol de seguridad independiente del rol de cliente.

La cuenta contempla nombre, apellido, correo verificado, teléfono, contraseña administrada por el proveedor de autenticación, aceptación de términos, fotografía de perfil y número de socio cuando corresponda. La fotografía forma parte de los datos previstos del perfil; sus reglas técnicas (formatos, tamaño, almacenamiento y visibilidad) deben definirse. No eliminar este requisito.

Cada cliente podrá actualizar los campos permitidos, recuperar contraseña, iniciar/cerrar sesión y consultar sus propios datos, reservas, pagos, membresías, vencimientos, créditos, clases, historial de actividades y accesos. Podrá mostrar un QR personal dinámico cuando corresponda. No se incluye una descarga independiente de credencial digital.

Los clientes solo pueden consultar su propia información. La atención presencial puede consultar lo estrictamente necesario según rol.

## 5. Registro, autenticación y seguridad de cuentas

**DECIDIDO:** Firebase es la plataforma tecnológica del backend. Firebase Authentication cubrirá autenticación, recuperación de contraseña y verificación de correo. La inicialización del cliente Firebase existente no equivale a flujos funcionales de autenticación ni a configuración verificada de servicios.

El frontend presentará flujos de registro, inicio/cierre de sesión, verificación y recuperación, pero la autorización y el acceso a los datos se validan en backend y Security Rules. El cliente no puede otorgarse permisos administrativos ni modificar privilegios, pagos, precios, créditos o estados de reserva mediante una petición del navegador.

## 6. Reservas y calendario

### Recursos y atributos configurables

Cada instalación debe admitir nombre, deporte, edificio/sector, estado operativo, horario, capacidad, duraciones permitidas, precio/reglas, disponibilidad, anticipación máxima, cierres especiales y bloqueos de mantenimiento. El sistema no precarga valores desconocidos.

### Flujo del cliente

1. Elegir deporte o actividad, recurso y fecha.
2. Consultar horarios reales del backend.
3. Elegir hora y duración permitida.
4. Consultar precio y reglas aplicables.
5. Completar o verificar el perfil y seleccionar el medio de pago.
6. Confirmar la reserva.
7. Recibir comprobante o código de reserva y notificación configurada.

Duraciones **DECIDIDAS**: **30, 45, 60, 75, 90, 105 y 120 minutos**. Los horarios, intervalos de inicio, márgenes, anticipación, vencimientos de retenciones y reglas de redondeo son **PENDIENTES** y configurables. No se cargan valores desconocidos.

La disponibilidad debe provenir de Cloud Firestore y validarse en backend. No mostrar como disponible un horario ocupado, bloqueado o retenido. El navegador no es la autoridad final y la disponibilidad no se garantiza hasta completar la operación transaccional.

### Estados de reserva

Estados funcionales requeridos:

- **Esperando pago:** retención temporal de un horario mientras se completa un pago online; no es una reserva confirmada.
- **Confirmada:** reserva aceptada. El pago puede estar pendiente si se eligió pago presencial.
- **En curso:** actividad dentro de su periodo operativo.
- **Finalizada:** actividad terminada.
- **Cancelada:** cancelación registrada sin borrar el historial.
- **Revocada:** reserva retirada por personal o proceso autorizado, con motivo y trazabilidad.
- **`no_show` («Ausente»):** inasistencia registrada conforme al procedimiento de revisión. Se elige `no_show` por ser un identificador técnico inequívoco para una reserva incumplida; «Ausente» es la etiqueta visible en español.

El historial canónico de cambios de estado será `reservationEvents`: cada transición registra estado anterior y nuevo, fecha/hora, actor, motivo e información relevante. No se duplicará en otra colección de historial de estados. Las transiciones permitidas y su autoridad se validan en backend. Los registros generales de auditoría son independientes y no reemplazan este historial.

### Confirmación según pago

- **Presencial:** al completar correctamente el proceso, la reserva queda confirmada y el pago queda pendiente. Personal autorizado registra el cobro.
- **Online:** el horario queda retenido durante un plazo configurable. Mercado Pago confirma el pago mediante comunicación segura validada en backend. Si no se completa dentro del plazo, expira la retención y se libera disponibilidad.
- El precio definitivo debe mostrarse antes de confirmar y queda congelado al confirmar. Durante un checkout temporal, el importe cotizado se conserva mientras la retención sea válida.

### Concurrencia

La confirmación final debe protegerse mediante transacciones de Firestore y una estrategia backend contra dos reservas incompatibles del mismo recurso. Se verifican nuevamente disponibilidad, bloqueos, retenciones, duración y precio en el servidor. La estrategia de concurrencia debe ajustarse a los límites y patrones de Firestore y probarse con solicitudes simultáneas. La disponibilidad que vio el navegador puede quedar obsoleta.

### Ausencias y demoras

- Tolerancia máxima: **30 minutos desde el inicio**.
- Revisión prevista: **a los 15 minutos**.
- Posibilidad de revocar: **a los 30 minutos**, según revisión y permisos.
- Registrar avisos de demora del cliente.
- Considerar excepciones y exigir revisión por personal autorizado.

No revocar automáticamente ni liberar el horario ignorando un aviso de demora o una excepción. El procedimiento debe guardar aviso, revisiones y decisión. **PENDIENTE:** autoridad exacta y política para horas de ocupación perdidas o cobros ante ausencia.

## 7. Tarifas dinámicas

Niveles **DECIDIDOS**: **demanda baja, demanda normal, demanda alta y demanda muy alta**. El precio se calcula mediante reglas configurables.

Administración podrá configurar reglas de precios y sus vigencias cuando se definan. Se conserva el desglose y las reglas aplicadas a la cotización y al precio final. El cliente ve el precio antes de confirmar. Una reserva confirmada conserva su precio aunque las reglas cambien después.

**PENDIENTE:** importes, moneda, fórmula, ponderaciones, criterios para determinar el nivel, límites por recurso y reglas de redondeo. Ningún ejemplo numérico se considera tarifa real.

## 8. Pagos

Modalidades decididas: pago presencial y pago online con Mercado Pago.

Estados: pendiente, pagado, fallido y reembolsado si se habilitan devoluciones. Registrar proveedor, referencia externa, importe, moneda, asociación a reserva/membresía y eventos. El navegador no puede declarar un pago aprobado.

Los pagos presenciales se registran por personal autenticado con actor y fecha. Los pagos online se crean desde backend y se reconcilian mediante webhook autenticado/verificado. Los reintentos no deben duplicar pagos ni confirmar varias veces la misma reserva.

Las renovaciones automáticas de membresías usarán Mercado Pago si el plan y la configuración lo habilitan y se cumplen sus condiciones.

## 9. Cancelaciones, revocaciones y créditos

El cliente podrá cancelar desde su cuenta; personal autorizado podrá cancelar o revocar de acuerdo con permisos. Se conserva el registro y la historia de estados.

Las cancelaciones elegibles de reservas pagadas podrán generar créditos para futuras reservas; no son una devolución automática. La política de cancelación por NEXUS, cierres y excepciones especiales no está resuelta.

La billetera contempla importe disponible, origen, vencimiento, fecha, utilización total/parcial y movimientos. La fuente de verdad es un libro mayor de movimientos, no un saldo editable sin trazabilidad. Los ajustes manuales requieren permiso, motivo y actor. El vencimiento configurado al emitir un crédito no cambia retroactivamente si la política general se modifica. No se presume que los créditos paguen membresías.

## 10. Membresías, planes y renovaciones

El sistema de membresías es distinto del alquiler de recursos, aunque integrado a la misma cuenta. Planes conceptuales **DECIDIDOS**: **NEXUS MUSCULACIÓN, NEXUS FITNESS, NEXUS COMBINADO y NEXUS FULL**. La decisión de conservar sus nombres no confirma precios, beneficios, condiciones, períodos ni reglas comerciales; todos esos detalles permanecen **PENDIENTES**.

Administración podrá configurar nombre, descripción, precio, beneficios, período, actividades incluidas, límites, renovación y disponibilidad. Se contemplan renovaciones manuales o automáticas según el plan. El sistema registrará vencimientos, renovaciones, pagos y estados.

**PENDIENTE:** beneficios exactos, precio y moneda, pausa/baja, prorrateo, intentos fallidos, cambio de plan y consentimiento de cobro recurrente.

## 11. Clases grupales, límites y asistencia

Cada definición de clase podrá configurar nombre, descripción, instructor, día/hora, duración, instalación, capacidad, estado, inscripciones, lista de espera y asistencia. Las sesiones concretas tienen fecha/hora y cupo.

**PENDIENTE:** si los planes incluyen clases ilimitadas o límites semanales/mensuales, cómo se computa el uso y si se ofrecerán clases individuales pagadas sin membresía. La inscripción debe validar sesión activa, cupo y elegibilidad conforme a las reglas comerciales aprobadas.

La inscripción debe validar sesión activa, cupo, elegibilidad, límites del plan y pago individual aplicable. La asistencia la registra un entrenador o personal autorizado.

**PENDIENTE:** cancelación tardía, ausencia, restitución de uso, prioridad/tiempo de lista de espera, forma de cobro individual y límites exactos por plan.

## 12. Gimnasio, QR, entradas, salidas y ocupación

### Acceso al gimnasio

**DECIDIDO:** el socio con membresía activa y habilitada puede ingresar sin obligación de reservar en todos los casos. La reserva opcional puede controlar o garantizar capacidad. La capacidad máxima es configurable; al alcanzarse se bloquean nuevos ingresos y se ofrece lista de espera. No asumir que una autorización de gimnasio habilita todo el parque.

### QR

QR dinámico y temporal como método principal; backend verifica identidad y estado de membresía o reserva según el alcance concreto. No expone datos personales, no es credencial permanente y no se reutiliza indebidamente. Personal autorizado puede buscar al socio y registrar manualmente cuando el QR no pueda utilizarse.

**PENDIENTE:** alcance de cada token (gimnasio, instalación, reserva u otro sector), periodo de validez/rotación, regla de un solo uso, equipos de lectura y procedimiento sin conexión. No conceder automáticamente acceso a todo el complejo.

### Entrada, salida y ocupación

Registrar socio, fecha/hora, método, resultado y responsable de intervención manual. QR es el método principal; personal puede registrar ingreso/salida manual. La ocupación se actualiza a partir de eventos verificables. El estado operativo debe reconciliarse ante entradas/salidas incompletas.

Alertar sobre permanencias anormalmente largas o salidas faltantes. No liberar una plaza automáticamente por duración: requiere procedimiento de revisión. Si se alcanza capacidad, impedir nuevos ingresos y gestionar lista de espera sin asignar una plaza dos veces.

### Listas de espera

- **Gimnasio:** confirmada al alcanzar la capacidad.
- **Clases grupales:** deben contemplar lista de espera según la funcionalidad prevista.
- **Canchas:** no se aprobó una lista de espera general; no implementarla como requisito confirmado.

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

El correo electrónico es el canal inicial. Resend está en evaluación, no seleccionado definitivamente. Deben contemplarse registro/verificación, reserva, pago, fallo, cancelación, crédito, recordatorios, vencimiento de membresía, clases, cambios de actividad y lista de espera. Los avisos a administración pueden incluir reservas, pagos, cancelaciones, ausencias, créditos, demanda e incidentes.

La configuración de notificaciones contempla activar/desactivar, anticipación, tipo de actividad y condiciones. WhatsApp es una posible incorporación posterior, no un servicio inicial confirmado.

## 16. Historial y auditoría

El historial canónico de transiciones de reserva es `reservationEvents`, con estado anterior, estado nuevo, fecha, actor, motivo e información relevante. No se mantendrán historiales de estado duplicados con otros nombres o colecciones. Los registros generales de auditoría son distintos: documentan acciones sensibles en los distintos módulos y no sustituyen el historial específico de reserva. Conservar también los eventos necesarios de pagos, créditos, membresías, inscripciones, asistencias, accesos, tarifas y permisos. Cada operación sensible identifica actor, fecha y motivo. Corregir mediante nuevos movimientos o estados compensatorios, no borrando los registros originales.

## 17. Diseño, accesibilidad y experiencia

Mantener identidad, logotipo, lenguaje y diseño actual cuando sea técnicamente viable. La futura aplicación será responsive, clara y accesible; las acciones importantes presentarán estados, confirmaciones y errores comprensibles. La recepción y el entrenamiento requieren flujos de operación simples y diferenciados. No mezclar administración con la navegación pública.

## 18. Qué está implementado hoy y qué no

**Código existente observado:** página institucional estática en español; secciones conceptuales del complejo; CSS responsive; menú móvil; modal informativo de reservas; inicialización del cliente Firebase en `js/firebase/client.js`; configuración de enlaces y datos oficiales aún sin completar; imágenes conceptuales. Esta descripción no acredita pruebas funcionales ni configuración de servicios.

La inicialización del cliente Firebase no demuestra que Firebase Authentication, Cloud Firestore, Cloud Storage, Cloud Functions, Security Rules o App Check estén configurados o habilitados en producción. No se verificó configuración externa.

**PENDIENTE de implementación:** flujos funcionales de autenticación; perfiles persistidos; lecturas/escrituras operativas de Firestore; motor propio de reservas; disponibilidad; tarifas dinámicas; pagos presenciales u online; webhooks; créditos; membresías; renovaciones; clases con inscripciones; asistencia; QR; control de aforo; listas de espera; panel privado; permisos; notificaciones transaccionales; auditoría operativa y pruebas funcionales de esos módulos. No se verificó configuración productiva de Security Rules, índices o Storage.

El sistema de reservas futuro será propio, con Firebase como backend; el sitio actual sigue siendo conceptual y no ofrece reservas reales.

## 19. Criterio de aceptación funcional transversal

Una función se considera implementada solo después de comprobarla en código y pruebas, incluyendo permisos, errores, persistencia, historial y comportamiento concurrente relevante. El contenido de una página, una maqueta o una propuesta técnica no prueba que exista capacidad operativa.
