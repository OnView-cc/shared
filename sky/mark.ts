/**
 * La marca de OnView en Blue Hour, como datos: **un fotograma rodeado por el
 * círculo del lápiz graso**, la marca con la que un montador elige la toma
 * buena en una hoja de contactos. El fotograma es 4:3 con la esquina del mundo;
 * el círculo es un solo trazo a mano alzada, abierto arriba a la derecha (donde
 * el lápiz empieza y termina sin cerrarse), nunca un círculo geométrico.
 *
 * Geometría pura en un lienzo de 32; la curva del trazo está calculada una vez
 * (una elipse con radio que respira, girada -8°, de -38° a 290°, suavizada) y
 * fijada aquí para que sea la misma en todas partes. La pintan `Mark` (React,
 * `kit.tsx`) y `markSvg` (texto, para el kit de marca de
 * `onview/scripts/render-brand.mjs`), y nada más.
 */
export type MarkTone = "night" | "paper";

export const MARK = {
	viewBox: "0 0 32 32",
	frame: { x: 8, y: 10.4, w: 16, h: 12, rx: 0.5, width: 2.2 },
	grease: {
		d: "M24.97 7.77C25.34 8.14 26.56 9.18 27.19 10.03C27.81 10.88 28.36 11.86 28.73 12.85C29.1 13.84 29.35 14.93 29.41 15.96C29.47 16.98 29.36 18.04 29.08 19.01C28.8 19.98 28.32 20.92 27.73 21.78C27.14 22.64 26.36 23.45 25.53 24.19C24.69 24.92 23.71 25.61 22.72 26.2C21.73 26.79 20.65 27.34 19.58 27.72C18.51 28.1 17.4 28.4 16.31 28.51C15.23 28.61 14.13 28.57 13.08 28.35C12.03 28.13 10.97 27.72 10 27.2C9.02 26.68 8.07 25.98 7.22 25.25C6.38 24.52 5.58 23.66 4.93 22.8C4.28 21.93 3.72 21 3.34 20.06C2.95 19.12 2.69 18.13 2.61 17.13C2.54 16.13 2.62 15.08 2.87 14.05C3.12 13.03 3.55 11.95 4.11 10.99C4.66 10.02 5.4 9.05 6.21 8.25C7.02 7.46 7.99 6.74 8.98 6.2C9.98 5.66 11.08 5.28 12.17 5.02C13.25 4.77 14.4 4.69 15.5 4.69C16.6 4.69 18.23 4.98 18.78 5.04",
		width: 2.4,
	},
} as const;

/** `night`: sobre la tinta o el cielo (el fotograma en papel). `paper`: sobre papel claro (correos, documentos). */
export const MARK_COLORS: Record<MarkTone, { frame: string; grease: string }> = {
	night: { frame: "#e9ecf5", grease: "#f2a33a" },
	paper: { frame: "#0a1124", grease: "#d98a22" },
};

/** La marca como SVG autónomo. */
export function markSvg(tone: MarkTone, size = 32): string {
	const c = MARK_COLORS[tone];
	const { frame: f, grease: g } = MARK;
	return (
		`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="${MARK.viewBox}">` +
		`<rect x="${f.x}" y="${f.y}" width="${f.w}" height="${f.h}" rx="${f.rx}" fill="none" stroke="${c.frame}" stroke-width="${f.width}"/>` +
		`<path d="${g.d}" fill="none" stroke="${c.grease}" stroke-width="${g.width}" stroke-linecap="round" stroke-linejoin="round"/>` +
		`</svg>`
	);
}
