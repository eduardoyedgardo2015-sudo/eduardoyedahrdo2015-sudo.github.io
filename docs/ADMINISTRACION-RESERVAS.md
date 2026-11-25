# Administración de reservas NEXUS

## Acceso administrativo

El panel `admin.html` permite iniciar sesión, pero no crear cuentas ni asignar roles. Las Cloud Functions son la autoridad: cada operación administrativa exige el custom claim booleano `admin: true` en el token de Firebase Authentication. No se aceptan permisos enviados en el cuerpo de una solicitud.

No se encontraron roles ni custom claims preexistentes en el código inspeccionado. Para autorizar personal, una persona con acceso confiable al entorno de administración de Firebase debe asignar el claim al UID verificado del usuario, usando Firebase Admin SDK y credenciales de servidor fuera del navegador y del repositorio:

```js
const auth = getAuth();
const user = await auth.getUser(uid);
await auth.setCustomUserClaims(uid, { ...user.customClaims, admin: true });
```

Para revocar el permiso, se puede establecer `admin: false` conservando los otros claims del usuario. La persona deberá volver a iniciar sesión o renovar el token para recibir los claims actualizados. Nunca se debe crear una función pública que permita establecer este claim.

## Datos de configuración

- `resourceBookingConfig/{resourceId}`: habilitación, zona horaria, intervalo de inicio, franjas semanales, excepciones por fecha y matriz de precios. Los importes se persisten como `amountMinorUnits` y `currency`.
- `demandAssignments/{assignmentId}`: recurso, nivel manual (`baja`, `normal`, `alta`, `muy_alta`), zona horaria, intervalo local y marcas de tiempo. Los intervalos activos de un mismo recurso no pueden superponerse.
- `resourceBlocks/{blockId}`: recurso, tipo (`mantenimiento` o `evento`), motivo, zona horaria, intervalo y estado activo.
- `reservationLocks/{lockId}`: buckets de exclusión transaccional asociados a `reservationId`. Se mantienen mientras la reserva esté operativa (`pending`/`in_progress`, o el equivalente legado `confirmed`/`awaiting_payment`) y se eliminan al finalizar o cancelar.
- `bookingConfigurationAudit/{eventId}`: actor, acción, recurso y fecha de cada modificación administrativa.
- `reservationEvents/{eventId}`: cambios de estado, pago y cancelación lógica con actor, estado anterior/nuevo, fecha y motivo.
- `reservations/{reservationId}.priceSnapshot`: importe, moneda, nivel, duración e identidad del recurso confirmados por el servidor.
- `reservations/{reservationId}.payment`: estado de pago independiente del estado operativo. Un registro manual guarda `confirmationType: manual_admin`, fecha y UID; no acredita un cobro de Mercado Pago.

Los cambios administrativos de demanda y bloqueos incrementan una revisión de configuración dentro de la misma transacción. Las confirmaciones leen la configuración, consultan solapamientos y reclaman todos los buckets de 15 minutos dentro de una transacción. Si un bucket existente apunta a una reserva inexistente, finalizada o cuyo intervalo no se solapa, se considera obsoleto y puede reclamarse atómicamente. Un bucket asociado a una reserva activa que sí se solapa sigue bloqueando la operación; la consulta de reservas también protege frente a locks ausentes.

Los estados operativos actuales son `pending`, `in_progress`, `completed` y `cancelled`; el pago se mantiene como `pending` o `paid` en su campo independiente. Sin migración masiva, `confirmed` y `awaiting_payment` se presentan como `pending`, y `revoked`/`no_show` como `cancelled`. Al cambiar un estado legado se conserva en `legacyStatus` y en el evento de transición; los documentos y eventos anteriores no se eliminan.

La sección “Gestión de reservas” filtra por fecha, recurso, estado operativo, estado de pago y cliente (UID/correo exacto); permite buscar por ID, paginar y separar activas de historial. El detalle administrativo incluye la identidad necesaria del cliente y el historial de eventos; estas funciones exigen el custom claim `admin: true`, mientras que las reglas Firestore continúan denegando acceso directo.

Las transiciones permitidas son `pending` → `in_progress` → `completed`. Una reserva puede cancelarse lógicamente desde `pending` o `in_progress`: permanece el documento, el historial y cualquier información financiera, y la transacción registra actor/fecha/motivo y libera sus locks. Las operaciones repetidas no duplican eventos. El panel no permite reabrir estados finalizados ni cancelar una reserva `completed`. No se aplican reembolsos, créditos ni cancelaciones automáticas; esas políticas comerciales siguen pendientes.

“Marcar como pagada” solo registra manualmente un pago presencial y es idempotente. El backend guarda fecha, UID administrativo y tipo de confirmación, sin cambiar el importe congelado ni afirmar que hubo un cobro mediante Mercado Pago. Las transiciones y el registro de pago se validan en Cloud Functions; un usuario cliente no puede invocarlos ni leer o escribir directamente reservas ajenas.

La cancelación, revocación, ausencia, reprogramación y sus efectos en pagos/créditos no se ofrecen en este panel: sus políticas y procedimientos aún están pendientes de aprobación. Tampoco se automatiza la liberación de una reserva por el mero transcurso del horario.

Un horario solo se ofrece si el recurso está habilitado, tiene horarios válidos, el período está cubierto por exactamente una asignación manual activa y existe un importe para ese nivel y duración. No se calcula demanda automáticamente.

## Firebase antes de habilitar el uso

1. Verificar Authentication y autorizar manualmente los UID de personal mediante el procedimiento confiable anterior.
2. Desplegar las Cloud Functions y el índice compuesto de `demandAssignments` cuando se autorice el despliegue. Este cambio de código no realiza despliegues.
3. Mantener Firestore Security Rules restrictivas. Las reglas existentes deniegan lecturas y escrituras directas de clientes; el panel solo muta configuración mediante Cloud Functions.
4. Configurar los recursos, zona horaria, todos los días de horario, intervalos, moneda, importes aprobados y períodos de demanda antes de ofrecer reservas. No se cargan valores predeterminados.
5. Validar funciones y reglas en un proyecto de emulación antes de usar datos reales.

El panel y las Functions no acreditan por sí mismos que el proyecto Firebase esté desplegado o configurado para producción.

## Validación local

- `cd functions && npm test`: pruebas unitarias de horarios, reglas de solapamiento, precios para todas las duraciones/niveles, permisos y granularidad transaccional.
- `cd functions && npm run test:emulator`: ejecuta Auth, Firestore y Functions con el proyecto ficticio `demo-nexus-test` y la configuración aislada `firebase.emulator-test.json`. Usa puertos alternativos para no interrumpir emuladores locales que ya estén en ejecución. No despliega ni accede a proyectos de producción.

La prueba de integración recorre disponibilidad, creación, consulta privada del cliente, listado y detalle administrativos, permisos y reglas, transición desde administración, pago manual/idempotencia, cancelación lógica, auditoría, conservación financiera, liberación del horario, conflicto simultáneo, bloqueo administrativo, recuperación de un lock obsoleto y privacidad entre clientes.
