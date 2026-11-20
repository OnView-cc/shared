/**
 * Vidrio, scrim y brillo de Ventana. El vidrio sólo va en lo que flota; el
 * scrim y el brillo son decorativos y se esconden a los lectores de pantalla.
 */
import type { ComponentPropsWithoutRef, CSSProperties, ElementType, ReactElement } from "react";

export type GlassGrade = "clear" | "thin" | "thick";

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
