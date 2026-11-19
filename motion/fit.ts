/**
 * Las cuentas de golpes (spec 2026-11-18 §6): un golpe dura `60 / bpm` segundos
 * y el `logo` final no cuenta para el límite, como el cierre de siempre. Armar
 * un template con el material y la duración es `adapt.ts`.
 */
import type { TemplateMoment } from "./types";

export const beatSeconds = (bpm: number): number => 60 / bpm;

/**
 * El margen de tempo al encajar: la música se pide al BPM del template, pero la
 * pista medida puede ir más lenta. Se encaja como si fuera un 15 % más lenta, para
 * que medir el tempo nunca empuje el video por encima del límite del plan después
 * de pagar la música.
 */
export const FIT_HEADROOM = 0.85;

/** Lo que cuenta para el límite: todo menos el `logo` final. */
export function countedBeats(moments: Pick<TemplateMoment, "block" | "beats">[]): number {
	const last = moments.at(-1);
	const counted = last?.block === "logo" ? moments.slice(0, -1) : moments;
	return counted.reduce((n, m) => n + m.beats, 0);
}

