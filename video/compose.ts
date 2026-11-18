/**
 * Cómo se arma un video de OnView: una sola regla para el editor y para la
 * exportación (spec 2026-11-16 §5.2; desde el motor de animación, spec
 * 2026-11-18 §6). `composeVideo` recibe los datos del proyecto, lo que su kit de
 * marca decide, el tempo de su música y los límites del plan, y devuelve la
 * **composición**: los **momentos** en orden (qué bloque dibuja cada uno, con
 * qué parámetros, dónde empieza y cuánto dura), la marca, las voces con el
 * hueco de su momento, la música, los efectos y el tamaño del cuadro. El motor
 * (`@onview/shared/motion`) la dibuja; la mezcla del sonido (que depende de la
 * duración real de cada archivo) se resuelve aparte, en `mix.ts`.
 *
 * - Un momento con golpes dura `beats × 60 / bpm`; uno sin golpes (las escenas
 *   de siempre, bloque `clip`), lo que su recorte o los segundos pedidos.
 * - Si el último momento no es un `logo` y el kit tiene logo de cierre, se
 *   añade un `logo` de 4 golpes con la línea del cierre (`shotId: null`).
 * - El `logo` final no cuenta para la duración máxima del plan
 *   (`scenesTotal`), como el cierre de siempre.
 * - Un template sin voz no arma voces.
 *
 * Es código puro: no sabe de React, del navegador ni de la base. `src` es
 * opaco: en el editor es una URL, en el servidor una clave del almacén.
 *
 * Las fracciones (`TEXT_SIZE`, `LOGO_MARGIN`…) son del lado corto del cuadro
 * salvo donde se dice: el motor las lee de aquí.
 */

import { beatSeconds } from "../motion/fit";
import type { AnyBlockParams, BlockKind, Transition } from "../motion/types";

export type Format = "9:16" | "1:1" | "16:9";
export type Quality = "standard_720p" | "standard_1080p" | "premium_1080p";
export type Resolution = "720p" | "1080p";
export type TextPosition = "top" | "center" | "bottom";

/** Una letra: una familia de la lista del kit y su peso. */
export interface Face {
	family: string;
	weight: number;
}

export const FPS = 30;
/** Los golpes del cierre que se añade solo. */
export const CLOSING_BEATS = 4;
/** Cuánto antes del final de su momento suena un efecto que caería fuera: no invade el siguiente. */
export const SFX_EDGE = 0.05;

/** El tamaño del texto de un `clip`, como fracción del lado corto del cuadro. */
export const TEXT_SIZE = 0.055;
/** El margen lateral del texto. */
export const TEXT_SIDE = 0.08;
export const TEXT_TOP = 0.08;
export const TEXT_BOTTOM = 0.1;
/** El margen del logo de la esquina. */
export const LOGO_MARGIN = 0.028;
/** El ancho máximo del logo, como fracción del ancho del cuadro. */
export const LOGO_MAX_W = 0.22;
/** El alto máximo del logo, como fracción del alto del cuadro. */
export const LOGO_MAX_H = 0.12;
/** La marca de agua de los planes que la llevan: esquina, margen y ancho (del lado corto) y opacidad. */
export const WATERMARK = { corner: "top-left", margin: 0.028, width: 0.2, opacity: 0.6 } as const;

/** La letra del texto cuando el video no tiene kit, o el kit no tiene tipografías. */
export const DEFAULT_FACE: Face = { family: "bricolage-grotesque", weight: 600 };
export const FALLBACK_TEXT = "#ffffff";
export const FALLBACK_CLOSING = "#0a0a0b";
export const FALLBACK_ACCENT = "#f4f4f2";
/** El tope de la línea del cierre. */
export const MAX_CLOSING_TEXT = 60;

export interface ComposeImage {
	id: string;
	src: string;
	width: number;
	height: number;
}

