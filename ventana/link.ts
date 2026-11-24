/**
 * El enlace que pinta una pieza de Ventana cuando quien la monta tiene un
 * enrutador: `Dock` y `AppFrame` aceptan `linkAs` para que la navegación de la
 * app no recargue la página. Por defecto es un `<a>` normal.
 */
import type { ComponentType, ReactNode } from "react";

export interface LinkLikeProps {
	href: string;
	className?: string;
	children?: ReactNode;
	"aria-current"?: "page";
	"aria-label"?: string;
}

export type LinkLike = ComponentType<LinkLikeProps> | "a";
