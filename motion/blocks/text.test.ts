// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { composeVideo, type ComposeShot } from "../../video/compose";
import { parseBlockParams, type BlockKind } from "../types";
import { createMotion } from "../index";
import { STYLES } from "../styles";
import { nearestWeight, phraseWeight } from "./text";

const shot = (block: BlockKind, params: Record<string, unknown>, beats: number, position = 0): ComposeShot => ({
	id: `m${position}`,
	position,
	seconds: 2,
	block,
	params: parseBlockParams(block, params),
	beats,
	transition: "cut",
	voice: null,
	images: [],
});

const brand = { textColor: "#ffffff", closingColor: "#0b1f44", accentColor: "#f1844d", colors: ["#ffffff", "#0b1f44"], primary: { family: "inter", weight: 500 }, secondary: { family: "inter", weight: 500 }, sceneLogo: "logo.png", closingLogo: "closing.png" };

function mount(shots: ComposeShot[], closingLine = "", over: Partial<typeof brand> & { lightLogo?: string | null } = {}, format: "16:9" | "9:16" = "16:9") {
	const c = composeVideo({ format, voiceVolume: 1, musicVolume: 0.35, musicFadeIn: 0, musicFadeOut: 1.5, closingLine, tempo: { bpm: 120, offset: 0 }, template: null, shots, music: null, sfx: [], brand: { ...brand, ...over }, limits: { watermark: false } });
	root = document.createElement("div");
	document.body.appendChild(root);
	return createMotion(root, { ...c, media: { watermark: null } }, { mode: "export", imageWaitMs: 10 });
}

let root: HTMLElement;
afterEach(() => root?.remove());
const op = (el: Element | null | undefined) => Number((el as HTMLElement | null)?.style.opacity || "0");

describe("text block", () => {
	it("each group of a text moment enters on its beat, the first one right away", async () => {
		const m = mount([shot("text", { lines: ["Seis apps", "que ya se", "conocen."] }, 4)]);
		const lines = () => [...root.querySelectorAll(".motion-line")];
		expect(lines().map((l) => l.textContent)).toEqual(["Seis apps", "que ya se", "conocen."]);
		// Golpe = 0.5 s a 120 BPM: el grupo 1 entra en 0 (durante la transición, como en Arcade), el 2 en 0.5, el 3 en 1.0.
		await m.seek(0.45);
		expect(op(lines()[0])).toBeGreaterThan(0.5);
		expect(op(lines()[1])).toBe(0);
		await m.seek(0.5 + 0.7);
		expect(op(lines()[1])).toBe(1);
		await m.seek(1.0 + 0.7);
		expect(lines().map(op)).toEqual([1, 1, 1]);
	});

	it("a blur transition into a phrase never leaves the frame empty", async () => {
		// Tarea 0b: tras la captura, la frase entraba un golpe tarde y quedaba medio segundo de fondo solo.
		const blurred = (i: number) => ({ ...shot("text", { lines: [`Line ${i}`] }, 4, i), transition: "blur" as const });
		const m = mount([blurred(0), blurred(1)]);
		const layer = (i: number) => root.querySelector(`[data-moment="${i}"]`);
		const shown = (i: number) => op(layer(i)) * Math.max(0, ...[...(layer(i)?.querySelectorAll(".motion-line") ?? [])].map(op));
		for (const t of [1.8, 1.9, 2.0, 2.1, 2.2, 2.3, 2.4]) {
			await m.seek(t);
			expect([t, Math.max(shown(0), shown(1)) > 0.2]).toEqual([t, true]);
		}
	});

	it("in portrait a long group can break between its words", () => {
		mount([shot("text", { lines: ["Start your workspace today"] }, 4)], "", {}, "9:16");
		expect(root.querySelector<HTMLElement>(".motion-line")!.style.whiteSpace).toBe("normal");
	});

	it("a line break inside a group splits it in two groups", () => {
		mount([shot("text", { lines: ["Unified workspace\nlimitless possibilities"] }, 4)]);
		expect([...root.querySelectorAll(".motion-line")].map((l) => l.textContent)).toEqual(["Unified workspace", "limitless possibilities"]);
	});

	it("each word enters grey and darkens to the ink", async () => {
		const m = mount([shot("text", { lines: ["Seis apps"] }, 4)]);
		const words = [...root.querySelectorAll<HTMLElement>(".motion-word")];
		expect(words.map((w) => w.textContent)).toEqual(["Seis", "apps"]);
		await m.seek(0.05);
		expect(words[0]!.style.color).not.toBe("rgb(11, 31, 68)");
		await m.seek(1.5);
		expect(words.map((w) => w.style.color)).toEqual(["rgb(11, 31, 68)", "rgb(11, 31, 68)"]);
	});

	it("a phrase never uses a weight over 500, even if the kit's is bolder", () => {
		mount([shot("text", { lines: ["Hola"] }, 4)], "", { primary: { family: "inter", weight: 700 } });
		expect(root.querySelector<HTMLElement>(".motion-text")!.style.fontWeight).toBe("500");
	});

	it("writes in the sky ink, not the kit text colour meant for video", () => {
		mount([shot("text", { lines: ["Hola"] }, 4)]);
		expect(root.querySelector<HTMLElement>(".motion-text")!.style.color).toBe("rgb(11, 31, 68)");
	});

	it("a text moment with its own colour fills the layer and picks a readable ink", () => {
		mount([shot("text", { lines: ["Hola"], color: "#0b1f44" }, 4)]);
		const layer = root.querySelector<HTMLElement>('[data-block="text"]')!;
		expect(layer.style.background).toBe("rgb(11, 31, 68)");
		expect(root.querySelector<HTMLElement>(".motion-text")!.style.color).toBe("rgb(255, 255, 255)");
	});
});

