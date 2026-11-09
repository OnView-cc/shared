/**
 * El lápiz graso ámbar del montador sobre la hoja de contactos: un círculo
 * (la toma elegida), una cruz (descartada, pero sigue en la hoja) o una flecha
 * (el orden). Es la firma de movimiento de Blue Hour: con `draw`, el trazo se
 * dibuja en 420ms con la curva de salida del mundo; sin `draw` o con
 * movimiento reducido, aparece ya dibujado. Decoración: oculta a los lectores
 * de pantalla (el estado lo dice quien lo monta, p. ej. `aria-pressed`).
 */
import { useLayoutEffect, useRef } from "react";
import { MARK } from "./mark";

export type GreaseKind = "circle" | "cross" | "arrow";

const PATHS: Record<GreaseKind, { viewBox: string; d: string[] }> = {
	circle: { viewBox: MARK.viewBox, d: [MARK.grease.d] },
	cross: { viewBox: "0 0 32 32", d: ["M6.5 7.2C12 12.6 19.4 19.8 25.6 25.4", "M25.1 6.4C18.7 12.2 12.8 18.9 7 25.8"] },
	arrow: { viewBox: "0 0 32 32", d: ["M4 17.6C11.2 16.4 19 15.8 27.2 15.6", "M21.6 10.4C23.8 12.4 25.7 14 27.4 15.6C25.4 17.2 23.4 19 21.2 21"] },
};

const DRAW_MS = 420;
const EASE_OUT = "cubic-bezier(0.23, 1, 0.32, 1)";

function prefersReducedMotion(): boolean {
	return typeof window !== "undefined" && typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function Grease({ kind, draw = false, className = "" }: { kind: GreaseKind; draw?: boolean; className?: string }) {
	const ref = useRef<SVGSVGElement>(null);
	const { viewBox, d } = PATHS[kind];

	useLayoutEffect(() => {
		if (!draw || prefersReducedMotion()) return;
		const paths = [...(ref.current?.querySelectorAll("path") ?? [])];
		paths.forEach((path, i) => {
			if (typeof path.animate !== "function") return;
			const length = typeof path.getTotalLength === "function" ? path.getTotalLength() : 120;
			path.style.strokeDasharray = `${length}`;
			path.animate([{ strokeDashoffset: length }, { strokeDashoffset: 0 }], { duration: DRAW_MS / paths.length, delay: (i * DRAW_MS) / paths.length, easing: EASE_OUT, fill: "backwards" });
		});
	}, [draw, kind]);

	return (
		<svg ref={ref} viewBox={viewBox} preserveAspectRatio="none" className={`sk-grease ${className}`} data-grease={kind} aria-hidden="true">
			{d.map((path) => (
				<path key={path} d={path} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
			))}
		</svg>
	);
}
