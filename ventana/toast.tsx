/**
 * Los avisos de Ventana, sobre sonner, con el mismo juego de iconos que
 * `ui/sonner.tsx`. Cada aviso es vidrio grueso: sonner lo monta fuera de cualquier
 * `.vn`, así que el propio `<li>` lleva `vn vn-toast vn-glass vn-glass--thick`.
 *
 * `unstyled: true` es lo que deja pasar el material. Sin él, sonner pinta cada aviso
 * con `[data-sonner-toast][data-styled="true"]` (fondo, borde, color, radio, sombra,
 * relleno, ancho, tamaño de letra) y se llevaría el vidrio y sus respaldos. Con
 * `unstyled`, `data-styled` es `false` y sonner conserva sólo la mecánica (posición,
 * apilado, transformaciones, gestos); la maqueta y el color los pone
 * `styles/ventana/overlays.css`. Los estilos en línea de sonner son únicamente
 * variables propias (`--index`, `--offset`, `--z-index`...). Los botones de acción y
 * de cancelar reutilizan los botones de Ventana.
 *
 * La hoja de sonner se inyecta SIN capa y Ventana se importa en `@layer components`:
 * frente a ella la especificidad no cuenta (lo sin capa gana a lo que tiene capa).
 * Lo poco de sonner que no depende de `data-styled` y cae en lo que Ventana pinta
 * (el `outline: none` y la sombra del aviso enfocado, el color de la descripción en
 * el tema oscuro) se gana en `overlays.css` con `!important`; ver su comentario.
 *
 * La opción `closeButton` de sonner no se admite en esta versión: en `unstyled` saldría sin piel
 * y Ventana no tiene todavía un aspa de aviso. Los colores ricos (`richColors`) tampoco: pintan
 * fondo y borde sin pasar por `data-styled` y se llevarían el vidrio, así que `Toaster` los
 * apaga y un aviso no debe pedirlos con `toast(..., { richColors: true })`. Los iconos se
 * dimensionan y giran con el CSS de Ventana (`.vn-toast__icon`), no con clases de Tailwind.
 *
 * `theme="dark"` y `richColors={false}` van fijos, después de las props del consumidor: Ventana
 * es de un solo tema y nadie los puede cambiar.
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
			icons={{
				success: <CircleCheckIcon />,
				info: <InfoIcon />,
				warning: <TriangleAlertIcon />,
				error: <OctagonXIcon />,
				loading: <Loader2Icon className="vn-toast__spin" />,
			}}
			{...props}
			theme="dark"
			richColors={false}
			toastOptions={{ ...toastOptions, unstyled: true, classNames: mergeClassNames(toastOptions?.classNames) }}
		/>
	);
}
