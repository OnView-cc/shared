/**
 * La mezcla del sonido de un video (spec 2026-11-16 §4.3 y §5.2): lo que la
 * composición no puede decidir sola porque depende de cuánto dura de verdad
 * cada archivo. `resolveAudio` recibe la composición y esas duraciones (el
 * navegador las lee de sus `<audio>`; en la exportación las mide el Container)
 * y devuelve la mezcla en números, la misma para el editor y para el archivo:
 *
 * - **La voz** de una escena tiene que caber en ella. Si es más larga se acelera
 *   hasta `VOICE_MAX_RATE`; si aun así no cabe, se corta al final de la escena
 *   con un fundido de `VOICE_FADE` y queda marcada (`overflow`), para que el
 *   editor lo avise.
 * - **La música** suena de principio a fin (cierre incluido), repitiéndose si es
 *   más corta, con sus fundidos y bajando a `DUCK_LEVEL` de su volumen mientras
 *   suena una voz, con rampas de `DUCK_RAMP`. Es una regla fija calculada con los
 *   intervalos de voz, no un compresor: así el navegador y ffmpeg hacen lo mismo.
 *
 * El volumen de la música es una lista de puntos (`GainPoint`) unidos por
 * rectas: esa lista ES la verdad; quien la reproduce interpola con `gainAt`.
 */
import type { Composition } from "./compose";

/** A cuánto de su volumen queda la música mientras suena una voz. */
export const DUCK_LEVEL = 0.45;
/** Lo que tarda en bajar (desde que empieza la voz) y en volver (desde que acaba). */
export const DUCK_RAMP = 0.25;
/** Lo más que se acelera una voz que no cabe en su escena. */
export const VOICE_MAX_RATE = 1.15;
/** El fundido con que se corta una voz que aun así no cabe. */
export const VOICE_FADE = 0.15;

/** Las duraciones reales, en segundos; null = no se pudo medir. Las voces, por id de escena. */
export interface AudioDurations {
	voices: Record<string, number | null | undefined>;
	music: number | null;
}

export interface VoicePlan {
	shotId: string;
	src: string;
	/** Dónde empieza en el video armado. */
	at: number;
	/** La velocidad a la que suena (1 = la suya). */
	rate: number;
	/** Cuánto suena, ya a esa velocidad. */
	play: number;
	/** El fundido final, o 0 si no se corta. */
	fade: number;
	/** No cabe ni acelerada: se corta. */
	overflow: boolean;
}

export interface GainPoint {
	t: number;
	gain: number;
}

export interface AudioPlan {
	voices: VoicePlan[];
	music: { src: string; loops: number; envelope: GainPoint[] } | null;
}

/**
 * Cómo cabe una voz de `duration` segundos en un hueco de `slot`. Sin duración
 * conocida suena a su velocidad lo que dure el hueco y lleva fundido, por si se
 * corta.
 */
export function fitVoice(duration: number | null | undefined, slot: number): { rate: number; play: number; fade: number; overflow: boolean } {
	const room = Math.max(0, slot);
	if (duration == null || !(duration > 0)) return { rate: 1, play: room, fade: VOICE_FADE, overflow: false };
	if (duration <= room) return { rate: 1, play: duration, fade: 0, overflow: false };
	const wanted = room > 0 ? duration / room : Infinity;
	if (wanted <= VOICE_MAX_RATE) return { rate: wanted, play: room, fade: 0, overflow: false };
	return { rate: VOICE_MAX_RATE, play: room, fade: VOICE_FADE, overflow: true };
}

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

/**
 * El volumen de la música a lo largo del video, como puntos unidos por rectas.
 * La bajada empieza con la voz y dura `DUCK_RAMP`; la subida empieza al acabar
 * la voz y dura `DUCK_RAMP`. Dos voces seguidas no dejan subir la música del
 * todo entre ellas.
 */
export function musicEnvelope(total: number, volume: number, fadeIn: number, fadeOut: number, voiced: { from: number; to: number }[]): GainPoint[] {
	const end = Math.max(0, total);
	const level = clamp01(volume);
	const duck = (t: number) => {
		let depth = 0;
		for (const v of voiced) depth = Math.max(depth, Math.min(clamp01((t - v.from) / DUCK_RAMP), clamp01((v.to + DUCK_RAMP - t) / DUCK_RAMP)));
		return 1 - (1 - DUCK_LEVEL) * depth;
	};
	const fade = (t: number) => {
		let f = 1;
		if (fadeIn > 0 && t < fadeIn) f *= clamp01(t / fadeIn);
		if (fadeOut > 0 && t > end - fadeOut) f *= clamp01((end - t) / fadeOut);
		return f;
	};
	const knots = new Set<number>([0, end]);
	const add = (t: number) => {
		if (t > 0 && t < end) knots.add(Math.round(t * 1000) / 1000);
	};
	if (fadeIn > 0) add(fadeIn);
	if (fadeOut > 0) add(end - fadeOut);
	const sorted = [...voiced].sort((a, b) => a.from - b.from);
	sorted.forEach((v, i) => {
		add(v.from);
		add(v.from + DUCK_RAMP);
		add(v.to);
		add(v.to + DUCK_RAMP);
		// Una voz más corta que la rampa: la bajada y la subida se cruzan antes de llegar al fondo.
		if (v.to < v.from + DUCK_RAMP) add((v.from + v.to + DUCK_RAMP) / 2);
		// La subida de esta voz se cruza con la bajada de la siguiente.
		const next = sorted[i + 1];
		if (next && next.from < v.to + DUCK_RAMP) add((v.to + DUCK_RAMP + next.from) / 2);
	});
	return [...knots].sort((a, b) => a - b).map((t) => ({ t, gain: level * fade(t) * duck(t) }));
}

/** El volumen en el segundo `t`: la recta entre los dos puntos que lo rodean; fuera de la lista, el del extremo. */
export function gainAt(envelope: GainPoint[], t: number): number {
	const first = envelope[0];
	if (!first) return 0;
	if (t <= first.t) return first.gain;
	for (let i = 1; i < envelope.length; i++) {
		const b = envelope[i]!;
		if (t <= b.t) {
			const a = envelope[i - 1]!;
			return b.t === a.t ? b.gain : a.gain + ((b.gain - a.gain) * (t - a.t)) / (b.t - a.t);
		}
	}
	return envelope[envelope.length - 1]!.gain;
}

/** La mezcla de un video con las duraciones reales de sus voces y de su música. */
export function resolveAudio(c: Composition, d: AudioDurations): AudioPlan {
	const voices: VoicePlan[] = c.voices.map((v) => ({ shotId: v.shotId, src: v.src, at: v.at, ...fitVoice(d.voices[v.shotId], v.slot) }));
	if (!c.music) return { voices, music: null };
	const voiced = voices.filter((v) => v.play > 0).map((v) => ({ from: v.at, to: v.at + v.play }));
	// La pista suena desde su primer golpe (`tempo.offset`): así la rejilla de golpes del video cae sobre la música.
	const start = Math.max(0, c.tempo.offset);
	const loops = d.music != null && d.music > 0 ? Math.max(1, Math.ceil((c.total + start) / d.music)) : 1;
	return { voices, music: { src: c.music.src, start, loops, envelope: musicEnvelope(c.total, c.music.volume, c.music.fadeIn, c.music.fadeOut, voiced) } };
}
