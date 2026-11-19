/**
 * Bloque `logo`, el cierre (spec 2026-11-18 §5): el logo entra con un rebote
 * (`back.out`) en el medio golpe y, si hay línea, ésta sube debajo en el golpe
 * 1.5. El logo cabe en el 40 % del ancho y el 22 % del alto.
 *
 * Con logo para fondos claros en el kit, el cierre se queda sobre el cielo del
 * template, con ese logo y la tinta del cielo (tarea 0b del plan
 * 2026-11-18-onview-todo-codigo: como Arcade, sin saltar a un fondo de color al
 * final). Sin él, como antes: el color de cierre del kit con su logo de cierre;
 * sin logo de cierre, sólo la línea.
 */
import { gsap } from "gsap";
import { registerBlock } from "../registry";
import type { LogoParams } from "../types";
import { readableOn } from "./text";

registerBlock("logo", (ctx) => {
	const { el, tl, moment, u, doc: motion } = ctx;
	const params = moment.params as LogoParams;
	const onSky = Boolean(motion.brand.lightLogo);
	const bg = motion.brand.closingColor;
	if (!onSky) el.style.background = bg;
	const ink = onSky ? ctx.ink : readableOn(bg);
	const logo = onSky ? motion.brand.lightLogo : motion.brand.closingLogo;
	const doc = el.ownerDocument;
	const fill = doc.createElement("div");
	fill.className = "motion-fill";
	const column = doc.createElement("div");
	Object.assign(column.style, { display: "flex", flexDirection: "column", alignItems: "center", gap: `${3 * u}px` });

	const parts: HTMLElement[] = [];
	if (logo) {
		const img = doc.createElement("img");
		img.className = "motion-logo";
		img.alt = "";
		img.src = logo;
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
			color: ink,
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
