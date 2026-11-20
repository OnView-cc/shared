/**
 * Bloque `text` (spec 2026-11-18 §5; pulido de la tarea 0b del plan
 * 2026-11-18-onview-todo-codigo, medido contra el video de Arcade): una frase
 * que entra por grupos de palabras, uno por golpe empezando en el golpe 0 (el
 * primero entra durante la transición, así nunca queda el fondo solo), cada
 * grupo desde un poco más abajo y desenfocado. Dentro del grupo, cada palabra
 * aparece en su sitio una tras otra, en gris, y pasa a la tinta. Un salto de
 * línea dentro de un grupo lo parte en dos. La frase nunca va más gruesa que
 * 500, aunque el kit pida una letra más negra: en grande, la negrita aprieta.
 * Sale con la transición del momento. El tamaño y los cortes de línea los decide
 * `textLayout` según el formato.
 *
 * Si el momento lleva imágenes de escena (las tarjetas de antes), las coloca
 * con su disposición y su entrada, dejando libre la franja del texto.
 *
 * Sobre el fondo del template escribe con la tinta del fondo (`ctx.ink`); con
 * un color propio (`params.color`), rellena la capa y elige blanco o negro, el
 * que se lea.
 */
import { contrast, DARK_INK, mix } from "../background";
import { shrinkToFit, TEXT_MIN_U, textLayout } from "../layout";
import { gsap } from "gsap";
import { registerBlock } from "../registry";
import type { Style } from "../styles";
import type { TextParams } from "../types";
import type { Face } from "../../video/compose";
import { drawSceneImages } from "./scene-images";

/** Cuándo entra cada grupo: en los golpes 0, 1, 2…; en un momento corto, más juntos. */
export function entryBeats(groups: number, beats: number): number[] {
	if (groups === 0) return [];
	const step = Math.min(1, Math.max(0.25, (beats - 1) / groups));
	return Array.from({ length: groups }, (_, i) => step * i);
}

/** El peso más grueso de una frase grande. */
export const PHRASE_MAX_WEIGHT = 500;
/** Cuánto se separan las palabras de un grupo al entrar, en segundos. */
const WORD_STAGGER = 0.1;
/** De qué gris parte cada palabra: la tinta llevada hacia el fondo. */
const WORD_GREY = 0.55;

/** Blanco o tinta oscura, el que más se lea sobre `bg`. */
export const readableOn = (bg: string) => (contrast("#ffffff", bg) >= contrast(DARK_INK, bg) ? "#ffffff" : DARK_INK);

/* ── La letra del estilo (spec 2026-11-19-onview-estilos-y-referencias §5.2) ── */

/** Cuánto crece la letra en cada escala del estilo: `m` es la de siempre. */
export const SCALE: Record<Style["type"]["scale"], number> = { s: 0.55, m: 1, l: 1.25, xl: 1.7 };
/** El espaciado de siempre (el de `.motion-text`): con él no se escribe nada en línea. */
const BASE_TRACKING = -0.025;

/** El peso que tiene la letra más cercano al pedido; en un empate, el más fino. Sin lista, el pedido. */
export function nearestWeight(want: number, weights?: number[]): number {
	if (!weights?.length) return want;
	return [...weights].sort((a, b) => Math.abs(a - want) - Math.abs(b - want) || a - b)[0]!;
}

/** El peso de las frases: Arcade, el del kit hasta 500 (como siempre); un número, el del estilo que tenga la letra. */
export function phraseWeight(type: Pick<Style["type"], "weight">, face: Face): number {
	return type.weight === "kit-500" ? Math.min(face.weight, PHRASE_MAX_WEIGHT) : nearestWeight(type.weight, face.weights);
}

/** Pone en `box` lo que el estilo dice de la letra: mayúsculas y espaciado (sólo si cambian algo). */
export function applyTypeStyle(box: HTMLElement, type: Style["type"]): void {
	if (type.case === "upper") box.style.textTransform = "uppercase";
	if (type.tracking !== BASE_TRACKING) box.style.letterSpacing = `${type.tracking}em`;
}

