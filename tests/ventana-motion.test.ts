/**
 * `styles/ventana/motion.css` (generado por `npm run springs`) al día con
 * `ventana/springs.ts`, y su bloque de movimiento reducido.
 */
import { readdirSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { SPRINGS, springLinear } from "../ventana/springs";

// Los finales de línea se normalizan: con core.autocrlf el árbol de trabajo puede venir con CRLF.
const lf = (text: string) => text.replace(/\r\n/g, "\n");
const css = lf(readFileSync(new URL("../styles/ventana/motion.css", import.meta.url), "utf8"));

describe("motion.css de Ventana", () => {
	it("está al día con springs.ts", () => {
		for (const k of ["soft", "snap"] as const) {
			const { easing, durationMs } = springLinear(SPRINGS[k]);
			expect(css).toContain(`--vn-spring-${k}: ${easing};`);
			expect(css).toContain(`--vn-spring-${k}-ms: ${durationMs}ms;`);
		}
		expect(css).toContain("--vn-ease-out: cubic-bezier(0.32, 0.72, 0, 1);");
	});

	/** El cuerpo de `selector { ... }` a nivel raíz o dentro de un bloque. */
	const body = (from: string, selector: string) => from.match(new RegExp(`(?:^|\\n)\\t*${selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")} \\{([^}]*)\\}`))?.[1] ?? "";
	const reduced = css.slice(css.indexOf("@media (prefers-reduced-motion: reduce)"));
	const base = css.slice(0, css.indexOf("@media (prefers-reduced-motion: reduce)"));

	it("la llegada es una animación de fotogramas, no una transición: no choca con la transición de ninguna pieza", () => {
		const arrive = body(base, ".vn-arrive");
		expect(arrive).toMatch(/animation: vn-arrive var\(--vn-spring-soft-ms\) var\(--vn-spring-soft\) backwards;/);
		expect(arrive).toMatch(/animation-delay: calc\(var\(--vn-i, 0\) \* 60ms\);/);
		expect(arrive).not.toMatch(/transition/);
		// Parte de abajo, un poco más chica y desenfocada, y llega al reposo de la pieza
		const from = css.match(/@keyframes vn-arrive \{\s*from \{([^}]*)\}\s*\}/)?.[1] ?? "";
		expect(from).toMatch(/opacity: 0;/);
		expect(from).toMatch(/translate: 0 10px;/);
		expect(from).toMatch(/scale: 0\.96;/);
		expect(from).toMatch(/filter: blur\(6px\);/);
		// Ni `@starting-style` ni la regla especial de las dos clases juntas: ya no hacen falta
		expect(css).not.toMatch(/@starting-style/);
		expect(css).not.toMatch(/\.vn-arrive\.vn-press/);
	});

	it("con movimiento reducido la llegada es sólo un fundido, sin escalonado, y la pulsación no se hunde", () => {
		expect(body(reduced, ".vn-arrive")).toMatch(/animation: vn-arrive-fade 200ms linear backwards;\s*animation-delay: 0ms;/);
		const fade = css.match(/@keyframes vn-arrive-fade \{\s*from \{([^}]*)\}\s*\}/)?.[1] ?? "";
		expect(fade.trim()).toBe("opacity: 0;");
		expect(reduced).toMatch(/\.vn-press \{\s*transition: none;/);
		expect(reduced).toMatch(/\.vn-press:active \{\s*scale: 1;/);
	});

	it("la llegada y la pulsación conviven en la misma pieza: la una anima, la otra transiciona", () => {
		expect(body(base, ".vn-press")).toMatch(/^\s*transition: scale var\(--vn-spring-snap-ms\) var\(--vn-spring-snap\);\s*$/);
		expect(body(base, ".vn-press")).not.toMatch(/animation/);
	});

	it("en reposo la llegada no deja filtro ni opacidad: sin `forwards`, al acabar la pieza vuelve a sus propios valores", () => {
		// Un filtro o una opacidad que se quedaran harían de la pieza la raíz del fondo de sus hijos de vidrio
		expect(body(base, ".vn-arrive")).not.toMatch(/forwards|both|filter|opacity/);
	});

	it("ninguna otra hoja de Ventana anima ni reinicia `.vn-arrive`: la llegada es sólo de motion.css", () => {
		const dir = new URL("../styles/ventana/", import.meta.url);
		const others = readdirSync(dir)
			.filter((f) => f.endsWith(".css") && f !== "motion.css")
			.map((f) => lf(readFileSync(new URL(f, dir), "utf8")).replace(/\/\*[\s\S]*?\*\//g, ""));
		expect(others.length).toBeGreaterThan(4);
		for (const sheet of others) expect(sheet).not.toMatch(/vn-arrive/);
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
