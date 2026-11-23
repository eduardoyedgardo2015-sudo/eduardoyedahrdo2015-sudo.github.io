# Documentación maestra de NEXUS

## Descripción

NEXUS es un parque deportivo, recreativo y gastronómico. La plataforma digital debe acompañar la operación integral del complejo —sitio público, clientes y socios, reservas, pagos, membresías, clases, recepción, acceso y administración—, no reducirlo a una página de alquiler de canchas.

## Estado del repositorio

**Revisión del repositorio:** `eduardoyedgardo2015-sudo/eduardoyedahrdo2015-sudo.github.io`, rama `main`.

**Estado comprobado:** sitio estático con `index.html`, `styles.css`, `script.js`, `config.js`, `README.txt` y `assets/`. El HTML presenta el concepto y las interacciones actuales son de navegación, modal informativo y configuración de enlaces. No se encontraron backend, esquema de datos, migraciones, autenticación, pagos, reservas reales, membresías, QR ni panel administrativo.

**Última revisión documental:** 2026-11-23. La revisión describe los archivos accesibles en el repositorio en esa fecha; volver a verificar antes de iniciar una implementación.

## Cómo leer esta documentación

Las etiquetas tienen significado estricto:

- **CONFIRMADO:** requisito o decisión funcional expresamente establecidos por el Documento Maestro proporcionado por el usuario.
- **PROPUESTO:** recomendación técnica; no constituye una aprobación funcional ni de proveedor adicional.
- **PENDIENTE:** decisión, dato operativo o regla todavía no definida.
- **IMPLEMENTADO:** conducta observada directamente en los archivos actuales.
- **NO IMPLEMENTADO:** función planificada, pero ausente del repositorio revisado.

La prioridad de fuentes es: decisiones funcionales del Documento Maestro, revisión del repositorio, y recomendaciones técnicas compatibles. Una propuesta nunca reemplaza una decisión pendiente.

## Índice

1. [Documento maestro funcional](DOCUMENTO-MAESTRO.md)
2. [Arquitectura técnica](ARQUITECTURA-TECNICA.md)
3. [Plan de implementación](PLAN-DE-IMPLEMENTACION.md)
4. [Decisiones pendientes](DECISIONES-PENDIENTES.md)

## Archivos de aplicación examinados

- [`index.html`](../index.html): página pública conceptual en español.
- [`styles.css`](../styles.css): estilos propios y adaptaciones responsive.
- [`script.js`](../script.js): menú móvil, modal, enlaces configurables y año actual.
- [`config.js`](../config.js): campos aún vacíos para canales y datos oficiales.
- [`README.txt`](../README.txt): instrucciones del sitio estático y advertencia de proyecto conceptual.
- [`assets/`](../assets/): logo y banner conceptual.

## Regla de cambio

Esta carpeta es documentación de referencia. Los documentos no afirman que una función esté construida hasta que se verifique en código y pruebas. Los cambios funcionales deberán planificarse por etapas, mantener la identidad visual y respetar las decisiones y pendientes descritos aquí.
