# NEXUS — Arquitectura técnica

**Estado:** arquitectura propuesta, subordinada a los requisitos funcionales **DECIDIDOS** en `DOCUMENTO-MAESTRO.md`. Una propuesta técnica no demuestra implementación ni configuración de un servicio.

## 1. Principios

1. **DECIDIDO:** Firebase es el backend principal: Firebase Authentication, Cloud Firestore, Security Rules, Cloud Functions y Cloud Storage.
2. El navegador no es autoridad definitiva sobre disponibilidad, precios, pagos, créditos, permisos ni accesos.
3. Las operaciones sensibles se validan en backend con autorización, reglas de negocio, transacciones, idempotencia y auditoría.
4. GitHub Pages continúa como hosting del sitio público mientras sea compatible con las rutas y necesidades del producto.
5. App Check es una protección complementaria; no reemplaza Authentication, Security Rules ni validaciones backend.
6. La documentación de un componente no significa que exista en el código o esté configurado en un servicio.
7. No cargar datos productivos sin aprobación de recursos, cantidades, precios, horarios, capacidades y políticas.

## 2. Componentes y comunicación

```text
Navegador (sitio público y futuras experiencias de cliente/personal)
  ├── Firebase Authentication: identidad y sesión
  ├── Cloud Firestore: consultas permitidas bajo Security Rules
  ├── Cloud Storage: archivos con políticas de acceso
  └── Cloud Functions: operaciones sensibles e integraciones
       ├── reservas, disponibilidad y cotizaciones
       ├── pagos y webhook de Mercado Pago
       ├── créditos, membresías y clases
       ├── QR, ocupación y eventos de acceso
       └── notificaciones y conciliación

Procesos programados: vencimientos, alertas o conciliaciones cuando se apruebe
su necesidad y política.
Mercado Pago: proveedor de pago online; eventos verificados por backend.
Resend: correo transaccional, continúa en evaluación.
Firebase Emulator Suite: pruebas locales de reglas, funciones e integración.
GitHub Pages: publicación del frontend estático, sin lógica privada ni secretos.
App Check: protección complementaria de solicitudes a Firebase.
```

Los procesos programados solo se incorporarán cuando haya un caso operativo definido. No se declaran actualmente creados ni configurados.

## 3. Estado real y vocabulario

- **DECIDIDO:** Firebase es la plataforma tecnológica; Mercado Pago es el proveedor de pagos online; Resend sigue en evaluación.
- **Código existente observado:** inicialización del cliente Firebase en `js/firebase/client.js`. Esto no acredita una función operativa ni configuración del servicio.
- **PENDIENTE:** flujos funcionales, datos operativos, reglas, funciones, índices, almacenamiento, despliegues y configuración de cada servicio.
- **CONFIGURADO:** se usará esta categoría únicamente cuando exista evidencia verificable en el servicio correspondiente. No se verificó aquí configuración de producción.

`DOCUMENTO-MAESTRO-FIRESTORE.md` es una propuesta documental de arquitectura, no evidencia de colecciones, reglas, índices o funciones creados. Se conserva sin modificar.

## 4. Identidad, autorización y protección

Las experiencias distinguen visitante, cliente, socio y personal. Ser socio es una condición comercial vinculada a una membresía activa; no es por sí sola un rol de seguridad. Las autorizaciones del personal tendrán permisos y alcances explícitos.

- Firebase Authentication identifica al usuario; la autenticación no concede permisos administrativos.
- Security Rules protegen lecturas y escrituras directas a Firestore y Storage con acceso mínimo y denegación por defecto.
- Cloud Functions valida identidad, permisos, ámbito, estado y reglas para operaciones sensibles; los secretos y credenciales privadas permanecen solo en backend.
- Un cliente no puede otorgarse privilegios, alterar los propios permisos, confirmar pagos ni modificar precios, estados o créditos.
- Las funciones que usan Admin SDK deben realizar su propia autorización: no dependen de reglas de cliente como control suficiente.
- App Check reduce abuso de clientes no autorizados, pero no es un sistema de identidad ni una autorización.
- No guardar secretos privados ni datos de tarjetas en el frontend. Aplicar políticas de privacidad y acceso específicas a archivos.

## 5. Modelo documental Firestore

El diseño es documental y orientado a las consultas aprobadas; no reproduce un esquema relacional tabla por tabla. Los nombres y campos de esta sección son **PROPUESTOS**, no definitivos ni creados.

- **Perfiles y personal:** documentos de perfil separados de las credenciales de Authentication; condición de socio derivada de membresía; asignaciones de personal con permisos y alcance.
- **Catálogo:** edificios, instalaciones, deportes y recursos reservables. Las cuatro mesas de tenis de mesa son cuatro recursos independientes.
- **Calendario:** horarios configurables, cierres y bloqueos; disponibilidad obtenida al combinar estos datos con reservas y retenciones válidas.
- **Reservas:** un documento autoritativo por reserva contiene su estado actual, usuario, recurso, franja y snapshot de precio/política al confirmar. No mantener dos fuentes autoritativas para el mismo estado o saldo.
- **Historial de reserva:** `reservationEvents` es el historial canónico de transiciones. Cada transición registra estado anterior/nuevo, fecha, actor, motivo e información relevante. No duplicar las transiciones en otra colección de historial. Los registros generales de auditoría son distintos.
- **Pagos:** documentos separados de reservas, con referencias del proveedor y eventos externos deduplicables. La respuesta del navegador no confirma un pago.
- **Créditos:** movimientos auditables e idempotentes como fuente de verdad; el saldo no se edita sin un movimiento trazable.
- **Membresías, clases y acceso:** documentos por entidad y eventos necesarios para estados, sesiones, inscripciones, asistencia, ocupación y entradas/salidas.

