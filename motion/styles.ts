/**
 * Los estilos (spec 2026-11-19-onview-estilos-y-referencias §5): un template es
 * **estructura** (sus momentos, `templates.ts`) más **estilo** (esta ficha):
 * cómo se ve y cómo se mueve. El kit pone la familia de letra, los colores y
 * los logos; el estilo decide cómo se usan: el fondo, el peso, el tamaño y la
 * entrada de la letra, el tempo, las transiciones, la cámara, el marco del
 * producto y la energía de la música.
 *
 * Son datos, no código por template: el video de referencia (E3) y Lumen
 * (`set_style`) combinan la estructura de un template con otro estilo y
 * retocan valores dentro de lo que admite cada campo. `resolveStyle` es la
 * única puerta: el estilo del template, cambiado por el `style_id` del
 * proyecto si vale, con los retoques (`style_overrides`) encima, y nunca lanza.
 *
 * `arcade` es el aspecto de antes de los estilos, al cuadro: «Lanzamiento de
 * software» no cambia (§4). Su peso `"kit-500"` es el de siempre, el del kit
 * con un tope de 500.
 *
 * `summary` y `music.mood` van en inglés: son para el modelo.
 */
import type { LocalText, Template, Transition } from "./types";
import { TRANSITIONS } from "./types";
import { getTemplate } from "./templates";

export const STYLE_IDS = ["arcade", "changelog", "orbit", "showcase", "blocks", "steps", "impact", "cinema"] as const;
export type StyleId = (typeof STYLE_IDS)[number];

export type BackgroundKind = "sky" | "dark" | "brand" | "paper" | "photo" | "auto";
export type TypeEntry = "groups" | "slam" | "rise" | "fade" | "type";

export interface Style {
	id: StyleId;
	name: LocalText;
	/** Una línea para Lumen, en inglés. */
	summary: string;
	background: { kind: BackgroundKind; motion: "still" | "drift"; saturate: number };
	type: { scale: "s" | "m" | "l" | "xl"; weight: number | "kit-500"; case: "normal" | "upper"; tracking: number; entry: TypeEntry; place: "center" | "corner" | "lower" };
	tempo: { bpm: number; min: number; max: number };
	transitions: { between: Transition; close: Transition };
	camera: { drift: "none" | "in" | "parallax"; amount: "subtle" | "wide"; hit: "none" | "shake" | "zoom" };
	product: { frame: "shadow" | "plinth" | "bleed"; move: "subtle" | "wide" };
	music: { mood: string };
}

/** Lo que Lumen o el video de referencia pueden retocar: ni el tempo (vive en `tempo_bpm`) ni la música. */
export interface StylePatch {
	styleId?: StyleId;
	background?: Partial<Style["background"]>;
	type?: Partial<Style["type"]>;
	transitions?: Partial<Style["transitions"]>;
	camera?: Partial<Style["camera"]>;
	product?: Partial<Style["product"]>;
}

const style = (s: Style): Style => s;

