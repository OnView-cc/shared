// @vitest-environment jsdom
import { gsap } from "gsap";
import { afterEach, describe, expect, it } from "vitest";
import { composeVideo, type ComposeShot } from "../../video/compose";
import { parseBlockParams, type BlockKind } from "../types";
import { createMotion } from "../index";
import { fitContain } from "./ui";

const image = (id: string, width: number, height: number) => ({ id, src: `${id}.png`, width, height });

function mount(block: BlockKind, params: Record<string, unknown>, images: ComposeShot["images"], format: "16:9" | "9:16" = "16:9") {
	const shot: ComposeShot = { id: "m0", position: 0, seconds: 2, block, params: parseBlockParams(block, params), beats: 8, transition: "cut", voice: null, images };
	const c = composeVideo({
		format,
		voiceVolume: 1,
		musicVolume: 0.35,
		musicFadeIn: 0,
		musicFadeOut: 1.5,
		closingLine: "",
		tempo: { bpm: 120, offset: 0 },
		template: null,
		shots: [shot],
		music: null,
		sfx: [],
		brand: null,
		limits: { watermark: false },
	});
	root = document.createElement("div");
	document.body.appendChild(root);
	return createMotion(root, { ...c, media: { watermark: null } }, { mode: "export" });
}
let root: HTMLElement;
afterEach(() => root?.remove());
const op = (el: Element | null | undefined) => Number((el as HTMLElement | null)?.style.opacity || "0");

describe("fitContain", () => {
	it("a very wide screenshot fits inside the frame", () => {
		const r = fitContain(4000, 600, 1080, 1920, 86.4);
		expect(r.x).toBeGreaterThanOrEqual(86.4 - 1e-6);
		expect(r.x + r.w).toBeLessThanOrEqual(1080 - 86.4 + 1e-6);
		expect(r.y).toBeGreaterThanOrEqual(86.4 - 1e-6);
		expect(r.y + r.h).toBeLessThanOrEqual(1920 - 86.4 + 1e-6);
		expect(r.w / r.h).toBeCloseTo(4000 / 600);
	});
});

describe("ui block", () => {
	it("the cursor reaches the click point on beat 4.5", async () => {
		const m = mount("ui", { click: { x: 0.8, y: 0.1 } }, [image("a", 1200, 800)]);
		const shot = root.querySelector<HTMLElement>(".motion-shot")!;
		const cursor = root.querySelector<HTMLElement>(".motion-cursor")!;
		const w = parseFloat(shot.style.width);
		const h = parseFloat(shot.style.height);
		await m.seek(4.5 * 0.5 + 0.01);
		expect(Number(gsap.getProperty(cursor, "x"))).toBeCloseTo(0.8 * w, 0);
		expect(Number(gsap.getProperty(cursor, "y"))).toBeCloseTo(0.1 * h, 0);
	});

	it("the screenshot swaps to the after image on the click", async () => {
		const m = mount("ui", { click: { x: 0.5, y: 0.5 }, afterImageId: "b" }, [image("a", 1200, 800), image("b", 1200, 800)]);
		const after = root.querySelector<HTMLElement>('img[data-after="1"]')!;
		expect(after.getAttribute("src")).toBe("b.png");
		await m.seek(5 * 0.5 - 0.05);
		expect(op(after)).toBe(0);
		await m.seek(5 * 0.5 + 0.3);
		expect(op(after)).toBe(1);
	});

	it("without a click there is no cursor", () => {
		mount("ui", {}, [image("a", 1200, 800)]);
		expect(root.querySelector(".motion-cursor")).toBeNull();
	});

	it("without a zoom, the screenshot slowly comes closer over the moment (tarea 0b)", async () => {
		const m = mount("ui", {}, [image("a", 1600, 900)]);
		const box = root.querySelector<HTMLElement>(".motion-shot")!.parentElement!;
		await m.seek(1);
		const early = Number(gsap.getProperty(box, "scale"));
		await m.seek(3.9);
		expect(Number(gsap.getProperty(box, "scale"))).toBeGreaterThan(early);
		expect(Number(gsap.getProperty(box, "scale"))).toBeGreaterThanOrEqual(1.1);
	});

	it("in portrait, a wide screenshot is cropped to a 4:5 card instead of shrinking whole (tarea 0b)", () => {
		mount("ui", {}, [image("a", 1600, 900)], "9:16");
		const shot = root.querySelector<HTMLElement>(".motion-shot")!;
		const w = parseFloat(shot.parentElement!.style.width);
		const h = parseFloat(shot.parentElement!.style.height);
		expect(w / h).toBeCloseTo(4 / 5, 2);
		expect(w).toBeGreaterThanOrEqual(0.8 * 1080);
		expect(shot.querySelector("img")!.style.objectFit).toBe("cover");
	});
});

describe("product block", () => {
	it("the product photo slowly comes closer over the moment", async () => {
		const m = mount("product", { lines: ["Taza", "12 h caliente."] }, [image("p", 900, 900)]);
		const photo = root.querySelector<HTMLElement>(".motion-product")!;
		await m.seek(0.5);
		const early = Number(gsap.getProperty(photo, "scale"));
		await m.seek(3.9);
		expect(Number(gsap.getProperty(photo, "scale"))).toBeGreaterThan(early);
		expect([...root.querySelectorAll(".motion-line")].map((l) => l.textContent)).toEqual(["Taza", "12 h caliente."]);
	});

	it("with move out, the photo ends further away than it starts", async () => {
		const m = mount("product", { move: "out" }, [image("p", 900, 900)]);
		const photo = root.querySelector<HTMLElement>(".motion-product")!;
		await m.seek(0.1);
		const early = Number(gsap.getProperty(photo, "scale"));
		await m.seek(3.9);
		expect(Number(gsap.getProperty(photo, "scale"))).toBeLessThan(early);
	});

	it("with move pan, the photo slides sideways", async () => {
		const m = mount("product", { move: "pan" }, [image("p", 900, 900)]);
		const photo = root.querySelector<HTMLElement>(".motion-product")!;
		await m.seek(0.1);
		const early = Number(gsap.getProperty(photo, "x"));
		await m.seek(3.9);
		expect(Math.abs(Number(gsap.getProperty(photo, "x")) - early)).toBeGreaterThan(10);
	});
});
