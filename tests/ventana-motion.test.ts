/**
 * `styles/ventana/motion.css` (generado por `npm run springs`) al día con
 * `ventana/springs.ts`, y su bloque de movimiento reducido.
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { SPRINGS, springLinear } from "../ventana/springs";

const css = readFileSync(new URL("../styles/ventana/motion.css", import.meta.url), "utf8");

describe("motion.css de Ventana", () => {
	it("está al día con springs.ts", () => {
		for (const k of ["soft", "snap"] as const) {
			const { easing, durationMs } = springLinear(SPRINGS[k]);
			expect(css).toContain(`--vn-spring-${k}: ${easing};`);
			expect(css).toContain(`--vn-spring-${k}-ms: ${durationMs}ms;`);
		}
		expect(css).toContain("--vn-ease-out: cubic-bezier(0.32, 0.72, 0, 1);");
	});

	it("con movimiento reducido no hay desplazamiento ni escala", () => {
		const reduced = css.slice(css.indexOf("@media (prefers-reduced-motion: reduce)"));
		expect(reduced).toMatch(/\.vn-arrive \{\s*transition: opacity 200ms linear;\s*transition-delay: 0ms;\s*@starting-style \{\s*opacity: 0;\s*translate: none;\s*scale: 1;\s*filter: none;/);
		expect(reduced).toMatch(/\.vn-press \{\s*transition: none;/);
		expect(reduced).toMatch(/\.vn-press:active \{\s*scale: 1;/);
	});

	it("la llegada y la pulsación conviven en la misma pieza, también con movimiento reducido", () => {
		const both = css.match(/\n\.vn-arrive\.vn-press \{([^}]*)\}/)?.[1] ?? "";
		for (const part of ["opacity var(--vn-spring-soft-ms)", "translate var(--vn-spring-soft-ms) var(--vn-spring-soft)", "scale var(--vn-spring-snap-ms) var(--vn-spring-snap)", "filter var(--vn-spring-soft-ms)"]) {
			expect(both).toContain(part);
		}
		// Va después de las dos reglas sueltas: con la misma especificidad no ganaría
		expect(css.indexOf("\n.vn-arrive.vn-press {")).toBeGreaterThan(css.indexOf("\n.vn-press {"));
		const reduced = css.slice(css.indexOf("@media (prefers-reduced-motion: reduce)"));
		expect(reduced).toMatch(/\.vn-arrive\.vn-press \{\s*transition: opacity 200ms linear;/);
	});

	it("en reposo la llegada no deja filtro: un filtro haría de la pieza la raíz del fondo de sus hijos de vidrio", () => {
		const rest = css.match(/\n\.vn-arrive \{([^@]*)@starting-style/)?.[1] ?? "";
		expect(rest).toMatch(/filter: none;/);
		expect(rest).not.toMatch(/blur\(/);
	});

	it("el suave llega al 95 % dentro de lo que dura una hoja (200 a 500 ms) y el vivo dentro de lo que dura un menú (150 a 250 ms)", () => {
		const t95 = (k: "soft" | "snap") => {
			const points = springLinear(SPRINGS[k]).easing.slice(7, -1).split(", ").map(Number);
			return (points.findIndex((p) => p >= 0.95) / 60) * 1000;
		};
		expect(t95("soft")).toBeGreaterThanOrEqual(200);
		expect(t95("soft")).toBeLessThanOrEqual(350);
		expect(t95("snap")).toBeGreaterThanOrEqual(150);
		expect(t95("snap")).toBeLessThanOrEqual(250);
	});

	it("el suave no rebasa a la vista: una hoja pegada abajo no enseña una rendija", () => {
		const points = springLinear(SPRINGS.soft).easing.slice(7, -1).split(", ").map(Number);
		expect(Math.max(...points)).toBeLessThanOrEqual(1.001);
	});
});
