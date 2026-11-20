/**
 * Cómo pasa un momento al siguiente (spec 2026-11-18 §5; las cuatro nuevas, spec
 * 2026-11-19-onview-estilos-y-referencias §5.2): la transición es del momento
 * que sale. Ocupa el último medio golpe del que sale y el primero del que entra
 * (una ventana de un golpe centrada en el corte), acotada a la mitad del
 * momento más corto.
 *
 * - `blur`: el que sale encoge un poco y se desenfoca; el que entra llega
 *   desenfocado y se aclara (lo de Arcade).
 * - `push`: la cámara empuja hacia lo siguiente: el que sale crece y se
 *   desenfoca en el medio golpe de antes del corte; el que entra viene de un
 *   poco más pequeño en el medio golpe de después. Nunca se mezclan (en Arcade,
 *   el grupo de iconos se va solo y la lista llega después).
 * - `cut`: corte seco en el golpe; nunca hay dos momentos a la vez.
 * - `punch`: corte seco en el golpe y el que entra se asienta de 1.08 a 1 en
 *   medio golpe (el golpe de zoom de Impacto).
 * - `wipe`: el que entra se descubre con un barrido en diagonal, por encima del
 *   que sale, en la ventana de un golpe.
 * - `slide`: el que sale se va hacia la izquierda y el que entra llega desde la
 *   derecha, en la ventana de un golpe.
 * - `fade`: fundido cruzado largo: dos golpes centrados en el corte.
 *
 * Cada capa empieza invisible (`autoAlpha` 0: tampoco se pinta) y la línea de
 * tiempo la enciende y la apaga. Todo con tiempos absolutos y
 * `immediateRender: false`, para que ir hacia atrás devuelva el estado exacto.
 */
import { gsap as g } from "gsap";
import type { Moment } from "../video/compose";
import type { Transition } from "./types";

type Tl = gsap.core.Timeline;

/** Cuánto se desliza una capa en `slide`, en % de su ancho. */
const SLIDE = 8;
/** El barrido en diagonal: tapado del todo y descubierto del todo. */
const WIPE_FROM = "polygon(0% 0%, 0% 0%, -20% 100%, -20% 100%)";
const WIPE_TO = "polygon(0% 0%, 120% 0%, 100% 100%, -20% 100%)";

/** La media ventana: medio golpe (un golpe en `fade`), acotada a la mitad del momento más corto. */
function halfWindow(t: Transition, beatSeconds: number, a: Moment, b: Moment): number {
	return Math.min(t === "fade" ? beatSeconds : beatSeconds / 2, a.seconds / 2, b.seconds / 2);
}

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
		} else {
			const half = halfWindow(prev.transition, beatSeconds, prev, m);
			switch (prev.transition) {
				case "cut":
					tl.set(layer, { autoAlpha: 1 }, m.at);
					break;
				case "punch":
					tl.set(layer, { autoAlpha: 1 }, m.at);
					tl.fromTo(layer, { scale: 1.08 }, { scale: 1, duration: half, ease: "expo.out", immediateRender: false }, m.at);
					break;
				case "wipe":
					tl.set(layer, { autoAlpha: 1 }, m.at - half);
					tl.fromTo(layer, { clipPath: WIPE_FROM }, { clipPath: WIPE_TO, duration: 2 * half, ease: "power2.inOut", immediateRender: false }, m.at - half);
					tl.set(layer, { clipPath: "none" }, m.at + half);
					break;
				case "slide":
					tl.fromTo(layer, { autoAlpha: 1, xPercent: SLIDE }, { xPercent: 0, duration: 2 * half, ease: "power3.out", immediateRender: false }, m.at - half);
					break;
				case "fade":
					tl.fromTo(layer, { autoAlpha: 0 }, { autoAlpha: 1, duration: 2 * half, ease: "sine.inOut", immediateRender: false }, m.at - half);
					break;
				default: {
					// `push` no mezcla: el que entra llega en el medio golpe de después del corte; `blur` funde los dos.
					const push = prev.transition === "push";
					const from = push ? { autoAlpha: 0, scale: 0.92, filter: "blur(14px)" } : { autoAlpha: 0, scale: 1.03, filter: "blur(16px)" };
					tl.fromTo(layer, from, { autoAlpha: 1, scale: 1, filter: "blur(0px)", duration: push ? half : 2 * half, ease: "expo.out", immediateRender: false }, push ? m.at : m.at - half);
				}
			}
		}
		// Salida.
		if (!next) return;
		const end = m.at + m.seconds;
		const half = halfWindow(m.transition, beatSeconds, m, next);
		switch (m.transition) {
			case "cut":
			case "punch":
				tl.set(layer, { autoAlpha: 0 }, end);
				return;
			case "wipe":
				// Queda debajo mientras el que entra lo tapa.
				tl.set(layer, { autoAlpha: 0 }, end + half);
				return;
			case "slide":
				tl.to(layer, { xPercent: -SLIDE, duration: 2 * half, ease: "power3.out", immediateRender: false }, end - half);
				tl.set(layer, { autoAlpha: 0 }, end + half);
				return;
			case "fade":
				tl.to(layer, { autoAlpha: 0, duration: 2 * half, ease: "sine.inOut", immediateRender: false }, end - half);
				return;
			default: {
				// `push`: el que sale se va en el medio golpe de antes del corte, creciendo hacia la cámara.
				const push = m.transition === "push";
				const to = push ? { scale: 1.3, filter: "blur(20px)" } : { scale: 0.94, filter: "blur(18px)" };
				tl.to(layer, { ...to, autoAlpha: 0, duration: push ? half : 2 * half, ease: "power2.in", immediateRender: false }, end - half);
			}
		}
	});
}
