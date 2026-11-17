/**
 * Cómo se arma un video de OnView: una sola regla para el editor y para la
 * exportación (spec 2026-11-16 §5.2). `composeVideo` recibe los datos del
 * proyecto, lo que su kit de marca decide y los límites del plan, y devuelve la
 * **composición**: las escenas en orden con su recorte, cada texto con su
 * momento en el video armado, el logo de la esquina, las voces con el hueco de
 * su escena, la música, los efectos, el cierre y el tamaño del cuadro.
 *
 * Es código puro: no sabe de React, del navegador ni de la base. `src` es
 * opaco: en el editor es una URL, en el servidor una clave del almacén. La
 * mezcla del sonido (que depende de la duración real de cada archivo) se
 * resuelve aparte, en `mix.ts`.
 *
 * Las fracciones (`TEXT_SIZE`, `LOGO_MARGIN`…) son del lado corto del cuadro
 * salvo donde se dice: el CSS del editor y la exportación las leen de aquí, y
 * por eso el texto mide lo mismo en la pantalla que en el archivo.
 */

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
/** Lo que dura el cierre con el logo. No cuenta para la duración máxima del plan. */
export const CLOSING_SECONDS = 2;
/** Cuánto antes del final de su escena suena un efecto que caería fuera: no invade la siguiente. */
export const SFX_EDGE = 0.05;

/** El tamaño del texto, como fracción del lado corto del cuadro. */
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
/** El logo del cierre: centrado, dentro de estas fracciones del ancho y del alto. */
export const CLOSING_LOGO_W = 0.6;
export const CLOSING_LOGO_H = 0.22;
/** Dónde va el centro del logo del cierre, como fracción del alto: solo, al medio; con la línea, un poco más arriba. */
export const CLOSING_LOGO_Y = 0.5;
export const CLOSING_LOGO_Y_WITH_TEXT = 0.44;
/** El centro de la línea del cierre, como fracción del alto, y su tamaño, del lado corto. */
export const CLOSING_TEXT_Y = 0.62;
export const CLOSING_TEXT_SIZE = 0.044;
/** La marca de agua de los planes que la llevan: esquina, margen y ancho (del lado corto) y opacidad. */
export const WATERMARK = { corner: "top-left", margin: 0.028, width: 0.2, opacity: 0.6 } as const;

/** La letra del texto cuando el video no tiene kit, o el kit no tiene tipografías. */
export const DEFAULT_FACE: Face = { family: "bricolage-grotesque", weight: 600 };
export const FALLBACK_TEXT = "#ffffff";
export const FALLBACK_CLOSING = "#0a0a0b";
export const FALLBACK_ACCENT = "#f4f4f2";
/** El tope de la línea del cierre. */
export const MAX_CLOSING_TEXT = 60;

export interface ComposeShot {
	id: string;
	position: number;
	/** Lo pedido al modelo: lo que ocupa la escena mientras no tenga clip. */
	seconds: number;
	onScreenText: string;
	textPosition: TextPosition;
	textIn: number;
	textOut: number | null;
	trimIn: number;
	trimOut: number | null;
	/** La versión elegida, si está lista. */
	clip: { src: string; seconds: number } | null;
	/** Su foto, para ocupar el sitio de un clip que aún no existe. */
	still: string | null;
	/** La voz lista de la escena. */
	voice: { src: string } | null;
}

export interface ComposeBrand {
	textColor: string | null;
	closingColor: string | null;
	accentColor: string | null;
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
	closingText: string;
	shots: ComposeShot[];
	music: { src: string } | null;
	sfx: { id: string; shotId: string; sfxKey: string; at: number; volume: number }[];
	brand: ComposeBrand | null;
	limits: { maxResolution: Resolution; watermark: boolean };
}

export interface Scene {
	shotId: string;
	src: string | null;
	still: string | null;
	/** El trozo del clip que se usa. */
	from: number;
	to: number;
	/** Dónde empieza en el video armado. */
	at: number;
}

