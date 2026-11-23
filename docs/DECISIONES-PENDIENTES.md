# NEXUS — Decisiones pendientes

Este registro separa cuestiones abiertas de decisiones ya confirmadas. Resolverlas no implica que deban cambiar los requisitos funcionales establecidos. Las decisiones aprobadas deben documentar responsable, fecha, impacto y versión de las reglas.

## A. Bloqueantes para reservas y operación

| Decisión pendiente | Por qué importa | Módulos afectados | Cuándo resolver |
|---|---|---|---|
| ¿Se reserva una instalación completa o plazas/personas en cada tipo de recurso? | Define capacidad, precio, participantes y prevención de solapamiento. | Reservas, calendario, pagos, aforo. | Antes de implementar el motor de reservas. |
| Catálogo final habilitado en la apertura y mapeo de cada instalación individual. | No están definidas todas las cantidades; no se deben inventar. Las cuatro mesas de tenis de mesa sí están especificadas. | Catálogo, calendario, administración. | Antes de cargar datos productivos. |
| ¿Bádminton queda solo como contenido conceptual o será una actividad/reserva? | Figura en el sitio actual, no en el catálogo de reservas del Documento Maestro. | Web pública, deportes, reservas. | Antes de publicar el catálogo definitivo. |
| ¿Se confirma la cancha multipropósito de ARENA? Si se confirma, ¿cómo se configura: recurso único, espacios configurables, equipamiento y compatibilidad horaria? | Su existencia/configuración operativa no debe inferirse de una mención conceptual o posibilidad en el sitio. | Instalaciones, deportes, disponibilidad. | Antes de configurar ese recurso. |
| Horarios operativos, zona horaria, feriados, límites diarios y márgenes entre turnos. | Esencial para calcular disponibilidad; no se proporcionaron horarios definitivos. | Calendario, reservas, clases, avisos. | Antes de pruebas operativas con datos reales. |
| Capacidades de cada instalación, clase y gimnasio. | Necesario para aforo y listas; no se debe inferir. | Reservas, clases, QR, recepción. | Antes de activar reservas/accesos reales. |
| Ventana máxima de anticipación, intervalo de inicio, tiempo de retención online y expiración. | Determina cuándo ofrecer horarios y cuándo liberar el hold. | Reservas, pagos, capacidad. | Antes de implementar reservas online. |
| Precio, moneda, reglas de redondeo y desglose visible. | Los precios ilustrativos no están aprobados. | Tarifas, pagos, créditos, membresías. | Antes de cobrar. |
| Algoritmo y pesos de tarifa dinámica. | Se confirmaron cuatro niveles y factores posibles, no el cálculo. | Cotización, reservas, administración. | Antes de habilitar tarifas dinámicas. |
| Método para medir ocupación/demanda y actualizar niveles. | Afecta tarifa dinámica y concurrencia. | Tarifas, reservas, analítica. | Antes de habilitar precios dinámicos. |
| Límites concretos por recurso y reglas de cambio de tarifas. | Necesario para cotizar y conservar el snapshot del precio. | Tarifas, reservas, panel. | Antes de la etapa de tarifas. |
| Política para cancelar, reprogramar, registrar ausencias y definir cobros asociados. | Está definido el crédito para cancelación pagada del cliente, pero no todos los plazos y excepciones. | Reservas, pagos, créditos, atención. | Antes de producción. |
| Cancelación de NEXUS, cierres y excepciones. | El tratamiento no está definido; no asumir que produce crédito o devolución. | Reservas, pagos, comunicación. | Antes de cobrar. |
| Revisión de ausencia: autoridad, evidencia y liberación del recurso. | Se confirmó revisión a los 15 minutos, tolerancia máxima de 30 minutos, avisos de demora y posible revocación a los 30. Falta el procedimiento preciso. | Reservas, recepción, notificaciones. | Antes de automatizar estados. |
| Qué ocurre cuando el cliente avisa una demora y cuánto puede extenderse la excepción. | Evita una revocación injusta; no se definió una extensión numérica. | Reservas, recepción, aforo. | Antes de automatizar ausencias. |

## B. Pagos, créditos y membresías

