/**
 * Cuánto mide el texto de los bloques según el formato (spec 2026-11-18 §5;
 * tamaños del prototipo aprobado). Las cuentas van en unidades `u` = 1 % del
 * lado corto del cuadro. Es una estimación por caracteres (una letra media
 * ocupa media «eme»), pura y la misma en el editor y en la exportación; la
 * prueba de integración del Container comprueba con la medida real del
 * navegador que nada se sale.
 *
 * - Horizontal y cuadrado: 11.4 u, en una línea mientras quepa entero.
 * - Vertical: 12.5 u, partido en líneas a 78 % del ancho.
 *
 * (Tarea 0b del plan 2026-11-18-onview-todo-codigo: Arcade escribe a 11.6 u, en
 * una línea que ocupa el 71 % del ancho; antes eran 9.2 y 11 u y se veía tímido.
 * La letra media se estima en 0.46 «emes», lo que mide Inter a peso 500; la
 * medida real del navegador corrige con `shrinkToFit` si una letra es más ancha.)
 * - Si el texto entero no cabe en una línea, se parte entre grupos; si un
 *   grupo no cabe solo en una línea, el tamaño baja hasta que quepa, nunca por
 *   debajo de 6 u (ahí el grupo se parte por dentro).
 */

export type Orientation = "landscape" | "portrait" | "square";

export const TEXT_MIN_U = 6;
const BASE: Record<Orientation, { sizeU: number; widthPct: number; widthU: number }> = {
	landscape: { sizeU: 11.4, widthPct: 84, widthU: (1920 / 1080) * 100 },
	square: { sizeU: 11.4, widthPct: 84, widthU: 100 },
	portrait: { sizeU: 12.5, widthPct: 78, widthU: 100 },
};
/** El ancho medio de una letra, en «emes». */
const CHAR_EM = 0.46;

/** Cuántas letras caben en una línea a un tamaño dado. */
const capacity = (o: Orientation, sizeU: number) => ((BASE[o].widthPct / 100) * BASE[o].widthU) / (CHAR_EM * sizeU);

/**
 * Encoge un texto que no cabe en `maxPx` según lo que mide de verdad (con las
 * fuentes ya cargadas): la estimación por letras falla con letras anchas
 * (Bricolage o Montserrat gruesas). Nunca por debajo de `minPx`. Devuelve el
 * tamaño nuevo, o null si cabía. Sin medidas (`scrollWidth` 0), no hace nada.
 */
export function shrinkToFit(sizeEl: HTMLElement, measured: HTMLElement[], maxPx: number, minPx: number): number | null {
	const widest = Math.max(0, ...measured.map((el) => el.scrollWidth));
	if (!(widest > maxPx) || !(maxPx > 0)) return null;
	const current = parseFloat(sizeEl.style.fontSize);
	if (!(current > 0)) return null;
	const next = Math.max(minPx, Math.floor(current * (maxPx / widest) * 0.98 * 10) / 10);
	sizeEl.style.fontSize = `${next}px`;
	return next;
}

/**
 * En vertical una frase no encoge por debajo del 80 % de su tamaño: un grupo más
 * largo se parte entre sus palabras (`breakGroups`), como cualquier texto en un
 * móvil. Antes encogía hasta 6 u y «Start your workspace today» quedaba
 * diminuto (tarea 0b).
 */
const PORTRAIT_FLOOR = 0.8;

export function textLayout(lines: string[], o: Orientation): { sizeU: number; widthPct: number; wrap: boolean; breakGroups: boolean } {
	const { sizeU: base, widthPct } = BASE[o];
	const groups = lines.map((l) => l.trim()).filter(Boolean);
	if (groups.length === 0) return { sizeU: base, widthPct, wrap: false, breakGroups: false };
	const whole = groups.join(" ").length;
	const portrait = o === "portrait";
	if (!portrait && whole <= capacity(o, base)) return { sizeU: base, widthPct, wrap: false, breakGroups: false };
	const longest = Math.max(...groups.map((g) => g.length));
	const floor = portrait ? Math.round(base * PORTRAIT_FLOOR * 10) / 10 : TEXT_MIN_U;
	let sizeU = base;
	if (longest > capacity(o, base)) sizeU = Math.max(floor, Math.floor((((widthPct / 100) * BASE[o].widthU) / (CHAR_EM * longest)) * 10) / 10);
	return { sizeU, widthPct, wrap: portrait || whole > capacity(o, sizeU), breakGroups: longest > capacity(o, sizeU) };
}
