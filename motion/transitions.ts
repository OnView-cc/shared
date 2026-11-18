/**
 * Cómo pasa un momento al siguiente (spec 2026-11-18 §5): la transición es del
 * momento que sale. Ocupa el último medio golpe del que sale y el primero del
 * que entra (una ventana de un golpe centrada en el corte), acotada a la mitad
 * del momento más corto.
 *
 * - `blur`: el que sale encoge un poco y se desenfoca; el que entra llega
 *   desenfocado y se aclara (lo de Arcade).
 * - `push`: la cámara empuja hacia lo siguiente: el que sale crece y se
 *   desenfoca en el medio golpe de antes del corte; el que entra viene de un
 *   poco más pequeño en el medio golpe de después. Nunca se mezclan (en Arcade,
 *   el grupo de iconos se va solo y la lista llega después).
 * - `cut`: corte seco en el golpe; nunca hay dos momentos a la vez.
 *
 * Cada capa empieza invisible (`autoAlpha` 0: tampoco se pinta) y la línea de
 * tiempo la enciende y la apaga. Todo con tiempos absolutos y
 * `immediateRender: false`, para que ir hacia atrás devuelva el estado exacto.
 */
import { gsap as g } from "gsap";
import type { Moment } from "../video/compose";

type Tl = gsap.core.Timeline;

export function wireTransitions(tl: Tl, layers: HTMLElement[], moments: Moment[], beatSeconds: number): void {
	g.set(layers, { autoAlpha: 0 });
	moments.forEach((m, i) => {
		const layer = layers[i]!;
		const prev = moments[i - 1];
		const next = moments[i + 1];
		// Entrada: la decide la transición del momento anterior.
		// El primero ya está encendido en el 0 (un `set` en la posición 0 no se pinta si la línea ya está en 0).
		if (!prev) {
			g.set(layer, { autoAlpha: 1 });
		} else if (prev.transition === "cut") {
			tl.set(layer, { autoAlpha: 1 }, m.at);
		} else {
			const half = Math.min(beatSeconds / 2, prev.seconds / 2, m.seconds / 2);
			// `push` no mezcla: el que entra llega en el medio golpe de después del corte; `blur` funde los dos.
			const push = prev.transition === "push";
			const from = push ? { autoAlpha: 0, scale: 0.92, filter: "blur(14px)" } : { autoAlpha: 0, scale: 1.03, filter: "blur(16px)" };
			tl.fromTo(layer, from, { autoAlpha: 1, scale: 1, filter: "blur(0px)", duration: push ? half : 2 * half, ease: "expo.out", immediateRender: false }, push ? m.at : m.at - half);
		}
		// Salida.
		if (!next) return;
		const end = m.at + m.seconds;
		if (m.transition === "cut") {
			tl.set(layer, { autoAlpha: 0 }, end);
			return;
		}
		const half = Math.min(beatSeconds / 2, m.seconds / 2, next.seconds / 2);
		// `push`: el que sale se va en el medio golpe de antes del corte, creciendo hacia la cámara.
		const push = m.transition === "push";
		const to = push ? { scale: 1.3, filter: "blur(20px)" } : { scale: 0.94, filter: "blur(18px)" };
		tl.to(layer, { ...to, autoAlpha: 0, duration: push ? half : 2 * half, ease: "power2.in", immediateRender: false }, end - half);
	});
}