/** Dónde va la frase en el cuadro: en el centro (lo de siempre), en la esquina de abajo a la izquierda o en el tercio de abajo. */
function place(fill: HTMLElement, text: HTMLElement, where: Style["type"]["place"], u: number): void {
	if (where === "corner") {
		Object.assign(fill.style, { placeItems: "end start", padding: `${7 * u}px` });
		text.style.textAlign = "left";
	} else if (where === "lower") {
		Object.assign(fill.style, { placeItems: "end center", paddingBottom: `${14 * u}px` });
	}
}

/** Las palabras de una frase que entra palabra a palabra con `fade`, separadas tanto. */
const FADE_STAGGER = 0.18;
/** Lo que tarda cada letra en `type`. */
const TYPE_STEP = 0.03;

/**
 * Las entradas que no son la de Arcade (`groups`):
 * - `slam`: cada grupo entra de golpe en su golpe, de 1.15 a 1 en 0.12 s.
 * - `rise`: cada grupo sube desde debajo de su línea en medio golpe.
 * - `fade`: palabra a palabra, de 0 a 1 en 0.6 s, separadas 0.18 s.
 * - `type`: letra a letra, 0.03 s cada una.
 */
function enter(
	entry: Exclude<Style["type"]["entry"], "groups">,
	o: { spans: HTMLElement[]; words: HTMLElement[][]; risers: HTMLElement[]; letters: HTMLElement[][]; at: number[]; beatSeconds: number; tl: gsap.core.Timeline },
): void {
	const { tl, spans } = o;
	const off = { immediateRender: false } as const;
	if (entry === "slam") {
		gsap.set(spans, { opacity: 0, scale: 1.15 });
		spans.forEach((span, i) => tl.fromTo(span, { opacity: 0, scale: 1.15 }, { opacity: 1, scale: 1, duration: 0.12, ease: "power4.out", ...off }, o.at[i]!));
		return;
	}
	if (entry === "rise") {
		gsap.set(o.risers, { yPercent: 105 });
		o.risers.forEach((r, i) => tl.fromTo(r, { yPercent: 105 }, { yPercent: 0, duration: o.beatSeconds / 2, ease: "expo.out", ...off }, o.at[i]!));
		return;
	}
	if (entry === "fade") {
		const all = o.words.flat();
		gsap.set(all, { opacity: 0 });
		o.words.forEach((group, i) => group.forEach((w, j) => tl.fromTo(w, { opacity: 0 }, { opacity: 1, duration: 0.6, ease: "sine.inOut", ...off }, o.at[i]! + j * FADE_STAGGER)));
		return;
	}
	gsap.set(o.letters.flat(), { opacity: 0 });
	o.letters.forEach((group, i) => group.forEach((l, j) => tl.fromTo(l, { opacity: 0 }, { opacity: 1, duration: 0.01, ease: "none", ...off }, o.at[i]! + j * TYPE_STEP)));
}