Firestore no ofrece integridad referencial relacional. Usar identificadores estables, validar referencias en backend y elegir subcolecciones o documentos separados según el ciclo de vida, tamaño y consultas. Evitar arrays de crecimiento ilimitado y documentos que se vuelvan puntos de contención. Denormalizar solo para consultas justificadas y establecer cómo se mantiene consistente la copia.

## 6. Estados y consistencia

Estados técnicos de reserva: `awaiting_payment`, `confirmed`, `in_progress`, `completed`, `cancelled`, `revoked` y `no_show`. La etiqueta visible de `no_show` es **«Ausente»**. Se elige `no_show` por ser un identificador inequívoco para una reserva incumplida y coherente con la terminología técnica usual.

El estado actual vive en el documento de reserva; cada transición exitosa agrega un único `reservationEvents`. El historial específico no se duplica en `reservationStatusHistory` ni en `reservation_status_history`. `auditLogs` registra acciones generales y no sustituye el historial de reserva.

Las operaciones que actualizan varios documentos relacionados deben usar transacciones o escrituras atómicas de Firestore cuando corresponda. Considerar reintentos de transacción, límites de lecturas/escrituras y contención. Leer los datos necesarios antes de escribir, mantener el trabajo transaccional acotado y no ejecutar llamadas externas dentro de una transacción.

La prevención de reservas incompatibles necesita una estrategia de exclusión backend probada bajo concurrencia. **PROPUESTO:** reclamar atómicamente documentos de conflicto derivados de la grilla de inicios y duraciones aprobada, junto con la reserva o retención. La granularidad todavía es **PENDIENTE**; no depender solo de una consulta de solapamiento si esa consulta no impide que otra solicitud concurrente reclame el mismo intervalo. Validar expiración de retenciones y reintentos de forma idempotente.

Webhooks, pagos, créditos, inscripciones y accesos deben admitir eventos repetidos, tardíos o desordenados sin duplicar efectos. Los procesos programados, si se adoptan, deben ser idempotentes y dejar trazabilidad; una tarea programada no revoca automáticamente reservas por ausencia.

## 7. Precios, pagos y créditos

- El backend calcula el precio con reglas configurables de demanda baja, normal, alta o muy alta, sin fórmula, importes, moneda ni ponderaciones inventadas.
- Al confirmar, se conserva el precio y las condiciones aplicadas. Cambios futuros no alteran reservas ya confirmadas.
- Pago presencial: la reserva puede confirmarse con pago pendiente de registración por personal autorizado.
- Pago online: Mercado Pago se inicia y valida en backend. Solo un webhook verificado permite confirmar el pago; el retorno del navegador no lo hace.
- Conciliar eventos tardíos, repetidos o desordenados y casos donde el pago llega después del vencimiento de una retención.
- Cancelaciones elegibles de reservas pagadas pueden generar créditos, no un reembolso automático. Registrar emisión, consumo parcial/total y ajustes como movimientos auditables e idempotentes.
- No almacenar datos de tarjetas ni secretos de Mercado Pago en el cliente.

## 8. Archivos y notificaciones

Cloud Storage alojará archivos solo con reglas específicas por usuario/tipo de archivo, límites y validación backend cuando corresponda. La política técnica de la foto de perfil sigue pendiente. No asumir que Storage está operativo.

El correo es el canal inicial previsto. Resend continúa **PENDIENTE** de selección; separar la decisión de proveedor de los requisitos de correo de Authentication. No asumir que el envío transaccional está implementado.

## 9. Consultas e índices

Diseñar primero las consultas reales para reservas por usuario/recurso/periodo, pagos y eventos, movimientos de crédito, membresías activas, sesiones e inscripciones de clases, accesos, ocupación y auditoría. Crear índices de Firestore solo cuando una consulta implementada los requiera y verificar su costo y límites. No declarar índices creados porque estén documentados.

## 10. Pruebas y despliegue

Usar Firebase Emulator Suite para pruebas locales de Security Rules, Cloud Functions, Firestore, Authentication y Storage donde corresponda. Incluir pruebas de aislamiento entre clientes, privilegios del personal, reserva simultánea, idempotencia, pagos repetidos/tardíos, créditos parciales, cupos, QR, entradas/salidas y reglas de archivos.

Separar entornos de desarrollo, pruebas y producción y sus secretos/configuración. GitHub Pages puede seguir sirviendo el frontend estático mientras sea compatible; no ejecuta backend ni contiene secretos. Antes de declarar una función lista, verificar código, pruebas y configuración efectiva del servicio. No hay despliegue ni configuración productiva acreditados por esta documentación.
