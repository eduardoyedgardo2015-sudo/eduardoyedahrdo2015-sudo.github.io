# NEXUS — Decisiones pendientes

Este registro separa cuestiones abiertas de decisiones ya confirmadas. Resolverlas no implica que deban cambiar los requisitos funcionales establecidos. Las decisiones aprobadas deben documentar responsable, fecha, impacto y versión de las reglas.

## A. Bloqueantes para reservas y operación

| Decisión pendiente | Por qué importa | Módulos afectados | Cuándo resolver |
|---|---|---|---|
| ¿Se reserva una instalación completa o plazas/personas en cada tipo de recurso? | Define capacidad, precio, participantes y prevención de solapamiento. | Reservas, calendario, pagos, aforo. | Antes de implementar motor de reservas. |
| Catálogo final habilitado en apertura y mapeo de cada instalación individual | No están definidas todas las cantidades; no se deben inventar. Las cuatro mesas de tenis de mesa sí están especificadas. | Catálogo, calendario, administración. | Antes de cargar datos productivos. |
| ¿Bádminton queda solo como contenido conceptual o será actividad/reserva? | Figura en el sitio actual, no en el catálogo de reservas del Documento Maestro. | Web pública, deportes, reservas. | Antes de publicar catálogo definitivo. |
| ¿Cómo se concreta la cancha multipropósito en ARENA: recurso único, espacios configurables, equipamiento y compatibilidad horaria? | El uso multipropósito está descrito, pero no están confirmados capacidad, configuración exacta ni operación final. | Instalaciones, deportes, disponibilidad. | Antes de configurar ese recurso. |
| Horarios operativos, zona horaria, feriados, límites diarios y márgenes entre turnos | Esencial para calcular disponibilidad; no se proporcionaron horarios. | Calendario, reservas, clases, avisos. | Antes de pruebas operativas con datos reales. |
| Capacidades de cada instalación, clase y gimnasio | Necesario para aforo y listas; no se debe inferir. | Reservas, clases, QR, recepción. | Antes de activar reserva/acceso real. |
| Ventana máxima de anticipación, intervalo de inicio, tiempo de retención online y expiración | Determina cuándo ofrecer horarios y cuándo liberar el hold. | Reservas, pagos, capacidad. | Antes de implementar reserva online. |
| Precio, moneda, reglas de redondeo y desglose visible | Los precios ilustrativos no son aprobados. | Tarifas, pagos, créditos, membresías. | Antes de cobrar. |
| Algoritmo y pesos de tarifa dinámica | Se confirmaron cuatro niveles y factores posibles, no el cálculo. | Cotización, reservas, administración. | Antes de presentar precios reales. |
| Método de medir ocupación/demanda y actualización de niveles | Afecta tarifa dinámica y posible concurrencia. | Tarifas, reservas, analítica. | Antes de habilitar precios dinámicos. |
| Límites concretos por recurso y reglas de cambio de tarifas | Necesario para cotizar y conservar snapshot. | Tarifas, reservas, panel. | Antes de la etapa de tarifas. |
| Política para cancelar, reprogramar, ausencia y cobros no reembolsables | Está definido el crédito para cancelación de cliente con reserva pagada, pero no todos los plazos/excepciones. | Reservas, pagos, créditos, atención. | Antes de producción. |
| Cancelación de NEXUS, cierres y excepciones | El tratamiento no está definido; no asumir que produce crédito o devolución. | Reservas, pagos, comunicación. | Antes de cobrar. |
| Revisión de ausencia: autoridad, evidencia y liberación del recurso | Se confirmó revisión a 15 min, tolerancia máxima de 30 min, avisos de demora y posible revocación a 30. Falta el procedimiento preciso. | Reservas, recepción, notificaciones. | Antes de automatizar estados. |
| Qué ocurre cuando el cliente avisa demora y cuánto puede extenderse la excepción | Evita revocación injusta; no se dio extensión numérica. | Reservas, recepción, aforo. | Antes de automatizar ausencias. |

