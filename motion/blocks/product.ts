/**
 * Bloque `product` (spec 2026-11-18 §5): la foto real del producto con un
 * movimiento de cámara lento durante todo el momento, con sombra suave; sus
 * frases entran a su lado (horizontal) o debajo (vertical y cuadrado) en los
 * golpes 1 y 2, como las del bloque `text`. La foto es la primera imagen del
 * momento y se ve entera.
 *
 * El movimiento (`move`, spec 2026-11-18-onview-todo-codigo §B6): `in` se
 * acerca (de 1 a 1.06, con un poco de paralaje), `out` se aleja (de 1.08 a 1) y
 * `pan` se desplaza de lado (4 u). Así una misma foto puede salir dos veces sin
 * repetirse. La letra de las frases nunca pasa de 500, como en `text`.
 */
import { gsap } from "gsap";
import { registerBlock } from "../registry";
import type { ProductParams } from "../types";
import { applyTypeStyle, phraseWeight, SCALE } from "../type";
import { fitContain } from "./ui";

/** La parte de lo alto del área que ocupa la foto sobre la base (`plinth`); el resto es la base y su reflejo. */
const PLINTH_ROOM = 0.8;

/** El movimiento lento de la foto; `k` lo amplía (2 con `product.move: "wide"` del estilo). */
const MOVES: Record<ProductParams["move"], (u: number, k: number) => { from: gsap.TweenVars; to: gsap.TweenVars }> = {
	in: (u, k) => ({ from: { scale: 1, x: 0 }, to: { scale: 1 + 0.06 * k, x: -1.5 * u * k } }),
	out: (_u, k) => ({ from: { scale: 1 + 0.08 * k, x: 0 }, to: { scale: 1, x: 0 } }),
	pan: (u, k) => ({ from: { scale: 1.04, x: 2 * u * k }, to: { scale: 1.04, x: -2 * u * k } }),
};

registerBlock("product", (ctx) => {
	const { el, tl, moment, u, orientation, doc: motion } = ctx;
	const params = moment.params as ProductParams;
	const photo = moment.images[0];
	const lines = params.lines.map((l) => l.trim()).filter(Boolean);
	const doc = el.ownerDocument;
	const side = orientation === "landscape";
	const W = motion.width;
	const H = motion.height;
	// La foto ocupa la mitad izquierda (horizontal) o los dos tercios de arriba.
	const area = side ? { x: 0, y: 0, w: lines.length ? W * 0.55 : W, h: H } : { x: 0, y: 0, w: W, h: lines.length ? H * 0.64 : H };

	if (photo) {
		const { frame, move: amount } = ctx.style.product;
		// `bleed`: la foto llena su área (recortada), sin sombra; si no, se ve entera.
		// `plinth`: la foto se apoya en una base; se ajusta a lo alto que queda encima de la base y su reflejo.
		const fitH = frame === "plinth" ? area.h * PLINTH_ROOM : area.h;
		const r = frame === "bleed" ? { x: 0, y: 0, w: area.w, h: area.h } : fitContain(photo.width, photo.height, area.w, fitH, 7 * u);
		const top = area.y + r.y;
		const img = doc.createElement("img");
		img.className = "motion-product";
		img.alt = "";
		img.src = photo.src;
		Object.assign(img.style, {
			position: "absolute",
			left: `${area.x + r.x}px`,
			top: `${top}px`,
			width: `${r.w}px`,
			height: `${r.h}px`,
			objectFit: frame === "bleed" ? "cover" : "contain",
			...(frame === "bleed" ? {} : { filter: `drop-shadow(0 ${1.6 * u}px ${3 * u}px rgba(20, 30, 60, 0.18))` }),
		});
		const pieces: HTMLElement[] = [img];
		if (frame === "plinth") {
			const base = doc.createElement("div");
			base.className = "motion-plinth";
			Object.assign(base.style, { position: "absolute", left: `${area.x + r.x + r.w * 0.08}px`, top: `${top + r.h - r.h * 0.04}px`, width: `${r.w * 0.84}px`, height: `${r.h * 0.1}px`, borderRadius: "50%", background: "radial-gradient(closest-side, rgba(0, 0, 0, 0.45), rgba(0, 0, 0, 0))" });
			const reflection = doc.createElement("img");
			reflection.className = "motion-reflection";
			reflection.alt = "";
			reflection.src = photo.src;
			Object.assign(reflection.style, { position: "absolute", left: `${area.x + r.x}px`, top: `${top + r.h}px`, width: `${r.w}px`, height: `${r.h}px`, objectFit: "contain", transform: "scaleY(-1)", opacity: "0.18", maskImage: "linear-gradient(to top, rgba(0,0,0,0.6), transparent 45%)" });
			el.append(base, reflection);
			pieces.push(base, reflection);
		}
		el.appendChild(img);
		const move = MOVES[params.move ?? "in"](u, amount === "wide" ? 2 : 1);
		gsap.set(pieces, move.from);
		tl.fromTo(pieces, move.from, { ...move.to, duration: moment.seconds, ease: "none", immediateRender: false }, moment.at);
	}

	if (lines.length) {
		const box = doc.createElement("div");
		// Tarea 4: a 6.4 u se veía tímido junto a la foto; medido contra las frases (11.4 u), sin taparla.
		const sizeU = (side ? 8.6 : 9.6) * SCALE[ctx.style.type.scale];
		applyTypeStyle(box, ctx.style.type);
		Object.assign(box.style, side
			? { position: "absolute", left: `${W * 0.55}px`, top: "0px", width: `${W * 0.4}px`, height: `${H}px`, display: "flex", flexDirection: "column", justifyContent: "center", gap: `${1.6 * u}px` }
			: { position: "absolute", left: `${W * 0.1}px`, top: `${H * 0.64}px`, width: `${W * 0.8}px`, height: `${H * 0.3}px`, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: `${1.6 * u}px` });
		const spans = lines.map((line) => {
			const span = doc.createElement("div");
			span.className = "motion-line motion-product-line";
			span.textContent = line;
			Object.assign(span.style, { color: ctx.ink, fontSize: `${sizeU * u}px`, fontFamily: ctx.font(motion.brand.face.family), fontWeight: String(phraseWeight(ctx.style.type, motion.brand.face)), lineHeight: "1.1", whiteSpace: "normal" });
			// El espaciado de siempre de estas frases, salvo que el estilo pida otro (va en la caja).
			if (!box.style.letterSpacing) span.style.letterSpacing = "-0.02em";
			box.appendChild(span);
			return span;
		});
		el.appendChild(box);
		gsap.set(spans, { opacity: 0, y: 2.2 * u, filter: "blur(14px)" });
		spans.forEach((span, i) => tl.fromTo(span, { opacity: 0, y: 2.2 * u, filter: "blur(14px)" }, { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.7, ease: "expo.out", immediateRender: false }, ctx.beat(1 + i)));
	}
});
