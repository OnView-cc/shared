/** Las marcas de Ventana como datos: «Dos capas» (OnView) y «El prisma» (Iris). Sin Node ni DOM. */
import { describe, expect, it } from "vitest";
import { MARK, MARK_COLORS, markGlassSvg, markSvg } from "./mark";
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
		expect(MARK.back.opacity.night).toBeLessThan(1);
		expect(MARK.back.opacity.paper).toBeLessThan(1);
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
			expect(svg).toMatch(/opacity="0.[45]"/);
		}
	});

	it("es un svg autónomo al tamaño pedido", () => {
		const svg = aiMarkSvg("night", { size: 48 });
		expect(svg).toContain('width="48" height="48"');
		expect(svg).toContain('viewBox="0 0 24 24"');
	});
});

describe("opacidad por tono de las partes translúcidas", () => {
	const GROUND = { night: "#060607", paper: "#f5f5f7" } as const;
	const lin = (c: number) => ((c /= 255) <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
	const rgb = (h: string) => [1, 3, 5].map((o) => parseInt(h.slice(o, o + 2), 16));
	const lum = ([r, g, b]: number[]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
	const blend = (fg: string, bg: string, a: number) => rgb(fg).map((c, i) => c * a + rgb(bg)[i] * (1 - a));
	const contrast = (x: number[], y: number[]) => {
		const [hi, lo] = [lum(x), lum(y)].sort((p, q) => q - p);
		return (hi + 0.05) / (lo + 0.05);
	};

	it("los cuatro valores exactos", () => {
		expect(MARK.back.opacity).toEqual({ night: 0.42, paper: 0.5 });
		expect(AI_MARK.mono.opacity).toEqual({ night: 0.4, paper: 0.5 });
	});

	it.each([
		["el marco de atrás", (t: "night" | "paper") => MARK.back.opacity[t]],
		["el aro plano de Iris", (t: "night" | "paper") => AI_MARK.mono.opacity[t]],
	] as const)("%s llega a 3:1 contra el suelo para el que se diseñó, en los dos tonos", (_n, opacity) => {
		for (const tone of ["night", "paper"] as const) {
			const mixed = blend(MARK_COLORS[tone], GROUND[tone], opacity(tone));
			expect(contrast(mixed, rgb(GROUND[tone])), tone).toBeGreaterThanOrEqual(3);
		}
	});

	it("el svg usa la opacidad de su tono", () => {
		expect(markSvg("paper")).toContain('opacity="0.5"');
		expect(markSvg("night")).toContain('opacity="0.42"');
		expect(aiMarkSvg("paper", { mono: true })).toContain('opacity="0.5"');
		expect(aiMarkSvg("night", { mono: true })).toContain('opacity="0.4"');
	});
});

describe("markGlassSvg, el dibujo de vidrio de «Dos capas»", () => {
	it("son los dos marcos, el de delante en degradado, a 512 por defecto y sin espectro", () => {
		const svg = markGlassSvg();
		expect(svg.match(/<rect /g)).toHaveLength(2);
		expect(svg.match(/<linearGradient /g)).toHaveLength(1);
		expect(svg).toContain('width="512" height="512"');
		expect(svg).toContain(`viewBox="${MARK.viewBox}"`);
		for (const c of AI_SPECTRUM) expect(svg.toLowerCase()).not.toContain(c);
		expect(svg).not.toMatch(/<text/);
	});

	it("respeta el tamaño pedido y la geometría de la marca plana", () => {
		const svg = markGlassSvg(180);
		expect(svg).toContain('width="180" height="180"');
		expect(svg).toContain(`x="${MARK.front.x}" y="${MARK.front.y}"`);
		expect(svg).toContain(`x="${MARK.back.x}" y="${MARK.back.y}"`);
	});
});