describe("text that does not fit", () => {
	it("a phrase wider than its box shrinks once the fonts are in", async () => {
		const real = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "scrollWidth");
		Object.defineProperty(HTMLElement.prototype, "scrollWidth", { configurable: true, get() { return (this as HTMLElement).classList.contains("motion-line") ? 3000 : 0; } });
		try {
			const m = mount([shot("text", { lines: ["Aplicativos que se comportam"] }, 4)]);
			const text = root.querySelector<HTMLElement>(".motion-text")!;
			const before = parseFloat(text.style.fontSize);
			await m.ready;
			expect(parseFloat(text.style.fontSize)).toBeLessThan(before);
			// Nunca por debajo de 6 u (6 × 10.8 px en 1920×1080).
			expect(parseFloat(text.style.fontSize)).toBeGreaterThanOrEqual(6 * 10.8 - 0.01);
		} finally {
			if (real) Object.defineProperty(HTMLElement.prototype, "scrollWidth", real);
		}
	});
});

describe("text block with scene images", () => {
	it("a text moment draws its scene images with their layout, entering one by one", async () => {
		const images = [0, 1, 2, 3].map((i) => ({ id: `i${i}`, src: `i${i}.png`, width: 400, height: 400 }));
		const m = mount([{ ...shot("text", { lines: ["Too many apps"], color: "#0b1f44", imagesLayout: "grid", imagesEntrance: "stagger" }, 8), images }]);
		const imgs = [...root.querySelectorAll<HTMLElement>("img.motion-sceneimg")];
		expect(imgs.map((i) => i.getAttribute("src"))).toEqual(["i0.png", "i1.png", "i2.png", "i3.png"]);
		await m.seek(0.05);
		expect(op(imgs[3])).toBe(0);
		await m.seek(3);
		expect(imgs.every((i) => op(i) === 1)).toBe(true);
	});

	it("parses the images layout of a text moment only when it is given", () => {
		expect(parseBlockParams("text", { lines: ["a"] })).toEqual({ lines: ["a"], color: null });
		expect(parseBlockParams("text", { imagesLayout: "center", imagesEntrance: "fade" })).toMatchObject({ imagesLayout: "center", imagesEntrance: "fade" });
		expect(parseBlockParams("text", { imagesLayout: "nope" })).toEqual({ lines: [], color: null });
	});
});

describe("logo block", () => {
	it("the closing shows the closing logo and its line over the closing colour", async () => {
		const m = mount([shot("text", { lines: ["Hola"] }, 4)], "onview.cc");
		const layer = root.querySelector<HTMLElement>('[data-block="logo"]')!;
		expect(layer.style.background).toBe("rgb(11, 31, 68)");
		expect(layer.querySelector("img")?.getAttribute("src")).toBe("closing.png");
		expect(layer.textContent).toContain("onview.cc");
		await m.seek(m.duration - 0.01);
		expect(op(layer.querySelector(".motion-logo"))).toBe(1);
	});

	it("with a light-background logo, the closing sits on the template's sky", () => {
		mount([shot("text", { lines: ["Hola"] }, 4)], "onview.cc", { lightLogo: "light.png" });
		const layer = root.querySelector<HTMLElement>('[data-block="logo"]')!;
		expect(layer.style.background).toBe("");
		expect(layer.querySelector("img")?.getAttribute("src")).toBe("light.png");
		expect(layer.querySelector<HTMLElement>(".motion-line")!.style.color).toBe("rgb(11, 31, 68)");
	});
});