export interface ComposeShot {
	id: string;
	position: number;
	/** Lo pedido al modelo: lo que ocupa un `clip` mientras no tenga clip y no tenga golpes. */
	seconds: number;
	block: BlockKind;
	params: AnyBlockParams;
	/** Golpes de música; null = la duración de siempre (recorte o segundos). */
	beats: number | null;
	transition: Transition;
	trimIn: number;
	trimOut: number | null;
	/** La versión elegida, si está lista (sólo cuenta en un `clip`). */
	clip: { src: string; seconds: number } | null;
	/** Su foto, para ocupar el sitio de un clip que aún no existe. */
	still: string | null;
	/** La voz lista del momento. */
	voice: { src: string } | null;
	/** Las imágenes del momento, en su orden, con su tamaño en píxeles. */
	images: ComposeImage[];
}

export interface ComposeBrand {
	textColor: string | null;
	closingColor: string | null;
	accentColor: string | null;
	/** Todos los colores del kit, en su orden (el fondo del motor los usa). */
	colors: string[];
	primary: Face;
	secondary: Face;
	sceneLogo: string | null;
	closingLogo: string | null;
}

export interface ComposeInput {
	format: Format;
	quality: Quality;
	voiceVolume: number;
	musicVolume: number;
	musicFadeIn: number;
	musicFadeOut: number;
	/** La línea del cierre que se añade solo. */
	closingLine: string;
	tempo: { bpm: number; offset: number };
	template: { id: string; voice: boolean } | null;
	shots: ComposeShot[];
	music: { src: string } | null;
	sfx: { id: string; shotId: string; sfxKey: string; at: number; volume: number }[];
	brand: ComposeBrand | null;
	limits: { maxResolution: Resolution; watermark: boolean };
}

export interface Moment {
	/** null = el cierre que se añade solo. */
	shotId: string | null;
	block: BlockKind;
	params: AnyBlockParams;
	/** Dónde empieza en el video armado y cuánto dura. */
	at: number;
	seconds: number;
	transition: Transition;
	/** El trozo del clip que se usa (sólo en un `clip` con clip). */
	clip: { src: string; from: number; to: number } | null;
	still: string | null;
	images: ComposeImage[];
}

export interface MotionBrand {
	face: Face;
	secondary: Face;
	textColor: string;
	closingColor: string;
	accent: string;
	colors: string[];
	sceneLogo: string | null;
	closingLogo: string | null;
}

export interface VoiceCue {
	shotId: string;
	src: string;
	at: number;
	/** Lo que dura su momento: la voz tiene que caber ahí. */
	slot: number;
}

export interface SfxCue {
	id: string;
	shotId: string;
	sfxKey: string;
	/** En el video armado. */
	at: number;
	volume: number;
}

export interface Composition {
	v: 2;
	width: number;
	height: number;
	fps: 30;
	format: Format;
	tempo: { bpm: number; offset: number };
	moments: Moment[];
	brand: MotionBrand;
	voices: VoiceCue[];
	voiceVolume: number;
	music: { src: string; volume: number; fadeIn: number; fadeOut: number } | null;
	sfx: SfxCue[];
	watermark: boolean;
	/** Sin el `logo` final: lo que mide la duración máxima del plan. */
	scenesTotal: number;
	/** Con él. */
	total: number;
}

const SHORT_SIDE: Record<Resolution, number> = { "720p": 720, "1080p": 1080 };
const LONG_SIDE: Record<Resolution, number> = { "720p": 1280, "1080p": 1920 };

/** El cuadro del archivo: el formato del video a la menor resolución entre su calidad y el máximo del plan. */
export function frameSize(format: Format, quality: Quality, maxResolution: Resolution): { width: number; height: number } {
	const res: Resolution = quality === "standard_720p" || maxResolution === "720p" ? "720p" : "1080p";
	const short = SHORT_SIDE[res];
	const long = LONG_SIDE[res];
	if (format === "1:1") return { width: short, height: short };
	return format === "9:16" ? { width: short, height: long } : { width: long, height: short };
}

/** La versión que usa el video: la elegida si está lista; si no, la última lista. */
export function chooseVersion<V extends { id: string; state: string }>(versions: V[], selectedId: string | null): V | null {
	const ready = versions.filter((v) => v.state === "ready");
	return ready.find((v) => v.id === selectedId) ?? ready.at(-1) ?? null;
}

