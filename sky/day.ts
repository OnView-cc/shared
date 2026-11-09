/**
 * El documento entero lleva la tinta del borde de película de Blue Hour
 * mientras se ve una página del mundo: el fondo de `<html>` (lo que asoma en el
 * rebote del scroll) y el color de la barra del navegador. Lo devuelve como
 * estaba al salir. Lo llaman el marco del sitio y de la puerta de onview y el
 * marco de consola.
 */
import { useEffect } from "react";

export const GROUND = "#0a1124";
/** El suelo de dentro de la app: la tinta neutra del editor (`.site.sk` en `sky.css`). */
export const INSIDE_GROUND = "#0e0f11";

export function useDayDocument(ground: string = GROUND): void {
	useEffect(() => {
		const root = document.documentElement;
		const previous = root.style.backgroundColor;
		const meta = document.querySelector('meta[name="theme-color"]');
		const previousTheme = meta?.getAttribute("content") ?? null;
		root.style.backgroundColor = ground;
		meta?.setAttribute("content", ground);
		return () => {
			root.style.backgroundColor = previous;
			if (meta && previousTheme) meta.setAttribute("content", previousTheme);
		};
	}, [ground]);
}
