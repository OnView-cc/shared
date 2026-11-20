/** Las marcas de Ventana como datos: «Dos capas» (OnView) y «El prisma» (Iris). Sin Node ni DOM. */
import { describe, expect, it } from "vitest";
import { MARK, MARK_COLORS, markSvg } from "./mark";
import { AI_MARK, AI_NAME, AI_SPECTRUM, aiMarkSvg, spectrumAt } from "./ai-mark";

describe("markSvg «Dos capas»", () => {
	it("son exactamente dos rect, planos, del color del tono", () => {
		for (const [tone, color] of [["night", "#f5f5f7"], ["paper", "#060607"]] as const) {
			const svg = markSvg(tone);
			expect(svg.match(/<rect/g)).toHaveLength(2);
			expect(svg).toContain(color);
			expect(MARK_COLORS[tone]).toBe(color);
			expect(svg).not.toMatch(/Gradient/);
		}
	});

	it("los dos marcos miden 9:16 y caben en el lienzo", () => {
		const [, , vw, vh] = MARK.viewBox.split(" ").map(Number);
		for (const f of [MARK.back, MARK.front]) {
			expect(f.w / f.h).toBeGreaterThan(0.5625 - 0.001);
			expect(f.w / f.h).toBeLessThan(0.5625 + 0.001);
			expect(f.x).toBeGreaterThanOrEqual(0);
			expect(f.y).toBeGreaterThanOrEqual(0);
			expect(f.x + f.w).toBeLessThanOrEqual(vw);
			expect(f.y + f.h).toBeLessThanOrEqual(vh);
		}
	});

	it("el marco de atrás es más tenue y el de delante macizo, y se solapan sin taparse", () => {
		expect(MARK.back.opacity).toBeLessThan(1);
		expect(MARK.front.x).toBeGreaterThan(MARK.back.x);
		expect(MARK.front.x).toBeLessThan(MARK.back.x + MARK.back.w);
	});

	it("es un svg autónomo cuadrado al tamaño pedido, sin texto", () => {
		const svg = markSvg("night", 64);
		expect(svg.startsWith("<svg")).toBe(true);
		expect(svg).toContain('xmlns="http://www.w3.org/2000/svg"');
		expect(svg).toContain('width="64" height="64"');
		expect(svg).not.toMatch(/<text/);
	});
});

describe("Iris «El prisma»", () => {
	it("se llama Iris", () => {
		expect(AI_NAME).toBe("Iris");
	});

	it("spectrumAt es cíclico y devuelve hex de 7 caracteres", () => {
		expect(spectrumAt(0)).toBe("#ffb35c");
		expect(spectrumAt(1)).toBe(spectrumAt(0));
		expect(spectrumAt(-0.25)).toBe(spectrumAt(0.75));
		expect(spectrumAt(0.37)).toMatch(/^#[0-9a-f]{6}$/);
		// En cada parada vecina exacta devuelve la parada
		AI_SPECTRUM.forEach((c, i) => expect(spectrumAt(i / AI_SPECTRUM.length)).toBe(c));
	});

	it("en color: 24 sectores con al menos 12 colores distintos y el núcleo", () => {
		const svg = aiMarkSvg("night");
		expect(svg.match(/<path/g)).toHaveLength(AI_MARK.ring.segments);
		expect(AI_MARK.ring.segments).toBe(24);
		expect(new Set(svg.match(/fill="#[0-9a-f]{6}"/g)).size).toBeGreaterThanOrEqual(12);
		expect(svg.match(/<circle/g)).toHaveLength(1);
		expect(svg).toContain(`r="${AI_MARK.core.r}"`);
	});

	it("el núcleo es blanco de noche y del papel sobre papel", () => {
		expect(aiMarkSvg("night")).toMatch(/<circle [^>]*fill="#f5f5f7"/);
		expect(aiMarkSvg("paper")).toMatch(/<circle [^>]*fill="#060607"/);
	});

	it("mono: ningún color del espectro, el punto y un aro al 40 %", () => {
		for (const tone of ["night", "paper"] as const) {
			const svg = aiMarkSvg(tone, { mono: true });
			for (const c of AI_SPECTRUM) expect(svg.toLowerCase()).not.toContain(c);
			expect(svg).not.toMatch(/<path/);
			expect(svg.match(/<circle/g)).toHaveLength(2);
			expect(svg).toContain('opacity="0.4"');
		}
	});

	it("es un svg autónomo al tamaño pedido", () => {
		const svg = aiMarkSvg("night", { size: 48 });
		expect(svg).toContain('width="48" height="48"');
		expect(svg).toContain('viewBox="0 0 24 24"');
	});
});
