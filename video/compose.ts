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
 * - Un momento con golpes dura `beats × 60 / bpm`; uno sin golpes, sus segundos.
 * - Todo video sale a 1080 en el lado corto, en cualquier plan (spec
 *   2026-11-18-onview-todo-codigo: sin clips de IA, sin calidades ni resolución).
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
import { resolveStyle, type Style } from "../motion/styles";
import type { AnyBlockParams, BlockKind, Transition } from "../motion/types";
import type { MomentWord } from "./narration";

export type Format = "9:16" | "1:1" | "16:9";
export type TextPosition = "top" | "center" | "bottom";

/** Una letra: una familia de la lista del kit y su peso. */
export interface Face {
	family: string;
	weight: number;
	/** Los pesos que tiene la letra (el motor elige el más cercano al que pide el estilo); sin ellos, se supone que tiene el pedido. */
	weights?: number[];
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
	/** Lo que dura un momento sin golpes. */
	seconds: number;
	block: BlockKind;
	params: AnyBlockParams;
	/** Golpes de música; null = sus segundos. */
	beats: number | null;
	/** null = la del estilo (spec 2026-11-19-onview-estilos-y-referencias §5.2). */
	transition: Transition | null;
	/**
	 * La voz lista del momento. Con narración continua (spec 2026-11-20), un tramo de la toma: suena de `from` a `to`
	 * del archivo, el momento dura eso, y trae sus palabras y lo hablado (desde el inicio del momento).
	 */
	voice: { src: string; from?: number; to?: number; words?: MomentWord[]; spoken?: { from: number; to: number } } | null;
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
	/** El logo para fondos claros (el fondo de los templates); sin él, se usa otro. */
	lightLogo?: string | null;
}

export interface ComposeInput {
	format: Format;
	voiceVolume: number;
	musicVolume: number;
	musicFadeIn: number;
	musicFadeOut: number;
	/** La línea del cierre que se añade solo. */
	closingLine: string;
	tempo: { bpm: number; offset: number };
	template: { id: string; voice: boolean } | null;
	/** El estilo elegido para el video (`projects.style_id`) y sus retoques; sin él, el del template. */
	style?: { id: string | null; overrides: unknown };
	shots: ComposeShot[];
	music: { src: string } | null;
	sfx: { id: string; shotId: string; sfxKey: string; at: number; volume: number }[];
	brand: ComposeBrand | null;
	limits: { watermark: boolean };
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
	images: ComposeImage[];
	/** Lo que dice la narración en este momento, desde su inicio (spec 2026-11-20): la imagen entra con la palabra. */
	words?: MomentWord[];
	spoken?: { from: number; to: number };
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
	lightLogo: string | null;
}

export interface VoiceCue {
	shotId: string;
	src: string;
	at: number;
	/** Lo que dura su momento: la voz tiene que caber ahí. */
	slot: number;
	/** El tramo del archivo que suena (narración continua); sin él, el archivo entero desde 0. */
	from?: number;
	to?: number;
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
	/** El estilo ya resuelto: el motor sólo lee éste. */
	style: Style;
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

const SHORT_SIDE = 1080;
const LONG_SIDE = 1920;

/** El cuadro del archivo: siempre 1080 en el lado corto. */
export function frameSize(format: Format): { width: number; height: number } {
	if (format === "1:1") return { width: SHORT_SIDE, height: SHORT_SIDE };
	return format === "9:16" ? { width: SHORT_SIDE, height: LONG_SIDE } : { width: LONG_SIDE, height: SHORT_SIDE };
}

export function composeVideo(input: ComposeInput): Composition {
	const { width, height } = frameSize(input.format);
	const beat = beatSeconds(input.tempo.bpm);
	const voiced = input.template?.voice !== false;
	const moments: Moment[] = [];
	const voices: VoiceCue[] = [];
	let at = 0;
	for (const shot of [...input.shots].sort((a, b) => a.position - b.position)) {
		// Un tramo de la narración manda: el momento dura lo que suena (spec 2026-11-20).
		const slice = voiced && shot.voice?.from != null && shot.voice.to != null ? { from: shot.voice.from, to: shot.voice.to } : null;
		const length = Math.max(0, slice ? slice.to - slice.from : shot.beats != null ? shot.beats * beat : shot.seconds);
		moments.push({
			shotId: shot.id,
			block: shot.block,
			params: shot.params,
			at,
			seconds: length,
			transition: shot.transition ?? "cut",
			images: shot.images,
			...(voiced && shot.voice?.words?.length ? { words: shot.voice.words, spoken: shot.voice.spoken } : {}),
		});
		if (voiced && shot.voice) voices.push({ shotId: shot.id, src: shot.voice.src, at, slot: length, ...(slice ?? {}) });
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
		lightLogo: brand?.lightLogo ?? null,
	};
	if (moments.at(-1)?.block !== "logo" && motionBrand.closingLogo) {
		const seconds = CLOSING_BEATS * beat;
		moments.push({ shotId: null, block: "logo", params: { line: input.closingLine.trim().slice(0, MAX_CLOSING_TEXT) }, at, seconds, transition: "cut", images: [] });
		at += seconds;
	}
	// Una transición vacía es la del estilo; la que entra a un cierre `logo` final, su `close`; la del último, un corte.
	const style = resolveStyle(input.template?.id || null, input.style?.id ?? null, input.style?.overrides ?? null);
	const given = new Map(input.shots.map((s) => [s.id, s.transition]));
	moments.forEach((m, i) => {
		if (m.shotId === null || given.get(m.shotId) != null) return;
		const next = moments[i + 1];
		m.transition = !next ? "cut" : next.block === "logo" && i + 1 === moments.length - 1 ? style.transitions.close : style.transitions.between;
	});
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
		style,
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
 * Los momentos que todavía no se pueden exportar: unos `icons` con menos de 2
 * imágenes, una `ui` o un `product` sin imagen. El
 * cierre que se añade solo nunca está aquí.
 */
export function incompleteMoments(c: Composition): string[] {
	return c.moments.flatMap((m) => {
		if (!m.shotId) return [];
		const missing = (m.block === "icons" && m.images.length < 2) || ((m.block === "ui" || m.block === "product") && m.images.length === 0);
		return missing ? [m.shotId] : [];
	});
}
