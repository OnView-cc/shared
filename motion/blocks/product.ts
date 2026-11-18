/**
 * Bloque `product` (spec 2026-11-18 §5): la foto real del producto con un
 * acercamiento lento (de 1 a 1.06) y un poco de paralaje (1.5 u) durante todo
 * el momento, con sombra suave; sus frases entran a su lado (horizontal) o
 * debajo (vertical y cuadrado) en los golpes 1 y 2, como las del bloque `text`.
 * La foto es la primera imagen del momento y se ve entera.
 */
import { gsap } from "gsap";
import { registerBlock } from "../registry";
import type { ProductParams } from "../types";
import { fitContain } from "./ui";

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
		const r = fitContain(photo.width, photo.height, area.w, area.h, 7 * u);
		const img = doc.createElement("img");
		img.className = "motion-product";
		img.alt = "";
		img.src = photo.src;
		Object.assign(img.style, { position: "absolute", left: `${area.x + r.x}px`, top: `${area.y + r.y}px`, width: `${r.w}px`, height: `${r.h}px`, objectFit: "contain", filter: `drop-shadow(0 ${1.6 * u}px ${3 * u}px rgba(20, 30, 60, 0.18))` });
		el.appendChild(img);
		gsap.set(img, { scale: 1, x: 0 });
		tl.fromTo(img, { scale: 1, x: 0 }, { scale: 1.06, x: -1.5 * u, duration: moment.seconds, ease: "none", immediateRender: false }, moment.at);
	}

	if (lines.length) {
		const box = doc.createElement("div");
		const sizeU = side ? 6.4 : 7.6;
		Object.assign(box.style, side
			? { position: "absolute", left: `${W * 0.55}px`, top: "0px", width: `${W * 0.4}px`, height: `${H}px`, display: "flex", flexDirection: "column", justifyContent: "center", gap: `${1.6 * u}px` }
			: { position: "absolute", left: `${W * 0.1}px`, top: `${H * 0.64}px`, width: `${W * 0.8}px`, height: `${H * 0.3}px`, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: `${1.6 * u}px` });
		const spans = lines.map((line) => {
			const span = doc.createElement("div");
			span.className = "motion-line";
			span.textContent = line;
			Object.assign(span.style, { color: ctx.ink, fontSize: `${sizeU * u}px`, fontFamily: ctx.font(motion.brand.face.family), fontWeight: String(motion.brand.face.weight), letterSpacing: "-0.02em", lineHeight: "1.1", whiteSpace: "normal" });
			box.appendChild(span);
			return span;
		});
		el.appendChild(box);
		gsap.set(spans, { opacity: 0, y: 2.2 * u, filter: "blur(14px)" });
		spans.forEach((span, i) => tl.fromTo(span, { opacity: 0, y: 2.2 * u, filter: "blur(14px)" }, { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.7, ease: "expo.out", immediateRender: false }, ctx.beat(1 + i)));
	}
});