| Decisión pendiente | Por qué importa | Módulos afectados | Cuándo resolver |
|---|---|---|---|
| País, moneda, cuenta de Mercado Pago, medios y requisitos fiscales. | Determina integración y pruebas reales; Mercado Pago está elegido, pero los detalles comerciales no. | Pagos, renovaciones, reportes. | Antes de integración productiva. |
| Duración exacta de retención y respuesta tardía del webhook tras expirar. | Un pago tardío puede llegar después de liberar el horario. Hay que definir compensación/conciliación, sin perder el pago ni duplicar la reserva. | Pagos, reservas, soporte. | Antes de habilitar pagos online. |
| Política de reembolso y autorización. | «Reembolsado» es un estado contemplado si se habilitan devoluciones; la cancelación pagada del cliente genera crédito, no reembolso automático. | Pagos, panel, auditoría. | Antes de ofrecer devoluciones. |
| Plazo de vigencia de créditos y base de cálculo. | El vencimiento configurable está confirmado, pero no su valor. | Créditos, cancelación, reservas. | Antes de emitir créditos. |
| Si los créditos se pueden combinar entre sí o con pago online/presencial. | Solo el uso total/parcial en futuras reservas está confirmado; las reglas de combinación no. | Checkout, saldo, pagos. | Antes de implementar su uso. |
| Confirmar la limitación de créditos a reservas y si se excluyen membresías. | El requisito dice que no se debe asumir su uso para membresías. | Créditos, membresías. | Antes de permitir redenciones. |
| Precio, beneficios y disponibilidad final de cada plan. | Los nombres iniciales son propuestas configurables, no tarifas ni beneficios aprobados. | Membresías, clases, gimnasio. | Antes de vender planes. |
| Renovación automática: consentimiento, cancelación, fallos, reintentos y cambio de precio. | Se permiten modalidades automática/manual por plan; faltan reglas de ciclo de vida. | Mercado Pago, membresías, notificaciones. | Antes de activar suscripciones. |
| Pausas, bajas, cambios de plan y prorrateo. | No están definidos; afectan estado y cobro. | Membresías, pagos, acceso. | Antes de la apertura comercial. |

## C. Clases, listas de espera y acceso

| Decisión pendiente | Por qué importa | Módulos afectados | Cuándo resolver |
|---|---|---|---|
| Límites semanales/mensuales concretos y periodo de cómputo. | Está confirmada la posibilidad de planes ilimitados/semanales/mensuales, no sus valores ni zona de cómputo. | Membresías, clases, facturación. | Antes de configurar planes. |
| Cancelación tardía, ausencia y restitución de uso de clase. | Determina consumo de cupos y lista de espera. | Clases, membresías, notificaciones. | Antes de inscripciones reales. |
| Prioridad, tiempo para aceptar y expiración de ofertas de listas. | La lista del gimnasio está confirmada y las clases la contemplan; las reglas de asignación están pendientes. | Clases, gimnasio, notificaciones. | Antes de habilitar listas. |
| Confirmar si habrá una lista general de espera para canchas. | No está aprobada; no crearla por supuesto. | Reservas. | Antes de especificar la interfaz de reservas. |
| Alcance de cada QR y autorizaciones. | No se presupone acceso general al parque. Definir sector, recurso o reserva que acredita. | Identidad, acceso, recepción. | Antes de emitir tokens. |
| Rotación/validez, uso único, método de lector y tratamiento de capturas. | QR dinámico y temporal está confirmado; los parámetros técnicos no. | QR, dispositivo, seguridad. | Antes de construir el escáner. |
| Procedimiento ante caída de internet. | Validar QR requiere backend; el modo offline puede romper el control de aforo. | Recepción, acceso, operación. | Antes de la apertura. |
| Política para socios sin salida registrada o permanencia larga. | Las alertas y la revisión están confirmadas; umbrales y responsables están pendientes. | Ocupación, recepción. | Antes de la apertura del gimnasio. |
| Acceso de visitantes, invitados, menores y acompañantes. | La plataforma distingue visitantes/clientes/socios; las reglas específicas no están establecidas. | Recepción, privacidad, acceso. | Antes de la apertura. |

## D. Datos, comunicaciones y tecnología

