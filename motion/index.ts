/**
 * La puerta del motor de animación: `createMotion` con todos los bloques ya
 * registrados, también el momento `scene` (spec 2026-11-24). Quien monte el
 * motor (el editor, la página del Container) importa de aquí, no de `engine.ts`.
 */
import "./blocks";
import "./scene/block";

export { createMotion, SceneRuntimeError, type MotionHandle, type MotionDoc, type MotionMedia, type SceneIssue } from "./engine";
