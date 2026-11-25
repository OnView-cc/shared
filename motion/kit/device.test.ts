// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { Device } from "./device";
import { expectDeterministic, sceneHarness } from "./test-helpers";

let cleanup = () => {};
afterEach(() => cleanup());
const IMG = [{ id: "shot", src: "shot.png", width: 1170, height: 2532 }];

describe("Device", () => {
	it.each(["phone", "tablet", "laptop", "browser"] as const)("%s is deterministic with enter, tilt, scroll and exit", (kind) => {
		const h = sceneHarness({ images: IMG, seconds: 6 });
		cleanup = h.cleanup;
		const d = Device(h.ctx, { kind, image: "shot", url: "daxuz.com" });
		d.enter({ from: "right", at: 0.2 });
		d.tilt({ x: 8, y: -14, at: 1 });
		d.scroll({ to: 0.6, at: 2 });
		d.zoom({ x: 0.5, y: 0.3, scale: 1.4, at: 3 });
		d.exit({ at: 5 });
		expectDeterministic(h.tl, h.stage, [0, 0.5, 1.4, 2.6, 3.5, 5.8], expect);
	});

	it("shows the image inside the screen", () => {
		const h = sceneHarness({ images: IMG });
		cleanup = h.cleanup;
		const d = Device(h.ctx, { kind: "phone", image: "shot" });
		expect(d.screen.querySelector("img")?.getAttribute("src")).toBe("shot.png");
	});

	it("point maps 0..1 to stage units inside the screen box", () => {
		const h = sceneHarness({ format: "9:16" });
		cleanup = h.cleanup;
		const d = Device(h.ctx, { kind: "phone", x: 50, y: 50, width: 40 });
		const c = d.point({ x: 0.5, y: 0.5 });
		expect(c.x).toBeCloseTo(50, 2);
		expect(c.y).toBeCloseTo(50, 2);
		const tl = d.point({ x: 0, y: 0 });
		const br = d.point({ x: 1, y: 1 });
		expect(tl.x).toBeGreaterThan(30);
		expect(br.x).toBeLessThan(70);
		expect(br.y - tl.y).toBeGreaterThan(br.x - tl.x);
	});

	it("the browser shows its url", () => {
		const h = sceneHarness();
		cleanup = h.cleanup;
		const d = Device(h.ctx, { kind: "browser", url: "daxuz.com" });
		expect(d.el.textContent).toContain("daxuz.com");
	});

	it("enter emits whoosh at its time", () => {
		const h = sceneHarness({ at: 1 });
		cleanup = h.cleanup;
		Device(h.ctx, { kind: "phone" }).enter({ from: "bottom", at: 1.5 });
		expect(h.events()).toEqual([{ kind: "whoosh", at: 0.5, n: 0 }]);
	});
});
