/**
 * Cuánto mide el texto de los bloques según el formato (spec 2026-11-18 §5;
 * tamaños del prototipo aprobado). Las cuentas van en unidades `u` = 1 % del
 * lado corto del cuadro. Es una estimación por caracteres (una letra media
 * ocupa media «eme»), pura y la misma en el editor y en la exportación; la
 * prueba de integración del Container comprueba con la medida real del
 * navegador que nada se sale.
 *
 * - Horizontal y cuadrado: 9.2 u, en una línea mientras quepa entero.
 * - Vertical: 11 u, partido en líneas a 78 % del ancho.
 * - Si el texto entero no cabe en una línea, se parte entre grupos; si un
 *   grupo no cabe solo en una línea, el tamaño baja hasta que quepa, nunca por
 *   debajo de 6 u (ahí el grupo se parte por dentro).
 */

export type Orientation = "landscape" | "portrait" | "square";

export const TEXT_MIN_U = 6;
const BASE: Record<Orientation, { sizeU: number; widthPct: number; widthU: number }> = {
	landscape: { sizeU: 9.2, widthPct: 84, widthU: (1920 / 1080) * 100 },
	square: { sizeU: 9.2, widthPct: 84, widthU: 100 },
	portrait: { sizeU: 11, widthPct: 78, widthU: 100 },
};
/** El ancho medio de una letra, en «emes». */
const CHAR_EM = 0.5;

/** Cuántas letras caben en una línea a un tamaño dado. */
const capacity = (o: Orientation, sizeU: number) => ((BASE[o].widthPct / 100) * BASE[o].widthU) / (CHAR_EM * sizeU);

export function textLayout(lines: string[], o: Orientation): { sizeU: number; widthPct: number; wrap: boolean } {
	const { sizeU: base, widthPct } = BASE[o];
	const groups = lines.map((l) => l.trim()).filter(Boolean);
	if (groups.length === 0) return { sizeU: base, widthPct, wrap: false };
	const whole = groups.join(" ").length;
	const portrait = o === "portrait";
	if (!portrait && whole <= capacity(o, base)) return { sizeU: base, widthPct, wrap: false };
	const longest = Math.max(...groups.map((g) => g.length));
	let sizeU = base;
	if (longest > capacity(o, base)) sizeU = Math.max(TEXT_MIN_U, Math.floor((((widthPct / 100) * BASE[o].widthU) / (CHAR_EM * longest)) * 10) / 10);
	return { sizeU, widthPct, wrap: portrait || whole > capacity(o, sizeU) };
}