export interface TextCue {
	shotId: string;
	text: string;
	position: TextPosition;
	/** En el video armado. */
	from: number;
	to: number;
}

export interface VoiceCue {
	shotId: string;
	src: string;
	at: number;
	/** Lo que dura su escena: la voz tiene que caber ahí. */
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

export interface Closing {
	at: number;
	seconds: number;
	color: string;
	logo: string;
	/** La línea opcional del video; vacía si no hay. */
	text: string;
	face: Face;
	accent: string;
}

export interface Composition {
	v: 1;
	width: number;
	height: number;
	fps: 30;
	scenes: Scene[];
	texts: TextCue[];
	text: { face: Face; color: string };
	/** El logo de la esquina, durante las escenas. */
	logo: string | null;
	voices: VoiceCue[];
	voiceVolume: number;
	music: { src: string; volume: number; fadeIn: number; fadeOut: number } | null;
	sfx: SfxCue[];
	closing: Closing | null;
	watermark: boolean;
	/** Sin el cierre: lo que mide la duración máxima del plan. */
	scenesTotal: number;
	/** Con el cierre. */
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
	const scenes: Scene[] = [];
	const texts: TextCue[] = [];
	const voices: VoiceCue[] = [];
	let at = 0;
	for (const shot of [...input.shots].sort((a, b) => a.position - b.position)) {
		const from = shot.clip ? shot.trimIn : 0;
		const to = shot.clip ? (shot.trimOut ?? shot.clip.seconds) : shot.seconds;
		const length = Math.max(0, to - from);
		scenes.push({ shotId: shot.id, src: shot.clip?.src ?? null, still: shot.clip ? null : shot.still, from, to, at });
		const textIn = Math.min(Math.max(0, shot.textIn), length);
		const textOut = Math.max(textIn, Math.min(shot.textOut ?? length, length));
		if (shot.onScreenText && textOut > textIn) texts.push({ shotId: shot.id, text: shot.onScreenText, position: shot.textPosition, from: at + textIn, to: at + textOut });
		if (shot.voice) voices.push({ shotId: shot.id, src: shot.voice.src, at, slot: length });
		at += length;
	}
	const scenesTotal = at;

	const byShot = new Map(scenes.map((s) => [s.shotId, s]));
	const sfx: SfxCue[] = input.sfx.flatMap((item) => {
		const scene = byShot.get(item.shotId);
		if (!scene) return [];
		const length = scene.to - scene.from;
		const offset = item.at >= length ? Math.max(0, length - SFX_EDGE) : Math.max(0, item.at);
		return [{ id: item.id, shotId: item.shotId, sfxKey: item.sfxKey, at: scene.at + offset, volume: item.volume }];
	});
	sfx.sort((a, b) => a.at - b.at);

	const brand = input.brand;
	const closing: Closing | null = brand?.closingLogo
		? {
				at: scenesTotal,
				seconds: CLOSING_SECONDS,
				color: brand.closingColor ?? FALLBACK_CLOSING,
				logo: brand.closingLogo,
				text: input.closingText.trim().slice(0, MAX_CLOSING_TEXT),
				face: brand.secondary,
				accent: brand.accentColor ?? FALLBACK_ACCENT,
			}
		: null;

	return {
		v: 1,
		width,
		height,
		fps: FPS,
		scenes,
		texts,
		text: { face: brand?.primary ?? DEFAULT_FACE, color: brand?.textColor ?? FALLBACK_TEXT },
		logo: brand?.sceneLogo ?? null,
		voices,
		voiceVolume: input.voiceVolume,
		music: input.music ? { src: input.music.src, volume: input.musicVolume, fadeIn: input.musicFadeIn, fadeOut: input.musicFadeOut } : null,
		sfx,
		closing,
		watermark: input.limits.watermark,
		scenesTotal,
		total: scenesTotal + (closing ? closing.seconds : 0),
	};
}