registerBlock("text", (ctx) => {
	const { el, tl, moment, u, orientation } = ctx;
	const type = ctx.style.type;
	const params = moment.params as TextParams;
	const groups = params.lines
		.flatMap((l) => l.split("\n"))
		.map((l) => l.trim())
		.filter(Boolean);
	const layout = textLayout(groups, orientation, SCALE[type.scale], type.place);
	const ink = params.color ? readableOn(params.color) : ctx.ink;
	if (params.color) el.style.background = params.color;

	const doc = el.ownerDocument;
	const fill = doc.createElement("div");
	fill.className = "motion-fill";
	const text = doc.createElement("div");
	text.className = "motion-text";
	Object.assign(text.style, {
		position: "relative",
		fontSize: `${layout.sizeU * u}px`,
		maxWidth: `${layout.widthPct}%`,
		color: ink,
		fontFamily: ctx.font(ctx.doc.brand.face.family),
		fontWeight: String(phraseWeight(type, ctx.doc.brand.face)),
		whiteSpace: layout.wrap ? "normal" : "nowrap",
	});
	applyTypeStyle(text, type);
	place(fill, text, type.place, u);
	const words: HTMLElement[][] = [];
	const risers: HTMLElement[] = [];
	const letters: HTMLElement[][] = [];
	const spans = groups.map((g, i) => {
		const span = doc.createElement("span");
		span.className = "motion-line";
		// `rise`: el grupo sube dentro de su línea, que lo recorta (la máscara).
		let into: HTMLElement = span;
		if (type.entry === "rise") {
			into = doc.createElement("span");
			into.className = "motion-rise";
			Object.assign(into.style, { display: "inline-block" });
			Object.assign(span.style, { overflow: "hidden", verticalAlign: "bottom" });
			span.appendChild(into);
			risers.push(into);
		}
		const mine: HTMLElement[] = [];
		const chars: HTMLElement[] = [];
		g.split(/\s+/).forEach((w, j) => {
			if (j > 0) into.appendChild(doc.createTextNode(" "));
			const word = doc.createElement("span");
			word.className = "motion-word";
			if (type.entry === "type") {
				for (const ch of w) {
					const letter = doc.createElement("span");
					letter.className = "motion-letter";
					letter.textContent = ch;
					word.appendChild(letter);
					chars.push(letter);
				}
			} else word.textContent = w;
			into.appendChild(word);
			mine.push(word);
		});
		letters.push(chars);
		words.push(mine);
		// Si el tamaño ya está en el mínimo, un grupo largo se puede partir por dentro.
		if (layout.breakGroups || layout.sizeU <= TEXT_MIN_U) span.style.whiteSpace = "normal";
		text.appendChild(span);
		if (i < groups.length - 1) text.appendChild(doc.createTextNode(" "));
		return span;
	});
	fill.appendChild(text);
	// Con las fuentes ya cargadas: si un grupo no cabe en su ancho, la frase entera baja (y a 6 u se parte por dentro).
	// Un grupo que ya se parte entre palabras no encoge: el ancho lo resuelve el salto de línea.
	if (!layout.breakGroups)
		ctx.onReady(() => {
			const next = shrinkToFit(text, spans, (layout.widthPct / 100) * ctx.doc.width, TEXT_MIN_U * u);
			if (next !== null && next <= TEXT_MIN_U * u + 0.01) for (const s of spans) s.style.whiteSpace = "normal";
		});
	// Las imágenes de la escena (las tarjetas de antes con logos), bajo el texto; dejan libre su franja.
	if (moment.images.length) drawSceneImages(ctx, params.imagesLayout ?? "grid", params.imagesEntrance ?? "stagger", groups.length ? "center" : null);
	el.appendChild(fill);

	const beats = moment.seconds / ctx.beatSeconds;
	const at = entryBeats(spans.length, beats);
	const grey = mix(ink, params.color ?? ctx.background.color, WORD_GREY);
	if (type.entry !== "groups") {
		enter(type.entry, { spans, words, risers, letters, at: at.map((b) => ctx.beat(b)), beatSeconds: ctx.beatSeconds, tl });
		return;
	}
	gsap.set(spans, { opacity: 0, y: 2.2 * u, filter: "blur(14px)" });
	spans.forEach((span, i) => {
		const start = ctx.beat(at[i]!);
		tl.fromTo(span, { opacity: 0, y: 2.2 * u, filter: "blur(14px)" }, { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.7, ease: "expo.out", immediateRender: false }, start);
		// Cada palabra aparece en su sitio, en gris, y pasa a la tinta (lo de «conocen.» en Arcade).
		words[i]!.forEach((word, j) => {
			gsap.set(word, { opacity: 0, color: grey });
			tl.fromTo(word, { opacity: 0 }, { opacity: 1, duration: 0.25, ease: "power1.out", immediateRender: false }, start + j * WORD_STAGGER);
			tl.fromTo(word, { color: grey }, { color: ink, duration: 0.6, ease: "power1.inOut", immediateRender: false }, start + j * WORD_STAGGER + 0.15);
		});
	});
});
