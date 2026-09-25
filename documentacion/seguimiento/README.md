# Coordinador de Blue Fragancias

`coordinador_blue` organiza el trabajo, conserva las decisiones y revisa la
evidencia de cada entrega. La memoria vive en esta carpeta y permanece disponible
al retomar el proyecto.

## Dónde mirar

| Archivo | Para qué sirve |
|---|---|
| [ESTADO.md](ESTADO.md) | Punto actual, evidencia, riesgos y próximo paso |
| [TABLERO.md](TABLERO.md) | Tareas con identificador, dependencias y criterio de terminado |
| [DECISIONES.md](DECISIONES.md) | Reglas aceptadas y preguntas que siguen abiertas |
| [BITACORA.md](BITACORA.md) | Registro cronológico de avances, pruebas y correcciones |

Su configuración está en [coordinador_blue.toml](../../.codex/agents/coordinador_blue.toml).
Los [acuerdos del proyecto](../../AGENTS.md) indican que se consulte y actualice
esta memoria durante el trabajo.

Último cierre de jornada: [checklist del 23 de septiembre](CIERRE-2026-09-23.md).

## Cómo pedirle trabajo

En una conversación de Codex abierta en este proyecto, puedes escribir:

> Usa coordinador_blue para revisar el estado del proyecto y organizar la siguiente entrega.

Otros ejemplos:

- «Coordinador, registra lo que acabamos de terminar y qué comprobamos».
- «Coordinador, revisa qué falta para publicar una versión de prueba».
- «Coordinador, recupera las decisiones de precios y pagos».

El agente sigue las instrucciones guardadas cuando se lo invoca. El agente
principal también mantiene la memoria al cerrar un avance. Si una sesión abierta
todavía no reconoce el perfil nuevo, se pueden leer sus instrucciones explícitamente
o iniciar otra sesión en la misma carpeta; los archivos siguen siendo la memoria.

No hay un proceso permanentemente activo ni una revisión programada. La
supervisión ocurre al trabajar en el proyecto o al pedir una revisión. Tampoco
puede conocer trabajo realizado fuera de las sesiones si no está en los archivos
o el usuario no lo comunica.

## Método de coordinación

1. Recuperar estado y decisiones; contrastarlos con los archivos pertinentes.
2. Elegir una tarea pequeña del tablero, con propósito y criterio de terminado.
3. Separar hechos comprobados, propuestas y decisiones todavía pendientes.
4. Revisar seguridad y funcionalidad según el cambio, sin imponer pruebas ajenas.
5. Registrar evidencia, actualizar el tablero y dejar el siguiente paso concreto.

Solo un agente escribe el seguimiento de una entrega. La bitácora se amplía sin
borrar historia; una rectificación se registra en una entrada nueva. Una tarea
no queda terminada por tener código: debe satisfacer su criterio y especificar
cómo se comprobó. Los cambios o pruebas que no se ejecutaron quedan pendientes.

## Límites

El coordinador puede leer el proyecto y editar esta documentación. La creación
del coordinador no autoriza a implementar todo el backlog, ejecutar migraciones
en la base del usuario, enviar mensajes de WhatsApp o desplegar por su cuenta.
Conserva el modelo y los permisos de la sesión que lo invoca.

La configuración sigue el formato oficial de
[agentes personalizados](https://learn.chatgpt.com/docs/agent-configuration/subagents).
La recuperación de instrucciones del proyecto usa
[AGENTS.md](https://learn.chatgpt.com/docs/agent-configuration/agents-md).
