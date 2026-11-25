// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { Carousel, Grid, Stack } from "./collections";
import { expectDeterministic, sceneHarness } from "./test-helpers";

let cleanup = () => {};
afterEach(() => cleanup());
const IMGS = Array.from({ length: 6 }, (_, i) => ({ id: `p${i}`, src: `p${i}.png`, width: 600, height: 600 }));

describe("Grid", () => {
	it("cascade emits one land per row", () => {
		const h = sceneHarness({ images: IMGS });
		cleanup = h.cleanup;
		Grid(h.ctx, { items: [0, 1, 2, 3, 4, 5], columns: 3, at: 0.5 });
		expect(h.events().filter((e) => e.kind === "land")).toHaveLength(2);
	});

	it("draws one cell per item, with images and elements", () => {
		const h = sceneHarness({ images: IMGS });
		cleanup = h.cleanup;
		const el = document.createElement("span");
		el.textContent = "custom";
		const g = Grid(h.ctx, { items: ["p0", 1, el], columns: 2, at: 0 });
		expect(g.el.querySelectorAll(".kit-cell")).toHaveLength(3);
		expect(g.el.querySelectorAll("img")).toHaveLength(2);
		expect(g.el.textContent).toContain("custom");
	});

	it.each(["cascade", "pop", "rise"] as const)("%s is deterministic", (enter) => {
		const h = sceneHarness({ images: IMGS });
		cleanup = h.cleanup;
		Grid(h.ctx, { items: [0, 1, 2, 3, 4, 5], columns: 3, enter, at: 0.3 });
		expectDeterministic(h.tl, h.stage, [0, 0.5, 1.1, 3], expect);
	});
});

describe("Carousel", () => {
	it("emits one swipe per step and is deterministic", () => {
		const h = sceneHarness({ images: IMGS, seconds: 6 });
		cleanup = h.cleanup;
		Carousel(h.ctx, { items: [0, 1, 2, 3], every: 2, at: 0.5, style: "coverflow" });
		expect(h.events().filter((e) => e.kind === "swipe")).toHaveLength(3);
		expectDeterministic(h.tl, h.stage, [0, 1.2, 2.6, 4.1, 5.9], expect);
	});
});

describe("Stack", () => {
	it("drops each card and is deterministic", () => {
		const h = sceneHarness({ images: IMGS });
		cleanup = h.cleanup;
		const s = Stack(h.ctx, { items: [0, 1, 2], at: 0.2 });
		expect(s.el.querySelectorAll(".kit-stack-card")).toHaveLength(3);
		expect(h.events().filter((e) => e.kind === "land")).toHaveLength(3);
		expectDeterministic(h.tl, h.stage, [0, 0.4, 1, 3], expect);
	});
});
