/**
 * La letra del estilo (spec 2026-11-19-onview-estilos-y-referencias §5.2): la
 * familia es la del kit; el estilo decide el peso, la escala, las mayúsculas y
 * el espaciado. Aparte de los bloques para que el motor la use (cargar la letra
 * al peso de las frases antes de medir) sin importar un bloque.
 */
import type { Face } from "../video/compose";
import type { Style } from "./styles";

/** El peso más grueso de una frase grande con el peso del kit (Arcade). */
export const PHRASE_MAX_WEIGHT = 500;

/** Cuánto crece la letra en cada escala del estilo: `m` es la de siempre. */
export const SCALE: Record<Style["type"]["scale"], number> = { s: 0.55, m: 1, l: 1.25, xl: 1.7 };
/** El espaciado de siempre (el de `.motion-text`): con él no se escribe nada en línea. */
const BASE_TRACKING = -0.025;

/** El peso que tiene la letra más cercano al pedido; en un empate, el más fino. Sin lista, el pedido. */
export function nearestWeight(want: number, weights?: number[]): number {
	if (!weights?.length) return want;
	return [...weights].sort((a, b) => Math.abs(a - want) - Math.abs(b - want) || a - b)[0]!;
}

/** El peso de las frases: Arcade, el del kit hasta 500 (como siempre); un número, el del estilo que tenga la letra. */
export function phraseWeight(type: Pick<Style["type"], "weight">, face: Face): number {
	return type.weight === "kit-500" ? Math.min(face.weight, PHRASE_MAX_WEIGHT) : nearestWeight(type.weight, face.weights);
}

/** Pone en `box` lo que el estilo dice de la letra: mayúsculas y espaciado (sólo si cambian algo). */
export function applyTypeStyle(box: HTMLElement, type: Style["type"]): void {
	if (type.case === "upper") box.style.textTransform = "uppercase";
	if (type.tracking !== BASE_TRACKING) box.style.letterSpacing = `${type.tracking}em`;
}
