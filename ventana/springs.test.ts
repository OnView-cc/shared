/**
 * Muelles de Ventana: la curva se calcula en `springs.ts` y `npm run springs`
 * la escribe como `linear()` en `styles/ventana/motion.css` (eso lo prueba
 * `tests/ventana-motion.test.ts`).
 */
import { describe, expect, it } from "vitest";
import { SPRINGS, sampleSpring, springLinear } from "./springs.ts";

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
});
