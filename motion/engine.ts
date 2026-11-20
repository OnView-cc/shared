/**
 * El motor de animación (spec 2026-11-18 §8): dibuja una composición de
 * momentos sobre un elemento del DOM con una sola línea de tiempo de GSAP,
 * **pausada**. Quien lo monta la mueve con `seek(t)`:
 *
 * - el editor, con su reloj (vista previa);
 * - el Container de exportación, cuadro a cuadro (`seek` → captura).
 *
 * Así la vista previa y el MP4 son la misma página. Nada se mueve fuera de la
 * línea de tiempo: el mismo `seek(t)` da siempre el mismo cuadro.
 *
 * El escenario se dibuja al tamaño del cuadro del video (p. ej. 1920×1080) y
 * en la vista previa se escala con CSS al tamaño del visor; `--u` (1 % del lado
 * corto) es la unidad de todos los tamaños. Cada momento es una capa; su
 * bloque (`blocks/*`, registrado en `registry.ts`) dibuja dentro y anima con
 * tiempos absolutos. `transitions.ts` enciende y apaga las capas.
 */
import { gsap } from "gsap";
import { WATERMARK } from "../video/compose";
import { beatSeconds as beatOf } from "./fit";
import { cyclePalette, drawBackground, inkOn } from "./background";
import { wireCamera } from "./camera";
import { phraseWeight } from "./type";
import { STYLES } from "./styles";
import { blockFor } from "./registry";
import { injectMotionCss } from "./style";
import { wireTransitions } from "./transitions";
import type { MotionDoc } from "./doc";

export type { MotionDoc, MotionMedia } from "./doc";
export { registerBlock, type BlockCtx, type BlockBuilder } from "./registry";

export interface MotionHandle {
	duration: number;
	/** Fuentes e imágenes cargadas. */
	ready: Promise<void>;
	/** Lleva el video al segundo `t`; en la exportación, resuelve cuando lo visible está decodificado. */
	seek(t: number): Promise<void>;
	destroy(): void;
}

/** Lo que sobra el fondo por cada lado cuando algo lo mueve, en `u` (la sacudida mueve 1 u y el paralaje hasta 4). */
const BLEED = 6;

/** Lo más que se espera a una imagen antes de seguir sin ella: una pieza que no llega no cuelga la grabación. */
const IMAGE_WAIT_MS = 8000;

