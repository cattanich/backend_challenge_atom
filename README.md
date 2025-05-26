# Atom FullStack Backend Challenge - Lista de Tareas
**Realizado por Christian Cattani**
## Tecnologías utilizadas
- **Node.js** con **Express** para el servidor backend.
- **TypeScript** para tipado estático y mejor mantenimiento del código.
- **Firebase Cloud Functions** para desplegar el backend en la nube.
- **Firebase Firestore** como base de datos NoSQL para almacenar usuarios y tareas.
- **Arquitectura limpia (Clean Architecture)** con separación en capas: controladores, servicios, repositorios y modelos.
- Uso de patrones de diseño como repositorios para acceso a datos y servicios para lógica de negocio.

## Decisiones de diseño
- Se implementó un backend modular y escalable, con rutas separadas para usuarios y tareas.
- El backend expone endpoints REST para login de usuario, y CRUD de tareas.
- Se usa Firestore para persistencia, aprovechando su integración con Firebase Functions.
- La función principal se exporta como `api` para ser consumida desde Firebase Cloud Functions.
- Se aplicaron buenas prácticas de código, manejo de errores y validaciones básicas.
- Se configuró CORS para permitir acceso desde cualquier origen, facilitando el desarrollo frontend.
- No se implementó autenticación avanzada (tokens) para mantener simplicidad y cumplir con el tiempo del challenge.

## Comentarios relevantes
- El proyecto está preparado para extenderse con autenticación, pruebas unitarias y mejoras en seguridad.
- La estructura del proyecto facilita la mantenibilidad y escalabilidad futura.
- Se recomienda revisar la configuración de despliegue y dependencias para evitar conflictos de tipos en TypeScript.

Este backend cumple con los requerimientos funcionales del challenge y está listo para integrarse con Angular.
