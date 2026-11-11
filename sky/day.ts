/**
 * El documento entero lleva el casi negro del mundo Feed vertical mientras se
 * ve una página de OnView: el fondo de `<html>` (lo que asoma en el
 * rebote del scroll) y el color de la barra del navegador. Lo devuelve como
 * estaba al salir. Lo llaman el marco del sitio y de la puerta de onview y el
 * marco de consola.
 */
import { useEffect } from "react";

export const GROUND = "#0a0a0b";
/** Dentro de la app (consolas, cuenta, admin) el mismo casi negro que fuera. */
export const INSIDE_GROUND = GROUND;

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