export const STYLES: Record<StyleId, Style> = {
	arcade: style({
		id: "arcade",
		name: { en: "Arcade", es: "Arcade", pt: "Arcade" },
		summary: "Arcade: light sky with soft brand-colour glows, phrases that come in word by word, 116 BPM, blur between moments",
		background: { kind: "sky", motion: "drift", saturate: 0 },
		type: { scale: "m", weight: "kit-500", case: "normal", tracking: -0.025, entry: "groups", place: "center" },
		tempo: { bpm: 116, min: 110, max: 124 },
		transitions: { between: "blur", close: "blur" },
		camera: { drift: "none", amount: "subtle", hit: "none" },
		product: { frame: "shadow", move: "subtle" },
		music: { mood: "clean tech pop" },
	}),
	changelog: style({
		id: "changelog",
		name: { en: "Changelog", es: "Changelog", pt: "Changelog" },
		summary: "Changelog: flat off-white paper, phrases that rise in, 120 BPM, hard cuts on the beat with a small zoom hit",
		background: { kind: "paper", motion: "still", saturate: 0 },
		type: { scale: "m", weight: 600, case: "normal", tracking: -0.02, entry: "rise", place: "center" },
		tempo: { bpm: 120, min: 114, max: 128 },
		transitions: { between: "cut", close: "cut" },
		camera: { drift: "none", amount: "subtle", hit: "zoom" },
		product: { frame: "shadow", move: "subtle" },
		music: { mood: "light electronic" },
	}),
	orbit: style({
		id: "orbit",
		name: { en: "Orbit", es: "Órbita", pt: "Órbita" },
		summary: "Orbit: near-black with a brand-colour glow, large phrases, logos in orbit with parallax, 120 BPM, push between moments",
		background: { kind: "dark", motion: "drift", saturate: 0 },
		type: { scale: "l", weight: 600, case: "normal", tracking: -0.025, entry: "groups", place: "center" },
		tempo: { bpm: 120, min: 112, max: 126 },
		transitions: { between: "push", close: "push" },
		camera: { drift: "parallax", amount: "subtle", hit: "none" },
		product: { frame: "shadow", move: "subtle" },
		music: { mood: "wide atmospheric synth" },
	}),
	showcase: style({
		id: "showcase",
		name: { en: "Showcase", es: "Escaparate", pt: "Vitrine" },
		summary: "Showcase: editorial, dark or brand colour, the product photo on a plinth with a slow push-in, small uppercase words in a corner, 96 BPM, wipes",
		background: { kind: "auto", motion: "still", saturate: 0 },
		type: { scale: "s", weight: 400, case: "upper", tracking: 0.12, entry: "fade", place: "corner" },
		tempo: { bpm: 96, min: 88, max: 104 },
		transitions: { between: "wipe", close: "wipe" },
		camera: { drift: "in", amount: "wide", hit: "none" },
		product: { frame: "plinth", move: "wide" },
		music: { mood: "elegant, deep bass, minimal" },
	}),
	blocks: style({
		id: "blocks",
		name: { en: "Blocks", es: "Bloques", pt: "Blocos" },
		summary: "Blocks: solid brand-colour blocks, large bold phrases that slam in, one product per beat, 124 BPM, hard cuts with a zoom hit",
		background: { kind: "brand", motion: "still", saturate: 0.3 },
		type: { scale: "l", weight: 700, case: "normal", tracking: -0.03, entry: "slam", place: "center" },
		tempo: { bpm: 124, min: 118, max: 130 },
		transitions: { between: "cut", close: "cut" },
		camera: { drift: "none", amount: "subtle", hit: "zoom" },
		product: { frame: "shadow", move: "subtle" },
		music: { mood: "punchy pop" },
	}),
	steps: style({
		id: "steps",
		name: { en: "Step by step", es: "Paso a paso", pt: "Passo a passo" },
		summary: "Step by step: calm off-white paper, phrases that rise in the lower third, 90 BPM, moments slide from one to the next",
		background: { kind: "paper", motion: "still", saturate: 0 },
		type: { scale: "m", weight: 500, case: "normal", tracking: -0.02, entry: "rise", place: "lower" },
		tempo: { bpm: 90, min: 84, max: 100 },
		transitions: { between: "slide", close: "slide" },
		camera: { drift: "none", amount: "subtle", hit: "none" },
		product: { frame: "shadow", move: "subtle" },
		music: { mood: "calm acoustic" },
	}),
	impact: style({
		id: "impact",
		name: { en: "Impact", es: "Impacto", pt: "Impacto" },
		summary: "Impact: saturated brand colour full frame, huge uppercase words that slam in, 128 BPM, cuts with a zoom punch and a shake on strong beats",
		background: { kind: "brand", motion: "still", saturate: 0.8 },
		type: { scale: "xl", weight: 800, case: "upper", tracking: -0.02, entry: "slam", place: "center" },
		tempo: { bpm: 128, min: 122, max: 134 },
		transitions: { between: "punch", close: "punch" },
		camera: { drift: "none", amount: "subtle", hit: "shake" },
		product: { frame: "bleed", move: "subtle" },
		music: { mood: "intense electronic, driving" },
	}),
	cinema: style({
		id: "cinema",
		name: { en: "Cinema", es: "Cine", pt: "Cinema" },
		summary: "Cinema: near-black, large light phrases that fade in word by word, a slow push-in, 80 BPM, long crossfades",
		background: { kind: "dark", motion: "drift", saturate: 0 },
		type: { scale: "l", weight: 400, case: "normal", tracking: -0.01, entry: "fade", place: "center" },
		tempo: { bpm: 80, min: 72, max: 90 },
		transitions: { between: "fade", close: "fade" },
		camera: { drift: "in", amount: "subtle", hit: "none" },
		product: { frame: "shadow", move: "subtle" },
		music: { mood: "cinematic, slow build" },
	}),
};

