/**
 * Muelles de Ventana: la curva se calcula en `springs.ts` y `npm run springs`
 * la escribe como `linear()` en `styles/ventana/motion.css`.
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { SPRINGS, sampleSpring, springLinear } from "./springs.ts";

const css = readFileSync(new URL("../styles/ventana/motion.css", import.meta.url), "utf8");

describe("muelles", () => {
	it.each(["soft", "snap"] as const)("%s empieza en 0, acaba en 1 y se asienta", (k) => {
		const { points, duration } = sampleSpring(SPRINGS[k]);
		expect(points[0]).toBe(0);
		expect(points.at(-1)).toBe(1);
		expect(duration).toBeGreaterThan(0.2);
		expect(duration).toBeLessThan(1.2);
	});

	it("el suave rebasa poco y el vivo algo más, nunca un rebote", () => {
		expect(Math.max(...sampleSpring(SPRINGS.soft).points)).toBeLessThanOrEqual(1.02);
		const snap = Math.max(...sampleSpring(SPRINGS.snap).points);
		expect(snap).toBeGreaterThan(1);
		expect(snap).toBeLessThanOrEqual(1.06);
	});

	it("springLinear da un linear() válido y su duración en ms", () => {
		const { easing, durationMs } = springLinear(SPRINGS.soft);
		expect(easing).toMatch(/^linear\(0, [\d., ]+, 1\)$/);
		expect(Number.isInteger(durationMs)).toBe(true);
	});

	it("motion.css está al día con springs.ts", () => {
		for (const k of ["soft", "snap"] as const) {
			const { easing, durationMs } = springLinear(SPRINGS[k]);
			expect(css).toContain(`--vn-spring-${k}: ${easing};`);
			expect(css).toContain(`--vn-spring-${k}-ms: ${durationMs}ms;`);
		}
		expect(css).toContain("--vn-ease-out: cubic-bezier(0.32, 0.72, 0, 1);");
	});

	it("con movimiento reducido no hay desplazamiento ni escala", () => {
		expect(css).toMatch(/@media \(prefers-reduced-motion: reduce\)[\s\S]*\.vn-arrive[\s\S]*translate: none/);
	});
});
