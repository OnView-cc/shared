/**
 * La marca de OnView en el mundo Ventana, «Dos capas», como datos: **dos marcos
 * verticales 9:16 superpuestos**, el video (atrás, tenue) y el vidrio que flota
 * encima (delante, macizo). Habla de capas, de profundidad y de cuadros que se
 * mueven. Blanco roto sobre el casi negro, casi negro sobre papel; ningún otro
 * color y ningún degradado.
 *
 * Geometría pura en un lienzo de 32, sin DOM ni React ni importar de `sky/`. La
 * pintan `Mark` (React, `marks.tsx`) y `markSvg` (texto, para el kit de marca y
 * para el script de marca, que carga este archivo con los tipos quitados).
 */
export type MarkTone = "night" | "paper";

/** `night`: sobre el casi negro (`--vn-ink`). `paper`: sobre papel claro (correos, documentos; `--vn-ground`). */
export const MARK_COLORS: Record<MarkTone, string> = {
	night: "#f5f5f7",
	paper: "#060607",
};

export const MARK = {
	viewBox: "0 0 32 32",
	/**
	 * El marco de atrás, arriba a la izquierda y tenue. Mide 12.95 × 23 (9:16). Su
	 * opacidad va por tono: sobre el casi negro basta 0.42 (3.77:1 contra el suelo);
	 * sobre papel claro el mismo valor se queda en 2.90:1, así que el papel es más
	 * denso (0.5) para llegar a 3:1 como el resto de iconos.
	 */
	back: { x: 5.5, y: 3.5, w: 12.95, h: 23, rx: 4.25, opacity: { night: 0.42, paper: 0.5 } as Record<MarkTone, number> },
	/** El marco de delante, abajo a la derecha y macizo. Mismo tamaño que el de atrás. */
	front: { x: 13.5, y: 5.5, w: 12.95, h: 23, rx: 4.25 },
} as const;

/** La marca como SVG autónomo: dos `rect` planos. */
export function markSvg(tone: MarkTone, size = 32): string {
	const c = MARK_COLORS[tone];
	const { back: b, front: f } = MARK;
	return (
		`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="${MARK.viewBox}">` +
		`<rect x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}" rx="${b.rx}" fill="${c}" opacity="${b.opacity[tone]}"/>` +
		`<rect x="${f.x}" y="${f.y}" width="${f.w}" height="${f.h}" rx="${f.rx}" fill="${c}"/>` +
		`</svg>`
	);
}