export function composeVideo(input: ComposeInput): Composition {
	const { width, height } = frameSize(input.format, input.quality, input.limits.maxResolution);
	const beat = beatSeconds(input.tempo.bpm);
	const voiced = input.template?.voice !== false;
	const moments: Moment[] = [];
	const voices: VoiceCue[] = [];
	let at = 0;
	for (const shot of [...input.shots].sort((a, b) => a.position - b.position)) {
		const isClip = shot.block === "clip";
		let clip: Moment["clip"] = null;
		let length = shot.beats != null ? shot.beats * beat : shot.seconds;
		if (isClip && shot.clip) {
			// El recorte se valida contra lo pedido, no contra el clip: una entrada más allá de su final
			// vuelve dentro de él, y un momento nunca acaba antes de empezar (revisión final, I1).
			const clipLength = shot.clip.seconds;
			const from = Math.min(Math.max(0, shot.trimIn), Math.max(0, clipLength - 1 / FPS));
			let to = shot.trimOut ?? clipLength;
			if (!(to > from)) to = Math.max(from + 1 / FPS, clipLength);
			if (shot.beats == null) length = to - from;
			clip = { src: shot.clip.src, from, to };
		}
		length = Math.max(0, length);
		moments.push({
			shotId: shot.id,
			block: shot.block,
			params: shot.params,
			at,
			seconds: length,
			transition: shot.transition,
			clip,
			still: isClip && !shot.clip ? shot.still : null,
			images: shot.images,
		});
		if (voiced && shot.voice) voices.push({ shotId: shot.id, src: shot.voice.src, at, slot: length });
		at += length;
	}

	const brand = input.brand;
	const motionBrand: MotionBrand = {
		face: brand?.primary ?? DEFAULT_FACE,
		secondary: brand?.secondary ?? DEFAULT_FACE,
		textColor: brand?.textColor ?? FALLBACK_TEXT,
		closingColor: brand?.closingColor ?? FALLBACK_CLOSING,
		accent: brand?.accentColor ?? FALLBACK_ACCENT,
		colors: brand?.colors ?? [],
		sceneLogo: brand?.sceneLogo ?? null,
		closingLogo: brand?.closingLogo ?? null,
	};
	if (moments.at(-1)?.block !== "logo" && motionBrand.closingLogo) {
		const seconds = CLOSING_BEATS * beat;
		moments.push({ shotId: null, block: "logo", params: { line: input.closingLine.trim().slice(0, MAX_CLOSING_TEXT) }, at, seconds, transition: "cut", clip: null, still: null, images: [] });
		at += seconds;
	}
	const total = at;
	const last = moments.at(-1);
	const scenesTotal = last?.block === "logo" ? total - last.seconds : total;

	const byShot = new Map(moments.flatMap((m) => (m.shotId ? [[m.shotId, m] as const] : [])));
	const sfx: SfxCue[] = input.sfx.flatMap((item) => {
		const m = byShot.get(item.shotId);
		if (!m) return [];
		const offset = item.at >= m.seconds ? Math.max(0, m.seconds - SFX_EDGE) : Math.max(0, item.at);
		return [{ id: item.id, shotId: item.shotId, sfxKey: item.sfxKey, at: m.at + offset, volume: item.volume }];
	});
	sfx.sort((a, b) => a.at - b.at);

	return {
		v: 2,
		width,
		height,
		fps: FPS,
		format: input.format,
		tempo: { bpm: input.tempo.bpm, offset: input.tempo.offset },
		moments,
		brand: motionBrand,
		voices,
		voiceVolume: input.voiceVolume,
		music: input.music ? { src: input.music.src, volume: input.musicVolume, fadeIn: input.musicFadeIn, fadeOut: input.musicFadeOut } : null,
		sfx,
		watermark: input.limits.watermark,
		scenesTotal,
		total,
	};
}

/**
 * Los momentos que todavía no se pueden exportar: un `clip` sin clip listo, unos
 * `icons` con menos de 2 imágenes, una `ui` o un `product` sin imagen. El
 * cierre que se añade solo nunca está aquí.
 */
export function incompleteMoments(c: Composition): string[] {
	return c.moments.flatMap((m) => {
		if (!m.shotId) return [];
		const missing = (m.block === "clip" && !m.clip) || (m.block === "icons" && m.images.length < 2) || ((m.block === "ui" || m.block === "product") && m.images.length === 0);
		return missing ? [m.shotId] : [];
	});
}
