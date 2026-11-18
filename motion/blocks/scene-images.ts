/**
 * Las imágenes de escena dentro de un bloque (imágenes de escena, spec
 * 2026-11-17; motor, spec 2026-11-18): colocadas y animadas con la misma regla
 * de siempre (`placeImages`), sin fondo debajo (un PNG transparente sigue
 * transparente). Las usan el bloque `clip` y el bloque `text` (las tarjetas de
 * antes, que pueden llevar logos en rejilla).
 */
import { gsap } from "gsap";
import type { TextPosition } from "../../video/compose";
import { placeImages, type ImagesEntrance, type ImagesLayout } from "../../video/scene-images";
import type { BlockCtx } from "../registry";

export function drawSceneImages(ctx: BlockCtx, layout: ImagesLayout, entrance: ImagesEntrance, textPosition: TextPosition | null): void {
	const { el, tl, moment, doc: motion } = ctx;
	const W = motion.width;
	const H = motion.height;
	const short = Math.min(W, H);
	const placed = placeImages({ layout, entrance, images: moment.images, format: motion.format, seconds: moment.seconds, textPosition });
	for (const p of placed) {
		const image = moment.images[p.index]!;
		const img = el.ownerDocument.createElement("img");
		img.className = "motion-img motion-sceneimg";
		img.alt = "";
		img.src = image.src;
		Object.assign(img.style, { left: `${p.x * W}px`, top: `${p.y * H}px`, width: `${p.w * W}px`, height: `${p.h * H}px` });
		el.appendChild(img);
		gsap.set(img, { opacity: 0, y: 0 });
		const from = moment.at + p.from;
		if (p.fade > 0) tl.fromTo(img, { opacity: 0, y: p.rise * short }, { opacity: 1, y: 0, duration: p.fade, ease: "power2.out", immediateRender: false }, from);
		else if (p.from <= 1e-6) gsap.set(img, { opacity: 1 });
		else tl.set(img, { opacity: 1 }, from);
		if (p.to < moment.seconds - 1e-6) tl.set(img, { opacity: 0 }, moment.at + p.to);
	}
}
