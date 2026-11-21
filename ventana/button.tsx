/**
 * Botones en cápsula de Ventana. El texto llega por `children` (y el nombre del
 * ícono por `label`): la pieza no escribe ninguna cadena visible.
 * `glass` y `clear` componen las clases de `Glass` en vez de repetir el material,
 * así los respaldos (transparencia reducida, contraste alto, sin backdrop-filter)
 * siguen funcionando.
 */
import type { ButtonHTMLAttributes, ElementType, ReactElement, ReactNode, Ref } from "react";

export type ButtonVariant = "primary" | "glass" | "plain" | "danger";
/** 44px y 36px de alto; el área de toque del pequeño sigue siendo de 44px. */
export type ButtonSize = "md" | "sm";

type BaseProps = {
	size?: ButtonSize;
	href?: string;
	/** Sólo con `href`: van al `<a>` (abrir en otra pestaña, descargar). Sin `href` no se pintan. */
	target?: string;
	rel?: string;
	download?: boolean | string;
	className?: string;
	/** Llega al elemento que se pinta (el `<button>`, o el `<a>` si hay `href`). */
	ref?: Ref<HTMLButtonElement>;
	children: ReactNode;
} & ButtonHTMLAttributes<HTMLButtonElement>;

const join = (...parts: Array<string | false | undefined>) => parts.filter(Boolean).join(" ");

/** Clases de vidrio según la variante; las demás no llevan material. */
function glassClasses(variant: ButtonVariant | "clear"): string | undefined {
	if (variant === "glass") return "vn-glass vn-glass--thin";
	if (variant === "clear") return "vn-glass vn-glass--clear";
	return undefined;
}

function render(
	{ href, target, rel, download, className, children, type, disabled, onClick, ...rest }: Omit<BaseProps, "size">,
	classes: string,
	shape: "text" | "icon",
): ReactElement {
	const content: ReactNode = shape === "text" ? <span className="vn-btn__label">{children}</span> : children;
	const cls = join(classes, className);
	if (href !== undefined) {
		const Tag = "a" as ElementType;
		// Un enlace no se deshabilita: sin href deja de ser enlace y se anuncia como inactivo.
		// Tampoco deja pasar teclado ni ratón: un enlace inactivo no reacciona.
		const inert = Object.fromEntries(Object.entries(rest).filter(([key]) => !/^on[A-Z]/.test(key)));
		return disabled ? (
			<Tag {...inert} className={cls} aria-disabled="true" tabIndex={-1}>
				{content}
			</Tag>
		) : (
			<Tag {...rest} className={cls} href={href} target={target} rel={rel} download={download === true ? "" : download || undefined} onClick={onClick}>
				{content}
			</Tag>
		);
	}
	return (
		<button {...rest} className={cls} type={type ?? "button"} disabled={disabled} onClick={onClick}>
			{content}
		</button>
	);
}

export function Button({ variant = "primary", size = "md", ...props }: BaseProps & { variant?: ButtonVariant }): ReactElement {
	return render(props, join("vn-btn", `vn-btn--${variant}`, `vn-btn--${size}`, "vn-press", glassClasses(variant)), "text");
}

/** Redondo y sin texto: `label` es su nombre accesible y es obligatorio. */
export function IconButton({
	label,
	variant = "clear",
	size = "md",
	...props
}: Omit<BaseProps, "aria-label"> & { label: string; variant?: ButtonVariant | "clear" }): ReactElement {
	return render(
		{ ...props, "aria-label": label },
		join("vn-btn", "vn-btn--icon", `vn-btn--${variant}`, `vn-btn--${size}`, "vn-press", glassClasses(variant)),
		"icon",
	);
}
