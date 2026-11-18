/**
 * La puerta del motor de animación: `createMotion` con todos los bloques ya
 * registrados. Quien monte el motor (el editor, la página del Container) importa
 * de aquí, no de `engine.ts`.
 */
import "./blocks";

export { createMotion, type MotionHandle, type MotionDoc, type MotionMedia } from "./engine";
