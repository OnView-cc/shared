// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { composeVideo, type ComposeShot } from "../../video/compose";
import { createMotion } from "../index";
import { parseBlockParams, type BlockKind } from "../types";


const shot = (block: BlockKind, params: Record<string, unknown>, beats: number, position = 0, images: ComposeShot["images"] = []): ComposeShot => ({
	id: `m${position}`,
	position,
	seconds: 2,
	block,
	params: parseBlockParams(block, params),
	beats,
	transition: "cut",
	voice: null,
	images,
});

const brand = { textColor: "#ffffff", closingColor: "#0b1f44", accentColor: "#f1844d", colors: ["#ffffff", "#0b1f44"], primary: { family: "inter", weight: 500 }, secondary: { family: "inter", weight: 500 }, sceneLogo: "logo.png", closingLogo: "closing.png" };
const photo = [{ id: "p", src: "photo.png", width: 800, height: 800 }];

let root: HTMLElement;
afterEach(() => root?.remove());

function mount(shots: ComposeShot[], template: string | null, overrides: unknown = null, over: Record<string, unknown> = {}) {
	const c = composeVideo({ format: "16:9", voiceVolume: 1, musicVolume: 0.35, musicFadeIn: 0, musicFadeOut: 1.5, closingLine: "", tempo: { bpm: 120, offset: 0 }, template: template ? { id: template, voice: true } : null, style: { id: null, overrides }, shots, music: null, sfx: [], brand: { ...brand, ...over }, limits: { watermark: false } });
	root = document.createElement("div");
	document.body.appendChild(root);
	return createMotion(root, { ...c, media: { watermark: null } }, { mode: "export", imageWaitMs: 10 });
}

const layer = (i: number) => root.querySelector<HTMLElement>(`[data-moment="${i}"]`)!;

describe("the product block with the style", () => {
	it("Arcade: a soft shadow and no reflection, as before", () => {
		mount([shot("product", { lines: ["Hola"], move: "in" }, 4, 0, photo)], "software-launch");
		const img = root.querySelector<HTMLElement>(".motion-product")!;
		expect(img.style.filter).toContain("drop-shadow");
		expect(img.style.objectFit).toBe("contain");
		expect(root.querySelector(".motion-reflection")).toBeNull();
	});

	it("plinth: the photo stands on a base with its reflection", () => {
		mount([shot("product", { lines: ["Hola"], move: "in" }, 4, 0, photo)], "product");
		expect(root.querySelector(".motion-reflection")).not.toBeNull();
		expect(root.querySelector(".motion-plinth")).not.toBeNull();
	});

	it("bleed: the photo covers its area with no shadow", () => {
		mount([shot("product", { lines: ["Hola"], move: "in" }, 4, 0, photo)], null, { product: { frame: "bleed" } });
		const img = root.querySelector<HTMLElement>(".motion-product")!;
		expect(img.style.objectFit).toBe("cover");
		expect(img.style.filter).not.toContain("drop-shadow");
	});

	it("wide moves twice as far", async () => {
		const subtle = mount([shot("product", { lines: [], move: "in" }, 4, 0, photo)], null);
		await subtle.seek(1.99);
		const a = root.querySelector<HTMLElement>(".motion-product")!.style.transform;
		root.remove();
		const wide = mount([shot("product", { lines: [], move: "in" }, 4, 0, photo)], null, { product: { move: "wide" } });
		await wide.seek(1.99);
		const b = root.querySelector<HTMLElement>(".motion-product")!.style.transform;
		const x = (t: string) => Number(/translate\(([-\d.]+)px/.exec(t)?.[1] ?? /translate3d\(([-\d.]+)px/.exec(t)?.[1] ?? "0");
		expect(x(b)).toBeCloseTo(2 * x(a), 0);
		expect(x(a)).toBeLessThan(-1);
	});

	it("its phrases follow the style's type: Impact in uppercase and bolder", () => {
		mount([shot("product", { lines: ["Sale"], move: "in" }, 4, 0, photo)], "offer", null, { primary: { family: "inter", weight: 400, weights: [400, 800] } });
		const line = root.querySelector<HTMLElement>(".motion-product-line")!;
		expect(line.style.fontWeight).toBe("800");
		expect(line.parentElement!.style.textTransform).toBe("uppercase");
	});
});

describe("the closing with the style", () => {
	it("Arcade with a logo for light backgrounds stays on the sky (as before)", () => {
		mount([shot("text", { lines: ["Hi"] }, 4), shot("logo", { line: "x" }, 4, 1)], "software-launch", null, { lightLogo: "light.png" });
		expect(layer(1).style.background).toBe("");
		expect(root.querySelector<HTMLImageElement>(".motion-logo")!.getAttribute("src")).toBe("light.png");
	});

	it("Arcade without it uses the closing colour (as before)", () => {
		mount([shot("text", { lines: ["Hi"] }, 4), shot("logo", { line: "x" }, 4, 1)], "software-launch");
		expect(layer(1).style.background).toBe("rgb(11, 31, 68)");
		expect(root.querySelector<HTMLImageElement>(".motion-logo")!.getAttribute("src")).toBe("closing.png");
	});

	it("on a dark style with a dark closing colour, it stays on the background with the closing logo", () => {
		mount([shot("text", { lines: ["Hi"] }, 4), shot("logo", { line: "x" }, 4, 1)], "brand-story", null, { lightLogo: "light.png" });
		expect(layer(1).style.background).toBe("");
		expect(root.querySelector<HTMLImageElement>(".motion-logo")!.getAttribute("src")).toBe("closing.png");
	});

	it("on paper with a logo for light backgrounds, it stays on the paper", () => {
		mount([shot("text", { lines: ["Hi"] }, 4), shot("logo", { line: "x" }, 4, 1)], "news", null, { lightLogo: "light.png" });
		expect(layer(1).style.background).toBe("");
		expect(root.querySelector<HTMLImageElement>(".motion-logo")!.getAttribute("src")).toBe("light.png");
	});
});
