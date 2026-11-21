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
 * El modelo sigue a `styles/ventana/glass.css`, capa a capa y de abajo arriba: el
 * fondo saturado por el filtro (`saturate`, que deja igual los grises y aviva los
 * colores: un naranja queda más claro de lo que era), después atenuado
 * (`brightness`, sólo en el luminoso), con la capa plana encima (la escarcha en
 * el luminoso, el humo en el ahumado) y, arriba, el brillo en su punto más fuerte.
 *
 * **Es una cota, no una simulación**: lo que devuelve nunca es más oscuro que lo
 * que pinta un navegador, para no prometer de más.
 *
 * - Cada capa se redondea HACIA ARRIBA al nivel entero (un navegador redondea al
 *   más cercano, o no redondea).
 * - Entre `saturate()` y `brightness()` no se recorta: un canal que la saturación
 *   saca de rango (el rojo de un rojo puro llega a 335) se atenúa tal cual, y sólo
 *   al final del filtro se recorta a 0..255. Un motor que recorte entre los dos
 *   pasos (Chrome lo hace) da un resultado igual o más oscuro; uno que no, éste.
 * - El desenfoque no se cuenta, a propósito: desenfocar promedia colores, así que
 *   el peor caso es el color más claro sin desenfocar.
 * - `passesOnGlass` añade una holgura: prueba el fondo `GLASS.margin` niveles más
 *   claro por canal. Son 2 niveles de fondo, que cubrieron el exceso medido en la
 *   salida en tres colores (no se igualan a lo que midió el navegador). Para
 *   decidir si un fondo vale se usa `passesOnGlass`, no una comparación a mano
 *   con `glassContrast`.
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
	/**
	 * La atenuación (`brightness`) de cada grado en zona luminosa y su techo: el
	 * gris neutro más claro que pasa `passesOnGlass`, es decir, con la holgura puesta.
	 */
	lit: Record<GlassGrade, { dim: number; ceiling: string }>;
	/** El alfa de la escarcha: el blanco muy tenue que el luminoso lleva en toda la lámina donde el ahumado lleva el humo. */
	frost: number;
	/** El alfa del brillo (blanco) en su punto más fuerte, por densidad. */
	sheen: { smoked: number; lit: number };
	/** El factor de `saturate()` del filtro, por densidad: 180 % el ahumado, 140 % el luminoso. */
	saturate: { smoked: number; lit: number };
	/** La holgura de `passesOnGlass`: cuántos niveles más claro, por canal, se prueba el fondo. */
	margin: number;
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
		clear: { dim: 0.8, ceiling: "#949494" },
		thin: { dim: 0.7, ceiling: "#777777" },
		thick: { dim: 0.58, ceiling: "#909090" },
	},
	frost: 0.06,
	sheen: { smoked: 0.06, lit: 0.1 },
	saturate: { smoked: 1.8, lit: 1.4 },
	margin: 2,
	ink: "#f5f5f7",
	threshold: { clear: 3, thin: 4.5, thick: 4.5 },
};

function parse(hex: string): Rgb {
	const m = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex);
	if (!m) throw new RangeError(`Color no válido (se espera #rrggbb): ${hex}`);
	return [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)];
}

/**
 * Un canal como nivel entero de 0 a 255, redondeado hacia arriba. El pellizco
 * evita que el ruido de la coma flotante suba un valor exacto (130 × 0.7 es 91,
 * no 92).
 */
const up = (c: number) => Math.min(255, Math.max(0, Math.ceil(c - 1e-9)));
const toHex = (rgb: Rgb) => "#" + rgb.map((c) => c.toString(16).padStart(2, "0")).join("");

/**
 * `saturate(s)` de CSS: la matriz de `feColorMatrix type="saturate"`, en sRGB.
 * SIN recortar: los canales pueden salir de 0..255, y así pasan al paso siguiente.
 */
function saturate([r, g, b]: Rgb, s: number): Rgb {
	return [
		(0.213 + 0.787 * s) * r + (0.715 - 0.715 * s) * g + (0.072 - 0.072 * s) * b,
		(0.213 - 0.213 * s) * r + (0.715 + 0.285 * s) * g + (0.072 - 0.072 * s) * b,
		(0.213 - 0.213 * s) * r + (0.715 - 0.715 * s) * g + (0.072 + 0.928 * s) * b,
	];
}

/** Compone un color con alfa sobre otro opaco, hacia arriba. */
const over = (top: Rgb, alpha: number, bottom: Rgb): Rgb => [
	up(top[0] * alpha + bottom[0] * (1 - alpha)),
	up(top[1] * alpha + bottom[1] * (1 - alpha)),
	up(top[2] * alpha + bottom[2] * (1 - alpha)),
];

const WHITE: Rgb = [255, 255, 255];

function luminance(rgb: Rgb): number {
	const [r, g, b] = rgb.map((c) => c / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
	return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** La cota, sobre canales ya leídos. */
function under(backdrop: Rgb, grade: GlassGrade, density: GlassDensity): Rgb {
	const dim = density === "lit" ? GLASS.lit[grade].dim : 1;
	// El filtro entero (saturar y, en el luminoso, atenuar) y un solo recorte al final
	const filtered = saturate(backdrop, GLASS.saturate[density]).map((c) => up(c * dim)) as Rgb;
	if (density === "lit") return over(WHITE, GLASS.sheen.lit, over(WHITE, GLASS.frost, filtered));
	const [r, g, b, alpha] = GLASS.smoked[grade].smoke;
	return over(WHITE, GLASS.sheen.smoked, over([r, g, b], alpha, filtered));
}

/**
 * El color que queda bajo el texto de un vidrio de ese grado y densidad con
 * `backdrop` (#rrggbb) detrás, como cota: nunca más oscuro que lo que pinta un
 * navegador. Sin holgura: es la cuenta para ese color exacto.
 */
export function underGlass(backdrop: string, grade: GlassGrade, density: GlassDensity): string {
	return toHex(under(parse(backdrop), grade, density));
}

/**
 * El contraste WCAG de `ink` (la tinta del sistema si no se dice otra) contra lo
 * que queda bajo el vidrio (`underGlass`). Sin holgura: para decidir si un fondo
 * vale, `passesOnGlass`.
 */
export function glassContrast(backdrop: string, grade: GlassGrade, density: GlassDensity, ink: string = GLASS.ink): number {
	const [hi, lo] = [luminance(parse(ink)), luminance(under(parse(backdrop), grade, density))].sort((a, b) => b - a);
	return (hi + 0.05) / (lo + 0.05);
}

/**
 * ¿Llega la tinta al umbral del grado (3:1 el claro, 4.5:1 el fino y el grueso)
 * con ese color detrás? Con holgura: se prueba el fondo `GLASS.margin` niveles
 * más claro por canal, así que un color que pasa aquí pasa también en el
 * navegador aunque el píxel le salga un par de niveles por encima.
 */
export function passesOnGlass(backdrop: string, grade: GlassGrade, density: GlassDensity): boolean {
	const lighter = parse(backdrop).map((c) => Math.min(255, c + GLASS.margin)) as Rgb;
	const [hi, lo] = [luminance(parse(GLASS.ink)), luminance(under(lighter, grade, density))].sort((a, b) => b - a);
	return (hi + 0.05) / (lo + 0.05) >= GLASS.threshold[grade];
}