| Decisión pendiente | Por qué importa | Módulos afectados | Cuándo resolver |
|---|---|---|---|
| Reglas técnicas de fotografía de perfil: formatos, tamaño, visibilidad, actualización y retención. | La fotografía forma parte de los datos previstos del perfil; falta definir el tratamiento técnico y de privacidad. | Perfil, Storage, privacidad. | Antes del registro productivo. |
| Términos, privacidad, jurisdicción, retención y solicitudes de datos. | Debe cumplir las obligaciones legales aplicables. | Cuentas, pagos, auditoría, comunicaciones. | Antes de recopilar datos reales. |
| Resend u otra alternativa y quién envía correos de autenticación. | Resend está en evaluación; evitar sistemas de correo duplicados. | Auth, notificaciones. | Antes de notificaciones productivas. |
| Dominio y estrategia de rutas para cuenta/panel en GitHub Pages. | El sitio público se mantiene mientras sea compatible; rutas SPA/subdirectorio necesitan prueba. | Hosting, frontend, CI. | Antes de elegir la estructura frontend. |
| Framework/build o continuidad con JavaScript estático modular. | No se impuso React/Next.js; hay que justificar la elección por complejidad, pruebas y rutas. | Frontend, mantenimiento. | Etapa de preparación. |
| Uso de otras tecnologías (colas, caché, ORM, hosting adicional). | No son requisitos confirmados; agregar solo con necesidad demostrada. | Arquitectura y operación. | Cuando la escala o las pruebas lo justifiquen. |
| Cantinas: solo catálogo de servicio o futura venta/inventario digital. | Se requiere que puedan identificarse como puntos de servicio si se integran; venta/inventario inicial no es obligatorio. | Administración, catálogo, pagos. | Al definir el alcance gastronómico. |
| Dirección, horarios, contacto, fecha de apertura y fotos definitivas. | La configuración del sitio está vacía y el contenido actual es conceptual. | Web pública, SEO, atención. | Antes del anuncio de apertura. |

## Decisiones ya confirmadas (no volver a tratarlas como pendientes)

- NEXUS es un parque deportivo, recreativo y gastronómico; tiene dos edificios conceptuales, ARENA y MULTISPORT, espacios exteriores/comunes y cantinas/bebederos según el concepto.
- Cuatro mesas de tenis de mesa, administrables individualmente.
- Catálogo funcional de reservas indicado en el Documento Maestro; no agregar cantidades.
- Duraciones de reserva de 30–120 minutos, en intervalos de 15 minutos.
- Confirmación presencial con pago pendiente; retención temporal para pago online y validación segura del proveedor.
- Precio congelado al confirmar.
- Cuatro niveles de demanda y parámetros dinámicos configurables; los valores permanecen pendientes.
- Cancelación pagada del cliente produce crédito para futuras reservas, no devolución automática.
- Estados de reserva enumerados en `DOCUMENTO-MAESTRO.md` y registro de transiciones.
- Procedimiento de ausencia con revisión a los 15 minutos, límite de 30 minutos, aviso de demora y excepciones; nunca ignorar avisos mediante liberación automática ciega.
- Membresías con renovaciones manuales y automáticas configurables por plan; clases individuales pagadas y límites de clase por plan.
- Gimnasio con acceso libre para socio habilitado sin reserva obligatoria, reserva opcional y bloqueo por capacidad; lista de espera confirmada.
- Lista de espera para clases contemplada; lista general para canchas no aprobada.
- QR dinámico temporal validado en backend, con identificación manual alternativa; alcance no definido.
- GitHub Pages para sitio público mientras compatible; Supabase y Mercado Pago seleccionados; Resend en evaluación.
- **La cancha multipropósito no está confirmada:** debe permanecer pendiente de validación y no cargarse como recurso productivo hasta obtener aprobación expresa.

## Proceso recomendado para resolver

Registrar cada resolución como una decisión fechada en una futura actualización de este archivo o en un registro de decisiones. Aclarar si afecta requisitos, datos, operación o tecnología; identificar responsable; actualizar `DOCUMENTO-MAESTRO.md`, `ARQUITECTURA-TECNICA.md` y las pruebas pertinentes sin borrar el historial de la decisión.