export function createMotion(root: HTMLElement, doc: MotionDoc, opts: { mode: "preview" | "export"; imageWaitMs?: number }): MotionHandle {
	const document = root.ownerDocument;
	injectMotionCss(document);
	root.replaceChildren();
	const W = doc.width;
	const H = doc.height;
	const u = Math.min(W, H) / 100;
	const orientation = W > H ? "landscape" : W < H ? "portrait" : "square";
	const beat = beatOf(doc.tempo.bpm);

	const stage = document.createElement("div");
	stage.className = "motion-stage";
	stage.style.width = `${W}px`;
	stage.style.height = `${H}px`;
	stage.style.setProperty("--u", `${u}px`);
	const font = (family: string) => doc.media.font?.(family) ?? `"${family}", "Noto Sans", sans-serif`;
	stage.style.fontFamily = font(doc.brand.face.family);
	stage.style.fontWeight = String(doc.brand.face.weight);
	root.appendChild(stage);
	// Un plan de antes de los estilos no trae `style`: es Arcade, el aspecto de entonces.
	const style = doc.style ?? STYLES.arcade;
	const photo = doc.moments.find((m) => m.block === "product" && m.images[0])?.images[0]?.src ?? null;
	// La cámara (`camera.ts`): dos envolturas con el fondo y las capas dentro; la marca de agua queda fuera.
	const camera = document.createElement("div");
	camera.className = "motion-camera";
	const hit = document.createElement("div");
	hit.className = "motion-hit";
	camera.appendChild(hit);
	stage.appendChild(camera);
	const drawn = drawBackground(hit, style.background, doc.brand, u, photo);
	// Si la cámara o el fondo se mueven, el fondo sobra por los cuatro lados: nunca asoma el borde del escenario.
	const { camera: cam } = style;
	if (cam.drift !== "none" || cam.hit !== "none" || style.background.motion === "drift") {
		Object.assign(drawn.layer.style, { inset: "auto", left: `${-BLEED * u}px`, top: `${-BLEED * u}px`, width: `${W + 2 * BLEED * u}px`, height: `${H + 2 * BLEED * u}px` });
	}
	const background = { kind: drawn.kind, color: drawn.color };
	const ink = inkOn(background, doc.brand);

	const tl = gsap.timeline({ paused: true, defaults: { ease: "expo.out" } });
	const fitters: (() => void)[] = [];
	const layers = doc.moments.map((moment, i) => {
		const el = document.createElement("div");
		el.className = "motion-layer";
		el.dataset.moment = String(i);
		el.dataset.block = moment.block;
		hit.appendChild(el);
		return el;
	});
	wireTransitions(tl, layers, doc.moments, beat);
	wireCamera(tl, { camera, hit, background: drawn.layer }, style, { total: doc.total, beatSeconds: beat, offset: doc.tempo.offset, u });
	// Bloques: cada momento sobre otro color del kit, con la tinta que se lea en él (el cierre, con el suyo).
	const palette = style.background.cycle ? cyclePalette(doc.brand, style.background.saturate) : null;
	doc.moments.forEach((moment, i) => {
		let own = background;
		if (palette && moment.block !== "logo") {
			own = { kind: "brand", color: palette[i % palette.length]! };
			layers[i]!.style.background = own.color;
		}
		blockFor(moment.block)?.({
			el: layers[i]!,
			tl,
			moment,
			doc,
			u,
			orientation,
			mode: opts.mode,
			beat: (n) => moment.at + n * beat,
			beatSeconds: beat,
			ink: own === background ? ink : inkOn(own, doc.brand),
			style,
			background: own,
			font,
			onReady: (fn) => fitters.push(fn),
		});
	});
	// La línea de tiempo mide exactamente el video, aunque el último bloque acabe antes.
	tl.set({}, {}, doc.total);

	if (doc.watermark && doc.media.watermark) {
		const wm = document.createElement("img");
		wm.className = "motion-watermark";
		wm.alt = "";
		wm.src = doc.media.watermark;
		Object.assign(wm.style, { left: `${WATERMARK.margin * u * 100}px`, top: `${WATERMARK.margin * u * 100}px`, width: `${WATERMARK.width * u * 100}px`, opacity: String(WATERMARK.opacity) });
		stage.appendChild(wm);
	}

	// Vista previa: el escenario se escala al ancho del visor.
	let observer: ResizeObserver | null = null;
	if (opts.mode === "preview") {
		const fit = () => {
			const scale = root.clientWidth > 0 ? root.clientWidth / W : 1;
			stage.style.transform = `scale(${scale})`;
		};
		fit();
		if (typeof ResizeObserver !== "undefined") {
			observer = new ResizeObserver(fit);
			observer.observe(root);
		}
	}

	const images = () => [...stage.querySelectorAll("img")];
	const loaded = (img: HTMLImageElement) =>
		img.complete
			? Promise.resolve()
			: new Promise<void>((resolve) => {
					img.addEventListener("load", () => resolve(), { once: true });
					img.addEventListener("error", () => resolve(), { once: true });
					setTimeout(resolve, opts.imageWaitMs ?? IMAGE_WAIT_MS);
				});
	// Las letras que usa el video se piden ya: `fonts.ready` sólo espera las que algo pidió, y el cuadro 0 tiene que llevarlas.
	const fonts = (document as Document & { fonts?: FontFaceSet }).fonts;
	// También al peso de las frases del estilo: si no, se miden con otra letra y no encogen (tarea 8, Impacto a 800).
	const phrase = { ...doc.brand.face, weight: phraseWeight(style.type, doc.brand.face) };
	const faces = [doc.brand.face, doc.brand.secondary, phrase].map((f) => `${f.weight} 32px ${font(f.family)}`);
	const fontsIn = fonts ? Promise.all(faces.map((f) => fonts.load(f).catch(() => undefined))).then(() => fonts.ready) : Promise.resolve();
	const ready = Promise.all([fontsIn, ...images().map(loaded)]).then(() => {
		for (const fn of fitters) fn();
	});

	tl.seek(0, false);
	return {
		duration: doc.total,
		ready,
		async seek(t: number) {
			const at = Math.max(0, Math.min(t, doc.total));
			tl.seek(at, false);
			if (opts.mode !== "export") return;
			const visible = images().filter((img) => img.closest<HTMLElement>(".motion-layer")?.style.visibility !== "hidden");
			await Promise.all(visible.map((img) => (typeof img.decode === "function" ? img.decode().catch(() => undefined) : undefined)));
		},
		destroy() {
			observer?.disconnect();
			tl.kill();
			root.replaceChildren();
		},
	};
}
