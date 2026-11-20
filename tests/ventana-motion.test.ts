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
		expect(css).toMatch(/@media \(prefers-reduced-motion: reduce\)[\s\S]*\.vn-arrive[\s\S]*translate: none/);
	});
});
