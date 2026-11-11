/**
 * La marca de OnView en el mundo Feed vertical, como datos: **un marco vertical
 * 9:16 redondeado con el rótulo macizo en su tercio bajo**, el texto que va
 * abajo a la izquierda de un video que se va a publicar. Blanco sobre el casi
 * negro, negro sobre papel; ningún otro color.
 *
 * Geometría pura en un lienzo de 32. La pintan `Mark` (React, `kit.tsx`) y
 * `markSvg` (texto, para el kit de marca de `onview/scripts/render-brand.mjs`),
 * y nada más.
 */
export type MarkTone = "night" | "paper";

export const MARK = {
	viewBox: "0 0 32 32",
	/** El marco: 14.4 × 25.6 (9:16), centrado, con la esquina de un teléfono. */
	frame: { x: 8.8, y: 3.2, w: 14.4, h: 25.6, rx: 3.6, width: 2.4 },
	/** El rótulo: una barra maciza abajo a la izquierda, dentro del marco. */
	caption: { x: 12.2, y: 21.2, w: 7.6, h: 2.8, rx: 1.4 },
} as const;

/** `night`: sobre el casi negro. `paper`: sobre papel claro (correos, documentos). */
export const MARK_COLORS: Record<MarkTone, string> = {
	night: "#f4f4f2",
	paper: "#0a0a0b",
};

/** La marca como SVG autónomo. */
export function markSvg(tone: MarkTone, size = 32): string {
	const c = MARK_COLORS[tone];
	const { frame: f, caption: k } = MARK;
	return (
		`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="${MARK.viewBox}">` +
		`<rect x="${f.x}" y="${f.y}" width="${f.w}" height="${f.h}" rx="${f.rx}" fill="none" stroke="${c}" stroke-width="${f.width}"/>` +
		`<rect x="${k.x}" y="${k.y}" width="${k.w}" height="${k.h}" rx="${k.rx}" fill="${c}"/>` +
		`</svg>`
	);
}
