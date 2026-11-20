/**
 * La cuenta del contraste sobre el vidrio de Ventana: dado el color que hay
 * detrás, qué color queda bajo el texto y cuánto contrasta la tinta con él.
 *
 * El vidrio tiene dos densidades y cuál toca lo decide lo que hay detrás:
 *
 * - `smoked` (ahumado, el de por defecto): sobre lo que no controlamos (el video
 *   o las imágenes de una persona). Lleva una capa oscura propia y su garantía es
 *   sobre blanco puro: pasa sobre cualquier color.
 * - `lit` (luminoso, dentro de un ámbito `vn-lit`): sobre fondos que controlamos
 *   (el video de demostración, el resplandor). No lleva capa oscura: el propio
 *   filtro atenúa lo de detrás. Su garantía es sobre un techo declarado
 *   (`GLASS.lit[grado].ceiling`): el gris neutro más claro sobre el que la tinta
 *   aún llega al umbral del grado. Quien pone vidrio luminoso sobre un fondo prueba
 *   con `passesOnGlass` los colores más claros que ese fondo enseña bajo el
 *   vidrio; donde alguno no pasa, va el ahumado.
 *
 * El modelo es el de `styles/ventana/glass.css`, capa a capa y de abajo arriba:
 * el fondo saturado por el filtro (`saturate`, que deja igual los grises y aviva
 * los colores: un naranja queda más claro de lo que era), después atenuado
 * (`brightness`, sólo en el luminoso) o cubierto por el humo (en el ahumado), y
 * encima el brillo en su punto más fuerte. El desenfoque no se cuenta a
 * propósito: desenfocar promedia colores, así que el peor caso es el color más
 * claro sin desenfocar. Cada capa se redondea a 8 bits, como la prueba de tokens.
 *
 * Los números de `GLASS` son los de `styles/ventana/tokens.css`:
 * `tests/ventana-tokens.test.ts` los compara uno a uno. Puro: sin DOM y sin
 * imports, sin enums ni propiedades de parámetro (se carga con type-stripping).
 */

export type GlassGrade = "clear" | "thin" | "thick";
export type GlassDensity = "smoked" | "lit";

type Rgb = [number, number, number];

export const GLASS: {
	/** El humo de cada grado: rojo, verde, azul y alfa. */
	smoked: Record<GlassGrade, { smoke: [number, number, number, number] }>;
	/** La atenuación (`brightness`) de cada grado en zona luminosa y su techo. */
	lit: Record<GlassGrade, { dim: number; ceiling: string }>;
	/** El alfa del brillo (blanco) en su punto más fuerte, por densidad. */
	sheen: { smoked: number; lit: number };
	/** El factor de `saturate()` del filtro (180 %). */
	saturate: number;
	ink: string;
	/** El contraste que pide cada grado: el claro sólo lleva íconos. */
	threshold: Record<GlassGrade, number>;
} = {
	smoked: {
		clear: { smoke: [58, 58, 64, 0.64] },
		thin: { smoke: [44, 44, 50, 0.74] },
		thick: { smoke: [32, 32, 37, 0.84] },
	},
	lit: {
		clear: { dim: 0.82, ceiling: "#9d9d9d" },
		thin: { dim: 0.72, ceiling: "#868686" },
		thick: { dim: 0.6, ceiling: "#a0a0a0" },
	},
	sheen: { smoked: 0.06, lit: 0.1 },
	saturate: 1.8,
	ink: "#f5f5f7",
	threshold: { clear: 3, thin: 4.5, thick: 4.5 },
};

function parse(hex: string): Rgb {
	const m = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex);
	if (!m) throw new RangeError(`Color no válido (se espera #rrggbb): ${hex}`);
	return [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)];
}

const byte = (c: number) => Math.min(255, Math.max(0, Math.round(c)));
const toHex = (rgb: Rgb) => "#" + rgb.map((c) => byte(c).toString(16).padStart(2, "0")).join("");
const each = (rgb: Rgb, fn: (c: number) => number): Rgb => [byte(fn(rgb[0])), byte(fn(rgb[1])), byte(fn(rgb[2]))];

/** `saturate(s)` de CSS: la matriz de `feColorMatrix type="saturate"`, en sRGB y recortada a 0..255. */
function saturate([r, g, b]: Rgb, s: number): Rgb {
	return [
		byte((0.213 + 0.787 * s) * r + (0.715 - 0.715 * s) * g + (0.072 - 0.072 * s) * b),
		byte((0.213 - 0.213 * s) * r + (0.715 + 0.285 * s) * g + (0.072 - 0.072 * s) * b),
		byte((0.213 - 0.213 * s) * r + (0.715 - 0.715 * s) * g + (0.072 + 0.928 * s) * b),
	];
}

/** Compone un color con alfa sobre otro opaco. */
const over = (top: Rgb, alpha: number, bottom: Rgb): Rgb => [
	byte(top[0] * alpha + bottom[0] * (1 - alpha)),
	byte(top[1] * alpha + bottom[1] * (1 - alpha)),
	byte(top[2] * alpha + bottom[2] * (1 - alpha)),
];

const WHITE: Rgb = [255, 255, 255];

function luminance(rgb: Rgb): number {
	const [r, g, b] = rgb.map((c) => c / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
	return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** El color que queda bajo el texto de un vidrio de ese grado y densidad con `backdrop` (#rrggbb) detrás. */
export function underGlass(backdrop: string, grade: GlassGrade, density: GlassDensity): string {
	const behind = saturate(parse(backdrop), GLASS.saturate);
	if (density === "lit") {
		const dimmed = each(behind, (c) => c * GLASS.lit[grade].dim);
		return toHex(over(WHITE, GLASS.sheen.lit, dimmed));
	}
	const [r, g, b, alpha] = GLASS.smoked[grade].smoke;
	return toHex(over(WHITE, GLASS.sheen.smoked, over([r, g, b], alpha, behind)));
}

/** El contraste WCAG de `ink` (la tinta del sistema si no se dice otra) contra lo que queda bajo el vidrio. */
export function glassContrast(backdrop: string, grade: GlassGrade, density: GlassDensity, ink: string = GLASS.ink): number {
	const [hi, lo] = [luminance(parse(ink)), luminance(parse(underGlass(backdrop, grade, density)))].sort((a, b) => b - a);
	return (hi + 0.05) / (lo + 0.05);
}

/** ¿Llega la tinta al umbral del grado (3:1 el claro, 4.5:1 el fino y el grueso) con ese color detrás? */
export function passesOnGlass(backdrop: string, grade: GlassGrade, density: GlassDensity): boolean {
	return glassContrast(backdrop, grade, density) >= GLASS.threshold[grade];
}
