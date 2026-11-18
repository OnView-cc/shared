/**
 * Bloque `ui` (spec 2026-11-18 §5): una captura real de la interfaz, grande,
 * que entra con profundidad (de 0.92 a 1, con sombra suave) en el golpe 0. Si
 * hay `zoom`, se acerca hacia ese punto entre los golpes 1 y 3. Si hay `click`,
 * un cursor llega desde fuera al punto entre los golpes 3 y 4.5, pulsa en el
 * golpe 5 y, si hay `afterImageId`, la captura cambia a esa imagen con un
 * fundido de 0.25 s en el clic. La captura cabe entera con un margen de 8 u.
 *
 * El cursor vive dentro de la captura, así sigue al zoom. Es un dibujo propio,
 * sin marcas de ningún sistema.
 */
import { gsap } from "gsap";
import { registerBlock } from "../registry";
import type { UiParams } from "../types";

const CURSOR_SVG =
	'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M4 2.5 L4 19.5 L8.6 15.3 L11.6 21.6 L14.6 20.2 L11.7 14 L18 14 Z" fill="#111317" stroke="#ffffff" stroke-width="1.5" stroke-linejoin="round"/></svg>';
const CURSOR_SRC = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(CURSOR_SVG)}`;

/** Una imagen de `iw × ih` metida entera en el cuadro `W × H` con un margen, centrada. */
export function fitContain(iw: number, ih: number, W: number, H: number, margin: number): { x: number; y: number; w: number; h: number } {
	const bw = Math.max(1, W - 2 * margin);
	const bh = Math.max(1, H - 2 * margin);
	const scale = Math.min(bw / Math.max(1, iw), bh / Math.max(1, ih));
	const w = iw * scale;
	const h = ih * scale;
	return { x: (W - w) / 2, y: (H - h) / 2, w, h };
}

registerBlock("ui", (ctx) => {
	const { el, tl, moment, u, doc: motion } = ctx;
	const params = moment.params as UiParams;
	const main = moment.images.find((i) => i.id !== params.afterImageId) ?? moment.images[0];
	if (!main) return;
	const after = params.afterImageId ? moment.images.find((i) => i.id === params.afterImageId) : undefined;
	const doc = el.ownerDocument;
	const r = fitContain(main.width, main.height, motion.width, motion.height, 8 * u);

	const shot = doc.createElement("div");
	shot.className = "motion-shot";
	Object.assign(shot.style, {
		position: "absolute",
		left: `${r.x}px`,
		top: `${r.y}px`,
		width: `${r.w}px`,
		height: `${r.h}px`,
		borderRadius: `${1.6 * u}px`,
		boxShadow: `0 ${2 * u}px ${6 * u}px rgba(20, 30, 60, 0.16), 0 ${0.3 * u}px ${u}px rgba(20, 30, 60, 0.08)`,
		overflow: "hidden",
	});
	const picture = (src: string) => {
		const img = doc.createElement("img");
		img.alt = "";
		img.src = src;
		Object.assign(img.style, { position: "absolute", inset: "0", width: "100%", height: "100%", objectFit: "contain", display: "block" });
		return img;
	};
	shot.appendChild(picture(main.src));
	let afterImg: HTMLImageElement | null = null;
	if (after) {
		afterImg = picture(after.src);
		afterImg.dataset.after = "1";
		shot.appendChild(afterImg);
	}
	// El cursor va fuera del recorte de la captura pero dentro de lo que se acerca.
	const zoomBox = doc.createElement("div");
	Object.assign(zoomBox.style, { position: "absolute", left: `${r.x}px`, top: `${r.y}px`, width: `${r.w}px`, height: `${r.h}px` });
	shot.style.left = "0px";
	shot.style.top = "0px";
	zoomBox.appendChild(shot);
	el.appendChild(zoomBox);

	gsap.set(zoomBox, { scale: 0.92, opacity: 0 });
	tl.fromTo(zoomBox, { scale: 0.92, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.8, ease: "expo.out", immediateRender: false }, ctx.beat(0));
	if (params.zoom) {
		const origin = `${params.zoom.x * r.w}px ${params.zoom.y * r.h}px`;
		gsap.set(zoomBox, { transformOrigin: origin });
		tl.to(zoomBox, { scale: params.zoom.scale, duration: 2 * ctx.beatSeconds, ease: "power2.inOut", immediateRender: false }, ctx.beat(1));
	}
	if (params.click) {
		const cursor = doc.createElement("img");
		cursor.className = "motion-cursor";
		cursor.alt = "";
		cursor.src = CURSOR_SRC;
		const size = 4.4 * u;
		Object.assign(cursor.style, { position: "absolute", left: "0px", top: "0px", width: `${size}px`, height: `${size}px`, transformOrigin: "0 0", filter: `drop-shadow(0 ${0.3 * u}px ${0.6 * u}px rgba(0,0,0,0.25))` });
		zoomBox.appendChild(cursor);
		const to = { x: params.click.x * r.w, y: params.click.y * r.h };
		const from = { x: r.w * 1.08, y: r.h * 1.12 };
		gsap.set(cursor, { ...from, opacity: 0, scale: 1 });
		tl.fromTo(cursor, { ...from, opacity: 0 }, { ...to, opacity: 1, duration: 1.5 * ctx.beatSeconds, ease: "power3.inOut", immediateRender: false }, ctx.beat(3));
		tl.to(cursor, { scale: 0.86, duration: 0.08, ease: "power1.out", immediateRender: false }, ctx.beat(5));
		tl.to(cursor, { scale: 1, duration: 0.16, ease: "power1.out", immediateRender: false }, ctx.beat(5) + 0.08);
	}
	if (afterImg) {
		gsap.set(afterImg, { opacity: 0 });
		tl.fromTo(afterImg, { opacity: 0 }, { opacity: 1, duration: 0.25, ease: "power1.out", immediateRender: false }, ctx.beat(5));
	}
});
