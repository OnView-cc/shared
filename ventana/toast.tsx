/**
 * Los avisos de Ventana, sobre sonner, con el mismo juego de iconos que
 * `ui/sonner.tsx`. Cada aviso es vidrio grueso: sonner lo monta fuera de cualquier
 * `.vn`, así que el propio `<li>` lleva `vn vn-toast vn-glass vn-glass--thick`.
 *
 * `unstyled: true` es lo que deja pasar el material. Sin él, sonner pinta cada aviso
 * con `[data-sonner-toast][data-styled="true"]` (0,2,0: fondo, borde, color, radio,
 * sombra, relleno, ancho, tamaño de letra), que pesa más que `.vn-glass` (0,1,0) y
 * se llevaría el vidrio y sus respaldos. Con `unstyled`, `data-styled` es `false` y
 * sonner conserva sólo la mecánica (posición, apilado, transformaciones, gestos); la
 * maqueta y el color los pone `styles/ventana/overlays.css`. Los estilos en línea de
 * sonner son únicamente variables propias (`--index`, `--offset`, `--z-index`...).
 * Los botones de acción y de cancelar reutilizan los botones de Ventana.
 *
 * `theme="dark"` va fijo: Ventana es de un solo tema.
 */
import { CircleCheckIcon, InfoIcon, Loader2Icon, OctagonXIcon, TriangleAlertIcon } from "lucide-react";
import type { ReactElement } from "react";
import { Toaster as Sonner, type ToasterProps } from "sonner";

const base = {
	toast: "vn vn-toast vn-glass vn-glass--thick",
	content: "vn-toast__content",
	title: "vn-toast__title",
	description: "vn-toast__desc",
	icon: "vn-toast__icon",
	actionButton: "vn-btn vn-btn--primary vn-btn--sm vn-press",
	cancelButton: "vn-btn vn-btn--plain vn-btn--sm vn-press",
};

type ClassNames = NonNullable<NonNullable<ToasterProps["toastOptions"]>["classNames"]>;

/** Las clases del sistema primero; las del consumidor se suman, no las sustituyen. */
function mergeClassNames(extra: ClassNames | undefined): ClassNames {
	const out: Record<string, string> = { ...base };
	for (const [key, value] of Object.entries(extra ?? {})) if (value) out[key] = out[key] ? `${out[key]} ${value}` : value;
	return out as ClassNames;
}

export function Toaster({ toastOptions, ...props }: ToasterProps): ReactElement {
	return (
		<Sonner
			theme="dark"
			icons={{
				success: <CircleCheckIcon className="size-4" />,
				info: <InfoIcon className="size-4" />,
				warning: <TriangleAlertIcon className="size-4" />,
				error: <OctagonXIcon className="size-4" />,
				loading: <Loader2Icon className="size-4 animate-spin" />,
			}}
			toastOptions={{ ...toastOptions, unstyled: true, classNames: mergeClassNames(toastOptions?.classNames) }}
			{...props}
		/>
	);
}