describe("the style's type (spec 2026-11-19)", () => {
	function mountStyled(lines: string[], template: string | null, style: { id: string | null; overrides: unknown } | undefined, primary = { family: "inter", weight: 500 } as { family: string; weight: number; weights?: number[] }, format: "16:9" | "9:16" = "16:9") {
		const c = composeVideo({ format, voiceVolume: 1, musicVolume: 0.35, musicFadeIn: 0, musicFadeOut: 1.5, closingLine: "", tempo: { bpm: 120, offset: 0 }, template: template ? { id: template, voice: true } : null, style, shots: [shot("text", { lines }, 4)], music: null, sfx: [], brand: { ...brand, primary }, limits: { watermark: false } });
		root = document.createElement("div");
		document.body.appendChild(root);
		return createMotion(root, { ...c, media: { watermark: null } }, { mode: "export", imageWaitMs: 10 });
	}
	const text = () => root.querySelector<HTMLElement>(".motion-text")!;

	it("nearestWeight picks the closest weight the font has, the lighter on a tie", () => {
		expect(nearestWeight(800, [400])).toBe(400);
		expect(nearestWeight(800, [400, 500, 600, 700])).toBe(700);
		expect(nearestWeight(650, [600, 700])).toBe(600);
		expect(nearestWeight(650)).toBe(650);
	});

	it("phraseWeight: Arcade keeps the kit's weight up to 500; a number is the style's weight", () => {
		expect(phraseWeight({ ...STYLES.arcade.type }, { family: "inter", weight: 700 })).toBe(500);
		expect(phraseWeight({ ...STYLES.arcade.type }, { family: "inter", weight: 400 })).toBe(400);
		expect(phraseWeight({ ...STYLES.impact.type }, { family: "inter", weight: 400, weights: [400, 500, 600, 700, 800] })).toBe(800);
	});

	it("Arcade writes exactly as before", () => {
		mountStyled(["Seis apps"], "software-launch", undefined, { family: "inter", weight: 700 });
		expect(text().style.fontWeight).toBe("500");
		expect(text().style.fontSize).toBe(`${11.4 * 10.8}px`);
		expect(text().style.textTransform).toBe("");
		expect(text().style.letterSpacing).toBe("");
	});

	it("Impact with a font that only has 400 stays at 400, in uppercase and larger", () => {
		mountStyled(["Sale"], "offer", undefined, { family: "bebas-neue", weight: 400, weights: [400] });
		expect(text().style.fontWeight).toBe("400");
		expect(text().style.textTransform).toBe("uppercase");
		expect(parseFloat(text().style.fontSize)).toBeGreaterThan(11.4 * 10.8);
	});

	it("Showcase writes small, in a corner, aligned left", () => {
		mountStyled(["New collection"], "product", undefined);
		expect(text().style.textAlign).toBe("left");
		expect(parseFloat(text().style.fontSize)).toBeLessThan(11.4 * 10.8);
		const fill = root.querySelector<HTMLElement>(".motion-fill")!;
		expect(fill.style.placeItems).toBe("end start");
		expect(fill.style.padding).toBe(`${7 * 10.8}px`);
	});

	for (const entry of ["groups", "slam", "rise", "fade", "type"] as const) {
		it(`entry ${entry}: everything is in by the end and seeking back gives the same frame`, async () => {
			const m = mountStyled(["Seis apps", "que ya se"], null, { id: null, overrides: { type: { entry } } });
			const look = () => [...root.querySelectorAll<HTMLElement>(".motion-line, .motion-word, .motion-letter, .motion-rise")].map((e) => `${e.style.opacity}|${e.style.transform}|${e.style.color}`).join(";");
			await m.seek(0.6);
			const direct = look();
			await m.seek(1.9);
			const lines = [...root.querySelectorAll<HTMLElement>(".motion-line")];
			// Sin opacidad escrita, se ve entero.
			const seen = (e: HTMLElement) => Number(e.style.opacity === "" ? "1" : e.style.opacity);
			expect(lines.map(seen)).toEqual([1, 1]);
			expect([...root.querySelectorAll<HTMLElement>(".motion-word, .motion-letter")].every((w) => seen(w) === 1)).toBe(true);
			await m.seek(0.6);
			expect(look()).toBe(direct);
		});
	}
});
