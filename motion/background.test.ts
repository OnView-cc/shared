// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { contrast, DARK_INK, drawBackground, greyOf, inkOn, mix, photoScrim, resolveBackground, skyInk } from "./background";
import type { BackgroundKind, Style } from "./styles";

const kit = (color: string, text = "#ffffff", closing = "#0b1f44") => ({
	face: { family: "inter", weight: 600 },
	secondary: { family: "inter", weight: 500 },
	textColor: text,
	closingColor: closing,
	accent: color,
	colors: [color, closing, text],
	sceneLogo: null,
	closingLogo: null,
	lightLogo: null,
});

const bg = (kind: BackgroundKind, saturate = 0): Style["background"] => ({ kind, motion: "still", saturate, cycle: false });
const EXTREMES = ["#ffffff", "#000000", "#ffd400", "#0b1f4d"];
const KINDS: BackgroundKind[] = ["sky", "dark", "brand", "paper", "auto"];

describe("the ink always reads", () => {
	for (const color of EXTREMES) {
		for (const kind of KINDS) {
			for (const saturate of [0, 0.8]) {
				it(`on ${kind} (saturate ${saturate}) with a ${color} kit`, () => {
					const b = resolveBackground(bg(kind, saturate), kit(color));
					expect(contrast(inkOn(b, kit(color)), b.color)).toBeGreaterThanOrEqual(4.5);
				});
			}
		}
	}

	it("on a photo background, whatever the kit, the ink reads on the worst photo (a white one under its veil) (revisión final, I-2)", () => {
		for (const color of EXTREMES) {
			for (const text of ["#ffd400", "#ffffff", "#16181d"]) {
				const b = resolveBackground(bg("photo"), kit(color, text), "p.png");
				expect(b.kind).toBe("photo");
				const worst = mix("#ffffff", "#000000", photoScrim(1));
				expect(contrast(inkOn(b, kit(color, text)), worst)).toBeGreaterThanOrEqual(4.5);
			}
		}
	});

	it("uses the kit's text colour when it reads", () => {
		const b = resolveBackground(bg("dark"), kit("#3b5bfd", "#ffffff"));
		expect(inkOn(b, kit("#3b5bfd", "#ffffff"))).toBe("#ffffff");
	});

	it("on the sky it is exactly the old sky ink", () => {
		for (const color of EXTREMES) {
			for (const text of ["#ffffff", "#1a2b3c"]) {
				const k = kit(color, text);
				expect(inkOn(resolveBackground(bg("sky"), k), k)).toBe(skyInk(k));
			}
		}
	});
});

describe("resolveBackground", () => {
	it("auto is dark for a light or grey brand colour and the brand colour otherwise", () => {
		expect(resolveBackground(bg("auto"), kit("#ffd400")).kind).toBe("dark");
		expect(resolveBackground(bg("auto"), kit("#ffffff")).kind).toBe("dark");
		expect(resolveBackground(bg("auto"), kit("#808080")).kind).toBe("dark");
		expect(resolveBackground(bg("auto"), kit("#0b1f4d")).kind).toBe("brand");
	});

	it("saturates the brand colour as much as asked", () => {
		const plain = resolveBackground(bg("brand", 0), kit("#7a8aa8")).color;
		const strong = resolveBackground(bg("brand", 0.8), kit("#7a8aa8")).color;
		expect(plain).toBe("#7a8aa8");
		expect(strong).not.toBe(plain);
	});

	it("a photo background with no photo falls back to dark", () => {
		expect(resolveBackground(bg("photo"), kit("#3b5bfd")).kind).toBe("dark");
		expect(resolveBackground(bg("photo"), kit("#3b5bfd"), "p.png").kind).toBe("photo");
	});
});

describe("photoScrim", () => {
	it("darkens a photo until white reads on it", () => {
		for (const lum of [0, 0.2, 0.5, 0.9, 1]) {
			const grey = greyOf(lum);
			const a = photoScrim(lum);
			expect(a).toBeGreaterThanOrEqual(0);
			expect(a).toBeLessThanOrEqual(1);
			expect(contrast("#ffffff", mix(grey, "#000000", a))).toBeGreaterThanOrEqual(4.5);
		}
	});
});

describe("drawBackground", () => {
	it("draws the sky exactly as before for sky", () => {
		const stage = document.createElement("div");
		const out = drawBackground(stage, bg("sky"), kit("#3b5bfd"), 10);
		expect(out.kind).toBe("sky");
		expect(out.layer.querySelectorAll(".motion-blob")).toHaveLength(2);
	});

	it("paints a flat layer for paper and brand", () => {
		for (const kind of ["paper", "brand"] as const) {
			const stage = document.createElement("div");
			const out = drawBackground(stage, bg(kind), kit("#0b1f4d"), 10);
			expect(out.layer.querySelectorAll(".motion-blob")).toHaveLength(0);
			expect(out.layer.style.background).not.toBe("");
		}
	});

	it("dark is near black with a glow", () => {
		const stage = document.createElement("div");
		const out = drawBackground(stage, bg("dark"), kit("#3b5bfd"), 10);
		expect(contrast(out.color, DARK_INK)).toBeLessThan(1.2);
		expect(out.layer.style.background).toContain("radial-gradient");
	});
});
