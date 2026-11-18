/**
 * Bloque `text` (spec 2026-11-18 §5): una frase que entra por grupos de
 * palabras, uno por golpe (golpes 1, 2 y 3 del momento), cada uno desde un poco
 * más abajo, transparente y desenfocado, con `expo.out` en 0.7 s. Sale con la
 * transición del momento. El tamaño y los cortes de línea los decide
 * `textLayout` según el formato.
 *
 * Sobre el fondo del template escribe con la tinta del fondo (`ctx.ink`); con
 * un color propio (`params.color`), rellena la capa y elige blanco o negro, el
 * que se lea.
 */
import { contrast, DARK_INK } from "../background";
import { textLayout } from "../layout";
import { gsap } from "gsap";
import { registerBlock } from "../registry";
import type { TextParams } from "../types";

/** Cuándo entra cada grupo: en los golpes 1, 2, 3…; en un momento corto, más juntos. */
export function entryBeats(groups: number, beats: number): number[] {
	if (groups === 0) return [];
	const step = Math.min(1, Math.max(0.25, (beats - 1) / groups));
	return Array.from({ length: groups }, (_, i) => step * (i + 1));
}

/** Blanco o tinta oscura, el que más se lea sobre `bg`. */
export const readableOn = (bg: string) => (contrast("#ffffff", bg) >= contrast(DARK_INK, bg) ? "#ffffff" : DARK_INK);

registerBlock("text", (ctx) => {
	const { el, tl, moment, u, orientation } = ctx;
	const params = moment.params as TextParams;
	const groups = params.lines.map((l) => l.trim()).filter(Boolean);
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
		fontWeight: String(ctx.doc.brand.face.weight),
		whiteSpace: layout.wrap ? "normal" : "nowrap",
	});
	const spans = groups.map((g, i) => {
		const span = doc.createElement("span");
		span.className = "motion-line";
		span.textContent = g;
		// Si el tamaño ya está en el mínimo, un grupo largo se puede partir por dentro.
		if (layout.sizeU <= 6) span.style.whiteSpace = "normal";
		text.appendChild(span);
		if (i < groups.length - 1) text.appendChild(doc.createTextNode(" "));
		return span;
	});
	fill.appendChild(text);
	el.appendChild(fill);

	const beats = moment.seconds / ctx.beatSeconds;
	const at = entryBeats(spans.length, beats);
	gsap.set(spans, { opacity: 0, y: 2.2 * u, filter: "blur(14px)" });
	spans.forEach((span, i) => {
		tl.fromTo(span, { opacity: 0, y: 2.2 * u, filter: "blur(14px)" }, { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.7, ease: "expo.out", immediateRender: false }, ctx.beat(at[i]!));
	});
});
