/**
 * Los datos del motor de animación (spec 2026-11-18, motor de animación §5–§6):
 * qué es un **template** (una lista de momentos), qué bloque usa cada **momento**
 * y qué **parámetros** lleva cada bloque.
 *
 * Un momento se dibuja con uno de seis bloques: `clip` (el clip de IA con texto
 * e imágenes encima, las escenas de siempre), `text` (frases que entran golpe a
 * golpe), `icons` (iconos o logos que vuelan o una lista que pasa), `ui` (una
 * captura real con zoom y cursor), `product` (la foto del producto con
 * movimiento de cámara) y `logo` (el cierre). Pasa al siguiente con una
 * transición: `blur`, `push` o `cut`.
 *
 * `parseBlockParams` es la única puerta de los parámetros: lo que llega de la
 * base, de la API o de Lumen se pasa por aquí, que rellena lo que falte y
 * recorta lo que se pase. Código puro, sin navegador.
 */
import type { ImagesEntrance, ImagesLayout } from "../video/scene-images";
import type { TextPosition } from "../video/compose";

export type BlockKind = "clip" | "text" | "icons" | "ui" | "product" | "logo";
export type Transition = "blur" | "push" | "cut";
export type Language = "en" | "es" | "pt";

export const BLOCKS: readonly BlockKind[] = ["clip", "text", "icons", "ui", "product", "logo"];
export const TRANSITIONS: readonly Transition[] = ["blur", "push", "cut"];

export interface TextParams {
	/** De 1 a 3 grupos de palabras; cada uno entra en su golpe. */
	lines: string[];
	/** Un fondo de color propio (`#rrggbb`); null = el fondo del template. */
	color: string | null;
}

export interface IconsParams {
	variant: "burst" | "list";
	/** El nombre de cada imagen (por su id), para la lista. */
	labels: Record<string, string>;
	/** En la lista, cuántos golpes está cada ítem al centro. */
	every: number;
}

export interface UiParams {
	/** Hacia dónde acerca (0..1 de la captura) y cuánto. */
	zoom: { x: number; y: number; scale: number } | null;
	/** Dónde hace clic el cursor (0..1 de la captura). */
	click: { x: number; y: number } | null;
	/** La imagen que se ve después del clic, si cambia algo. */
	afterImageId: string | null;
}

export interface ProductParams {
	lines: string[];
}

export interface ClipParams {
	text: string;
	textPosition: TextPosition;
	textIn: number;
	textOut: number | null;
	imagesLayout: ImagesLayout;
	imagesEntrance: ImagesEntrance;
}

export interface LogoParams {
	/** La línea opcional del cierre. */
	line: string;
}

export interface BlockParams {
	text: TextParams;
	icons: IconsParams;
	ui: UiParams;
	product: ProductParams;
	clip: ClipParams;
	logo: LogoParams;
}

export type AnyBlockParams = BlockParams[BlockKind];

export interface TemplateMoment {
	key: string;
	block: BlockKind;
	beats: number;
	transition: Transition;
	/** Se puede quitar para que el video quepa en el límite del plan. */
	optional: boolean;
	slots: { lines?: { max: number; wordsPerLine: number }; images?: { min: number; max: number } };
	/** Lo que lleva al crear el video, por idioma. */
	sample: Partial<Record<Language, Partial<AnyBlockParams>>>;
}

export interface Template {
	id: string;
	kinds: ("product" | "platform" | "other")[];
	defaultBpm: number;
	/** Si sus momentos llevan voz en off. */
	voice: boolean;
	background: "sky";
	moments: TemplateMoment[];
}

export const MAX_LINES = 3;
export const MAX_LINE = 60;
export const MAX_LABEL = 24;
export const MAX_ICONS = 6;
export const MIN_ICONS = 2;

const obj = (raw: unknown): Record<string, unknown> => (raw && typeof raw === "object" && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {});
const str = (raw: unknown, max: number): string => (typeof raw === "string" ? raw.slice(0, max) : "");
const num = (raw: unknown, fallback: number): number => (typeof raw === "number" && Number.isFinite(raw) ? raw : fallback);
const unit = (raw: unknown, fallback = 0.5): number => Math.min(1, Math.max(0, num(raw, fallback)));
const hex = (raw: unknown): string | null => (typeof raw === "string" && /^#[0-9a-f]{6}$/i.test(raw) ? raw : null);
const lines = (raw: unknown): string[] =>
	(Array.isArray(raw) ? raw : [])
		.filter((l): l is string => typeof l === "string")
		.slice(0, MAX_LINES)
		.map((l) => l.slice(0, MAX_LINE));
const point = (raw: unknown): { x: number; y: number } | null => {
	if (!raw || typeof raw !== "object") return null;
	const p = raw as Record<string, unknown>;
	return { x: unit(p.x), y: unit(p.y) };
};
const oneOf = <T extends string>(raw: unknown, values: readonly T[], fallback: T): T => (values.includes(raw as T) ? (raw as T) : fallback);

export function parseBlockParams<K extends BlockKind>(block: K, raw: unknown): BlockParams[K] {
	const r = obj(raw);
	const out: { [B in BlockKind]: () => BlockParams[B] } = {
		text: () => ({ lines: lines(r.lines), color: hex(r.color) }),
		product: () => ({ lines: lines(r.lines) }),
		logo: () => ({ line: str(r.line, MAX_LINE) }),
		icons: () => {
			const labels: Record<string, string> = {};
			for (const [id, name] of Object.entries(obj(r.labels))) if (typeof name === "string") labels[id] = name.slice(0, MAX_LABEL);
			return { variant: oneOf(r.variant, ["burst", "list"] as const, "burst"), labels, every: Math.min(8, Math.max(1, Math.round(num(r.every, 2)))) };
		},
		ui: () => {
			const z = r.zoom && typeof r.zoom === "object" ? (r.zoom as Record<string, unknown>) : null;
			return {
				zoom: z ? { x: unit(z.x), y: unit(z.y), scale: Math.min(3, Math.max(1, num(z.scale, 1.4))) } : null,
				click: point(r.click),
				afterImageId: typeof r.afterImageId === "string" && r.afterImageId ? r.afterImageId : null,
			};
		},
		clip: () => ({
			text: str(r.text, 200),
			textPosition: oneOf(r.textPosition, ["top", "center", "bottom"] as const, "bottom"),
			textIn: Math.max(0, num(r.textIn, 0)),
			textOut: typeof r.textOut === "number" && Number.isFinite(r.textOut) ? Math.max(0, r.textOut) : null,
			imagesLayout: oneOf(r.imagesLayout, ["grid", "sequence", "center", "corner"] as const, "grid"),
			imagesEntrance: oneOf(r.imagesEntrance, ["none", "fade", "stagger"] as const, "stagger"),
		}),
	};
	return out[block]() as BlockParams[K];
}
