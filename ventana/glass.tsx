/**
 * Vidrio, scrim y brillo de Ventana. El vidrio sólo va en lo que flota; el
 * scrim y el brillo son decorativos y se esconden a los lectores de pantalla.
 *
 * El vidrio tiene dos densidades y cuál toca lo decide lo que hay detrás:
 * ahumado (el de por defecto, sobre el video o las imágenes de una persona) y
 * luminoso (sobre fondos que controlamos, dentro de un `Lit`). La cuenta del
 * contraste de las dos está en `glass-contrast.ts`.
 */
import type { ComponentPropsWithoutRef, CSSProperties, ElementType, ReactElement } from "react";
import type { GlassGrade } from "./glass-contrast";

export type { GlassGrade };

type GlassProps<T extends ElementType> = {
	as?: T;
	grade?: GlassGrade;
	solid?: boolean;
	className?: string;
} & Omit<ComponentPropsWithoutRef<T>, "as" | "className">;

const join = (...parts: Array<string | false | undefined>) => parts.filter(Boolean).join(" ");

export function Glass<T extends ElementType = "div">({
	as,
	grade = "thin",
	solid = false,
	className,
	...rest
}: GlassProps<T>): ReactElement {
	const Tag: ElementType = as ?? "div";
	return <Tag {...rest} className={join("vn-glass", `vn-glass--${grade}`, solid && "vn-glass--solid", className)} />;
}

type LitProps<T extends ElementType> = {
	as?: T;
	className?: string;
} & Omit<ComponentPropsWithoutRef<T>, "as" | "className">;

/**
 * Una zona luminosa: todo vidrio de dentro deja pasar el color de lo que tiene
 * detrás en vez de ahumarlo. Sólo añade la clase `vn-lit` (también se puede poner
 * a mano en un elemento propio); las piezas no cambian. Va dentro de la raíz
 * `.vn` o en ella, y sólo sobre fondos que controlamos: antes de envolver una
 * zona, los colores más claros que su fondo enseña bajo el vidrio se prueban con
 * `passesOnGlass` (`glass-contrast.ts`).
 *
 * Siguen ahumados aunque estén dentro: las hojas, los avisos y los paneles que se
 * montan en un portal (son su propia raíz `.vn`), un vidrio dentro de otro, el
 * pulgar del segmentado y lo que flota sobre un `VideoFrame`. Para dejar
 * ahumada otra parte de la zona basta envolverla en un elemento con la clase `vn`.
 */
export function Lit<T extends ElementType = "div">({ as, className, ...rest }: LitProps<T>): ReactElement {
	const Tag: ElementType = as ?? "div";
	return <Tag {...rest} className={join("vn-lit", className)} />;
}

export function Scrim({
	edge = "bottom",
	className,
}: {
	edge?: "top" | "bottom" | "both";
	className?: string;
}): ReactElement {
	return <span aria-hidden="true" className={join("vn-scrim", `vn-scrim--${edge}`, className)} />;
}

/** Como mucho tres luces; las demás se ignoran. */
export function Glow({ colors = [], className }: { colors?: string[]; className?: string }): ReactElement {
	const style: Record<string, string> = {};
	colors.slice(0, 3).forEach((color, i) => {
		style[`--vn-glow-${i + 1}`] = color;
	});
	return (
		<div
			aria-hidden="true"
			className={join("vn-glow", className)}
			data-neutral={colors.length === 0 ? "" : undefined}
			style={style as CSSProperties}
		/>
	);
}
