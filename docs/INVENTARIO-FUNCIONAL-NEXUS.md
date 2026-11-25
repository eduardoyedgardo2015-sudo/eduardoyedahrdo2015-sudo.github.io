# NEXUS — Inventario funcional general

**Fecha de consolidación:** 25 de noviembre de 2026.

**Propósito:** reunir en un solo documento la estructura física, las instalaciones, los servicios, las modalidades de acceso, los sistemas administrativos y el estado técnico conocido de NEXUS.

**Autoridad funcional:** `docs/DOCUMENTO-MAESTRO.md`.

Este inventario no reemplaza el documento maestro, no convierte propuestas en decisiones y no demuestra que un servicio esté implementado o configurado en producción.

## 1. Identidad y visión de NEXUS

**DECIDIDO.**

NEXUS es un complejo deportivo, recreativo, natural y gastronómico.

Su propuesta combina:
- Deporte.
- Naturaleza.
- Recreación.
- Gastronomía.
- Actividad física.
- Entretenimiento.
- Espacios verdes.
- Encuentro social.

Frases de identidad contempladas:
- ¡Mucho más que deporte!
- Deporte, naturaleza y encuentro.

NEXUS no debe presentarse solamente como un gimnasio o un conjunto de canchas.

El complejo está pensado para personas de distintas edades y niveles de experiencia.

## 2. Organización física del complejo

### 2.1. NEXUS ARENA

**DECIDIDO como parte del concepto.**

Edificio deportivo independiente.

Instalaciones y actividades:
- Básquet: recurso reservable.
- Vóley: recurso reservable.
- Musculación.
- Entrenamiento físico.
- Clases grupales.

Musculación, entrenamiento y clases no son recursos reservables adicionales confirmados.

### 2.2. NEXUS MULTISPORT

**DECIDIDO como parte del concepto.**

Segundo edificio deportivo independiente.

Sectores:
- Fútbol cinco cubierto: recurso reservable.
- Preparación física.
- Áreas recreativas.
- Cuatro mesas individuales de tenis de mesa.

Las cuatro mesas de tenis de mesa son recursos independientes y reservables individualmente.

### 2.3. Instalaciones deportivas exteriores

**DECIDIDO como catálogo funcional.**

- Fútbol cinco exterior.
- Tenis exterior.
- Pádel.

Cada recurso tiene su propia disponibilidad, calendario, configuración y tarifa.

No se inventan cantidades adicionales.

### 2.4. Actividades y recursos no confirmados

**Bádminton:** pendiente decidir si se conserva como contenido conceptual del sitio. No pertenece al catálogo de recursos reservables aprobado.

**Cancha multipropósito:** no está aprobada como instalación reservable.

No incorporarlas al sistema de reservas sin aprobación expresa.

## 3. Áreas comunes y recreativas

El complejo contempla:

- Plaza central.
- Fuente.
- Juegos recreativos.
- Senderos.
- Espacios verdes.
- Sectores de descanso.
- Estacionamiento.
- Recepción y bienvenida.
- Varias cantinas distribuidas estratégicamente.
- Bebederos de agua potable.

Los puntos de hidratación serán bebederos de agua potable, no dispensadores.

Los espacios comunes son de acceso general, sujeto a las condiciones operativas del parque.

El acceso al parque no implica automáticamente autorización para utilizar instalaciones reservables o sectores restringidos.

### Cantinas

Se contemplan varios puntos gastronómicos distribuidos estratégicamente.

La incorporación de ventas online, inventario digital e integración gastronómica en la primera etapa permanece pendiente.

## 4. Catálogo de recursos reservables

**DECIDIDO.**

El catálogo aprobado contiene diez recursos:

| Identificador | Instalación | Sector |
|---|---|---|
| basketball | Básquet | NEXUS ARENA |
| volleyball | Vóley | NEXUS ARENA |
| indoor-soccer-5 | Fútbol 5 cubierto | NEXUS MULTISPORT |
| outdoor-soccer-5 | Fútbol 5 exterior | Exterior |
| outdoor-tennis | Tenis exterior | Exterior |
| padel | Pádel | Exterior |
| table-tennis-1 | Tenis de mesa 1 | NEXUS MULTISPORT |
| table-tennis-2 | Tenis de mesa 2 | NEXUS MULTISPORT |
| table-tennis-3 | Tenis de mesa 3 | NEXUS MULTISPORT |
| table-tennis-4 | Tenis de mesa 4 | NEXUS MULTISPORT |

La unidad de reserva es la instalación o recurso completo, no una plaza individual.

No añadir cantidades ni recursos adicionales sin aprobación.

## 5. Horarios generales y reservas

### 5.1. Horarios compartidos

**DECIDIDO en la configuración inicial de NEXUS.**

Todas las instalaciones deportivas reservables compartirán el mismo horario general de funcionamiento.

