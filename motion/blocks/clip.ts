/**
 * Bloque `clip` (spec 2026-11-18 §5): las escenas de siempre. El clip de IA de
 * fondo, «cubriendo» el cuadro; encima, su texto y sus imágenes de escena
 * colocadas con `placeImages`, y el logo de la esquina. Se ve como antes del
 * motor (mismas fracciones de `compose.ts`).
 *
 * - En la vista previa, un `<video>` mudo que sigue al reloj: avanza solo
 *   mientras el reloj avanza y se recoloca si se desvía más de 0.3 s.
 * - En la exportación, un `<img>` que muestra el cuadro que toca del clip ya
 *   extraído a imágenes (`media.framesOf`), así cada `seek` da su cuadro
 *   exacto; si el momento dura más que el clip, se queda en el último (como
 *   `tpad` antes).
 * - Sin clip: su foto al 70 % o un fondo oscuro.
 *
 * El logo de la esquina va sólo aquí: sobre el fondo claro de los templates el
 * logo de esquina (pensado para ir sobre video) no se leería.
 */
import { gsap } from "gsap";
import { FALLBACK_CLOSING, FPS, LOGO_MARGIN, LOGO_MAX_H, LOGO_MAX_W, TEXT_BOTTOM, TEXT_SIDE, TEXT_SIZE, TEXT_TOP } from "../../video/compose";
import { registerBlock } from "../registry";
import type { ClipParams } from "../types";
import { drawSceneImages } from "./scene-images";

registerBlock("clip", (ctx) => {
	const { el, tl, moment, u, doc: motion } = ctx;
	const params = moment.params as ClipParams;
	const doc = el.ownerDocument;
	const W = motion.width;
	const H = motion.height;
	const short = Math.min(W, H);
	el.style.background = FALLBACK_CLOSING;
	const cover = { position: "absolute", inset: "0", width: "100%", height: "100%", objectFit: "cover", display: "block" };

	const clip = moment.clip;
	const frames = clip && moment.shotId ? motion.media.framesOf?.(moment.shotId) : null;
	if (clip && ctx.mode === "export" && frames) {
		const img = doc.createElement("img");
		img.className = "motion-clip";
		img.alt = "";
		Object.assign(img.style, cover);
		el.appendChild(img);
		// El último cuadro que hay: la misma cuenta que el plan de render (`frames`).
		const last = Math.max(0, Math.ceil((clip.to - clip.from) * FPS - 1e-6) - 1);
		let shown = -1;
		ctx.onSeek((t) => {
			const n = Math.min(last, Math.max(0, Math.floor((t - moment.at) * FPS + 1e-6)));
			if (n !== shown) {
				shown = n;
				img.src = frames(n);
			}
		});
	} else if (clip) {
		const video = doc.createElement("video");
		video.className = "motion-clip";
		video.muted = true;
		video.playsInline = true;
		video.preload = "auto";
		video.setAttribute("src", clip.src);
		Object.assign(video.style, cover);
		el.appendChild(video);
		let previous = -1;
		ctx.onSeek((t) => {
			const inside = t >= moment.at && t < moment.at + moment.seconds;
			const want = Math.min(clip.to, clip.from + (t - moment.at));
			const running = previous >= 0 && t > previous && t - previous < 0.1;
			previous = t;
			if (!inside) {
				video.pause();
				return;
			}
			if (Math.abs(video.currentTime - want) > (running ? 0.3 : 1 / FPS)) video.currentTime = want;
			if (running && video.paused) void video.play()?.catch(() => undefined);
			if (!running && !video.paused) video.pause();
		});
	} else if (moment.still) {
		const img = doc.createElement("img");
		img.alt = "";
		img.src = moment.still;
		Object.assign(img.style, cover, { objectFit: "contain", opacity: "0.7" });
		el.appendChild(img);
	}

	// Las imágenes de escena, en su caja y con su entrada.
	const text = params.text.trim();
	drawSceneImages(ctx, params.imagesLayout, params.imagesEntrance, text ? params.textPosition : null);

	// El logo de la esquina.
	if (motion.brand.sceneLogo) {
		const logo = doc.createElement("img");
		logo.className = "motion-corner";
		logo.alt = "";
		logo.src = motion.brand.sceneLogo;
		const m = LOGO_MARGIN * short;
		Object.assign(logo.style, { position: "absolute", right: `${m}px`, top: `${m}px`, maxWidth: `${LOGO_MAX_W * W}px`, maxHeight: `${LOGO_MAX_H * H}px`, objectFit: "contain" });
		el.appendChild(logo);
	}

	// El texto de la escena entre `textIn` y `textOut`.
	if (text) {
		const textIn = Math.min(Math.max(0, params.textIn), moment.seconds);
		const textOut = Math.max(textIn, Math.min(params.textOut ?? moment.seconds, moment.seconds));
		if (textOut > textIn) {
			const span = doc.createElement("div");
			span.className = "motion-cliptext";
			span.textContent = text;
			const side = TEXT_SIDE * short;
			const place = params.textPosition === "top" ? { top: `${TEXT_TOP * short}px` } : params.textPosition === "center" ? { top: "50%", transform: "translateY(-50%)" } : { bottom: `${TEXT_BOTTOM * short}px` };
			Object.assign(span.style, {
				position: "absolute",
				left: `${side}px`,
				right: `${side}px`,
				textAlign: "center",
				color: motion.brand.textColor,
				fontSize: `${TEXT_SIZE * short}px`,
				fontFamily: ctx.font(motion.brand.face.family),
				fontWeight: String(motion.brand.face.weight),
				lineHeight: "1.15",
				textShadow: `0 ${0.15 * u}px ${0.6 * u}px rgba(0,0,0,0.45)`,
				...place,
			});
			el.appendChild(span);
			gsap.set(span, { opacity: 0 });
			if (textIn <= 1e-6) gsap.set(span, { opacity: 1 });
			else tl.set(span, { opacity: 1 }, moment.at + textIn);
			if (textOut < moment.seconds - 1e-6) tl.set(span, { opacity: 0 }, moment.at + textOut);
		}
	}
});