## B. Pagos, créditos y membresías

| Decisión pendiente | Por qué importa | Módulos afectados | Cuándo resolver |
|---|---|---|---|
| País, moneda, cuenta Mercado Pago, medios y requisitos fiscales | Determina integración y pruebas reales; Mercado Pago está elegido, detalles comerciales no. | Pagos, renovaciones, reportes. | Antes de integración productiva. |
| Duración exacta de retención y respuesta tardía de webhook tras expirar | Un pago tardío puede llegar después de liberar el horario. Hay que definir compensación/conciliación, no perder pago ni duplicar reserva. | Pagos, reservas, soporte. | Antes de habilitar pagos online. |
| Política de reembolso y autorización | “Reembolsado” es estado contemplado si se habilitan devoluciones; cancelación pagada del cliente genera crédito, no reembolso automático. | Pagos, panel, auditoría. | Antes de ofrecer devoluciones. |
| Plazo de vigencia de créditos y base de cálculo | Vencimiento configurable está confirmado, valor no. | Crédito, cancelación, reservas. | Antes de emitir créditos. |
| Si los créditos se pueden combinar entre sí o con pago online/presencial | Solo uso total/parcial en futuras reservas está confirmado; reglas de combinación no. | Checkout, saldo, pagos. | Antes de implementar uso. |
| Confirmar que créditos no se aplican a membresías | El requisito explícito dice no asumir uso para membresías; decidir si se mantiene la limitación. | Créditos, membresías. | Antes de permitir redención. |
| Precio, beneficios y disponibilidad final de cada plan | Nombres iniciales son propuestas configurables, no tarifa/beneficio aprobado. | Membresías, clases, gimnasio. | Antes de vender planes. |
| Renovación automática: consentimiento, cancelación, fallos, reintentos y cambio de precio | Se permiten modalidades automática/manual por plan; faltan reglas de ciclo de vida. | Mercado Pago, membresías, notificaciones. | Antes de activar suscripciones. |
| Pausas, bajas, cambios de plan y prorrateo | No definidos; afectan estado y cobro. | Membresías, pagos, acceso. | Antes de apertura comercial. |

## C. Clases, listas de espera y acceso

| Decisión pendiente | Por qué importa | Módulos afectados | Cuándo resolver |
|---|---|---|---|
| Límites semanales/mensuales concretos y período de cómputo | Está confirmada la posibilidad de ilimitadas/semanales/mensuales, no los valores ni zona de cómputo. | Membresías, clases, facturación. | Antes de configurar planes. |
| Cancelación tardía, ausencia y restitución de uso de clase | Determina consumo de cupos y lista de espera. | Clases, membresías, notificaciones. | Antes de inscripciones reales. |
| Prioridad, tiempo para aceptar y expiración de oferta de listas | Lista de espera del gimnasio confirmada y clases contempladas; reglas de asignación pendientes. | Clases, gimnasio, notificaciones. | Antes de habilitar listas. |
| Confirmar que no habrá lista general de espera para canchas inicialmente | No está aprobada; no crearla por supuesto. | Reservas. | Antes de especificar interfaz de reservas. |
| Alcance de cada QR y autorizaciones | No presupone acceso general al parque. Definir sector, recurso o reserva que acredita. | Identidad, acceso, recepción. | Antes de emitir tokens. |
| Rotación/validez, uso único, método de lector y tratamiento de capturas | QR dinámico y temporal están confirmados; parámetros técnicos no. | QR, dispositivo, seguridad. | Antes de construir escáner. |
| Procedimiento ante caída de Internet | Validar QR requiere backend; modo offline puede romper control de aforo. | Recepción, acceso, operación. | Antes de apertura. |
| Política para socios sin salida registrada o permanencia larga | Alertas y revisión confirmadas; umbrales y responsables pendientes. | Ocupación, recepción. | Antes de apertura del gimnasio. |
| Acceso de visitantes, invitados, menores y acompañantes | La plataforma distingue visitantes/clientes/socios; reglas específicas no establecidas. | Recepción, privacidad, acceso. | Antes de apertura. |

