// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { composeVideo, type ComposeShot } from "../../video/compose";
import { parseBlockParams, type BlockKind } from "../types";
import { createMotion } from "../index";

const shot = (block: BlockKind, params: Record<string, unknown>, beats: number, position = 0): ComposeShot => ({
	id: `m${position}`,
	position,
	seconds: 2,
	block,
	params: parseBlockParams(block, params),
	beats,
	transition: "cut",
	trimIn: 0,
	trimOut: null,
	clip: null,
	still: null,
	voice: null,
	images: [],
});

const brand = { textColor: "#ffffff", closingColor: "#0b1f44", accentColor: "#f1844d", colors: ["#ffffff", "#0b1f44"], primary: { family: "inter", weight: 500 }, secondary: { family: "inter", weight: 500 }, sceneLogo: "logo.png", closingLogo: "closing.png" };

function mount(shots: ComposeShot[], closingLine = "") {
	const c = composeVideo({ format: "16:9", quality: "standard_1080p", voiceVolume: 1, musicVolume: 0.35, musicFadeIn: 0, musicFadeOut: 1.5, closingLine, tempo: { bpm: 120, offset: 0 }, template: null, shots, music: null, sfx: [], brand, limits: { maxResolution: "1080p", watermark: false } });
	root = document.createElement("div");
	document.body.appendChild(root);
	return createMotion(root, { ...c, media: { watermark: null } }, { mode: "export" });
}

let root: HTMLElement;
afterEach(() => root?.remove());
const op = (el: Element | null | undefined) => Number((el as HTMLElement | null)?.style.opacity || "0");

describe("text block", () => {
	it("each line of a text moment appears on its beat", async () => {
		const m = mount([shot("text", { lines: ["Seis apps", "que ya se", "conocen."] }, 4)]);
		const lines = () => [...root.querySelectorAll(".motion-line")];
		expect(lines().map((l) => l.textContent)).toEqual(["Seis apps", "que ya se", "conocen."]);
		// Golpe = 0.5 s a 120 BPM: la frase 1 entra en 0.5, la 2 en 1.0, la 3 en 1.5.
		await m.seek(0.45);
		expect(lines().map(op)).toEqual([0, 0, 0]);
		await m.seek(0.5 + 0.7);
		expect(op(lines()[0])).toBe(1);
		expect(op(lines()[2])).toBe(0);
		await m.seek(1.5 + 0.7);
		expect(lines().map(op)).toEqual([1, 1, 1]);
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
});
