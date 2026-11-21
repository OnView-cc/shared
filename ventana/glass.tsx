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
 * pulgar del segmentado y lo que va dentro de un `VideoFrame`. El sistema sólo
 * sabe que algo es contenido de una persona cuando va dentro de un `VideoFrame`:
 * cualquier otra imagen o video de una persona dentro de una zona luminosa
 * necesita un envoltorio con la clase `vn`, que devuelve al ahumado todo lo que
 * lleva dentro.
 *
 * La garantía del luminoso depende de que el vidrio VEA su fondo: la atenuación es
 * el `backdrop-filter`. Un antepasado entre el vidrio y el fondo con `opacity`
 * menor que 1, `filter`, `mask`, `clip-path`, `mix-blend-mode` (o `will-change` de
 * alguna) aísla lo de detrás: se pierde la atenuación, se queda la escarcha y el
 * texto cae a unos 3.1:1 en el fino y 2.4:1 en el grueso con el fondo en el
 * techo. Se anima la propia pieza de vidrio, nunca un envoltorio; o ese contenido
 * se envuelve en `.vn` para volver al ahumado.
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
