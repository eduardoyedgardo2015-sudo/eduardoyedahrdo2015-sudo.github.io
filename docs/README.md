# Documentación de NEXUS

Esta carpeta contiene requisitos funcionales, diseño técnico, etapas futuras y decisiones abiertas. La documentación no acredita que una función esté **IMPLEMENTADA** ni que un servicio esté **CONFIGURADO**.

## Inventario documental

| Archivo | Alcance |
|---|---|
| [`DOCUMENTO-MAESTRO.md`](DOCUMENTO-MAESTRO.md) | Autoridad de requisitos funcionales y estado funcional real descrito. |
| [`ARQUITECTURA-TECNICA.md`](ARQUITECTURA-TECNICA.md) | Arquitectura Firebase y patrones técnicos propuestos. |
| [`PLAN-DE-IMPLEMENTACION.md`](PLAN-DE-IMPLEMENTACION.md) | Etapas futuras, dependencias y criterios de salida. |
| [`DECISIONES-PENDIENTES.md`](DECISIONES-PENDIENTES.md) | Decisiones operativas, comerciales y técnicas aún abiertas, separadas de las ya tomadas. |
| [`DOCUMENTO-MAESTRO-FIRESTORE.md`](DOCUMENTO-MAESTRO-FIRESTORE.md) | Propuesta de arquitectura documental Firestore; se referencia como material existente, no como prueba de configuración o implementación. |

El documento Firestore se conserva sin cambios. Su contenido no certifica que las colecciones, reglas, índices o funciones descritos existan en un proyecto Firebase.

## Estado observado del proyecto

El repositorio contiene una web institucional conceptual y la inicialización del cliente Firebase en `js/firebase/client.js`. Esa inicialización no demuestra que existan flujos funcionales de autenticación, operaciones de Firestore, reservas, pagos ni otros módulos. Tampoco se verificó la configuración externa o productiva de servicios Firebase.

La categorización documental es:

- **DECIDIDO:** requisito o decisión aprobada.
- **PROPUESTO:** diseño sugerido que aún requiere aprobación.
- **PENDIENTE:** decisión no tomada.
- **IMPLEMENTADO:** comportamiento comprobado en código y pruebas.
- **CONFIGURADO:** configuración comprobada en el servicio correspondiente.

No se declara fecha, rama ni estado de despliegue; esos datos no son necesarios para interpretar el inventario.