| Día | Primer período | Segundo período |
|---|---|---|
| Lunes | 08:00 a 12:00 | 16:00 a 23:00 |
| Martes | 08:00 a 12:00 | 16:00 a 23:00 |
| Miércoles | 08:00 a 12:00 | 16:00 a 23:00 |
| Jueves | 08:00 a 12:00 | 16:00 a 23:00 |
| Viernes | 08:00 a 12:00 | 16:00 a 23:00 |
| Sábado | 12:00 a 18:00 | — |
| Domingo | 12:00 a 18:00 | — |

Zona horaria:
`America/Argentina/Cordoba`.

### 5.2. Intervalos y duraciones

**DECIDIDO para la configuración inicial.**

Intervalo entre posibles inicios de reserva: 15 minutos.

Duraciones permitidas:

- 30 minutos.
- 45 minutos.
- 60 minutos.
- 75 minutos.
- 90 minutos.
- 105 minutos.
- 120 minutos.

El intervalo de inicio no debe confundirse con la duración de la reserva.

### 5.3. Unidad y condiciones de reserva

- Se reserva la instalación completa.
- La disponibilidad se determina desde el backend.
- Los recursos cerrados o en mantenimiento no ofrecen turnos.
- Los bloqueos impiden reservas durante sus períodos activos.
- Los precios deben ser validados por el servidor.
- El precio queda congelado al confirmar la reserva.
- Los cierres especiales y excepciones deben poder administrarse.

Las políticas completas de cancelación, retención, anticipación y vencimientos permanecen pendientes.

## 6. Política económica y tarifas

### 6.1. Moneda

**DECIDIDO para la configuración inicial: ARS.**

Todas las tarifas iniciales se expresarán en pesos argentinos.

### 6.2. Gestión de precios

**DECIDIDO.**

Los precios serán administrados manualmente.

El personal autorizado podrá modificar las tarifas mediante el panel administrativo.

No se calcularán automáticamente a partir de la ocupación ni de la cantidad de reservas.

### 6.3. Niveles de demanda

Se contemplan cuatro niveles:

- Baja.
- Normal.
- Alta.
- Muy alta.

La administración asignará manualmente el nivel correspondiente a cada período.

No se utilizará una fórmula automática de ocupación para determinar la demanda.

### 6.4. Propuestas económicas pendientes de aprobación

Los siguientes importes son estimaciones conversadas, no una lista de precios definitivamente aprobada.

Precios normales propuestos por 60 minutos:

| Instalación | Precio estimado |
|---|---:|
| Básquet | $20.000 |
| Vóley | $18.000 |
| Fútbol 5 cubierto | $30.000 |
| Fútbol 5 exterior | $25.000 |
| Tenis exterior | $16.000 |
| Pádel | $20.000 |
| Cada mesa de tenis de mesa | $7.000 |

Las cifras deben revisarse antes de cargarse.

### 6.5. Duraciones y multiplicadores

Se acordó como criterio que una reserva de 120 minutos tenga un multiplicador de 1,5 respecto de 60 minutos.

La escala completa propuesta queda pendiente de aprobación:

| Duración | Multiplicador propuesto |
|---|---:|
| 30 min | 0,50 |
| 45 min | 0,75 |
| 60 min | 1,00 |
| 75 min | 1,125 |
| 90 min | 1,25 |
| 105 min | 1,375 |
| 120 min | 1,50 |

También están pendientes de aprobación los porcentajes definitivos de cada nivel de demanda.

Las tarifas definitivas deberán ser configurables individualmente, sin obligar a utilizar una fórmula automática.

### 6.6. Matriz tarifaria

El sistema actual contempla:

- 4 niveles de demanda.
- 7 duraciones.
- 28 combinaciones por recurso.
- 10 recursos.
- 280 valores tarifarios en total.

No cargar importes inventados ni habilitar reservas sin una configuración válida.

## 7. Membresías NEXUS

**DECIDIDO como planes conceptuales.**

El sistema de membresías es independiente del alquiler de instalaciones, aunque ambos se integran a la misma cuenta del cliente.

Planes definidos:

1. NEXUS MUSCULACIÓN.
2. NEXUS FITNESS.
3. NEXUS COMBINADO.
4. NEXUS FULL.

### Administración de membresías

Se contempla configurar:

- Nombre.
- Descripción.
- Precio.
- Beneficios.
- Período de vigencia.
- Actividades incluidas.
- Límites.
- Renovación.
- Disponibilidad comercial.
- Estado de la membresía.

Se contemplan renovaciones manuales o automáticas según cada plan.

### Pendientes comerciales

Todavía deben definirse:

- Precio de cada plan.
- Beneficios exactos.
- Períodos.
- Condiciones de acceso.
- Actividades incluidas.
- Clases incluidas.
- Límites de utilización.
- Pausas.
- Bajas.
- Cambios de plan.
- Prorrateos.
- Renovaciones automáticas y sus consentimientos.

