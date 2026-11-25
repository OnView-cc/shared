/**
 * Los eventos de una escena (spec 2026-11-24-onview-escenas-con-codigo §6.2),
 * sin DOM: los usan la composición y la mezcla en el Worker, además del motor.
 */
export type SceneEventKind = "click" | "land" | "swipe" | "type" | "reveal" | "success" | "whoosh" | "logo";
export const SCENE_EVENT_KINDS: readonly SceneEventKind[] = ["click", "land", "swipe", "type", "reveal", "success", "whoosh", "logo"];

export interface SceneEvent {
	kind: SceneEventKind;
	/** Segundos desde el inicio del momento. */
	at: number;
	/** El orden dentro de su tipo en el momento, desde 0. */
	n: number;
}
