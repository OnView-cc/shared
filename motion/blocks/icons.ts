/**
 * Bloque `icons` (spec 2026-11-18 §5), dos variantes:
 *
 * - `burst`: la marca entra en el centro con un rebote en el medio golpe y en
 *   el golpe 1 suelta los iconos, que vuelan a su puesto (0.05 s uno tras otro,
 *   girados ±6°) y luego flotan. La marca es el logo del kit para fondos claros,
 *   tal cual; sin él, el logo de cierre sobre una ficha del color de cierre (ese
 *   logo está elegido para leerse ahí); sin ninguno, el logo de la esquina o el
 *   primer icono en grande.
 * - `list`: filas icono + nombre; la activa al centro, nítida; las vecinas, más
 *   pequeñas, transparentes y desenfocadas. Pasa a la siguiente cada `every`
 *   golpes con `expo.inOut`.
 *
 * Las imágenes se dibujan tal cual, sin fondo debajo: un PNG con transparencia
 * sigue transparente. Los puestos y tamaños van en unidades `u`.
 */
import { gsap } from "gsap";
import { registerBlock } from "../registry";
import type { IconsParams } from "../types";
import { shrinkToFit, type Orientation } from "../layout";

export const ICON_U = 13;
const MARK_U = 36;
const ROW_GAP_U = 15;

/** Los puestos de N iconos alrededor del centro, en `u` (centro = 0, 0): un óvalo que no toca los bordes. */
export function burstPositions(n: number, o: Orientation): [number, number][] {
	const [rx, ry] = o === "landscape" ? [46, 30] : o === "portrait" ? [30, 34] : [30, 30];
	return Array.from({ length: n }, (_, i) => {
		const angle = -Math.PI * 0.82 + (i * 2 * Math.PI) / n;
		const reach = i % 2 ? 0.9 : 1;
		return [Math.round(Math.cos(angle) * rx * reach * 10) / 10, Math.round(Math.sin(angle) * ry * reach * 10) / 10];
	});
}

function burst(ctx: Parameters<Parameters<typeof registerBlock>[1]>[0]) {
	const { el, tl, moment, u, orientation, doc: motion } = ctx;
	const doc = el.ownerDocument;
	const fill = doc.createElement("div");
	fill.className = "motion-fill";
	const center = doc.createElement("div");
	Object.assign(center.style, { position: "relative", width: "0px", height: "0px" });

	const mark = doc.createElement("div");
	mark.className = "motion-mark";
	const markImg = doc.createElement("img");
	markImg.alt = "";
	const size = MARK_U * u;
	Object.assign(mark.style, { position: "absolute", left: `${-size / 2}px`, top: `${-size / 2}px`, width: `${size}px`, height: `${size}px`, display: "grid", placeItems: "center" });
	Object.assign(markImg.style, { maxWidth: "100%", maxHeight: "100%", objectFit: "contain", display: "block" });
	if (motion.brand.lightLogo) {
		// El logo para fondos claros va tal cual, como el símbolo de Arcade.
		markImg.src = motion.brand.lightLogo;
	} else if (motion.brand.closingLogo) {
		markImg.src = motion.brand.closingLogo;
		Object.assign(mark.style, { background: motion.brand.closingColor, borderRadius: `${size * 0.24}px`, padding: `${size * 0.18}px`, boxSizing: "border-box", boxShadow: `0 ${u}px ${3 * u}px rgba(20, 30, 60, 0.18)` });
	} else {
		markImg.src = motion.brand.sceneLogo ?? moment.images[0]?.src ?? "";
	}
	mark.appendChild(markImg);

	const positions = burstPositions(moment.images.length, orientation);
	const icons = moment.images.map((image) => {
		const icon = doc.createElement("div");
		icon.className = "motion-icon";
		const s = ICON_U * u;
		Object.assign(icon.style, { position: "absolute", left: `${-s / 2}px`, top: `${-s / 2}px`, width: `${s}px`, height: `${s}px`, filter: `drop-shadow(0 ${u}px ${1.6 * u}px rgba(30, 40, 70, 0.18))` });
		const img = doc.createElement("img");
		img.alt = "";
		img.src = image.src;
		Object.assign(img.style, { width: "100%", height: "100%", objectFit: "contain", display: "block" });
		icon.appendChild(img);
		center.appendChild(icon);
		return icon;
	});
	center.appendChild(mark);
	fill.appendChild(center);
	el.appendChild(fill);

	// Nada nace de la nada: la marca entra desde la mitad, desenfocada.
	gsap.set(mark, { scale: 0.5, opacity: 0, filter: "blur(10px)" });
	tl.fromTo(mark, { scale: 0.5, opacity: 0, filter: "blur(10px)" }, { scale: 1, opacity: 1, filter: "blur(0px)", duration: 0.6, ease: "back.out(1.6)", immediateRender: false }, ctx.beat(0.5));
	tl.to(mark, { scale: 1.06, duration: Math.max(0.1, moment.seconds - ctx.beatSeconds - 0.6), ease: "sine.inOut", immediateRender: false }, ctx.beat(1) + 0.6);
	gsap.set(icons, { x: 0, y: 0, scale: 0.2, opacity: 0, rotation: 0 });
	icons.forEach((icon, i) => {
		const [x, y] = positions[i]!;
		const start = ctx.beat(1) + i * 0.05;
		tl.fromTo(icon, { x: 0, y: 0, scale: 0.2, opacity: 0, rotation: 0 }, { x: x * u, y: y * u, scale: 1, opacity: 1, rotation: i % 2 ? 6 : -6, duration: 0.9, ease: "back.out(1.4)", immediateRender: false }, start);
		const drift = Math.max(0.1, moment.at + moment.seconds - (start + 0.9));
		tl.to(icon, { y: (y + (i % 2 ? -1.4 : 1.4)) * u, rotation: 0, duration: drift, ease: "sine.inOut", immediateRender: false }, start + 0.9);
	});
}

