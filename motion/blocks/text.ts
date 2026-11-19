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
import { contrast, DARK_INK, mix, SKY_BASE } from "../background";
import { shrinkToFit, TEXT_MIN_U, textLayout } from "../layout";
import { gsap } from "gsap";
import { registerBlock } from "../registry";
import type { TextParams } from "../types";
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

registerBlock("text", (ctx) => {
	const { el, tl, moment, u, orientation } = ctx;
	const params = moment.params as TextParams;
	const groups = params.lines
		.flatMap((l) => l.split("\n"))
		.map((l) => l.trim())
		.filter(Boolean);
	const layout = textLayout(groups, orientation);
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
		fontWeight: String(Math.min(ctx.doc.brand.face.weight, PHRASE_MAX_WEIGHT)),
		whiteSpace: layout.wrap ? "normal" : "nowrap",
	});
	const words: HTMLElement[][] = [];
	const spans = groups.map((g, i) => {
		const span = doc.createElement("span");
		span.className = "motion-line";
		const mine: HTMLElement[] = [];
		g.split(/\s+/).forEach((w, j) => {
			if (j > 0) span.appendChild(doc.createTextNode(" "));
			const word = doc.createElement("span");
			word.className = "motion-word";
			word.textContent = w;
			span.appendChild(word);
			mine.push(word);
		});
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
	const grey = mix(ink, params.color ?? SKY_BASE, WORD_GREY);
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
