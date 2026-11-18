/**
 * Qué pone la marca en un video (specs 2026-11-12 §5 y 2026-11-14 §4): la
 * marca del kit, la versión de su logo en la esquina y en el cierre, y la
 * tipografía. Son las mismas reglas para el editor y para la exportación, sin
 * tipos de la app: `L` es lo que sea un logo para quien llama (una URL en el
 * navegador, una clave del almacén en el servidor).
 *
 * 1. La marca: la que el video eligió; si no eligió, o ya no está en el kit, la
 *    de por defecto; sin ninguna marcada, la primera.
 * 2. La versión: en la esquina, la que el video eligió o, si no eligió, la de
 *    fondos oscuros; en el cierre la decide el color de cierre del kit (claro →
 *    la de fondos claros) y la elección del video no manda.
 * 3. Si esa versión falta, sale la otra. Una marca sin ninguna no pone logo.
 * 4. La tipografía: la que el video eligió de su kit; si no, la de por defecto
 *    del kit; si no, la primera; sin tipografías, Bricolage a 600.
 */
import { DEFAULT_FACE, type Face } from "./compose";

export type LogoVersion = "on_dark" | "on_light";

/** Una marca del kit, con su logo para fondos oscuros y para fondos claros. */
export interface MarkLike<L> {
	id: string;
	isDefault: boolean;
	onDark: L | null;
	onLight: L | null;
}

/** Lo que un video eligió de su kit: la marca y la versión del logo de la esquina. */
export interface LogoChoice {
	markId?: string | null;
	version?: LogoVersion | null;
}

/** Un color `#rrggbb` es claro si el negro contrasta mejor con él que el blanco (luminancia relativa WCAG por encima de 0.179). */
export function isLightColor(hex: string): boolean {
	const match = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex);
	if (!match) return false;
	const [r, g, b] = match.slice(1).map((part) => {
		const c = parseInt(part, 16) / 255;
		return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
	}) as [number, number, number];
	return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.179;
}

/** La versión del logo que pide un cierre de ese color: sobre claro, la de fondos claros; si no, la de fondos oscuros. */
export const closingVersion = (closingColor: string | null | undefined): LogoVersion => (closingColor && isLightColor(closingColor) ? "on_light" : "on_dark");

/** La marca que lleva un video: la elegida, la de por defecto del kit o, sin ninguna marcada, la primera. */
export function pickMark<M extends { id: string; isDefault: boolean }>(marks: M[], markId?: string | null): M | null {
	return (markId ? marks.find((m) => m.id === markId) : undefined) ?? marks.find((m) => m.isDefault) ?? marks[0] ?? null;
}

/** El logo de una marca en la versión pedida; si falta, en la otra. */
export function pickLogo<L>(mark: Pick<MarkLike<L>, "onDark" | "onLight"> | null, want: LogoVersion): L | null {
	if (!mark) return null;
	return want === "on_dark" ? (mark.onDark ?? mark.onLight) : (mark.onLight ?? mark.onDark);
}

/** Los logos de un video: el de la esquina de las escenas, el del cierre y el de fondos claros (el fondo de los templates). */
export function pickLogos<L>(marks: MarkLike<L>[], pick: LogoChoice, closingColor: string | null | undefined): { scene: L | null; closing: L | null; light: L | null } {
	const mark = pickMark(marks, pick.markId);
	return { scene: pickLogo(mark, pick.version ?? "on_dark"), closing: pickLogo(mark, closingVersion(closingColor)), light: pickLogo(mark, "on_light") };
}

/** La tipografía que toca en un video: la elegida, la de por defecto del kit, la primera o Bricolage a 600. */
export function pickFont<A extends Face, F extends { id: string; isDefault: boolean; primary: A; secondary: A }>(fonts: F[], fontId?: string | null): { primary: A | Face; secondary: A | Face } {
	const font = (fontId ? fonts.find((f) => f.id === fontId) : undefined) ?? fonts.find((f) => f.isDefault) ?? fonts[0];
	return font ? { primary: font.primary, secondary: font.secondary } : { primary: DEFAULT_FACE, secondary: DEFAULT_FACE };
}