## D. Datos, comunicaciones y tecnología

| Decisión pendiente | Por qué importa | Módulos afectados | Cuándo resolver |
|---|---|---|---|
| Obligatoriedad y reglas de fotografía de perfil | La fotografía forma parte de los datos contemplados, pero obligatoriedad, carga, visibilidad y retención no se definieron. | Perfil, Storage, privacidad. | Antes del registro productivo. |
| Términos, privacidad, jurisdicción, retención y solicitudes de datos | Debe cumplir obligaciones legales aplicables. | Cuentas, pagos, auditoría, comunicaciones. | Antes de recopilar datos reales. |
| Resend o alternativa y quién envía correos de autenticación | Resend está en evaluación; evitar sistemas de correo duplicados. | Auth, notificaciones. | Antes de notificaciones productivas. |
| Dominio y estrategia de rutas para cuenta/panel en GitHub Pages | El sitio público se mantiene mientras compatible; rutas SPA/subdirectorio necesitan prueba. | Hosting, frontend, CI. | Antes de elegir estructura frontend. |
| Framework/build o continuidad con JavaScript estático modular | No se impuso React/Next.js; hay que justificar la elección por complejidad, pruebas y rutas. | Frontend, mantenimiento. | Etapa de preparación. |
| Uso de otras tecnologías (colas, caché, ORM, hosting adicional) | No son requisitos confirmados; agregar solo con necesidad demostrada. | Arquitectura y operación. | Cuando escala o pruebas lo justifiquen. |
| Cantinas: solo catálogo de servicio o futura venta/inventario digital | Se requiere que sean administrables si se integran, no venta/inventario inicial obligatorios. | Administración, catálogo, pagos. | Al definir alcance gastronómico. |
| Dirección, horarios, contacto, fecha de apertura y fotos definitivas | La configuración del sitio está vacía y el contenido actual es conceptual. | Web pública, SEO, atención. | Antes del anuncio de apertura. |

## Decisiones ya confirmadas (no volver a tratar como pendientes)

- NEXUS es parque deportivo, recreativo y gastronómico; dos edificios ARENA y MULTISPORT, espacios exteriores/comunes y cantinas/bebederos según el concepto.
- Cuatro mesas de tenis de mesa, administrables individualmente.
- Catálogo funcional de reservas indicado en el Documento Maestro; no agregar cantidades.
- Duraciones de reserva 30–120 min cada 15 min.
- Confirmación presencial con pago pendiente; retención temporal para pago online y validación segura del proveedor.
- Precio congelado al confirmar.
- Cuatro niveles de demanda y parámetros dinámicos configurables; los valores permanecen pendientes.
- Cancelación pagada del cliente produce crédito para futuras reservas, no devolución automática.
- Estados de reserva enumerados en `DOCUMENTO-MAESTRO.md` y registro de transiciones.
- Procedimiento de ausencia con revisión a los 15 min, límite de 30 min, aviso de demora y excepciones; nunca ignorar avisos mediante liberación automática ciega.
- Membresías con renovaciones manuales y automáticas configurables por plan; clases individuales pagadas y límites de clase por plan.
- Gimnasio con acceso libre para socio habilitado sin reserva obligatoria, reserva opcional y bloqueo por capacidad; lista de espera confirmada.
- Lista de espera para clases contemplada; lista general para canchas no aprobada.
- QR dinámico temporal validado en backend, con identificación manual alternativa; alcance no definido.
- GitHub Pages para sitio público mientras compatible; Supabase y Mercado Pago seleccionados; Resend en evaluación.

## Proceso recomendado para resolver

Registrar cada resolución como una decisión fechada en una futura actualización de este archivo o en un registro de decisiones. Aclarar si afecta requisitos, datos, operación o tecnología; identificar responsable; actualizar `DOCUMENTO-MAESTRO.md`, `ARQUITECTURA-TECNICA.md` y las pruebas pertinentes sin borrar el historial de la decisión.
