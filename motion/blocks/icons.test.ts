// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { composeVideo, type ComposeShot } from "../../video/compose";
import { parseBlockParams } from "../types";
import { createMotion } from "../index";
import { burstPositions, ICON_U } from "./icons";

const HALF = { landscape: [(1920 / 1080) * 50, 50], portrait: [50, (1920 / 1080) * 50], square: [50, 50] } as const;
const img = (i: number) => ({ id: `i${i}`, src: `i${i}.png`, width: 256, height: 256 });

function mount(params: Record<string, unknown>, n: number, format: "16:9" | "9:16" = "16:9", lightLogo: string | null = null) {
	const shot: ComposeShot = { id: "m0", position: 0, seconds: 2, block: "icons", params: parseBlockParams("icons", params), beats: 12, transition: "cut", voice: null, images: Array.from({ length: n }, (_, i) => img(i)) };
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
		brand: { textColor: "#ffffff", closingColor: "#0b1f44", accentColor: "#f1844d", colors: [], primary: { family: "inter", weight: 500 }, secondary: { family: "inter", weight: 500 }, sceneLogo: "scene.png", closingLogo: null, lightLogo },
		limits: { watermark: false },
	});
	root = document.createElement("div");
	document.body.appendChild(root);
	return createMotion(root, { ...c, media: { watermark: null } }, { mode: "export" });
}
let root: HTMLElement;
afterEach(() => root?.remove());
const op = (el: Element | null | undefined) => Number((el as HTMLElement | null)?.style.opacity || "0");

describe("icons block", () => {
	it("burst places every icon inside the frame for 2 to 6 icons in each orientation", () => {
		for (const o of ["landscape", "portrait", "square"] as const) {
			for (let n = 2; n <= 6; n++) {
				const pos = burstPositions(n, o);
				expect(pos).toHaveLength(n);
				const [hw, hh] = HALF[o];
				for (const [x, y] of pos) {
					expect(Math.abs(x) + ICON_U / 2).toBeLessThanOrEqual(hw - 6);
					expect(Math.abs(y) + ICON_U / 2).toBeLessThanOrEqual(hh - 6);
					// Lejos de la marca del centro.
					expect(Math.hypot(x, y)).toBeGreaterThan(18);
				}
			}
		}
	});

	it("burst icons fly out from the centre on beat 1", async () => {
		const m = mount({ variant: "burst" }, 4);
		const icons = [...root.querySelectorAll<HTMLElement>(".motion-icon")];
		expect(icons).toHaveLength(4);
		await m.seek(0.45);
		expect(icons.map(op)).toEqual([0, 0, 0, 0]);
		await m.seek(0.5 + 1.2);
		expect(icons.every((i) => op(i) === 1)).toBe(true);
	});

	it("list moves to the next item every two beats", async () => {
		const m = mount({ variant: "list", labels: { i0: "Soporte", i1: "Chat", i2: "Archivos" } }, 3);
		const rows = [...root.querySelectorAll<HTMLElement>(".motion-row")];
		expect(rows.map((r) => r.textContent)).toEqual(["Soporte", "Chat", "Archivos"]);
		const active = () => rows.findIndex((r) => op(r) === 1);
		await m.seek(0.5);
		expect(active()).toBe(0);
		await m.seek(1.0 + 0.4);
		expect(active()).toBe(1);
		await m.seek(2.0 + 0.4);
		expect(active()).toBe(2);
	});

	it("list shows no name when a label is missing", () => {
		mount({ variant: "list", labels: { i0: "Soporte" } }, 2);
		expect([...root.querySelectorAll(".motion-row")].map((r) => r.textContent)).toEqual(["Soporte", ""]);
	});

	it("icon images get no background", () => {
		mount({ variant: "burst" }, 3);
		for (const el of root.querySelectorAll<HTMLElement>(".motion-icon, .motion-icon img")) expect(el.style.background).toBe("");
	});

	it("burst puts the scene logo in the centre when there is no closing logo", () => {
		mount({ variant: "burst" }, 2);
		expect(root.querySelector(".motion-mark img")?.getAttribute("src")).toBe("scene.png");
	});

	it("burst puts the light-background logo in the centre as it is, with no tile", () => {
		mount({ variant: "burst" }, 2, "16:9", "light.png");
		const mark = root.querySelector<HTMLElement>(".motion-mark")!;
		expect(mark.querySelector("img")?.getAttribute("src")).toBe("light.png");
		expect(mark.style.background).toBe("");
	});
});
