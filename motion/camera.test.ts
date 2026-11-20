// @vitest-environment jsdom
import { gsap } from "gsap";
import { describe, expect, it } from "vitest";
import { wireCamera } from "./camera";
import { STYLES, type Style } from "./styles";

const BEAT = 0.5;
const TOTAL = 12;

function build(camera: Partial<Style["camera"]>, motion: Style["background"]["motion"] = "still", offset = 0) {
	const els = { camera: document.createElement("div"), hit: document.createElement("div"), background: document.createElement("div") };
	const tl = gsap.timeline({ paused: true });
	const look = { camera: { ...STYLES.arcade.camera, ...camera }, background: { ...STYLES.arcade.background, motion } };
	wireCamera(tl, els, look, { total: TOTAL, beatSeconds: BEAT, offset, u: 10 });
	tl.set({}, {}, TOTAL);
	const plain = (v: string) => (/^(none|translate\(0(px)?, 0(px)?\))?$/.test(v) ? "" : v);
	const state = () => [els.camera, els.hit, els.background].map((e) => plain(e.style.transform)).join(" / ");
	return { tl, els, state };
}

const scaleOf = (el: HTMLElement) => Number(/scale\(([\d.]+)/.exec(el.style.transform)?.[1] ?? "1");

describe("the camera", () => {
	it("adds nothing for Arcade (no drift, no hit, still background)", () => {
		const { tl } = build({});
		expect(tl.getChildren().length).toBe(1); // sólo el `set` del final de la prueba
	});

	const combos: [string, Partial<Style["camera"]>, Style["background"]["motion"]][] = [
		["in subtle", { drift: "in", amount: "subtle" }, "still"],
		["in wide", { drift: "in", amount: "wide" }, "still"],
		["parallax", { drift: "parallax" }, "still"],
		["shake", { hit: "shake" }, "still"],
		["zoom", { hit: "zoom" }, "still"],
		["drifting background", {}, "drift"],
		["all at once", { drift: "in", hit: "shake" }, "drift"],
	];
	for (const [name, camera, motion] of combos) {
		it(`${name}: seeking back gives the same frame as seeking there directly`, () => {
			const a = build(camera, motion);
			a.tl.seek(2.03, false);
			const direct = a.state();
			const b = build(camera, motion);
			b.tl.seek(5, false);
			b.tl.seek(2.03, false);
			expect(b.state()).toBe(direct);
			const c = build(camera, motion);
			c.tl.seek(9.7, false);
			c.tl.seek(0.4, false);
			c.tl.seek(2.03, false);
			expect(c.state()).toBe(direct);
		});
	}

	it("in: the whole stage grows slowly to 1.04 (subtle) or 1.08 (wide) by the end", () => {
		for (const [amount, end] of [["subtle", 1.04], ["wide", 1.08]] as const) {
			const { tl, els } = build({ drift: "in", amount });
			tl.seek(0, false);
			expect(scaleOf(els.camera)).toBeCloseTo(1, 3);
			tl.seek(TOTAL / 2, false);
			expect(scaleOf(els.camera)).toBeCloseTo(1 + (end - 1) / 2, 3);
			tl.seek(TOTAL, false);
			expect(scaleOf(els.camera)).toBeCloseTo(end, 3);
		}
	});

	it("zoom pulses on the strong beats (every 4 from the offset) and settles between them", () => {
		const { tl, els } = build({ hit: "zoom" }, "still", 0.25);
		const strong = 0.25 + 4 * BEAT;
		tl.seek(strong + 0.08, false);
		expect(scaleOf(els.hit)).toBeGreaterThan(1.015);
		tl.seek(strong + 0.4, false);
		expect(scaleOf(els.hit)).toBeCloseTo(1, 3);
		tl.seek(0.25 + 2 * BEAT + 0.08, false);
		expect(scaleOf(els.hit)).toBeCloseTo(1, 3);
	});

	it("shake moves the stage on a strong beat and puts it back", () => {
		const { tl, els } = build({ hit: "shake" });
		tl.seek(4 * BEAT + 0.04, false);
		expect(els.hit.style.transform).toMatch(/translate/);
		tl.seek(4 * BEAT + 0.3, false);
		expect(els.hit.style.transform).toMatch(/^(|none|translate\(0(px)?, 0(px)?\)|translate3d\(0px, 0px, 0px\))$/);
	});

	it("parallax moves only the background", () => {
		const { tl, els } = build({ drift: "parallax" });
		tl.seek(TOTAL / 3, false);
		expect(els.background.style.transform).toMatch(/translate/);
		expect(els.camera.style.transform).toBe("");
	});
});
