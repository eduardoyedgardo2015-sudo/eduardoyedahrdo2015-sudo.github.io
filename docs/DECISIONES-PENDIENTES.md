# NEXUS — Decisiones pendientes

Este registro incluye solo cuestiones aún no resueltas. **DECIDIDO** significa aprobado por el proyecto; **PROPUESTO** requiere aprobación; **PENDIENTE** aún no tiene decisión; **IMPLEMENTADO** y **CONFIGURADO** requieren evidencia de código funcional y del servicio correspondiente, respectivamente.

## A. Operación, reservas y precios

| Pendiente | Alcance afectado |
|---|---|
| Horarios operativos, zona horaria, feriados, límites diarios e intervalos de inicio. | Calendario, reservas, clases y avisos. |
| Márgenes entre turnos, anticipación máxima, duración y vencimiento de retenciones. | Disponibilidad y pagos online. |
| Capacidades operativas por instalación, clase y gimnasio. | Reservas, inscripciones, accesos y listas de espera. |
| Configuración física y cantidades de recursos adicionales no confirmadas. | Catálogo y calendario; no inventar cantidades. |
| Si se conserva bádminton como contenido conceptual de la web. No forma parte del catálogo de recursos reservables decidido. | Comunicación pública. |
| Si se conserva la cancha multipropósito como contenido conceptual. No es un recurso reservable confirmado. | Comunicación pública y catálogo. |
| Importes, moneda, reglas de redondeo y desglose de precios. | Cotizaciones y cobros. |
| Fórmula de precio dinámico, ponderaciones y criterios para determinar demanda baja, normal, alta o muy alta. | Cotización y administración. |
| Límites de precios por recurso y vigencia de reglas. | Tarifas y reservas. |
| Política de cancelación, reprogramación, excepciones y cargos. | Reservas, pagos y créditos. |
| Autoridad, evidencia y procedimiento detallado para revisar ausencias y demoras; extensión ante un aviso. | Reservas y recepción. La revisión a los 15 minutos, tolerancia máxima de 30 y revisión antes de posible revocación están decididas. |
| Criterios de alerta y responsables ante permanencia anormal o salida faltante. | Ocupación y operación. |

La reserva por instalación o recurso completo está **DECIDIDA**. No se debe volver a tratar como pendiente la elección entre recurso completo y plazas/personas.

## B. Pagos, créditos y membresías

| Pendiente | Alcance afectado |
|---|---|
| País, moneda, cuenta comercial, medios disponibles y requisitos fiscales de Mercado Pago. | Integración productiva y conciliación. |
| Resolución operativa para un pago tardío posterior a la expiración de retención. | Reservas, conciliación y soporte; el evento no debe perderse ni duplicar una reserva. |
| Política de reembolso y autorizaciones, si se habilitan devoluciones. | Pagos. La cancelación elegible de reserva pagada genera crédito, no reembolso automático. |
| Vigencia y base de cálculo de créditos. | Emisión y vencimiento. |
| Combinación de créditos entre sí o con pagos online/presenciales. | Checkout. |
| Reglas comerciales para uso de crédito; no presumir que se aplica a membresías. | Reservas y membresías. |
| Precios, beneficios, condiciones, períodos y reglas de los planes NEXUS MUSCULACIÓN, NEXUS FITNESS, NEXUS COMBINADO y NEXUS FULL. | Venta y derechos de membresía. |
| Consentimiento, cancelación, fallos, reintentos y cambios de precio en renovaciones automáticas. | Membresías y pagos. |
| Pausas, bajas, cambios de plan y prorrateo. | Ciclo de vida comercial de membresías. |

Mercado Pago como proveedor online es **DECIDIDO**. Renovaciones manuales o automáticas según el plan están contempladas; sus reglas comerciales siguen pendientes.

## C. Clases, listas de espera y acceso

| Pendiente | Alcance afectado |
|---|---|
| Reglas comerciales de clases, límites concretos, período de cómputo y planes a los que aplican. | Membresías y clases. |
| Cancelación tardía, ausencia y restitución de uso en clases. | Inscripciones y beneficios. |
| Prioridad, tiempo para aceptar y expiración de ofertas de listas de espera. | Clases y gimnasio. |
| Si se habilitará lista general de espera para canchas. No está aprobada como requisito. | Reservas. |
| Alcance por sector/recurso/reserva del QR, vigencia, rotación, uso único y dispositivos de lectura. | Control de acceso. |
| Funcionamiento ante falta de conectividad y procedimiento manual. | Recepción y seguridad operativa. |
| Acceso de visitantes, invitados, menores y acompañantes. | Recepción, privacidad y acceso. |

El QR validado en backend, el registro de entradas/salidas, la alternativa manual, el control de ocupación y el registro de intervenciones están **DECIDIDOS**. Sus parámetros y procedimientos no.

