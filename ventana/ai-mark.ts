/**
 * Iris, la IA de OnView en el mundo Ventana. Su símbolo, «El prisma», es **un
 * núcleo blanco con un aro de luz descompuesta en colores**: el espectro de Iris
 * es el único color propio de toda la interfaz, y no aparece en ninguna hoja de
 * estilos (el aro se construye aquí, en JavaScript, a partir de `AI_SPECTRUM`).
 * Mientras Iris piensa, el aro gira (`AiMark thinking`, `marks.tsx`); con
 * movimiento reducido se queda quieto.
 *
 * Regla de uso: «Iris» cuando el sujeto escribe, propone o genera; «OnView» para
 * la cuenta, el plan, el cobro y los legales. `sky/ai-mark.ts` sigue diciendo
 * Lumen hasta que el resto del proyecto pase a Ventana.
 *
 * Geometría pura en un lienzo de 24, sin DOM ni React. Se carga también desde un
 * script de Node (tipos quitados), así que no importa nada: los dos colores del
 * tono se escriben aquí, iguales a `MARK_COLORS` de `mark.ts`.
 */
import type { MarkTone } from "./mark.ts";

export const AI_NAME = "Iris";

/** Las seis paradas del espectro, repartidas a partes iguales por la vuelta; la última vuelve a la primera. */
export const AI_SPECTRUM = ["#ffb35c", "#ff5c8a", "#a06bff", "#4aa8ff", "#3fe0c5", "#ffe08a"] as const;

export const AI_MARK = {
	viewBox: "0 0 24 24",
	core: { r: 4.2 },
	ring: { inner: 6.6, outer: 9.8, segments: 24 },
} as const;

/** Como `MARK_COLORS`; escritos aquí para que el script de marca cargue este archivo solo. */
const TONES = { night: "#f5f5f7", paper: "#060607" } as const;

const hex = (n: number) => Math.round(n).toString(16).padStart(2, "0");

/**
 * El color del espectro en `t` (0..1, cíclico: `t` da la vuelta). Interpola cada
 * canal sRGB linealmente entre las dos paradas vecinas; devuelve `#rrggbb` en minúsculas.
 */
export function spectrumAt(t: number): string {
	const n = AI_SPECTRUM.length;
	const u = (t - Math.floor(t)) * n;
	const i = Math.floor(u) % n;
	const k = u - Math.floor(u);
	const a = AI_SPECTRUM[i];
	const b = AI_SPECTRUM[(i + 1) % n];
	const ch = (s: string, o: number) => parseInt(s.slice(o, o + 2), 16);
	return "#" + [1, 3, 5].map((o) => hex(ch(a, o) + (ch(b, o) - ch(a, o)) * k)).join("");
}

/** El espectro como `conic-gradient` (arranca a las 12, en sentido horario), para pintarlo en línea con `--vn-ai-spectrum`. */
export function spectrumGradient(): string {
	return `conic-gradient(from 0deg, ${[...AI_SPECTRUM, AI_SPECTRUM[0]].join(", ")})`;
}

/** Punto de un círculo de radio `r` a la fracción `f` de la vuelta desde las 12, en sentido horario. */
const at = (r: number, f: number) => {
	const a = f * 2 * Math.PI;
	return `${+(12 + r * Math.sin(a)).toFixed(3)} ${+(12 - r * Math.cos(a)).toFixed(3)}`;
};

/**
 * El símbolo como SVG autónomo. En color: 24 sectores de aro (cada uno un `path`
 * relleno con `spectrumAt` en su centro) y el núcleo. Cada sector lleva un trazo
 * de su propio color de 0.12 de ancho para que los vecinos no dejen una línea
 * fina entre sí. `mono` (correos, documentos): el punto con un aro del color del
 * tono al 40 %, sin ningún color del espectro.
 */
export function aiMarkSvg(tone: MarkTone, opts: { size?: number; mono?: boolean } = {}): string {
	const { size = 24, mono = false } = opts;
	const c = TONES[tone];
	const { core, ring } = AI_MARK;
	const head = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="${AI_MARK.viewBox}">`;
	if (mono) {
		return (
			head +
			`<circle cx="12" cy="12" r="${(ring.inner + ring.outer) / 2}" fill="none" stroke="${c}" stroke-width="${ring.outer - ring.inner}" opacity="0.4"/>` +
			`<circle cx="12" cy="12" r="${core.r}" fill="${c}"/>` +
			`</svg>`
		);
	}
	let sectors = "";
	for (let i = 0; i < ring.segments; i++) {
		const f0 = i / ring.segments;
		const f1 = (i + 1) / ring.segments;
		const fill = spectrumAt((i + 0.5) / ring.segments);
		const d =
			`M${at(ring.outer, f0)}A${ring.outer} ${ring.outer} 0 0 1 ${at(ring.outer, f1)}` +
			`L${at(ring.inner, f1)}A${ring.inner} ${ring.inner} 0 0 0 ${at(ring.inner, f0)}Z`;
		sectors += `<path d="${d}" fill="${fill}" stroke="${fill}" stroke-width="0.12"/>`;
	}
	return head + sectors + `<circle cx="12" cy="12" r="${core.r}" fill="${c}"/>` + `</svg>`;
}