No asumir que un crédito de reserva puede utilizarse para pagar una membresía.

## 8. Gimnasio y control de capacidad

**DECIDIDO como comportamiento funcional.**

Un socio con membresía activa y habilitada puede ingresar al gimnasio sin obligación de reservar en todos los casos.

La reserva opcional puede utilizarse para controlar o garantizar capacidad.

La capacidad máxima debe poder configurarse.

Cuando se alcanza el aforo:

- Se bloquean nuevos ingresos.
- Se ofrece una lista de espera.
- No se asigna una misma plaza a dos personas.
- La ocupación se actualiza con eventos de entrada y salida verificables.

No liberar plazas automáticamente por el paso del tiempo o por una salida faltante.

El acceso al gimnasio no concede acceso ilimitado al resto del parque.

## 9. Clases grupales y preparación física

Se contemplan clases, sesiones e instructores.

Cada definición de clase podrá administrar:

- Nombre.
- Descripción.
- Instructor.
- Día y horario.
- Duración.
- Instalación.
- Capacidad.
- Estado.
- Inscripciones.
- Lista de espera.
- Asistencia.

Las sesiones concretas tendrán fecha, horario y cupo.

Continúan pendientes:
- Límites por membresía.
- Cantidad de clases incluidas.
- Períodos de cómputo.
- Inscripciones individuales pagadas.
- Cancelaciones tardías.
- Ausencias.
- Reposición de beneficios.
- Prioridad de listas de espera.

## 10. Clientes, socios y cuentas

Se distinguen:

- Visitantes.
- Clientes.
- Socios.
- Personal autorizado.

Ser socio es una condición comercial vinculada a una membresía activa. No es un rol de seguridad independiente.

La cuenta del cliente contempla:

- Nombre y apellido.
- Correo verificado.
- Teléfono.
- Fotografía de perfil.
- Recuperación de contraseña.
- Historial de reservas.
- Pagos.
- Membresías.
- Vencimientos.
- Créditos.
- Clases.
- Historial de actividades.
- Accesos.
- QR personal dinámico cuando corresponda.

Cada cliente solo podrá consultar su propia información.

## 11. Recepción y atención presencial

La recepción deberá permitir:

- Dar la bienvenida.
- Orientar visitantes.
- Consultar reservas.
- Identificar clientes y socios.
- Verificar pagos.
- Registrar pagos presenciales.
- Informar actividades.
- Gestionar incidencias de acceso según permisos.
- Distinguir acceso general y uso de instalaciones.

Las funciones de recepción serán diferentes de las funciones de administración.

## 12. Pagos y créditos

### Pagos

**DECIDIDO:** Mercado Pago como proveedor de pagos online.

El backend verificará los eventos de pago antes de confirmar operaciones.

Se contemplan:
- Pagos online.
- Pagos presenciales.
- Estados pendiente, pagado, fallido y reembolsado cuando se habiliten devoluciones.
- Referencias externas.
- Asociación del pago a reservas o membresías.
- Registro de eventos.

Un pago no puede declararse aprobado únicamente desde el navegador.

### Créditos

Se contempla una billetera con:
- Importe disponible.
- Origen.
- Fecha.
- Vencimiento.
- Utilización total o parcial.
- Movimientos auditables.

Una cancelación elegible de una reserva pagada puede generar crédito para futuras reservas. No equivale a un reembolso automático.

El vencimiento de un crédito no debe cambiar retroactivamente.

## 13. QR, entradas y salidas

**DECIDIDO como concepto funcional.**

QR dinámico y temporal como método principal.

El backend verificará identidad, membresía, reserva y alcance correspondiente.

Se contempla:
- Registro de entrada.
- Registro de salida.
- Método de ingreso.
- Resultado de validación.
- Personal responsable de intervenciones manuales.
- Ocupación.
- Alertas por permanencia anormal.
- Reconciliación de salidas faltantes.

El personal autorizado podrá realizar verificaciones manuales cuando sea necesario.

No conceder acceso automático a todos los sectores por tener un QR válido.

## 14. Administración, personal y permisos

Se contemplan interfaces diferenciadas para:

- Cliente.
- Recepción.
- Instructor.
- Administración.

Los permisos del personal deberán tener alcances explícitos.

Las operaciones sensibles necesitan:
- Identificación del actor.
- Fecha.
- Motivo cuando corresponda.
- Registro de auditoría.
- Validación backend.

El cliente nunca podrá otorgarse permisos administrativos desde el navegador.

## 15. Comunicaciones y notificaciones

El correo electrónico es el canal inicial contemplado.