## D. Tecnología, privacidad y publicación

| Pendiente | Alcance afectado |
|---|---|
| Estructura documental final de Firestore basada en consultas reales y ciclos de vida. | Datos y reglas. El documento Firestore existente es una propuesta y no se modifica en esta tarea. |
| Diseño y pruebas de Security Rules y permisos/alcances del personal. | Firestore y Storage. |
| Consultas e índices necesarios, justificados por consultas implementadas. | Rendimiento y costos. |
| Funciones backend y procesos programados necesarios, sus responsabilidades y condiciones de ejecución. | Operaciones sensibles, expiraciones y conciliación. |
| Configuración real de proyectos/entornos Firebase, servicios habilitados, regiones, cuotas y backups. | Desarrollo, pruebas y producción. No asumir configuración verificada. |
| Configuración de Firebase Emulator Suite para pruebas locales. | Validación de reglas, funciones e integración. |
| Política de App Check y plataformas admitidas. | Protección complementaria frente a abuso. |
| Formatos, tamaño, visibilidad, actualización y retención de fotografías de perfil. | Perfil, Storage y privacidad. |
| Términos, privacidad, jurisdicción, retención y solicitudes de datos. | Cuentas, pagos y auditoría. |
| Resend u otro proveedor y división del correo de Authentication y aplicación. | Notificaciones. Resend continúa en evaluación. |
| Estrategia de rutas/dominio del cliente y panel si siguen en GitHub Pages; justificar cualquier hosting adicional. | Frontend y despliegue. |
| Framework o continuidad con JavaScript modular. | Mantenibilidad, rutas y pruebas. |
| Colas, caché u otros servicios adicionales si necesidades medidas los justifican. | Escala y operación; no agregar por anticipado. |
| Si cantinas quedan en catálogo informativo o incorporan ventas/inventario en otra etapa. | Alcance gastronómico. |
| Dirección, horarios, contacto, fecha de apertura e imágenes definitivas. | Publicación pública; no inventar datos oficiales. |

Firebase como backend principal y Mercado Pago para pagos online están **DECIDIDOS**. Resend está **PENDIENTE** de evaluación. Ningún pendiente autoriza a presentar como **IMPLEMENTADO** o **CONFIGURADO** un servicio sin evidencia.

## Decisiones funcionales ya tomadas

- NEXUS es un complejo deportivo, recreativo, natural y gastronómico con NEXUS ARENA, NEXUS MULTISPORT, espacios exteriores/comunes, recepción, cantinas conceptuales y bebederos de agua potable.
- El catálogo de reservas incluye básquet, vóley, fútbol 5 cubierto, cuatro mesas individuales de tenis de mesa, fútbol 5 exterior, tenis exterior y pádel. No añadir cantidades.
- La unidad de reserva es el recurso completo. Cancha multipropósito y bádminton no son recursos reservables confirmados.
- Duraciones: 30, 45, 60, 75, 90, 105 y 120 minutos.
- Hay niveles de demanda baja, normal, alta y muy alta; las reglas e importes siguen pendientes.
- Pago presencial puede confirmar la reserva con pago pendiente de registración. Pago online se confirma únicamente con verificación backend del webhook de Mercado Pago.
- El precio se congela al confirmar una reserva.
- Cancelaciones elegibles de reservas pagadas pueden generar créditos para futuras reservas, no reembolso automático. Los créditos son auditables e idempotentes.
- Se contemplan cuatro planes conceptuales nombrados; renovaciones manuales o automáticas según el plan. Detalles comerciales pendientes.
- Las clases consideran definición, sesiones, instructores, capacidad, inscripciones, asistencia y listas de espera.
- Socios con membresía activa y habilitada pueden ingresar al gimnasio sin reserva obligatoria en todos los casos; la reserva opcional puede controlar capacidad. Al completar aforo se bloquean ingresos y se ofrece lista de espera.
- El acceso al gimnasio no equivale al acceso general al parque. No liberar plazas automáticamente por horario transcurrido o falta de salida.
- QR se valida en backend; hay registro de entradas/salidas, alternativa manual, intervenciones e historial.
- Ausencias: revisión a los 15 minutos, tolerancia máxima de 30 minutos, avisos de demora y posible revocación posterior con revisión y permisos; no automatizar revocaciones sin revisión.
- GitHub Pages continúa para el sitio público mientras sea compatible. El sistema de reservas será propio con Firebase; Resend sigue en evaluación.

## Cómo cerrar una decisión

Registrar responsable, fecha, impacto funcional/técnico y cambios en documentos pertinentes. No borrar el historial de decisiones. Actualizar reglas, pruebas y configuración solo con autorización correspondiente.
