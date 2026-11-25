// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { Box3D, Card3D } from "./three";
import { expectDeterministic, sceneHarness } from "./test-helpers";

let cleanup = () => {};
afterEach(() => cleanup());

describe("Box3D", () => {
	it("enter emits land at the end of its entrance", () => {
		const h = sceneHarness({ at: 1, seconds: 4 });
		cleanup = h.cleanup;
		const b = Box3D(h.ctx, { size: 20, faces: { color: "#3a6df0" }, logo: "scene" });
		b.enter({ from: "top", at: 1.5 });
		const land = h.events().filter((e) => e.kind === "land");
		expect(land).toHaveLength(1);
		expect(land[0]!.at).toBeCloseTo(0.5 + 0.45, 3);
	});

	it("has six faces and puts the logo on the front", () => {
		const h = sceneHarness();
		cleanup = h.cleanup;
		const b = Box3D(h.ctx, { size: 20, faces: { color: "#3a6df0" }, logo: "scene" });
		expect(b.el.querySelectorAll(".kit-box-face")).toHaveLength(6);
		expect(b.el.querySelector(".kit-box-face.front img")?.getAttribute("src")).toBe("logo.png");
	});

	it("is deterministic with enter, spin and float", () => {
		const h = sceneHarness({ seconds: 6 });
		cleanup = h.cleanup;
		const b = Box3D(h.ctx, { size: 20, faces: { color: "#3a6df0" } });
		b.enter({ from: "left", at: 0 });
		b.spin({ turns: 1, at: 1, duration: 2 });
		b.float({ at: 2, until: 5 });
		expectDeterministic(h.tl, h.stage, [0, 0.4, 1.3, 2.7, 4.4], expect);
	});
});

describe("Card3D", () => {
	it("is deterministic with enter, tilt, shine and exit", () => {
		const h = sceneHarness({ images: [{ id: "p", src: "p.png", width: 800, height: 600 }] });
		cleanup = h.cleanup;
		const c = Card3D(h.ctx, { image: "p", width: 40, height: 30, tilt: { x: 10, y: -20 }, shine: true });
		c.enter({ from: "bottom", at: 0.2 });
		c.tilt({ x: 0, y: 0, at: 1.5 });
		c.exit({ at: 3 });
		expect(c.el.querySelector("img")?.getAttribute("src")).toBe("p.png");
		expectDeterministic(h.tl, h.stage, [0, 0.5, 1.8, 3.6], expect);
	});
});
