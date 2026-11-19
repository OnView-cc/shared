// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { composeVideo, type ComposeInput } from "../video/compose";
import type { Transition } from "./types";
import { parseBlockParams } from "./types";
import { createMotion, type MotionDoc } from "./engine";
import { MOTION_CSS } from "./style";
import { skyBlobs, skyInk } from "./background";

function doc(transitions: Transition[], o: Partial<ComposeInput> = {}): MotionDoc {
	const c = composeVideo({
		format: "16:9",
		voiceVolume: 1,
		musicVolume: 0.35,
		musicFadeIn: 0,
		musicFadeOut: 1.5,
		closingLine: "",
		tempo: { bpm: 120, offset: 0 },
		template: { id: "software-launch", voice: false },
		shots: transitions.map((transition, i) => ({
			id: `m${i}`,
			position: i,
			seconds: 2,
			block: "text",
			params: parseBlockParams("text", { lines: [`Line ${i}`] }),
			beats: 4,
			transition,
			voice: null,
			images: [],
		})),
		music: null,
		sfx: [],
		brand: null,
		limits: { watermark: false },
		...o,
	});
	return { ...c, media: { watermark: null } };
}

const opacity = (el: Element | null) => Number((el as HTMLElement | null)?.style.opacity || "0");
const layer = (root: HTMLElement, i: number) => root.querySelector(`[data-moment="${i}"]`);

let root: HTMLElement;
afterEach(() => root?.remove());
function mount(d: MotionDoc) {
	root = document.createElement("div");
	document.body.appendChild(root);
	return createMotion(root, d, { mode: "export" });
}

describe("skyInk", () => {
	it("keeps a dark kit text colour and falls back to a dark ink for a light one", () => {
		expect(skyInk({ textColor: "#1a2b3c", closingColor: "#ffffff" })).toBe("#1a2b3c");
		expect(skyInk({ textColor: "#ffffff", closingColor: "#0b1f44" })).toBe("#0b1f44");
		expect(skyInk({ textColor: "#ffffff", closingColor: "#fafafa" })).toBe("#16181d");
	});
});

describe("skyBlobs", () => {
	it("skips white and black kit colours for the cool blob", () => {
		expect(skyBlobs({ colors: ["#ffffff", "#000000", "#f1844d"], accent: "#f1844d" }).cool).toBe("#c8d8f0");
		expect(skyBlobs({ colors: ["#ffffff", "#3e5dda", "#f1844d"], accent: "#f1844d" }).cool).not.toBe("#c8d8f0");
	});
});

describe("createMotion", () => {
	it("duration equals the composition total", () => {
		const m = mount(doc(["blur", "blur", "blur"]));
		expect(m.duration).toBe(6);
	});

	it("seek is deterministic", async () => {
		const m = mount(doc(["blur", "push", "blur"]));
		await m.seek(3.1);
		const a = root.innerHTML;
		await m.seek(0.4);
		await m.seek(3.1);
		expect(root.innerHTML).toBe(a);
	});

	it("only the current moment is visible outside transitions", async () => {
		const m = mount(doc(["blur", "blur", "blur"]));
		await m.seek(1);
		expect([0, 1, 2].map((i) => opacity(layer(root, i)) > 0)).toEqual([true, false, false]);
		await m.seek(5);
		expect([0, 1, 2].map((i) => opacity(layer(root, i)) > 0)).toEqual([false, false, true]);
	});

	it("a blur transition overlaps half a beat on each side", async () => {
		const m = mount(doc(["blur", "blur", "blur"]));
		await m.seek(2 - 0.125);
		expect(opacity(layer(root, 0))).toBeGreaterThan(0);
		expect(opacity(layer(root, 1))).toBeGreaterThan(0);
		await m.seek(2 - 0.3);
		expect(opacity(layer(root, 1))).toBe(0);
	});

	it("a push transition shows the outgoing moment alone, then the incoming one alone", async () => {
		const m = mount(doc(["push", "cut", "cut"]));
		await m.seek(2 - 0.125);
		expect([opacity(layer(root, 0)) > 0, opacity(layer(root, 1)) > 0]).toEqual([true, false]);
		await m.seek(2 + 0.125);
		expect([opacity(layer(root, 0)) > 0, opacity(layer(root, 1)) > 0]).toEqual([false, true]);
	});

	it("a cut transition never shows two moments", async () => {
		const m = mount(doc(["cut", "cut", "cut"]));
		for (let t = 0; t < 6; t += 1 / 30) {
			await m.seek(t);
			expect([t, [0, 1, 2].filter((i) => opacity(layer(root, i)) > 0).length]).toEqual([t, 1]);
		}
	});

	it("draws the stage at the frame size", () => {
		mount(doc(["cut"]));
		const stage = root.querySelector<HTMLElement>(".motion-stage")!;
		expect([stage.style.width, stage.style.height]).toEqual(["1920px", "1080px"]);
		expect(stage.style.getPropertyValue("--u")).toBe("10.8px");
	});

	it("shows the watermark when the plan has one", () => {
		mount({ ...doc(["cut"], { limits: { watermark: true } }), media: { watermark: "/wm.png" } });
		expect(root.querySelector<HTMLImageElement>(".motion-watermark")?.getAttribute("src")).toBe("/wm.png");
	});

	it("no CSS transitions or animations are declared", () => {
		expect(MOTION_CSS).not.toMatch(/transition\s*:|animation\s*:|@keyframes/);
	});
});
