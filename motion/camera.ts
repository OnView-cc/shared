/**
 * La cámara del estilo (spec 2026-11-19-onview-estilos-y-referencias §5.2): lo
 * que se mueve por encima de los momentos, en la misma línea de tiempo.
 *
 * El escenario lleva dos envolturas: `camera` (el acercamiento lento de todo el
 * video) y dentro `hit` (los golpes: sacudida o pulso de zoom); dentro de las
 * dos, el fondo y las capas. Separadas para que dos tweens nunca peleen por la
 * misma `transform`. La marca de agua queda fuera: no se mueve.
 *
 * - `drift: "in"`: escala de 1 a 1.04 (`subtle`) o 1.08 (`wide`) a lo largo de
 *   todo el video.
 * - `drift: "parallax"`: sólo el fondo se desplaza, de +2 u a −2 u (`subtle`) o
 *   de +4 u a −4 u (`wide`).
 * - `background.motion: "drift"`: el fondo deriva despacio (1.5 u) si no hay
 *   paralaje.
 * - `hit: "shake"`: en cada golpe fuerte (el 0 de cada 4 desde el desfase de la
 *   música), una sacudida de 1 u en 0.15 s.
 * - `hit: "zoom"`: en cada golpe fuerte, un pulso de 1 a 1.02 y vuelta en 0.25 s.
 *
 * Sin nada de eso (Arcade), no añade nada a la línea de tiempo.
 */
import type { Style } from "./styles";

type Tl = gsap.core.Timeline;

export interface CameraEls {
	camera: HTMLElement;
	hit: HTMLElement;
	background: HTMLElement;
}

const NONE = { immediateRender: false, ease: "none" } as const;

/** Los segundos de los golpes fuertes: el 0 de cada 4 desde `offset`, dentro del video. */
export function strongBeats(total: number, beatSeconds: number, offset: number): number[] {
	const out: number[] = [];
	const bar = 4 * beatSeconds;
	if (!(bar > 0)) return out;
	for (let t = ((offset % bar) + bar) % bar; t < total; t += bar) out.push(Math.round(t * 1000) / 1000);
	return out;
}

export function wireCamera(tl: Tl, els: CameraEls, look: Pick<Style, "camera" | "background">, opts: { total: number; beatSeconds: number; offset: number; u: number }): void {
	const { camera, background } = look;
	const { total, u } = opts;
	const wide = camera.amount === "wide";

	if (camera.drift === "in") {
		tl.fromTo(els.camera, { scale: 1 }, { scale: wide ? 1.08 : 1.04, duration: total, ...NONE }, 0);
	}
	if (camera.drift === "parallax") {
		const d = (wide ? 4 : 2) * u;
		tl.fromTo(els.background, { x: d }, { x: -d, duration: total, ...NONE }, 0);
	} else if (background.motion === "drift") {
		tl.fromTo(els.background, { x: -1.5 * u, scale: 1.06 }, { x: 1.5 * u, scale: 1.06, duration: total, ...NONE }, 0);
	}

	if (camera.hit === "none") return;
	for (const at of strongBeats(total, opts.beatSeconds, opts.offset)) {
		if (camera.hit === "shake") {
			tl.fromTo(els.hit, { x: 0, y: 0 }, { keyframes: [{ x: u, y: -0.6 * u, duration: 0.05 }, { x: -0.7 * u, y: 0.4 * u, duration: 0.05 }, { x: 0, y: 0, duration: 0.05 }], immediateRender: false }, at);
		} else {
			tl.fromTo(els.hit, { scale: 1 }, { keyframes: [{ scale: 1.02, duration: 0.08, ease: "power2.out" }, { scale: 1, duration: 0.17, ease: "power2.in" }], immediateRender: false }, at);
		}
	}
}
