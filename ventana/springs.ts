/**
 * Muelles de Ventana. Un muelle subamortiguado se muestrea y se vuelve un
 * `linear()` de CSS: así el navegador lo anima sin JS y sin hilo principal.
 * `scripts/gen-springs.mjs` escribe el resultado en `styles/ventana/motion.css`.
 * Sin enums ni propiedades de parámetro: el script lo importa con type-stripping.
 */

export interface Spring {
	/** Periodo natural en segundos. */
	response: number;
	/** Fracción de amortiguamiento (0..1). */
	damping: number;
}

export const SPRINGS = {
	soft: { response: 0.55, damping: 0.85 },
	snap: { response: 0.35, damping: 0.75 },
} as const;

const SETTLED = 0.001;
const SETTLED_RUN = 4;

/** x(t) de un muelle subamortiguado de 0 a 1; se asienta cuando |1 - x| < 0.001 durante 4 muestras. */
export function sampleSpring(s: Spring, step = 1 / 60): { points: number[]; duration: number } {
	const w0 = (2 * Math.PI) / s.response;
	const z = s.damping;
	const wd = w0 * Math.sqrt(1 - z * z);
	const x = (t: number) => 1 - Math.exp(-z * w0 * t) * (Math.cos(wd * t) + ((z * w0) / wd) * Math.sin(wd * t));

	const points: number[] = [];
	let run = 0;
	// Tope de seguridad: 10 s de muestras
	for (let i = 0; i <= Math.ceil(10 / step); i++) {
		const v = x(i * step);
		points.push(Math.round(v * 1000) / 1000);
		run = Math.abs(1 - v) < SETTLED ? run + 1 : 0;
		if (run >= SETTLED_RUN) break;
	}
	points[0] = 0;
	points[points.length - 1] = 1;
	return { points, duration: (points.length - 1) * step };
}

/** El muelle como `linear(...)` y su duración en ms enteros. */
export function springLinear(s: Spring): { easing: string; durationMs: number } {
	const { points, duration } = sampleSpring(s);
	return { easing: `linear(${points.join(", ")})`, durationMs: Math.round(duration * 1000) };
}
