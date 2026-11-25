// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { Glow, GradientMesh } from "./light";
import { expectDeterministic, sceneHarness } from "./test-helpers";

let cleanup = () => {};
afterEach(() => cleanup());

describe("Glow", () => {
	it("is deterministic with pulse, and uses the kit accent by default", () => {
		const h = sceneHarness();
		cleanup = h.cleanup;
		const g = Glow(h.ctx, { x: 50, y: 50, size: 60, pulse: true, at: 0 });
		expect(g.el.style.background).toContain("241, 132, 77");
		expectDeterministic(h.tl, h.stage, [0, 0.7, 1.9, 3.3], expect);
	});
});

describe("GradientMesh", () => {
	it("uses the kit colours and drifts deterministically", () => {
		const h = sceneHarness();
		cleanup = h.cleanup;
		const m = GradientMesh(h.ctx, { drift: true });
		expect(m.el.style.background).toContain("58, 109, 240");
		expectDeterministic(h.tl, h.stage, [0, 1, 3], expect);
	});
});