function list(ctx: Parameters<Parameters<typeof registerBlock>[1]>[0], params: IconsParams) {
	const { el, tl, moment, u, orientation, doc: motion } = ctx;
	const doc = el.ownerDocument;
	const portrait = orientation === "portrait";
	const fontU = portrait ? 11 : 10.5;
	const iconU = 12;
	const halfW = (motion.width / Math.min(motion.width, motion.height)) * 50;
	const listX = portrait ? -38 : Math.max(-62, -halfW + 14);

	const anchor = doc.createElement("div");
	Object.assign(anchor.style, { position: "absolute", left: "50%", top: "50%", transform: `translateX(${listX * u}px)` });
	const column = doc.createElement("div");
	column.style.position = "absolute";
	const rows = moment.images.map((image, i) => {
		const row = doc.createElement("div");
		row.className = "motion-row";
		Object.assign(row.style, {
			position: "absolute",
			left: "0px",
			top: `${(i * ROW_GAP_U - iconU / 2) * u}px`,
			display: "flex",
			alignItems: "center",
			gap: `${2.4 * u}px`,
			fontSize: `${fontU * u}px`,
			fontFamily: ctx.font(motion.brand.face.family),
			fontWeight: String(motion.brand.face.weight),
			letterSpacing: "-0.02em",
			whiteSpace: "nowrap",
			color: ctx.ink,
			transformOrigin: "left center",
			height: `${iconU * u}px`,
		});
		const img = doc.createElement("img");
		img.alt = "";
		img.src = image.src;
		Object.assign(img.style, { width: `${iconU * u}px`, height: `${iconU * u}px`, objectFit: "contain", display: "block", flex: "none" });
		const name = doc.createElement("span");
		name.textContent = params.labels[image.id] ?? "";
		row.append(img, name);
		// El nombre cabe hasta 6 u del borde derecho; si no, baja (hasta la mitad de su tamaño).
		const room = motion.width / 2 + listX * u + (iconU + 2.4) * u;
		ctx.onReady(() => void shrinkToFit(row, [name], motion.width - room - 6 * u, (fontU / 2) * u));
		column.appendChild(row);
		return row;
	});
	anchor.appendChild(column);
	el.appendChild(anchor);

	const state = (active: number, i: number) => {
		const d = Math.abs(i - active);
		return { opacity: d === 0 ? 1 : d === 1 ? 0.38 : d === 2 ? 0.12 : 0, scale: d === 0 ? 1 : 0.86, filter: `blur(${d === 0 ? 0 : d * 0.15 * u}px)` };
	};
	gsap.set(column, { y: 0 });
	rows.forEach((row, i) => gsap.set(row, state(0, i)));
	const every = params.every;
	for (let k = 1; k < rows.length; k++) {
		const at = ctx.beat(k * every) - 0.31;
		if (at >= moment.at + moment.seconds) break;
		tl.to(column, { y: -k * ROW_GAP_U * u, duration: 0.62, ease: "expo.inOut", immediateRender: false }, at);
		rows.forEach((row, i) => tl.to(row, { ...state(k, i), duration: 0.62, ease: "expo.inOut", immediateRender: false }, at));
	}
}

registerBlock("icons", (ctx) => {
	const params = ctx.moment.params as IconsParams;
	if (params.variant === "list") list(ctx, params);
	else burst(ctx);
});