Se prevén notificaciones para:
- Registro y verificación.
- Reservas.
- Pagos.
- Cancelaciones.
- Créditos.
- Membresías.
- Vencimientos.
- Clases.
- Cambios de actividad.
- Listas de espera.
- Incidentes.

Resend continúa en evaluación; no está seleccionado definitivamente.

## 16. Estado técnico observado

**Fecha de referencia: 25 de noviembre de 2026.**

### Entorno local

Se verificó:

- Proyecto Firebase: `nexus-c0671`.
- Firebase CLI: 15.37.0.
- Firebase Emulator Suite inicializado.
- Authentication Emulator: puerto 9099.
- Functions Emulator: puerto 5001.
- Firestore Emulator: puerto 8080.
- Emulator UI: puerto 4000.
- Puente local de desarrollo: puerto 8001.
- Servidor estático de desarrollo: puerto 8000.

Las pruebas locales confirmaron que los tres emuladores pueden iniciarse y que las once funciones Callable son reconocidas.

`listBookingResources` respondió correctamente mediante HTTP 200 y devolvió los diez recursos del catálogo.

El panel administrativo pudo iniciar sesión contra el entorno local utilizando una cuenta de pruebas con permiso `admin: true`.

### Código de reservas

Se ejecutaron diez pruebas automatizadas de lógica de reservas, todas aprobadas en esa ejecución.

También se verificó la sintaxis de los archivos principales de JavaScript del backend y del cliente.

No equivale a una prueba integral de todos los flujos de producción.

### Configuración masiva

Existe una plantilla local:

`configuracion-recursos.json`

Contiene los diez recursos, sus horarios compartidos, zona horaria, intervalo de inicio y moneda ARS.

Los recursos permanecen con:
- `enabled: false`.
- `apply: false`.
- Tarifas vacías.
- Asignaciones de demanda pendientes.
- Bloqueos pendientes.

Existe el cargador:

`scripts/cargar-configuracion.mjs`

Su modo `--check` valida sin modificar datos.

La carga todavía no se ha aplicado.

### Producción

No se verificaron Cloud Functions desplegadas.

El proyecto no tiene facturación habilitada y no se dispone actualmente de una cuenta de facturación asociada.

No declarar operativa la versión productiva del sistema de reservas basándose únicamente en las pruebas locales.

### Advertencias técnicas pendientes

- El host de Codespaces utiliza Node.js 24 mientras las funciones declaran Node.js 22.
- `npm audit --omit=dev` informó ocho vulnerabilidades moderadas en dependencias transitivas.
- Debe revisarse la configuración de Security Rules, índices, permisos, despliegues y servicios productivos antes de una apertura real.

## 17. Decisiones y tareas pendientes

### Prioridad alta: operación deportiva

- Aprobar los importes definitivos de las diez instalaciones.
- Aprobar los multiplicadores de duración.
- Aprobar los porcentajes de demanda.
- Definir capacidades físicas de cada instalación.
- Definir feriados, cierres y excepciones.
- Definir anticipación máxima y retenciones.
- Definir políticas de cancelación, ausencia y demora.
- Revisar los márgenes entre reservas.

### Prioridad alta: membresías

- Definir los beneficios de los cuatro planes.
- Establecer sus importes y vigencias.
- Definir actividades y clases incluidas.
- Definir límites por plan.
- Definir bajas, pausas y renovaciones.
- Definir el acceso al gimnasio según la membresía.

### Prioridad alta: acceso y operación presencial

- Definir el alcance y vigencia de los QR.
- Establecer equipos de lectura.
- Definir capacidad del gimnasio.
- Definir el procedimiento ante falta de conectividad.
- Definir acceso de visitantes, invitados, menores y acompañantes.
- Establecer procedimientos para recepción y seguridad.

### Prioridad media: servicios adicionales

- Resolver si bádminton queda solamente como contenido conceptual.
- Resolver el futuro de la cancha multipropósito.
- Definir el alcance digital de las cantinas.
- Definir servicios gastronómicos adicionales.
- Evaluar notificaciones mediante Resend.
- Definir información pública, contacto e imágenes definitivas.

## 18. Principios que deben conservarse

1. NEXUS es un complejo integral, no solamente un conjunto de canchas.
2. El parque puede recibir visitantes que no alquilan instalaciones.
3. La unidad de reserva es el recurso completo.
4. Las cuatro mesas de tenis de mesa son recursos independientes.
5. La demanda se asigna manualmente.
6. Los precios son administrados por personal autorizado.
7. Los derechos de membresía son distintos de las reservas.
8. El acceso al gimnasio no concede acceso universal al parque.
9. Toda operación sensible debe validarse en backend.
10. Las decisiones pendientes no pueden convertirse en valores inventados.
11. El contenido conceptual no demuestra disponibilidad operativa.
12. Las pruebas locales no equivalen a producción.

---

**Fin del inventario funcional de NEXUS.**