export function isStyleId(v: unknown): v is StyleId {
	return typeof v === "string" && (STYLE_IDS as readonly string[]).includes(v);
}

const BG_KINDS: readonly BackgroundKind[] = ["sky", "dark", "brand", "paper", "photo", "auto"];
const ENTRIES: readonly TypeEntry[] = ["groups", "slam", "rise", "fade", "type"];
const object = (v: unknown): Record<string, unknown> | null => (v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : null);
const oneOf = <T extends string>(list: readonly T[], v: unknown): v is T => typeof v === "string" && (list as readonly string[]).includes(v);
const between = (v: unknown, lo: number, hi: number): v is number => typeof v === "number" && Number.isFinite(v) && v >= lo && v <= hi;
const isWeight = (v: unknown): v is number => typeof v === "number" && Number.isInteger(v) && v >= 100 && v <= 900 && v % 100 === 0;

/** Un campo por cada parte que se puede retocar: el nombre del campo y si el valor vale. */
const FIELDS: { [P in Exclude<keyof StylePatch, "styleId">]: Record<string, (v: unknown) => boolean> } = {
	background: { kind: (v) => oneOf(BG_KINDS, v), motion: (v) => oneOf(["still", "drift"], v), saturate: (v) => between(v, 0, 1) },
	type: {
		scale: (v) => oneOf(["s", "m", "l", "xl"], v),
		weight: (v) => isWeight(v) || v === "kit-500",
		case: (v) => oneOf(["normal", "upper"], v),
		tracking: (v) => between(v, -0.1, 0.3),
		entry: (v) => oneOf(ENTRIES, v),
		place: (v) => oneOf(["center", "corner", "lower"], v),
	},
	transitions: { between: (v) => oneOf(TRANSITIONS, v), close: (v) => oneOf(TRANSITIONS, v) },
	camera: { drift: (v) => oneOf(["none", "in", "parallax"], v), amount: (v) => oneOf(["subtle", "wide"], v), hit: (v) => oneOf(["none", "shake", "zoom"], v) },
	product: { frame: (v) => oneOf(["shadow", "plinth", "bleed"], v), move: (v) => oneOf(["subtle", "wide"], v) },
};

/** Los retoques que valen de lo que llega (de la base, de Lumen o de la API); nunca lanza. */
export function parseStylePatch(raw: unknown): Omit<StylePatch, "styleId"> {
	const input = object(raw);
	const out: Record<string, Record<string, unknown>> = {};
	if (!input) return out;
	for (const [part, checks] of Object.entries(FIELDS)) {
		const given = object(input[part]);
		if (!given) continue;
		for (const [field, ok] of Object.entries(checks)) {
			if (field in given && ok(given[field])) (out[part] ??= {})[field] = given[field];
		}
	}
	return out as Omit<StylePatch, "styleId">;
}

/** El estilo efectivo de un video: el del template (Arcade sin template), el `styleId` si vale, con los retoques encima. */
export function resolveStyle(templateId: string | null, styleId: string | null, overrides: unknown): Style {
	const fromTemplate = templateId ? getTemplate(templateId)?.style : undefined;
	const base = STYLES[isStyleId(styleId) ? styleId : (fromTemplate ?? "arcade")];
	const patch = parseStylePatch(overrides);
	return {
		...base,
		background: { ...base.background, ...patch.background },
		type: { ...base.type, ...patch.type },
		tempo: { ...base.tempo },
		transitions: { ...base.transitions, ...patch.transitions },
		camera: { ...base.camera, ...patch.camera },
		product: { ...base.product, ...patch.product },
		music: { ...base.music },
	};
}

/** Un tempo dentro del rango del estilo. */
export function clampBpm(style: Style, bpm: number): number {
	return Math.min(style.tempo.max, Math.max(style.tempo.min, Math.round(bpm)));
}

/** El tempo con el que nace un video de este template: el de su estilo. */
export function templateBpm(t: Pick<Template, "style">): number {
	return STYLES[t.style].tempo.bpm;
}
