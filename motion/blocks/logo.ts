/**
 * Bloque `logo`, el cierre (spec 2026-11-18 §5): sobre el color de cierre del
 * kit, su logo de cierre entra con un rebote (`back.out`) en el medio golpe y,
 * si hay línea, ésta sube debajo en el golpe 1.5. Sin logo de cierre en el kit,
 * sólo la línea. El logo cabe en el 40 % del ancho y el 22 % del alto.
 */
import { gsap } from "gsap";
import { registerBlock } from "../registry";
import type { LogoParams } from "../types";
import { readableOn } from "./text";

registerBlock("logo", (ctx) => {
	const { el, tl, moment, u, doc: motion } = ctx;
	const params = moment.params as LogoParams;
	const bg = motion.brand.closingColor;
	el.style.background = bg;
	const doc = el.ownerDocument;
	const fill = doc.createElement("div");
	fill.className = "motion-fill";
	const column = doc.createElement("div");
	Object.assign(column.style, { display: "flex", flexDirection: "column", alignItems: "center", gap: `${3 * u}px` });

	const parts: HTMLElement[] = [];
	if (motion.brand.closingLogo) {
		const img = doc.createElement("img");
		img.className = "motion-logo";
		img.alt = "";
		img.src = motion.brand.closingLogo;
		Object.assign(img.style, { display: "block", maxWidth: `${motion.width * 0.4}px`, maxHeight: `${motion.height * 0.22}px`, objectFit: "contain" });
		column.appendChild(img);
		gsap.set(img, { opacity: 0, scale: 0.6 });
		tl.fromTo(img, { opacity: 0, scale: 0.6 }, { opacity: 1, scale: 1, duration: 0.6, ease: "back.out(1.8)", immediateRender: false }, ctx.beat(0.5));
		parts.push(img);
	}
	const line = params.line.trim();
	if (line) {
		const span = doc.createElement("div");
		span.className = "motion-line";
		span.textContent = line;
		Object.assign(span.style, {
			color: readableOn(bg),
			fontSize: `${4.4 * u}px`,
			fontFamily: ctx.font(motion.brand.secondary.family),
			fontWeight: String(motion.brand.secondary.weight),
			letterSpacing: "-0.01em",
			textAlign: "center",
			maxWidth: `${motion.width * 0.8}px`,
			whiteSpace: "normal",
		});
		column.appendChild(span);
		const at = parts.length ? ctx.beat(1.5) : ctx.beat(0.5);
		gsap.set(span, { opacity: 0, y: 2 * u });
		tl.fromTo(span, { opacity: 0, y: 2 * u }, { opacity: 1, y: 0, duration: 0.6, ease: "expo.out", immediateRender: false }, at);
	}
	fill.appendChild(column);
	el.appendChild(fill);
});
