/**
 * Encajar un template en el límite de duración del plan (spec 2026-11-18 §6,
 * «El cierre y el límite del plan»). Se cuenta en golpes: un golpe dura
 * `60 / bpm` segundos. El `logo` final no cuenta, como el cierre de siempre.
 * Si no cabe, se quitan los momentos opcionales desde el final; si aun así no
 * cabe, se devuelve lo que quede y decide la exportación (402 `plan_limit`).
 */
import type { Template, TemplateMoment } from "./types";

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

export function fitTemplate(t: Template, opts: { bpm: number; maxSeconds: number }): TemplateMoment[] {
	const kept = [...t.moments];
	const fits = () => countedBeats(kept) * beatSeconds(opts.bpm * FIT_HEADROOM) <= opts.maxSeconds + 1e-6;
	for (let i = kept.length - 1; i >= 0 && !fits(); i--) if (kept[i]!.optional) kept.splice(i, 1);
	return kept;
}
