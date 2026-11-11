/**
 * Lumen, la IA de OnView (nombre elegido por el usuario el 2026-11-09): la que
 * escribe el guion y genera las tomas. Su símbolo, en el mundo Feed vertical,
 * es **un punto blanco con halo**: el punto macizo y un anillo tenue alrededor.
 * Mientras Lumen piensa, el halo late (`AiMark thinking`, `kit.tsx`); con
 * movimiento reducido se queda quieto. Se llama igual en inglés, español y
 * portugués.
 *
 * Regla de uso (como Nova en OnDesk o Ion en OnPilot): «Lumen» cuando el sujeto
 * escribe, propone o genera; «OnView» para la cuenta, el plan, el cobro y los
 * legales. Geometría en un lienzo de 24; la pintan `AiMark` (`kit.tsx`) y
 * `aiMarkSvg` (texto, para el kit de marca).
 */
import type { MarkTone } from "./mark";

export const AI_NAME = "Lumen";

export const AI_MARK = {
	viewBox: "0 0 24 24",
	dot: { r: 4.4 },
	halo: { r: 8.6, width: 1.6, opacity: 0.38 },
	/** Los mismos dos de la marca (`MARK_COLORS`); escritos aquí para que el script de marca lo cargue sin resolver módulos. */
	colors: { night: "#f4f4f2", paper: "#0a0a0b" } as Record<MarkTone, string>,
} as const;

/** El símbolo como SVG autónomo. */
export function aiMarkSvg(tone: MarkTone, size = 24): string {
	const c = AI_MARK.colors[tone];
	const { dot, halo } = AI_MARK;
	return (
		`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="${AI_MARK.viewBox}">` +
		`<circle cx="12" cy="12" r="${halo.r}" fill="none" stroke="${c}" stroke-width="${halo.width}" opacity="${halo.opacity}"/>` +
		`<circle cx="12" cy="12" r="${dot.r}" fill="${c}"/>` +
		`</svg>`
	);
}
