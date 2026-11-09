/**
 * El lápiz graso ámbar del montador sobre la hoja de contactos: un círculo
 * (la toma elegida), una cruz (descartada, pero sigue en la hoja) o una flecha
 * (el orden). Cada trazo es un contorno relleno que empieza pesado y se afina
 * hacia la cola (`grease-paths.ts`), no una línea de grosor uniforme.
 *
 * Es la firma de movimiento de Blue Hour: con `draw`, una máscara recorre el
 * eje de cada trazo y lo descubre en 420ms con la curva de salida del mundo;
 * sin `draw` o con movimiento reducido, aparece ya dibujado y sin máscara.
 * Decoración: oculta a los lectores de pantalla (el estado lo dice quien lo
 * monta, p. ej. `aria-pressed`).
 */
import { useId, useLayoutEffect, useRef, useState } from "react";
import { GREASE_PATHS } from "./grease-paths";

export type GreaseKind = "circle" | "cross" | "arrow";

const VIEWBOX = "0 0 32 32";
const DRAW_MS = 420;
const EASE_OUT = "cubic-bezier(0.23, 1, 0.32, 1)";

function prefersReducedMotion(): boolean {
	return typeof window !== "undefined" && typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function Grease({ kind, draw = false, className = "" }: { kind: GreaseKind; draw?: boolean; className?: string }) {
	const ref = useRef<SVGSVGElement>(null);
	// useId trae caracteres que una referencia url(#…) de SVG no admite.
	const maskId = `grease${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
	const [reduced] = useState(prefersReducedMotion);
	const animated = draw && !reduced;
	const strokes = GREASE_PATHS[kind];

	useLayoutEffect(() => {
		if (!animated) return;
		const axes = [...(ref.current?.querySelectorAll("mask path") ?? [])] as SVGPathElement[];
		axes.forEach((axis, i) => {
			const length = typeof axis.getTotalLength === "function" ? axis.getTotalLength() : 120;
			axis.style.strokeDasharray = `${length}`;
			if (typeof axis.animate !== "function") return;
			axis.animate([{ strokeDashoffset: length }, { strokeDashoffset: 0 }], {
				duration: DRAW_MS / axes.length,
				delay: (i * DRAW_MS) / axes.length,
				easing: EASE_OUT,
				fill: "backwards",
			});
		});
	}, [animated, kind]);

	return (
		<svg ref={ref} viewBox={VIEWBOX} preserveAspectRatio="none" className={`sk-grease ${className}`} data-grease={kind} aria-hidden="true">
			{animated && (
				<defs>
					<mask id={maskId} maskUnits="userSpaceOnUse" x="-4" y="-4" width="40" height="40">
						{strokes.map((s) => (
							<path key={s.axis} d={s.axis} fill="none" stroke="#fff" strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />
						))}
					</mask>
				</defs>
			)}
			<g mask={animated ? `url(#${maskId})` : undefined}>
				{strokes.map((s) => (
					<path key={s.fill} d={s.fill} fill="currentColor" data-grease-mark="" />
				))}
			</g>
		</svg>
	);
}
