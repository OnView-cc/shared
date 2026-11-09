/**
 * Lumen, la IA de OnView (nombre elegido por el usuario el 2026-11-09): la que
 * escribe el guion y genera las tomas. Su símbolo es **la primera ventana que
 * se enciende** en la ciudad a la hora azul: un rectángulo ámbar con su
 * cruceta, y de noche un halo tenue alrededor. Se llama igual en inglés,
 * español y portugués.
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
	window: {
		x: 6.5,
		y: 3.5,
		w: 11,
		h: 15,
		rx: 1,
		fill: { night: "#f2a33a", paper: "#d98a22" } as Record<MarkTone, string>,
	},
	/** La cruceta: un montante y un travesaño, en el color del suelo. */
	mullion: { color: { night: "#0a1124", paper: "#ffffff" } as Record<MarkTone, string>, width: 1.1, crossY: 9.2 },
	/** El alféizar: una línea fina bajo la ventana. */
	sill: { y: 20.6, width: 1.2, color: { night: "#e9ecf5", paper: "#0a1124" } as Record<MarkTone, string> },
	halo: { blur: 2.2, opacity: 0.55 },
} as const;

/** El símbolo como SVG autónomo; el halo sólo de noche. */
export function aiMarkSvg(tone: MarkTone, size = 24): string {
	const { window: w, mullion: m, sill: s, halo: h } = AI_MARK;
	const fill = w.fill[tone];
	const cx = w.x + w.w / 2;
	const glow =
		tone === "night"
			? `<defs><filter id="lumen-halo" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="${h.blur}"/></filter></defs>` +
				`<rect x="${w.x}" y="${w.y}" width="${w.w}" height="${w.h}" rx="${w.rx}" fill="${fill}" opacity="${h.opacity}" filter="url(#lumen-halo)"/>`
			: "";
	return (
		`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="${AI_MARK.viewBox}">` +
		glow +
		`<rect x="${w.x}" y="${w.y}" width="${w.w}" height="${w.h}" rx="${w.rx}" fill="${fill}"/>` +
		`<line x1="${cx}" y1="${w.y}" x2="${cx}" y2="${w.y + w.h}" stroke="${m.color[tone]}" stroke-width="${m.width}"/>` +
		`<line x1="${w.x}" y1="${m.crossY}" x2="${w.x + w.w}" y2="${m.crossY}" stroke="${m.color[tone]}" stroke-width="${m.width}"/>` +
		`<path d="M${w.x - 1} ${s.y}H${w.x + w.w + 1}" stroke="${s.color[tone]}" stroke-width="${s.width}" stroke-linecap="round"/>` +
		`</svg>`
	);
}
